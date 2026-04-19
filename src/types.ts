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

export type ReminderRecurring = 'monthly' | 'quarterly' | 'yearly' | null;

export interface Reminder {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or ""
  cat: string;
  isDone: boolean;
  notifIds?: string[];
  // v1.2 — bill + medication extensions
  amount?: number;                 // optional bill amount
  recurring?: ReminderRecurring;   // monthly/quarterly/yearly bill re-creation
  dosage?: string;                 // medication dosage, e.g. "500mg, 1 tablet"
  withFood?: boolean;              // medication taken with food
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

export interface ShoppingSession {
  id: number;
  name: string;         // e.g. "Sunday Grocery", "Eid Shopping"
  createdAt: string;    // ISO string
  items: ShoppingItem[];
  completed: boolean;   // mark entire trip as done
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

// --- v1.2 Connected Home types ---

export type InventoryCategory = 'Grocery' | 'Household' | 'Pantry' | 'Fridge' | 'Freezer';

export interface InventoryItem {
  id: number;
  name: string;
  qty: number;
  unit: string;                       // e.g. "kg", "pcs", "L", "packets"
  category: InventoryCategory;
  lowStockThreshold: number;          // qty <= this → low-stock badge
  lastUpdated: string;                // ISO string
  notes?: string;
}

export interface RecipeIngredient {
  name: string;
  qty: number;
  unit: string;                       // matches InventoryItem.unit for cross-reference
}

export interface Recipe {
  id: number;
  name: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  notes?: string;
  image?: string;                     // optional URI
  createdAt: string;                  // ISO
}

export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;                  // YYYY-MM-DD
  createdAt: string;                  // ISO
  completed: boolean;
  notes?: string;
}

// --- v1.2.2-dev — Prayer Times + Sunnah Fasting ---

export type CalculationMethodKey =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Turkey'
  | 'Tehran'
  | 'Singapore';

export type AsrJuristicMethod = 'Standard' | 'Hanafi';

// adhan v4.4.3 exposes three high-latitude rules. 'None' falls back to MiddleOfTheNight internally.
export type HighLatitudeRule = 'MiddleOfTheNight' | 'SeventhOfTheNight' | 'TwilightAngle';

export interface PrayerLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface PrayerSettings {
  enabled: boolean;                         // master switch, default false until first configuration
  location: PrayerLocation | null;
  locationSource: 'gps' | 'manual' | 'none';
  method: CalculationMethodKey;             // default 'Karachi'
  asrMethod: AsrJuristicMethod;             // default 'Hanafi'
  highLatitudeRule: HighLatitudeRule;       // default 'MiddleOfTheNight'
  // Per-prayer notification toggles
  prayerNotifyFajr: boolean;
  prayerNotifyDhuhr: boolean;
  prayerNotifyAsr: boolean;
  prayerNotifyMaghrib: boolean;
  prayerNotifyIsha: boolean;
  // Sunnah fasting reminders (fire ~20:00 the night before)
  mondayThursdayFasting: boolean;
  ayyamAlBidFasting: boolean;
  // Scheduled notif IDs for cleanup
  fastingNotifIds?: string[];
  prayerNotifIds?: string[];
}

// --- v1.2.2-dev — Vendor & Services Directory ---

export type VendorCategory =
  | 'Plumber'
  | 'Electrician'
  | 'AC Repair'
  | 'Appliance Repair'
  | 'Doctor'
  | 'Pharmacy'
  | 'Tailor'
  | 'Carpenter'
  | 'Gardener'
  | 'Cleaner'
  | 'Mechanic'
  | 'Other';

export interface Vendor {
  id: number;
  name: string;
  category: VendorCategory;
  phone: string;           // primary phone, required
  altPhone?: string;       // optional second number
  address?: string;
  rating: number;          // 1-5, user's personal rating, defaults to 0 (no rating)
  favorite: boolean;       // pin to top
  lastUsed?: string;       // ISO date, updated when user taps call/WhatsApp
  notes?: string;
  createdAt: string;       // ISO
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
  shoppingSessions?: ShoppingSession[];
  maidSalary?: MaidSalary[];
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
