import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { SAVINGS_CAT } from '../constants/data';
import { dateToISO, fmtISO, todayISO, todayStr } from '../utils/dates';
import { SavingsGoal, Transaction } from '../types';

function daysBetweenISO(aISO: string, bISO: string): number {
  const [ay, am, ad] = aISO.split('-').map(Number);
  const [by, bm, bd] = bISO.split('-').map(Number);
  const a = new Date(ay, am - 1, ad).getTime();
  const b = new Date(by, bm - 1, bd).getTime();
  return Math.round((b - a) / 86400000);
}

export default function SavingsGoalsScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { savingsGoals, setSavingsGoals, setHistory } = useData();
  const { pkrF, currencyCode } = useCurrency();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [contribModal, setContribModal] = useState<{ id: number | null; visible: boolean }>({ id: null, visible: false });

  // Form state
  const [fName, setFName] = useState('');
  const [fTarget, setFTarget] = useState('');
  const [fSaved, setFSaved] = useState('0');
  const [fDeadline, setFDeadline] = useState<Date | null>(null);
  const [fNotes, setFNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Contribution state
  const [contribAmt, setContribAmt] = useState('');
  const [contribLogExpense, setContribLogExpense] = useState(true);

  const resetForm = useCallback(() => {
    setFName('');
    setFTarget('');
    setFSaved('0');
    setFDeadline(null);
    setFNotes('');
    setEditingId(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setEditModal(true);
  }, [resetForm]);

  const openEdit = useCallback((g: SavingsGoal) => {
    setEditingId(g.id);
    setFName(g.name);
    setFTarget(String(g.targetAmount));
    setFSaved(String(g.savedAmount));
    setFDeadline(g.deadline ? new Date(g.deadline + 'T00:00:00') : null);
    setFNotes(g.notes || '');
    setEditModal(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditModal(false);
    resetForm();
  }, [resetForm]);

  const saveGoal = useCallback(() => {
    if (!fName.trim()) {
      Alert.alert('Missing name', 'Please name your savings goal.');
      return;
    }
    const target = parseFloat(fTarget);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid target', 'Target amount must be greater than zero.');
      return;
    }
    const saved = parseFloat(fSaved);
    if (isNaN(saved) || saved < 0) {
      Alert.alert('Invalid saved amount', 'Saved amount must be zero or positive.');
      return;
    }
    const deadline = fDeadline ? dateToISO(fDeadline) : undefined;

    if (editingId !== null) {
      setSavingsGoals(prev => prev.map(g =>
        g.id === editingId
          ? {
              ...g,
              name: fName.trim(),
              targetAmount: target,
              savedAmount: saved,
              deadline,
              notes: fNotes.trim() || undefined,
              completed: saved >= target,
            }
          : g,
      ));
      showToast('Goal updated');
    } else {
      const goal: SavingsGoal = {
        id: Date.now(),
        name: fName.trim(),
        targetAmount: target,
        savedAmount: saved,
        deadline,
        createdAt: new Date().toISOString(),
        completed: saved >= target,
        notes: fNotes.trim() || undefined,
      };
      setSavingsGoals(prev => [goal, ...prev]);
      showToast('Goal created');
    }
    Haptics.selectionAsync();
    closeEdit();
  }, [fName, fTarget, fSaved, fDeadline, fNotes, editingId, setSavingsGoals, showToast, closeEdit]);

  const deleteGoal = useCallback((id: number) => {
    const target = savingsGoals.find(g => g.id === id);
    if (!target) return;
    Alert.alert('Delete Goal', `Delete "${target.name}"? Progress will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setSavingsGoals(prev => prev.filter(g => g.id !== id));
          showToast(target.name + ' deleted', () => {
            setSavingsGoals(prev => [target, ...prev]);
          });
        },
      },
    ]);
  }, [savingsGoals, setSavingsGoals, showToast]);

  const openContrib = useCallback((id: number) => {
    setContribAmt('');
    setContribLogExpense(true);
    setContribModal({ id, visible: true });
  }, []);

  const saveContrib = useCallback(() => {
    if (contribModal.id === null) return;
    const amt = parseFloat(contribAmt);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Contribution must be greater than zero.');
      return;
    }

    const goalBefore = savingsGoals.find(g => g.id === contribModal.id);
    if (!goalBefore) return;

    const nextSaved = goalBefore.savedAmount + amt;
    const nowComplete = !goalBefore.completed && nextSaved >= goalBefore.targetAmount;

    setSavingsGoals(prev => prev.map(g =>
      g.id === contribModal.id
        ? { ...g, savedAmount: nextSaved, completed: nextSaved >= g.targetAmount }
        : g,
    ));

    if (contribLogExpense) {
      const tx: Transaction = {
        id: Date.now(),
        type: 'expense',
        label: `Savings: ${goalBefore.name}`,
        amount: amt,
        cat: SAVINGS_CAT,
        date: todayStr(),
      };
      setHistory(h => [tx, ...h]);
    }

    if (nowComplete) {
      showToast(`🎉 ${goalBefore.name} completed!`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      showToast(`+ ${pkrF(amt)} saved`);
      Haptics.selectionAsync();
    }

    setContribModal({ id: null, visible: false });
  }, [contribModal.id, contribAmt, contribLogExpense, savingsGoals, setSavingsGoals, setHistory, pkrF, showToast]);

  const onDeadlineChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setFDeadline(selected);
  }, []);

  const sortedGoals = useMemo(() => {
    const active = savingsGoals.filter(g => !g.completed);
    const done = savingsGoals.filter(g => g.completed);
    return [
      ...active.sort((a, b) => b.id - a.id),
      ...done.sort((a, b) => b.id - a.id),
    ];
  }, [savingsGoals]);

  const totalSaved = useMemo(() => savingsGoals.reduce((s, g) => s + g.savedAmount, 0), [savingsGoals]);
  const totalTarget = useMemo(() => savingsGoals.reduce((s, g) => s + g.targetAmount, 0), [savingsGoals]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card gradient={dark ? gradients.pinkHeroDark : gradients.pinkHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.pink }]}>💰 Savings Goals</Text>
              <Text style={[styles.heroNum, { color: colors.pink }]}>{pkrF(totalSaved)}</Text>
              <Text style={[styles.heroSub, { color: colors.sub }]}>
                {savingsGoals.length === 0
                  ? 'No goals yet'
                  : `of ${pkrF(totalTarget)} across ${savingsGoals.length} ${savingsGoals.length === 1 ? 'goal' : 'goals'}`}
              </Text>
            </View>
          </View>
        </Card>

        <Button title="+ New Goal" variant="pink" onPress={openAdd} style={{ marginBottom: 12 }} />

        {sortedGoals.length === 0 ? (
          <EmptyState
            icon="💰"
            text="No savings goals yet."
            hint="Tap + New Goal to start saving for something wonderful."
          />
        ) : sortedGoals.map(g => {
          const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
          const remaining = Math.max(0, g.targetAmount - g.savedAmount);
          const daysLeft = g.deadline ? daysBetweenISO(todayISO(), g.deadline) : null;
          return (
            <Card key={g.id}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalName, { color: colors.deep }]} numberOfLines={1}>
                  {g.name}
                </Text>
                {g.completed && <Badge text="Achieved ✓" bg={colors.greenBg} color={colors.green} />}
              </View>
              <View style={styles.progressRow}>
                <Text style={[styles.progressMain, { color: colors.deep }]}>
                  {pkrF(g.savedAmount)}
                </Text>
                <Text style={[styles.progressOf, { color: colors.muted }]}>
                  / {pkrF(g.targetAmount)}
                </Text>
              </View>
              <ProgressBar
                percent={pct}
                fillColor={g.completed ? colors.green : colors.pink}
                bgColor={colors.border}
                height={10}
              />
              <View style={styles.progressMeta}>
                <Text style={[styles.progressPct, { color: colors.pink }]}>{pct}%</Text>
                <Text style={[styles.progressRemaining, { color: colors.muted }]}>
                  {g.completed
                    ? '🎉 Goal achieved!'
                    : `${pkrF(remaining)} to go`}
                </Text>
              </View>
              {g.deadline && !g.completed && (
                <Text style={[styles.deadlineText, {
                  color: daysLeft !== null && daysLeft < 0 ? colors.red : colors.sub,
                }]}>
                  📅 {fmtISO(g.deadline)}
                  {daysLeft !== null
                    ? daysLeft > 0 ? ` · ${daysLeft} days left` : daysLeft === 0 ? ' · due today' : ` · ${Math.abs(daysLeft)} days overdue`
                    : ''}
                </Text>
              )}
              {g.notes ? (
                <Text style={[styles.notesText, { color: colors.muted }]} numberOfLines={2}>
                  {g.notes}
                </Text>
              ) : null}

              <View style={styles.goalActions}>
                {!g.completed && (
                  <Button title="+ Contribute" variant="pink" small onPress={() => openContrib(g.id)} style={{ flex: 1 }} />
                )}
                <Button title="✏️ Edit" variant="outline" small onPress={() => openEdit(g)} style={{ flex: 1 }} />
                <Button title="🗑" variant="outline" small onPress={() => deleteGoal(g.id)} />
              </View>
            </Card>
          );
        })}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={closeEdit}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: colors.deep }]}>
                {editingId !== null ? 'Edit Goal' : 'New Savings Goal'}
              </Text>
              <Input label="Name" placeholder="e.g. Umrah, Car, School Fees" value={fName} onChangeText={setFName} style={{ marginBottom: 10 }} />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Input label={`Target (${currencyCode})`} placeholder="50000" value={fTarget} onChangeText={setFTarget} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label={`Saved (${currencyCode})`} placeholder="0" value={fSaved} onChangeText={setFSaved} keyboardType="numeric" />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 12 }]}>DEADLINE (OPTIONAL)</Text>
              <View style={styles.deadlineRow}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.dateBtn, { backgroundColor: colors.bg3 }]}
                >
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    📅 {fDeadline ? fmtISO(dateToISO(fDeadline)) : 'No deadline'}
                  </Text>
                </TouchableOpacity>
                {fDeadline && (
                  <TouchableOpacity
                    onPress={() => setFDeadline(null)}
                    style={[styles.clearBtn, { backgroundColor: colors.bg3 }]}
                    accessibilityLabel="Clear deadline"
                  >
                    <Text style={{ color: colors.muted, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={fDeadline || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDeadlineChange}
                />
              )}

              <Input label="Notes (optional)" placeholder="why this matters" value={fNotes} onChangeText={setFNotes} multiline style={{ marginTop: 12 }} />

              <View style={styles.modalBtns}>
                <Button title="Cancel" variant="outline" small onPress={closeEdit} style={{ flex: 1 }} />
                <Button title={editingId !== null ? 'Save' : 'Create'} variant="pink" small onPress={saveGoal} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contribution Modal */}
      <Modal visible={contribModal.visible} transparent animationType="fade" onRequestClose={() => setContribModal({ id: null, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.modalTitle, { color: colors.deep }]}>Add Contribution</Text>
            <Input label={`Amount (${currencyCode})`} placeholder="1000" value={contribAmt} onChangeText={setContribAmt} keyboardType="numeric" autoFocus />
            <View style={[styles.switchRow, { marginTop: 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchTitle, { color: colors.deep }]}>Log as expense</Text>
                <Text style={[styles.switchSub, { color: colors.muted }]}>
                  Adds to your history under {SAVINGS_CAT}
                </Text>
              </View>
              <Switch
                value={contribLogExpense}
                onValueChange={setContribLogExpense}
                trackColor={{ false: colors.border, true: colors.pink }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="outline" small onPress={() => setContribModal({ id: null, visible: false })} style={{ flex: 1 }} />
              <Button title="Add" variant="pink" small onPress={saveContrib} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  heroLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  heroNum: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 38, lineHeight: 44 },
  heroSub: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10 },
  goalName: { flex: 1, fontSize: 17, fontFamily: 'Outfit-Bold' },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  progressMain: { fontSize: 22, fontFamily: 'Outfit-Bold' },
  progressOf: { fontSize: 14, fontFamily: 'Outfit-Regular' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressPct: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  progressRemaining: { fontSize: 13, fontFamily: 'Outfit-Regular' },
  deadlineText: { fontSize: 13, fontFamily: 'Outfit-Regular', marginTop: 8 },
  notesText: { fontSize: 13, fontFamily: 'Outfit-Regular', fontStyle: 'italic', marginTop: 6 },
  goalActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '88%' },
  modalTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', marginBottom: 18 },
  row2: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  deadlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dateBtn: { flex: 1, borderRadius: 16, padding: 16, minHeight: 54, justifyContent: 'center' },
  dateText: { fontSize: 16, fontFamily: 'Outfit-Regular' },
  clearBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  switchSub: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 18 },
  bottomPad: { height: 40 },
});
