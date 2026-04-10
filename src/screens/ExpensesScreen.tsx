import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast, useToast } from '../components/ui/Toast';
import { MonthBar } from '../components/MonthBar';
import { CAT_KEYS, CAT_COLORS, MONTHS, EXPENSE_PRESETS } from '../constants/data';
import { pkr, pkrF } from '../utils/currency';
import { todayStr, parseDMY, dateToDMY } from '../utils/dates';
import { buildShareText, doShare } from '../utils/share';
import { Transaction } from '../types';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import * as ImagePicker from 'expo-image-picker';
import { checkBudgetAlert } from '../utils/budgetAlerts';

export default function ExpensesScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { history, setHistory, budget, setBudget } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  // Filter state
  const [filter, setFilter] = useState('all');
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());

  // Topup form
  const [topupNote, setTopupNote] = useState('');
  const [topupAmt, setTopupAmt] = useState('');

  // Expense form
  const [expItem, setExpItem] = useState('');
  const [expAmt, setExpAmt] = useState('');
  const [expCat, setExpCat] = useState(CAT_KEYS[0]);
  const [expDate, setExpDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAmt, setEditAmt] = useState('');
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editCat, setEditCat] = useState('');

  // Form mode toggle
  const [formMode, setFormMode] = useState<'expense' | 'topup'>('expense');

  // Receipt photo
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');

  // Budget input
  const [budgetInput, setBudgetInput] = useState(budget > 0 ? String(budget) : '');

  const keyExtractor = useCallback((item: Transaction) => String(item.id), []);

  // Computed values
  const td = todayStr();

  const totalRec = useMemo(
    () => history.filter(h => h.type === 'topup').reduce((s, h) => s + h.amount, 0),
    [history],
  );
  const totalSpent = useMemo(
    () => history.filter(h => h.type === 'expense').reduce((s, h) => s + h.amount, 0),
    [history],
  );
  const todaySpent = useMemo(
    () => history.filter(h => h.type === 'expense' && h.date === td).reduce((s, h) => s + h.amount, 0),
    [history, td],
  );
  const bal = totalRec - totalSpent;
  const pct = totalRec > 0 ? Math.min((totalSpent / totalRec) * 100, 100) : 0;
  const fillColor = pct > 90 ? colors.red : pct > 70 ? colors.gold : colors.green;

  // Monthly budget
  const monthSpent = useMemo(() => {
    const nowMonth = new Date().getMonth();
    const nowYear = new Date().getFullYear();
    return history
      .filter(h => {
        if (h.type !== 'expense') return false;
        const p = parseDMY(h.date);
        return p && p.m === nowMonth && p.y === nowYear;
      })
      .reduce((s, h) => s + h.amount, 0);
  }, [history]);
  const budgetPct = budget > 0 ? Math.min(Math.round((monthSpent / budget) * 100), 100) : 0;
  const budgetColor = budgetPct > 90 ? colors.red : budgetPct > 70 ? colors.gold : colors.green;

  // Filtered list
  const filtered = useMemo(() => {
    let list =
      filter === 'all'
        ? history
        : filter === 'today'
          ? history.filter(h => h.date === td)
          : history.filter(h => {
              const p = parseDMY(h.date);
              return p && p.m === selMonth && p.y === selYear;
            });
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        h => h.label.toLowerCase().includes(q) || (h.cat || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [history, filter, td, selMonth, selYear, search]);

  // Monthly summary data
  const monthlySummary = useMemo(() => {
    const exps = filtered.filter(h => h.type === 'expense');
    const tops = filtered.filter(h => h.type === 'topup');
    const periodExp = exps.reduce((s, h) => s + h.amount, 0);
    const periodRec = tops.reduce((s, h) => s + h.amount, 0);
    const net = periodRec - periodExp;

    const catMap: Record<string, number> = {};
    exps.forEach(h => {
      catMap[h.cat] = (catMap[h.cat] || 0) + h.amount;
    });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const maxC = cats.length ? cats[0][1] : 1;

    return { periodExp, periodRec, net, cats, maxC, expCount: exps.length };
  }, [filtered]);

  // Actions
  const addTopup = useCallback(() => {
    const amt = parseFloat(topupAmt);
    if (!amt || amt <= 0) return;
    const entry: Transaction = {
      id: Date.now(),
      type: 'topup',
      label: topupNote || 'Received from husband',
      amount: amt,
      cat: '',
      date: td,
    };
    setHistory(h => [entry, ...h]);
    setTopupNote('');
    setTopupAmt('');
    showToast('💵 ' + pkrF(amt) + ' received added');
  }, [topupNote, topupAmt, td, setHistory, showToast]);

  const addExpense = useCallback(() => {
    const amt = parseFloat(expAmt);
    if (!expItem.trim() || isNaN(amt) || amt <= 0) return;
    const dateStr = dateToDMY(expDate);
    const entry: Transaction = {
      id: Date.now(),
      type: 'expense',
      label: expItem.trim(),
      amount: amt,
      cat: expCat,
      date: dateStr,
      receipt: receiptUri || undefined,
    };
    setHistory(h => [entry, ...h]);
    // Check budget alert
    if (budget > 0) {
      const newMonthSpent = monthSpent + amt;
      checkBudgetAlert(newMonthSpent, budget);
    }
    showToast('🛒 ' + expItem + ' logged');
    setExpItem('');
    setExpAmt('');
    setReceiptUri(null);
  }, [expItem, expAmt, expDate, expCat, receiptUri, setHistory, showToast, budget, monthSpent]);

  const deleteEntry = useCallback(
    (id: number) => {
      const entry = history.find(h => h.id === id);
      setHistory(h => h.filter(x => x.id !== id));
      setEditId(null);
      showToast('Entry deleted', () => {
        if (entry) setHistory(h => [entry, ...h].sort((a, b) => b.id - a.id));
      });
    },
    [history, setHistory, showToast],
  );

  const startEdit = useCallback((h: Transaction) => {
    setEditId(h.id);
    setEditLabel(h.label);
    setEditAmt(String(h.amount));
    // Parse DD/MM/YYYY to Date
    const parts = h.date.split('/');
    if (parts.length === 3) {
      setEditDate(new Date(+parts[2], +parts[1] - 1, +parts[0]));
    } else {
      setEditDate(new Date());
    }
    setEditCat(h.cat || '');
  }, []);

  const saveEdit = useCallback(
    (id: number) => {
      const parsedAmt = parseFloat(editAmt);
      if (isNaN(parsedAmt) || parsedAmt <= 0) {
        Alert.alert('Invalid Amount', 'Please enter an amount greater than 0.');
        return;
      }
      if (!editLabel.trim()) {
        Alert.alert('Missing Label', 'Please enter a label.');
        return;
      }
      setHistory(h =>
        h.map(x => {
          if (x.id !== id) return x;
          const dateStr = dateToDMY(editDate);
          return {
            ...x,
            label: editLabel.trim(),
            amount: parsedAmt,
            date: dateStr,
            cat: x.type === 'expense' ? editCat : x.cat,
          };
        }),
      );
      setEditId(null);
      showToast('✅ Entry updated');
    },
    [editLabel, editAmt, editDate, editCat, setHistory, showToast],
  );

  const handleShare = useCallback(async () => {
    const text = buildShareText(history, filter, selMonth, selYear, budget);
    await doShare(text, 'share');
  }, [history, filter, selMonth, selYear, budget]);

  const handleExpDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setExpDate(date);
  }, []);

  const handleEditDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    setShowEditDatePicker(Platform.OS === 'ios');
    if (date) setEditDate(date);
  }, []);

  const pickReceipt = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }, []);

  const sectionTitle =
    filter === 'all'
      ? 'All Transactions'
      : filter === 'today'
        ? "Today's Transactions"
        : `${MONTHS[selMonth]} ${selYear}`;

  // Render transaction item — no edit state dependencies
  const renderItem = useCallback(({ item: h }: { item: Transaction }) => {
    const isTopup = h.type === 'topup';
    const icon = isTopup ? '💵' : (h.cat?.split(' ')[0] || '🛒');

    return (
      <Card>
        {/* Main row */}
        <View style={styles.txMain}>
          <View
            style={[
              styles.txIcon,
              {
                backgroundColor: isTopup ? colors.greenBg : colors.redBg,
                borderColor: isTopup ? colors.greenBorder : colors.redBorder,
              },
            ]}
          >
            <Text style={styles.txIconText}>{icon}</Text>
          </View>
          <View style={styles.txInfo}>
            <Text style={[styles.txName, { color: colors.deep }]} numberOfLines={1}>
              {h.label}
            </Text>
            <View style={styles.txMeta}>
              <Badge
                text={isTopup ? 'Received' : h.cat}
                bg={isTopup ? colors.greenBg : colors.redBg}
                color={isTopup ? colors.green : colors.red}
                borderColor={isTopup ? colors.greenBorder : colors.redBorder}
              />
              <Text style={[styles.txDate, { color: colors.muted }]}>{h.date}</Text>
            </View>
          </View>
          <Text style={[styles.txAmt, { color: isTopup ? colors.green : colors.red }]}>
            {isTopup ? '+' : '-'}
            {pkrF(h.amount)}
          </Text>
        </View>

        {/* Receipt thumbnail */}
        {h.receipt && (
          <Image
            source={{ uri: h.receipt }}
            style={styles.receiptThumb}
          />
        )}

        {/* Action buttons */}
        <View style={[styles.txActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.txActionBtn, { backgroundColor: colors.blueBg, borderColor: colors.blueBorder }]}
            onPress={() => startEdit(h)}
          >
            <Text style={[styles.txActionText, { color: colors.blue }]}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.txActionBtn, { backgroundColor: colors.redBg, borderColor: colors.redBorder }]}
            onPress={() => deleteEntry(h.id)}
          >
            <Text style={[styles.txActionText, { color: colors.red }]}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }, [colors, startEdit, deleteEntry]);

  // Find the transaction being edited (for the modal)
  const editingTransaction = editId !== null ? history.find(h => h.id === editId) : null;

  // Header component for FlatList
  const listHeader = useMemo(() => (
    <View>
      {/* Balance Hero */}
      <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero} style={{ backgroundColor: colors.goldBg, borderColor: colors.goldBorder }}>
        <Text style={[styles.balLabel, { color: colors.gold }]}>💼 Remaining Balance</Text>
        <Text style={[styles.balNum, { color: bal < 0 ? colors.red : colors.green }]}>
          {pkrF(Math.abs(bal))}
        </Text>
        <Text style={[styles.balNote, { color: colors.sub }]}>
          {bal < 0
            ? '⚠️ Overspent! Add more funds'
            : bal === 0
              ? 'Balance is zero'
              : '✨ Available to spend'}
        </Text>
        <View style={styles.balBarWrap}>
          <ProgressBar percent={pct} fillColor={fillColor} bgColor={colors.border} height={8} />
        </View>

        {/* 3 stat boxes */}
        <View style={styles.balStats}>
          <View style={styles.balStatBox}>
            <Text style={[styles.balStatVal, { color: colors.green }]}>{pkr(totalRec)}</Text>
            <Text style={[styles.balStatLbl, { color: colors.muted }]}>Received</Text>
          </View>
          <View style={styles.balStatBox}>
            <Text style={[styles.balStatVal, { color: colors.red }]}>{pkr(totalSpent)}</Text>
            <Text style={[styles.balStatLbl, { color: colors.muted }]}>Spent</Text>
          </View>
          <View style={styles.balStatBox}>
            <Text style={[styles.balStatVal, { color: colors.gold }]}>{pkr(todaySpent)}</Text>
            <Text style={[styles.balStatLbl, { color: colors.muted }]}>Today</Text>
          </View>
        </View>

        {/* Budget bar inside hero */}
        {budget > 0 && (
          <View style={[styles.budgetWrap, { borderTopColor: colors.border }]}>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: colors.sub }]}>This Month's Budget</Text>
              <Text style={[styles.budgetVal, { color: colors.gold }]}>
                {pkrF(monthSpent)} / {pkrF(budget)}
              </Text>
            </View>
            <ProgressBar percent={budgetPct} fillColor={budgetColor} bgColor={colors.border} height={6} />
            <Text style={[styles.budgetNote, { color: colors.muted }]}>
              {budgetPct}% used{budgetPct >= 100 ? ' — Budget exceeded!' : ''}
            </Text>
          </View>
        )}
      </Card>

      {/* Share button */}
      <Button
        title="📤 Share Stats with Husband"
        variant="gold"
        full
        onPress={handleShare}
        style={styles.shareBtn}
      />

      {/* Monthly Budget Setting */}
      <Card>
        <View style={styles.budgetHeader}>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🎯 Monthly Budget</Text>
          <Text style={[styles.budgetStatus, { color: colors.muted }]}>
            {budget > 0 ? pkrF(budget) + ' set' : 'Not set'}
          </Text>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Set budget in PKR"
              keyboardType="numeric"
              value={budgetInput}
              onChangeText={setBudgetInput}
            />
          </View>
          <Button
            title="Set"
            variant="blue"
            small
            onPress={() => {
              const v = parseFloat(budgetInput);
              if (v > 0) {
                setBudget(v);
                showToast('🎯 Budget set to ' + pkrF(v));
              }
            }}
          />
          <Button
            title="Clear"
            variant="outline"
            small
            onPress={() => {
              setBudget(0);
              setBudgetInput('');
              showToast('Budget cleared');
            }}
          />
        </View>
      </Card>

      {/* Monthly Summary */}
      {filter === 'month' && (
        <Card style={{ backgroundColor: colors.purpleBg, borderColor: colors.purpleBorder }}>
          <Text style={[styles.summaryTitle, { color: colors.deep }]}>
            📊 {MONTHS[selMonth]} {selYear}
          </Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryBox, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
              <Text style={[styles.summaryVal, { color: colors.green }]}>{pkrF(monthlySummary.periodRec)}</Text>
              <Text style={[styles.summaryLbl, { color: colors.muted }]}>Received</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
              <Text style={[styles.summaryVal, { color: colors.red }]}>{pkrF(monthlySummary.periodExp)}</Text>
              <Text style={[styles.summaryLbl, { color: colors.muted }]}>Spent</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
              <Text
                style={[
                  styles.summaryVal,
                  { color: monthlySummary.net >= 0 ? colors.green : colors.red },
                ]}
              >
                {pkrF(Math.abs(monthlySummary.net))}
              </Text>
              <Text style={[styles.summaryLbl, { color: colors.muted }]}>
                {monthlySummary.net >= 0 ? 'Saved' : 'Deficit'}
              </Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
              <Text style={[styles.summaryVal, { color: colors.gold }]}>{monthlySummary.expCount}</Text>
              <Text style={[styles.summaryLbl, { color: colors.muted }]}>Expenses</Text>
            </View>
          </View>

          {/* Category breakdown bars */}
          {monthlySummary.cats.length > 0 && (
            <View style={styles.catBars}>
              {monthlySummary.cats.map((c, i) => {
                const catColor = CAT_COLORS[CAT_KEYS.indexOf(c[0]) % CAT_COLORS.length];
                const barPct = Math.round((c[1] / monthlySummary.maxC) * 100);
                return (
                  <View key={i} style={styles.catBarRow}>
                    <Text style={[styles.catBarName, { color: colors.sub }]} numberOfLines={1}>
                      {c[0]}
                    </Text>
                    <View style={[styles.catBarBg, { backgroundColor: colors.border }]}>
                      <View
                        style={[styles.catBarFill, { width: `${barPct}%` as any, backgroundColor: catColor }]}
                      />
                    </View>
                    <Text style={[styles.catBarAmt, { color: colors.deep }]}>{pkr(c[1])}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      )}

      {/* Quick Presets */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.deep }]}>⚡ Quick Add</Text>
        <View style={styles.presetsGrid}>
          {EXPENSE_PRESETS.slice(0, 8).map(p => (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, { backgroundColor: colors.surfaceMuted }]}
              activeOpacity={0.7}
              onPress={() => {
                setFormMode('expense');
                setExpItem(p.label);
                setExpCat(p.cat);
                if (p.amount > 0) setExpAmt(String(p.amount));
              }}
            >
              <Text style={[styles.presetText, { color: colors.sub }]}>{p.label}</Text>
              {p.amount > 0 && <Text style={[styles.presetAmt, { color: colors.muted }]}>Rs {p.amount}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Unified Add Form */}
      <Card>
        <View style={styles.formToggle}>
          <TouchableOpacity
            style={[
              styles.formToggleBtn,
              { backgroundColor: formMode === 'topup' ? 'rgba(200,134,10,0.12)' : colors.bg3 },
            ]}
            onPress={() => setFormMode('topup')}
          >
            <Text style={[styles.formToggleText, { color: formMode === 'topup' ? colors.gold : colors.muted }]}>
              💰 Received
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.formToggleBtn,
              { backgroundColor: formMode === 'expense' ? 'rgba(200,134,10,0.12)' : colors.bg3 },
            ]}
            onPress={() => setFormMode('expense')}
          >
            <Text style={[styles.formToggleText, { color: formMode === 'expense' ? colors.gold : colors.muted }]}>
              🛒 Expense
            </Text>
          </TouchableOpacity>
        </View>

        {formMode === 'topup' ? (
          <>
            <Input
              placeholder="e.g. Weekly kharch…"
              value={topupNote}
              onChangeText={setTopupNote}
              style={styles.formInput}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Amount in PKR"
                  keyboardType="numeric"
                  value={topupAmt}
                  onChangeText={setTopupAmt}
                />
              </View>
              <Button title="Add" variant="green" onPress={addTopup} />
            </View>
          </>
        ) : (
          <>
            <Input
              placeholder="What did you buy?"
              value={expItem}
              onChangeText={setExpItem}
              style={styles.formInput}
            />
            <View style={[styles.row, styles.formInput]}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Amount in PKR"
                  keyboardType="numeric"
                  value={expAmt}
                  onChangeText={setExpAmt}
                />
              </View>
              <TouchableOpacity
                style={[styles.dateBtn, { backgroundColor: colors.bg3, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateBtnText, { color: colors.text }]}>{dateToDMY(expDate)}</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={expDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleExpDateChange}
              />
            )}
            <View style={styles.row}>
              <View style={[styles.pickerWrap, { flex: 1, backgroundColor: colors.bg3, borderColor: colors.border }]}>
                <Picker
                  selectedValue={expCat}
                  onValueChange={setExpCat}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.sub}
                >
                  {CAT_KEYS.map(c => (
                    <Picker.Item key={c} value={c} label={c} style={{ fontSize: 13 }} />
                  ))}
                </Picker>
              </View>
              <Button title="+ Add" variant="gold" onPress={addExpense} />
            </View>
            <View style={styles.receiptRow}>
              <Button title={receiptUri ? "📷 Change" : "📷 Receipt"} variant="outline" small onPress={pickReceipt} />
              {receiptUri && <Text style={[styles.receiptLabel, { color: colors.green }]}>✓ Photo attached</Text>}
            </View>
          </>
        )}
      </Card>

      {/* Transactions header */}
      <View style={styles.secHeader}>
        <Text style={[styles.secTitle, { color: colors.deep }]}>{sectionTitle}</Text>
        <Badge
          text={`${filtered.length} items`}
          bg={colors.goldBg}
          color={colors.gold}
          borderColor={colors.goldBorder}
        />
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Input
          placeholder="Search transactions…"
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { borderWidth: 0, backgroundColor: 'transparent' }]}
        />
      </View>

      {filtered.length === 0 && (
        <EmptyState icon="📋" text="No transactions found." />
      )}
    </View>
  ), [
    colors, bal, pct, fillColor, totalRec, totalSpent, todaySpent,
    budget, monthSpent, budgetPct, budgetColor, handleShare,
    budgetInput, setBudgetInput, setBudget, showToast,
    filter, selMonth, selYear, monthlySummary,
    formMode, topupNote, topupAmt, addTopup,
    expItem, expAmt, expDate, showDatePicker, handleExpDateChange,
    expCat, addExpense, receiptUri, pickReceipt,
    sectionTitle, filtered, search,
  ]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <DrawerMenuButton />
        <Text style={[styles.screenTitle, { color: colors.deep }]}>Expenses</Text>
        <View style={{ width: 44 }} />
      </View>
      {/* MonthBar filter */}
      <MonthBar
        filter={filter}
        setFilter={setFilter}
        selMonth={selMonth}
        selYear={selYear}
        setSelMonth={setSelMonth}
        setSelYear={setSelYear}
        history={history}
      />

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
        removeClippedSubviews
      />

      {/* Edit Modal — rendered outside FlatList to avoid re-render on keystroke */}
      <Modal
        visible={editId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditId(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditId(null)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: colors.deep }]}>
                Edit {editingTransaction?.type === 'topup' ? 'Received' : 'Expense'}
              </Text>
              <Input
                value={editLabel}
                onChangeText={setEditLabel}
                placeholder="Label"
                style={styles.editInput}
              />
              <View style={styles.editRow}>
                <Input
                  value={editAmt}
                  onChangeText={setEditAmt}
                  placeholder="PKR"
                  keyboardType="numeric"
                  style={[styles.editInput, { flex: 1 }]}
                />
                <TouchableOpacity
                  style={[styles.dateBtn, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                  onPress={() => setShowEditDatePicker(true)}
                >
                  <Text style={[styles.dateBtnText, { color: colors.text }]}>
                    {dateToDMY(editDate)}
                  </Text>
                </TouchableOpacity>
              </View>
              {showEditDatePicker && (
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEditDateChange}
                />
              )}
              {editingTransaction?.type === 'expense' && (
                <View style={[styles.pickerWrap, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={editCat}
                    onValueChange={setEditCat}
                    style={{ color: colors.text }}
                    dropdownIconColor={colors.sub}
                  >
                    {CAT_KEYS.map(c => (
                      <Picker.Item key={c} value={c} label={c} style={{ fontSize: 13 }} />
                    ))}
                  </Picker>
                </View>
              )}
              <View style={styles.editBtns}>
                <Button title="✓ Save" variant="green" small onPress={() => editId !== null && saveEdit(editId)} />
                <Button title="Cancel" variant="outline" small onPress={() => setEditId(null)} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  screenTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28 },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  // Balance hero
  balLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  balNum: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  balNote: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    marginTop: 6,
  },
  balBarWrap: {
    marginTop: 14,
    marginBottom: 16,
  },
  balStats: {
    flexDirection: 'row',
    gap: 12,
  },
  balStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  balStatVal: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  balStatLbl: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  // Budget inside hero
  budgetWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  budgetVal: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
  budgetNote: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    marginTop: 4,
  },
  // Share
  shareBtn: {
    marginBottom: 16,
  },
  // Budget setting
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetStatus: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
  },
  // Monthly summary
  summaryTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryBox: {
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: 16,
    borderWidth: 0,
    padding: 14,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  summaryLbl: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  catBars: {
    marginTop: 14,
  },
  catBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  catBarName: {
    width: 80,
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
  },
  catBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  catBarFill: {
    height: 10,
    borderRadius: 5,
  },
  catBarAmt: {
    width: 60,
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'right',
  },
  // Presets
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  presetText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  presetAmt: { fontSize: 11, fontFamily: 'Outfit-Regular', marginTop: 1 },
  // Form toggle
  formToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  formToggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  formToggleText: { fontFamily: 'Outfit-Bold', fontSize: 14 },
  // Receipt
  receiptThumb: { width: 48, height: 48, borderRadius: 8, marginTop: 8 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  receiptLabel: { fontSize: 13, fontFamily: 'Outfit-Regular' },
  // Forms
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  formInput: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBtn: {
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  dateBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  pickerWrap: {
    borderWidth: 0,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 54,
    justifyContent: 'center',
  },
  // Section header
  secHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  secTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
  },
  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 16,
    paddingLeft: 16,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
  },
  // Transactions
  txMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconText: {
    fontSize: 22,
  },
  txInfo: {
    flex: 1,
    minWidth: 0,
  },
  txName: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 2,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  txDate: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
  },
  txAmt: {
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
  },
  txActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  txActionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 0,
    paddingVertical: 10,
    alignItems: 'center',
  },
  txActionText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  // Edit modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginBottom: 16,
  },
  editInput: {
    marginBottom: 8,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  editBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});
