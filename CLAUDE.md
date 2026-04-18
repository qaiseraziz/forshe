# ForSHE - Home Management App

## Overview
A React Native (Expo) home management app for tracking household expenses, cooking plans, maid tasks, reminders, and menstrual cycles. Built with TypeScript. Features a premium luxury design with gradient surfaces, hamburger drawer navigation, and a 4-tab bottom bar.

## Current Version
**v1.2.0** (tagged 2026-04-18) — see `CHANGELOG.md` for full history.
- Release theme: "Connected Home + Product Completeness" — bundles v1.1.3-dev (multi-currency, dark-mode match-system, global Quick-Add FAB, biometric lock, undo-everywhere, session-based shopping, encrypted backup, Gmail/Drive file sharing) with v1.2-dev (Inventory, Recipe Book + 6 Pakistani seed recipes, Auto Grocery Generation, Bill Reminders, Medication Reminders, Savings Goals, Expense Insights dashboard).
- `app.json`: version `1.2.0`, `ios.buildNumber "7"`, `android.versionCode 7`.
- `package.json`: name `forshe`, version `1.2.0`. Adds `react-native-gifted-charts`, re-adds `expo-local-authentication`, uses `crypto-js` for encrypted backup.
- Previous released tag: `v1.1.2` on master (APK `9ce82345`, 2026-04-11).
- Orchestration: every task routes through `project-manager` (see Agents section).

## Tech Stack
- **Framework**: Expo SDK 55 (React Native 0.83)
- **Language**: TypeScript
- **Navigation**: Hybrid — @react-navigation/drawer + @react-navigation/bottom-tabs (4 tabs + drawer)
- **State**: React Context (DataContext + ThemeContext) + @react-native-async-storage via useStorage hook
- **Styling**: StyleSheet + expo-linear-gradient for gradient backgrounds
- **Fonts**: @expo-google-fonts — PlayfairDisplay-Bold/ExtraBold, Outfit-Regular/SemiBold/Bold
- **Notifications**: expo-notifications (local reminders + budget alerts, typed triggers + cancellation)
- **File I/O**: expo-document-picker, expo-file-system (new API: File/Paths), expo-clipboard
- **Encryption**: crypto-js (AES-256 for encrypted backups)
- **Security**: expo-secure-store (PIN via useSecureStorage hook)
- **Media**: expo-image-picker (receipt photos — attached and displayed as thumbnails)
- **Haptics**: expo-haptics for tactile feedback
- **Date picker**: @react-native-community/datetimepicker
- **Category picker**: @react-native-picker/picker
- **Build**: EAS Build (project ID: 51ca4967-73b1-4656-9b1b-045e2933a842, owner: smartbzss)
- **Babel**: babel.config.js with babel-preset-expo + react-native-reanimated/plugin

## Project Structure
```
src/
  components/
    ui/                  # Card, Button, Input, Badge, Toast, Divider, EmptyState, Pill, ProgressBar (all React.memo)
    DayStrip.tsx         # Day selector strip (React.memo)
    MonthBar.tsx         # Month filter bar (React.memo, static FILTERS array)
    DrawerMenuButton.tsx # Hamburger menu button (React.memo, useCallback)
    QuickAddFAB.tsx      # v1.1.3-dev — global floating add button (bottom-right, gold gradient, bottom-sheet modal)
  constants/
    colors.ts      # Theme colors + gradients (light/dark hero variants)
    data.ts        # DAYS, MONTHS, EXPENSE_PRESETS, SHOPPING_CATS, CAT_KEYS, STORAGE_KEYS, REMINDER_CATS, BILL_CATS, MEDICATION_CAT, RECURRING_FREQS, INVENTORY_CATS, UNIT_HINTS, SAVINGS_CAT
    currencies.ts  # v1.1.3-dev — CURRENCIES array (PKR/USD/EUR/GBP/INR/SAR/AED), findCurrency()
    seedData.ts    # Default seed data from user's real data
    seedRecipes.ts # v1.2-dev — 6 Pakistani starter recipes (Biryani, Daal, Karahi, Pulao, Kheer, Aloo Paratha)
  context/
    DataContext.tsx     # Central data provider (history, cooking, maid, recurring, shopping, maidSalary, recurring auto-trigger, inventory, recipes, savingsGoals)
    ThemeContext.tsx    # Light/dark theme (useMemo on context value)
    CurrencyContext.tsx # v1.1.3-dev — multi-currency provider exposes `currency`, `setCurrency`, `pkr()`, `pkrF()`
  navigation/
    BottomTabs.tsx  # 4-tab floating pill bar (React.memo, theme-aware colors)
    DrawerNav.tsx   # Drawer wrapping BottomTabs + extra screens
  screens/
    SplashScreen.tsx         # Full-screen branded splash (theme-aware)
    OnboardingScreen.tsx     # 5-slide first-launch walkthrough (theme-aware)
    AppLockScreen.tsx        # 4-digit PIN lock (theme-aware, brute-force protection, functional updater for failCount)
    BiometricLockScreen.tsx  # v1.1.3-dev — expo-local-authentication gate, auto-prompts, falls back to PIN
    TodayScreen.tsx        # Dashboard/home (Quick Add with category picker)
    ExpensesScreen.tsx     # Finance tracking (edit Modal, receipt thumbnails, memoized ListHeader)
    CookingScreen.tsx      # Meal planning (safe area on all views)
    MaidScreen.tsx         # Maid task & attendance (salary validation)
    RemindersScreen.tsx    # Reminders with typed triggers + notification cancellation on delete/done
    CycleScreen.tsx        # Period/cycle tracker (all handlers useCallback)
    BodyStatsScreen.tsx    # Body vitals tracker — weight, BP, sugar, oxygen, HR (feature-flagged, BMI, memoized LogRow)
    MonthlyReportScreen.tsx  # Monthly spending report with charts (handlers useCallback)
    ShoppingListScreen.tsx   # Session-based shopping lists (ShoppingSession[], modal new/copy, per-session items)
    InventoryScreen.tsx      # v1.2-dev — household inventory (InventoryItem[], 5 categories, low-stock badge, ± qty, undo delete)
    RecipeBookScreen.tsx     # v1.2-dev — recipes (Recipe[], list/detail/edit modes, ingredient in-stock/missing badges, "Cook this" + deduct inventory, "Pick for Meal" from CookingScreen, auto-shopping)
    SavingsGoalsScreen.tsx   # v1.2-dev — savings goals (SavingsGoal[], progress bar, days-remaining, contribution modal logs Savings expense, 100% celebration)
    InsightsScreen.tsx       # v1.2-dev — visual expense dashboard (react-native-gifted-charts: 6-month bar chart, pie breakdown, top 5, MoM comparison, daily avg)
    BackupScreen.tsx         # Import/export data (schema validation, CSV escaping, handlers useCallback, summaryItems useMemo, v2.3 backup includes inventory/recipes/savingsGoals)
    SettingsScreen.tsx       # Dark mode, PIN lock, recurring expenses, about
  hooks/
    useStorage.ts        # AsyncStorage hook with error handling (.catch/.finally) + JSON serialization
    useSecureStorage.ts  # SecureStore hook for sensitive data (PIN)
  utils/
    backup.ts                  # JSON/CSV export & import with validateBackupData(), csvEscape(), safeParse(), body stats schema
    budgetAlerts.ts            # Push notifications at 80%/100% budget (deduplicated per month via AsyncStorage)
    bodyStatsNotifications.ts  # schedule/cancel daily body stats reminder (DAILY trigger, graceful permission handling)
    currency.ts                # PKR formatter (pkrF)
    dates.ts                   # Date formatting utilities (locale-independent DD/MM/YYYY)
    share.ts                   # Share functionality
  types.ts       # TypeScript type definitions (Transaction, RecurringExpense, Reminder with notifIds + v1.2 amount/recurring/dosage/withFood, PeriodLog, ShoppingItem, ShoppingSession, BodyProfile, BodyLog, BodyStatsSettings, InventoryItem, InventoryCategory, Recipe, RecipeIngredient, SavingsGoal, ReminderRecurring)
assets/
  logo.png       # App logo (512x512, 393KB)
  splash.png     # Full-screen branded splash image (1024w, 3.2MB)
  icon.png       # App icon (512x512, 393KB)
  favicon.png    # Web favicon (48x48, 4KB)
  android-icon-foreground.png  # Android adaptive icon (432x432, 278KB)
```

## Navigation Architecture
- **Drawer** (top level, 12 entries): Home, Shopping List, Inventory, Maid Tasks, Recipe Book, Savings Goals, Insights, Cycle Tracker, Body Stats, Monthly Report, Backup, Settings
- **Bottom Tabs** (inside Home): Today, Expenses, Cooking, Reminders
- **Hamburger button**: DrawerMenuButton (React.memo) on every screen opens the drawer
- **App flow**: Splash → Onboarding (first time) → PIN Lock (if set) → Main App

## Design System
- **Premium/luxury aesthetic**: No visible borders, soft shadows, gradient surfaces
- **Gradient backgrounds**: Every screen wrapped in LinearGradient
- **Hero cards**: Gradient hero Card on every main screen; dark variants in dark mode (gradients.goldHeroDark, greenHeroDark, purpleHeroDark, pinkHeroDark, etc.)
- **Cards**: borderRadius 24, no borders, elevated shadows
- **Buttons**: Gradient backgrounds (gold/green/blue/red/pink variants)
- **Tab bar**: Floating pill style, frosted glass bg, rounded corners, 4 tabs only, theme-aware colors, no borderWidth
- **Drawer**: Custom drawer with logo, slogan, active indicator
- **Typography**: Large hero numbers (42px), titles (28-30px), Outfit font family
- **Safe areas**: All screens + all views use useSafeAreaInsets for status bar + nav buttons
- **Dark mode**: Full dark theme — all screens, components, splash, onboarding use theme colors
- **Toast**: Theme-aware colors via useTheme, timer cleanup on unmount, wrapped in React.memo
- **Pills / filters**: Filled background design — no borders. Active state uses tinted bg, inactive uses `colors.bg3`
- **Touch targets**: All interactive elements ≥ 44×44 (WCAG/Apple HIG minimum) — enforced on icon buttons, pickers, delete buttons, pills
- **Currency**: User-selectable (v1.1.3-dev) — PKR default, plus USD, EUR, GBP, INR, SAR, AED. Every screen reads from `useCurrency()`.
- **Logo**: assets/logo.png used in splash, drawer header, app lock

## Features
1. **Expense Tracking**: Unified toggle form (received/spent), categories, search, monthly budget, NaN/negative validation
2. **Quick Add Expense**: FAB on Today screen with category picker for instant expense logging
3. **Preset Templates**: One-tap expense presets (Milk, Bread, Bills, etc.)
4. **Receipt Photos**: Attach photos to expenses — displayed as thumbnails in transaction list
5. **Recurring Expenses**: Auto-add on app open if today >= dayOfMonth and not yet added this month
6. **Budget Alerts**: Push notifications at 80%/100% — deduplicated per month via AsyncStorage keys
7. **Shopping List** (v1.1.3): Session-based grocery lists — create new, copy from previous, or edit existing. Each session has its own items, can be marked complete/reopened. Modal for new list with copy-from-previous option. Quick-add presets, sharing, clear-done per session.
8. **Cooking Planner**: Weekly meal planning by day and meal type
9. **Maid Management**: Daily task lists, attendance tracking, salary tracker (validates salary > 0)
10. **Reminders**: Push notifications with typed triggers (SchedulableTriggerInputTypes.DATE), cancelled on delete/done
11. **Cycle Tracker**: Period logging with symptoms and flow
12. **Monthly Reports**: Category breakdown, daily spending chart, top expenses
13. **Expense Insights**: Month-over-month comparison, top category, avg daily spend
14. **Weekly Trend**: 7-day spending bar chart on Today dashboard
15. **Backup/Restore** (v1.1.3): JSON export/import, CSV export, **AES-256 encrypted backup** (.forshe files, password-protected via crypto-js), file-based sharing (Gmail, Drive, WhatsApp via share sheet), auto-detect encrypted on import + password prompt. Schema validation, legacy format safety.
16. **Settings**: Dark mode toggle, PIN lock, recurring expenses, about info
17. **Onboarding**: 5-slide walkthrough (theme-aware dark mode)
18. **App Lock**: 4-digit PIN with brute-force protection (5 attempts → 30s lockout, functional updater pattern)
19. **Splash Screen**: Full-screen branded image — theme-aware background
20. **Body Stats** (v1.1.0): Optional vitals tracker — weight, BP, blood sugar (fasting/post-meal/random), SpO2, heart rate, BMI calculation, daily reminder notification. Feature-flagged (off by default, enable in Settings). Height set once, logs kept forever. Backup/restore round-tripped. Drawer entry hidden nowhere — disabled state on screen routes user to Settings.
21. **Body Stats Insights & Alerts** (v1.1.1): 7-day + 30-day rolling stats per metric (weight delta, avg BP/sugar/SpO2/HR) + threshold-based health alerts (High BP ≥140/90 or urgent ≥180/120, low BP <90/60, high sugar fasting ≥126 / post-meal ≥200, low sugar <70, SpO2 <95 or urgent <90, HR <50 or >100, BMI ≥30 obese / <18.5 underweight). Urgent alerts in red, info in gold/blue. Calm tone, always includes medical disclaimer. Single `useMemo` keyed on `bodyLogs`.
22. **Negative Balance + "Over Budget" Badge** (v1.1.1): Balance hero displays negative values in red when `totalReceived - totalSpent < 0`. `pkr`/`pkrF` sign-preserving (v1.1.1 fix — previously stripped the minus). "Over budget" chip shown when balance < 0 or spent > monthlyBudget. Applies to ExpensesScreen, TodayScreen, MonthlyReportScreen.
23. **Collapsible Monthly Budget** (v1.1.1): ExpensesScreen budget card toggles between collapsed summary ("Monthly Budget: Rs 50,000 · Rs 12,000 remaining") and full editor. Default collapsed when budget set, expanded when unset. `LayoutAnimation.Presets.easeInEaseOut` transition (no new dep). Haptic on toggle.
24. **Quick-Add Chip Rail** (v1.1.1): 15 Pakistani household expense presets above the Add Expense form on ExpensesScreen — Vegetables, Bread/Naan, Milk, Meat/Chicken, Fruits, Petrol, Grocery, Medicine, Rickshaw/Uber, Mobile top-up, Electricity, Gas, Water, School fees, Eating out. Each chip pre-fills label + category. Horizontal scroll, 88×88 tiles, `useCallback`-wrapped handlers.
25. **Drawer Button Standardization** (v1.1.2): `DrawerMenuButton` now sits INSIDE the hero `<Card>` on every one of the 11 drawer screens as the first child of a `heroHeaderRow` flex row (`flexDirection: 'row'`, `alignItems: 'flex-start'`, `gap: 12`, `marginBottom: 4`), sibling to a `heroHeaderText` (`flex: 1`) wrapper that contains the hero label/title/subtitle. Superseded the v1.1.1 standalone `topBar` row which sat ABOVE the hero and added ~56px of wasted vertical space per screen. Button is still 44×44 with `accessibilityLabel` + 8px `hitSlop`.
26. **Tighter floating bottom tab bar** (v1.1.2): `BottomTabs.tsx` no longer double-counts `insets.bottom`. The floating pill uses a single `marginBottom: Math.max(insets.bottom, 8)` to clear Android nav gestures; interior padding comes from `tabBtn.paddingVertical: 10` only. Removes the visible empty strip that used to sit below the tabs on device.
27. **Session-based Shopping Lists** (v1.1.3): Shopping is now session/trip-based. Users see a list of sessions (active first, completed at bottom). "New Shopping List" modal offers: name the list, copy items from a previous list, or start empty. Each session can be completed/reopened/deleted/copied. Old flat `ShoppingItem[]` auto-migrates to a single session on first load. `ShoppingSession` type: `{ id, name, createdAt, items: ShoppingItem[], completed }`. Stored in `hm_shopping_sessions`. Backup round-trips both legacy `shoppingList` and new `shoppingSessions`.
28. **Encrypted Backup** (v1.1.3): AES-256 encrypted backups via `crypto-js`. Export writes `.forshe` file (prefixed `FORSHE_ENC_V1:` + AES ciphertext). Password modal with min 4 chars + confirm. Import auto-detects encrypted files and prompts for password. File-based sharing via `expo-file-system` new API (`File`/`Paths.cache`) + `Share.share({ url })` — opens Gmail, Drive, WhatsApp, etc. Purple `variant` added to `Button` component (`gradients.purpleBtn`).
29. **Multi-currency support** (v1.1.3-dev): `src/context/CurrencyContext.tsx` + `src/constants/currencies.ts` expose 7 currencies (PKR, USD, EUR, GBP, INR, SAR, AED). Settings → Currency card has a native `Picker`. Selection persisted under `hm_currency`. `pkr()` / `pkrF()` in `src/utils/currency.ts` refactored to accept an optional `CurrencyDef` and default to PKR for legacy callers. All call sites (TodayScreen, ExpensesScreen, MonthlyReportScreen, MaidScreen, SettingsScreen, BackupScreen, QuickAddFAB) read from `useCurrency()`. `share.ts#buildShareText` takes a currency arg so shared reports use the selected symbol. Sign preservation rule (v1.1.1) still holds — negatives render as `-$ 1,200`. Lakh shorthand (`1.2L`) limited to PKR and INR; others use `M` at millions.
30. **Global Quick-Add FAB** (v1.1.3-dev): `src/components/QuickAddFAB.tsx` — circular gold-gradient floating button in bottom-right on every authenticated screen. Opens a bottom-sheet modal with two-way toggle (Received / Expense), label + amount input, and category picker (expense only). Fires budget alerts when `budget > 0`. Shows an Undo toast after save. Positioned `bottom = max(insets.bottom, 8) + 82` so it clears the floating tab pill and Android gesture bar. Mounted once at the app root inside `AppContent`; screens MUST NOT render their own copy.
31. **Biometric app lock** (v1.1.3-dev): `expo-local-authentication` re-added. `src/screens/BiometricLockScreen.tsx` auto-prompts `authenticateAsync` on launch (and on background→foreground after 5s). Toggle in Settings under App Lock (stored at `hm_biometric_lock`). PIN continues to work as fallback — a "Use PIN instead" link in the biometric screen routes to the existing `AppLockScreen`. Re-lock runs on any `AppState` change to `active` if the app was away for >5000ms. Enabling the toggle requires the user to authenticate once to confirm.
32. **Dark-mode "Match system" button** (v1.1.3-dev): `SettingsScreen` shows a one-tap `variant="outline"` button under the Dark Mode switch only when the device's `useColorScheme()` disagrees with the current `dark` setting. Tapping it flips `dark` to match the device.
33. **Undo everywhere** (v1.1.3-dev): Every destructive user action shows a Toast with an Undo CTA that re-adds the deleted item. Audited and wired on: ExpensesScreen.deleteEntry, ShoppingListScreen.deleteItem + clearDone, RemindersScreen.deleteReminder (restores reminder AND reschedules its notifications), CycleScreen.deleteLog, BodyStatsScreen.deleteLog, SettingsScreen recurring-expense remove, QuickAddFAB.save. Existing Toast component (timer cleanup, theme-aware colors) is reused across all of them — no new component. `CycleScreen`, `RemindersScreen`, `BodyStatsScreen`, `SettingsScreen` now mount `<Toast />` at the end of their render tree (previously only ExpensesScreen, TodayScreen, ShoppingListScreen did).

34. **Inventory Tracker** (v1.2-dev): New drawer screen `InventoryScreen.tsx` (between Shopping List and Maid Tasks). Tracks household items with `InventoryItem { id, name, qty, unit, category, lowStockThreshold, lastUpdated, notes? }` stored under `hm_inventory`. 5 categories: Grocery, Household, Pantry, Fridge, Freezer. Low-stock badge when `qty <= lowStockThreshold`. Per-item ± quantity step buttons (respect 44×44 touch). Search input + category pill filter row. Add/edit modal (bottom-sheet layout). Undo toast on delete. Sorted alphabetically. All items cross-reference recipe ingredients by exact `name` + `unit` match (no unit conversion).

35. **Recipe Book** (v1.2-dev): New drawer screen `RecipeBookScreen.tsx` (between Maid Tasks and Savings Goals). Three modes in-place: list, detail, edit. Data: `Recipe { id, name, servings, prepMinutes, cookMinutes, ingredients: RecipeIngredient[], steps: string[], notes?, image?, createdAt }` + `RecipeIngredient { name, qty, unit }` stored under `hm_recipes`. Seeds with 6 Pakistani starter recipes (`src/constants/seedRecipes.ts`): Chicken Biryani, Daal Chawal, Chicken Karahi, Chicken Pulao, Kheer, Aloo Paratha. Ingredient rows show "In stock" / "Need N unit" / "Missing" badges based on current inventory. "🍽️ Cook" button logs the recipe name into today's cooking slot (Breakfast before 11am, Lunch before 4pm, else Dinner) and deducts matching (name+unit) inventory quantities. "✏️ Edit" allows full CRUD. Undo toast on delete. Accepts `route.params.pickForMeal: { day, meal }` — when present, hero subtitle and action button change to "Pick a recipe for X · Y" and tapping a recipe assigns it directly into the CookingScreen slot + navigates back.

36. **Auto Grocery Generation** (v1.2-dev): Two integration points, no new screen:
  - **RecipeBookScreen detail** → "🛒 Add N missing to shopping" opens a target modal listing active `shoppingSessions` (non-completed, max 4) + a "+ New list from \"Recipe Name\"" button. Missing computation = ingredients whose inventory entry is absent OR `inv.qty < recipe.qty`; uses the shortfall as the qty added to the list.
  - **CookingScreen daily view** → "🛒 Shopping List from This Week" button above the meal list. Walks all 21 meal slots (DAYS×MEALS), matches assigned meal strings against recipes (case-insensitive `name` match), aggregates ingredients across all matches by `name+unit` key, subtracts inventory, dedupes by name, creates a new session named `"Week of DD/MM"`. Haptic success on create.
  - Never does unit conversion. Mismatched units skip deduction but still add to shopping.

37. **Bill Reminder System** (v1.2-dev): `RemindersScreen` gains 5 new preset categories (💡 Utility, 🏠 Rent, 📚 School Fees, 📺 Subscription, 🧾 Other Bills) grouped under `BILL_CATS`. `Reminder` type extended with optional `amount?: number` (shown next to title in `colors.gold` on the card) and optional `recurring?: 'monthly' | 'quarterly' | 'yearly' | null`. Add form shows amount input + recurring picker conditionally when the category is in `BILL_CATS`. When the user marks a recurring bill as Done, a new reminder is created automatically at `advanceByFreq(date, freq)` with fresh notifications scheduled; the old reminder stays in history marked Done. Filter pills at the top ("All / Bills / Medication / Other") with live counts. Non-bill reminders unaffected.

38. **Medication Reminders** (v1.2-dev): New `💊 Medication` category (`MEDICATION_CAT` constant). Adds optional `dosage?: string` (e.g. "500mg, 1 tablet") and `withFood?: boolean` fields to `Reminder`. Add form shows dosage input + duration picker + with-food switch when category is Medication. Duration N auto-generates N sequential daily reminders via `addDays()`. Each gets its own notifications + can be toggled independently. On card: 💊 dosage row, 🍽 "with food" badge. Dedicated filter pill. `BodyStatsScreen` renders a compact "Today's Medication" card under the hero (conditional — only when `reminders.filter(r => r.cat === '💊 Medication' && r.date === todayISO()).length > 0`); each row is tappable to toggle `isDone`.

39. **Savings Goals** (v1.2-dev): New drawer screen `SavingsGoalsScreen.tsx`. `SavingsGoal { id, name, targetAmount, savedAmount, deadline?, createdAt, completed, notes? }` stored under `hm_savings_goals`. List view sorted active-first with progress bar, percentage, `pkrF(remaining)` remaining copy, days-until-deadline (red when overdue). Add/edit bottom-sheet modal. "+ Contribute" modal bumps `savedAmount` and optionally logs a Transaction under `💰 Savings` category (toggle defaults ON). Reaching 100% flips `completed: true` and shows `🎉 Achieved` toast + `Haptics.notificationAsync(Success)`. `MonthlyReportScreen` overview grid gains a 5th "Savings" box showing the sum of `💰 Savings` transactions for the selected month. Undo toast on delete.

40. **Expense Insights / Visual Dashboard** (v1.2-dev): New drawer screen `InsightsScreen.tsx`. Uses `react-native-gifted-charts` (pure-JS, SDK 55 compatible, no native deps — chosen over `victory-native` which requires Skia native module). Six widgets: 6-month animated `BarChart` of spending, `PieChart` category breakdown for current month (inner label shows total), legend rows with `pkrF(val)` + percentage, Top 5 expenses card, MoM comparison widget with arrow (↑/↓/→), coloured delta badge (`colors.red` when higher, `colors.green` when lower), and a daily-average footer row. All charts read theme colors (dark mode safe). All currency via `useCurrency()`. EmptyState when no expenses exist.

## Performance Optimizations
- **DataContext**: `useMemo` wraps context value to prevent cascade re-renders
- **ThemeContext**: `useMemo` wraps context value (same pattern)
- **FlatList**: `maxToRenderPerBatch`, `windowSize`, `removeClippedSubviews`, `initialNumToRender` on ExpensesScreen & ShoppingListScreen
- **renderItem**: Wrapped in `useCallback` with minimal deps in all FlatList screens
- **ExpensesScreen**: Edit form in Modal, ListHeader memoized with `useMemo`, receipt thumbnail in renderItem, ALL handlers in useCallback (including handleExpDateChange, handleEditDateChange, pickReceipt)
- **ShoppingListScreen**: ListHeader memoized with `useMemo`
- **React.memo**: ALL components — Card, Button, Pill, DayStrip, MonthBar, DrawerMenuButton, CustomTabBar, Badge, Divider, EmptyState, Input, ProgressBar, **Toast**, **CustomDrawerContent**
- **useMemo**: statBoxes (TodayScreen), monthly stats (MaidScreen), presets (MaidScreen), monthViewData (CookingScreen), consolidated cycle calculations (CycleScreen), greeting/fullDate (TodayScreen), summaryItems (BackupScreen), sortedSalary (MaidScreen)
- **useCallback**: ALL event handlers across ALL screens — quickAddExpense, addExpense, addTopup, saveMeal, clearMeal, toggle, del, addPreset, markAtt, saveSalary, prevMonth, nextMonth, toggleSym, onStartChange, onEndChange, handleExportJSON, handleExportCSV, handleImportJSON, addRecurring, openDrawer, etc.
- **Stable drawer content ref**: `renderDrawerContent` extracted as module-level constant in DrawerNav.tsx (not inline arrow) to prevent drawer re-mount every render
- **Static constants**: Filter arrays extracted outside components (MonthBar FILTERS, ShoppingListScreen QUICK_ADD, BottomTabs TABS, DrawerNav DRAWER_ITEMS, OnboardingScreen SLIDES)
- **Inline styles**: Extracted to StyleSheet; dynamic colors via inline styles referencing theme
- **Image optimization**: All icons/assets compressed — logo 393KB, splash 3.2MB, icon 393KB, favicon 4KB
- **Haptic debounce**: Button presses debounced via useRef
- **Toast cleanup**: Timer cleared on unmount to prevent state-after-unmount
- **Rules of Hooks**: All hooks declared at top of component before any early returns (verified in MaidScreen — previously had hooks-after-early-return bug, now fixed)

## Security
- **PIN storage**: Uses `expo-secure-store` via `useSecureStorage` hook (not AsyncStorage)
- **Brute-force protection**: AppLockScreen locks out for 30s after 5 failed PIN attempts (functional updater avoids stale closure)
- **Backup validation**: `validateBackupData()` checks schema before import (types, required fields, array shapes)
- **CSV escaping**: `csvEscape()` handles commas, quotes, newlines in export
- **Legacy backup safety**: `safeParse()` wraps JSON.parse in try/catch for legacy formats
- **Input validation**: parseFloat results checked for NaN and <= 0 before storing (expenses, topups, quick add, salary, saveEdit); parseInt always uses radix 10 with range validation (recurring day 1-28)
- **Notification cancellation**: Reminder notifIds stored and cancelled on delete/done
- **Error recovery**: useStorage hook has .catch/.finally so AsyncStorage failures don't block app
- **Font-load fallback**: App.tsx handles `fontError` from useFonts — proceeds with system fonts rather than hanging forever
- **.gitignore**: Excludes `.env`, `*.log`, `.vscode/`, `.idea/`, `.expo-shared/`, `google-services.json`, `GoogleService-Info.plist`, `credentials.json`

## Recurring Expenses (Auto-trigger)
- Logic in DataContext useEffect runs once per app session when `allLoaded` is true
- Triggers if today >= `dayOfMonth` (catches up if app wasn't opened on exact day)
- Deduplicates by checking existing history for same label+amount in current month
- No separate tracking state — dedup relies entirely on history scan

## Build Config
- **babel.config.js**: babel-preset-expo + react-native-reanimated/plugin
- **babel-preset-expo**: Must be in `dependencies` (not devDependencies) — version ~55.0.8 for SDK 55
- **react-native-worklets**: Required peer dependency of react-native-reanimated (v0.7.2)
- **iOS**: bundleIdentifier = com.forshe.app
- **Android**: package = com.forshe.app
- **Dead deps removed**: expo-sharing, expo-status-bar (expo-local-authentication was re-added in v1.1.3-dev for biometric lock)
- **Latest APK build**: 2181a3b8-3611-4882-ba41-b33cc9ba18b4 (v1.2.0, 2026-04-18, IN_QUEUE) — build page https://expo.dev/accounts/smartbzss/projects/forshe/builds/2181a3b8-3611-4882-ba41-b33cc9ba18b4 · artifact URL visible after FINISH
- **Previous builds**: 9ce82345-5d1d-42d2-934a-d8971387af2f (v1.1.2, 2026-04-11 FINISHED, https://expo.dev/artifacts/eas/knMfhN6yNhTxnzybRzzKdk.apk), d9dc1bb8-3514-4e4c-9f3c-ed0940449cfe (v1.1.2 cancelled), c534cf09-f9fe-470c-a9b4-de41d78bb21d (v1.1.1), 04b1be04-8847-405b-9a84-74a74f3e2238 (v1.1.0), ef365c41-75c1-4f26-8429-de3a6def989b (v1.0.2), 92191648-529d-40c0-9be5-2b0d49743154 (v1.0.1), 1e9166de-ad86-47e0-8b24-1d94aee1706d (v1.0.0)

## Build Commands
```bash
# Development
npx expo start

# Type check
npx tsc --noEmit
# or
npm run typecheck

# Android APK (preview / testing)
eas build --profile preview --platform android --non-interactive

# Android AAB (Play Store)
eas build --profile production --platform android

# iOS preview (requires Apple Developer account — $99/year)
eas build --profile preview --platform ios --non-interactive

# iOS production (App Store / TestFlight)
eas build --profile production --platform ios
```

## Cross-Platform Status
ForSHE is already cross-platform — React Native Expo runs natively on **both Android and iOS from the same codebase**. No rewrite needed.

- **Android**: Actively built and tested (v1.2.0 build queued 2026-04-18; prior stable APK: 9ce82345-5d1d-42d2-934a-d8971387af2f — v1.1.2, 2026-04-11)
- **iOS**: Config ready (`ios.bundleIdentifier = com.forshe.app`) but never built yet

**To ship iOS (when ready):**
1. Get an Apple Developer account ($99/year — mandatory for TestFlight + App Store)
2. Run `eas build --profile preview --platform ios --non-interactive`
3. Install on a test iPhone via TestFlight link
4. Visual pass on each screen (iOS safe areas, gestures, haptics feel slightly different)
5. Submit to App Store via `eas submit` or App Store Connect

**Do NOT switch tech stacks.** Flutter/Native/Ionic rewrites would cost weeks for zero user-visible gain. React Native Expo is the right choice and is already cross-platform.

## Agents (in `.claude/agents/`)

### Orchestration
- **project-manager** — **MANDATORY entry point for every non-trivial task.** Reads CLAUDE.md, classifies the task, builds a plan, delegates to specialists, runs typechecks between stages, and closes the loop with commit/tag/build. Never start work without routing through here.

### Specialists (delegated from project-manager)
- **ui-designer** — reads screens and redesigns them using the luxury design system (gradient heroes, 44×44 touch targets, filled pills, dark mode parity, empty-state hints, a11y labels)
- **qa-expert** — TypeScript + ForSHE-specific code audits (Rules of Hooks, PIN/SecureStore, NaN/parseInt guards, notification cleanup, stale closures, dark mode coverage, `toLocaleDateString` ban, borderWidth leaks, touch targets)
- **rn-performance-expert** — React.memo/useCallback/useMemo audit, FlatList tuning, stable drawer content ref, asset sizes, startup cost (mobile-specific, NOT Lighthouse). Invoke via global `performance-expert` agent + tell it to read `.claude/agents/rn-performance-expert.md` first
- **eas-release-expert** — EAS Build config, babel/worklets pitfalls, app.json/eas.json verification, version consistency, asset size limits, build log diagnosis. Invoke via global `devops-expert` agent + tell it to read `.claude/agents/eas-release-expert.md` first
- **git-release-manager** — commits, tags, CHANGELOG, version bumps, coordinates git push ↔ EAS Build ↔ Play Store

## Agent Invocation Mapping

The global Claude Code agent types available are `ui-designer`, `qa-expert`, `performance-expert`, `devops-expert`, `git-release-manager`, `project-manager`. The project-local `rn-performance-expert` and `eas-release-expert` files are PLAYBOOKS, not agent types — they must be read by `performance-expert` and `devops-expert` respectively. Every delegation must explicitly tell the specialist "read `.claude/agents/<playbook>.md` first" and "this is React Native Expo, not web/Docker".

## Workflow Rules
- **ALWAYS route through `project-manager` first** — never spawn a specialist directly unless it is a trivial single-file fix
- Update CLAUDE.md after every significant change
- Update agent files when relevant
- Route to ui-designer agent for visual/design changes (via project-manager)
- Route to rn-performance-expert for performance concerns (via project-manager)
- Route to qa-expert before any EAS build (via project-manager)
- Route to eas-release-expert for build failures or release prep (via project-manager)
- All screens must use LinearGradient wrapper and safe area insets
- All screens must include DrawerMenuButton for hamburger access
- No visible borders — use shadows and filled backgrounds
- All colors must come from useTheme() — no hardcoded color values (exception: #fff on gradient surfaces)
- Hero cards must use dark gradient variants in dark mode
- All UI components must be wrapped in React.memo
- All event handlers must be wrapped in useCallback
- FlatList ListHeader must be memoized with useMemo (not inline function)
- Toast component uses theme colors + timer cleanup on unmount
- PIN must use useSecureStorage, never useStorage/AsyncStorage
- Backup imports must pass validateBackupData() before applying
- Notification triggers must use typed SchedulableTriggerInputTypes (no `as any`)
- Budget alerts deduplicated per month via AsyncStorage keys
- Date formatting must be locale-independent (no toLocaleDateString)
- Salary validation must check > 0 before saving
- useEffect with state in closures must use functional updaters to avoid stale values
- `babel-preset-expo` must be in dependencies (not devDependencies) for EAS builds
- `react-native-worklets` is a required peer dep of react-native-reanimated — do not remove
- Test with `npx tsc --noEmit` before building APK
- Also periodically run `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` to catch dead imports
- All hooks must be declared at the top of a component — never after an early return (`if (...) return ...`)
- Touch targets must be ≥ 44×44 for all tappable elements (padding or explicit minWidth/minHeight)
- No borderWidth on pills, tabs, badges, or filter chips — use filled backgrounds via `colors.bg3` or tinted accents
- parseInt must always pass radix 10 (`parseInt(x, 10)`)
- Drawer `drawerContent` prop must reference a stable module-level function, not an inline arrow
- Every main screen should have a gradient hero Card using light/dark variants from `gradients.*`
- Bump both `app.json` version + platform build numbers (`ios.buildNumber`, `android.versionCode`) on every release
- Tag releases with `v{major}.{minor}.{patch}` and keep CHANGELOG.md in sync
- **DrawerMenuButton layout (v1.1.2)**: Every drawer screen must place `<DrawerMenuButton />` as the FIRST CHILD of a `heroHeaderRow` flex row INSIDE the hero `<Card>`, sibling to a `heroHeaderText` wrapper that contains the hero label + title + subtitle. The row uses `flexDirection: 'row'`, `alignItems: 'flex-start'`, `gap: 12`, `marginBottom: 4`; `heroHeaderText` uses `flex: 1`. NEVER place `DrawerMenuButton` in a standalone `topBar` row ABOVE the hero card (that pattern was v1.1.1 and caused wasted vertical space). All 11 drawer screens (`TodayScreen`, `ExpensesScreen`, `CookingScreen`, `RemindersScreen`, `MaidScreen` both monthly + daily, `CycleScreen`, `BodyStatsScreen` all three states, `MonthlyReportScreen`, `ShoppingListScreen`, `BackupScreen`, `SettingsScreen`) must follow this pattern so the button is pixel-identical across the app. Still 44×44 min touch target, still `accessibilityLabel`, still `hitSlop`.
- **Bottom tab bar safe-area (v1.1.2)**: `src/navigation/BottomTabs.tsx` `CustomTabBar` must use a SINGLE safe-area-aware margin (`marginBottom: Math.max(insets.bottom, 8)`) and NO dynamic interior `paddingBottom`. Interior spacing comes from `tabBtn.paddingVertical: 10`. Never stack `paddingBottom` AND `marginBottom` with `insets.bottom` — that double-counts the Android nav inset and creates visible empty space below the pill.
- **Currency sign preservation (v1.1.1)**: `pkr(n)` and `pkrF(n)` in `src/utils/currency.ts` MUST preserve the sign of negative numbers — output e.g. `Rs -2,500` or `-Rs 2,500`. Balance heroes on ExpensesScreen/TodayScreen/MonthlyReportScreen must render negative values in `colors.red` when `received - spent < 0` and show an "Over budget" chip when spent exceeds the monthly budget.
- **Body Stats insights memoization (v1.1.1)**: The 7-day + 30-day insights + threshold alerts computation on `BodyStatsScreen` MUST live in a single `useMemo` keyed on `[bodyLogs]` (plus date helpers if referenced inside). Never recompute inline per render.
- **Collapsible cards (v1.1.1)**: Use `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` before toggling a `useState` boolean for expand/collapse. No new dependencies. Add `Haptics.selectionAsync()` on toggle. Default collapsed when data is set, expanded when unset (invite empty-state interaction).
- **Quick-add chip rail (v1.1.1)**: Expense presets use a horizontal `ScrollView` of themed chips above the main form. Each chip pre-fills label + category and has a 44×44 minimum touch target. Handlers passed to chips must be `useCallback`'d and the preset array must be module-level (not inline per render).
- **Shopping sessions (v1.1.3)**: Shopping data is `ShoppingSession[]` stored in `hm_shopping_sessions`. Old flat `hm_shopping` data auto-migrates in DataContext. `importBackup` handles both `shoppingSessions` (new) and `shoppingList` (legacy → wrapped in single session). `updateSession` helper uses functional updater on `setShoppingSessions`.
- **Encrypted backup (v1.1.3)**: `exportEncryptedBackup` in `backup.ts` uses `crypto-js` AES. Prefix `FORSHE_ENC_V1:` identifies encrypted files. `importBackup` now takes a `promptPassword` callback (returns `Promise<string | null>`) for async password prompt via modal. `expo-file-system` new API (`File`, `Paths.cache`) for writing share-able files — do NOT use legacy `cacheDirectory`/`writeAsStringAsync`.
- **Multi-currency (v1.1.3-dev)**: NEVER import `pkr` / `pkrF` directly from `src/utils/currency.ts` in a screen. Always use `const { pkr, pkrF, currency, currencyCode } = useCurrency()` from `src/context/CurrencyContext.tsx`. `useMemo`/`useCallback` deps that reference `pkr` / `pkrF` MUST include them in the dep array — the functions change identity when the user switches currency. Placeholder text that mentions a currency ("Amount in PKR", "Set budget in PKR", etc.) must use the template `` `Amount in ${currencyCode}` ``. New code paths (utility files with no hook access, e.g. `share.ts`) must accept a `CurrencyDef` argument and default it to `CURRENCIES[0]` for backwards compatibility.
- **Global Quick-Add FAB (v1.1.3-dev)**: `QuickAddFAB` is mounted ONCE as a sibling of `NavigationContainer` inside `AppContent` in `App.tsx`. Screens MUST NOT render their own copy. Its bottom offset is `Math.max(insets.bottom, 8) + 82` to clear both the Android gesture bar and the floating tab pill. Haptic on open, undo toast on save, gold gradient, 60×60 circle with `borderRadius: 30`, `zIndex: 200`. The modal uses `animationType="slide"` with a bottom-sheet layout matching the ExpensesScreen edit modal for consistency.
- **Biometric lock (v1.1.3-dev)**: Toggle stored under `hm_biometric_lock` via `useStorage`. Enabling the toggle requires a live `authenticateAsync` success before persisting `true` — this prevents accidental enablement on devices with no enrollment. On app launch / resume-after-5s, if `biometricEnabled && !usePinFallback`, render `BiometricLockScreen`; otherwise fall through to PIN if set; otherwise unlock. Never delete the PIN when enabling biometric — PIN is the fallback and must coexist. Re-lock on `AppState` `active` triggers only when the backgrounded duration exceeds `RELOCK_AFTER_BACKGROUND_MS = 5000`.
- **Undo everywhere (v1.1.3-dev)**: Every destructive user action (delete / remove / clear) MUST call `showToast(msg, undoFn)` where `undoFn` re-adds the deleted item. When restoring sorted lists (periods, history), re-sort after insertion. When restoring reminders, reschedule notifications via `scheduleNotifications` (the old `notifIds` are already cancelled). If a screen doesn't already mount `<Toast toast={toast} dismiss={dismissToast} />`, add it at the bottom of the return tree AND import `Toast, useToast` from `components/ui/Toast`. All destructive actions across the app must follow this pattern — new delete callsites should always pass an undo callback.
- **Inventory cross-reference (v1.2-dev)**: Inventory matches against recipe ingredients and shopping items by **exact lowercase `name` match AND exact `unit` string match**. No unit conversions are ever attempted. If a recipe needs `500 g` of rice and the inventory has `1 kg` of rice, the system treats them as unrelated (the ingredient will still be added to shopping with qty = recipe qty). This is intentional — a conversion layer would introduce bugs and confuse users; explicit unit choice is better.
- **Recipe seed data (v1.2-dev)**: `src/constants/seedRecipes.ts` holds the 6 Pakistani starter recipes. They are written only on first launch (when `hm_recipes` is empty). Never re-seed on app open. Users can edit or delete them freely. When adding new seed recipes, keep the `id` values small integers (1-99) to avoid collisions with user-created recipes which use `Date.now()`.
- **Recipe Book navigation (v1.2-dev)**: `RecipeBookScreen` reads `route.params.pickForMeal?: { day: string; meal: string }`. When present, the screen renders a "picking for X · Y" banner and tapping a recipe calls `setCooking(c => ({ ...c, [day + '_' + meal]: recipe.name }))` then `navigation.goBack()`. `CookingScreen` sends this param via `navigation.navigate('Recipes', { pickForMeal: { day, meal } })`. Screens must NOT treat `pickForMeal` as a persistent state — it's one-shot and should be handled on goBack.
- **"Cook this" deduction (v1.2-dev)**: `RecipeBookScreen`'s `cookRecipe` handler: (1) picks the correct meal slot via time-of-day heuristic (`hr < 11` → Breakfast, `hr < 16` → Lunch, else Dinner); (2) writes the recipe name into `cooking[day + '_' + meal]`; (3) iterates inventory and subtracts each entry whose `name.toLowerCase() === ing.name.toLowerCase() && unit === ing.unit` (floor at 0, bump `lastUpdated`); (4) shows a toast + selection haptic. Ingredients without matching inventory are simply skipped.
- **Recurring bills (v1.2-dev)**: When a reminder with `recurring` set is toggled Done, the handler MUST create a new Reminder at `advanceByFreq(date, freq)`, fresh `id = Date.now() + Math.random()`, `isDone: false`, `notifIds: undefined`, then schedule notifications asynchronously and stamp the resulting `notifIds` via a follow-up setReminders. Never mutate the original — it stays marked Done as a completion record. The advance function: `monthly` = +1 month, `quarterly` = +3 months, `yearly` = +1 year. Day-of-month stays constant — JS Date auto-handles 31 → 30/28 rollover.
- **Medication generation (v1.2-dev)**: Add form with Medication category + duration N: generate N reminders in a loop `for (i = 0; i < N; i++) { date = addDays(start, i); id = Date.now() + i; ... }`. Each gets its own notification schedule. N is clamped to 1-60. The dosage + withFood fields are copied onto every generated reminder (users edit each if they need variation). NEVER implement this as a single reminder + client-side expansion — the model is always N distinct reminders in storage.
- **Savings goal contribution (v1.2-dev)**: The "+ Contribute" modal takes an amount + a "Log as expense" toggle (default ON). Logging creates a Transaction with `type: 'expense'`, `cat: SAVINGS_CAT` (`'💰 Savings'`), `label: 'Savings: ' + goal.name`, `date: todayStr()`. The goal's `savedAmount` increments regardless of the toggle. If the new saved amount crosses `targetAmount`, set `completed: true` AND fire `Haptics.notificationAsync(Success)` + a celebratory toast. `MonthlyReportScreen` reads `history.filter(h => h.cat === SAVINGS_CAT && sameMonth)` for its "Savings" overview box.
- **Insights chart library (v1.2-dev)**: Use `react-native-gifted-charts` exclusively. Do NOT install `victory-native` (requires `@shopify/react-native-skia`, a native module that needs a prebuild). `gifted-charts` is pure JS and ships with SDK 55. Default to `BarChart` for trends, `PieChart` for category breakdowns. Use `frontColor: colors.gold` etc. — NEVER hardcode hex. For chart width: `Dimensions.get('window').width - 80` accounts for the screen padding + card padding.
- **BodyStatsScreen medication card (v1.2-dev)**: The today-meds card MUST be conditional on `todayMeds.length > 0` — do not render an empty card. `todayMeds` is computed in a `useMemo` keyed on `[reminders]`, filtered by `r.cat === '💊 Medication' && r.date === todayISO()`, and sorted by `r.time`. Tapping a row calls `setReminders(r => r.map(x => x.id === id ? { ...x, isDone: !x.isDone } : x))`. Do NOT cancel notifications on this toggle (unlike the full RemindersScreen flow) — medication reminders are intentionally simpler and users often toggle multiple times per day.
