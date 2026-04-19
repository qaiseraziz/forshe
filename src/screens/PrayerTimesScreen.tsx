import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { gradients } from '../constants/colors';
import {
  computePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  formatCountdown,
  hijriToday,
  isSunnahWeekday,
  isAyyamAlBid,
  PrayerName,
} from '../utils/prayer';

const PRAYER_ORDER: { name: PrayerName; icon: string }[] = [
  { name: 'Fajr', icon: '🌅' },
  { name: 'Sunrise', icon: '☀️' },
  { name: 'Dhuhr', icon: '🌞' },
  { name: 'Asr', icon: '🌤️' },
  { name: 'Maghrib', icon: '🌆' },
  { name: 'Isha', icon: '🌙' },
];

export default function PrayerTimesScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { prayerSettings } = useData();
  const { toast, dismiss: dismissToast } = useToast();

  // Tick every 30s to keep the countdown fresh
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const hijri = useMemo(() => hijriToday(now), [now]);

  const times = useMemo(
    () => computePrayerTimes(now, prayerSettings),
    [now, prayerSettings],
  );

  const next = useMemo(
    () => (times ? getNextPrayer(times, now) : null),
    [times, now],
  );

  const sunnahWeekday = useMemo(() => isSunnahWeekday(now), [now]);
  const ayyamAlBidDay = useMemo(() => isAyyamAlBid(now), [now]);

  const tmrWeekday = useMemo(() => isSunnahWeekday(new Date(now.getTime() + 86400000)), [now]);

  const openSettings = () => navigation.navigate('PrayerSettings');

  const heroGradient = dark ? gradients.greenHeroDark : gradients.greenHero;

  // --- No location yet — show setup prompt ---
  if (!prayerSettings.location) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Card gradient={heroGradient}>
            <View style={styles.heroHeaderRow}>
              <DrawerMenuButton />
              <View style={styles.heroHeaderText}>
                <Text style={[styles.heroLabel, { color: colors.green }]}>🕌 Prayer Times</Text>
                <Text style={[styles.title, { color: colors.deep }]}>Set your location</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  {hijri.day} {hijri.monthName} {hijri.year} AH
                </Text>
              </View>
            </View>
          </Card>

          <EmptyState
            icon="📍"
            text="To calculate accurate salah times, ForSHE needs your location or a city. This stays on your device."
          />
          <Button
            title="Set Up Prayer Times"
            icon="⚙️"
            variant="gold"
            onPress={openSettings}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
        <Toast toast={toast} dismiss={dismissToast} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — heroHeaderRow pattern, greenHero (dark parity) */}
        <Card gradient={heroGradient}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.green }]}>🕌 Prayer Times</Text>
              <Text style={[styles.title, { color: colors.deep }]}>
                {prayerSettings.location.name}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {hijri.day} {hijri.monthName} {hijri.year} AH
              </Text>
            </View>
            <TouchableOpacity
              onPress={openSettings}
              accessibilityRole="button"
              accessibilityLabel="Prayer times settings"
              style={styles.settingsBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 22 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Next prayer big card */}
        {next && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>NEXT PRAYER</Text>
            <View style={styles.nextRow}>
              <Text style={[styles.nextName, { color: colors.deep }]}>{next.name}</Text>
              <Text style={[styles.nextTime, { color: colors.gold }]}>
                {formatPrayerTime(next.time)}
              </Text>
            </View>
            <Text style={[styles.nextCountdown, { color: colors.sub }]}>
              in {formatCountdown(next.minutesUntil)}
            </Text>
          </Card>
        )}

        {/* Today's times */}
        {times && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>TODAY</Text>
            {PRAYER_ORDER.map((p, i) => {
              const when = times[p.name.toLowerCase() as keyof typeof times] as Date;
              const isNext = next?.name === p.name;
              return (
                <View
                  key={p.name}
                  style={[
                    styles.prayerRow,
                    isNext && { backgroundColor: colors.goldBg, borderRadius: 12, paddingHorizontal: 12 },
                    i < PRAYER_ORDER.length - 1 && { borderBottomWidth: isNext ? 0 : 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={styles.prayerIcon}>{p.icon}</Text>
                  <Text
                    style={[
                      styles.prayerName,
                      { color: isNext ? colors.gold : colors.deep },
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[
                      styles.prayerTime,
                      { color: isNext ? colors.gold : colors.sub },
                    ]}
                  >
                    {formatPrayerTime(when)}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}

        {/* Sunnah fasting status */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>SUNNAH FASTING</Text>
          {sunnahWeekday && (
            <View style={[styles.fastingLine, { backgroundColor: colors.greenBg }]}>
              <Text style={[styles.fastingText, { color: colors.green }]}>
                ✨ Sunnah fasting day ({sunnahWeekday})
              </Text>
            </View>
          )}
          {ayyamAlBidDay !== null && (
            <View style={[styles.fastingLine, { backgroundColor: colors.goldBg, marginTop: sunnahWeekday ? 8 : 0 }]}>
              <Text style={[styles.fastingText, { color: colors.gold }]}>
                🌙 Ayyam al-Bid — day {ayyamAlBidDay} of 3
              </Text>
            </View>
          )}
          {!sunnahWeekday && ayyamAlBidDay === null && tmrWeekday && prayerSettings.mondayThursdayFasting && (
            <Text style={[styles.fastingNeutral, { color: colors.sub }]}>
              Reminder set for tonight — tomorrow is {tmrWeekday}.
            </Text>
          )}
          {!sunnahWeekday && ayyamAlBidDay === null && !tmrWeekday && (
            <Text style={[styles.fastingNeutral, { color: colors.muted }]}>
              No Sunnah fasting day today. Next Monday/Thursday reminder will arrive the night before.
            </Text>
          )}
        </Card>

        <Button
          title="Prayer Settings"
          icon="⚙️"
          variant="outline"
          onPress={openSettings}
          style={{ marginTop: 4 }}
        />
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
  heroLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 6,
  },
  title: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 28, lineHeight: 34 },
  subtitle: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },
  settingsBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.2, marginBottom: 10,
  },
  nextRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  nextName: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28 },
  nextTime: { fontFamily: 'Outfit-Bold', fontSize: 26 },
  nextCountdown: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 6 },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    minHeight: 44,
  },
  prayerIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  prayerName: { flex: 1, fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  prayerTime: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  fastingLine: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  fastingText: { fontFamily: 'Outfit-SemiBold', fontSize: 14 },
  fastingNeutral: { fontSize: 13, fontFamily: 'Outfit-Regular', lineHeight: 20 },
});
