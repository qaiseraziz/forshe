import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { MONTHS, CAT_KEYS, CAT_COLORS } from '../constants/data';
import { pkr, pkrF } from '../utils/currency';
import { parseDMY } from '../utils/dates';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function MonthlyReportScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { history, budget } = useData();

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const data = useMemo(() => {
    const monthExpenses = history.filter(h => {
      if (h.type !== 'expense') return false;
      const p = parseDMY(h.date);
      return p && p.m === month && p.y === year;
    });
    const monthTopups = history.filter(h => {
      if (h.type !== 'topup') return false;
      const p = parseDMY(h.date);
      return p && p.m === month && p.y === year;
    });

    const totalExp = monthExpenses.reduce((s, h) => s + h.amount, 0);
    const totalRec = monthTopups.reduce((s, h) => s + h.amount, 0);
    const net = totalRec - totalExp;

    // Category breakdown
    const catMap: Record<string, number> = {};
    monthExpenses.forEach(h => {
      catMap[h.cat] = (catMap[h.cat] || 0) + h.amount;
    });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;

    // Daily spending
    const dailyMap: Record<number, number> = {};
    monthExpenses.forEach(h => {
      const p = parseDMY(h.date);
      if (p) dailyMap[p.d] = (dailyMap[p.d] || 0) + h.amount;
    });
    const dailyEntries = Object.entries(dailyMap).sort((a, b) => +a[0] - +b[0]);
    const maxDaily = dailyEntries.length ? Math.max(...dailyEntries.map(d => d[1])) : 1;

    // Top expenses
    const topExpenses = [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    const avgDaily = monthExpenses.length > 0 ? totalExp / Math.max(Object.keys(dailyMap).length, 1) : 0;

    return { totalExp, totalRec, net, cats, maxCat, dailyEntries, maxDaily, topExpenses, avgDaily, expCount: monthExpenses.length };
  }, [history, month, year]);

  const budgetPct = budget > 0 ? Math.min(Math.round((data.totalExp / budget) * 100), 100) : 0;

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.gold }]}>📊 Monthly Report</Text>
              <Text style={[styles.title, { color: colors.deep }]}>
                {MONTHS[month]} {year}
              </Text>
              <Text style={[styles.subtitle, { color: colors.sub }]}>
                {data.expCount} {data.expCount === 1 ? 'expense' : 'expenses'} tracked
              </Text>
            </View>
          </View>

          {/* Month Navigator */}
          <View style={styles.monthNav}>
            <Button title="← Prev" variant="outline" small onPress={prevMonth} />
            <Button title="Next →" variant="outline" small onPress={nextMonth} />
          </View>
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.overviewVal, { color: colors.green }]}>{pkrF(data.totalRec)}</Text>
              <Text style={[styles.overviewLbl, { color: colors.muted }]}>Received</Text>
            </View>
            <View style={[styles.overviewBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.overviewVal, { color: colors.red }]}>{pkrF(data.totalExp)}</Text>
              <Text style={[styles.overviewLbl, { color: colors.muted }]}>Spent</Text>
            </View>
            <View style={[styles.overviewBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.overviewVal, { color: data.net >= 0 ? colors.green : colors.red }]}>
                {pkrF(data.net)}
              </Text>
              <Text style={[styles.overviewLbl, { color: colors.muted }]}>
                {data.net >= 0 ? 'Saved' : 'Deficit'}
              </Text>
            </View>
            <View style={[styles.overviewBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.overviewVal, { color: colors.gold }]}>{pkrF(data.avgDaily)}</Text>
              <Text style={[styles.overviewLbl, { color: colors.muted }]}>Avg/Day</Text>
            </View>
          </View>

          {budget > 0 && (
            <View style={[styles.budgetSection, { borderTopColor: colors.border }]}>
              <View style={styles.budgetRow}>
                <Text style={[styles.budgetLabel, { color: colors.sub }]}>Budget</Text>
                <Text style={[styles.budgetVal, { color: colors.gold }]}>
                  {budgetPct}% used
                </Text>
              </View>
              <ProgressBar
                percent={budgetPct}
                fillColor={budgetPct > 90 ? colors.red : budgetPct > 70 ? colors.gold : colors.green}
                bgColor={colors.border}
                height={8}
              />
            </View>
          )}
        </Card>

        {/* Category Breakdown */}
        {data.cats.length > 0 && (
          <>
            <Divider label="Category Breakdown" />
            <Card>
              {data.cats.map((c, i) => {
                const catColor = CAT_COLORS[CAT_KEYS.indexOf(c[0]) % CAT_COLORS.length] || colors.gold;
                const pct = Math.round((c[1] / data.maxCat) * 100);
                const share = data.totalExp > 0 ? Math.round((c[1] / data.totalExp) * 100) : 0;
                return (
                  <View key={i} style={styles.catRow}>
                    <View style={styles.catHeader}>
                      <Text style={[styles.catName, { color: colors.sub }]}>{c[0]}</Text>
                      <Text style={[styles.catAmt, { color: colors.deep }]}>{pkrF(c[1])} ({share}%)</Text>
                    </View>
                    <ProgressBar percent={pct} fillColor={catColor} bgColor={colors.border} height={8} />
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* Daily Spending Chart */}
        {data.dailyEntries.length > 0 && (
          <>
            <Divider label="Daily Spending" />
            <Card>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.dailyChart}>
                  {data.dailyEntries.map(([day, amt]) => {
                    const h = Math.max((amt / data.maxDaily) * 120, 8);
                    return (
                      <View key={day} style={styles.dailyBar}>
                        <Text style={[styles.dailyAmt, { color: colors.sub }]}>{pkr(amt)}</Text>
                        <View style={[styles.dailyFill, { height: h, backgroundColor: colors.gold }]} />
                        <Text style={[styles.dailyDay, { color: colors.muted }]}>{day}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </Card>
          </>
        )}

        {/* Top Expenses */}
        {data.topExpenses.length > 0 && (
          <>
            <Divider label="Top 5 Expenses" />
            <Card>
              {data.topExpenses.map((h, i) => (
                <View key={h.id} style={[styles.topRow, i < data.topExpenses.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <Text style={[styles.topRank, { color: colors.gold }]}>#{i + 1}</Text>
                  <View style={styles.topInfo}>
                    <Text style={[styles.topName, { color: colors.deep }]} numberOfLines={1}>{h.label}</Text>
                    <Text style={[styles.topCat, { color: colors.muted }]}>{h.cat} · {h.date}</Text>
                  </View>
                  <Text style={[styles.topAmt, { color: colors.red }]}>{pkrF(h.amount)}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {data.expCount === 0 && (
          <EmptyState icon="📊" text={`No expenses recorded for ${MONTHS[month]} ${year}`} />
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleSection: { flex: 1 },
  title: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 30, lineHeight: 36 },
  subtitle: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 16, marginBottom: 16,
  },
  heroLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 6,
  },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  overviewBox: {
    flexGrow: 1, flexBasis: '46%', borderRadius: 16, padding: 14, alignItems: 'center',
  },
  overviewVal: { fontSize: 18, fontFamily: 'Outfit-Bold' },
  overviewLbl: {
    fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase',
    letterSpacing: 0.8, marginTop: 2,
  },
  budgetSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  budgetRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  budgetLabel: { fontSize: 14, fontFamily: 'Outfit-SemiBold' },
  budgetVal: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  catRow: { marginBottom: 14 },
  catHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  catName: { fontSize: 14, fontFamily: 'Outfit-Regular' },
  catAmt: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  dailyChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingVertical: 10 },
  dailyBar: { alignItems: 'center', width: 40 },
  dailyAmt: { fontSize: 9, fontFamily: 'Outfit-Regular', marginBottom: 4 },
  dailyFill: { width: 24, borderRadius: 6 },
  dailyDay: { fontSize: 11, fontFamily: 'Outfit-SemiBold', marginTop: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  topRank: { fontSize: 16, fontFamily: 'Outfit-Bold', width: 28 },
  topInfo: { flex: 1 },
  topName: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  topCat: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  topAmt: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  bottomPad: { height: 40 },
});
