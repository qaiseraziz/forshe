import * as DocumentPicker from 'expo-document-picker';
import { Alert, Share, Platform } from 'react-native';
import { Transaction, BackupData, CookingData, MaidData, Attendance, Reminder, PeriodLog } from '../types';
import { todayStr } from './dates';

interface AllData {
  history: Transaction[];
  cooking: CookingData;
  maidData: MaidData;
  attendance: Attendance;
  reminders: Reminder[];
  periods: PeriodLog[];
  budget: number;
  recurring?: any[];
  shopping?: any[];
  maidSalary?: any[];
}

export async function exportBackup(data: AllData) {
  const backup = {
    version: '2.0',
    exported: new Date().toISOString(),
    history: data.history,
    cooking: data.cooking,
    maidData: data.maidData,
    maidAttendance: data.attendance,
    reminders: data.reminders,
    periodLogs: data.periods,
    budget: data.budget,
    recurringExpenses: data.recurring,
    shoppingList: data.shopping,
    maidSalary: data.maidSalary,
  };
  const json = JSON.stringify(backup, null, 2);
  try {
    await Share.share({ message: json, title: 'ForSHE Backup' });
  } catch (e: any) {
    Alert.alert('Error', e.message || 'Failed to export');
  }
}

export async function exportCSV(history: Transaction[]) {
  const expenses = history.filter(h => h.type === 'expense');
  let csv = 'Date,Item,Amount,Category\n';
  expenses.forEach(e => {
    csv += `"${e.date}","${e.label}",${e.amount},"${e.cat}"\n`;
  });
  try {
    await Share.share({ message: csv, title: 'ForSHE Expenses CSV' });
  } catch (e: any) {
    Alert.alert('Error', e.message || 'Failed to export');
  }
}

export async function importBackup(onImport: (data: BackupData) => void) {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (result.canceled) return;

    const pickedFile = result.assets[0];
    const response = await fetch(pickedFile.uri);
    const content = await response.text();
    let data: any;
    try { data = JSON.parse(content); } catch { Alert.alert('Error', 'Invalid JSON file'); return; }

    // Handle legacy format (raw localStorage keys)
    if (data.hm_history || data.hm_cooking) {
      const legacy: BackupData = {};
      if (data.hm_history) legacy.history = typeof data.hm_history === 'string' ? JSON.parse(data.hm_history) : data.hm_history;
      if (data.hm_cooking) legacy.cooking = typeof data.hm_cooking === 'string' ? JSON.parse(data.hm_cooking) : data.hm_cooking;
      if (data.hm_maid2) legacy.maidData = typeof data.hm_maid2 === 'string' ? JSON.parse(data.hm_maid2) : data.hm_maid2;
      if (data.hm_attendance) legacy.maidAttendance = typeof data.hm_attendance === 'string' ? JSON.parse(data.hm_attendance) : data.hm_attendance;
      if (data.hm_reminders) legacy.reminders = typeof data.hm_reminders === 'string' ? JSON.parse(data.hm_reminders) : data.hm_reminders;
      if (data.hm_periods) legacy.periodLogs = typeof data.hm_periods === 'string' ? JSON.parse(data.hm_periods) : data.hm_periods;
      if (data.hm_budget) legacy.budget = typeof data.hm_budget === 'string' ? JSON.parse(data.hm_budget) : data.hm_budget;
      data = legacy;
    }

    if (!data.history && !data.periodLogs && !data.reminders && !data.cooking) {
      Alert.alert('Error', 'This file does not contain valid ForSHE data');
      return;
    }

    Alert.alert(
      'Import Backup',
      'This will replace all your current data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', style: 'destructive', onPress: () => onImport(data) },
      ]
    );
  } catch (e: any) {
    Alert.alert('Error', e.message || 'Failed to import');
  }
}
