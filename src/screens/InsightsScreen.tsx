import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { MONTHS, CAT_KEYS, CAT_COLORS } from '../constants/data';
import { parseDMY } from '../utils/dates';

const { width: screenWidth } = Dimensions.get('window');

export default function InsightsScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { history } = useData();
  const { pkrF } = useCurrency();

  const now = useMemo(() => new Date(), []);

  // ---- 6-month trend ----
  const trend = useMemo(() => {
    const months: { label: string; total: number; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: MONTHS[d.getMonth()].slice(0, 3),
        total: 0,
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    history.forEach(h => {
      if (h.type !== 'expense') return;
      const p = parseDMY(h.date);
      if (!p) return;
      const hit = months.find(m => m.year === p.y && m.month === p.m);
      if (hit) hit.total += h.amount;
    });
    return months;
  }, [history, now]);

  const maxTrend = useMemo(() => Math.max(1, ...trend.map(t => t.total)), [trend]);

  // ---- Category breakdown (current month) ----
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach(h => {
      if (h.type !== 'expense') return;
      const p = parseDMY(h.date);
      if (!p || p.m !== now.getMonth() || p.y !== now.getFullYear()) return;
      map[h.cat] = (map[h.cat] || 0) + h.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [history, now]);

  const totalThisMonth = useMemo(() => catBreakdown.reduce((s, [, v]) => s + v, 0), [catBreakdown]);

  // ---- Top 5 expenses this month ----
  const top5 = useMemo(() => {
    return history
      .filter(h => {
        if (h.type !== 'expense') return false;
        const p = parseDMY(h.date);
        return p && p.m === now.getMonth() && p.y === now.getFullYear();
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [history, now]);

  // ---- Month-over-month comparison ----
  const compare = useMemo(() => {
    const current = trend[trend.length - 1]?.total || 0;
    const prev = trend[trend.length - 2]?.total || 0;
    const delta = current - prev;
    const pct = prev > 0 ? Math.round((delta / prev) * 100) : null;
    return { current, prev, delta, pct };
  }, [trend]);

  // ---- Daily average (based on day-of-month so far) ----
  const dailyAvg = useMemo(() => {
    const day = now.getDate();
    if (day === 0) return 0;
    return compare.current / day;
  }, [compare.current, now]);

  // Chart data for gifted-charts
  const barData = useMemo(() => trend.map(t => ({
    value: t.total,
    label: t.label,
    frontColor: colors.gold,
    topLabelComponent: t.total > 0 ? (() => (
      <Text style={{ color: colors.muted, fontSize: 9, fontFamily: 'Outfit-Regular', marginBottom: 2 }}>
        {Math.round(t.total / 1000) + 'k'}
      </Text>
    )) : undefined,
  })), [trend, colors.gold, colors.muted]);

  const pieData = useMemo(() => catBreakdown.map(([cat, val], i) => {
    const catIdx = CAT_KEYS.indexOf(cat);
    const color = catIdx >= 0 ? CAT_COLORS[catIdx % CAT_COLORS.length] : CAT_COLORS[i % CAT_COLORS.length];
    return { value: val, color, text: totalThisMonth > 0 ? Math.round((val / totalThisMonth) * 100) + '%' : '' };
  }), [catBreakdown, totalThisMonth]);

  // Arrow + color for comparison
  const arrow = compare.delta > 0 ? '↑' : compare.delta < 0 ? '↓' : '→';
  const compareColor = compare.delta > 0 ? colors.red : compare.delta < 0 ? colors.green : colors.muted;

  const hasAnyExpenses = history.some(h => h.type === 'expense');
  const chartWidth = screenWidth - 80;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card gradient={dark ? gradients.purpleHeroDark : gradients.purpleHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.purple }]}>📈 Insights</Text>
              <Text style={[styles.heroNum, { color: colors.purple }]}>{pkrF(compare.current)}</Text>
              <Text style={[styles.heroSub, { color: colors.sub }]}>
                {MONTHS[now.getMonth()]} {now.getFullYear()} · {dailyAvg > 0 ? `${pkrF(dailyAvg)}/day` : 'No spending yet'}
              </Text>
            </View>
          </View>
        </Card>

        {!hasAnyExpenses ? (
          <EmptyState
            icon="📈"
            text="No expense data to analyse yet."
            hint="Log some expenses and come back to see your trends."
          />
        ) : (
          <>
            {/* Comparison widget */}
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>THIS MONTH vs LAST</Text>
              <View style={styles.compareRow}>
                <View style={styles.compareBox}>
                  <Text style={[styles.compareVal, { color: colors.deep }]}>{pkrF(compare.current)}</Text>
                  <Text style={[styles.compareLbl, { color: colors.muted }]}>This month</Text>
                </View>
                <Text style={[styles.arrow, { color: compareColor }]}>{arrow}</Text>
                <View style={styles.compareBox}>
                  <Text style={[styles.compareVal, { color: colors.sub }]}>{pkrF(compare.prev)}</Text>
                  <Text style={[styles.compareLbl, { color: colors.muted }]}>Last month</Text>
                </View>
              </View>
              {compare.pct !== null && (
                <View style={styles.deltaRow}>
                  <Badge
                    text={`${compare.delta >= 0 ? '+' : ''}${compare.pct}%`}
                    bg={compare.delta > 0 ? colors.redBg : compare.delta < 0 ? colors.greenBg : colors.bg3}
                    color={compareColor}
                  />
                  <Text style={[styles.deltaText, { color: colors.sub }]}>
                    {compare.delta > 0
                      ? `Spending up by ${pkrF(Math.abs(compare.delta))}`
                      : compare.delta < 0
                        ? `Saved ${pkrF(Math.abs(compare.delta))} vs last month`
                        : 'Same as last month'}
                  </Text>
                </View>
              )}
              <View style={[styles.avgRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.avgLbl, { color: colors.muted }]}>Daily average</Text>
                <Text style={[styles.avgVal, { color: colors.gold }]}>{pkrF(dailyAvg)}</Text>
              </View>
            </Card>

            {/* Trend bar chart */}
            <Divider label="6-Month Spending Trend" />
            <Card>
              {maxTrend > 0 ? (
                <View style={styles.chartWrap}>
                  <BarChart
                    data={barData}
                    width={chartWidth}
                    height={180}
                    barWidth={24}
                    spacing={20}
                    barBorderRadius={6}
                    yAxisColor={colors.border}
                    xAxisColor={colors.border}
                    yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.muted, fontSize: 11, fontFamily: 'Outfit-SemiBold' }}
                    noOfSections={4}
                    maxValue={maxTrend * 1.15}
                    hideRules
                    initialSpacing={10}
                    endSpacing={10}
                    isAnimated
                  />
                </View>
              ) : (
                <Text style={[styles.emptyNote, { color: colors.muted }]}>Not enough data yet.</Text>
              )}
            </Card>

            {/* Category pie */}
            {pieData.length > 0 && (
              <>
                <Divider label={`Category Breakdown · ${MONTHS[now.getMonth()]}`} />
                <Card>
                  <View style={styles.pieWrap}>
                    <PieChart
                      data={pieData}
                      radius={90}
                      innerRadius={50}
                      innerCircleColor={colors.bg2}
                      centerLabelComponent={() => (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={[styles.pieCenterVal, { color: colors.deep }]}>{pkrF(totalThisMonth)}</Text>
                          <Text style={[styles.pieCenterLbl, { color: colors.muted }]}>Total</Text>
                        </View>
                      )}
                      showText={false}
                      strokeWidth={1}
                      strokeColor={colors.bg2}
                    />
                  </View>
                  <View style={styles.legendWrap}>
                    {catBreakdown.map(([cat, val], i) => {
                      const catIdx = CAT_KEYS.indexOf(cat);
                      const color = catIdx >= 0 ? CAT_COLORS[catIdx % CAT_COLORS.length] : CAT_COLORS[i % CAT_COLORS.length];
                      const pct = totalThisMonth > 0 ? Math.round((val / totalThisMonth) * 100) : 0;
                      return (
                        <View key={cat} style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: color }]} />
                          <Text style={[styles.legendLabel, { color: colors.sub }]} numberOfLines={1}>{cat}</Text>
                          <Text style={[styles.legendVal, { color: colors.deep }]}>{pkrF(val)}</Text>
                          <Text style={[styles.legendPct, { color: colors.muted }]}>{pct}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              </>
            )}

            {/* Top 5 */}
            {top5.length > 0 && (
              <>
                <Divider label="Top 5 Expenses This Month" />
                <Card>
                  {top5.map((h, i) => (
                    <View
                      key={h.id}
                      style={[
                        styles.topRow,
                        i < top5.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.topRank, { color: colors.purple }]}>#{i + 1}</Text>
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
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
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
  sectionLabel: { fontSize: 11, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  compareBox: { flex: 1, alignItems: 'center' },
  compareVal: { fontSize: 20, fontFamily: 'Outfit-Bold' },
  compareLbl: { fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  arrow: { fontSize: 32, fontFamily: 'Outfit-Bold' },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  deltaText: { fontSize: 13, fontFamily: 'Outfit-Regular', flex: 1 },
  avgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  avgLbl: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  avgVal: { fontSize: 18, fontFamily: 'Outfit-Bold' },
  chartWrap: { alignItems: 'center' },
  emptyNote: { fontSize: 13, fontFamily: 'Outfit-Regular', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  pieWrap: { alignItems: 'center', marginBottom: 16 },
  pieCenterVal: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  pieCenterLbl: { fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  legendWrap: { marginTop: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, fontFamily: 'Outfit-Regular' },
  legendVal: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  legendPct: { fontSize: 11, fontFamily: 'Outfit-Regular', width: 36, textAlign: 'right' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  topRank: { fontSize: 16, fontFamily: 'Outfit-Bold', width: 28 },
  topInfo: { flex: 1, minWidth: 0 },
  topName: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  topCat: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  topAmt: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  bottomPad: { height: 40 },
});
