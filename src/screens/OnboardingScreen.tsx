import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  hennaColors,
  hennaFonts,
  hennaGradients,
} from '../constants/hennaTokens';
import { HennaButton, HennaIcon } from '../components/henna';
import type { HennaIconName } from '../components/henna';

const SLIDES: { icon: HennaIconName; title: string; desc: string; accent: string; bg: [string, string] }[] = [
  {
    icon: 'money',
    title: 'Track expenses',
    desc: 'Every rupee. Log what you receive and what you spend with one tap.',
    accent: hennaColors.henna,
    bg: hennaGradients.heroHenna,
  },
  {
    icon: 'pot',
    title: 'Plan meals',
    desc: 'Organize the week. Never wonder what to cook again.',
    accent: hennaColors.bronze,
    bg: hennaGradients.heroBronze,
  },
  {
    icon: 'broom',
    title: 'Manage tasks',
    desc: "Track daily chores and your helper's attendance, calmly.",
    accent: hennaColors.sage,
    bg: hennaGradients.heroSage,
  },
  {
    icon: 'bell',
    title: 'Never forget',
    desc: 'Bills, appointments, important dates — we nudge you in time.',
    accent: hennaColors.plum,
    bg: hennaGradients.heroPlum,
  },
  {
    icon: 'heart',
    title: 'Your privacy',
    desc: 'Stays on this device. Encrypted backups when you want them.',
    accent: hennaColors.pink,
    bg: hennaGradients.heroPink,
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <LinearGradient colors={slide.bg} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.slideContent}>
          <View style={styles.iconWrap}>
            <HennaIcon name={slide.icon} size={56} color={slide.accent} />
          </View>
          <Text style={[styles.title, { color: slide.accent }]}>{slide.title}</Text>
          <Text style={styles.desc}>{slide.desc}</Text>
        </View>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === current ? slide.accent : hennaColors.line },
                i === current && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {!isLast ? (
            <>
              <HennaButton title="Skip" variant="outline" onPress={onComplete} style={{ flex: 1 }} />
              <HennaButton
                title="Next"
                variant="primary"
                onPress={() => setCurrent(c => c + 1)}
                style={{ flex: 1 }}
              />
            </>
          ) : (
            <HennaButton title="Get started" variant="primary" full onPress={onComplete} />
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between' },
  slideContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: hennaFonts.serif,
    fontSize: 30,
    letterSpacing: -0.3,
    marginBottom: 14,
    textAlign: 'center',
  },
  desc: {
    fontFamily: hennaFonts.ui,
    fontSize: 15,
    color: hennaColors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 22 },
  buttons: { flexDirection: 'row', gap: 10 },
});
