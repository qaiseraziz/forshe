import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import {
  hijriForDate,
  isAyyamAlBid,
  isMondayOrThursday,
} from '../utils/prayer';
import { dateToISO, todayISO } from '../utils/dates';
import { MONTHS } from '../constants/data';
import type { FastingLog, FastingType } from '../types';
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
  HennaIcon,
  HennaBadge,
  HennaPill,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';

type FilterKey = 'all' | 'mon_thu' | 'white';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayCellInfo {
  iso: string;
  gregorianDay: number;
  hijriDay: number | null;
  inMonth: boolean;
  fastingTypes: FastingType[];
  isToday: boolean;
  isPast: boolean;
}

interface DayCellProps {
  cell: DayCellInfo;
  filter: FilterKey;
  observed: boolean;
  onPress: (cell: DayCellInfo) => void;
}

const DayCell = React.memo(function DayCell({ cell, filter, observed, onPress }: DayCellProps) {
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

  const bg = showFasting ? hennaColors.bronzeBg : hennaColors.paper2;
  const numColor = showFasting ? hennaColors.bronze : hennaColors.ink;

  return (
    <Pressable
      onPress={() => onPress(cell)}
      accessibilityRole="button"
      accessibilityLabel={`${cell.gregorianDay} ${WEEKDAY_FULL[new Date(cell.iso).getDay()]}${
        showFasting ? ', fasting day' : ''
      }${observed ? ', observed' : ''}`}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: bg,
          opacity: pressed ? 0.85 : cell.isPast && !observed ? 0.6 : 1,
          borderColor: cell.isToday ? hennaColors.henna : 'transparent',
          borderWidth: cell.isToday ? 2 : 0,
        },
      ]}
    >
      <Text style={[styles.cellGregorian, { color: numColor }]}>
        {cell.gregorianDay}
      </Text>
      {cell.hijriDay !== null && (
        <Text style={styles.cellHijri}>{cell.hijriDay}</Text>
      )}
      {showFasting && (
        <View style={styles.cellBadgeRow}>
          {isMonThu && <View style={[styles.cellDot, { backgroundColor: hennaColors.bronze }]} />}
          {isWhite && <View style={[styles.cellDot, { backgroundColor: hennaColors.henna }]} />}
        </View>
      )}
      {observed && (
        <View style={styles.observedDot}>
          <HennaIcon name="check" size={8} color={hennaColors.paper} />
        </View>
      )}
    </Pressable>
  );
});

export default function FastingCalendarScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { prayerSettings, fastingLogs, setFastingLogs } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const hijriOffset = prayerSettings.hijriOffset ?? 0;

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const [viewMonth, setViewMonth] = useState<{ y: number; m: number }>(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });

  const [filter, setFilter] = useState<FilterKey>('all');
  const [detail, setDetail] = useState<DayCellInfo | null>(null);

  const observedMap = useMemo(() => {
    const m = new Map<string, FastingLog>();
    for (const f of fastingLogs) m.set(f.date, f);
    return m;
  }, [fastingLogs]);

  const todayIso = todayISO();
  const currentGregorianMonthName = MONTHS[viewMonth.m];
  const hijriTodayInfo = useMemo(() => hijriForDate(new Date(), hijriOffset), [hijriOffset]);

  const cells = useMemo<DayCellInfo[]>(() => {
    const { y, m } = viewMonth;
    const firstOfMonth = new Date(y, m, 1);
    const firstDow = firstOfMonth.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out: DayCellInfo[] = [];

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
        return [...rest, { date: cell.iso, types: cell.fastingTypes, observed: next }];
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader
          title="Fasting"
          subtitle={`${hijriTodayInfo.day} ${hijriTodayInfo.monthName} ${hijriTodayInfo.year} AH`}
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
                  Sunnah fasting
                </Text>
              </View>
              <Text style={styles.heroTitle}>{currentGregorianMonthName} {viewMonth.y}</Text>
              <Text style={styles.heroSub}>
                {monthStats.fastingCount} fasting day{monthStats.fastingCount === 1 ? '' : 's'} · {monthStats.observedCount} observed
              </Text>
              <View style={styles.navRow}>
                <Pressable onPress={onPrevMonth} hitSlop={8} style={styles.navBtn} accessibilityLabel="Previous month">
                  <Text style={styles.navBtnText}>‹</Text>
                </Pressable>
                <Pressable onPress={onGoToday} style={styles.navTodayBtn} accessibilityLabel="Today">
                  <Text style={styles.navTodayText}>Today</Text>
                </Pressable>
                <Pressable onPress={onNextMonth} hitSlop={8} style={styles.navBtn} accessibilityLabel="Next month">
                  <Text style={styles.navBtnText}>›</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          <HennaPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} accent="bronze" />
          <HennaPill label="Mon–Thu" active={filter === 'mon_thu'} onPress={() => setFilter('mon_thu')} accent="bronze" />
          <HennaPill label="Ayyam al-Bid" active={filter === 'white'} onPress={() => setFilter('white')} accent="bronze" />
        </View>

        {/* Calendar grid */}
        <View style={styles.body}>
          <HennaCard padding={14} style={{ marginBottom: 14 }}>
            <View style={styles.weekHeader}>
              {WEEKDAY_LABELS.map((w, i) => (
                <View key={i} style={styles.weekCell}>
                  <Text style={styles.weekLabel}>{w}</Text>
                </View>
              ))}
            </View>
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
                  />
                );
              })}
            </View>
          </HennaCard>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: hennaColors.bronze }]} />
              <Text style={styles.legendLabel}>Mon / Thu</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: hennaColors.henna }]} />
              <Text style={styles.legendLabel}>Ayyam al-Bid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendObserved]}>
                <HennaIcon name="check" size={7} color={hennaColors.paper} />
              </View>
              <Text style={styles.legendLabel}>Observed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendBox} />
              <Text style={styles.legendLabel}>Today</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {detail && (
              <DetailModalBody
                cell={detail}
                observed={!!observedMap.get(detail.iso)?.observed}
                onClose={closeDetail}
                onToggle={v => toggleObserved(detail, v)}
                hijriOffset={hijriOffset}
                insetsBottom={insets.bottom}
              />
            )}
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

interface DetailModalBodyProps {
  cell: DayCellInfo;
  observed: boolean;
  onClose: () => void;
  onToggle: (v: boolean) => void;
  hijriOffset: number;
  insetsBottom: number;
}

function DetailModalBody({ cell, observed, onClose, onToggle, hijriOffset, insetsBottom }: DetailModalBodyProps) {
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
      <Text style={styles.modalTitle}>{gregDate}</Text>
      <Text style={styles.modalSub}>
        {weekdayLabel} · {hijri.day} {hijri.monthName} {hijri.year} AH
      </Text>

      <View style={styles.modalDivider} />

      {!hasFast && (
        <Text style={styles.modalBody}>No Sunnah fasting recommended for this day.</Text>
      )}

      {hasFast && (
        <View style={{ gap: 8 }}>
          {isMonThu && (
            <HennaBadge accent="bronze">Sunnah {weekdayLabel} fast</HennaBadge>
          )}
          {isWhite && (
            <HennaBadge accent="henna">
              Ayyam al-Bid — {hijri.day} {hijri.monthName}
            </HennaBadge>
          )}
        </View>
      )}

      {hasFast && isPastOrToday && (
        <View style={styles.observeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.observeTitle}>Mark as observed</Text>
            <Text style={styles.observeSub}>Track the fasts you completed.</Text>
          </View>
          <Switch
            value={observed}
            onValueChange={onToggle}
            trackColor={{ false: hennaColors.line, true: hennaColors.bronze }}
            thumbColor={hennaColors.paper}
          />
        </View>
      )}

      {hasFast && !isPastOrToday && (
        <Text style={[styles.modalBody, { marginTop: 14 }]}>
          This is in the future — mark observed once the day arrives.
        </Text>
      )}

      <HennaButton title="Close" variant="outline" full onPress={onClose} style={{ marginTop: 20 }} />
    </ScrollView>
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
  heroTitle: {
    marginTop: 8,
    fontFamily: hennaFonts.serif,
    fontSize: 24,
    color: hennaColors.ink,
    letterSpacing: -0.3,
  },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: { fontFamily: hennaFonts.serif, fontSize: 22, color: hennaColors.bronze },
  navTodayBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: hennaColors.bronze,
    minHeight: 44,
    justifyContent: 'center',
  },
  navTodayText: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.paper },

  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 4,
  },

  body: { paddingHorizontal: 16, paddingTop: 14 },

  weekHeader: { flexDirection: 'row', marginBottom: 6 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  weekLabel: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    color: hennaColors.muted,
    letterSpacing: 1,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
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
    fontFamily: hennaFonts.serif,
    fontSize: 14,
    marginTop: 2,
  },
  cellHijri: {
    fontFamily: hennaFonts.ui,
    fontSize: 9,
    color: hennaColors.muted,
    lineHeight: 11,
    marginTop: 1,
  },
  cellBadgeRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  cellDot: { width: 4, height: 4, borderRadius: 2 },
  observedDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: hennaColors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendObserved: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: hennaColors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBox: { width: 12, height: 12, borderRadius: 3, borderWidth: 2, borderColor: hennaColors.henna },
  legendLabel: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(60,40,20,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: hennaColors.pearl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
  },
  modalScroll: { padding: 24 },
  modalTitle: { fontFamily: hennaFonts.serif, fontSize: 22, color: hennaColors.ink },
  modalSub: { marginTop: 4, fontFamily: hennaFonts.ui, fontSize: 13, color: hennaColors.muted },
  modalDivider: { height: 16 },
  modalBody: { fontFamily: hennaFonts.ui, fontSize: 13, color: hennaColors.ink2, lineHeight: 19 },

  observeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: hennaColors.paper2,
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  observeTitle: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  observeSub: { marginTop: 2, fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted },
});
