import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast, Toast } from '../components/ui/Toast';
import { MotiEnter } from '../components/ui/MotiEnter';
import { MEALS, MEAL_ICONS, FULL_DAYS, MONTHS } from '../constants/data';
import { useCurrency } from '../context/CurrencyContext';
import { todayStr, todayDay, todayISO, fmtISO } from '../utils/dates';
import { gradients, heroGradientForHour } from '../constants/colors';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { Skeleton, SkeletonCardRow } from '../components/ui/Skeleton';
import {
  computePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  isSunnahWeekday,
  isAyyamAlBid,
} from '../utils/prayer';

// Enable LayoutAnimation on Android for the accordion expand/collapse
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Tone = 'gold' | 'red' | 'green' | 'muted';
type BlockKey = 'money' | 'kitchen' | 'household' | 'personal' | 'spiritual' | 'system';

interface SubModule {
  key: string;
  label: string;
  icon: string;
  target: string;
  targetIsTab: boolean;
}

interface GroupBlock {
  key: BlockKey;
  icon: string;
  name: string;
  gradientLight: [string, string];
  gradientDark: [string, string];
  badge?: { label: string; tone: Tone };
  submodules: SubModule[];
}

// Tab-names inside BottomTabs (hosted under Drawer route "Home")
const TAB_NAMES = new Set(['Today', 'Expenses', 'Cooking', 'Remind']);

export default function TodayScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    history, cooking, maidData, reminders, attendance, budget,
    inventory, bodyLogs, prayerSettings, allLoaded,
  } = useData();
  const { pkr } = useCurrency();
  const { toast, dismiss: dismissToast } = useToast();

  // v1.2.3-dev: inline-expand accordion. null = all collapsed. Only one open at a time.
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const td = todayStr();
  const day = todayDay();
  const iso = todayISO();

  // v1.2.5-dev: capture the hour once so the hero gradient `useMemo` is keyed
  // on a stable primitive (not a Date instance). Re-runs only when the hour
  // bucket changes, which happens at most 24× per day.
  const currentHour = useMemo(() => new Date().getHours(), []);

  const { greeting, fullDate } = useMemo(() => {
    const now = new Date();
    const hr = now.getHours();
    const weekday = FULL_DAYS[(now.getDay() + 6) % 7];
    return {
      greeting: hr < 12 ? 'Good morning! ☀️' : hr < 17 ? 'Good afternoon! 🌤️' : 'Good evening! 🌙',
      fullDate: `${weekday}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    };
  }, []);

  // v1.2.5-dev: time-aware hero gradient. Static — no animation, no re-render
  // trigger. Keyed on `currentHour` + `dark` so switching to dark mode picks
  // the right pair without a full re-render chain.
  const heroGradient = useMemo(
    () => heroGradientForHour(currentHour, dark),
    [currentHour, dark],
  );

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

  const maidTasks = maidData[day] || [];
  const att = attendance[td];

  const meals = useMemo(
    () => MEALS.map(m => ({ m, txt: cooking[`${day}_${m}`] })).filter(x => x.txt),
    [cooking, day],
  );

  const dueSoon = useMemo(() => {
    const n = new Date();
    return reminders.filter(r => {
      if (r.isDone) return false;
      const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
      const hrs = (t.getTime() - n.getTime()) / 3600000;
      return hrs >= 0 && hrs <= 26;
    });
  }, [reminders]);

  const dueTodayCount = useMemo(
    () => reminders.filter(r => !r.isDone && r.date === iso).length,
    [reminders, iso],
  );

  const lowStockCount = useMemo(
    () => inventory.filter(i => i.qty <= i.lowStockThreshold).length,
    [inventory],
  );

  const loggedToday = useMemo(
    () => bodyLogs.some(b => b.date === iso),
    [bodyLogs, iso],
  );

  // v1.2.3-dev: Personal badge reverts to pre-v1.2.2 wellness-only logic
  const personalBadge = useMemo<{ label: string; tone: Tone }>(() => {
    return loggedToday
      ? { label: 'logged today', tone: 'green' }
      : { label: 'no log today', tone: 'muted' };
  }, [loggedToday]);

  // v1.2.3-dev: Spiritual block badge — prayer-aware
  const spiritualBadge = useMemo<{ label: string; tone: Tone }>(() => {
    if (!prayerSettings.enabled) {
      return { label: 'Setup', tone: 'gold' };
    }
    const now = new Date();
    const sun = isSunnahWeekday(now);
    const bid = isAyyamAlBid(now);
    if (sun || bid !== null) return { label: 'Sunnah day 🌙', tone: 'gold' };
    const times = prayerSettings.location ? computePrayerTimes(now, prayerSettings) : null;
    if (times) {
      const next = getNextPrayer(times, now);
      return { label: `${next.name} ${formatPrayerTime(next.time)}`, tone: 'muted' };
    }
    return { label: 'Setup', tone: 'gold' };
  }, [prayerSettings]);

  const blocks = useMemo<GroupBlock[]>(() => {
    const moneyBadge: GroupBlock['badge'] =
      budget > 0 && monthSpent > budget
        ? { label: 'over budget', tone: 'red' }
        : budget > 0
          ? { label: 'on track', tone: 'green' }
          : undefined;

    const kitchenBadge: GroupBlock['badge'] =
      lowStockCount > 0
        ? { label: `${lowStockCount} low stock`, tone: 'red' }
        : { label: 'stocked', tone: 'muted' };

    const householdBadge: GroupBlock['badge'] =
      dueTodayCount > 0
        ? { label: `${dueTodayCount} due today`, tone: 'gold' }
        : { label: 'all clear', tone: 'muted' };

    return [
      {
        key: 'money',
        icon: '💰',
        name: 'Money',
        gradientLight: gradients.goldHero,
        gradientDark: gradients.goldHeroDark,
        badge: moneyBadge,
        submodules: [
          { key: 'Expenses', label: 'Expenses', icon: '💸', target: 'Expenses', targetIsTab: true },
          { key: 'SavingsGoals', label: 'Savings', icon: '🎯', target: 'SavingsGoals', targetIsTab: false },
          { key: 'Insights', label: 'Insights', icon: '📈', target: 'Insights', targetIsTab: false },
          { key: 'MonthlyReport', label: 'Report', icon: '📊', target: 'MonthlyReport', targetIsTab: false },
        ],
      },
      {
        key: 'kitchen',
        icon: '🍽️',
        name: 'Kitchen',
        gradientLight: gradients.greenHero,
        gradientDark: gradients.greenHeroDark,
        badge: kitchenBadge,
        submodules: [
          { key: 'Cooking', label: 'Cooking', icon: '🍳', target: 'Cooking', targetIsTab: true },
          { key: 'Recipes', label: 'Recipes', icon: '📖', target: 'Recipes', targetIsTab: false },
          { key: 'Shopping', label: 'Shopping', icon: '🛒', target: 'Shopping', targetIsTab: false },
          { key: 'Inventory', label: 'Inventory', icon: '📦', target: 'Inventory', targetIsTab: false },
        ],
      },
      {
        key: 'household',
        icon: '🏠',
        name: 'Household',
        gradientLight: ['#f0f7ff', '#e0ecff'],
        gradientDark: ['#050d1a', '#071226'],
        badge: householdBadge,
        submodules: [
          { key: 'MaidTasks', label: 'Maid', icon: '🧹', target: 'MaidTasks', targetIsTab: false },
          { key: 'Remind', label: 'Reminders', icon: '🔔', target: 'Remind', targetIsTab: true },
          { key: 'Vendors', label: 'Vendors', icon: '💼', target: 'Vendors', targetIsTab: false },
        ],
      },
      {
        key: 'personal',
        icon: '💝',
        name: 'Personal',
        gradientLight: gradients.pinkHero,
        gradientDark: gradients.pinkHeroDark,
        badge: personalBadge,
        submodules: [
          { key: 'CycleTracker', label: 'Cycle', icon: '🌸', target: 'CycleTracker', targetIsTab: false },
          { key: 'BodyStats', label: 'Body Stats', icon: '💪', target: 'BodyStats', targetIsTab: false },
        ],
      },
      {
        key: 'spiritual',
        icon: '🕌',
        name: 'Spiritual',
        gradientLight: gradients.greenHero,
        gradientDark: gradients.greenHeroDark,
        badge: spiritualBadge,
        submodules: [
          { key: 'PrayerTimes', label: 'Prayer Times', icon: '🕌', target: 'PrayerTimes', targetIsTab: false },
        ],
      },
      {
        key: 'system',
        icon: '⚙️',
        name: 'System',
        gradientLight: ['#f5f3f0', '#ebe7e0'],
        gradientDark: ['#1f1f28', '#18181f'],
        submodules: [
          { key: 'Backup', label: 'Backup', icon: '💾', target: 'Backup', targetIsTab: false },
          { key: 'Settings', label: 'Settings', icon: '⚙️', target: 'Settings', targetIsTab: false },
        ],
      },
    ];
  }, [budget, monthSpent, lowStockCount, dueTodayCount, personalBadge, spiritualBadge]);

  const toggleBlock = useCallback((key: BlockKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.selectionAsync();
    setExpandedGroup(prev => (prev === key ? null : key));
  }, []);

  const navigateToSubmodule = useCallback(
    (sub: SubModule) => {
      if (sub.targetIsTab || TAB_NAMES.has(sub.target)) {
        navigation.navigate('Home', { screen: sub.target });
      } else {
        navigation.navigate(sub.target);
      }
    },
    [navigation],
  );

  const badgeColorFor = (tone: Tone) => {
    switch (tone) {
      case 'red':
        return { bg: colors.redBg, fg: colors.red };
      case 'green':
        return { bg: colors.greenBg, fg: colors.green };
      case 'gold':
        return { bg: colors.goldBg, fg: colors.gold };
      default:
        return { bg: colors.bg3, fg: colors.muted };
    }
  };

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
        {/* Hero — v1.2.4-dev: fade + slide-up entrance via MotiEnter. One-shot only. */}
        <MotiEnter>
        <Card gradient={heroGradient} style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.gold }]}>🏠 Today's Overview</Text>
              <Text style={[styles.heroGreeting, { color: colors.deep }]}>{greeting}</Text>
              <Text style={[styles.heroDate, { color: colors.sub }]}>{fullDate}</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCol}>
              <Text style={[styles.heroStatLabel, { color: colors.muted }]}>Balance</Text>
              {allLoaded ? (
                <Text
                  style={[
                    styles.heroStatValue,
                    { color: bal < 0 ? colors.red : colors.green },
                  ]}
                >
                  {pkr(bal)}
                </Text>
              ) : (
                <Skeleton height={26} width={120} borderRadius={8} />
              )}
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStatCol}>
              <Text style={[styles.heroStatLabel, { color: colors.muted }]}>Spent Today</Text>
              {allLoaded ? (
                <Text style={[styles.heroStatValue, { color: colors.deep }]}>{pkr(todaySpent)}</Text>
              ) : (
                <Skeleton height={26} width={100} borderRadius={8} />
              )}
            </View>
          </View>
        </Card>
        </MotiEnter>

        {/* Block accordion — tap a block to reveal its sub-modules in place.
            Single-open accordion: tapping a different block collapses the previous one. */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.deep }]}>Explore</Text>
          {!allLoaded && (
            <>
              <SkeletonCardRow />
              <SkeletonCardRow />
              <SkeletonCardRow />
              <SkeletonCardRow />
            </>
          )}
          {allLoaded && blocks.map((block, idx) => {
            const isExpanded = expandedGroup === block.key;
            const badge = block.badge ? badgeColorFor(block.badge.tone) : null;
            const grad = dark ? block.gradientDark : block.gradientLight;
            // v1.2.4-dev: staggered 30ms one-shot entrance per block.
            return (
              <MotiEnter key={block.key} delay={idx * 30}>
              <Card style={styles.blockCard} gradient={grad}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleBlock(block.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${block.name} group`}
                  accessibilityState={{ expanded: isExpanded }}
                  style={styles.blockHeaderTouch}
                >
                  <View style={styles.blockHeaderRow}>
                    <Text style={styles.blockIcon}>{block.icon}</Text>
                    <Text style={[styles.blockName, { color: colors.deep }]}>{block.name}</Text>
                    <Text style={[styles.blockChevron, { color: colors.muted }]}>
                      {isExpanded ? '▾' : '▸'}
                    </Text>
                  </View>
                  {block.badge && badge && (
                    <View style={styles.blockBadgeRow}>
                      <View style={[styles.blockBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.blockBadgeText, { color: badge.fg }]}>
                          {block.badge.label}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.submoduleGrid}>
                    {block.submodules.map(sub => (
                      <TouchableOpacity
                        key={sub.key}
                        activeOpacity={0.7}
                        onPress={() => navigateToSubmodule(sub)}
                        accessibilityRole="button"
                        accessibilityLabel={`${sub.label}, inside ${block.name}`}
                        style={[
                          styles.submoduleTile,
                          { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)' },
                        ]}
                      >
                        <Text style={styles.submoduleIcon}>{sub.icon}</Text>
                        <Text
                          style={[styles.submoduleLabel, { color: colors.deep }]}
                          numberOfLines={1}
                        >
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Card>
              </MotiEnter>
            );
          })}
        </View>

        {/* Prayer Times setup nudge */}
        {!prayerSettings.enabled && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PrayerSettings')}
            accessibilityRole="button"
            accessibilityLabel="Set up prayer times"
          >
            <Card style={styles.onboardCard} gradient={dark ? gradients.greenHeroDark : gradients.greenHero}>
              <View style={styles.onboardRow}>
                <Text style={styles.onboardIcon}>🕌</Text>
                <View style={styles.onboardText}>
                  <Text style={[styles.onboardTitle, { color: colors.deep }]}>Enable Prayer Times</Text>
                  <Text style={[styles.onboardSub, { color: colors.sub }]}>
                    Accurate salah schedules + Sunnah fasting reminders
                  </Text>
                </View>
                <Text style={[styles.onboardCta, { color: colors.green }]}>Set Up ›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Today's Essentials */}
        {(dueSoon.length > 0 || meals.length > 0 || maidTasks.length > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.deep }]}>Today's Essentials</Text>

            {dueSoon.length > 0 && (
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.muted }]}>🔔 Due Soon</Text>
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

            {meals.length > 0 && (
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.muted }]}>🍳 Today's Meals</Text>
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

            {maidTasks.length > 0 && (
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.muted }]}>
                  🧹 Today's Tasks{att ? ` · ${att}` : ''}
                </Text>
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
          </View>
        )}

        {/* Empty state when nothing today */}
        {allLoaded && dueSoon.length === 0 && meals.length === 0 && maidTasks.length === 0 && (
          <EmptyState icon="✨" text="All caught up for today. Enjoy yourself." />
        )}
      </ScrollView>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  heroCard: { paddingTop: 28, paddingBottom: 24, paddingHorizontal: 24 },
  heroLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 8,
  },
  heroGreeting: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 30, lineHeight: 36 },
  heroDate: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 16 },
  heroStatCol: { flex: 1 },
  heroStatLabel: {
    fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 6,
  },
  heroStatValue: { fontSize: 22, fontFamily: 'Outfit-Bold' },
  heroStatDivider: { width: 1, height: 40 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginBottom: 12,
  },
  subsection: { marginBottom: 12 },
  subsectionTitle: {
    fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 8,
  },

  // --- v1.2.3-dev: inline-expanding accordion blocks ---
  blockCard: {
    padding: 18,
    marginBottom: 12,
  },
  blockHeaderTouch: {
    minHeight: 44,
    justifyContent: 'center',
  },
  blockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blockIcon: { fontSize: 28, lineHeight: 32 },
  blockName: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },
  blockChevron: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    width: 18,
    textAlign: 'center',
  },
  blockBadgeRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingLeft: 40, // align with group name (icon 28 + gap 12)
  },
  blockBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  blockBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },

  // --- submodule mini-tile grid (2-col) ---
  submoduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  submoduleTile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 80,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 6,
  },
  submoduleIcon: { fontSize: 22, lineHeight: 26 },
  submoduleLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },

  // Prayer onboarding nudge
  onboardCard: { marginBottom: 16 },
  onboardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  onboardIcon: { fontSize: 26, width: 32, textAlign: 'center' },
  onboardText: { flex: 1 },
  onboardTitle: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  onboardSub: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  onboardCta: { fontSize: 13, fontFamily: 'Outfit-Bold' },

  // Essentials
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
  dueSoonIcon: { fontSize: 18 },
  dueSoonContent: { flex: 1 },
  dueSoonTitle: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  dueSoonMeta: { fontSize: 11, fontFamily: 'Outfit-Regular' },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  mealIcon: { fontSize: 18 },
  mealLabel: { flex: 1, fontSize: 12, fontFamily: 'Outfit-Regular' },
  mealText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  taskCheck: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  taskCheckMark: { fontSize: 11, color: '#fff' },
  taskName: { fontSize: 13, fontFamily: 'Outfit-Regular' },
  taskDone: { textDecorationLine: 'line-through' },
  moreText: { fontSize: 12, fontFamily: 'Outfit-Regular', paddingTop: 6 },
});
