import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';

interface Props {
  onUnlock: () => void;
  onFallbackToPin?: () => void;
  hasPinFallback: boolean;
}

/**
 * Fingerprint / face authentication gate. Falls through to an "Unlock with PIN"
 * button only when the user actually has a PIN set — otherwise a plain "Try again"
 * CTA is offered. Runs `authenticateAsync` once on mount; the user can retry on
 * cancel/failure without re-rendering the whole tree.
 */
export default function BiometricLockScreen({ onUnlock, onFallbackToPin, hasPinFallback }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'idle' | 'prompting' | 'failed' | 'unavailable'>('idle');

  const runAuth = useCallback(async () => {
    setStatus('prompting');
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        setStatus('unavailable');
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock ForSHE',
        cancelLabel: hasPinFallback ? 'Use PIN' : 'Cancel',
        disableDeviceFallback: false,
      });
      if (res.success) {
        onUnlock();
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  }, [hasPinFallback, onUnlock]);

  // Auto-prompt on mount so the native sheet appears immediately.
  useEffect(() => {
    runAuth();
  }, [runAuth]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.deep }]}>ForSHE</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Biometric lock enabled</Text>

        <View style={styles.iconWrap}>
          <Text style={styles.bigIcon}>🔒</Text>
        </View>

        <Text style={[styles.hint, { color: colors.sub }]}>
          {status === 'prompting' && 'Authenticate to unlock…'}
          {status === 'idle' && 'Tap below to unlock with fingerprint or face.'}
          {status === 'failed' && 'Authentication cancelled or failed.'}
          {status === 'unavailable' && 'Biometric not available on this device.'}
        </Text>

        {status !== 'prompting' && (
          <Button title="🔐 Try Biometric" variant="gold" full onPress={runAuth} style={styles.btn} />
        )}

        {hasPinFallback && onFallbackToPin && (
          <TouchableOpacity
            onPress={onFallbackToPin}
            style={styles.linkBtn}
            accessibilityRole="button"
            accessibilityLabel="Unlock with PIN instead"
          >
            <Text style={[styles.linkText, { color: colors.gold }]}>Use PIN instead</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 32, alignItems: 'center' },
  logo: { width: 80, height: 80, marginBottom: 12 },
  title: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 32 },
  subtitle: { fontFamily: 'Outfit-Regular', fontSize: 13, marginTop: 2, marginBottom: 40 },
  iconWrap: { marginVertical: 32 },
  bigIcon: { fontSize: 72 },
  hint: { fontSize: 14, fontFamily: 'Outfit-Regular', textAlign: 'center', marginBottom: 24, minHeight: 22 },
  btn: { marginBottom: 12 },
  linkBtn: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: 'Outfit-SemiBold', fontSize: 14 },
});
