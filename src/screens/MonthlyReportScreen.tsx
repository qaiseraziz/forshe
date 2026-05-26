import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { MONTHS, CAT_KEYS, SAVINGS_CAT } from '../constants/data';
import { parseDMY } from '../utils/dates';
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
  HennaProgress,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
  DividerOrnament,
} from '../components/henna';

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

export default function MonthlyReportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { history, budget } = useData();
  const { pkr, pkrF } = useCurrency();

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

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

    const catMap: Record<string, number> = {};
    monthExpenses.forEach(h => {
      catMap[h.cat] = (catMap[h.cat] || 0) + h.amount;
    });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;

    const dailyMap: Record<number, number> = {};
    monthExpenses.forEach(h => {
      const p = parseDMY(h.date);
      if (p) dailyMap[p.d] = (dailyMap[p.d] || 0) + h.amount;
    });
    const dailyEntries = Object.entries(dailyMap).sort((a, b) => +a[0] - +b[0]);
    const maxDaily = dailyEntries.length ? Math.max(...dailyEntries.map(d => d[1])) : 1;

    const topExpenses = [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const avgDaily =
      monthExpenses.length > 0 ? totalExp / Math.max(Object.keys(dailyMap).length, 1) : 0;
    const savingsThisMonth = monthExpenses
      .filter(h => h.cat === SAVINGS_CAT)
      .reduce((s, h) => s + h.amount, 0);

    return {
      totalExp,
      totalRec,
      net,
      cats,
      maxCat,
      dailyEntries,
      maxDaily,
      topExpenses,
      avgDaily,
      expCount: monthExpenses.length,
      savingsThisMonth,
    };
  }, [history, month, year]);

  const budgetPct = budget > 0 ? Math.min(Math.round((data.totalExp / budget) * 100), 100) : 0;

  const prevMonth = useCallback(() => {
    Haptics.selectionAsync();
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    Haptics.selectionAsync();
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else setMonth(m => m + 1);
  }, [month]);

  const netSplit = splitFlourish(pkrF(data.net));

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader
          title="Monthly Report"
          subtitle={`${data.expCount} ${data.expCount === 1 ? 'expense' : 'expenses'} tracked`}
          onMenu={onMenu}
        />

        {/* Hero — bronze */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroBronze}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.bronze} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.bronze} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.bronze }]}>
                  {MONTHS[month]} {year}
                </Text>
              </View>
              <Text
                style={[
                  styles.heroNum,
                  { color: data.net < 0 ? hennaColors.henna : hennaColors.ink },
                ]}
              >
                {netSplit.head}
                <Text style={[
                  styles.heroNumTail,
                  { color: data.net < 0 ? hennaColors.henna : hennaColors.bronze },
                ]}>{netSplit.tail}</Text>
              </Text>
              <Text style={styles.heroSub}>
                {data.net >= 0 ? 'Saved this month' : 'Deficit'}
              </Text>

              {/* Overview grid (5 boxes) */}
              <View style={styles.overviewGrid}>
                <View style={styles.overviewBox}>
                  <Text style={[styles.overviewVal, { color: hennaColors.sage }]}>{pkr(data.totalRec)}</Text>
                  <Text style={styles.overviewLbl}>Received</Text>
                </View>
                <View style={styles.overviewBox}>
                  <Text style={[styles.overviewVal, { color: hennaColors.henna }]}>{pkr(data.totalExp)}</Text>
                  <Text style={styles.overviewLbl}>Spent</Text>
                </View>
                <View style={styles.overviewBox}>
                  <Text style={[styles.overviewVal, { color: hennaColors.bronze }]}>{pkr(data.avgDaily)}</Text>
                  <Text style={styles.overviewLbl}>Avg/day</Text>
                </View>
                <View style={styles.overviewBox}>
                  <Text style={[styles.overviewVal, { color: hennaColors.pink }]}>{pkr(data.savingsThisMonth)}</Text>
                  <Text style={styles.overviewLbl}>Savings</Text>
                </View>
              </View>

              {budget > 0 && (
                <View style={styles.budgetSection}>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Budget</Text>
                    <Text style={styles.budgetVal}>{budgetPct}% used</Text>
                  </View>
                  <HennaProgress
                    value={data.totalExp}
                    max={budget}
                    accent={budgetPct > 90 ? 'henna' : budgetPct > 70 ? 'bronze' : 'sage'}
                    height={8}
                  />
                </View>
              )}

              <View style={styles.navRow}>
                <HennaButton title="← Prev" variant="outline" size="sm" onPress={prevMonth} />
                <View style={{ flex: 1 }} />
                <HennaButton title="Next →" variant="outline" size="sm" onPress={nextMonth} />
              </View>
            </View>
          </View>
        </View>

        {/* Category breakdown */}
        {data.cats.length > 0 && (
          <>
            <DividerOrnament color={hennaColors.henna} />
            <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Category breakdown</Text>
            <View style={styles.body}>
              <HennaCard padding={18} style={{ marginBottom: 14 }}>
                {data.cats.map((c, i) => {
                  const catIdx = CAT_KEYS.indexOf(c[0]);
                  const colorIdx = catIdx >= 0 ? catIdx % HENNA_CHART_COLORS.length : i % HENNA_CHART_COLORS.length;
                  const accent: 'henna' | 'sage' | 'bronze' | 'plum' = (() => {
                    const a = HENNA_CHART_COLORS[colorIdx];
                    if (a === hennaColors.sage) return 'sage';
                    if (a === hennaColors.bronze) return 'bronze';
                    if (a === hennaColors.plum) return 'plum';
                    return 'henna';
                  })();
                  const share = data.totalExp > 0 ? Math.round((c[1] / data.totalExp) * 100) : 0;
                  return (
                    <View key={c[0]} style={styles.catRow}>
                      <View style={styles.catHeader}>
                        <Text style={styles.catName}>{c[0]}</Text>
                        <Text style={styles.catAmt}>
                          {pkrF(c[1])} · {share}%
                        </Text>
                      </View>
                      <HennaProgress value={c[1]} max={data.maxCat} accent={accent} height={6} />
                    </View>
                  );
                })}
              </HennaCard>
            </View>
          </>
        )}

        {/* Daily spending */}
        {data.dailyEntries.length > 0 && (
          <>
            <DividerOrnament color={hennaColors.bronze} />
            <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Daily spending</Text>
            <View style={styles.body}>
              <HennaCard padding={18} style={{ marginBottom: 14 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dailyChart}>
                    {data.dailyEntries.map(([day, amt]) => {
                      const h = Math.max((amt / data.maxDaily) * 120, 8);
                      return (
                        <View key={day} style={styles.dailyBar}>
                          <Text style={styles.dailyAmt}>{pkr(amt)}</Text>
                          <View style={[styles.dailyFill, { height: h }]} />
                          <Text style={styles.dailyDay}>{day}</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </HennaCard>
            </View>
          </>
        )}

        {/* Top 5 */}
        {data.topExpenses.length > 0 && (
          <>
            <DividerOrnament color={hennaColors.plum} />
            <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Top 5 expenses</Text>
            <View style={styles.body}>
              <HennaCard padding={0} style={{ marginBottom: 14 }}>
                {data.topExpenses.map((h, i) => (
                  <View
                    key={h.id}
                    style={[
                      styles.topRow,
                      i < data.topExpenses.length - 1 && {
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
            </View>
          </>
        )}

        {data.expCount === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Nothing logged this month.</Text>
            <Text style={styles.emptyHint}>Add an expense and the report will fill in.</Text>
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
    fontSize: 32,
    lineHeight: 36,
    color: hennaColors.ink,
    letterSpacing: -0.5,
  },
  heroNumTail: { fontFamily: hennaFonts.flourish, color: hennaColors.bronze },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },

  overviewGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overviewBox: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  overviewVal: { fontFamily: hennaFonts.serif, fontSize: 16 },
  overviewLbl: {
    marginTop: 2,
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    color: hennaColors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  budgetSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: hennaColors.line,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetLabel: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.ink2 },
  budgetVal: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.bronze },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  body: { paddingHorizontal: 16 },
  sectionEyebrow: { paddingHorizontal: 24, paddingBottom: 10, paddingTop: 10 },

  catRow: { marginBottom: 14 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontFamily: hennaFonts.ui, fontSize: 13, color: hennaColors.ink2 },
  catAmt: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.ink },

  dailyChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingVertical: 10 },
  dailyBar: { alignItems: 'center', width: 40 },
  dailyAmt: { fontFamily: hennaFonts.ui, fontSize: 9, color: hennaColors.muted, marginBottom: 4 },
  dailyFill: { width: 18, borderRadius: 4, backgroundColor: hennaColors.henna },
  dailyDay: { fontFamily: hennaFonts.uiSemi, fontSize: 10, color: hennaColors.muted, marginTop: 4 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  topRank: { width: 28, fontFamily: hennaFonts.serif, fontSize: 15, color: hennaColors.bronze },
  topInfo: { flex: 1, minWidth: 0 },
  topName: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  topCat: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, marginTop: 2 },
  topAmt: { fontFamily: hennaFonts.serif, fontSize: 15, color: hennaColors.henna },

  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },
});
