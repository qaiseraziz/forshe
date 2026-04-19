import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Alert, Share } from 'react-native';
import CryptoJS from 'crypto-js';
import { Transaction, BackupData, CookingData, MaidData, Attendance, Reminder, PeriodLog, ShoppingSession, BodyProfile, BodyLog, BodyStatsSettings, InventoryItem, Recipe, SavingsGoal, Vendor, PrayerSettings } from '../types';

// --- Encryption helpers ---

const ENCRYPTED_PREFIX = 'FORSHE_ENC_V1:';

function encryptData(json: string, password: string): string {
  const encrypted = CryptoJS.AES.encrypt(json, password).toString();
  return ENCRYPTED_PREFIX + encrypted;
}

function decryptData(payload: string, password: string): string | null {
  if (!payload.startsWith(ENCRYPTED_PREFIX)) return null;
  const ciphertext = payload.slice(ENCRYPTED_PREFIX.length);
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null; // wrong password
    return decrypted;
  } catch {
    return null;
  }
}

function isEncrypted(content: string): boolean {
  return content.trimStart().startsWith(ENCRYPTED_PREFIX);
}

// --- Schema validation for backup imports ---

function validateBackupData(data: unknown): { valid: true; data: BackupData } | { valid: false; error: string } {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Backup must be a JSON object, not an array or primitive.' };
  }

  const obj = data as Record<string, unknown>;

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

  if (obj.shoppingSessions !== undefined) {
    if (!Array.isArray(obj.shoppingSessions)) return { valid: false, error: '"shoppingSessions" must be an array.' };
  }

  if (obj.maidSalary !== undefined) {
    if (!Array.isArray(obj.maidSalary)) return { valid: false, error: '"maidSalary" must be an array.' };
  }

  if (obj.budget !== undefined) {
    if (typeof obj.budget !== 'number') return { valid: false, error: '"budget" must be a number.' };
  }

  if (obj.bodyProfile !== undefined) {
    if (obj.bodyProfile === null || typeof obj.bodyProfile !== 'object' || Array.isArray(obj.bodyProfile)) {
      return { valid: false, error: '"bodyProfile" must be an object.' };
    }
    const bp = obj.bodyProfile as Record<string, unknown>;
    if (typeof bp.height !== 'number') return { valid: false, error: 'bodyProfile.height must be a number.' };
    if (bp.heightUnit !== 'cm' && bp.heightUnit !== 'ft') {
      return { valid: false, error: 'bodyProfile.heightUnit must be "cm" or "ft".' };
    }
  }

  if (obj.bodyLogs !== undefined) {
    if (!Array.isArray(obj.bodyLogs)) return { valid: false, error: '"bodyLogs" must be an array.' };
    for (let i = 0; i < obj.bodyLogs.length; i++) {
      const entry = obj.bodyLogs[i];
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        return { valid: false, error: `bodyLogs[${i}] is not a valid object.` };
      }
      const e = entry as Record<string, unknown>;
      if (typeof e.id !== 'number') return { valid: false, error: `bodyLogs[${i}].id must be a number.` };
      if (typeof e.date !== 'string') return { valid: false, error: `bodyLogs[${i}].date must be a string.` };
    }
  }

  if (obj.inventory !== undefined) {
    if (!Array.isArray(obj.inventory)) return { valid: false, error: '"inventory" must be an array.' };
  }

  if (obj.recipes !== undefined) {
    if (!Array.isArray(obj.recipes)) return { valid: false, error: '"recipes" must be an array.' };
  }

  if (obj.savingsGoals !== undefined) {
    if (!Array.isArray(obj.savingsGoals)) return { valid: false, error: '"savingsGoals" must be an array.' };
  }

  if (obj.vendors !== undefined) {
    if (!Array.isArray(obj.vendors)) return { valid: false, error: '"vendors" must be an array.' };
    for (let i = 0; i < obj.vendors.length; i++) {
      const entry = obj.vendors[i];
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        return { valid: false, error: `vendors[${i}] is not a valid object.` };
      }
      const v = entry as Record<string, unknown>;
      if (typeof v.id !== 'number') return { valid: false, error: `vendors[${i}].id must be a number.` };
      if (typeof v.name !== 'string') return { valid: false, error: `vendors[${i}].name must be a string.` };
      if (typeof v.category !== 'string') return { valid: false, error: `vendors[${i}].category must be a string.` };
      if (typeof v.phone !== 'string') return { valid: false, error: `vendors[${i}].phone must be a string.` };
    }
  }

  if (obj.bodyStatsSettings !== undefined) {
    if (obj.bodyStatsSettings === null || typeof obj.bodyStatsSettings !== 'object' || Array.isArray(obj.bodyStatsSettings)) {
      return { valid: false, error: '"bodyStatsSettings" must be an object.' };
    }
    const bs = obj.bodyStatsSettings as Record<string, unknown>;
    if (typeof bs.enabled !== 'boolean') return { valid: false, error: 'bodyStatsSettings.enabled must be a boolean.' };
    if (typeof bs.reminderEnabled !== 'boolean') return { valid: false, error: 'bodyStatsSettings.reminderEnabled must be a boolean.' };
    if (typeof bs.reminderTime !== 'string') return { valid: false, error: 'bodyStatsSettings.reminderTime must be a string.' };
  }

  if (obj.prayerSettings !== undefined) {
    if (obj.prayerSettings === null || typeof obj.prayerSettings !== 'object' || Array.isArray(obj.prayerSettings)) {
      return { valid: false, error: '"prayerSettings" must be an object.' };
    }
    const ps = obj.prayerSettings as Record<string, unknown>;
    if (typeof ps.enabled !== 'boolean') return { valid: false, error: 'prayerSettings.enabled must be a boolean.' };
    if (typeof ps.method !== 'string') return { valid: false, error: 'prayerSettings.method must be a string.' };
    if (typeof ps.asrMethod !== 'string') return { valid: false, error: 'prayerSettings.asrMethod must be a string.' };
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
  shoppingSessions?: ShoppingSession[];
  maidSalary?: any[];
  bodyProfile?: BodyProfile;
  bodyLogs?: BodyLog[];
  bodyStatsSettings?: BodyStatsSettings;
  // v1.2
  inventory?: InventoryItem[];
  recipes?: Recipe[];
  savingsGoals?: SavingsGoal[];
  // v1.2.2-dev
  vendors?: Vendor[];
  prayerSettings?: PrayerSettings;
}

function buildBackupJSON(data: AllData): string {
  const backup = {
    version: '2.5',
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
    shoppingSessions: data.shoppingSessions,
    maidSalary: data.maidSalary,
    bodyProfile: data.bodyProfile,
    bodyLogs: data.bodyLogs,
    bodyStatsSettings: data.bodyStatsSettings,
    // v1.2 Connected Home
    inventory: data.inventory,
    recipes: data.recipes,
    savingsGoals: data.savingsGoals,
    // v1.2.2-dev
    vendors: data.vendors,
    prayerSettings: data.prayerSettings,
  };
  return JSON.stringify(backup, null, 2);
}

/** Write content to a cache file and return its URI */
function writeCacheFile(filename: string, content: string): string {
  const file = new File(Paths.cache, filename);
  file.write(content);
  return file.uri;
}

/** Export plain (unencrypted) backup via share sheet */
export async function exportBackup(data: AllData) {
  const json = buildBackupJSON(data);
  const filename = `forshe-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const fileUri = writeCacheFile(filename, json);
  try {
    await Share.share({ url: fileUri, title: 'ForSHE Backup' });
  } catch {
    await Share.share({ message: json, title: 'ForSHE Backup' });
  }
}

/** Export encrypted backup — prompts for password, then shares via share sheet (Gmail, Drive, etc.) */
export async function exportEncryptedBackup(data: AllData, password: string) {
  const json = buildBackupJSON(data);
  const encrypted = encryptData(json, password);
  const filename = `forshe-backup-${new Date().toISOString().slice(0, 10)}.forshe`;
  const fileUri = writeCacheFile(filename, encrypted);
  try {
    await Share.share({ url: fileUri, title: 'ForSHE Encrypted Backup' });
  } catch {
    await Share.share({ message: encrypted, title: 'ForSHE Encrypted Backup' });
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

export async function importBackup(onImport: (data: BackupData) => void, promptPassword: () => Promise<string | null>) {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return;

    const pickedFile = result.assets[0];
    const response = await fetch(pickedFile.uri);
    let content = await response.text();

    // Handle encrypted backup
    if (isEncrypted(content)) {
      const password = await promptPassword();
      if (!password) return; // user cancelled
      const decrypted = decryptData(content, password);
      if (!decrypted) {
        Alert.alert('Wrong Password', 'Could not decrypt the backup. Please check your password and try again.');
        return;
      }
      content = decrypted;
    }

    let data: any;
    try { data = JSON.parse(content); } catch { Alert.alert('Error', 'Invalid backup file. Could not parse JSON.'); return; }

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

    if (!data.history && !data.periodLogs && !data.reminders && !data.cooking && !data.bodyLogs) {
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
