import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  LayoutAnimation,
  UIManager,
  TextInput,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { CAT_KEYS, MONTHS } from '../constants/data';
import { useCurrency } from '../context/CurrencyContext';
import { todayStr, parseDMY, dateToDMY } from '../utils/dates';
import { buildShareText, doShare } from '../utils/share';
import { Transaction } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { checkBudgetAlert } from '../utils/budgetAlerts';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { SkeletonCardRow } from '../components/ui/Skeleton';
import {
  hennaColors,
  hennaFonts,
  hennaGradients,
  hennaRadii,
  hennaShadows,
  hennaTextStyles,
  hennaType,
} from '../constants/hennaTokens';
import {
  HennaHeader,
  HennaButton,
  HennaCard,
  HennaIcon,
  HennaInput,
  HennaPill,
  HennaProgress,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';
import type { HennaIconName } from '../components/henna';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Pakistani preset chip rail — mapped to Henna icons.
const PRESETS: { label: string; icon: HennaIconName; cat: string; amount: number }[] = [
  { label: 'Vegetables',  icon: 'veg',         cat: '🍔 Food',      amount: 200 },
  { label: 'Bread',       icon: 'bread',       cat: '🍔 Food',      amount: 100 },
  { label: 'Milk',        icon: 'milk',        cat: '🍔 Food',      amount: 200 },
  { label: 'Fruits',      icon: 'fruit',       cat: '🍔 Food',      amount: 500 },
  { label: 'Grocery',     icon: 'cart',        cat: '🛒 Shopping',  amount: 2000 },
  { label: 'Petrol',      icon: 'fuel',        cat: '🚗 Transport', amount: 1500 },
  { label: 'Rickshaw',    icon: 'car',         cat: '🚗 Transport', amount: 250 },
  { label: 'Medicine',    icon: 'pill',        cat: '💊 Health',    amount: 500 },
  { label: 'Electricity', icon: 'electricity', cat: '💡 Bills',     amount: 3000 },
  { label: 'Gas',         icon: 'flame',       cat: '💡 Bills',     amount: 1500 },
  { label: 'Water',       icon: 'water',       cat: '💡 Bills',     amount: 500 },
  { label: 'School',      icon: 'book',        cat: '📚 Education', amount: 5000 },
];

const CAT_ICON_MAP: Record<string, HennaIconName> = {
  '🍔 Food': 'pot',
  '🚗 Transport': 'car',
  '💊 Health': 'pill',
  '🛒 Shopping': 'cart',
  '💡 Bills': 'electricity',
  '📚 Education': 'book',
  '🎁 Other': 'sparkle',
};

function iconForCat(cat: string): HennaIconName {
  return CAT_ICON_MAP[cat] ?? 'cart';
}

// Split a formatted balance so the last 3 chars get the Cormorant flourish.
function splitFlourish(formatted: string): { head: string; tail: string } {
  if (formatted.length <= 3) return { head: '', tail: formatted };
  return { head: formatted.slice(0, -3), tail: formatted.slice(-3) };
}

type FilterKey = 'all' | 'today' | 'month';

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { history, setHistory, budget, setBudget, allLoaded } = useData();
  const { pkr, pkrF, currencyCode, currency } = useCurrency();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [filter, setFilter] = useState<FilterKey>('all');
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

  const [formMode, setFormMode] = useState<'expense' | 'topup'>('expense');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const editLabelRef = useRef<TextInput | null>(null);
  const editAmtRef = useRef<TextInput | null>(null);

  // Search
  const [search, setSearch] = useState('');

  // Budget inline editor
  const [budgetInput, setBudgetInput] = useState(budget > 0 ? String(budget) : '');
  const [budgetEditing, setBudgetEditing] = useState(false);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const toggleBudgetEditing = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.selectionAsync();
    setBudgetInput(budget > 0 ? String(budget) : '');
    setBudgetEditing(e => !e);
  }, [budget]);

  const toggleAddForm = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.selectionAsync();
    setAddFormOpen(o => !o);
  }, []);

  const toggleSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.selectionAsync();
    setSearchOpen(o => {
      if (o) setSearch('');
      return !o;
    });
  }, []);

  const applyPreset = useCallback(
    (p: { label: string; cat: string; amount: number }) => {
      Haptics.selectionAsync();
      setFormMode('expense');
      setExpItem(p.label);
      setExpCat(p.cat);
      if (p.amount > 0) setExpAmt(String(p.amount));
      if (!addFormOpen) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAddFormOpen(true);
      }
    },
    [addFormOpen],
  );

  const keyExtractor = useCallback((item: Transaction) => String(item.id), []);
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

  // Smart Quick Add — only after 100+ expenses logged
  const SMART_THRESHOLD = 100;
  const smartQuickAdd = useMemo<{ label: string; icon: HennaIconName; cat: string; amount: number }[]>(() => {
    const expenses = history.filter(h => h.type === 'expense' && h.label);
    if (expenses.length < SMART_THRESHOLD) return [];

    const byLabel: Record<string, { label: string; cats: Record<string, number>; amounts: number[]; count: number }> = {};
    for (const e of expenses) {
      const key = e.label.trim().toLowerCase();
      if (!key) continue;
      if (!byLabel[key]) {
        byLabel[key] = { label: e.label.trim(), cats: {}, amounts: [], count: 0 };
      }
      byLabel[key].count += 1;
      byLabel[key].amounts.push(e.amount);
      byLabel[key].cats[e.cat] = (byLabel[key].cats[e.cat] || 0) + 1;
    }

    return Object.values(byLabel)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(g => {
        const cat = Object.entries(g.cats).sort((a, b) => b[1] - a[1])[0][0];
        const sorted = [...g.amounts].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        return {
          label: g.label,
          icon: iconForCat(cat),
          cat,
          amount: Math.round(median),
        };
      });
  }, [history]);

  // Group filtered transactions by date for the design's date-section pattern
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach(t => {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    });
    // Sort dates descending
    return Array.from(map.entries()).sort((a, b) => {
      const pa = parseDMY(a[0]);
      const pb = parseDMY(b[0]);
      if (!pa || !pb) return 0;
      return new Date(pb.y, pb.m, pb.d).getTime() - new Date(pa.y, pa.m, pa.d).getTime();
    });
  }, [filtered]);

  // Date display: "Today", "Yesterday", or "Wed 24 May"
  const dateLabel = useCallback((date: string) => {
    const p = parseDMY(date);
    if (!p) return date;
    const td2 = todayStr();
    if (date === td2) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date === dateToDMY(yesterday)) return 'Yesterday';
    const d = new Date(p.y, p.m, p.d);
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    return `${weekday} ${p.d} ${MONTHS[p.m].slice(0, 3)}`;
  }, []);

  // Actions
  const addTopup = useCallback(() => {
    const amt = parseFloat(topupAmt);
    if (isNaN(amt) || amt <= 0) return;
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
    showToast(pkrF(amt) + ' received added');
  }, [topupNote, topupAmt, td, setHistory, showToast, pkrF]);

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
    if (budget > 0) {
      const newMonthSpent = monthSpent + amt;
      checkBudgetAlert(newMonthSpent, budget);
    }
    showToast(expItem + ' logged');
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
      showToast('Entry updated');
    },
    [editLabel, editAmt, editDate, editCat, setHistory, showToast],
  );

  const handleShare = useCallback(async () => {
    const text = buildShareText(history, filter, selMonth, selYear, budget, currency);
    await doShare(text, 'share');
  }, [history, filter, selMonth, selYear, budget, currency]);

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

  const handleSetBudget = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const trimmed = budgetInput.trim();
    if (trimmed === '') {
      setBudget(0);
      setBudgetEditing(false);
      showToast('Budget cleared');
      return;
    }
    const v = parseFloat(trimmed);
    if (!isNaN(v) && v > 0) {
      setBudget(v);
      setBudgetEditing(false);
      showToast('Budget set to ' + pkrF(v));
    }
  }, [budgetInput, setBudget, showToast, pkrF]);

  const handleCancelBudget = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBudgetEditing(false);
  }, []);

  const openDatePicker = useCallback(() => setShowDatePicker(true), []);
  const openEditDatePicker = useCallback(() => setShowEditDatePicker(true), []);
  const closeEditModal = useCallback(() => setEditId(null), []);

  const handleSaveEdit = useCallback(() => {
    if (editId !== null) saveEdit(editId);
  }, [editId, saveEdit]);

  const sectionTitle =
    filter === 'all'
      ? 'History'
      : filter === 'today'
        ? "Today's"
        : `${MONTHS[selMonth]} ${selYear}`;

  // Hero subtitle: "May 2026 · track every rupee"
  const heroSubtitle = useMemo(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()} · track every rupee`;
  }, []);

  const editingTransaction = editId !== null ? history.find(h => h.id === editId) : null;
  const balanceSplit = splitFlourish(allLoaded ? pkrF(bal) : '—');

  // Group rendering item — the design uses date-grouped lists; render as section view.
  // We swap FlatList for a ScrollView since the visual now groups by date and keeps
  // SwipeableRow / receipt thumbs / undo intact. Performance still bounded by
  // `removeClippedSubviews` on ScrollView and the < few hundred rows the app sees.
  const renderTxnRow = useCallback((t: Transaction, isLast: boolean) => {
    const isTopup = t.type === 'topup';
    const icon: HennaIconName = isTopup ? 'wallet' : iconForCat(t.cat);
    const tintBg = isTopup ? hennaColors.sageBg : hennaColors.hennaBg;
    const tintFg = isTopup ? hennaColors.sage : hennaColors.henna;
    const sign = isTopup ? '+ ' : '− ';
    const amtColor = isTopup ? hennaColors.sage : hennaColors.ink;

    return (
      <SwipeableRow
        key={t.id}
        itemLabel={t.label}
        actions={[
          { kind: 'edit', onPress: () => startEdit(t) },
          { kind: 'delete', onPress: () => deleteEntry(t.id) },
        ]}
      >
        <View
          style={[
            styles.txRow,
            !isLast && { borderBottomWidth: 1, borderBottomColor: hennaColors.line },
          ]}
        >
          <View style={[styles.txIcon, { backgroundColor: tintBg }]}>
            <HennaIcon name={icon} size={16} color={tintFg} />
          </View>
          <View style={styles.txInfo}>
            <Text style={styles.txLabel} numberOfLines={1}>{t.label}</Text>
            <Text style={styles.txCat} numberOfLines={1}>
              {isTopup ? 'Received' : (t.cat || 'Other')}
            </Text>
            {t.receipt ? (
              <Image source={{ uri: t.receipt }} style={styles.txReceipt} />
            ) : null}
          </View>
          <Text style={[styles.txAmt, { color: amtColor }]}>
            {sign}{pkrF(t.amount)}
          </Text>
        </View>
      </SwipeableRow>
    );
  }, [startEdit, deleteEntry, pkrF]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <FlatList
        data={[0]}
        keyExtractor={() => 'expenses-scroll'}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={() => (
          <View>
            <HennaHeader
              title="Expenses"
              subtitle={heroSubtitle}
              onMenu={onMenu}
              action={
                <View style={styles.headerActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={searchOpen ? 'Hide search' : 'Show search'}
                    onPress={toggleSearch}
                    hitSlop={8}
                    style={styles.headerIconBtn}
                  >
                    <HennaIcon name="search" size={18} color={hennaColors.ink2} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Share"
                    onPress={handleShare}
                    hitSlop={8}
                    style={styles.headerIconBtn}
                  >
                    <HennaIcon name="share" size={18} color={hennaColors.ink2} />
                  </Pressable>
                </View>
              }
            />

            {/* Hero */}
            <View style={styles.heroWrap}>
              <View style={styles.heroCard}>
                <LinearGradient
                  colors={hennaGradients.heroHenna}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <MeshOverlay />
                <View style={styles.heroCorner} pointerEvents="none">
                  <ArabesqueCorner size={110} color={hennaColors.henna} opacity={0.14} />
                </View>

                <View style={styles.heroInner}>
                  <View style={styles.greetRow}>
                    <MarginMark color={hennaColors.henna} />
                    <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.henna }]}>Balance</Text>
                  </View>
                  <Text
                    style={[
                      styles.balanceText,
                      { color: bal < 0 ? hennaColors.henna : hennaColors.ink },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {balanceSplit.head}
                    <Text style={styles.balanceTail}>{balanceSplit.tail}</Text>
                  </Text>

                  <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                      <HennaIcon name="chev-down" size={11} color={hennaColors.sage} />
                      <Text style={[styles.heroStatText, { color: hennaColors.sage }]}>
                        {pkr(totalRec)}
                      </Text>
                    </View>
                    <View style={styles.heroStat}>
                      <HennaIcon name="chev-down" size={11} color={hennaColors.henna} />
                      <Text style={[styles.heroStatText, { color: hennaColors.henna }]}>
                        {pkr(totalSpent)}
                      </Text>
                    </View>
                    <View style={styles.heroStatRight}>
                      <Text style={[hennaTextStyles.caption, { color: hennaColors.muted }]}>Today</Text>
                      <Text style={styles.heroStatToday}>{pkr(todaySpent)}</Text>
                    </View>
                  </View>

                  {/* Budget block — inline editor */}
                  <View style={styles.budgetBox}>
                    {budgetEditing ? (
                      <View style={styles.budgetEditRow}>
                        <View style={{ flex: 1 }}>
                          <HennaInput
                            placeholder={`Monthly budget in ${currencyCode}`}
                            keyboardType="numeric"
                            value={budgetInput}
                            onChangeText={setBudgetInput}
                            autoFocus
                          />
                        </View>
                        <HennaButton title="Save" size="sm" variant="primary" onPress={handleSetBudget} />
                        <HennaButton title="Cancel" size="sm" variant="outline" onPress={handleCancelBudget} />
                      </View>
                    ) : budget > 0 ? (
                      <>
                        <View style={styles.budgetRow}>
                          <Text style={styles.budgetLabel}>Monthly budget</Text>
                          <Text style={styles.budgetVal}>
                            {pkr(monthSpent)} / {pkr(budget)}
                          </Text>
                          <Pressable
                            onPress={toggleBudgetEditing}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Edit monthly budget"
                            style={styles.budgetEditBtn}
                          >
                            <HennaIcon name="pencil" size={13} color={hennaColors.henna} />
                          </Pressable>
                        </View>
                        <HennaProgress value={monthSpent} max={budget} accent="henna" />
                        <Text style={styles.budgetRemain}>
                          {pkr(Math.max(0, budget - monthSpent))} remaining · {budgetPct}%
                        </Text>
                      </>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Set monthly budget"
                        onPress={toggleBudgetEditing}
                        style={styles.budgetSetRow}
                      >
                        <Text style={styles.budgetSetText}>Set monthly budget</Text>
                        <HennaIcon name="chev-right" size={13} color={hennaColors.henna} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Filter pills */}
            <View style={styles.filterRow}>
              <HennaPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
              <HennaPill label="Today" active={filter === 'today'} onPress={() => setFilter('today')} />
              <HennaPill label="Month" active={filter === 'month'} onPress={() => setFilter('month')} />
              {filter === 'month' ? (
                <Text style={styles.monthLabel}>
                  {MONTHS[selMonth]} {selYear}
                </Text>
              ) : null}
            </View>

            {/* Search */}
            {searchOpen ? (
              <View style={styles.searchWrap}>
                <HennaInput
                  icon="search"
                  placeholder="Search transactions"
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                />
              </View>
            ) : null}

            {/* Quick-add chip rail */}
            <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Quick Add</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetRail}
            >
              {(smartQuickAdd.length > 0 ? smartQuickAdd : PRESETS).map(p => (
                <Pressable
                  key={p.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Quick add ${p.label}`}
                  onPress={() => applyPreset(p)}
                  style={({ pressed }) => [styles.presetTile, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <HennaIcon name={p.icon} size={20} color={hennaColors.henna} />
                  <Text style={styles.presetText} numberOfLines={1}>{p.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Collapsed Add form */}
            <View style={styles.addFormWrap}>
              <Pressable
                onPress={toggleAddForm}
                accessibilityRole="button"
                accessibilityLabel={addFormOpen ? 'Collapse add form' : 'Expand add form'}
                accessibilityState={{ expanded: addFormOpen }}
                style={({ pressed }) => [styles.addFormHeader, { opacity: pressed ? 0.94 : 1 }]}
              >
                <Text style={styles.addFormTitle}>+ Add transaction</Text>
                <HennaIcon
                  name={addFormOpen ? 'chev-down' : 'chev-right'}
                  size={14}
                  color={hennaColors.muted}
                />
              </Pressable>
              {!addFormOpen ? (
                <Text style={styles.addFormSub}>Or use the floating + button</Text>
              ) : (
                <View style={styles.addFormBody}>
                  <View style={styles.formToggle}>
                    <Pressable
                      onPress={() => setFormMode('topup')}
                      style={[
                        styles.formToggleBtn,
                        formMode === 'topup' && { backgroundColor: hennaColors.sageBg },
                      ]}
                    >
                      <Text style={[
                        styles.formToggleText,
                        { color: formMode === 'topup' ? hennaColors.sage : hennaColors.muted },
                      ]}>
                        Received
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setFormMode('expense')}
                      style={[
                        styles.formToggleBtn,
                        formMode === 'expense' && { backgroundColor: hennaColors.hennaBg },
                      ]}
                    >
                      <Text style={[
                        styles.formToggleText,
                        { color: formMode === 'expense' ? hennaColors.henna : hennaColors.muted },
                      ]}>
                        Expense
                      </Text>
                    </Pressable>
                  </View>

                  {formMode === 'topup' ? (
                    <>
                      <HennaInput
                        placeholder="e.g. Weekly kharch"
                        value={topupNote}
                        onChangeText={setTopupNote}
                        containerStyle={styles.formInput}
                      />
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <HennaInput
                            placeholder={`Amount in ${currencyCode}`}
                            keyboardType="numeric"
                            value={topupAmt}
                            onChangeText={setTopupAmt}
                          />
                        </View>
                        <HennaButton title="Add" variant="sage" onPress={addTopup} />
                      </View>
                    </>
                  ) : (
                    <>
                      <HennaInput
                        placeholder="What did you buy?"
                        value={expItem}
                        onChangeText={setExpItem}
                        containerStyle={styles.formInput}
                      />
                      <View style={[styles.row, styles.formInput]}>
                        <View style={{ flex: 1 }}>
                          <HennaInput
                            placeholder={`Amount in ${currencyCode}`}
                            keyboardType="numeric"
                            value={expAmt}
                            onChangeText={setExpAmt}
                          />
                        </View>
                        <Pressable
                          onPress={openDatePicker}
                          style={styles.dateBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Pick date"
                        >
                          <HennaIcon name="calendar" size={14} color={hennaColors.ink2} />
                          <Text style={styles.dateBtnText}>{dateToDMY(expDate)}</Text>
                        </Pressable>
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
                        <View style={[styles.pickerWrap, { flex: 1 }]}>
                          <Picker
                            selectedValue={expCat}
                            onValueChange={setExpCat}
                            style={{ color: hennaColors.ink }}
                            dropdownIconColor={hennaColors.muted}
                          >
                            {CAT_KEYS.map(c => (
                              <Picker.Item key={c} value={c} label={c} style={{ fontSize: 13 }} />
                            ))}
                          </Picker>
                        </View>
                        <HennaButton title="+ Add" variant="primary" onPress={addExpense} />
                      </View>
                      <View style={styles.receiptRow}>
                        <HennaButton
                          title={receiptUri ? 'Change photo' : 'Receipt photo'}
                          icon="pencil"
                          variant="outline"
                          size="sm"
                          onPress={pickReceipt}
                        />
                        {receiptUri ? (
                          <Text style={styles.receiptOk}>Photo attached</Text>
                        ) : null}
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Transactions section */}
            <View style={styles.secHeader}>
              <Text style={styles.secTitle}>{sectionTitle}</Text>
              <Text style={styles.secCount}>{filtered.length}</Text>
            </View>

            {!allLoaded && (
              <View style={{ paddingHorizontal: 16 }}>
                <SkeletonCardRow />
                <SkeletonCardRow />
                <SkeletonCardRow />
              </View>
            )}

            {allLoaded && filtered.length === 0 && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>All caught up for today.</Text>
                <Text style={styles.emptyHint}>
                  Use the form above or the floating + to add your first entry.
                </Text>
              </View>
            )}

            {/* Grouped list */}
            <View style={{ paddingHorizontal: 16 }}>
              {grouped.map(([date, items]) => (
                <View key={date} style={{ marginBottom: 10 }}>
                  <Text style={[hennaTextStyles.eyebrow, styles.dateEyebrow]}>{dateLabel(date)}</Text>
                  <HennaCard padding={0}>
                    {items.map((t, i) => renderTxnRow(t, i === items.length - 1))}
                  </HennaCard>
                </View>
              ))}
            </View>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal
        visible={editId !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeEditModal} accessibilityLabel="Close edit modal" />
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                Edit {editingTransaction?.type === 'topup' ? 'Received' : 'Expense'}
              </Text>
              <HennaInput
                ref={editLabelRef}
                label="What"
                value={editLabel}
                onChangeText={setEditLabel}
                placeholder="e.g. Groceries"
                containerStyle={styles.editField}
                returnKeyType="next"
                autoFocus
                blurOnSubmit={false}
                onSubmitEditing={() => editAmtRef.current?.focus()}
              />
              <View style={styles.editRow}>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={editAmtRef}
                    label="Amount"
                    value={editAmt}
                    onChangeText={setEditAmt}
                    placeholder={`Amount in ${currencyCode}`}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveEdit}
                  />
                </View>
                <Pressable
                  onPress={openEditDatePicker}
                  style={[styles.dateBtn, { alignSelf: 'flex-end' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Pick date"
                >
                  <HennaIcon name="calendar" size={14} color={hennaColors.ink2} />
                  <Text style={styles.dateBtnText}>{dateToDMY(editDate)}</Text>
                </Pressable>
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
                <View style={[styles.pickerWrap, { marginTop: 10 }]}>
                  <Picker
                    selectedValue={editCat}
                    onValueChange={setEditCat}
                    style={{ color: hennaColors.ink }}
                    dropdownIconColor={hennaColors.muted}
                  >
                    {CAT_KEYS.map(c => (
                      <Picker.Item key={c} value={c} label={c} style={{ fontSize: 13 }} />
                    ))}
                  </Picker>
                </View>
              )}
              <View style={styles.editBtns}>
                <HennaButton title="Save" variant="primary" size="md" onPress={handleSaveEdit} />
                <HennaButton title="Cancel" variant="outline" size="md" onPress={closeEditModal} />
                <View style={{ flex: 1 }} />
                <HennaButton
                  title="Delete"
                  icon="trash"
                  variant="outline"
                  size="md"
                  onPress={() => editId !== null && deleteEntry(editId)}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroWrap: { paddingHorizontal: 16 },
  heroCard: {
    borderRadius: hennaRadii.card,
    overflow: 'hidden',
    position: 'relative',
    ...hennaShadows.md,
  },
  heroCorner: { position: 'absolute', top: -6, right: -6 },
  heroInner: { paddingVertical: 22, paddingHorizontal: 24, position: 'relative' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceText: {
    marginTop: 8,
    fontFamily: hennaFonts.serif,
    fontSize: hennaType.hero,
    lineHeight: hennaType.hero,
    letterSpacing: -0.5,
    color: hennaColors.ink,
  },
  balanceTail: {
    fontFamily: hennaFonts.flourish,
    color: hennaColors.henna,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 14,
  },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 12,
  },
  heroStatRight: { marginLeft: 'auto', alignItems: 'flex-end' },
  heroStatToday: {
    fontFamily: hennaFonts.serif,
    fontSize: 14,
    color: hennaColors.ink,
  },
  budgetBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
  },
  budgetEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  budgetLabel: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 11,
    color: hennaColors.ink2,
  },
  budgetVal: {
    flex: 1,
    textAlign: 'right',
    fontFamily: hennaFonts.serif,
    fontSize: 13,
    color: hennaColors.ink,
  },
  budgetEditBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetRemain: {
    marginTop: 6,
    fontFamily: hennaFonts.ui,
    fontSize: 10,
    color: hennaColors.muted,
  },
  budgetSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  budgetSetText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 13,
    color: hennaColors.henna,
  },

  // Filters
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabel: {
    marginLeft: 'auto',
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },

  // Search
  searchWrap: { paddingHorizontal: 16, marginTop: 8 },

  // Section eyebrows + presets
  sectionEyebrow: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
  },
  presetRail: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 6,
  },
  presetTile: {
    width: 78,
    backgroundColor: hennaColors.paper,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    minHeight: 70,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  presetText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    color: hennaColors.ink2,
  },

  // Add form
  addFormWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: hennaColors.paper,
    borderRadius: hennaRadii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: hennaColors.line,
    ...hennaShadows.sm,
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  addFormTitle: {
    fontFamily: hennaFonts.serif,
    fontSize: 17,
    color: hennaColors.ink,
  },
  addFormSub: {
    marginTop: 2,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.muted,
  },
  addFormBody: { marginTop: 12 },
  formToggle: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    backgroundColor: hennaColors.paper2,
    padding: 4,
    borderRadius: hennaRadii.pill,
  },
  formToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: hennaRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  formToggleText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 13,
  },
  formInput: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: hennaColors.paper2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    minHeight: 44,
  },
  dateBtnText: {
    fontFamily: hennaFonts.ui,
    fontSize: 13,
    color: hennaColors.ink,
  },
  pickerWrap: {
    backgroundColor: hennaColors.paper2,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    overflow: 'hidden',
    minHeight: 50,
    justifyContent: 'center',
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  receiptOk: {
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.sage,
  },

  // Section list
  secHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  secTitle: {
    flex: 1,
    fontFamily: hennaFonts.serif,
    fontSize: 18,
    color: hennaColors.ink,
  },
  secCount: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 11,
    color: hennaColors.muted,
  },
  dateEyebrow: { paddingHorizontal: 6, paddingTop: 6, paddingBottom: 8 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, minWidth: 0 },
  txLabel: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 14,
    color: hennaColors.ink,
  },
  txCat: {
    fontFamily: hennaFonts.ui,
    fontSize: 10,
    color: hennaColors.muted,
    marginTop: 1,
  },
  txReceipt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginTop: 4,
  },
  txAmt: {
    fontFamily: hennaFonts.serif,
    fontSize: 15,
  },

  // Empty
  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: {
    fontFamily: hennaFonts.serif,
    fontSize: 18,
    color: hennaColors.ink,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 8,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.muted,
    textAlign: 'center',
  },

  // Edit modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(60,40,20,0.45)',
  },
  modalContent: {
    backgroundColor: hennaColors.pearl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalTitle: {
    fontFamily: hennaFonts.serif,
    fontSize: 22,
    color: hennaColors.ink,
    marginBottom: 16,
  },
  editField: { marginBottom: 10 },
  editRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  editBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    alignItems: 'center',
  },
});
