// v1.2.8-dev — Cloud sign in / sign up screen.
//
// Deep-linked from BackupScreen only — NOT listed in the drawer groups
// (same pattern as PrayerSettings). On success, navigates back so the
// BackupScreen can surface the cloud upload / restore UI.

import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { gradients } from '../constants/colors';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export default function CloudAuthScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const passwordRef = useRef<TextInput | null>(null);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Backup');
  }, [navigation]);

  const submit = useCallback(async () => {
    if (busy) return;
    setConfirmMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast('Enter your email', null, 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', null, 'error');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password });
        if (error) {
          showToast(error.message, null, 'error');
        } else if (data.session) {
          // Email confirmation disabled — user is signed in immediately.
          showToast('Account created', null, 'success');
          goBack();
        } else {
          // Email confirmation enabled — user must click the link before signing in.
          setConfirmMsg(
            `We sent a confirmation link to ${trimmedEmail}. Click it, then come back and sign in.`,
          );
          setMode('signin');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          showToast(error.message, null, 'error');
        } else {
          showToast('Signed in', null, 'success');
          goBack();
        }
      }
    } catch (e: any) {
      showToast(e?.message || 'Something went wrong', null, 'error');
    } finally {
      setBusy(false);
    }
  }, [busy, email, password, mode, showToast, goBack]);

  const onForgotPassword = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast('Enter your email first', null, 'info');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (error) showToast(error.message, null, 'error');
      else showToast('Check your inbox for a reset link', null, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to send reset email', null, 'error');
    } finally {
      setBusy(false);
    }
  }, [email, showToast]);

  const modeLabel = mode === 'signin' ? 'Sign In' : 'Sign Up';

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <Card
          gradient={dark ? gradients.purpleHeroDark : gradients.purpleHero}
          style={{ backgroundColor: colors.purpleBg, borderColor: colors.purpleBorder }}
        >
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.purple }]}>☁️ Cloud Backup</Text>
              <Text style={[styles.heroTitle, { color: colors.deep }]}>
                {modeLabel} to ForSHE Cloud
              </Text>
              <Text style={[styles.heroSub, { color: colors.sub }]}>
                Your backups live in your own Supabase account — we never see your data.
              </Text>
            </View>
          </View>
        </Card>

        {/* Mode toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.bg3 }]}>
          {(['signin', 'signup'] as Mode[]).map(m => {
            const active = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.togglePill,
                  active && { backgroundColor: colors.purple },
                ]}
                onPress={() => { setMode(m); setConfirmMsg(null); }}
                accessibilityRole="button"
                accessibilityLabel={m === 'signin' ? 'Switch to Sign In' : 'Switch to Sign Up'}
                activeOpacity={0.8}
              >
                <Text style={[styles.togglePillText, { color: active ? '#fff' : colors.sub }]}>
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {confirmMsg ? (
          <Card style={{ backgroundColor: colors.goldBg }}>
            <Text style={[styles.confirmTitle, { color: colors.gold }]}>📬 Check your email</Text>
            <Text style={[styles.confirmBody, { color: colors.sub }]}>{confirmMsg}</Text>
          </Card>
        ) : null}

        {/* Form */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.deep }]}>
            {mode === 'signin' ? 'Welcome back' : 'Create your cloud account'}
          </Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>
            Cloud password = your Supabase account. This is DIFFERENT from the backup password
            that encrypts the file itself.
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>EMAIL</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            autoFocus
            editable={!busy}
          />

          <View style={{ height: 12 }} />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>PASSWORD</Text>
          <Input
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={mode === 'signup' ? 'newPassword' : 'password'}
            returnKeyType="done"
            onSubmitEditing={submit}
            editable={!busy}
          />

          <View style={{ height: 16 }} />

          <Button
            title={busy ? 'Please wait…' : modeLabel}
            variant="purple"
            onPress={submit}
          />

          {mode === 'signin' ? (
            <TouchableOpacity
              onPress={onForgotPassword}
              disabled={busy}
              style={styles.forgotRow}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.forgotText, { color: colors.purple }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        <Card style={{ backgroundColor: colors.surfaceMuted }}>
          <Text style={[styles.footnote, { color: colors.muted }]}>
            ForSHE never uploads plaintext. Every cloud backup is encrypted on this device first
            with the backup password you pick — Supabase only ever stores ciphertext.
          </Text>
        </Card>

        <View style={styles.bottomPad} />
      </ScrollView>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  heroLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 10,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 26, lineHeight: 32, marginBottom: 8,
  },
  heroSub: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 20 },
  toggleRow: {
    flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16,
  },
  togglePill: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', minHeight: 44,
    justifyContent: 'center',
  },
  togglePillText: { fontFamily: 'Outfit-Bold', fontSize: 14 },
  sectionTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, marginBottom: 6 },
  sectionSub: { fontFamily: 'Outfit-Regular', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8,
  },
  forgotRow: { marginTop: 14, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  forgotText: { fontFamily: 'Outfit-SemiBold', fontSize: 14 },
  confirmTitle: { fontFamily: 'Outfit-Bold', fontSize: 14, marginBottom: 6 },
  confirmBody: { fontFamily: 'Outfit-Regular', fontSize: 14, lineHeight: 20 },
  footnote: { fontFamily: 'Outfit-Regular', fontSize: 12, lineHeight: 18 },
  bottomPad: { height: 40 },
});
