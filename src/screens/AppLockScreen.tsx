import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hennaColors, hennaFonts, hennaGradients } from '../constants/hennaTokens';

const colors = {
  deep: hennaColors.ink,
  muted: hennaColors.muted,
  border: hennaColors.line,
  bg3: hennaColors.paper2,
  surfaceMuted: hennaColors.paper2,
  gold: hennaColors.henna,
  red: hennaColors.henna,
};

interface Props {
  onUnlock: () => void;
  storedPin: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30_000; // 30 seconds

export default function AppLockScreen({ onUnlock, storedPin }: Props) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);

  const isLockedOut = lockedUntil !== null && Date.now() < lockedUntil;

  // Countdown timer during lockout
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockRemaining(remaining);
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailCount(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // PIN verification with brute-force protection and proper cleanup
  useEffect(() => {
    if (pin.length !== 4) return;

    if (pin === storedPin) {
      onUnlock();
      return;
    }

    // Wrong PIN
    setError(true);
    Vibration.vibrate(200);
    setFailCount(prev => {
      const next = prev + 1;
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION);
      }
      return next;
    });

    const timer = setTimeout(() => {
      setPin('');
      setError(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [pin, storedPin, onUnlock]);

  const addDigit = (d: string) => {
    if (pin.length < 4 && !isLockedOut) setPin(p => p + d);
  };

  const deleteLast = () => setPin(p => p.slice(0, -1));

  return (
    <LinearGradient colors={hennaGradients.page} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <Image source={require('../../assets/logo.png')} style={styles.lockLogo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.deep }]}>ForSHE</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Enter your PIN to continue</Text>

        {/* PIN dots */}
        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.pinDot,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                pin.length > i && { backgroundColor: colors.gold, borderColor: colors.gold },
                error && { backgroundColor: colors.red, borderColor: colors.red },
              ]}
            />
          ))}
        </View>

        {isLockedOut && (
          <Text style={[styles.errorText, { color: colors.red }]}>
            Too many attempts. Try again in {lockRemaining}s
          </Text>
        )}
        {error && !isLockedOut && <Text style={[styles.errorText, { color: colors.red }]}>Incorrect PIN</Text>}

        {/* Number pad */}
        <View style={styles.numPad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(key => (
            <TouchableOpacity
              key={key || 'empty'}
              style={[
                styles.numKey,
                { backgroundColor: colors.bg3 },
                !key && styles.numKeyEmpty,
              ]}
              activeOpacity={0.6}
              onPress={() => {
                if (key === '⌫') deleteLast();
                else if (key) addDigit(key);
              }}
              disabled={!key || isLockedOut}
            >
              <Text style={[styles.numKeyText, { color: colors.deep }, key === '⌫' && { fontSize: 22 }]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  lockLogo: { width: 100, height: 100, marginBottom: 16 },
  title: { fontFamily: hennaFonts.serif, fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: hennaFonts.ui, fontSize: 14, marginBottom: 40 },
  pinDots: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  pinDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
  },
  errorText: { fontFamily: hennaFonts.uiSemi, fontSize: 13, marginBottom: 20 },
  numPad: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    maxWidth: 300, gap: 16, marginTop: 24,
  },
  numKey: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  numKeyEmpty: { backgroundColor: 'transparent' },
  numKeyText: { fontFamily: hennaFonts.serif, fontSize: 24 },
});
