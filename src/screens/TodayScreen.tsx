import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast, Toast } from '../components/ui/Toast';
import { MEALS, MEAL_ICONS, FULL_DAYS, MONTHS } from '../constants/data';
import { useCurrency } from '../context/CurrencyContext';
import { todayStr, todayDay, todayISO, fmtISO } from '../utils/dates';
import { gradients } from '../constants/colors';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import {
  computePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  isSunnahWeekday,
  isAyyamAlBid,
} from '../utils/prayer';

type Tone = 'gold' | 'red' | 'green' | 'muted';
type BlockKey = 'money' | 'kitchen' | 'household' | 'personal' | 'system';

interface GroupBlock {
  key: BlockKey;
  icon: string;
  name: string;
  target: string;
  targetIsTab: boolean;
  gradientLight: [string, string];
  gradientDark: [string, string];
  badge?: { label: string; tone: Tone };
}

const TAB_NAMES = new Set(['Today', 'Expenses', 'Cooking', 'Remind']);

export default function TodayScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    history, cooking, maidData, reminders, attendance, budget,
    inventory, bodyLogs, prayerSettings,
  } = useData();
  const { pkr } = useCurrency();
  const { toast, dismiss: dismissToast } = useToast();

  const td = todayStr();
  const day = todayDay();
  const iso = todayISO();

  const { greeting, fullDate } = useMemo(() => {
    const now = new Date();
    const hr = now.getHours();
    const weekday = FULL_DAYS[(now.getDay() + 6) % 7];
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

  // Personal badge is prayer-aware once enabled
  const personalBadge = useMemo<{ label: string; tone: Tone }>(() => {
    if (!prayerSettings.enabled) {
      return loggedToday
        ? { label: 'logged today', tone: 'green' }
        : { label: 'Setup Prayer Times', tone: 'gold' };
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
    if (loggedToday) return { label: 'logged today', tone: 'green' };
    return { label: 'no log today', tone: 'muted' };
  }, [prayerSettings, loggedToday]);

  // Target for Personal block — Prayer Times if enabled, else BodyStats
  const personalTarget = prayerSettings.enabled ? 'PrayerTimes' : 'BodyStats';

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
        target: 'Expenses',
        targetIsTab: true,
        gradientLight: gradients.goldHero,
        gradientDark: gradients.goldHeroDark,
        badge: moneyBadge,
      },
      {
        key: 'kitchen',
        icon: '🍽️',
        name: 'Kitchen',
        target: 'Cooking',
        targetIsTab: true,
        gradientLight: gradients.greenHero,
        gradientDark: gradients.greenHeroDark,
        badge: kitchenBadge,
      },
      {
        key: 'household',
        icon: '🏠',
        name: 'Household',
        target: 'Remind',
        targetIsTab: true,
        gradientLight: ['#f0f7ff', '#e0ecff'],
        gradientDark: ['#050d1a', '#071226'],
        badge: householdBadge,
      },
      {
        key: 'personal',
        icon: '💝',
        name: 'Personal',
        target: personalTarget,
        targetIsTab: false,
        gradientLight: gradients.pinkHero,
        gradientDark: gradients.pinkHeroDark,
        badge: personalBadge,
      },
    ];
  }, [budget, monthSpent, lowStockCount, dueTodayCount, personalBadge, personalTarget]);

  const systemBlock: GroupBlock = useMemo(
    () => ({
      key: 'system',
      icon: '⚙️',
      name: 'System',
      target: 'Settings',
      targetIsTab: false,
      gradientLight: ['#f5f3f0', '#ebe7e0'],
      gradientDark: ['#1f1f28', '#18181f'],
    }),
    [],
  );

  const onBlockPress = (block: GroupBlock) => {
    if (block.targetIsTab || TAB_NAMES.has(block.target)) {
      navigation.navigate('Home', { screen: block.target });
    } else {
      navigation.navigate(block.target);
    }
  };

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
        {/* Hero */}
        <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero} style={styles.heroCard}>
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
              <Text
                style={[
                  styles.heroStatValue,
                  { color: bal < 0 ? colors.red : colors.green },
                ]}
              >
                {pkr(bal)}
              </Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStatCol}>
              <Text style={[styles.heroStatLabel, { color: colors.muted }]}>Spent Today</Text>
              <Text style={[styles.heroStatValue, { color: colors.deep }]}>{pkr(todaySpent)}</Text>
            </View>
          </View>
        </Card>

        {/* Block Grid — 2-col square-ish blocks for Money/Kitchen/Household/Personal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.deep }]}>Explore</Text>
          <View style={styles.gridWrap}>
            {blocks.map(block => {
              const badge = block.badge ? badgeColorFor(block.badge.tone) : null;
              const grad = dark ? block.gradientDark : block.gradientLight;
              return (
                <TouchableOpacity
                  key={block.key}
                  activeOpacity={0.8}
                  onPress={() => onBlockPress(block)}
                  accessibilityRole="button"
                  accessibilityLabel={`${block.name} group`}
                  style={styles.blockWrapper}
                >
                  <Card style={styles.blockCard} gradient={grad}>
                    <View style={styles.blockTopRow}>
                      <Text style={styles.blockIcon}>{block.icon}</Text>
                    </View>
                    <View style={styles.blockBottom}>
                      <Text style={[styles.blockName, { color: colors.deep }]}>{block.name}</Text>
                      {block.badge && badge && (
                        <View style={[styles.blockBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.blockBadgeText, { color: badge.fg }]}>
                            {block.badge.label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* System — full-width narrower tile */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onBlockPress(systemBlock)}
            accessibilityRole="button"
            accessibilityLabel="System group"
          >
            <Card
              style={styles.systemCard}
              gradient={dark ? systemBlock.gradientDark : systemBlock.gradientLight}
            >
              <View style={styles.systemRow}>
                <Text style={styles.systemIcon}>{systemBlock.icon}</Text>
                <Text style={[styles.systemName, { color: colors.deep }]}>{systemBlock.name}</Text>
                <Text style={[styles.systemChevron, { color: colors.muted }]}>›</Text>
              </View>
            </Card>
          </TouchableOpacity>
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
        {dueSoon.length === 0 && meals.length === 0 && maidTasks.length === 0 && (
          <EmptyState icon="✨" text="No tasks, meals, or reminders for today. Enjoy your day!" />
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

  // --- 2-col block grid ---
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  blockWrapper: {
    width: '47%',
    flexGrow: 1,
  },
  blockCard: {
    aspectRatio: 1 / 0.9,
    padding: 16,
    marginBottom: 0,
    justifyContent: 'space-between',
  },
  blockTopRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  blockIcon: { fontSize: 32, lineHeight: 36 },
  blockBottom: { alignItems: 'flex-start', gap: 8 },
  blockName: { fontSize: 18, fontFamily: 'Outfit-Bold' },
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

  // --- System full-width narrower tile ---
  systemCard: { paddingVertical: 14, paddingHorizontal: 18 },
  systemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  systemIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  systemName: { flex: 1, fontSize: 17, fontFamily: 'Outfit-Bold' },
  systemChevron: { fontSize: 24, fontFamily: 'Outfit-Bold' },

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
