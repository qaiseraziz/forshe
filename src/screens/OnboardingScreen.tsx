import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '💰',
    title: 'Track Expenses',
    desc: 'Keep tabs on every rupee. Log what you receive and what you spend with just a tap.',
    gradient: ['#fef8ee', '#fdf0d5'] as [string, string],
    color: '#c8860a',
  },
  {
    icon: '🍳',
    title: 'Plan Meals',
    desc: 'Organize your weekly cooking schedule. Never wonder "what to cook?" again.',
    gradient: ['#f0faf5', '#e0f5eb'] as [string, string],
    color: '#1a8a5a',
  },
  {
    icon: '🧹',
    title: 'Manage Tasks',
    desc: 'Track your maid\'s daily tasks and attendance. Stay organized effortlessly.',
    gradient: ['#f0f7ff', '#ddeeff'] as [string, string],
    color: '#1d6fa4',
  },
  {
    icon: '🔔',
    title: 'Never Forget',
    desc: 'Set reminders for bills, appointments, and important dates. We\'ll notify you on time.',
    gradient: ['#f5f2ff', '#ece5ff'] as [string, string],
    color: '#6b3fa0',
  },
  {
    icon: '🌸',
    title: 'Your Privacy Matters',
    desc: 'Track your cycle privately and securely. All data stays on your device.',
    gradient: ['#fff2f6', '#ffe5ed'] as [string, string],
    color: '#c0395a',
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const gradient: [string, string] = dark
    ? [colors.gradientStart, colors.gradientEnd]
    : slide.gradient;

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.slideContent}>
          <Text style={styles.icon}>{slide.icon}</Text>
          <Text style={[styles.title, { color: slide.color }]}>{slide.title}</Text>
          <Text style={[styles.desc, { color: colors.sub }]}>{slide.desc}</Text>
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === current ? slide.color : colors.border },
                i === current && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          {!isLast ? (
            <>
              <Button
                title="Skip"
                variant="outline"
                onPress={onComplete}
                style={{ flex: 1 }}
              />
              <Button
                title="Next"
                variant="gold"
                onPress={() => setCurrent(c => c + 1)}
                style={{ flex: 1 }}
              />
            </>
          ) : (
            <Button
              title="Get Started"
              variant="gold"
              full
              onPress={onComplete}
            />
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
  icon: { fontSize: 80, marginBottom: 30 },
  title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 32, marginBottom: 16, textAlign: 'center' },
  desc: {
    fontSize: 16, fontFamily: 'Outfit-Regular', lineHeight: 26,
    textAlign: 'center', paddingHorizontal: 10,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  buttons: { flexDirection: 'row', gap: 12 },
});
