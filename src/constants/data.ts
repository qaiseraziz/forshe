export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;
export const MEAL_ICONS: Record<string, string> = { Breakfast: '☀️', Lunch: '🌤️', Dinner: '🌙' };
export const MEAL_COLORS: Record<string, string> = { Breakfast: '#c8860a', Lunch: '#1a8a5a', Dinner: '#6b3fa0' };
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const CAT_KEYS = ['🍔 Food', '🚗 Transport', '💊 Health', '🛒 Shopping', '💡 Bills', '📚 Education', '🎁 Other'];
export const CAT_COLORS = ['#c8860a', '#1d6fa4', '#1a8a5a', '#6b3fa0', '#c0392b', '#d35400', '#607d8b'];

export const PRESET_TASKS = [
  'Sweep floors', 'Mop floors', 'Vacuum carpets', 'Dust furniture',
  'Clean bathrooms', 'Clean kitchen', 'Wash dishes', 'Do laundry',
  'Iron clothes', 'Fold clothes', 'Clean windows', 'Wipe counters',
  'Clean fridge', 'Change bed sheets', 'Water plants', 'Take out trash',
  'Clean fans', 'Polish shoes', 'Deep clean oven', 'Scrub tiles',
  'Organise cupboards', 'Clean mirrors',
];

export const SYMPTOM_OPTIONS = ['😣 Cramps', '😴 Fatigue', '🤢 Nausea', '😤 Mood swings', '🤕 Headache', '🎈 Bloating', '🔙 Back pain'];
export const FLOW_OPTIONS = ['Spotting', 'Light', 'Medium', 'Heavy'];

export const REMINDER_CATS = [
  '📋 General',
  '💡 Bills',
  '💡 Utility',
  '🏠 Rent',
  '📚 School Fees',
  '📺 Subscription',
  '🧾 Other Bills',
  '💊 Medication',
  '🏥 Health',
  '🛒 Shopping',
  '👨‍👩‍👧 Family',
  '🎂 Birthday',
  '📚 School',
  '🎁 Other',
];

// v1.2 — Categories that count as "Bills" on the Bills filter pill
export const BILL_CATS = ['💡 Bills', '💡 Utility', '🏠 Rent', '📚 School Fees', '📺 Subscription', '🧾 Other Bills'];
export const MEDICATION_CAT = '💊 Medication';

// v1.2 — Recurring frequencies
export const RECURRING_FREQS = [
  { key: null as null | 'monthly' | 'quarterly' | 'yearly', label: 'Not recurring' },
  { key: 'monthly' as const, label: 'Monthly' },
  { key: 'quarterly' as const, label: 'Quarterly' },
  { key: 'yearly' as const, label: 'Yearly' },
];

// v1.2 — Inventory categories
export const INVENTORY_CATS: { key: 'Grocery' | 'Household' | 'Pantry' | 'Fridge' | 'Freezer'; label: string; icon: string }[] = [
  { key: 'Grocery', label: 'Grocery', icon: '🛒' },
  { key: 'Household', label: 'Household', icon: '🧴' },
  { key: 'Pantry', label: 'Pantry', icon: '🥫' },
  { key: 'Fridge', label: 'Fridge', icon: '❄️' },
  { key: 'Freezer', label: 'Freezer', icon: '🧊' },
];

// v1.2 — Common unit hints (informational only — we don't do conversions)
export const UNIT_HINTS = ['kg', 'g', 'L', 'ml', 'pcs', 'packets', 'dozens', 'bottles', 'cans'];

// v1.2 — Savings category name (used on ExpensesScreen history + MonthlyReport "Savings this month")
export const SAVINGS_CAT = '💰 Savings';

// v1.2.2-dev — Vendor & Services Directory categories
export const VENDOR_CATS: { key: 'Plumber' | 'Electrician' | 'AC Repair' | 'Appliance Repair' | 'Doctor' | 'Pharmacy' | 'Tailor' | 'Carpenter' | 'Gardener' | 'Cleaner' | 'Mechanic' | 'Other'; label: string; icon: string }[] = [
  { key: 'Plumber', label: 'Plumber', icon: '🔧' },
  { key: 'Electrician', label: 'Electrician', icon: '⚡' },
  { key: 'AC Repair', label: 'AC Repair', icon: '❄️' },
  { key: 'Appliance Repair', label: 'Appliance Repair', icon: '🔌' },
  { key: 'Doctor', label: 'Doctor', icon: '👨‍⚕️' },
  { key: 'Pharmacy', label: 'Pharmacy', icon: '💊' },
  { key: 'Tailor', label: 'Tailor', icon: '🧵' },
  { key: 'Carpenter', label: 'Carpenter', icon: '🔨' },
  { key: 'Gardener', label: 'Gardener', icon: '🌱' },
  { key: 'Cleaner', label: 'Cleaner', icon: '🧹' },
  { key: 'Mechanic', label: 'Mechanic', icon: '🚗' },
  { key: 'Other', label: 'Other', icon: '📋' },
];

// 15 Pakistani household quick-add presets — ordered by frequency of use
export const EXPENSE_PRESETS: { label: string; icon: string; cat: string; amount: number }[] = [
  { label: 'Vegetables', icon: '🥬', cat: '🍔 Food', amount: 0 },
  { label: 'Bread / Naan', icon: '🫓', cat: '🍔 Food', amount: 0 },
  { label: 'Milk', icon: '🥛', cat: '🍔 Food', amount: 200 },
  { label: 'Meat / Chicken', icon: '🍗', cat: '🍔 Food', amount: 0 },
  { label: 'Fruits', icon: '🍎', cat: '🍔 Food', amount: 0 },
  { label: 'Grocery', icon: '🛒', cat: '🛒 Shopping', amount: 0 },
  { label: 'Petrol / Fuel', icon: '⛽', cat: '🚗 Transport', amount: 0 },
  { label: 'Rickshaw / Uber', icon: '🛺', cat: '🚗 Transport', amount: 0 },
  { label: 'Medicine', icon: '💊', cat: '💊 Health', amount: 0 },
  { label: 'Mobile Top-up', icon: '📱', cat: '💡 Bills', amount: 0 },
  { label: 'Electricity Bill', icon: '💡', cat: '💡 Bills', amount: 0 },
  { label: 'Gas Bill', icon: '🔥', cat: '💡 Bills', amount: 0 },
  { label: 'Water Bill', icon: '💧', cat: '💡 Bills', amount: 0 },
  { label: 'School Fees', icon: '📚', cat: '📚 Education', amount: 0 },
  { label: 'Eating Out', icon: '🍽️', cat: '🍔 Food', amount: 0 },
];

export const SHOPPING_CATS = ['🥬 Vegetables', '🍎 Fruits', '🥛 Dairy', '🍖 Meat', '🧴 Household', '🛒 General'];

export const STORAGE_KEYS = {
  history: 'hm_history',
  cooking: 'hm_cooking',
  maidData: 'hm_maid2',
  attendance: 'hm_attendance',
  reminders: 'hm_reminders',
  periods: 'hm_periods',
  budget: 'hm_budget',
  dark: 'hm_dark',
  recurring: 'hm_recurring',
  shopping: 'hm_shopping',
  shoppingSessions: 'hm_shopping_sessions',
  maidSalary: 'hm_maid_salary',
  recurringLast: 'forshe_recurring_last',
  bodyProfile: 'hm_body_profile',
  bodyLogs: 'hm_body_logs',
  bodyStatsSettings: 'hm_body_settings',
  // v1.2 Connected Home
  inventory: 'hm_inventory',
  recipes: 'hm_recipes',
  savingsGoals: 'hm_savings_goals',
  // v1.2.2-dev
  vendors: 'hm_vendors',
  prayerSettings: 'hm_prayer_settings',
  // v1.2.12-dev
  fastingLogs: 'hm_fasting_logs',
} as const;
