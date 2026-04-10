import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast, Toast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MEALS, MEAL_ICONS, CAT_KEYS, FULL_DAYS, MONTHS } from '../constants/data';
import { pkr } from '../utils/currency';
import { todayStr, todayDay, fmtISO } from '../utils/dates';
import { gradients } from '../constants/colors';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function TodayScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { history, cooking, maidData, reminders, attendance, setHistory } = useData();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaItem, setQaItem] = useState('');
  const [qaAmt, setQaAmt] = useState('');
  const [qaCat, setQaCat] = useState(CAT_KEYS[0]);
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const openQuickAdd = useCallback(() => setShowQuickAdd(true), []);
  const closeQuickAdd = useCallback(() => setShowQuickAdd(false), []);

  const td = todayStr();
  const day = todayDay();

  const { greeting, fullDate } = useMemo(() => {
    const now = new Date();
    const hr = now.getHours();
    const weekday = FULL_DAYS[(now.getDay() + 6) % 7]; // JS Sunday=0; our FULL_DAYS starts Monday
    return {
      greeting: hr < 12 ? 'Good morning! ☀️' : hr < 17 ? 'Good afternoon! 🌤️' : 'Good evening! 🌙',
      fullDate: `${weekday}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    };
  }, []);

  const totalRec = useMemo(
    () => history.filter(h => h.type === 'topup').reduce((s, h) => s + h.amount, 0),
    [history],
  );
  const totalSpent = useMemo(
    () => history.filter(h => h.type === 'expense').reduce((s, h) => s + h.amount, 0),
    [history],
  );
  const bal = totalRec - totalSpent;

  const todaySpent = useMemo(
    () => history.filter(h => h.type === 'expense' && h.date === td).reduce((s, h) => s + h.amount, 0),
    [history, td],
  );

  const maidTasks = maidData[day] || [];
  const maidDone = maidTasks.filter(t => t.done).length;
  const att = attendance[td];

  const upcomingRems = useMemo(
    () => {
      const n = new Date();
      return reminders.filter(r => {
        const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
        return t >= n && !r.isDone;
      });
    },
    [reminders],
  );

  const dueSoon = useMemo(
    () => {
      const n = new Date();
      return upcomingRems.filter(r => {
        const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
        return (t.getTime() - n.getTime()) / 3600000 <= 26;
      });
    },
    [upcomingRems],
  );

  const meals = useMemo(
    () =>
      MEALS.map(m => ({ m, txt: cooking[`${day}_${m}`] })).filter(x => x.txt),
    [cooking, day],
  );

  const quickAddExpense = useCallback(() => {
    const amt = parseFloat(qaAmt);
    if (!qaItem.trim() || isNaN(amt) || amt <= 0) return;
    const entry = {
      id: Date.now(),
      type: 'expense' as const,
      label: qaItem.trim(),
      amount: amt,
      cat: qaCat,
      date: todayStr(),
    };
    setHistory(h => [entry, ...h]);
    showToast('🛒 ' + qaItem + ' logged');
    setQaItem('');
    setQaAmt('');
    setQaCat(CAT_KEYS[0]);
    setShowQuickAdd(false);
  }, [qaItem, qaAmt, qaCat, setHistory, showToast]);

  const insights = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthExp = history.filter(h => {
      if (h.type !== 'expense') return false;
      const parts = h.date.split('/');
      if (parts.length !== 3) return false;
      return +parts[1] - 1 === thisMonth && +parts[2] === thisYear;
    });
    const lastMonthExp = history.filter(h => {
      if (h.type !== 'expense') return false;
      const parts = h.date.split('/');
      if (parts.length !== 3) return false;
      return +parts[1] - 1 === lastMonth && +parts[2] === lastMonthYear;
    });

    const thisTotal = thisMonthExp.reduce((s, h) => s + h.amount, 0);
    const lastTotal = lastMonthExp.reduce((s, h) => s + h.amount, 0);

    const msgs: string[] = [];
    if (lastTotal > 0 && thisTotal > 0) {
      const pct = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
      if (pct > 0) msgs.push(`📈 Spending is ${pct}% higher than last month`);
      else if (pct < -5) msgs.push(`📉 Great! Spending is ${Math.abs(pct)}% lower than last month`);
      else msgs.push(`📊 Spending is about the same as last month`);
    }

    // Top category this month
    const catMap: Record<string, number> = {};
    thisMonthExp.forEach(h => { catMap[h.cat] = (catMap[h.cat] || 0) + h.amount; });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    if (topCat) msgs.push(`🏆 Top category: ${topCat[0]}`);

    // Average daily
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
    const daysPassed = Math.min(now.getDate(), daysInMonth);
    if (thisTotal > 0) {
      const avg = Math.round(thisTotal / daysPassed);
      msgs.push(`💡 Avg daily spend: Rs ${avg.toLocaleString()}`);
    }

    return msgs;
  }, [history]);

  const weeklySpend = useMemo(() => {
    const today = new Date();
    const days: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const dateStr = `${dd}/${mm}/${yyyy}`;
      const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const amt = history.filter(h => h.type === 'expense' && h.date === dateStr).reduce((s, h) => s + h.amount, 0);
      days.push({ label: dayLabel, amount: amt });
    }
    return days;
  }, [history]);

  const maxWeekly = useMemo(() => Math.max(...weeklySpend.map(d => d.amount), 1), [weeklySpend]);

  const statBoxes = useMemo(() => [
    {
      ico: '💰',
      val: pkr(Math.abs(bal)),
      lbl: bal < 0 ? 'Overspent' : 'Balance',
      c: bal < 0 ? colors.red : colors.green,
      tab: 'Expenses',
    },
    {
      ico: '🛒',
      val: pkr(todaySpent),
      lbl: 'Spent Today',
      c: colors.red,
      tab: 'Expenses',
    },
    {
      ico: '🧹',
      val: `${maidDone}/${maidTasks.length}${att ? ' · ' + att.charAt(0) : ''}`,
      lbl: 'Maid Tasks',
      c: colors.green,
      tab: 'Maid',
    },
    {
      ico: '🔔',
      val: String(upcomingRems.length),
      lbl: 'Reminders',
      c: colors.purple,
      tab: 'Reminders',
    },
  ], [bal, todaySpent, maidDone, maidTasks.length, att, upcomingRems.length, colors]);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={[styles.heroLabel, { color: colors.gold }]}>🏠 Today's Overview</Text>
            <DrawerMenuButton />
          </View>
          <Text style={[styles.heroGreeting, { color: colors.deep }]}>{greeting}</Text>
          <Text style={[styles.heroDate, { color: colors.sub }]}>{fullDate}</Text>

          {/* Stat Grid */}
          <View style={styles.statGrid}>
            {statBoxes.map((b, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.statBox, { backgroundColor: colors.bg2, shadowColor: colors.shadow }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(b.tab)}
              >
                <Text style={styles.statIcon}>{b.ico}</Text>
                <Text style={[styles.statVal, { color: b.c }]}>{b.val}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{b.lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weekly Trend */}
          <View style={[styles.weeklySection, { borderTopColor: colors.border }]}>
            <Text style={[styles.weeklyLabel, { color: colors.muted }]}>Last 7 Days</Text>
            <View style={styles.weeklyBars}>
              {weeklySpend.map((d, i) => (
                <View key={i} style={styles.weeklyBarCol}>
                  <View style={[styles.weeklyBar, { height: Math.max((d.amount / maxWeekly) * 40, 3), backgroundColor: d.amount > 0 ? colors.gold : colors.border }]} />
                  <Text style={[styles.weeklyDay, { color: colors.muted }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.deep }]}>💡 Insights</Text>
            <Card>
              {insights.map((msg, i) => (
                <Text key={i} style={[styles.insightText, { color: colors.sub }, i < insights.length - 1 && { marginBottom: 10 }]}>
                  {msg}
                </Text>
              ))}
            </Card>
          </View>
        )}

        {/* Due Soon */}
        {dueSoon.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.deep }]}>🔔 Due Soon</Text>
            {dueSoon.map(r => (
              <View
                key={r.id}
                style={[
                  styles.dueSoonItem,
                  { backgroundColor: colors.bg3, shadowColor: colors.shadow },
                ]}
              >
                <Text style={styles.dueSoonIcon}>{r.cat.split(' ')[0] || '📋'}</Text>
                <View style={styles.dueSoonContent}>
                  <Text style={[styles.dueSoonTitle, { color: colors.deep }]}>{r.title}</Text>
                  <Text style={[styles.dueSoonMeta, { color: colors.muted }]}>
                    {fmtISO(r.date)}
                    {r.time ? ' at ' + r.time : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Today's Meals */}
        {meals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.deep }]}>🍳 Today's Meals</Text>
            <Card>
              {meals.map((x, i) => (
                <View
                  key={i}
                  style={[
                    styles.mealRow,
                    i < meals.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={styles.mealIcon}>{MEAL_ICONS[x.m]}</Text>
                  <Text style={[styles.mealLabel, { color: colors.sub }]}>{x.m}</Text>
                  <Text style={[styles.mealText, { color: colors.deep }]}>{x.txt}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Today's Maid Tasks */}
        {maidTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.deep }]}>🧹 Today's Tasks</Text>
            <Card>
              {maidTasks.slice(0, 5).map((t, i) => (
                <View
                  key={t.id}
                  style={[
                    styles.taskRow,
                    i < Math.min(maidTasks.length, 5) - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.taskCheck,
                      { backgroundColor: t.done ? colors.green : colors.border },
                    ]}
                  >
                    {t.done && <Text style={styles.taskCheckMark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.taskName,
                      { color: colors.sub },
                      t.done && styles.taskDone,
                    ]}
                  >
                    {t.name}
                  </Text>
                </View>
              ))}
              {maidTasks.length > 5 && (
                <Text style={[styles.moreText, { color: colors.muted }]}>
                  +{maidTasks.length - 5} more tasks
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* Empty state if nothing */}
        {dueSoon.length === 0 && meals.length === 0 && maidTasks.length === 0 && (
          <EmptyState icon="✨" text="No tasks, meals, or reminders for today. Enjoy your day!" />
        )}
      </ScrollView>

      {/* Quick Add FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.gold }]}
        activeOpacity={0.85}
        onPress={openQuickAdd}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Quick Add Modal */}
      <Modal visible={showQuickAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.modalTitle, { color: colors.deep }]}>Quick Add Expense</Text>
            <Input
              placeholder="What did you buy?"
              value={qaItem}
              onChangeText={setQaItem}
              style={{ marginBottom: 12 }}
            />
            <Input
              placeholder="Amount in PKR"
              keyboardType="numeric"
              value={qaAmt}
              onChangeText={setQaAmt}
              style={{ marginBottom: 12 }}
            />
            <View style={[styles.pickerWrapper, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
              <Picker
                selectedValue={qaCat}
                onValueChange={setQaCat}
                style={{ color: colors.deep }}
                dropdownIconColor={colors.muted}
              >
                {CAT_KEYS.map(k => (
                  <Picker.Item key={k} label={k} value={k} />
                ))}
              </Picker>
            </View>
            <View style={styles.modalBtns}>
              <Button title="Add" variant="gold" onPress={quickAddExpense} style={{ flex: 1 }} />
              <Button title="Cancel" variant="outline" onPress={closeQuickAdd} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroCard: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroGreeting: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 30,
    lineHeight: 36,
  },
  heroDate: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    marginTop: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  statBox: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: 20,
    borderWidth: 0,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statVal: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginBottom: 12,
  },
  dueSoonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderWidth: 0,
    borderRadius: 16,
    marginBottom: 7,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  dueSoonIcon: {
    fontSize: 18,
  },
  dueSoonContent: {
    flex: 1,
  },
  dueSoonTitle: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  dueSoonMeta: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  mealIcon: {
    fontSize: 18,
  },
  mealLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
  },
  mealText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  taskCheck: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckMark: {
    fontSize: 11,
    color: '#fff',
  },
  taskName: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
  },
  taskDone: {
    textDecorationLine: 'line-through',
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    paddingTop: 6,
  },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#c8860a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabIcon: { fontSize: 28, color: '#fff', fontFamily: 'Outfit-Bold', lineHeight: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, marginBottom: 16 },
  pickerWrapper: { borderRadius: 12, borderWidth: 0, marginBottom: 16, overflow: 'hidden' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  insightText: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22 },
  weeklySection: { marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  weeklyLabel: { fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  weeklyBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, height: 50 },
  weeklyBarCol: { flex: 1, alignItems: 'center' },
  weeklyBar: { width: '80%', borderRadius: 4, minHeight: 3 },
  weeklyDay: { fontSize: 10, fontFamily: 'Outfit-Regular', marginTop: 4 },
});
