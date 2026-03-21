import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { MonthBar } from '../components/MonthBar';
import { DayStrip } from '../components/DayStrip';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { DAYS, FULL_DAYS, MONTHS, PRESET_TASKS } from '../constants/data';
import { todayDay, todayStr } from '../utils/dates';
import { MaidTask, MaidSalary } from '../types';
import { pkrF } from '../utils/currency';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function MaidScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { maidData, setMaidData, attendance, setAttendance, maidSalary, setMaidSalary } = useData();

  const [filter, setFilter] = useState('all');
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [activeDay, setActiveDay] = useState(todayDay());
  const [customVal, setCustomVal] = useState('');
  const [presetVal, setPresetVal] = useState('');
  const [salaryAmt, setSalaryAmt] = useState('');
  const [advanceAmt, setAdvanceAmt] = useState('');

  const isToday = activeDay === todayDay();
  const td = todayStr();
  const att = attendance[td];

  const toggle = (day: string, idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMaidData((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((t, i) => (i === idx ? { ...t, done: !t.done } : t)),
    }));
  };

  const del = (day: string, idx: number) => {
    setMaidData((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== idx),
    }));
  };

  const addPreset = (day: string, val: string) => {
    if (!val) return;
    const tasks = maidData[day] || [];
    if (tasks.some((t) => t.name.toLowerCase() === val.toLowerCase())) return;
    setMaidData((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { id: Date.now(), name: val, done: false }],
    }));
    setPresetVal('');
  };

  const addCustom = (day: string) => {
    if (!customVal.trim()) return;
    const tasks = maidData[day] || [];
    if (tasks.some((t) => t.name.toLowerCase() === customVal.trim().toLowerCase())) return;
    setMaidData((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { id: Date.now(), name: customVal.trim(), done: false }],
    }));
    setCustomVal('');
  };

  const markAtt = (status: 'Present' | 'Absent' | 'Holiday') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttendance((a) => ({ ...a, [td]: status }));
  };

  const hasDot = (day: string) => (maidData[day]?.length || 0) > 0;

  // Monthly view
  if (filter === 'month') {
    const totalDone = DAYS.reduce((s, d) => s + (maidData[d]?.filter((t) => t.done).length || 0), 0);
    const totalAll = DAYS.reduce((s, d) => s + (maidData[d]?.length || 0), 0);
    const pct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
    const attEntries = Object.entries(attendance);
    const presentDays = attEntries.filter(([, v]) => v === 'Present').length;
    const absentDays = attEntries.filter(([, v]) => v === 'Absent').length;

    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
          <MonthBar
            filter={filter}
            setFilter={setFilter}
            selMonth={selMonth}
            selYear={selYear}
            setSelMonth={setSelMonth}
            setSelYear={setSelYear}
          />
          <View style={styles.titleRow}>
            <View style={styles.section}>
              <Text style={[styles.title, { color: colors.deep }]}>Maid Planner</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {MONTHS[selMonth]} {selYear} overview
              </Text>
            </View>
            <DrawerMenuButton />
          </View>

          {/* Summary card */}
          <Card style={{ borderColor: colors.greenBorder, backgroundColor: colors.greenBg }}>
            <Text style={[styles.summaryTitle, { color: colors.green }]}>🧹 Weekly Chores Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: colors.green }]}>{totalDone}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Done</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: colors.red }]}>{totalAll - totalDone}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Pending</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: colors.gold }]}>{pct}%</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Completion</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: colors.blue }]}>{totalAll}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
              </View>
            </View>

            {attEntries.length > 0 && (
              <View style={styles.attBadgeRow}>
                <View style={[styles.attBadge, { backgroundColor: colors.greenBg, borderColor: colors.greenBorder }]}>
                  <Text style={[styles.attBadgeText, { color: colors.green }]}>✅ Present: {presentDays}</Text>
                </View>
                <View style={[styles.attBadge, { backgroundColor: colors.redBg, borderColor: colors.redBorder }]}>
                  <Text style={[styles.attBadgeText, { color: colors.red }]}>❌ Absent: {absentDays}</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Per-day cards */}
          {DAYS.map((d) => {
            const tasks = maidData[d] || [];
            if (!tasks.length) return null;
            const done = tasks.filter((t) => t.done).length;
            const badgeBg = done === tasks.length ? colors.greenBg : done > 0 ? colors.goldBg : colors.redBg;
            const badgeColor = done === tasks.length ? colors.green : done > 0 ? colors.gold : colors.red;
            const badgeBorder = done === tasks.length ? colors.greenBorder : done > 0 ? colors.goldBorder : colors.redBorder;

            return (
              <Card key={d}>
                <View style={styles.monthDayHeader}>
                  <Text style={[styles.monthDayName, { color: colors.deep }]}>
                    {FULL_DAYS[DAYS.indexOf(d)]}
                  </Text>
                  <View style={[styles.monthDayBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                    <Text style={[styles.monthDayBadgeText, { color: badgeColor }]}>
                      {done}/{tasks.length} done
                    </Text>
                  </View>
                </View>
                {tasks.map((t, i) => (
                  <View key={i} style={[styles.monthTaskRow, { borderTopColor: colors.border }]}>
                    <View
                      style={[
                        styles.monthCheck,
                        { backgroundColor: t.done ? colors.green : 'transparent', borderColor: t.done ? colors.green : colors.muted },
                      ]}
                    >
                      {t.done && <Text style={styles.monthCheckMark}>✓</Text>}
                    </View>
                    <Text
                      style={[
                        styles.monthTaskName,
                        { color: colors.sub },
                        t.done && styles.strikethrough,
                      ]}
                    >
                      {t.name}
                    </Text>
                  </View>
                ))}
              </Card>
            );
          })}
        </ScrollView>
      </LinearGradient>
    );
  }

  // Daily view
  const tasks = maidData[activeDay] || [];
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const added = tasks.map((t) => t.name.toLowerCase());
  const presets = PRESET_TASKS.filter((p) => !added.includes(p.toLowerCase()));

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
      <MonthBar
        filter={filter}
        setFilter={setFilter}
        selMonth={selMonth}
        selYear={selYear}
        setSelMonth={setSelMonth}
        setSelYear={setSelYear}
      />
      <View style={styles.titleRow}>
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.deep }]}>Maid Planner</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Tasks & attendance by day</Text>
        </View>
        <DrawerMenuButton />
      </View>

      <DayStrip
        selected={activeDay}
        onSelect={setActiveDay}
        hasDot={hasDot}
        activeColor={colors.green}
        activeBg={colors.greenBg}
        activeBorder={colors.greenBorder}
        dotColor={colors.green}
      />

      {/* Progress card */}
      <Card>
        <View style={styles.progressHeader}>
          <View>
            <Text style={[styles.dayTitle, { color: colors.deep }]}>
              {FULL_DAYS[DAYS.indexOf(activeDay as typeof DAYS[number])]}
            </Text>
            <Text style={[styles.daySubtitle, { color: colors.muted }]}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              {tasks.length ? ` · ${done} done` : ''}
            </Text>
          </View>
          {tasks.length > 0 ? (
            <Text style={[styles.pctText, { color: colors.green }]}>{pct}%</Text>
          ) : (
            <Text style={[styles.noTasks, { color: colors.muted }]}>No tasks yet</Text>
          )}
        </View>

        {tasks.length > 0 && (
          <View style={styles.progressRow}>
            <View style={{ flex: 1 }}>
              <ProgressBar percent={pct} fillColor={colors.green} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.green }]}>
              {done}/{tasks.length}
            </Text>
          </View>
        )}

        {/* Attendance (today only) */}
        {isToday && (
          <View style={styles.attSection}>
            <Text style={[styles.attLabel, { color: colors.muted }]}>📋 TODAY'S ATTENDANCE</Text>
            <View style={styles.attBtns}>
              {([
                { status: 'Present' as const, color: colors.green, bg: colors.greenBg, border: colors.greenBorder, icon: '✅' },
                { status: 'Absent' as const, color: colors.red, bg: colors.redBg, border: colors.redBorder, icon: '❌' },
                { status: 'Holiday' as const, color: colors.gold, bg: colors.goldBg, border: colors.goldBorder, icon: '🎉' },
              ]).map(({ status, color, bg, border, icon }) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => markAtt(status)}
                  style={[
                    styles.attBtn,
                    {
                      backgroundColor: att === status ? bg : 'transparent',
                      borderColor: att === status ? border : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.attBtnText, { color: att === status ? color : colors.sub }]}>
                    {icon} {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {att && (
              <Text style={[styles.attMarked, { color: colors.sub }]}>
                Marked: <Text style={{ fontFamily: 'Outfit-Bold' }}>{att}</Text>
              </Text>
            )}
          </View>
        )}
      </Card>

      {/* Empty state */}
      {tasks.length === 0 && (
        <EmptyState icon="✨" text={`No tasks for ${activeDay} yet.`} />
      )}

      {/* Task list */}
      {tasks.map((t, i) => (
        <Card key={t.id} style={t.done ? { opacity: 0.7 } : undefined}>
          <View style={styles.taskRow}>
            <TouchableOpacity
              onPress={() => toggle(activeDay, i)}
              style={[
                styles.checkbox,
                {
                  backgroundColor: t.done ? colors.green : 'transparent',
                  borderColor: t.done ? colors.green : colors.muted,
                },
              ]}
            >
              {t.done && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text
              style={[
                styles.taskName,
                { color: colors.text },
                t.done && [styles.strikethrough, { color: colors.muted }],
              ]}
            >
              {t.name}
            </Text>
            <TouchableOpacity onPress={() => del(activeDay, i)} style={styles.delBtn}>
              <Text style={[styles.delBtnText, { color: colors.red }]}>×</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* Add task panel */}
      <Card>
        <Text style={[styles.addLabel, { color: colors.muted }]}>➕ ADD TASK FOR {activeDay.toUpperCase()}</Text>

        <View style={styles.addRow}>
          <View style={[styles.pickerWrap, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
            <Picker
              selectedValue={presetVal}
              onValueChange={(v: string) => setPresetVal(v)}
              style={{ color: colors.text, height: 50, flex: 1 }}
              dropdownIconColor={colors.sub}
            >
              <Picker.Item label="— Pick from list —" value="" style={{ fontSize: 14 }} />
              {presets.map((p) => (
                <Picker.Item key={p} label={p} value={p} style={{ fontSize: 14 }} />
              ))}
            </Picker>
          </View>
          <Button
            title="Add"
            variant="green"
            small
            onPress={() => addPreset(activeDay, presetVal)}
          />
        </View>

        <Text style={[styles.orText, { color: colors.muted }]}>OR TYPE CUSTOM</Text>

        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="e.g. Clean ceiling fans…"
              value={customVal}
              onChangeText={setCustomVal}
              onSubmitEditing={() => addCustom(activeDay)}
            />
          </View>
          <Button
            title="Add"
            variant="green"
            small
            onPress={() => addCustom(activeDay)}
          />
        </View>
      </Card>

      {/* Salary Tracker */}
      <Divider label="Salary Tracker" />
      <Card>
        <Text style={[styles.addLabel, { color: colors.deep }]}>💰 Maid Salary</Text>

        {/* Set/Update salary */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Monthly salary (PKR)" keyboardType="numeric" value={salaryAmt} onChangeText={setSalaryAmt} />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder="Advance given" keyboardType="numeric" value={advanceAmt} onChangeText={setAdvanceAmt} />
          </View>
        </View>
        <Button title="Save This Month" variant="gold" small onPress={() => {
          const now = new Date();
          const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const sal = parseFloat(salaryAmt) || 0;
          const adv = parseFloat(advanceAmt) || 0;
          const existing = maidSalary.find(s => s.month === monthKey);
          if (existing) {
            setMaidSalary(ms => ms.map(s => s.month === monthKey ? { ...s, salary: sal, advance: adv } : s));
          } else {
            setMaidSalary(ms => [...ms, { id: Date.now(), month: monthKey, salary: sal, advance: adv, deduction: 0, paid: false, note: '' }]);
          }
          setSalaryAmt(''); setAdvanceAmt('');
        }} style={{ alignSelf: 'flex-start', marginBottom: 14 }} />

        {/* History */}
        {[...maidSalary].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6).map(s => {
          const [y, m] = s.month.split('-');
          const due = s.salary - s.advance - s.deduction;
          return (
            <View key={s.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 15, color: colors.deep }}>{MONTHS[+m - 1]} {y}</Text>
                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 15, color: due > 0 ? colors.red : colors.green }}>{pkrF(Math.abs(due))} {due > 0 ? 'due' : 'settled'}</Text>
              </View>
              <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: colors.muted, marginTop: 2 }}>
                Salary: {pkrF(s.salary)} · Advance: {pkrF(s.advance)}{s.deduction > 0 ? ` · Deduct: ${pkrF(s.deduction)}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setMaidSalary(ms => ms.map(x => x.id === s.id ? { ...x, paid: !x.paid } : x))} style={{ marginTop: 4 }}>
                <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 12, color: s.paid ? colors.green : colors.gold }}>{s.paid ? '✅ Paid' : 'Mark as Paid'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </Card>
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 18 },
  section: {
    flex: 1,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  // Summary / stats
  summaryTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontFamily: 'Outfit-Bold',
    fontSize: 24,
  },
  statLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  attBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  attBadgeText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 12,
  },
  // Monthly day cards
  monthDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthDayName: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
  },
  monthDayBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  monthDayBadgeText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
  },
  monthTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderTopWidth: 1,
  },
  monthCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthCheckMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  monthTaskName: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    flex: 1,
  },
  // Progress card
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dayTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
  },
  daySubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  pctText: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
  },
  noTasks: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
  // Attendance
  attSection: {
    marginTop: 12,
  },
  attLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  attBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  attBtn: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  attBtnText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
  },
  attMarked: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  // Task list
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  taskName: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    fontSize: 16,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  delBtn: {
    padding: 6,
  },
  delBtnText: {
    fontSize: 22,
    fontWeight: '700',
  },
  // Add task panel
  addLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerWrap: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 14,
    overflow: 'hidden',
    height: 54,
    justifyContent: 'center',
  },
  orText: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginVertical: 8,
  },
});
