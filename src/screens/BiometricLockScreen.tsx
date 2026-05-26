import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { LottieBox } from '../components/ui/LottieBox';
import { hennaColors, hennaFonts, hennaGradients } from '../constants/hennaTokens';
import { HennaButton, HennaIcon } from '../components/henna';

const colors = {
  deep: hennaColors.ink,
  muted: hennaColors.muted,
  sub: hennaColors.ink2,
  gold: hennaColors.henna,
};

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
    <LinearGradient colors={hennaGradients.page} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.deep }]}>ForSHE</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Biometric lock enabled</Text>

        {/* v1.2.4-dev: while prompting, play the one-shot pulse Lottie;
            otherwise show the static lock emoji. No loops, no ambient anim. */}
        <View style={styles.iconWrap}>
          {status === 'prompting' ? (
            <LottieBox animation="pulse" size={120} fallbackEmoji="🔐" />
          ) : (
            <HennaIcon name="lock" size={64} color={hennaColors.henna} />
          )}
        </View>

        <Text style={[styles.hint, { color: colors.sub }]}>
          {status === 'prompting' && 'Authenticate to unlock…'}
          {status === 'idle' && 'Tap below to unlock with fingerprint or face.'}
          {status === 'failed' && 'Authentication cancelled or failed.'}
          {status === 'unavailable' && 'Biometric not available on this device.'}
        </Text>

        {status !== 'prompting' && (
          <HennaButton title="Try biometric" icon="lock" variant="primary" full onPress={runAuth} style={styles.btn} />
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
  title: { fontFamily: hennaFonts.serif, fontSize: 28 },
  subtitle: { fontFamily: hennaFonts.ui, fontSize: 13, marginTop: 2, marginBottom: 40 },
  iconWrap: { marginVertical: 32 },
  hint: { fontFamily: hennaFonts.ui, fontSize: 13, textAlign: 'center', marginBottom: 24, minHeight: 22 },
  btn: { marginBottom: 12 },
  linkBtn: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: hennaFonts.uiSemi, fontSize: 13 },
});
