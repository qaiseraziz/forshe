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

export const REMINDER_CATS = ['📋 General', '💡 Bills', '🏥 Health', '🛒 Shopping', '👨‍👩‍👧 Family', '🎂 Birthday', '📚 School', '🎁 Other'];

export const EXPENSE_PRESETS = [
  { label: 'Milk', cat: '🍔 Food', amount: 200 },
  { label: 'Bread', cat: '🍔 Food', amount: 150 },
  { label: 'Groceries', cat: '🍔 Food', amount: 0 },
  { label: 'Vegetables', cat: '🍔 Food', amount: 0 },
  { label: 'Electricity Bill', cat: '💡 Bills', amount: 0 },
  { label: 'Gas Bill', cat: '💡 Bills', amount: 0 },
  { label: 'Water Bill', cat: '💡 Bills', amount: 0 },
  { label: 'Internet', cat: '💡 Bills', amount: 0 },
  { label: 'Mobile Recharge', cat: '💡 Bills', amount: 0 },
  { label: 'Medicine', cat: '💊 Health', amount: 0 },
  { label: 'Petrol', cat: '🚗 Transport', amount: 0 },
  { label: 'Rickshaw', cat: '🚗 Transport', amount: 0 },
  { label: 'School Fee', cat: '📚 Education', amount: 0 },
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
  maidSalary: 'hm_maid_salary',
  recurringLast: 'forshe_recurring_last',
  bodyProfile: 'hm_body_profile',
  bodyLogs: 'hm_body_logs',
  bodyStatsSettings: 'hm_body_settings',
} as const;
