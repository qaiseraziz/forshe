import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { exportBackup, exportCSV, importBackup } from '../utils/backup';
import { DAYS } from '../constants/data';
import { pkr } from '../utils/currency';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function BackupScreen() {
  const { colors } = useTheme();
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
    maidSalary,
    handleImport,
  } = useData();

  const mealCount = useMemo(
    () => Object.values(cooking).filter(Boolean).length,
    [cooking],
  );

  const taskCount = useMemo(
    () => DAYS.reduce((s, d) => s + (maidData[d]?.length || 0), 0),
    [maidData],
  );

  const totalRec = useMemo(
    () => history.filter(h => h.type === 'topup').reduce((s, h) => s + h.amount, 0),
    [history],
  );

  const totalSpent = useMemo(
    () => history.filter(h => h.type === 'expense').reduce((s, h) => s + h.amount, 0),
    [history],
  );

  const handleExportJSON = useCallback(async () => {
    try {
      await exportBackup({ history, cooking, maidData, attendance, reminders, periods, budget, recurring, shopping, maidSalary });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to export backup.');
    }
  }, [history, cooking, maidData, attendance, reminders, periods, budget, recurring, shopping, maidSalary]);

  const handleExportCSV = useCallback(async () => {
    try {
      await exportCSV(history);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to export CSV.');
    }
  }, [history]);

  const handleImportJSON = useCallback(async () => {
    try {
      await importBackup(handleImport);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to import backup.');
    }
  }, [handleImport]);

  const summaryItems = useMemo(() => [
    { value: String(history.length), label: 'Transactions', color: colors.deep },
    { value: pkr(totalRec), label: 'Total Received', color: colors.green },
    { value: pkr(totalSpent), label: 'Total Spent', color: colors.red },
    { value: String(mealCount), label: 'Meals Planned', color: colors.gold },
    { value: String(taskCount), label: 'Maid Tasks', color: colors.blue },
    { value: String(reminders.length), label: 'Reminders', color: colors.purple },
    { value: String(periods.length), label: 'Cycle Logs', color: colors.pink },
    { value: budget ? pkr(budget) : '—', label: 'Budget', color: colors.gold },
  ], [history.length, totalRec, totalSpent, mealCount, taskCount, reminders.length, periods.length, budget, colors]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.deep }]}>Backup & Restore</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Keep your data safe</Text>
        </View>
        <DrawerMenuButton />
      </View>

      {/* Warning Banner */}
      <View
        style={[
          styles.warningBanner,
          { backgroundColor: colors.goldBg, borderColor: colors.goldBorder },
        ]}
      >
        <Text style={[styles.warningText, { color: colors.sub }]}>
          ⚠️ Your data is stored on this device only. Export a backup regularly to avoid losing
          it!
        </Text>
      </View>

      {/* Export JSON */}
      <Card>
        <View style={styles.optionRow}>
          <Text style={styles.optionIcon}>📤</Text>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Export Backup</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              Download all your data as a JSON file
            </Text>
          </View>
          <Button title="Export" variant="gold" small onPress={handleExportJSON} />
        </View>
      </Card>

      {/* Export CSV */}
      <Card>
        <View style={styles.optionRow}>
          <Text style={styles.optionIcon}>💾</Text>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Export as CSV</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              Export expenses as a spreadsheet
            </Text>
          </View>
          <Button title="CSV" variant="blue" small onPress={handleExportCSV} />
        </View>
      </Card>

      {/* Import JSON */}
      <Card>
        <View style={styles.optionRow}>
          <Text style={styles.optionIcon}>📥</Text>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.deep }]}>Import Backup</Text>
            <Text style={[styles.optionSub, { color: colors.muted }]}>
              Restore data from a backup file
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleSection: {
    flex: 1,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  warningBanner: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIcon: {
    fontSize: 32,
    flexShrink: 0,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    marginBottom: 3,
  },
  optionSub: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomPad: {
    height: 40,
  },
});
