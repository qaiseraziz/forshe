import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { DAYS, FULL_DAYS, MONTHS, PRESET_TASKS } from '../constants/data';
import { todayDay, todayStr } from '../utils/dates';
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
  HennaPill,
  HennaProgress,
  HennaBadge,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';

const ATT_STATUSES: Array<'Present' | 'Absent' | 'Holiday'> = ['Present', 'Absent', 'Holiday'];

export default function MaidScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { maidData, setMaidData, attendance, setAttendance, maidSalary, setMaidSalary } = useData();
  const { pkrF, currencyCode } = useCurrency();

  const [filter, setFilter] = useState<'all' | 'today' | 'month'>('all');
  const [activeDay, setActiveDay] = useState<string>(todayDay());
  const [customVal, setCustomVal] = useState('');
  const [presetVal, setPresetVal] = useState('');
  const [salaryAmt, setSalaryAmt] = useState('');
  const [advanceAmt, setAdvanceAmt] = useState('');

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const isToday = activeDay === todayDay();
  const td = todayStr();
  const att = attendance[td];

  const toggle = useCallback(
    (day: string, idx: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMaidData(prev => ({
        ...prev,
        [day]: (prev[day] || []).map((t, i) => (i === idx ? { ...t, done: !t.done } : t)),
      }));
    },
    [setMaidData],
  );

  const del = useCallback(
    (day: string, idx: number) => {
      setMaidData(prev => ({
        ...prev,
        [day]: (prev[day] || []).filter((_, i) => i !== idx),
      }));
    },
    [setMaidData],
  );

  const addPreset = useCallback(
    (day: string, val: string) => {
      if (!val) return;
      setMaidData(prev => {
        const tasks = prev[day] || [];
        if (tasks.some(t => t.name.toLowerCase() === val.toLowerCase())) return prev;
        return { ...prev, [day]: [...tasks, { id: Date.now(), name: val, done: false }] };
      });
      setPresetVal('');
    },
    [setMaidData],
  );

  const addCustom = useCallback(
    (day: string) => {
      if (!customVal.trim()) return;
      setMaidData(prev => {
        const tasks = prev[day] || [];
        if (tasks.some(t => t.name.toLowerCase() === customVal.trim().toLowerCase())) return prev;
        return { ...prev, [day]: [...tasks, { id: Date.now(), name: customVal.trim(), done: false }] };
      });
      setCustomVal('');
    },
    [customVal, setMaidData],
  );

  const markAtt = useCallback(
    (status: 'Present' | 'Absent' | 'Holiday') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAttendance(a => ({ ...a, [td]: status }));
    },
    [td, setAttendance],
  );

  const hasDot = useCallback(
    (day: string) => (maidData[day]?.length || 0) > 0,
    [maidData],
  );

  const monthlyStats = useMemo(() => {
    const totalDone = DAYS.reduce((s, d) => s + (maidData[d]?.filter(t => t.done).length || 0), 0);
    const totalAll = DAYS.reduce((s, d) => s + (maidData[d]?.length || 0), 0);
    const pct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
    const attEntries = Object.entries(attendance);
    const presentDays = attEntries.filter(([, v]) => v === 'Present').length;
    const absentDays = attEntries.filter(([, v]) => v === 'Absent').length;
    return { totalDone, totalAll, pct, presentDays, absentDays };
  }, [maidData, attendance]);

  const tasks = maidData[activeDay] || [];
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const saveSalary = useCallback(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sal = parseFloat(salaryAmt) || 0;
    const adv = parseFloat(advanceAmt) || 0;
    if (sal <= 0) {
      Alert.alert('Invalid Salary', 'Please enter a salary amount greater than 0.');
      return;
    }
    const existing = maidSalary.find(s => s.month === monthKey);
    if (existing) {
      setMaidSalary(ms => ms.map(s => (s.month === monthKey ? { ...s, salary: sal, advance: adv } : s)));
    } else {
      setMaidSalary(ms => [...ms, { id: Date.now(), month: monthKey, salary: sal, advance: adv, deduction: 0, paid: false, note: '' }]);
    }
    setSalaryAmt('');
    setAdvanceAmt('');
  }, [salaryAmt, advanceAmt, maidSalary, setMaidSalary]);

  const sortedSalary = useMemo(
    () => [...maidSalary].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6),
    [maidSalary],
  );

  const presets = useMemo(() => {
    const added = tasks.map(t => t.name.toLowerCase());
    return PRESET_TASKS.filter(p => !added.includes(p.toLowerCase()));
  }, [tasks]);

  const handleAddPreset = useCallback(() => {
    addPreset(activeDay, presetVal);
  }, [addPreset, activeDay, presetVal]);

  const handleAddCustom = useCallback(() => {
    addCustom(activeDay);
  }, [addCustom, activeDay]);

  const toggleSalaryPaid = useCallback(
    (id: number) => {
      setMaidSalary(ms => ms.map(x => (x.id === id ? { ...x, paid: !x.paid } : x)));
    },
    [setMaidSalary],
  );

  // Monthly view
  if (filter === 'month') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
          showsVerticalScrollIndicator={false}
        >
          <HennaHeader title="Maid Tasks" subtitle="Weekly overview" onMenu={onMenu} />

          <View style={styles.filterRow}>
            <HennaPill label="All" active={false} onPress={() => setFilter('all')} />
            <HennaPill label="Today" active={false} onPress={() => setFilter('today')} />
            <HennaPill label="Week" active onPress={() => setFilter('month')} />
          </View>

          <View style={styles.heroWrap}>
            <View style={styles.heroCard}>
              <LinearGradient
                colors={hennaGradients.heroSage}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <MeshOverlay />
              <View style={styles.heroCorner} pointerEvents="none">
                <ArabesqueCorner size={110} color={hennaColors.sage} opacity={0.18} />
              </View>
              <View style={styles.heroInner}>
                <View style={styles.greetRow}>
                  <MarginMark color={hennaColors.sage} />
                  <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.sage }]}>
                    Maid planner
                  </Text>
                </View>
                <Text style={styles.heroNum}>{monthlyStats.pct}%</Text>
                <Text style={styles.heroSub}>
                  {monthlyStats.totalDone} of {monthlyStats.totalAll} tasks done
                </Text>
                {monthlyStats.presentDays + monthlyStats.absentDays > 0 ? (
                  <View style={styles.heroBadgesRow}>
                    <HennaBadge accent="sage">{`${monthlyStats.presentDays} present`}</HennaBadge>
                    {monthlyStats.absentDays > 0 ? (
                      <HennaBadge accent="henna">{`${monthlyStats.absentDays} absent`}</HennaBadge>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.bodyWrap}>
            {DAYS.map(d => {
              const dayTasks = maidData[d] || [];
              if (!dayTasks.length) return null;
              const doneCnt = dayTasks.filter(t => t.done).length;
              return (
                <HennaCard key={d} padding={16} style={{ marginBottom: 10 }}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayHeaderName}>{FULL_DAYS[DAYS.indexOf(d as (typeof DAYS)[number])]}</Text>
                    <HennaBadge accent={doneCnt === dayTasks.length ? 'sage' : doneCnt > 0 ? 'bronze' : 'henna'}>
                      {`${doneCnt}/${dayTasks.length}`}
                    </HennaBadge>
                  </View>
                  {dayTasks.map((t, i) => (
                    <View key={i} style={styles.monthTaskRow}>
                      <View
                        style={[
                          styles.monthCheck,
                          t.done && { backgroundColor: hennaColors.sage, borderColor: hennaColors.sage },
                        ]}
                      >
                        {t.done ? <HennaIcon name="check" size={10} color={hennaColors.paper} /> : null}
                      </View>
                      <Text
                        style={[
                          styles.monthTaskName,
                          t.done && { color: hennaColors.muted, textDecorationLine: 'line-through' },
                        ]}
                      >
                        {t.name}
                      </Text>
                    </View>
                  ))}
                </HennaCard>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Daily view
  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HennaHeader
          title="Maid Tasks"
          subtitle={isToday ? "Today's tasks" : FULL_DAYS[DAYS.indexOf(activeDay as (typeof DAYS)[number])]}
          onMenu={onMenu}
        />

        <View style={styles.filterRow}>
          <HennaPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <HennaPill label="Today" active={filter === 'today'} onPress={() => setFilter('today')} />
          <HennaPill label="Week" active={false} onPress={() => setFilter('month')} />
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroSage}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.sage} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.sage} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.sage }]}>
                  {isToday ? 'Today' : 'Selected day'}
                </Text>
              </View>
              <Text style={styles.heroNum}>{tasks.length === 0 ? '—' : `${pct}%`}</Text>
              <Text style={styles.heroSub}>
                {tasks.length === 0 ? 'No tasks yet' : `${done} of ${tasks.length} done`}
              </Text>
              {tasks.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <HennaProgress value={done} max={tasks.length} accent="sage" height={6} />
                </View>
              ) : null}

              {isToday && (
                <View style={styles.attRow}>
                  {ATT_STATUSES.map(status => (
                    <Pressable
                      key={status}
                      onPress={() => markAtt(status)}
                      style={[
                        styles.attBtn,
                        att === status && {
                          backgroundColor:
                            status === 'Present'
                              ? hennaColors.sageBg
                              : status === 'Absent'
                                ? hennaColors.hennaBg
                                : hennaColors.bronzeBg,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={status}
                    >
                      <Text
                        style={[
                          styles.attBtnText,
                          {
                            color:
                              att === status
                                ? status === 'Present'
                                  ? hennaColors.sage
                                  : status === 'Absent'
                                    ? hennaColors.henna
                                    : hennaColors.bronze
                                : hennaColors.muted,
                          },
                        ]}
                      >
                        {status}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Day strip */}
        {filter !== 'today' && (
          <View style={styles.dayStrip}>
            {DAYS.map(d => {
              const active = d === activeDay;
              const dot = hasDot(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveDay(d);
                  }}
                  style={[
                    styles.dayCell,
                    active && { backgroundColor: hennaColors.sage },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={d}
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.dayCellLbl,
                      { color: active ? hennaColors.paper : hennaColors.ink2 },
                    ]}
                  >
                    {d}
                  </Text>
                  {dot ? (
                    <View
                      style={[
                        styles.dayDot,
                        { backgroundColor: active ? hennaColors.paper : hennaColors.sage },
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Task list */}
        <View style={styles.bodyWrap}>
          {tasks.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No tasks for this day yet.</Text>
              <Text style={styles.emptyHint}>Add one below.</Text>
            </View>
          ) : (
            tasks.map((t, i) => (
              <HennaCard key={t.id} padding={14} style={{ marginBottom: 8 }}>
                <View style={styles.taskRow}>
                  <Pressable
                    onPress={() => toggle(activeDay, i)}
                    style={[
                      styles.checkbox,
                      t.done && { backgroundColor: hennaColors.sage, borderColor: hennaColors.sage },
                    ]}
                    hitSlop={8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: t.done }}
                  >
                    {t.done ? <HennaIcon name="check" size={14} color={hennaColors.paper} /> : null}
                  </Pressable>
                  <Text
                    style={[
                      styles.taskName,
                      t.done && { color: hennaColors.muted, textDecorationLine: 'line-through' },
                    ]}
                  >
                    {t.name}
                  </Text>
                  <Pressable
                    onPress={() => del(activeDay, i)}
                    style={styles.delBtn}
                    hitSlop={8}
                    accessibilityLabel={`Delete ${t.name}`}
                  >
                    <HennaIcon name="close" size={14} color={hennaColors.henna} />
                  </Pressable>
                </View>
              </HennaCard>
            ))
          )}
        </View>

        {/* Add task */}
        <View style={styles.bodyWrap}>
          <HennaCard padding={18} style={{ marginBottom: 14 }}>
            <Text style={[hennaTextStyles.eyebrow, { marginBottom: 12 }]}>
              Add task for {activeDay}
            </Text>
            <View style={styles.row}>
              <View style={styles.pickerWrapInline}>
                <Picker
                  selectedValue={presetVal}
                  onValueChange={v => setPresetVal(v)}
                  style={{ color: hennaColors.ink, height: 50 }}
                  dropdownIconColor={hennaColors.muted}
                >
                  <Picker.Item label="— Pick from list —" value="" />
                  {presets.map(p => (
                    <Picker.Item key={p} label={p} value={p} />
                  ))}
                </Picker>
              </View>
              <HennaButton title="Add" icon="plus" variant="sage" size="sm" onPress={handleAddPreset} />
            </View>
            <Text style={[hennaTextStyles.eyebrow, { marginTop: 12, marginBottom: 8 }]}>
              Or type custom
            </Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <HennaInput
                  placeholder="e.g. Clean ceiling fans"
                  value={customVal}
                  onChangeText={setCustomVal}
                  onSubmitEditing={handleAddCustom}
                />
              </View>
              <HennaButton title="Add" icon="plus" variant="sage" size="sm" onPress={handleAddCustom} />
            </View>
          </HennaCard>

          {/* Salary tracker */}
          <Text style={[hennaTextStyles.eyebrow, { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 10 }]}>
            Salary tracker
          </Text>
          <HennaCard padding={18} style={{ marginBottom: 14 }}>
            <Text style={styles.salaryTitle}>Maid salary</Text>
            <View style={styles.salaryInputRow}>
              <View style={{ flex: 1 }}>
                <HennaInput
                  placeholder={`Monthly salary (${currencyCode})`}
                  keyboardType="numeric"
                  value={salaryAmt}
                  onChangeText={setSalaryAmt}
                />
              </View>
              <View style={{ flex: 1 }}>
                <HennaInput
                  placeholder="Advance"
                  keyboardType="numeric"
                  value={advanceAmt}
                  onChangeText={setAdvanceAmt}
                />
              </View>
            </View>
            <HennaButton
              title="Save this month"
              icon="check"
              variant="primary"
              size="sm"
              onPress={saveSalary}
              style={{ alignSelf: 'flex-start', marginTop: 10 }}
            />

            {sortedSalary.map(s => {
              const [y, m] = s.month.split('-');
              const due = s.salary - s.advance - s.deduction;
              return (
                <View key={s.id} style={styles.salaryRow}>
                  <View style={styles.salaryHeader}>
                    <Text style={styles.salaryMonth}>{MONTHS[+m - 1]} {y}</Text>
                    <Text style={[styles.salaryDue, { color: due > 0 ? hennaColors.henna : hennaColors.sage }]}>
                      {pkrF(Math.abs(due))} {due > 0 ? 'due' : 'settled'}
                    </Text>
                  </View>
                  <Text style={styles.salaryDetail}>
                    Salary: {pkrF(s.salary)} · Advance: {pkrF(s.advance)}
                    {s.deduction > 0 ? ` · Deduct: ${pkrF(s.deduction)}` : ''}
                  </Text>
                  <Pressable onPress={() => toggleSalaryPaid(s.id)} style={styles.salaryPaidBtn} hitSlop={8}>
                    <Text style={[styles.salaryPaidText, { color: s.paid ? hennaColors.sage : hennaColors.henna }]}>
                      {s.paid ? 'Paid ✓' : 'Mark as paid'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </HennaCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },

  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 6,
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
  heroNum: {
    marginTop: 8,
    fontFamily: hennaFonts.serif,
    fontSize: 42,
    color: hennaColors.ink,
    letterSpacing: -0.5,
  },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  heroBadgesRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  attRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  attBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    minHeight: 40,
  },
  attBtnText: { fontFamily: hennaFonts.uiSemi, fontSize: 12 },

  // Day strip
  dayStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 6,
  },
  dayCell: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: hennaColors.paper,
    borderWidth: 1,
    borderColor: hennaColors.line,
    minHeight: 44,
    justifyContent: 'center',
  },
  dayCellLbl: { fontFamily: hennaFonts.uiSemi, fontSize: 11 },
  dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },

  bodyWrap: { paddingHorizontal: 16, paddingTop: 6 },

  // Daily tasks
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: hennaColors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskName: { flex: 1, fontFamily: hennaFonts.ui, fontSize: 14, color: hennaColors.ink },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: hennaColors.hennaBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add task
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pickerWrapInline: {
    flex: 1,
    backgroundColor: hennaColors.paper2,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    overflow: 'hidden',
    minHeight: 50,
    justifyContent: 'center',
  },

  // Monthly
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayHeaderName: { fontFamily: hennaFonts.serif, fontSize: 15, color: hennaColors.ink },
  monthTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  monthCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: hennaColors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTaskName: { flex: 1, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },

  // Salary
  salaryTitle: { fontFamily: hennaFonts.serif, fontSize: 17, color: hennaColors.ink, marginBottom: 14 },
  salaryInputRow: { flexDirection: 'row', gap: 8 },
  salaryRow: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: hennaColors.line,
  },
  salaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  salaryMonth: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  salaryDue: { fontFamily: hennaFonts.serif, fontSize: 14 },
  salaryDetail: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, marginTop: 4 },
  salaryPaidBtn: { marginTop: 6 },
  salaryPaidText: { fontFamily: hennaFonts.uiSemi, fontSize: 12 },

  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 16, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },
});
