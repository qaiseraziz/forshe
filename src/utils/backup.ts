import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Alert, Share } from 'react-native';
import CryptoJS from 'crypto-js';
import { Transaction, BackupData, CookingData, MaidData, Attendance, Reminder, PeriodLog, ShoppingSession, BodyProfile, BodyLog, BodyStatsSettings, InventoryItem, Recipe, SavingsGoal, Vendor, PrayerSettings, FastingLog } from '../types';

// --- Encryption helpers ---

export const ENCRYPTED_PREFIX = 'FORSHE_ENC_V1:';

export function encryptData(json: string, password: string): string {
  const encrypted = CryptoJS.AES.encrypt(json, password).toString();
  return ENCRYPTED_PREFIX + encrypted;
}

export function decryptData(payload: string, password: string): string | null {
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

export function isEncrypted(content: string): boolean {
  return content.trimStart().startsWith(ENCRYPTED_PREFIX);
}

// --- Schema validation for backup imports ---

export function validateBackupData(data: unknown): { valid: true; data: BackupData } | { valid: false; error: string } {
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

  // v1.2.12-dev — Fasting Calendar observed logs
  if (obj.fastingLogs !== undefined) {
    if (!Array.isArray(obj.fastingLogs)) return { valid: false, error: '"fastingLogs" must be an array.' };
    for (let i = 0; i < obj.fastingLogs.length; i++) {
      const entry = obj.fastingLogs[i];
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        return { valid: false, error: `fastingLogs[${i}] is not a valid object.` };
      }
      const f = entry as Record<string, unknown>;
      if (typeof f.date !== 'string') return { valid: false, error: `fastingLogs[${i}].date must be a string.` };
      if (!Array.isArray(f.types)) return { valid: false, error: `fastingLogs[${i}].types must be an array.` };
      if (typeof f.observed !== 'boolean') return { valid: false, error: `fastingLogs[${i}].observed must be a boolean.` };
    }
  }

  return { valid: true, data: obj as BackupData };
}

export interface AllData {
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
  // v1.2.12-dev
  fastingLogs?: FastingLog[];
}

export function buildBackupJSON(data: AllData): string {
  const backup = {
    version: '2.6',
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
    // v1.2.12-dev
    fastingLogs: data.fastingLogs,
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
    // v1.2.10 fix: read via expo-file-system's File API — `fetch(file:// ).text()`
    // can throw "undefined is not a function" on some Android devices because
    // Response.text() isn't reliably polyfilled on RN's file:// fetch path.
    const pickedFileHandle = new File(pickedFile.uri);
    let content: string;
    try {
      content = await pickedFileHandle.text();
    } catch {
      // Fallback to fetch for older SDKs / unusual URIs.
      const response = await fetch(pickedFile.uri);
      content = await response.text();
    }

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

    // v1.2.13: accept a backup if it contains ANY known ForSHE category —
    // not just the original five. A user's backup might be (e.g.) inventory +
    // vendors + body stats + recipes + fasting logs without any transactions;
    // that's still valid and must be importable.
    const KNOWN_KEYS = [
      'history', 'cooking', 'maidData', 'maidAttendance', 'reminders',
      'periodLogs', 'budget', 'recurringExpenses', 'shoppingList',
      'shoppingSessions', 'maidSalary', 'bodyProfile', 'bodyLogs',
      'bodyStatsSettings', 'inventory', 'recipes', 'savingsGoals', 'vendors',
      'prayerSettings', 'fastingLogs',
    ] as const;
    const hasAny = KNOWN_KEYS.some(k => data[k] !== undefined);
    if (!hasAny) {
      Alert.alert('Error', 'This file does not contain any ForSHE data to import.');
      return;
    }

    // Build a "what will be restored" summary so the user sees exactly what's coming back.
    const counts: string[] = [];
    if (Array.isArray(data.history) && data.history.length) counts.push(`${data.history.length} transactions`);
    if (Array.isArray(data.reminders) && data.reminders.length) counts.push(`${data.reminders.length} reminders`);
    if (Array.isArray(data.periodLogs) && data.periodLogs.length) counts.push(`${data.periodLogs.length} cycle logs`);
    if (Array.isArray(data.bodyLogs) && data.bodyLogs.length) counts.push(`${data.bodyLogs.length} body logs`);
    if (Array.isArray(data.inventory) && data.inventory.length) counts.push(`${data.inventory.length} inventory items`);
    if (Array.isArray(data.recipes) && data.recipes.length) counts.push(`${data.recipes.length} recipes`);
    if (Array.isArray(data.savingsGoals) && data.savingsGoals.length) counts.push(`${data.savingsGoals.length} savings goals`);
    if (Array.isArray(data.vendors) && data.vendors.length) counts.push(`${data.vendors.length} vendors`);
    if (Array.isArray(data.fastingLogs) && data.fastingLogs.length) counts.push(`${data.fastingLogs.length} fasting logs`);
    if (Array.isArray(data.shoppingSessions) && data.shoppingSessions.length) counts.push(`${data.shoppingSessions.length} shopping lists`);
    if (Array.isArray(data.maidSalary) && data.maidSalary.length) counts.push(`${data.maidSalary.length} salary records`);
    if (data.cooking && Object.keys(data.cooking).length) counts.push(`${Object.keys(data.cooking).length} meals planned`);
    if (data.maidData && Object.values(data.maidData).some(t => Array.isArray(t) && t.length)) counts.push('maid tasks');
    if (data.maidAttendance && Object.keys(data.maidAttendance).length) counts.push(`${Object.keys(data.maidAttendance).length} attendance records`);
    if (typeof data.budget === 'number' && data.budget > 0) counts.push('budget');
    if (data.bodyProfile && typeof data.bodyProfile === 'object') counts.push('body profile');
    if (data.prayerSettings && typeof data.prayerSettings === 'object') counts.push('prayer settings');
    if (data.bodyStatsSettings && typeof data.bodyStatsSettings === 'object') counts.push('body stats settings');
    const summary = counts.length ? counts.join(', ') : 'no categories with data';

    Alert.alert(
      'Import Backup',
      `Found: ${summary}.\n\nThis will replace all your current data. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            onImport(validation.data);
            // v1.2.13: tell the user to re-toggle reminders so push
            // notifications actually re-schedule on this device.
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
            }
          },
        },
      ]
    );
  } catch (e: any) {
    Alert.alert('Error', e.message || 'Failed to import');
  }
}
