import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { gradients } from '../constants/colors';
import {
  hijriForDate,
  isAyyamAlBid,
  isMondayOrThursday,
} from '../utils/prayer';
import { dateToISO, todayISO } from '../utils/dates';
import { MONTHS } from '../constants/data';
import type { FastingLog, FastingType } from '../types';

type FilterKey = 'all' | 'mon_thu' | 'white';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

interface DayCellInfo {
  iso: string;              // YYYY-MM-DD
  gregorianDay: number;     // 1-31 (only within the current month)
  hijriDay: number | null;  // hijri day-of-month (null for padding cells)
  inMonth: boolean;         // whether the cell belongs to the displayed month
  fastingTypes: FastingType[];
  isToday: boolean;
  isPast: boolean;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Cell is memoized so that scrolling / filter toggles don't rerender every
// cell — only the ones whose props actually change.
interface DayCellProps {
  cell: DayCellInfo;
  filter: FilterKey;
  observed: boolean;
  onPress: (cell: DayCellInfo) => void;
  goldBg: string;
  gold: string;
  green: string;
  greenBg: string;
  muted: string;
  deep: string;
  bg3: string;
}

const DayCell = React.memo(function DayCell({
  cell,
  filter,
  observed,
  onPress,
  goldBg,
  gold,
  green,
  greenBg,
  muted,
  deep,
  bg3,
}: DayCellProps) {
  if (!cell.inMonth) {
    return <View style={[styles.cell, styles.cellEmpty]} />;
  }

  const showFasting =
    filter === 'all'
      ? cell.fastingTypes.length > 0
      : filter === 'mon_thu'
        ? cell.fastingTypes.some(t => t === 'monday' || t === 'thursday')
        : cell.fastingTypes.some(t => t === 'ayyam_al_bid');

  const isMonThu = cell.fastingTypes.some(t => t === 'monday' || t === 'thursday');
  const isWhite = cell.fastingTypes.some(t => t === 'ayyam_al_bid');

  const bg =
    showFasting && (filter !== 'all' || cell.fastingTypes.length > 0)
      ? goldBg
      : bg3;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(cell)}
      accessibilityRole="button"
      accessibilityLabel={`${cell.gregorianDay} ${WEEKDAY_FULL[new Date(cell.iso).getDay()]}${
        showFasting ? ', fasting day' : ''
      }${observed ? ', observed' : ''}`}
      style={[
        styles.cell,
        {
          backgroundColor: bg,
          opacity: cell.isPast && !observed ? 0.6 : 1,
          borderColor: cell.isToday ? gold : 'transparent',
          borderWidth: cell.isToday ? 2 : 0,
        },
      ]}
    >
      <Text
        style={[
          styles.cellGregorian,
          { color: showFasting ? gold : deep },
        ]}
      >
        {cell.gregorianDay}
      </Text>
      {cell.hijriDay !== null && (
        <Text style={[styles.cellHijri, { color: muted }]}>{cell.hijriDay}</Text>
      )}
      {showFasting && (
        <View style={styles.cellBadgeRow}>
          {isMonThu && <Text style={[styles.cellIcon, { color: gold }]}>✨</Text>}
          {isWhite && <Text style={[styles.cellIcon, { color: gold }]}>🌙</Text>}
        </View>
      )}
      {observed && (
        <View style={[styles.observedDot, { backgroundColor: green, borderColor: greenBg }]}>
          <Text style={styles.observedCheck}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function FastingCalendarScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { prayerSettings, fastingLogs, setFastingLogs } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const hijriOffset = prayerSettings.hijriOffset ?? 0;

  // Month being displayed (Gregorian). Starts on the first day of today's month.
  const [viewMonth, setViewMonth] = useState<{ y: number; m: number }>(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });

  const [filter, setFilter] = useState<FilterKey>('all');
  const [detail, setDetail] = useState<DayCellInfo | null>(null);

  // Lookup map for O(1) observed check. Keyed by iso.
  const observedMap = useMemo(() => {
    const m = new Map<string, FastingLog>();
    for (const f of fastingLogs) m.set(f.date, f);
    return m;
  }, [fastingLogs]);

  const todayIso = todayISO();
  const currentGregorianMonthName = MONTHS[viewMonth.m];

  // Hijri-today for the hero subtitle. Recomputed on month change (cheap, but
  // memoised anyway so no render waste).
  const hijriTodayInfo = useMemo(() => hijriForDate(new Date(), hijriOffset), [hijriOffset]);

  // Expensive: build all 42 day cells for the visible month. useMemo keyed
  // on `{ year, month, hijriOffset }` so scrolling the parent / toggling the
  // filter won't recompute.
  const cells = useMemo<DayCellInfo[]>(() => {
    const { y, m } = viewMonth;
    const firstOfMonth = new Date(y, m, 1);
    const firstDow = firstOfMonth.getDay(); // 0=Sun…6=Sat
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out: DayCellInfo[] = [];

    // leading padding (empty cells before day 1)
    for (let i = 0; i < firstDow; i++) {
      out.push({
        iso: '',
        gregorianDay: 0,
        hijriDay: null,
        inMonth: false,
        fastingTypes: [],
        isToday: false,
        isPast: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const iso = dateToISO(d);
      const hijri = hijriForDate(d, hijriOffset);
      const types: FastingType[] = [];
      const dow = d.getDay();
      if (dow === 1) types.push('monday');
      if (dow === 4) types.push('thursday');
      if (isAyyamAlBid(hijri.day)) types.push('ayyam_al_bid');
      out.push({
        iso,
        gregorianDay: day,
        hijriDay: hijri.day,
        inMonth: true,
        fastingTypes: types,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
      });
    }

    // trailing padding — fill up to a multiple of 7 for a tidy grid
    while (out.length % 7 !== 0) {
      out.push({
        iso: '',
        gregorianDay: 0,
        hijriDay: null,
        inMonth: false,
        fastingTypes: [],
        isToday: false,
        isPast: false,
      });
    }
    return out;
  }, [viewMonth, hijriOffset, todayIso]);

  const monthStats = useMemo(() => {
    let fastingCount = 0;
    let observedCount = 0;
    for (const c of cells) {
      if (!c.inMonth) continue;
      if (c.fastingTypes.length === 0) continue;
      fastingCount += 1;
      const log = observedMap.get(c.iso);
      if (log?.observed) observedCount += 1;
    }
    return { fastingCount, observedCount };
  }, [cells, observedMap]);

  const onPrevMonth = useCallback(() => {
    Haptics.selectionAsync();
    setViewMonth(prev => {
      const d = new Date(prev.y, prev.m - 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }, []);
  const onNextMonth = useCallback(() => {
    Haptics.selectionAsync();
    setViewMonth(prev => {
      const d = new Date(prev.y, prev.m + 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }, []);
  const onGoToday = useCallback(() => {
    Haptics.selectionAsync();
    const now = new Date();
    setViewMonth({ y: now.getFullYear(), m: now.getMonth() });
  }, []);

  const setFilterPill = useCallback((k: FilterKey) => {
    Haptics.selectionAsync();
    setFilter(k);
  }, []);

  const openDetail = useCallback((cell: DayCellInfo) => {
    if (!cell.inMonth) return;
    Haptics.selectionAsync();
    setDetail(cell);
  }, []);

  const closeDetail = useCallback(() => setDetail(null), []);

  const toggleObserved = useCallback(
    (cell: DayCellInfo, next: boolean) => {
      if (cell.fastingTypes.length === 0) return;
      setFastingLogs(prev => {
        const rest = prev.filter(f => f.date !== cell.iso);
        if (!next) {
          // set to false (explicit skip)
          return [
            ...rest,
            { date: cell.iso, types: cell.fastingTypes, observed: false },
          ];
        }
        return [
          ...rest,
          { date: cell.iso, types: cell.fastingTypes, observed: true },
        ];
      });
      if (next) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Marked as observed');
      } else {
        showToast('Unmarked');
      }
    },
    [setFastingLogs, showToast],
  );

  const heroGradient = dark ? gradients.greenHeroDark : gradients.greenHero;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Card gradient={heroGradient}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.green }]}>🌙 Fasting Calendar</Text>
              <Text style={[styles.title, { color: colors.deep }]}>Sunnah Fasting</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {hijriTodayInfo.day} {hijriTodayInfo.monthName} {hijriTodayInfo.year} AH
                {prayerSettings.location ? ` · ${prayerSettings.location.name}` : ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* Month nav */}
        <Card>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={onPrevMonth}
              style={styles.navBtn}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.navBtnText, { color: colors.gold }]}>«</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onGoToday}
              accessibilityRole="button"
              accessibilityLabel="Go to current month"
              style={styles.navLabelBtn}
            >
              <Text style={[styles.navLabel, { color: colors.deep }]}>
                {currentGregorianMonthName} {viewMonth.y}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNextMonth}
              style={styles.navBtn}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.navBtnText, { color: colors.gold }]}>»</Text>
            </TouchableOpacity>
          </View>

          {/* Filter pills */}
          <View style={styles.pillRow}>
            {(
              [
                { k: 'all' as FilterKey, label: 'All' },
                { k: 'mon_thu' as FilterKey, label: 'Mon–Thu ✨' },
                { k: 'white' as FilterKey, label: 'Ayyam al-Bid 🌙' },
              ]
            ).map(p => {
              const active = filter === p.k;
              return (
                <TouchableOpacity
                  key={p.k}
                  onPress={() => setFilterPill(p.k)}
                  style={[
                    styles.pill,
                    { backgroundColor: active ? colors.goldBg : colors.bg3 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={p.label}
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? colors.gold : colors.sub },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Calendar grid */}
        <Card>
          {/* weekday header */}
          <View style={styles.weekHeaderRow}>
            {WEEKDAY_LABELS.map((w, i) => (
              <View key={i} style={styles.weekCell}>
                <Text style={[styles.weekLabel, { color: colors.muted }]}>{w}</Text>
              </View>
            ))}
          </View>
          {/* 6 rows × 7 cols */}
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              const log = cell.inMonth ? observedMap.get(cell.iso) : undefined;
              return (
                <DayCell
                  key={cell.inMonth ? cell.iso : `pad-${i}`}
                  cell={cell}
                  filter={filter}
                  observed={!!log?.observed}
                  onPress={openDetail}
                  goldBg={colors.goldBg}
                  gold={colors.gold}
                  green={colors.green}
                  greenBg={colors.greenBg}
                  muted={colors.muted}
                  deep={colors.deep}
                  bg3={colors.bg3}
                />
              );
            })}
          </View>
        </Card>

        {/* Summary */}
        <Card>
          <Text style={[styles.summaryTitle, { color: colors.deep }]}>This month</Text>
          <Text style={[styles.summaryText, { color: colors.sub }]}>
            {monthStats.fastingCount} fasting day{monthStats.fastingCount === 1 ? '' : 's'} · {monthStats.observedCount} observed
          </Text>
        </Card>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Text style={[styles.legendIcon, { color: colors.gold }]}>✨</Text>
            <Text style={[styles.legendLabel, { color: colors.muted }]}>Mon / Thu</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={[styles.legendIcon, { color: colors.gold }]}>🌙</Text>
            <Text style={[styles.legendLabel, { color: colors.muted }]}>Ayyam al-Bid</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.green }]} />
            <Text style={[styles.legendLabel, { color: colors.muted }]}>Observed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { borderColor: colors.gold }]} />
            <Text style={[styles.legendLabel, { color: colors.muted }]}>Today</Text>
          </View>
        </View>
      </ScrollView>

      {/* Detail modal — solid scrim, no BlurView (v1.2.5 rule). */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.bg }]}>
            {detail && (
              <DetailModalBody
                cell={detail}
                observed={!!observedMap.get(detail.iso)?.observed}
                onClose={closeDetail}
                onToggle={v => toggleObserved(detail, v)}
                hijriOffset={hijriOffset}
                colors={colors}
                insetsBottom={insets.bottom}
              />
            )}
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

// ---- Detail modal body (separate component so its `useMemo` below is cheap) ----

interface DetailModalBodyProps {
  cell: DayCellInfo;
  observed: boolean;
  onClose: () => void;
  onToggle: (v: boolean) => void;
  hijriOffset: number;
  colors: ReturnType<typeof useTheme>['colors'];
  insetsBottom: number;
}

function DetailModalBody({ cell, observed, onClose, onToggle, hijriOffset, colors, insetsBottom }: DetailModalBodyProps) {
  const date = useMemo(() => new Date(cell.iso), [cell.iso]);
  const hijri = useMemo(() => hijriForDate(date, hijriOffset), [date, hijriOffset]);

  const weekdayLabel = WEEKDAY_FULL[date.getDay()];
  const gregDate = `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  const isPastOrToday = cell.iso <= todayISO();
  const isMonThu = isMondayOrThursday(date);
  const isWhite = isAyyamAlBid(hijri.day);
  const hasFast = cell.fastingTypes.length > 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.modalScroll, { paddingBottom: insetsBottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.modalTitle, { color: colors.deep }]}>{gregDate}</Text>
      <Text style={[styles.modalSub, { color: colors.muted }]}>
        {weekdayLabel} · {hijri.day} {hijri.monthName} {hijri.year} AH
      </Text>

      <View style={styles.modalDivider} />

      {!hasFast && (
        <Text style={[styles.modalBody, { color: colors.sub }]}>
          No Sunnah fasting recommended for this day.
        </Text>
      )}

      {hasFast && (
        <View style={{ gap: 8 }}>
          {isMonThu && (
            <View style={[styles.modalPillFull, { backgroundColor: colors.goldBg }]}>
              <Text style={[styles.modalPillText, { color: colors.gold }]}>
                ✨ Sunnah {weekdayLabel} fast
              </Text>
            </View>
          )}
          {isWhite && (
            <View style={[styles.modalPillFull, { backgroundColor: colors.goldBg }]}>
              <Text style={[styles.modalPillText, { color: colors.gold }]}>
                🌙 Ayyam al-Bid — {hijri.day} {hijri.monthName}
              </Text>
            </View>
          )}
        </View>
      )}

      {hasFast && isPastOrToday && (
        <View style={[styles.observeRow, { backgroundColor: colors.bg3 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.observeTitle, { color: colors.deep }]}>
              Mark as observed
            </Text>
            <Text style={[styles.observeSub, { color: colors.muted }]}>
              Track the fasts you completed.
            </Text>
          </View>
          <Switch
            value={observed}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.gold }}
            thumbColor="#fff"
          />
        </View>
      )}

      {hasFast && !isPastOrToday && (
        <Text style={[styles.modalBody, { color: colors.sub, marginTop: 14 }]}>
          This is in the future — you can mark it observed once the day arrives.
        </Text>
      )}

      <Button title="Close" variant="outline" full onPress={onClose} style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },

  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  heroLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 6,
  },
  title: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 28, lineHeight: 34 },
  subtitle: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  navBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    lineHeight: 32,
  },
  navLabelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  navLabel: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 26,
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: { fontFamily: 'Outfit-SemiBold', fontSize: 13 },

  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 1,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  cellEmpty: { backgroundColor: 'transparent' },
  cellGregorian: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    lineHeight: 18,
    marginTop: 2,
  },
  cellHijri: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    lineHeight: 12,
    marginTop: 1,
  },
  cellBadgeRow: {
    flexDirection: 'row',
    gap: 0,
    marginTop: 2,
  },
  cellIcon: {
    fontSize: 11,
    lineHeight: 13,
  },
  observedDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  observedCheck: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    color: '#fff',
    lineHeight: 10,
  },

  summaryTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  summaryText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 18,
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendIcon: { fontSize: 13 },
  legendLabel: { fontSize: 12, fontFamily: 'Outfit-Regular' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendBox: { width: 12, height: 12, borderRadius: 3, borderWidth: 2 },

  // Solid scrim modal (no BlurView, v1.2.5 rule).
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalScroll: { padding: 24 },
  modalTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, lineHeight: 28 },
  modalSub: { fontFamily: 'Outfit-Regular', fontSize: 13, marginTop: 4 },
  modalDivider: { height: 16 },
  modalBody: { fontFamily: 'Outfit-Regular', fontSize: 14, lineHeight: 20 },

  modalPillFull: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  modalPillText: { fontFamily: 'Outfit-SemiBold', fontSize: 14 },

  observeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  observeTitle: { fontFamily: 'Outfit-Bold', fontSize: 15 },
  observeSub: { fontFamily: 'Outfit-Regular', fontSize: 12, marginTop: 2 },
});
