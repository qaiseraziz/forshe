import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { MEALS, FULL_DAYS, MONTHS } from '../constants/data';
import { todayStr, todayDay, todayISO, fmtISO } from '../utils/dates';
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
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
  DividerOrnament,
} from '../components/henna';
import type { HennaIconName } from '../components/henna';

// Enable LayoutAnimation on Android for the meals expand/collapse
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AccentKey = 'henna' | 'bronze' | 'plum' | 'pink' | 'sage' | 'dust';

interface GroupTile {
  name: string;
  bg: string;
  accent: string;
  icon: HennaIconName;
  /** Stat (top line, accent-coloured). */
  stat: string;
  /** Sub-line (muted). */
  status: string;
  /** Navigation target — same string used by the legacy gold TodayScreen. */
  target: string;
  /** True if `target` is one of the 4 bottom-tab routes. */
  targetIsTab: boolean;
}

const TAB_NAMES = new Set(['Today', 'Expenses', 'Cooking', 'Remind']);

const ACCENTS: Record<AccentKey, { fg: string; bg: string }> = {
  henna:  { fg: hennaColors.henna,  bg: hennaColors.hennaBg },
  bronze: { fg: hennaColors.bronze, bg: hennaColors.bronzeBg },
  plum:   { fg: hennaColors.plum,   bg: hennaColors.plumBg },
  pink:   { fg: hennaColors.pink,   bg: hennaColors.pinkBg },
  sage:   { fg: hennaColors.sage,   bg: hennaColors.sageBg },
  dust:   { fg: hennaColors.dust,   bg: hennaColors.dustBg },
};

// Split a formatted balance into head + last-3 chars so the tail can
// render in the Cormorant italic flourish.
// e.g. "Rs 40,150" → { head: "Rs 40,", tail: "150" }
function splitBalanceFlourish(formatted: string): { head: string; tail: string } {
  if (formatted.length <= 3) return { head: '', tail: formatted };
  const tail = formatted.slice(-3);
  const head = formatted.slice(0, -3);
  return { head, tail };
}

export default function TodayHennaScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    history,
    cooking,
    reminders,
    inventory,
    bodyLogs,
    prayerSettings,
    budget,
    allLoaded,
  } = useData();
  const { pkr, pkrF } = useCurrency();

  const [mealsOpen, setMealsOpen] = useState(false);

  const td = todayStr();
  const day = todayDay();
  const iso = todayISO();

  // Greeting — "Salaam" prefix per the design. No user-name storage exists
  // yet in the app, so just "Salaam" for now.
  const greeting = 'Salaam';

  const dateLine = useMemo(() => {
    const now = new Date();
    const weekday = FULL_DAYS[(now.getDay() + 6) % 7];
    return `${weekday.slice(0, 3)} · ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  }, []);

  const clockLine = useMemo(() => {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${period}`;
  }, []);

  // Money
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
  const monthSpent = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return history.reduce((s, h) => {
      if (h.type !== 'expense') return s;
      const parts = h.date.split('/');
      if (parts.length !== 3) return s;
      return +parts[1] - 1 === m && +parts[2] === y ? s + h.amount : s;
    }, 0);
  }, [history]);
  const budgetPct = budget > 0 ? Math.round((monthSpent / budget) * 100) : null;

  // Kitchen — low stock
  const lowStockCount = useMemo(
    () => inventory.filter(i => i.qty <= i.lowStockThreshold).length,
    [inventory],
  );

  // Household — due today (unfinished reminders dated today)
  const dueTodayCount = useMemo(
    () => reminders.filter(r => !r.isDone && r.date === iso).length,
    [reminders, iso],
  );

  // Personal — logged today
  const loggedToday = useMemo(
    () => bodyLogs.some(b => b.date === iso),
    [bodyLogs, iso],
  );

  // Spiritual — keep label simple here (full prayer-aware copy stays on the
  // legacy screen). When prayer is enabled, show a generic "next salah"
  // copy; the actual prayer-time formatting library is intentionally not
  // re-imported here.
  const spiritualLine = prayerSettings.enabled ? 'Times set' : 'Setup needed';

  // Hero "due now" — pick the earliest unfinished reminder due today.
  const heroReminder = useMemo(() => {
    const todays = reminders.filter(r => !r.isDone && r.date === iso);
    if (todays.length === 0) return null;
    return todays.sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
  }, [reminders, iso]);

  // Today's meals (full list — for the expanded panel)
  const todayMeals = useMemo(
    () =>
      MEALS.map(m => ({ meal: m, dish: cooking[`${day}_${m}`] }))
        .filter(x => !!x.dish) as { meal: string; dish: string }[],
    [cooking, day],
  );

  const mealsTeaser = useMemo(() => {
    if (todayMeals.length === 0) return 'No meals planned';
    return todayMeals.map(m => m.dish).join(' · ');
  }, [todayMeals]);

  const groups = useMemo<GroupTile[]>(() => {
    // Money status
    const moneyStat = pkr(bal);
    const moneyStatus =
      budget > 0 && monthSpent > budget
        ? 'over budget'
        : budget > 0
          ? 'on track'
          : 'no budget';

    // Kitchen
    const kitchenStat = lowStockCount > 0 ? `${lowStockCount} low` : 'stocked';
    const kitchenStatus = lowStockCount > 0 ? 'restock' : 'all good';

    // Household
    const householdStat = dueTodayCount > 0 ? `${dueTodayCount} today` : 'all clear';
    const householdStatus = dueTodayCount > 0 ? 'reminder' : 'no due';

    // Personal
    const personalStat = loggedToday ? 'logged' : '—';
    const personalStatus = loggedToday ? 'good work' : 'rest day';

    return [
      {
        name: 'Money',
        bg: ACCENTS.henna.bg,
        accent: ACCENTS.henna.fg,
        icon: 'money',
        stat: moneyStat,
        status: moneyStatus,
        target: 'Expenses',
        targetIsTab: true,
      },
      {
        name: 'Kitchen',
        bg: ACCENTS.bronze.bg,
        accent: ACCENTS.bronze.fg,
        icon: 'pot',
        stat: kitchenStat,
        status: kitchenStatus,
        target: 'Cooking',
        targetIsTab: true,
      },
      {
        name: 'Household',
        bg: ACCENTS.plum.bg,
        accent: ACCENTS.plum.fg,
        icon: 'house',
        stat: householdStat,
        status: householdStatus,
        target: 'Remind',
        targetIsTab: true,
      },
      {
        name: 'Personal',
        bg: ACCENTS.pink.bg,
        accent: ACCENTS.pink.fg,
        icon: 'heart',
        stat: personalStat,
        status: personalStatus,
        target: 'CycleTracker',
        targetIsTab: false,
      },
      {
        name: 'Spiritual',
        bg: ACCENTS.sage.bg,
        accent: ACCENTS.sage.fg,
        icon: 'mosque',
        stat: prayerSettings.enabled ? 'on' : 'off',
        status: spiritualLine,
        target: 'PrayerTimes',
        targetIsTab: false,
      },
      {
        name: 'System',
        bg: ACCENTS.dust.bg,
        accent: ACCENTS.dust.fg,
        icon: 'gear',
        stat: '',
        status: 'all safe',
        target: 'Settings',
        targetIsTab: false,
      },
    ];
  }, [
    bal, budget, monthSpent, lowStockCount, dueTodayCount,
    loggedToday, prayerSettings.enabled, spiritualLine, pkr,
  ]);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const toggleMeals = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.selectionAsync();
    setMealsOpen(prev => !prev);
  }, []);

  const navigateGroup = useCallback(
    (g: GroupTile) => {
      Haptics.selectionAsync();
      if (g.targetIsTab || TAB_NAMES.has(g.target)) {
        navigation.navigate('Home', { screen: g.target });
      } else {
        navigation.navigate(g.target);
      }
    },
    [navigation],
  );

  const navigateExpenses = useCallback(() => {
    Haptics.selectionAsync();
    navigation.navigate('Home', { screen: 'Expenses' });
  }, [navigation]);

  const navigateReminder = useCallback(() => {
    Haptics.selectionAsync();
    navigation.navigate('Home', { screen: 'Remind' });
  }, [navigation]);

  const balanceFormatted = allLoaded ? pkrF(bal) : '—';
  const balanceSplit = splitBalanceFlourish(balanceFormatted);

  const accentMealsIcon: Record<string, { icon: HennaIconName; accent: AccentKey }> = {
    Breakfast: { icon: 'sun', accent: 'bronze' },
    Lunch: { icon: 'pot', accent: 'henna' },
    Dinner: { icon: 'moon', accent: 'plum' },
    Snacks: { icon: 'sparkle', accent: 'sage' },
  };

  return (
    <LinearGradient colors={hennaGradients.page} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader
          title="ForSHE"
          subtitle={dateLine}
          onMenu={onMenu}
          action={<Text style={styles.clockText}>{clockLine}</Text>}
        />

        {/* Hero card */}
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
                <Text style={styles.greetText}>{greeting}</Text>
              </View>

              <Text style={styles.balanceText} numberOfLines={1} adjustsFontSizeToFit>
                {balanceSplit.head}
                <Text style={styles.balanceTail}>{balanceSplit.tail}</Text>
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatCol}>
                  <Text style={hennaTextStyles.eyebrow}>Spent today</Text>
                  <Text style={styles.heroStatValue}>{allLoaded ? pkr(todaySpent) : '—'}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatCol}>
                  <Text style={hennaTextStyles.eyebrow}>{budget > 0 ? 'Budget' : 'Month'}</Text>
                  <Text style={styles.heroStatValue}>
                    {budget > 0 && budgetPct !== null ? `${budgetPct}%` : pkr(monthSpent)}
                  </Text>
                </View>
                <HennaButton
                  title="Log"
                  icon="plus"
                  size="sm"
                  onPress={navigateExpenses}
                  style={styles.heroLogBtn}
                />
              </View>

              <View style={styles.heroDivider} />

              {heroReminder ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reminder: ${heroReminder.title}`}
                  onPress={navigateReminder}
                  style={({ pressed }) => [styles.heroRemindRow, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <HennaIcon name="bell" size={14} color={hennaColors.henna} />
                  <Text style={styles.heroRemindText} numberOfLines={1}>
                    <Text style={styles.heroRemindStrong}>{heroReminder.title}</Text>
                    {heroReminder.time ? ` · due at ${heroReminder.time}` : ''}
                  </Text>
                  <HennaIcon name="chev-right" size={14} color={hennaColors.muted} />
                </Pressable>
              ) : (
                <View style={styles.heroRemindRow}>
                  <HennaIcon name="sparkle" size={14} color={hennaColors.muted} />
                  <Text style={[styles.heroRemindText, { color: hennaColors.muted }]} numberOfLines={1}>
                    Nothing due today
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Group grid */}
        <DividerOrnament style={styles.divider} color={hennaColors.henna} />
        <Text style={[hennaTextStyles.eyebrow, styles.gridEyebrow]}>Your home today</Text>
        <View style={styles.grid}>
          {groups.map(g => (
            <Pressable
              key={g.name}
              accessibilityRole="button"
              accessibilityLabel={`${g.name} group, ${g.status}`}
              onPress={() => navigateGroup(g)}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: g.bg, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <View
                style={[
                  styles.tileIconCircle,
                  { borderColor: withAlpha(g.accent, 0.13) },
                ]}
              >
                <HennaIcon name={g.icon} size={16} color={g.accent} />
              </View>
              <Text style={styles.tileName}>{g.name}</Text>
              <Text style={[styles.tileStat, { color: g.accent }]} numberOfLines={1}>
                {g.stat || ' '}
              </Text>
              <Text style={styles.tileStatus} numberOfLines={1}>{g.status}</Text>
            </Pressable>
          ))}
        </View>

        {/* Today's meals — collapsible */}
        <View style={styles.mealsWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mealsOpen ? "Collapse today's meals" : "Expand today's meals"}
            accessibilityState={{ expanded: mealsOpen }}
            onPress={toggleMeals}
            style={({ pressed }) => [styles.mealsHeader, hennaShadows.sm, { opacity: pressed ? 0.94 : 1 }]}
          >
            <View style={styles.mealsHeaderIcon}>
              <HennaIcon name="pot" size={17} color={hennaColors.bronze} />
            </View>
            <View style={styles.mealsHeaderText}>
              <Text style={hennaTextStyles.eyebrow}>
                Today's meals · {todayMeals.length} planned
              </Text>
              <Text style={styles.mealsTeaser} numberOfLines={1}>
                {mealsOpen ? 'Tap to collapse' : mealsTeaser}
              </Text>
            </View>
            <HennaIcon
              name={mealsOpen ? 'chev-down' : 'chev-right'}
              size={14}
              color={hennaColors.muted}
            />
          </Pressable>

          {mealsOpen && todayMeals.length > 0 && (
            <HennaCard padding={0} style={styles.mealsPanel}>
              {todayMeals.map((m, i) => {
                const meta = accentMealsIcon[m.meal] ?? { icon: 'utensils' as HennaIconName, accent: 'henna' as AccentKey };
                const a = ACCENTS[meta.accent];
                const isLast = i === todayMeals.length - 1;
                return (
                  <View
                    key={m.meal}
                    style={[
                      styles.mealRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: hennaColors.line },
                    ]}
                  >
                    <View style={[styles.mealRowIcon, { backgroundColor: a.bg }]}>
                      <HennaIcon name={meta.icon} size={16} color={a.fg} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={hennaTextStyles.eyebrow}>{m.meal}</Text>
                      <Text style={styles.mealDish}>{m.dish}</Text>
                    </View>
                    <HennaIcon name="chev-right" size={14} color={hennaColors.muted} />
                  </View>
                );
              })}
            </HennaCard>
          )}
        </View>

        {/* Date string + ISO for utilities that read the raw values
            (silenced unused-var warnings without bloating the UI). */}
        {!allLoaded && (
          <Text style={styles.loadingHint}>Loading {fmtISO(iso)}…</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },

  clockText: {
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },

  // ── Hero ──
  heroWrap: { paddingHorizontal: 16 },
  heroCard: {
    borderRadius: hennaRadii.card,
    overflow: 'hidden',
    position: 'relative',
    ...hennaShadows.md,
  },
  heroCorner: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  heroInner: {
    paddingVertical: 22,
    paddingHorizontal: 24,
    position: 'relative',
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 12,
    color: hennaColors.henna,
  },
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
    alignItems: 'baseline',
    marginTop: 12,
    gap: 16,
  },
  heroStatCol: {},
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(147,73,57,0.18)',
  },
  heroStatValue: {
    fontFamily: hennaFonts.serif,
    fontSize: 18,
    color: hennaColors.ink,
    marginTop: 2,
  },
  heroLogBtn: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  heroDivider: {
    marginTop: 14,
    height: 1,
    backgroundColor: 'rgba(147,73,57,0.15)',
  },
  heroRemindRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 24,
  },
  heroRemindText: {
    flex: 1,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.ink2,
  },
  heroRemindStrong: {
    color: hennaColors.ink,
    fontFamily: hennaFonts.uiSemi,
  },

  // ── Group grid ──
  divider: {
    paddingTop: 22,
    paddingHorizontal: 32,
    paddingBottom: 10,
  },
  gridEyebrow: {
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  grid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47%',
    height: 100,
    borderRadius: hennaRadii.tile,
    padding: 14,
    position: 'relative',
    ...hennaShadows.sm,
  },
  tileIconCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
  },
  tileName: {
    fontFamily: hennaFonts.serif,
    fontSize: 17,
    color: hennaColors.ink,
  },
  tileStat: {
    marginTop: 4,
    fontFamily: hennaFonts.uiSemi,
    fontSize: 13,
  },
  tileStatus: {
    marginTop: 1,
    fontFamily: hennaFonts.ui,
    fontSize: 10,
    color: hennaColors.muted,
  },

  // ── Meals ──
  mealsWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  mealsHeader: {
    backgroundColor: hennaColors.paper,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  mealsHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: hennaColors.bronzeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  mealsTeaser: {
    marginTop: 2,
    fontFamily: hennaFonts.serif,
    fontSize: 15,
    color: hennaColors.ink,
  },
  mealsPanel: {
    marginTop: 8,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  mealRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealDish: {
    marginTop: 2,
    fontFamily: hennaFonts.serif,
    fontSize: 14,
    color: hennaColors.ink,
  },

  loadingHint: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },
});
