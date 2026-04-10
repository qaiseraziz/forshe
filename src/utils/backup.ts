import * as DocumentPicker from 'expo-document-picker';
import { Alert, Share, Platform } from 'react-native';
import { Transaction, BackupData, CookingData, MaidData, Attendance, Reminder, PeriodLog } from '../types';
import { todayStr } from './dates';

// --- Schema validation for backup imports ---

function validateBackupData(data: unknown): { valid: true; data: BackupData } | { valid: false; error: string } {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Backup must be a JSON object, not an array or primitive.' };
  }

  const obj = data as Record<string, unknown>;

  // Type checks for top-level keys
  if (obj.history !== undefined) {
    if (!Array.isArray(obj.history)) return { valid: false, error: '"history" must be an array.' };
    for (let i = 0; i < obj.history.length; i++) {
      const entry = obj.history[i];
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        return { valid: false, error: `history[${i}] is not a valid object.` };
      }
      const e = entry as Record<string, unknown>;
      if (typeof e.id !== 'number') return { valid: false, error: `history[${i}].id must be a number.` };
      if (e.type !== 'topup' && e.type !== 'expense') return { valid: false, error: `history[${i}].type must be "topup" or "expense".` };
      if (typeof e.label !== 'string') return { valid: false, error: `history[${i}].label must be a string.` };
      if (typeof e.amount !== 'number') return { valid: false, error: `history[${i}].amount must be a number.` };
      if (typeof e.cat !== 'string') return { valid: false, error: `history[${i}].cat must be a string.` };
      if (typeof e.date !== 'string') return { valid: false, error: `history[${i}].date must be a string.` };
    }
  }

  if (obj.cooking !== undefined) {
    if (obj.cooking === null || typeof obj.cooking !== 'object' || Array.isArray(obj.cooking)) {
      return { valid: false, error: '"cooking" must be an object.' };
    }
  }

  if (obj.maidData !== undefined) {
    if (obj.maidData === null || typeof obj.maidData !== 'object' || Array.isArray(obj.maidData)) {
      return { valid: false, error: '"maidData" must be an object.' };
    }
  }

  if (obj.maidAttendance !== undefined) {
    if (obj.maidAttendance === null || typeof obj.maidAttendance !== 'object' || Array.isArray(obj.maidAttendance)) {
      return { valid: false, error: '"maidAttendance" must be an object.' };
    }
  }

  if (obj.reminders !== undefined) {
    if (!Array.isArray(obj.reminders)) return { valid: false, error: '"reminders" must be an array.' };
    for (let i = 0; i < obj.reminders.length; i++) {
      const r = obj.reminders[i] as Record<string, unknown>;
      if (r === null || typeof r !== 'object' || Array.isArray(r)) {
        return { valid: false, error: `reminders[${i}] is not a valid object.` };
      }
      if (typeof r.id !== 'number') return { valid: false, error: `reminders[${i}].id must be a number.` };
      if (typeof r.title !== 'string') return { valid: false, error: `reminders[${i}].title must be a string.` };
    }
  }

  if (obj.periodLogs !== undefined) {
    if (!Array.isArray(obj.periodLogs)) return { valid: false, error: '"periodLogs" must be an array.' };
    for (let i = 0; i < obj.periodLogs.length; i++) {
      const p = obj.periodLogs[i] as Record<string, unknown>;
      if (p === null || typeof p !== 'object' || Array.isArray(p)) {
        return { valid: false, error: `periodLogs[${i}] is not a valid object.` };
      }
      if (typeof p.id !== 'number') return { valid: false, error: `periodLogs[${i}].id must be a number.` };
      if (typeof p.start !== 'string') return { valid: false, error: `periodLogs[${i}].start must be a string.` };
    }
  }

  if (obj.recurringExpenses !== undefined) {
    if (!Array.isArray(obj.recurringExpenses)) return { valid: false, error: '"recurringExpenses" must be an array.' };
  }

  if (obj.shoppingList !== undefined) {
    if (!Array.isArray(obj.shoppingList)) return { valid: false, error: '"shoppingList" must be an array.' };
  }

  if (obj.maidSalary !== undefined) {
    if (!Array.isArray(obj.maidSalary)) return { valid: false, error: '"maidSalary" must be an array.' };
  }

  if (obj.budget !== undefined) {
    if (typeof obj.budget !== 'number') return { valid: false, error: '"budget" must be a number.' };
  }

  return { valid: true, data: obj as BackupData };
}

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

function csvEscape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function exportCSV(history: Transaction[]) {
  const expenses = history.filter(h => h.type === 'expense');
  let csv = 'Date,Item,Amount,Category\n';
  expenses.forEach(e => {
    csv += `${csvEscape(e.date)},${csvEscape(e.label)},${csvEscape(String(e.amount))},${csvEscape(e.cat)}\n`;
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
      const safeParse = (value: unknown): any => {
        if (typeof value === 'string') {
          try { return JSON.parse(value); } catch { return undefined; }
        }
        return value;
      };
      if (data.hm_history) legacy.history = safeParse(data.hm_history);
      if (data.hm_cooking) legacy.cooking = safeParse(data.hm_cooking);
      if (data.hm_maid2) legacy.maidData = safeParse(data.hm_maid2);
      if (data.hm_attendance) legacy.maidAttendance = safeParse(data.hm_attendance);
      if (data.hm_reminders) legacy.reminders = safeParse(data.hm_reminders);
      if (data.hm_periods) legacy.periodLogs = safeParse(data.hm_periods);
      if (data.hm_budget) legacy.budget = safeParse(data.hm_budget);
      data = legacy;
    }

    // Validate schema before accepting import
    const validation = validateBackupData(data);
    if (!validation.valid) {
      Alert.alert('Invalid Backup', validation.error);
      return;
    }

    if (!data.history && !data.periodLogs && !data.reminders && !data.cooking) {
      Alert.alert('Error', 'This file does not contain any ForSHE data to import.');
      return;
    }

    Alert.alert(
      'Import Backup',
      'This will replace all your current data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', style: 'destructive', onPress: () => onImport(validation.data) },
      ]
    );
  } catch (e: any) {
    Alert.alert('Error', e.message || 'Failed to import');
  }
}
