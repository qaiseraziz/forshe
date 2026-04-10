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
}
