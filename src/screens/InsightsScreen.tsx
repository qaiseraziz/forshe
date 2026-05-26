import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { MONTHS, CAT_KEYS } from '../constants/data';
import { parseDMY } from '../utils/dates';
import { SkeletonChart } from '../components/ui/Skeleton';
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
  HennaCard,
  HennaBadge,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
  DividerOrnament,
} from '../components/henna';

const { width: screenWidth } = Dimensions.get('window');

// Henna palette for category breakdown — cycles through the 6 accents.
const HENNA_CHART_COLORS = [
  hennaColors.henna,
  hennaColors.sage,
  hennaColors.bronze,
  hennaColors.plum,
  hennaColors.pink,
  hennaColors.dust,
];

function splitFlourish(formatted: string): { head: string; tail: string } {
  if (formatted.length <= 3) return { head: '', tail: formatted };
  return { head: formatted.slice(0, -3), tail: formatted.slice(-3) };
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { history, allLoaded } = useData();
  const { pkrF } = useCurrency();

  const now = useMemo(() => new Date(), []);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

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

  const compare = useMemo(() => {
    const current = trend[trend.length - 1]?.total || 0;
    const prev = trend[trend.length - 2]?.total || 0;
    const delta = current - prev;
    const pct = prev > 0 ? Math.round((delta / prev) * 100) : null;
    return { current, prev, delta, pct };
  }, [trend]);

  const dailyAvg = useMemo(() => {
    const day = now.getDate();
    if (day === 0) return 0;
    return compare.current / day;
  }, [compare.current, now]);

  const barData = useMemo(
    () =>
      trend.map(t => ({
        value: t.total,
        label: t.label,
        frontColor: hennaColors.henna,
        topLabelComponent:
          t.total > 0
            ? () => (
                <Text
                  style={{
                    color: hennaColors.muted,
                    fontSize: 9,
                    fontFamily: hennaFonts.ui,
                    marginBottom: 2,
                  }}
                >
                  {Math.round(t.total / 1000) + 'k'}
                </Text>
              )
            : undefined,
      })),
    [trend],
  );

  const pieData = useMemo(
    () =>
      catBreakdown.map(([cat, val], i) => {
        const catIdx = CAT_KEYS.indexOf(cat);
        const idx = catIdx >= 0 ? catIdx % HENNA_CHART_COLORS.length : i % HENNA_CHART_COLORS.length;
        const color = HENNA_CHART_COLORS[idx];
        return {
          value: val,
          color,
          text: totalThisMonth > 0 ? Math.round((val / totalThisMonth) * 100) + '%' : '',
        };
      }),
    [catBreakdown, totalThisMonth],
  );

  const arrow = compare.delta > 0 ? '↑' : compare.delta < 0 ? '↓' : '→';
  const compareColor =
    compare.delta > 0 ? hennaColors.henna : compare.delta < 0 ? hennaColors.sage : hennaColors.muted;

  const hasAnyExpenses = history.some(h => h.type === 'expense');
  const chartWidth = screenWidth - 80;
  const currentSplit = splitFlourish(pkrF(compare.current));

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader
          title="Insights"
          subtitle={`${MONTHS[now.getMonth()]} ${now.getFullYear()}`}
          onMenu={onMenu}
        />

        {/* Hero — plum */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroPlum}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.plum} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.plum} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.plum }]}>This month</Text>
              </View>
              <Text style={styles.heroNum}>
                {currentSplit.head}
                <Text style={styles.heroNumTail}>{currentSplit.tail}</Text>
              </Text>
              <Text style={styles.heroSub}>
                {dailyAvg > 0 ? `${pkrF(dailyAvg)}/day on average` : 'No spending yet'}
              </Text>
            </View>
          </View>
        </View>

        {!allLoaded ? (
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <SkeletonChart />
            <SkeletonChart />
          </View>
        ) : !hasAnyExpenses ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Insights need data.</Text>
            <Text style={styles.emptyHint}>Log a few expenses and trends will appear here.</Text>
          </View>
        ) : (
          <View style={styles.body}>
            {/* Comparison */}
            <HennaCard padding={18} style={{ marginBottom: 14 }}>
              <Text style={[hennaTextStyles.eyebrow, { marginBottom: 14 }]}>
                This month vs last
              </Text>
              <View style={styles.compareRow}>
                <View style={styles.compareBox}>
                  <Text style={styles.compareVal}>{pkrF(compare.current)}</Text>
                  <Text style={styles.compareLbl}>This month</Text>
                </View>
                <Text style={[styles.arrow, { color: compareColor }]}>{arrow}</Text>
                <View style={styles.compareBox}>
                  <Text style={[styles.compareVal, { color: hennaColors.muted }]}>{pkrF(compare.prev)}</Text>
                  <Text style={styles.compareLbl}>Last month</Text>
                </View>
              </View>
              {compare.pct !== null && (
                <View style={styles.deltaRow}>
                  <HennaBadge accent={compare.delta > 0 ? 'henna' : compare.delta < 0 ? 'sage' : 'dust'}>
                    {`${compare.delta >= 0 ? '+' : ''}${compare.pct}%`}
                  </HennaBadge>
                  <Text style={styles.deltaText}>
                    {compare.delta > 0
                      ? `Up by ${pkrF(Math.abs(compare.delta))}`
                      : compare.delta < 0
                        ? `Saved ${pkrF(Math.abs(compare.delta))}`
                        : 'Same as last month'}
                  </Text>
                </View>
              )}
              <View style={styles.avgRow}>
                <Text style={styles.avgLbl}>Daily average</Text>
                <Text style={styles.avgVal}>{pkrF(dailyAvg)}</Text>
              </View>
            </HennaCard>

            {/* Trend bar chart */}
            <DividerOrnament color={hennaColors.plum} />
            <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>6-month trend</Text>
            <HennaCard padding={18} style={{ marginBottom: 14 }}>
              {maxTrend > 0 ? (
                <View style={styles.chartWrap}>
                  <BarChart
                    data={barData}
                    width={chartWidth}
                    height={180}
                    barWidth={24}
                    spacing={20}
                    barBorderRadius={6}
                    yAxisColor={hennaColors.line}
                    xAxisColor={hennaColors.line}
                    yAxisTextStyle={{ color: hennaColors.muted, fontSize: 10 }}
                    xAxisLabelTextStyle={{
                      color: hennaColors.muted,
                      fontSize: 11,
                      fontFamily: hennaFonts.uiSemi,
                    }}
                    noOfSections={4}
                    maxValue={maxTrend * 1.15}
                    hideRules
                    initialSpacing={10}
                    endSpacing={10}
                    isAnimated
                  />
                </View>
              ) : (
                <Text style={styles.emptyNote}>Not enough data yet.</Text>
              )}
            </HennaCard>

            {/* Category pie */}
            {pieData.length > 0 && (
              <>
                <DividerOrnament color={hennaColors.henna} />
                <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>
                  Category breakdown · {MONTHS[now.getMonth()]}
                </Text>
                <HennaCard padding={18} style={{ marginBottom: 14 }}>
                  <View style={styles.pieWrap}>
                    <PieChart
                      data={pieData}
                      radius={90}
                      innerRadius={50}
                      innerCircleColor={hennaColors.paper}
                      centerLabelComponent={() => (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={styles.pieCenterVal}>{pkrF(totalThisMonth)}</Text>
                          <Text style={styles.pieCenterLbl}>Total</Text>
                        </View>
                      )}
                      showText={false}
                      strokeWidth={1}
                      strokeColor={hennaColors.paper}
                    />
                  </View>
                  <View style={styles.legendWrap}>
                    {catBreakdown.map(([cat, val], i) => {
                      const catIdx = CAT_KEYS.indexOf(cat);
                      const idx = catIdx >= 0 ? catIdx % HENNA_CHART_COLORS.length : i % HENNA_CHART_COLORS.length;
                      const color = HENNA_CHART_COLORS[idx];
                      const pct = totalThisMonth > 0 ? Math.round((val / totalThisMonth) * 100) : 0;
                      return (
                        <View key={cat} style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: color }]} />
                          <Text style={styles.legendLabel} numberOfLines={1}>{cat}</Text>
                          <Text style={styles.legendVal}>{pkrF(val)}</Text>
                          <Text style={styles.legendPct}>{pct}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </HennaCard>
              </>
            )}

            {/* Top 5 */}
            {top5.length > 0 && (
              <>
                <DividerOrnament color={hennaColors.bronze} />
                <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>
                  Top 5 expenses this month
                </Text>
                <HennaCard padding={0} style={{ marginBottom: 14 }}>
                  {top5.map((h, i) => (
                    <View
                      key={h.id}
                      style={[
                        styles.topRow,
                        i < top5.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: hennaColors.line,
                        },
                      ]}
                    >
                      <Text style={styles.topRank}>#{i + 1}</Text>
                      <View style={styles.topInfo}>
                        <Text style={styles.topName} numberOfLines={1}>{h.label}</Text>
                        <Text style={styles.topCat}>{h.cat} · {h.date}</Text>
                      </View>
                      <Text style={styles.topAmt}>{pkrF(h.amount)}</Text>
                    </View>
                  ))}
                </HennaCard>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },

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
  heroNumTail: { fontFamily: hennaFonts.flourish, color: hennaColors.plum },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },

  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },

  body: { paddingHorizontal: 16, paddingTop: 18 },
  sectionEyebrow: { paddingHorizontal: 8, paddingBottom: 10, paddingTop: 10 },

  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  compareBox: { flex: 1, alignItems: 'center' },
  compareVal: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink },
  compareLbl: {
    marginTop: 2,
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    color: hennaColors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  arrow: { fontSize: 28, fontFamily: hennaFonts.uiSemi },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  deltaText: { flex: 1, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: hennaColors.line,
  },
  avgLbl: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.ink2 },
  avgVal: { fontFamily: hennaFonts.serif, fontSize: 16, color: hennaColors.henna },

  chartWrap: { alignItems: 'center' },
  emptyNote: {
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    fontStyle: 'italic',
    color: hennaColors.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  pieWrap: { alignItems: 'center', marginBottom: 16 },
  pieCenterVal: { fontFamily: hennaFonts.serif, fontSize: 15, color: hennaColors.ink },
  pieCenterLbl: { fontFamily: hennaFonts.uiSemi, fontSize: 10, color: hennaColors.muted, marginTop: 2 },
  legendWrap: { marginTop: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  legendVal: { fontFamily: hennaFonts.uiSemi, fontSize: 12, color: hennaColors.ink },
  legendPct: { width: 36, textAlign: 'right', fontFamily: hennaFonts.ui, fontSize: 10, color: hennaColors.muted },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  topRank: { width: 28, fontFamily: hennaFonts.serif, fontSize: 15, color: hennaColors.plum },
  topInfo: { flex: 1, minWidth: 0 },
  topName: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.ink },
  topCat: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, marginTop: 2 },
  topAmt: { fontFamily: hennaFonts.serif, fontSize: 14, color: hennaColors.henna },
});
