import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  Switch,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { Toast, useToast } from '../components/ui/Toast';
import { LottieBox } from '../components/ui/LottieBox';
import { SAVINGS_CAT } from '../constants/data';
import { dateToISO, fmtISO, todayISO, todayStr } from '../utils/dates';
import { SavingsGoal, Transaction } from '../types';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import {
  hennaColors,
  hennaFonts,
  hennaGradients,
  hennaRadii,
  hennaShadows,
  hennaTextStyles,
} from '../constants/hennaTokens';
import {
  HennaHeader,
  HennaButton,
  HennaCard,
  HennaIcon,
  HennaInput,
  HennaBadge,
  HennaProgress,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';

function daysBetweenISO(aISO: string, bISO: string): number {
  const [ay, am, ad] = aISO.split('-').map(Number);
  const [by, bm, bd] = bISO.split('-').map(Number);
  const a = new Date(ay, am - 1, ad).getTime();
  const b = new Date(by, bm - 1, bd).getTime();
  return Math.round((b - a) / 86400000);
}

function splitFlourish(formatted: string): { head: string; tail: string } {
  if (formatted.length <= 3) return { head: '', tail: formatted };
  return { head: formatted.slice(0, -3), tail: formatted.slice(-3) };
}

export default function SavingsGoalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { savingsGoals, setSavingsGoals, setHistory } = useData();
  const { pkrF, currencyCode } = useCurrency();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [contribModal, setContribModal] = useState<{ id: number | null; visible: boolean }>({ id: null, visible: false });

  const [fName, setFName] = useState('');
  const [fTarget, setFTarget] = useState('');
  const [fSaved, setFSaved] = useState('0');
  const [fDeadline, setFDeadline] = useState<Date | null>(null);
  const [fNotes, setFNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [contribAmt, setContribAmt] = useState('');
  const [contribLogExpense, setContribLogExpense] = useState(true);

  const sNameRef = useRef<TextInput | null>(null);
  const sTargetRef = useRef<TextInput | null>(null);
  const sSavedRef = useRef<TextInput | null>(null);
  const sNotesRef = useRef<TextInput | null>(null);

  const [celebrateVisible, setCelebrateVisible] = useState(false);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

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
    Alert.alert('Delete Goal', `Delete "${target.name}"?`, [
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
      showToast(`${goalBefore.name} achieved`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrateVisible(true);
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
  const totalPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const totalSavedSplit = splitFlourish(pkrF(totalSaved));

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader
          title="Savings Goals"
          subtitle={
            savingsGoals.length === 0
              ? 'Dream big, save quietly'
              : `${savingsGoals.length} ${savingsGoals.length === 1 ? 'goal' : 'goals'} · ${totalPct}% complete`
          }
          onMenu={onMenu}
        />

        {/* Hero — pink */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroPink}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.pink} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.pink} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.pink }]}>Total saved</Text>
              </View>
              <Text style={styles.heroNum}>
                {totalSavedSplit.head}
                <Text style={styles.heroNumTail}>{totalSavedSplit.tail}</Text>
              </Text>
              <Text style={styles.heroSub}>
                {savingsGoals.length === 0
                  ? 'Tap + to set your first goal'
                  : `of ${pkrF(totalTarget)} across ${savingsGoals.length} ${savingsGoals.length === 1 ? 'goal' : 'goals'}`}
              </Text>
              <View style={{ marginTop: 14 }}>
                <HennaButton title="+ New goal" icon="plus" variant="primary" size="sm" onPress={openAdd} />
              </View>
            </View>
          </View>
        </View>

        {sortedGoals.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Your dreams need a home.</Text>
            <Text style={styles.emptyHint}>Set a target, a deadline, and the app holds them safely.</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {sortedGoals.map(g => {
              const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
              const remaining = Math.max(0, g.targetAmount - g.savedAmount);
              const daysLeft = g.deadline ? daysBetweenISO(todayISO(), g.deadline) : null;
              return (
                <SwipeableRow
                  key={g.id}
                  itemLabel={g.name}
                  actions={[
                    { kind: 'edit', onPress: () => openEdit(g) },
                    { kind: 'delete', onPress: () => deleteGoal(g.id) },
                  ]}
                >
                  <HennaCard padding={18} style={{ marginBottom: 12 }}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName} numberOfLines={1}>
                        {g.name}
                      </Text>
                      {g.completed ? <HennaBadge accent="sage">achieved</HennaBadge> : null}
                    </View>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressMain}>{pkrF(g.savedAmount)}</Text>
                      <Text style={styles.progressOf}>/ {pkrF(g.targetAmount)}</Text>
                    </View>
                    <HennaProgress
                      value={g.savedAmount}
                      max={g.targetAmount}
                      accent={g.completed ? 'sage' : 'henna'}
                      height={10}
                    />
                    <View style={styles.progressMeta}>
                      <Text style={[styles.progressPct, { color: g.completed ? hennaColors.sage : hennaColors.henna }]}>{pct}%</Text>
                      <Text style={styles.progressRemaining}>
                        {g.completed ? 'Goal achieved' : `${pkrF(remaining)} to go`}
                      </Text>
                    </View>
                    {g.deadline && !g.completed ? (
                      <Text
                        style={[
                          styles.deadlineText,
                          {
                            color:
                              daysLeft !== null && daysLeft < 0
                                ? hennaColors.henna
                                : hennaColors.muted,
                          },
                        ]}
                      >
                        {fmtISO(g.deadline)}
                        {daysLeft !== null
                          ? daysLeft > 0
                            ? ` · ${daysLeft} days left`
                            : daysLeft === 0
                              ? ' · due today'
                              : ` · ${Math.abs(daysLeft)} days overdue`
                          : ''}
                      </Text>
                    ) : null}
                    {g.notes ? (
                      <Text style={styles.notesText} numberOfLines={2}>
                        {g.notes}
                      </Text>
                    ) : null}
                    <View style={styles.goalActions}>
                      {!g.completed && (
                        <HennaButton
                          title="+ Contribute"
                          variant="primary"
                          size="sm"
                          onPress={() => openContrib(g.id)}
                          style={{ flex: 1 }}
                        />
                      )}
                      <HennaButton
                        title="Edit"
                        icon="pencil"
                        variant="outline"
                        size="sm"
                        onPress={() => openEdit(g)}
                      />
                    </View>
                  </HennaCard>
                </SwipeableRow>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={closeEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editingId !== null ? 'Edit goal' : 'New savings goal'}</Text>
              <HennaInput
                ref={sNameRef}
                label="Name"
                placeholder="e.g. Umrah, Car, School fees"
                value={fName}
                onChangeText={setFName}
                containerStyle={{ marginBottom: 10 }}
                autoFocus
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => sTargetRef.current?.focus()}
              />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={sTargetRef}
                    label={`Target (${currencyCode})`}
                    placeholder="50000"
                    value={fTarget}
                    onChangeText={setFTarget}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => sSavedRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={sSavedRef}
                    label={`Saved (${currencyCode})`}
                    placeholder="0"
                    value={fSaved}
                    onChangeText={setFSaved}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => sNotesRef.current?.focus()}
                  />
                </View>
              </View>

              <Text style={[hennaTextStyles.eyebrow, { marginTop: 14, marginBottom: 8 }]}>Deadline (optional)</Text>
              <View style={styles.deadlineRow}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Pick deadline"
                >
                  <HennaIcon name="calendar" size={14} color={hennaColors.ink2} />
                  <Text style={styles.dateBtnText}>
                    {fDeadline ? fmtISO(dateToISO(fDeadline)) : 'No deadline'}
                  </Text>
                </Pressable>
                {fDeadline && (
                  <Pressable
                    onPress={() => setFDeadline(null)}
                    style={styles.clearBtn}
                    accessibilityLabel="Clear deadline"
                  >
                    <HennaIcon name="close" size={13} color={hennaColors.muted} />
                  </Pressable>
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

              <HennaInput
                ref={sNotesRef}
                label="Notes (optional)"
                placeholder="why this matters"
                value={fNotes}
                onChangeText={setFNotes}
                multiline
                containerStyle={{ marginTop: 12 }}
                returnKeyType="done"
                onSubmitEditing={saveGoal}
              />

              <View style={styles.modalBtns}>
                <HennaButton title="Cancel" variant="outline" onPress={closeEdit} style={{ flex: 1 }} />
                <HennaButton
                  title={editingId !== null ? 'Save' : 'Create'}
                  variant="primary"
                  onPress={saveGoal}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        visible={contribModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setContribModal({ id: null, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBoxSm}>
            <Text style={styles.modalTitle}>Add contribution</Text>
            <HennaInput
              label={`Amount (${currencyCode})`}
              placeholder="1000"
              value={contribAmt}
              onChangeText={setContribAmt}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Log as expense</Text>
                <Text style={styles.switchSub}>Records under {SAVINGS_CAT}</Text>
              </View>
              <Switch
                value={contribLogExpense}
                onValueChange={setContribLogExpense}
                trackColor={{ false: hennaColors.line, true: hennaColors.henna }}
                thumbColor={hennaColors.paper}
              />
            </View>
            <View style={styles.modalBtns}>
              <HennaButton
                title="Cancel"
                variant="outline"
                onPress={() => setContribModal({ id: null, visible: false })}
                style={{ flex: 1 }}
              />
              <HennaButton title="Add" variant="primary" onPress={saveContrib} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />

      {celebrateVisible && (
        <View style={styles.celebrateOverlay} pointerEvents="none">
          <LottieBox
            animation="celebrate"
            size={220}
            fallbackEmoji="🎉"
            onAnimationFinish={() => setCelebrateVisible(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },

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
  heroNum: {
    marginTop: 8,
    fontFamily: hennaFonts.serif,
    fontSize: 36,
    lineHeight: 40,
    color: hennaColors.ink,
    letterSpacing: -0.5,
  },
  heroNumTail: {
    fontFamily: hennaFonts.flourish,
    color: hennaColors.pink,
  },
  heroSub: {
    marginTop: 6,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.ink2,
  },

  // Empty
  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },

  // List
  listWrap: { paddingHorizontal: 16, paddingTop: 18 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  goalName: { flex: 1, fontFamily: hennaFonts.serif, fontSize: 17, color: hennaColors.ink },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  progressMain: { fontFamily: hennaFonts.serif, fontSize: 20, color: hennaColors.ink },
  progressOf: { fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressPct: { fontFamily: hennaFonts.uiSemi, fontSize: 13 },
  progressRemaining: { fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted },
  deadlineText: { fontFamily: hennaFonts.ui, fontSize: 12, marginTop: 8 },
  notesText: {
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    fontStyle: 'italic',
    color: hennaColors.muted,
    marginTop: 6,
  },
  goalActions: { flexDirection: 'row', gap: 8, marginTop: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(60,40,20,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: hennaColors.pearl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '88%',
  },
  modalBoxSm: {
    backgroundColor: hennaColors.pearl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: hennaFonts.serif,
    fontSize: 22,
    color: hennaColors.ink,
    marginBottom: 16,
  },
  row2: { flexDirection: 'row', gap: 10 },
  deadlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hennaColors.paper2,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  switchTitle: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  switchSub: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, marginTop: 2 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },

  celebrateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
  },
});
