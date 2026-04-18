import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { exportBackup, exportEncryptedBackup, exportCSV, importBackup } from '../utils/backup';
import { DAYS } from '../constants/data';
import { useCurrency } from '../context/CurrencyContext';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function BackupScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
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
    handleImport,
  } = useData();
  const { pkr } = useCurrency();

  // Password modal state
  const [pwModal, setPwModal] = useState<'export' | 'import' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [importPwResolver, setImportPwResolver] = useState<{ resolve: (pw: string | null) => void } | null>(null);

  const allData = useMemo(() => ({
    history, cooking, maidData, attendance, reminders, periods, budget, recurring, shopping, shoppingSessions, maidSalary, bodyProfile, bodyLogs, bodyStatsSettings,
    inventory, recipes, savingsGoals, vendors,
  }), [history, cooking, maidData, attendance, reminders, periods, budget, recurring, shopping, shoppingSessions, maidSalary, bodyProfile, bodyLogs, bodyStatsSettings, inventory, recipes, savingsGoals, vendors]);

  const mealCount = useMemo(() => Object.values(cooking).filter(Boolean).length, [cooking]);
  const taskCount = useMemo(() => DAYS.reduce((s, d) => s + (maidData[d]?.length || 0), 0), [maidData]);
  const totalRec = useMemo(() => history.filter(h => h.type === 'topup').reduce((s, h) => s + h.amount, 0), [history]);
  const totalSpent = useMemo(() => history.filter(h => h.type === 'expense').reduce((s, h) => s + h.amount, 0), [history]);

  const handleExportJSON = useCallback(async () => {
    try { await exportBackup(allData); } catch (e: any) { Alert.alert('Error', e.message || 'Failed to export.'); }
  }, [allData]);

  const handleExportEncrypted = useCallback(() => {
    setPassword('');
    setConfirmPw('');
    setPwModal('export');
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
      setPwModal('import');
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

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card */}
      <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero} style={{ backgroundColor: colors.goldBg, borderColor: colors.goldBorder }}>
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
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Export Backup</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              Plain JSON — share to Gmail, Drive, etc.
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
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Encrypted Backup</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              AES-256 password-protected .forshe file
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
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Export as CSV</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              Export expenses as a spreadsheet
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

    {/* Password Modal */}
    <Modal visible={pwModal !== null} transparent animationType="fade" onRequestClose={() => { if (pwModal === 'import') cancelImportPassword(); else setPwModal(null); }}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
          <Text style={[styles.modalTitle, { color: colors.deep }]}>
            {pwModal === 'export' ? '🔒 Set Backup Password' : '🔑 Enter Password'}
          </Text>
          <Text style={[styles.modalDesc, { color: colors.sub }]}>
            {pwModal === 'export'
              ? 'Your backup will be encrypted with AES-256. Remember this password — you\'ll need it to restore.'
              : 'This backup is encrypted. Enter the password to decrypt it.'}
          </Text>
          <TextInput
            style={[styles.pwInput, { color: colors.deep, borderColor: colors.border, backgroundColor: colors.bg3 }]}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoFocus
          />
          {pwModal === 'export' && (
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
              onPress={() => { if (pwModal === 'import') cancelImportPassword(); else setPwModal(null); }}
              style={{ flex: 1 }}
            />
            <Button
              title={pwModal === 'export' ? 'Encrypt & Share' : 'Decrypt'}
              variant="purple"
              small
              onPress={pwModal === 'export' ? confirmExportEncrypted : confirmImportPassword}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>

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
});
