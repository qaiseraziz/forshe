import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import {
  exportBackup, exportEncryptedBackup, exportCSV, importBackup,
  buildBackupJSON, encryptData, decryptData, isEncrypted, validateBackupData,
} from '../utils/backup';
import { uploadBackup, listBackups, downloadBackup, deleteBackup, CloudBackupMeta } from '../utils/cloudBackup';
import { useCloudSession } from '../hooks/useCloudSession';
import { supabase } from '../lib/supabase';
import { DAYS } from '../constants/data';
import { useCurrency } from '../context/CurrencyContext';
import { BackupData } from '../types';
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
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
  DividerOrnament,
} from '../components/henna';

const colors = {
  gold: hennaColors.henna,
  goldBg: hennaColors.hennaBg,
  green: hennaColors.sage,
  greenBg: hennaColors.sageBg,
  red: hennaColors.henna,
  redBg: hennaColors.hennaBg,
  blue: hennaColors.plum,
  blueBg: hennaColors.plumBg,
  purple: hennaColors.plum,
  purpleBg: hennaColors.plumBg,
  pink: hennaColors.pink,
  pinkBg: hennaColors.pinkBg,
  deep: hennaColors.ink,
  text: hennaColors.ink,
  sub: hennaColors.ink2,
  muted: hennaColors.muted,
  border: hennaColors.line,
  bg: hennaColors.pearl,
  bg2: hennaColors.paper,
  bg3: hennaColors.paper2,
  surfaceMuted: hennaColors.paper2,
};

const Card = HennaCard as any;
const Button = HennaButton as any;
const Divider = ({ label }: { label: string }) => (
  <View style={{ paddingHorizontal: 8, paddingVertical: 14 }}>
    <DividerOrnament color={hennaColors.henna} />
    <Text style={{
      marginTop: 8,
      textAlign: 'center',
      fontFamily: hennaFonts.uiSemi,
      fontSize: 10,
      color: hennaColors.muted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    }}>{label}</Text>
  </View>
);
const DrawerMenuButton = () => null;

type PwModalMode =
  | { kind: 'export' }
  | { kind: 'import' }
  | { kind: 'cloudUpload' }
  | { kind: 'cloudRestore'; fileName: string };

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, loading: sessionLoading } = useCloudSession();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();
  const {
    history,
    cooking,
    maidData,
    attendance,
    reminders,
    periods,
    budget,
    recurring,
    shopping,
    shoppingSessions,
    maidSalary,
    bodyProfile,
    bodyLogs,
    bodyStatsSettings,
    inventory,
    recipes,
    savingsGoals,
    vendors,
    prayerSettings,
    fastingLogs,
    handleImport,
  } = useData();
  const { pkr } = useCurrency();

  // Password modal state (handles both local and cloud flows)
  const [pwModal, setPwModal] = useState<PwModalMode | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [importPwResolver, setImportPwResolver] = useState<{ resolve: (pw: string | null) => void } | null>(null);

  // Cloud UI state (v1.2.11: simplified to single-file model)
  const [cloudFiles, setCloudFiles] = useState<CloudBackupMeta[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);

  const allData = useMemo(() => ({
    history, cooking, maidData, attendance, reminders, periods, budget, recurring, shopping, shoppingSessions, maidSalary, bodyProfile, bodyLogs, bodyStatsSettings,
    inventory, recipes, savingsGoals, vendors, prayerSettings, fastingLogs,
  }), [history, cooking, maidData, attendance, reminders, periods, budget, recurring, shopping, shoppingSessions, maidSalary, bodyProfile, bodyLogs, bodyStatsSettings, inventory, recipes, savingsGoals, vendors, prayerSettings, fastingLogs]);

  const mealCount = useMemo(() => Object.values(cooking).filter(Boolean).length, [cooking]);
  const taskCount = useMemo(() => DAYS.reduce((s, d) => s + (maidData[d]?.length || 0), 0), [maidData]);
  const totalRec = useMemo(() => history.filter(h => h.type === 'topup').reduce((s, h) => s + h.amount, 0), [history]);
  const totalSpent = useMemo(() => history.filter(h => h.type === 'expense').reduce((s, h) => s + h.amount, 0), [history]);

  // ----- Local backup handlers (unchanged from v1.2.7) -----

  const handleExportJSON = useCallback(async () => {
    try { await exportBackup(allData); } catch (e: any) { Alert.alert('Error', e.message || 'Failed to export.'); }
  }, [allData]);

  const handleExportEncrypted = useCallback(() => {
    setPassword('');
    setConfirmPw('');
    setPwModal({ kind: 'export' });
  }, []);

  const confirmExportEncrypted = useCallback(async () => {
    if (password.length < 4) { Alert.alert('Weak Password', 'Password must be at least 4 characters.'); return; }
    if (password !== confirmPw) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setPwModal(null);
    try { await exportEncryptedBackup(allData, password); } catch (e: any) { Alert.alert('Error', e.message || 'Failed to export.'); }
  }, [allData, password, confirmPw]);

  const handleExportCSV = useCallback(async () => {
    try { await exportCSV(history); } catch (e: any) { Alert.alert('Error', e.message || 'Failed to export CSV.'); }
  }, [history]);

  const promptPassword = useCallback((): Promise<string | null> => {
    return new Promise(resolve => {
      setPassword('');
      setConfirmPw('');
      setImportPwResolver({ resolve });
      setPwModal({ kind: 'import' });
    });
  }, []);

  const confirmImportPassword = useCallback(() => {
    setPwModal(null);
    if (importPwResolver) { importPwResolver.resolve(password); setImportPwResolver(null); }
  }, [password, importPwResolver]);

  const cancelImportPassword = useCallback(() => {
    setPwModal(null);
    if (importPwResolver) { importPwResolver.resolve(null); setImportPwResolver(null); }
  }, [importPwResolver]);

  const handleImportJSON = useCallback(async () => {
    try { await importBackup(handleImport, promptPassword); } catch (e: any) { Alert.alert('Error', e.message || 'Failed to import.'); }
  }, [handleImport, promptPassword]);

  // ----- Cloud backup handlers (v1.2.8-dev) -----

  const refreshCloudList = useCallback(async () => {
    if (!user) return;
    const { files, error } = await listBackups(user.id);
    if (error) showToast(error, null, 'error');
    else setCloudFiles(files);
  }, [user, showToast]);

  // Refresh the cloud file list on screen focus (battery rule: no polling).
  useFocusEffect(useCallback(() => {
    if (user) { refreshCloudList(); }
  }, [user, refreshCloudList]));

  const onSignIn = useCallback(() => {
    navigation.navigate('CloudAuth');
  }, [navigation]);

  const onSignOut = useCallback(async () => {
    Alert.alert('Sign out', 'You can sign back in anytime to restore your cloud backups.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) showToast(error.message, null, 'error');
          else showToast('Signed out', null, 'success');
        },
      },
    ]);
  }, [showToast]);

  const onCloudUpload = useCallback(() => {
    if (!user) { onSignIn(); return; }
    setPassword('');
    setConfirmPw('');
    setPwModal({ kind: 'cloudUpload' });
  }, [user, onSignIn]);

  const confirmCloudUpload = useCallback(async () => {
    if (!user) return;
    if (password.length < 4) { Alert.alert('Weak Password', 'Password must be at least 4 characters.'); return; }
    if (password !== confirmPw) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    const pwCopy = password;
    setPwModal(null);
    setCloudBusy(true);
    try {
      // ALWAYS encrypt before upload. Supabase never sees plaintext.
      const json = buildBackupJSON(allData);
      const ciphertext = encryptData(json, pwCopy);
      // v1.2.11: ONE backup file per user. Fixed filename — upsert overwrites.
      // No timestamp in the filename, no accumulating clutter in the bucket.
      const fileName = 'forshe-backup.forshe';
      const { ok, error } = await uploadBackup(user.id, fileName, ciphertext);
      if (!ok) {
        showToast(error || 'Upload failed', null, 'error');
        return;
      }
      // One-time cleanup: remove any old timestamped backups from before v1.2.11.
      try {
        const { files } = await listBackups(user.id);
        const stale = files.filter(f => f.name !== fileName).map(f => f.name);
        for (const old of stale) {
          await deleteBackup(user.id, old);
        }
      } catch { /* best-effort — don't block the success path */ }
      showToast('Backup updated ✓', null, 'success');
      refreshCloudList();
    } catch (e: any) {
      showToast(e?.message || 'Upload failed', null, 'error');
    } finally {
      setCloudBusy(false);
    }
  }, [user, password, confirmPw, allData, showToast, refreshCloudList]);

  const onOpenRestore = useCallback(() => {
    if (!user) { onSignIn(); return; }
    // v1.2.11: single-file model — skip the picker, go straight to password prompt.
    setPassword('');
    setConfirmPw('');
    setPwModal({ kind: 'cloudRestore', fileName: 'forshe-backup.forshe' });
  }, [user, onSignIn]);

  const confirmCloudRestore = useCallback(async () => {
    if (!user || !pwModal || pwModal.kind !== 'cloudRestore') return;
    const fileName = pwModal.fileName;
    if (!password) { Alert.alert('Password required', 'Enter the backup password to decrypt this file.'); return; }
    const pwCopy = password;
    setPwModal(null);
    setCloudBusy(true);
    try {
      const { content, error } = await downloadBackup(user.id, fileName);
      if (error || !content) {
        showToast(error || 'Download failed', null, 'error');
        return;
      }
      if (!isEncrypted(content)) {
        showToast('This file is not a ForSHE encrypted backup.', null, 'error');
        return;
      }
      const decrypted = decryptData(content, pwCopy);
      if (!decrypted) {
        Alert.alert('Wrong Password', 'Could not decrypt the backup. Check your backup password and try again.');
        return;
      }
      let parsed: unknown;
      try { parsed = JSON.parse(decrypted); } catch {
        showToast('Backup file is corrupted.', null, 'error');
        return;
      }
      const validation = validateBackupData(parsed);
      if (!validation.valid) {
        Alert.alert('Invalid Backup', validation.error);
        return;
      }
      const data: BackupData = validation.data;
      // v1.2.13: show a concrete summary so the user sees what's coming back.
      const counts: string[] = [];
      if (Array.isArray(data.history) && data.history.length) counts.push(`${data.history.length} transactions`);
      if (Array.isArray(data.reminders) && data.reminders.length) counts.push(`${data.reminders.length} reminders`);
      if (Array.isArray(data.periodLogs) && data.periodLogs.length) counts.push(`${data.periodLogs.length} cycle logs`);
      if (Array.isArray(data.bodyLogs) && data.bodyLogs.length) counts.push(`${data.bodyLogs.length} body logs`);
      if (Array.isArray(data.inventory) && data.inventory.length) counts.push(`${data.inventory.length} inventory`);
      if (Array.isArray(data.recipes) && data.recipes.length) counts.push(`${data.recipes.length} recipes`);
      if (Array.isArray(data.savingsGoals) && data.savingsGoals.length) counts.push(`${data.savingsGoals.length} goals`);
      if (Array.isArray(data.vendors) && data.vendors.length) counts.push(`${data.vendors.length} vendors`);
      if (Array.isArray(data.fastingLogs) && data.fastingLogs.length) counts.push(`${data.fastingLogs.length} fasting logs`);
      if (Array.isArray(data.shoppingSessions) && data.shoppingSessions.length) counts.push(`${data.shoppingSessions.length} shopping lists`);
      if (Array.isArray(data.maidSalary) && data.maidSalary.length) counts.push(`${data.maidSalary.length} salary`);
      const summary = counts.length ? counts.join(', ') : 'the backup';
      Alert.alert(
        'Restore from cloud',
        `Found: ${summary}.\n\nReplace ALL your current data?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => {
              handleImport(data);
              // v1.2.13: notif IDs were stripped on restore. Tell the user to
              // re-toggle so push notifications actually re-schedule.
              const hasReminders = Array.isArray(data.reminders) && data.reminders.length > 0;
              const hasPrayer = data.prayerSettings && data.prayerSettings.enabled;
              const hasBodyReminder = data.bodyStatsSettings && data.bodyStatsSettings.reminderEnabled;
              if (hasReminders || hasPrayer || hasBodyReminder) {
                Alert.alert(
                  'Restored ✓',
                  'Everything is back. To re-enable push notifications:\n\n' +
                  (hasReminders ? '• Open Reminders and toggle each reminder off → on\n' : '') +
                  (hasPrayer ? '• Open Prayer Settings and tap "Save & Schedule"\n' : '') +
                  (hasBodyReminder ? '• Open Settings → Body Stats and toggle the reminder off → on\n' : '') +
                  '\nData is safe; only notifications need re-scheduling.',
                );
              } else {
                showToast('Restored from cloud ✓', null, 'success');
              }
            },
          },
        ],
      );
    } catch (e: any) {
      showToast(e?.message || 'Restore failed', null, 'error');
    } finally {
      setCloudBusy(false);
    }
  }, [user, pwModal, password, handleImport, showToast]);

  const summaryItems = useMemo(() => [
    { value: String(history.length), label: 'Transactions', color: colors.deep },
    { value: pkr(totalRec), label: 'Total Received', color: colors.green },
    { value: pkr(totalSpent), label: 'Total Spent', color: colors.red },
    { value: String(mealCount), label: 'Meals Planned', color: colors.gold },
    { value: String(taskCount), label: 'Maid Tasks', color: colors.blue },
    { value: String(reminders.length), label: 'Reminders', color: colors.purple },
    { value: String(periods.length), label: 'Cycle Logs', color: colors.pink },
    { value: String(bodyLogs.length), label: 'Body Logs', color: colors.red },
    { value: budget ? pkr(budget) : '—', label: 'Budget', color: colors.gold },
  ], [history.length, totalRec, totalSpent, mealCount, taskCount, reminders.length, periods.length, bodyLogs.length, budget, colors, pkr]);

  const onModalCancel = useCallback(() => {
    if (pwModal?.kind === 'import') cancelImportPassword();
    else setPwModal(null);
  }, [pwModal, cancelImportPassword]);

  const modalTitle = useMemo(() => {
    if (!pwModal) return '';
    if (pwModal.kind === 'export') return '🔒 Set Backup Password';
    if (pwModal.kind === 'cloudUpload') return '☁️ Encrypt for Cloud';
    if (pwModal.kind === 'cloudRestore') return '🔑 Decrypt Cloud Backup';
    return '🔑 Enter Password';
  }, [pwModal]);

  const modalDesc = useMemo(() => {
    if (!pwModal) return '';
    if (pwModal.kind === 'export' || pwModal.kind === 'cloudUpload') {
      return 'Your backup will be encrypted with AES-256 before it leaves this device. Remember this password — you\'ll need it to restore.';
    }
    return 'This backup is encrypted. Enter the BACKUP password (not your cloud account password) to decrypt it.';
  }, [pwModal]);

  const modalCta = useMemo(() => {
    if (!pwModal) return '';
    if (pwModal.kind === 'export') return 'Encrypt & Share';
    if (pwModal.kind === 'cloudUpload') return 'Encrypt & Upload';
    if (pwModal.kind === 'cloudRestore') return 'Decrypt';
    return 'Decrypt';
  }, [pwModal]);

  const onModalPrimary = useCallback(() => {
    if (!pwModal) return;
    if (pwModal.kind === 'export') confirmExportEncrypted();
    else if (pwModal.kind === 'cloudUpload') confirmCloudUpload();
    else if (pwModal.kind === 'cloudRestore') confirmCloudRestore();
    else confirmImportPassword();
  }, [pwModal, confirmExportEncrypted, confirmCloudUpload, confirmCloudRestore, confirmImportPassword]);

  const needsConfirmField = pwModal?.kind === 'export' || pwModal?.kind === 'cloudUpload';

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  return (
    <LinearGradient colors={hennaGradients.page} style={styles.container}>
    <HennaHeader title="Backup" subtitle="Keep your data safe" onMenu={onMenu} style={{ paddingTop: insets.top + 6 }} />
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: 0 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card */}
      <Card>
        <View style={styles.heroHeaderRow}>
          <DrawerMenuButton />
          <View style={styles.heroHeaderText}>
            <Text style={[styles.heroLabel, { color: colors.gold }]}>💼 Backup & Restore</Text>
            <Text style={[styles.heroTitle, { color: colors.deep }]}>Keep your data safe</Text>
          </View>
        </View>
        <Text style={[styles.warningText, { color: colors.sub }]}>
          ⚠️ Your data is stored on this device only. Export a backup regularly so you never lose it.
        </Text>
      </Card>

      {/* Export Plain */}
      <Card>
        <View style={styles.optionRow}>
          <View style={[styles.optionIconWrap, { backgroundColor: colors.goldBg }]}>
            <Text style={styles.optionIcon}>📤</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Full Backup (JSON)</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              ✓ Everything — expenses, health, reminders, all categories
            </Text>
          </View>
          <Button title="Export" variant="gold" small onPress={handleExportJSON} />
        </View>
      </Card>

      {/* Export Encrypted */}
      <Card>
        <View style={styles.optionRow}>
          <View style={[styles.optionIconWrap, { backgroundColor: colors.purpleBg }]}>
            <Text style={styles.optionIcon}>🔒</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Encrypted Backup (recommended)</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              ✓ Everything, password-protected AES-256 .forshe file
            </Text>
          </View>
          <Button title="Encrypt" variant="purple" small onPress={handleExportEncrypted} />
        </View>
      </Card>

      {/* Export CSV */}
      <Card>
        <View style={styles.optionRow}>
          <View style={[styles.optionIconWrap, { backgroundColor: colors.blueBg }]}>
            <Text style={styles.optionIcon}>💾</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Expenses CSV (for Excel)</Text>
            <Text style={[styles.optionSub, { color: colors.red }]}>
              ⚠️ Only expenses — NOT a full backup. Use Export above instead.
            </Text>
          </View>
          <Button title="CSV" variant="blue" small onPress={handleExportCSV} />
        </View>
      </Card>

      {/* Import */}
      <Card>
        <View style={styles.optionRow}>
          <View style={[styles.optionIconWrap, { backgroundColor: colors.greenBg }]}>
            <Text style={styles.optionIcon}>📥</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Import Backup</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              Restore from .json or encrypted .forshe
            </Text>
          </View>
          <Button title="Import" variant="green" small onPress={handleImportJSON} />
        </View>
      </Card>

      {/* ----- v1.2.8-dev: Cloud Backup section ----- */}
      <Divider label="Cloud Backup" />

      {!user ? (
        <Card>
          <View style={styles.optionRow}>
            <View style={[styles.optionIconWrap, { backgroundColor: colors.purpleBg }]}>
              <Text style={styles.optionIcon}>☁️</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.deep }]}>Sign in to enable cloud backup</Text>
              <Text style={[styles.optionSub, { color: colors.muted }]}>
                {sessionLoading ? 'Checking session…' : 'Upload encrypted backups to your own cloud.'}
              </Text>
            </View>
            <Button title="Sign in" variant="purple" small onPress={onSignIn} />
          </View>
        </Card>
      ) : (
        <>
          <Card>
            <View style={styles.optionRow}>
              <View style={[styles.optionIconWrap, { backgroundColor: colors.purpleBg }]}>
                <Text style={styles.optionIcon}>👤</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.deep }]} numberOfLines={1}>
                  {user.email || 'Signed in'}
                </Text>
                <Text style={[styles.optionSub, { color: colors.muted }]}>
                  {cloudFiles.length > 0 ? 'Backup available in cloud' : 'No backup yet'}
                </Text>
              </View>
              <Button title="Sign out" variant="outline" small onPress={onSignOut} />
            </View>
          </Card>

          <Card>
            <View style={styles.optionRow}>
              <View style={[styles.optionIconWrap, { backgroundColor: colors.purpleBg }]}>
                <Text style={styles.optionIcon}>☁️</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.deep }]}>Upload Backup to Cloud</Text>
                <Text style={[styles.optionSub, { color: colors.muted }]}>
                  Encrypts on this device first — Supabase only stores ciphertext.
                </Text>
              </View>
              <Button
                title={cloudBusy ? '…' : 'Upload'}
                variant="purple"
                small
                onPress={onCloudUpload}
              />
            </View>
          </Card>

          <Card>
            <View style={styles.optionRow}>
              <View style={[styles.optionIconWrap, { backgroundColor: colors.greenBg }]}>
                <Text style={styles.optionIcon}>♻️</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.deep }]}>Restore from Cloud</Text>
                <Text style={[styles.optionSub, { color: colors.muted }]}>
                  Pick a cloud backup and decrypt it with its password.
                </Text>
              </View>
              <Button title="Restore" variant="green" small onPress={onOpenRestore} />
            </View>
          </Card>

          {cloudFiles.length > 0 && cloudFiles[0].createdAt && (
            <Text style={[styles.lastBackupText, { color: colors.muted }]}>
              Last updated: {new Date(cloudFiles[0].createdAt).toLocaleString()}
            </Text>
          )}
        </>
      )}

      {/* Data Summary */}
      <Divider label="Data Summary" />
      <Card>
        <View style={styles.summaryGrid}>
          {summaryItems.map(item => (
            <View key={item.label} style={[styles.summaryItem, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.bottomPad} />
    </ScrollView>

    {/* Password Modal (local + cloud) */}
    <Modal visible={pwModal !== null} transparent animationType="fade" onRequestClose={onModalCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
          <Text style={[styles.modalTitle, { color: colors.deep }]}>{modalTitle}</Text>
          <Text style={[styles.modalDesc, { color: colors.sub }]}>{modalDesc}</Text>
          <TextInput
            style={[styles.pwInput, { color: colors.deep, borderColor: colors.border, backgroundColor: colors.bg3 }]}
            placeholder="Backup password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoFocus
          />
          {needsConfirmField && (
            <TextInput
              style={[styles.pwInput, { color: colors.deep, borderColor: colors.border, backgroundColor: colors.bg3 }]}
              placeholder="Confirm password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
          )}
          <View style={styles.modalBtns}>
            <Button
              title="Cancel"
              variant="outline"
              small
              onPress={onModalCancel}
              style={{ flex: 1 }}
            />
            <Button
              title={modalCta}
              variant="purple"
              small
              onPress={onModalPrimary}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>

    <Toast toast={toast} dismiss={dismissToast} />

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  heroHeaderText: { flex: 1 },
  heroLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  heroTitle: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 28, lineHeight: 34, marginBottom: 8 },
  warningText: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 20 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionIcon: { fontSize: 26 },
  optionContent: { flex: 1 },
  optionTitle: { fontFamily: 'Outfit-Bold', fontSize: 16, marginBottom: 3 },
  optionSub: { fontSize: 14, fontFamily: 'Outfit-Regular' },
  lastBackupText: { fontSize: 13, fontFamily: 'Outfit-Regular', textAlign: 'center', marginTop: -4, marginBottom: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { width: '47%', flexGrow: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontFamily: 'Outfit-Bold', marginBottom: 2 },
  summaryLabel: { fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  bottomPad: { height: 40 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox: { borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', marginBottom: 8 },
  modalDesc: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 20, marginBottom: 16 },
  pwInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: 'Outfit-Regular', marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sheetBox: { borderRadius: 24, padding: 20, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  closeGlyph: { fontSize: 22, fontFamily: 'Outfit-Bold' },
  cloudList: { marginTop: 4 },
  cloudRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
    minHeight: 56,
  },
  cloudRowName: { fontFamily: 'Outfit-SemiBold', fontSize: 14 },
  cloudRowMeta: { fontFamily: 'Outfit-Regular', fontSize: 12, marginTop: 2 },
  cloudRowChevron: { fontSize: 22, fontFamily: 'Outfit-Bold' },
});
