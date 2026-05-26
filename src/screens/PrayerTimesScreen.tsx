import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { LottieBox } from '../components/ui/LottieBox';
import {
  computePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  formatCountdown,
  hijriForDate,
  isSunnahWeekday,
  ayyamAlBidPositionForDate,
  PrayerName,
} from '../utils/prayer';
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
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';
import type { HennaIconName } from '../components/henna';

const PRAYER_ORDER: { name: PrayerName; icon: HennaIconName }[] = [
  { name: 'Fajr', icon: 'sun' },
  { name: 'Sunrise', icon: 'sun' },
  { name: 'Dhuhr', icon: 'sun' },
  { name: 'Asr', icon: 'sun' },
  { name: 'Maghrib', icon: 'moon' },
  { name: 'Isha', icon: 'moon' },
];

export default function PrayerTimesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { prayerSettings } = useData();
  const { toast, dismiss: dismissToast } = useToast();

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const [tick, setTick] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setTick(t => t + 1);
      const id = setInterval(() => setTick(t => t + 1), 30000);
      return () => clearInterval(id);
    }, []),
  );

  const now = useMemo(() => new Date(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const hijriOffset = prayerSettings.hijriOffset ?? 0;
  const hijri = useMemo(() => hijriForDate(now, hijriOffset), [now, hijriOffset]);

  const times = useMemo(() => computePrayerTimes(now, prayerSettings), [now, prayerSettings]);
  const next = useMemo(() => (times ? getNextPrayer(times, now) : null), [times, now]);

  const sunnahWeekday = useMemo(() => isSunnahWeekday(now), [now]);
  const ayyamAlBidDay = useMemo(() => ayyamAlBidPositionForDate(now, hijriOffset), [now, hijriOffset]);
  const tmrWeekday = useMemo(() => isSunnahWeekday(new Date(now.getTime() + 86400000)), [now]);

  const openSettings = useCallback(() => {
    navigation.navigate('PrayerSettings');
  }, [navigation]);

  if (!prayerSettings.location) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
          showsVerticalScrollIndicator={false}
        >
          <HennaHeader title="Prayer Times" subtitle="Set your location" onMenu={onMenu} />

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
                  <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.plum }]}>
                    Setup needed
                  </Text>
                </View>
                <Text style={styles.heroTitle}>Set your location</Text>
                <Text style={styles.heroSub}>
                  {hijri.day} {hijri.monthName} {hijri.year} AH
                </Text>
                <Text style={styles.heroBody}>
                  To calculate accurate salah times, ForSHE needs your location or a city. Stays on this device.
                </Text>
                <View style={{ marginTop: 14 }}>
                  <HennaButton title="Set up prayer times" icon="gear" variant="plum" size="sm" onPress={openSettings} />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        <Toast toast={toast} dismiss={dismissToast} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader
          title="Prayer Times"
          subtitle={`${hijri.day} ${hijri.monthName} ${hijri.year} AH`}
          onMenu={onMenu}
          action={
            <Pressable onPress={openSettings} hitSlop={8} style={styles.headerIconBtn} accessibilityLabel="Prayer settings">
              <HennaIcon name="gear" size={18} color={hennaColors.ink2} />
            </Pressable>
          }
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
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.plum }]}>
                  {prayerSettings.location.name}
                </Text>
              </View>
              {next ? (
                <>
                  <Text style={styles.heroTitle}>{next.name}</Text>
                  <Text style={styles.heroTimeBig}>{formatPrayerTime(next.time)}</Text>
                  <Text style={styles.heroSub}>in {formatCountdown(next.minutesUntil)}</Text>
                </>
              ) : (
                <Text style={styles.heroTitle}>—</Text>
              )}
            </View>
          </View>
        </View>

        {/* Today's times */}
        {times && (
          <View style={styles.body}>
            <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Today</Text>
            <HennaCard padding={0}>
              {PRAYER_ORDER.map((p, i) => {
                const when = times[p.name.toLowerCase() as keyof typeof times] as Date;
                const isNext = next?.name === p.name;
                return (
                  <View
                    key={p.name}
                    style={[
                      styles.prayerRow,
                      isNext && { backgroundColor: hennaColors.plumBg },
                      i < PRAYER_ORDER.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: hennaColors.line,
                      },
                    ]}
                  >
                    <HennaIcon name={p.icon} size={16} color={isNext ? hennaColors.plum : hennaColors.muted} />
                    <Text
                      style={[
                        styles.prayerName,
                        { color: isNext ? hennaColors.plum : hennaColors.ink },
                      ]}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={[
                        styles.prayerTime,
                        { color: isNext ? hennaColors.plum : hennaColors.ink2 },
                      ]}
                    >
                      {formatPrayerTime(when)}
                    </Text>
                  </View>
                );
              })}
            </HennaCard>
          </View>
        )}

        {/* Sunnah fasting */}
        <View style={styles.body}>
          <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Sunnah fasting</Text>
          <HennaCard padding={16}>
            {sunnahWeekday && (
              <View style={styles.fastingRow}>
                <LottieBox animation="tasbeeh" size={36} fallbackEmoji="🌙" />
                <View style={{ flex: 1 }}>
                  <HennaBadge accent="sage">Sunnah fasting day · {sunnahWeekday}</HennaBadge>
                </View>
              </View>
            )}
            {ayyamAlBidDay !== null && (
              <View style={{ marginTop: sunnahWeekday ? 10 : 0 }}>
                <HennaBadge accent="bronze">Ayyam al-Bid — day {ayyamAlBidDay} of 3</HennaBadge>
              </View>
            )}
            {!sunnahWeekday && ayyamAlBidDay === null && tmrWeekday && prayerSettings.mondayThursdayFasting && (
              <Text style={styles.fastingNeutral}>
                Reminder set for tonight — tomorrow is {tmrWeekday}.
              </Text>
            )}
            {!sunnahWeekday && ayyamAlBidDay === null && !tmrWeekday && (
              <Text style={styles.fastingNeutral}>
                No Sunnah fasting day today. Next reminder arrives the night before.
              </Text>
            )}
          </HennaCard>
        </View>

        <View style={[styles.body, { marginTop: 8 }]}>
          <HennaButton title="Prayer settings" icon="gear" variant="outline" onPress={openSettings} />
        </View>
      </ScrollView>
      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

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
    fontSize: 26,
    color: hennaColors.ink,
    letterSpacing: -0.3,
  },
  heroTimeBig: {
    marginTop: 4,
    fontFamily: hennaFonts.serif,
    fontSize: 36,
    color: hennaColors.plum,
    letterSpacing: -0.5,
  },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  heroBody: { marginTop: 10, fontFamily: hennaFonts.ui, fontSize: 13, color: hennaColors.ink2, lineHeight: 19 },

  body: { paddingHorizontal: 16, paddingTop: 18 },
  sectionEyebrow: { paddingHorizontal: 8, paddingBottom: 10 },

  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  prayerName: { flex: 1, fontFamily: hennaFonts.uiSemi, fontSize: 14 },
  prayerTime: { fontFamily: hennaFonts.serif, fontSize: 15 },

  fastingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fastingNeutral: {
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.muted,
    lineHeight: 18,
  },
});
