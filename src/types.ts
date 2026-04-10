export interface Transaction {
  id: number;
  type: 'topup' | 'expense';
  label: string;
  amount: number;
  cat: string;
  date: string; // DD/MM/YYYY
  receipt?: string; // URI to receipt photo
}

export interface MaidTask {
  id: number;
  name: string;
  done: boolean;
}

export interface MaidData {
  [day: string]: MaidTask[];
}

export interface Attendance {
  [date: string]: 'Present' | 'Absent' | 'Holiday';
}

export interface CookingData {
  [key: string]: string; // "Mon_Breakfast" -> "Nihari"
}

export interface Reminder {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or ""
  cat: string;
  isDone: boolean;
  notifIds?: string[];
}

export interface PeriodLog {
  id: number;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD or ""
  notes: string;
  flow: string;
  symptoms: string[];
}

export interface RecurringExpense {
  id: number;
  label: string;
  amount: number;
  cat: string;
  dayOfMonth: number; // 1-28
  enabled: boolean;
}

export interface ShoppingItem {
  id: number;
  name: string;
  qty: string;
  done: boolean;
}

export interface MaidSalary {
  id: number;
  month: string; // YYYY-MM
  salary: number;
  advance: number;
  deduction: number;
  paid: boolean;
  note: string;
}

export interface BodyProfile {
  height: number;                       // cm
  heightUnit: 'cm' | 'ft';              // display preference
  birthYear?: number;
  gender?: 'female' | 'male' | 'other';
}

export type BloodSugarContext = 'fasting' | 'post-meal' | 'random';

export interface BodyLog {
  id: number;                           // Date.now()
  date: string;                         // YYYY-MM-DD
  weight?: number;                      // kg
  bpSystolic?: number;                  // mmHg
  bpDiastolic?: number;                 // mmHg
  bloodSugar?: number;                  // mg/dL
  bloodSugarContext?: BloodSugarContext;
  oxygen?: number;                      // SpO2 %
  heartRate?: number;                   // bpm
  temperature?: number;                 // °C
  notes?: string;
}

export interface BodyStatsSettings {
  enabled: boolean;                     // master switch (default false)
  reminderEnabled: boolean;
  reminderTime: string;                 // "HH:MM" 24h
  reminderNotifIds?: string[];          // scheduled notification IDs
}

export interface BackupData {
  version?: string;
  exported?: string;
  history?: Transaction[];
  cooking?: CookingData;
  maidData?: MaidData;
  maidAttendance?: Attendance;
  reminders?: Reminder[];
  periodLogs?: PeriodLog[];
  budget?: number;
  recurringExpenses?: RecurringExpense[];
  shoppingList?: ShoppingItem[];
  maidSalary?: MaidSalary[];
  bodyProfile?: BodyProfile;
  bodyLogs?: BodyLog[];
  bodyStatsSettings?: BodyStatsSettings;
}
