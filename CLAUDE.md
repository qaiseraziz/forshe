# ForSHE - Home Management App

## Overview
A React Native (Expo) home management app for tracking household expenses, cooking plans, maid tasks, reminders, and menstrual cycles. Built with TypeScript. Features a premium luxury design with gradient surfaces, hamburger drawer navigation, and a 4-tab bottom bar.

## Current Version
**v1.2.8** (tagged 2026-04-20) — "Cloud Backup". Optional Supabase-backed cloud backup. Users sign in to their own Supabase account (email + password), then upload AES-256 encrypted `.forshe` backups to a private storage bucket. Supabase only stores ciphertext — plaintext never leaves the device. Cloud account password (Supabase auth) and backup password (AES key) are deliberately separate. Manual setup: run `supabase-setup.sql` in Supabase Dashboard SQL Editor. Project URL + publishable key hard-coded in `src/lib/supabase.ts`.
- v1.2.7 release theme: "Launch-Crash Root-Cause Fix" — `moti@0.30.0` incompatible with `reanimated@4.2.1`. Fixed by rendering plain `View` in `MotiEnter` + `Toast`. All four disables (moti, expo-blur, lottie, phosphor) stay for safety until cautiously re-enabled.
- **Known-broken APKs** (do not distribute): `d718bd8a` (v1.2.4), `ed6cce5f` (v1.2.5), `36423651` (v1.2.6) — all crash on launch.
- **Last confirmed-working prior APK**: `2218683b` (v1.2.3) · https://expo.dev/artifacts/eas/5dceXqTVYSAxAvVjmx5Eo5.apk
- v1.2.4 release theme: "Design Polish + Battery Audit" — four design libraries, swipeable list rows in 6 screens, Skeleton loaders on 7 screens, floating-pill Toast, time-aware hero, micro-copy, form keyboard flow, PrayerTimesScreen countdown-leak fix.
- v1.2.3 release theme: "Inline-Expand Home + Spiritual Group" — TodayScreen home blocks switch from "tap = jump to default screen" to an inline single-open accordion that reveals the group's sub-modules as 2-column mini-tiles inside the block. New 🕌 Spiritual drawer group split out of Personal (Prayer Times moves there; Personal returns to wellness-only = Cycle Tracker + Body Stats). Drawer now has 6 groups.
- v1.2.2 release theme: "Block Grid Home + Prayer Times" — TodayScreen redesigned from stacked tile strips to a 2-column block grid (Money/Kitchen/Household/Personal) with themed gradient backgrounds + a full-width System tile. New Prayer Times + Sunnah Fasting feature (adhan library, GPS or manual city, 5 prayer notifications + Monday/Thursday + Ayyam al-Bid reminders).
- v1.2.1 release theme: "Grouped Home + Vendor Directory" — bundles the v1.2.1-dev drawer grouping (5 groups: Money, Kitchen, Household, Personal, System) + TodayScreen group-tile redesign with the v1.2.2-dev Vendor & Services Directory. Fix: removed the duplicate Quick-Add FAB on TodayScreen (global FAB handles it).
- `app.json`: version `1.2.8`, `ios.buildNumber "15"`, `android.versionCode 15`.
- `package.json`: name `forshe`, version `1.2.8`.
- Latest APK build: queued at tag time — see CHANGELOG.md v1.2.8 APK section for build ID.
- Last confirmed-working APK: v1.2.7 (`519dc1ff`, https://expo.dev/artifacts/eas/b5xtsf9zhgHyL4mF9mrEZq.apk).
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
- **Prayer times**: `adhan` 4.4.3 (pure JS, MIT, offline — Batoul Apps)
- **Location**: `expo-location` ~55.1.8 (GPS + reverse-geocode for prayer location; `Accuracy.Balanced`, one-shot `getCurrentPositionAsync`, NEVER `watchPositionAsync`)
- **Visual polish (v1.2.4-dev)**:
  - `expo-blur` ~15.0.8 — frosted glass in exactly 3 approved spots (bottom tab bar, QuickAdd sheet backdrop, ExpensesScreen edit-modal backdrop, PrayerSettings manual-location modal backdrop). **Never** in list rows, cards, or scrollable content — real battery hit.
  - `lottie-react-native` 7.3.5 — one-shot vector animations, gated behind the `LottieBox` wrapper in `src/components/ui/LottieBox.tsx` which HARD-CODES `loop={false}`. No ambient / infinite Lottie anywhere. Files live in `assets/lottie/` and are documented in `assets/lottie/README.md`. Hand-authored bodymovin JSONs for `celebrate`, `pulse`, `sparkle` ship in-repo; `splash-intro`, `empty-inbox`, `tasbeeh` slot fall back to those until Lottiefiles.com replacements drop in.
  - `phosphor-react-native` 2.3.1 — chrome icons only (bottom tab bar, hamburger). Weight: `regular` everywhere. Drawer group emojis (💰🍽️🏠💝🕌⚙️) stay — they are CONTENT, not chrome. react-native-svg was already a transitive dep of gifted-charts so no new native module.
  - `moti` 0.30.0 — declarative spring/timing entrances via the `MotiEnter` wrapper (`src/components/ui/MotiEnter.tsx`). Built on the reanimated we already ship. One-shot only; no `repeat`, no `loop`. Staggered 30ms delay between siblings for a premium feel.
- **Cloud backend (v1.2.8-dev)**: `@supabase/supabase-js` ^2.x — pure JS, no native modules. Used ONLY for optional cloud backup. Singleton client lives in `src/lib/supabase.ts`. Session persistence via AsyncStorage, `detectSessionInUrl: false` (mobile), `autoRefreshToken: true`. Storage helpers in `src/utils/cloudBackup.ts` (`uploadBackup`, `listBackups`, `downloadBackup`, `deleteBackup`) — all scoped to `${userId}/` path prefix under a private `backups` bucket. Auth session exposed via `src/hooks/useCloudSession.ts` (subscribes to `onAuthStateChange`, no polling). Cloud stores CIPHERTEXT only — uploads always pass through `encryptData()` first. The user's Supabase password is SEPARATE from the backup encryption password. Manual Supabase setup: run `../supabase-setup.sql` at the repo root once + toggle "Confirm email" OFF in Dashboard → Authentication → Providers → Email.
- **Build**: EAS Build (project ID: 51ca4967-73b1-4656-9b1b-045e2933a842, owner: smartbzss)
- **Babel**: babel.config.js with babel-preset-expo + react-native-reanimated/plugin

## Project Structure
```
src/
  components/
    ui/                  # Card, Button, Input (forwardRef v1.2.5-dev), Badge, Toast (floating pill v1.2.5-dev), Divider, EmptyState, Pill, ProgressBar, Skeleton (v1.2.5-dev), SwipeableRow (v1.2.5-dev), LottieBox, MotiEnter, ChromeIcon (all React.memo)
    DayStrip.tsx         # Day selector strip (React.memo)
    MonthBar.tsx         # Month filter bar (React.memo, static FILTERS array)
    DrawerMenuButton.tsx # Hamburger menu button (React.memo, useCallback)
    QuickAddFAB.tsx      # v1.1.3-dev — global floating add button (bottom-right, gold gradient, bottom-sheet modal)
  constants/
    colors.ts      # Theme colors + gradients (light/dark hero variants)
    data.ts        # DAYS, MONTHS, EXPENSE_PRESETS, SHOPPING_CATS, CAT_KEYS, STORAGE_KEYS, REMINDER_CATS, BILL_CATS, MEDICATION_CAT, RECURRING_FREQS, INVENTORY_CATS, UNIT_HINTS, SAVINGS_CAT, VENDOR_CATS
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
    VendorsScreen.tsx        # v1.2.2-dev — vendor & services directory (12 categories, tel:/wa.me Linking, 5-star rating, favorites, lastUsed tracking, undo on delete)
    PrayerTimesScreen.tsx    # v1.2.2-dev — daily salah times + Sunnah fasting status (adhan + Hijri date via Intl)
    PrayerSettingsScreen.tsx # v1.2.2-dev — prayer config (location via GPS or city list, 12 calculation methods, Asr Standard/Hanafi, 3 high-lat rules, 5 prayer notif toggles, Monday/Thursday + Ayyam al-Bid fasting switches)
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
    prayer.ts                  # v1.2.2-dev — adhan wrappers, Hijri via Intl, prayer + Sunnah fasting notification schedulers
  types.ts       # TypeScript type definitions (Transaction, RecurringExpense, Reminder with notifIds + v1.2 amount/recurring/dosage/withFood, PeriodLog, ShoppingItem, ShoppingSession, BodyProfile, BodyLog, BodyStatsSettings, InventoryItem, InventoryCategory, Recipe, RecipeIngredient, SavingsGoal, ReminderRecurring, Vendor, VendorCategory)
assets/
  logo.png       # App logo (512x512, 393KB)
  splash.png     # Full-screen branded splash image (1024w, 3.2MB)
  icon.png       # App icon (512x512, 393KB)
  favicon.png    # Web favicon (48x48, 4KB)
  android-icon-foreground.png  # Android adaptive icon (432x432, 278KB)
```

## Navigation Architecture
- **Drawer** (v1.2.3-dev): "Today" standalone at the top + 6 collapsible groups — `DRAWER_GROUPS` in `src/navigation/DrawerNav.tsx`:
  - 💰 **Money** — Expenses, Savings Goals, Insights, Monthly Report
  - 🍽️ **Kitchen** — Cooking, Recipe Book, Shopping List, Inventory
  - 🏠 **Household** — Maid Tasks, Reminders, Vendors
  - 💝 **Personal** — Cycle Tracker, Body Stats (wellness only; v1.2.3-dev removed Prayer Times from here. Will grow in v1.3: Routine Builder, Habits, Mood, Journal, Me Time, Weekly Summary, Hidden Notes)
  - 🕌 **Spiritual** — Prayer Times (v1.2.3-dev split this group out of Personal. Reserved for Islamic features — future additions: Qibla compass, Duas library, Quran bookmarks, Zakat calculator, Islamic events. Adding a 2nd item here is free; reaching 3+ items should prompt a layout revisit in the drawer collapse default.)
  - ⚙️ **System** — Backup, Settings
- Group headers are tappable (`accessibilityRole="button"`, label "Expand/Collapse [group]") — collapse/expand uses `LayoutAnimation.Presets.easeInEaseOut`, state is in-component (no persistence), default expanded.
- Active indicator (gold bar) still works correctly when the active route is nested inside a group. For drawer items that point to the bottom-tab routes (Expenses/Cooking/Remind), the drawer detects the nested tab state and navigates via `navigation.navigate('Home', { screen: tabName })`.
- **Bottom Tabs** (inside Home): Today, Expenses, Cooking, Remind (Reminders)
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

42. **Prayer Times + Sunnah Fasting** (v1.2.2-dev): Two new drawer screens inside the 💝 Personal group — `PrayerTimesScreen.tsx` (first item in the group, becomes the primary Personal home-block target when enabled) + `PrayerSettingsScreen.tsx` (drawer-level route, not in the list). Uses `adhan` 4.4.3 (pure JS Batoul Apps library) for salah computation and the Intl `en-u-ca-islamic-umalqura` calendar for Hijri dates (with a coarse fallback for devices missing that calendar). `PrayerSettings { enabled, location, locationSource, method, asrMethod, highLatitudeRule, 5x prayerNotify*, mondayThursdayFasting, ayyamAlBidFasting, fastingNotifIds?, prayerNotifIds? }` stored under `hm_prayer_settings`, default `enabled: false` until first configuration. Location comes from either `expo-location` GPS + reverse-geocode (`Location.requestForegroundPermissionsAsync` → `getCurrentPositionAsync` → `reverseGeocodeAsync`) or a manual entry modal seeded with 8 Pakistani cities (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Quetta, Multan). Calculation method defaults to Karachi; Asr defaults to Hanafi; high-latitude rule defaults to MiddleOfTheNight. `schedulePrayerNotifications` cancels previous IDs first, then schedules the 5 enabled prayers for today + the next 6 days (up to 35 notifications). `scheduleFastingNotifications` walks the next 4 weeks for Monday/Thursday + next 2 upcoming Ayyam al-Bid windows, firing at 20:00 the night before. All scheduling uses typed `SchedulableTriggerInputTypes.DATE`. `TodayScreen` Personal block becomes prayer-aware: shows "Sunnah day 🌙" on Mon/Thu/13-14-15 Hijri, otherwise the next prayer + time (e.g. "Asr 3:42 PM"), falling back to BodyStats copy when disabled. A dismissible onboarding card appears on TodayScreen below the block grid while `prayerSettings.enabled === false`. `SettingsScreen` also exposes a "Prayer Times" row under App Lock that navigates into `PrayerSettings`. Backup schema bumped to v2.5 with `prayerSettings?: PrayerSettings`. No currency usage.

43. **2-Column Block Grid Home** (v1.2.2-dev): `TodayScreen` moves from stacked full-width tile strips to a 2×2 block grid for the four primary groups (Money/Kitchen/Household/Personal) plus a compact full-width System tile at the bottom. Each block is a square-ish `Card` (aspectRatio 1:0.9) with a soft themed gradient (Money→`goldHero`, Kitchen→`greenHero`, Household→blue-ish `['#f0f7ff','#e0ecff']`, Personal→`pinkHero`, System→neutral). Gradient flips to the dark-mode variant when `dark === true` (own `['#050d1a','#071226']` pair for the Household block as it has no pre-baked dark hero). Top-right shows the large emoji (fontSize 32), bottom-left shows the group name (Outfit-Bold 18) + status badge pill (same tone palette as v1.2.1-dev tiles: red/gold/green/muted). Uses `flex-wrap` + `width: '47%'` + `gap: 12` for the grid (no FlatList since only 4 items). System tile is a full-width `Card` with icon + name + `›` chevron at roughly 14 vertical padding. Pressed state uses `activeOpacity={0.8}` for a subtle opacity dip. Personal block target is dynamic — `PrayerTimes` when `prayerSettings.enabled`, else `BodyStats`. Hero card, onboarding nudge, and "Today's Essentials" section below are unchanged from v1.2.1-dev.

41. **Vendor & Services Directory** (v1.2.2-dev): New drawer screen `VendorsScreen.tsx` inside the Household group (3rd item, after Maid Tasks + Reminders). Personal Rolodex of trusted local service providers — plumber, electrician, AC repair, appliance repair, doctor, pharmacy, tailor, carpenter, gardener, cleaner, mechanic, other. `Vendor { id, name, category, phone, altPhone?, address?, rating (0-5), favorite, lastUsed?, notes?, createdAt }` stored under `hm_vendors` (no seed data). `VENDOR_CATS` in `src/constants/data.ts` holds 12 categories with emoji icons. `FlatList` + memoized `listHeader` pattern. Gold hero with count + subtitle "Your trusted service providers". Search input filters by name/category. Filter pill rail: "All" + "Favorites" (shown when any favorites exist) + one pill per non-empty category. Vendor rows: category-emoji circle (gold-tinted bg), name/category/phone/star rating, favorite toggle on the right. Tap row to expand a 4-button action row (Call gold, WhatsApp green, Edit outline, Delete icon). Call fires `Linking.openURL('tel:' + cleanedPhone)`; long-press Call when `altPhone` exists shows an Alert to pick primary or alt. WhatsApp fires `Linking.openURL('https://wa.me/' + cleanedPhone)` (strip spaces/dashes/parentheses). Both actions stamp `lastUsed` to today's ISO. Delete shows Toast undo (v1.1.3 rule). Sort: favorites first, then `lastUsed` desc (recent first), then alphabetical. Add/Edit bottom-sheet modal: Name (required), Category picker, Phone (required, phone-pad, ≥7 digits after sanitize), Alt phone (optional), Address (optional multiline), 5 tappable stars for rating, Pin-as-favorite switch, Notes (optional multiline). Validation: name + phone required, `countDigits(phone) >= 7`. Backup schema bumped to v2.4 with `vendors: Vendor[]`. Currency NOT used on this screen (contacts, not money).

44. **Cloud Backup** (v1.2.8-dev): Optional cloud backup powered by Supabase. Users sign in to their own Supabase account (publishable key embedded in source — safe, RLS-scoped) from the Backup screen, then upload encrypted `.forshe` backups to a private `backups` storage bucket, list them, restore from them, or delete them. **Encryption is always done on-device before upload** — the cloud stores ciphertext only. Cloud account password and backup password are two different things: the cloud password is the Supabase auth credential; the backup password is the AES key for the file itself. Files are stored at `${userId}/forshe-backup-${timestamp}.forshe`; RLS policies restrict each user to their own folder. Four new files: `src/lib/supabase.ts` (singleton client — AsyncStorage-backed session, `detectSessionInUrl: false`, `autoRefreshToken: true`), `src/utils/cloudBackup.ts` (`uploadBackup` / `listBackups` / `downloadBackup` / `deleteBackup` — scoped to userId path), `src/hooks/useCloudSession.ts` (subscribes to `supabase.auth.onAuthStateChange`, no polling), `src/screens/CloudAuthScreen.tsx` (Sign In / Sign Up toggle pill, 6-char min password, email-confirmation fallback message, Forgot-password row that fires `supabase.auth.resetPasswordForEmail`). `BackupScreen` gains a "Cloud Backup" section with Upload / Restore / Manage cards, Upload encrypts with the same `encryptData` used for local encrypted backups, Restore downloads + decrypts + runs `validateBackupData` + `handleImport` (with the same "replace all data?" confirmation as local import). Cloud file list refreshes on screen focus via `useFocusEffect`, never on a timer. `CloudAuth` is registered as a `Drawer.Screen` but NOT in `DRAWER_GROUPS` — deep-link only (same pattern as `PrayerSettings`). Manual Supabase setup required once: run `supabase-setup.sql` at the repo root in Dashboard → SQL Editor (creates bucket + 4 RLS policies) and toggle Dashboard → Authentication → Providers → Email → "Confirm email" OFF. Single new dep: `@supabase/supabase-js` ^2.x (pure JS, no native modules).

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
- **No infinite animation loops, EVER** (v1.2.4-dev rule): no `loop={true}` on `LottieView`, no `repeat: Infinity` / `loop: Infinity` on Moti/reanimated, no `Animated.loop`, no ambient `setInterval` without `useFocusEffect` pausing it on blur, no `watchPositionAsync`. All animations are one-shot. `LottieBox` and `MotiEnter` wrappers enforce this — never import `LottieView` or `MotiView` directly in screens. v1.2.5-dev adds: Toast uses a single Moti spring on mount (one-shot, no `repeat`), Skeleton uses no animation at all.
- **Swipeable list rows** (v1.2.5-dev rule): use `<SwipeableRow>` from `src/components/ui/SwipeableRow.tsx` — NEVER import `Swipeable` from `react-native-gesture-handler` directly in a screen. Actions passed as `SwipeAction[]` with `kind: 'delete' | 'edit' | 'done' | 'call' | 'custom'`. Every destructive `delete` action MUST still fire `showToast(msg, undoFn)` — the SwipeableRow wrapper does NOT fire the toast; that's the screen's job (matches the v1.1.3 Undo-everywhere rule). Apply to flat list rows only — NEVER to grid tiles (home block mini-tiles, drawer items) or single-row cards. Action buttons are 44×44 min, fire `Haptics.impactAsync(Light)` once, then call the callback. Swipeable does not interfere with tap navigation. Canonical screens: ExpensesScreen (edit+delete), RemindersScreen (done+delete), VendorsScreen (call+delete), InventoryScreen (edit+delete), ShoppingListScreen active-session items (delete), SavingsGoalsScreen (edit+delete).
- **Skeleton loaders** (v1.2.5-dev rule): use `<Skeleton>`, `<SkeletonCardRow>`, or `<SkeletonChart>` from `src/components/ui/Skeleton.tsx`. Gate them behind `!allLoaded` from `useData()`. NEVER add shimmer, `repeat`, or any animation loop — the default is a static dim-gray rounded block. Typical AsyncStorage load completes in <400ms so animation is both pointless and a battery drain. If shimmer is ever genuinely needed, use the reserved `animated` prop (not yet implemented) — do NOT roll your own `Animated.loop`. Canonical uses: ExpensesScreen 5 rows, RemindersScreen 3 rows, VendorsScreen 4 rows, InventoryScreen 4 rows, RecipeBookScreen 3 rows, InsightsScreen 2 charts, TodayScreen hero numbers + block grid.
- **Time-aware TodayScreen hero** (v1.2.5-dev rule): the greeting hero uses `heroGradientForHour(hour, dark)` from `src/constants/colors.ts` inside a `useMemo` whose deps are `[currentHour, dark]` where `currentHour` is itself a primitive captured via `useMemo(() => new Date().getHours(), [])`. **NEVER** key the memo on `new Date()` directly — the Date instance changes every render and the memo would recompute uselessly. Static — no animation, no re-render trigger. Four bands: Morning 5–10 (warm gold-ivory), Afternoon 11–16 (default = goldHero), Evening 17–20 (warmer peach), Night 21–4 (cool lavender). Dark-mode counterparts use `*HeroDark` variants. Only TodayScreen uses this — other screens keep their fixed hero gradient.
- **Toast floating-pill** (v1.2.5-dev rule): Toast is rendered as a floating pill at `bottom = max(insets.bottom, 8) + 90` with `colors.bg2` bg, 18px radius, icon-in-tinted-circle on the left, optional Undo button on the right, all layered over a Moti one-shot spring (damping 18, stiffness 220). `showToast(msg, undoFn)` API is unchanged — existing callsites still work. New optional third arg `icon: 'success' | 'error' | 'info'` picks the glyph (default 'success' = green ✓). Multiple toasts stack gracefully: a new `show()` clears the previous one, waits 20ms, then mounts the new one — keeps the animation queue clean. Auto-dismiss at 4000ms if `undoFn` provided, 2500ms otherwise. Mount `<Toast toast={toast} dismiss={dismissToast} />` in every screen that uses `useToast()` (existing rule — unchanged).
- **Form keyboard flow** (v1.2.5-dev rule): every multi-field Add/Edit modal MUST (a) auto-focus the first field (`autoFocus`), (b) pass `returnKeyType="next"` + `blurOnSubmit={false}` on all intermediate fields and route `onSubmitEditing` → `nextRef.current?.focus()`, (c) pass `returnKeyType="done"` on the last field and route its `onSubmitEditing` → primary submit handler. `Input` now `forwardRef`s to the underlying `TextInput` — refs use `useRef<TextInput | null>(null)` per field. Optional utility: `useFormRefs(count)` from `src/utils/formRefs.ts` returns `{ register, focusNext, focusAt, submit }` helpers if the screen wants to avoid a dozen `useRef` calls. Keyboard flow is wired on: Expenses edit modal, Reminders add form (3 branches), Vendors add/edit, Inventory add/edit, Recipes edit, Savings Goals, PrayerSettings manual-city. Any NEW multi-field form must follow the same pattern.
- **BlurView DISABLED in v1.2.5** (hotfix rule): `expo-blur` package stays in package.json but `BlurView` is NOT currently imported anywhere. Removed from tab bar + 3 modals because it caused a native-module init crash on some devices in v1.2.4. Do NOT re-enable until we verify on-device native init on a real low-RAM Android device (Tecno / Vivo class). If re-enabled, the original 4 approved spots apply: tab bar + QuickAdd + Expenses edit + PrayerSettings manual-location. Never on list rows / cards / scrollables.
- **Phosphor icons in chrome / emojis in content** (v1.2.4-dev rule): bottom tabs, hamburger, hero action buttons use Phosphor via `src/components/ui/ChromeIcon.tsx`. Category pickers, recipe names, reminder categories, drawer group emojis stay as emoji. Single weight across the app: `regular`.
- **Lottie DISABLED in v1.2.5** (hotfix rule): `lottie-react-native` package stays in package.json but is NOT imported anywhere. `LottieBox` (`src/components/ui/LottieBox.tsx`) now renders the fallback emoji only — screens pass `fallbackEmoji` which is displayed in the animation's footprint. Same root cause as BlurView: suspected native-module init failure on some devices. Do NOT import `lottie-react-native` directly. To re-enable later, restore `LottieView` inside `LottieBox` AND verify on a real low-RAM Android device before shipping. Animation JSONs under `assets/lottie/` remain (they're fine) and are still documented in `assets/lottie/README.md`.
- **Moti DISABLED in v1.2.7** (hotfix rule — ACTUAL root cause of v1.2.4→v1.2.6 launch crashes): `moti@0.30.0` was built against `react-native-reanimated@3.11.0` and is incompatible with our `reanimated@4.2.1`. Importing `MotiView` throws at module init because it calls reanimated-3 internals that don't exist in v4's Worklets rewrite. `MotiEnter` and `Toast` now render plain `View`. Do NOT import `moti` anywhere. Package stays in package.json; to re-enable, upgrade to a Moti release that declares `react-native-reanimated: ^4` as a peer (Moti 0.32+ or a canary). Before re-enabling: `cat node_modules/moti/package.json | grep reanimated` must show `>=4` or compatible.
- **Native / peer-dep version check before adding any animation/graphics library**: run `cat node_modules/<lib>/package.json | grep -E '"react-native-reanimated"|"react-native-svg"'` and verify major versions match our installed ones (reanimated 4.x, svg 15.x). v1.2.4 shipped 4 libraries without this check — 3 ended up partially broken (moti/reanimated mismatch, phosphor/svg transitive-only), costing 4 broken builds.
- **PrayerTimesScreen countdown** (v1.2.4-dev rule): the 30s tick interval is registered via `useFocusEffect` so it pauses when the screen is not focused. Any other countdown/timer added to a screen must follow the same pattern.
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
- **Drawer grouping pattern (v1.2.1-dev)**: The drawer is structured as `DRAWER_GROUPS: { title, icon, items: DrawerItemDef[] }[]` — EXACTLY 5 groups (Money, Kitchen, Household, Personal, System). "Today" sits ABOVE the groups as a standalone row, not inside any group. Group headers render as a tappable row (44×44 minimum) with the group emoji, uppercase small title in `colors.sub`, and a chevron (`▸` collapsed / `▾` expanded) in `colors.muted`. Tapping toggles the group via `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` + `setCollapsed(prev => ({ ...prev, [title]: !prev[title] }))`. State is local to `CustomDrawerContent` — never persisted. Default: all groups expanded. `accessibilityRole="button"` + `accessibilityLabel` = "Expand/Collapse [group name]" on each header. Group items are indented (marginLeft: 8, slightly tighter paddingVertical) but otherwise keep the same icon + label + active-indicator styling as before. For items that resolve to bottom-tab routes (`Expenses`, `Cooking`, `Remind`), navigation goes through `navigation.navigate('Home', { screen: routeName })`; for drawer-level routes, plain `navigation.navigate(routeName)`. The active indicator (gold bar) reads the nested tab state via `state.routes[state.index].state` when the drawer is on "Home" so highlighting follows the actual leaf route.
- **Cloud backup / Supabase rules (v1.2.8-dev)**:
  - The Supabase client is imported from `src/lib/supabase.ts` ONLY. Screens, utils, and hooks MUST NOT `import { createClient } from '@supabase/supabase-js'` directly — they go through the singleton. qa-expert ban rule.
  - Cloud uploads ALWAYS pass through `encryptData(json, password)` from `src/utils/backup.ts` BEFORE calling `uploadBackup`. The cloud stores ciphertext only. Any code path that uploads a plain JSON blob is a security bug — qa-expert must flag and revert.
  - No polling. Auth state comes from `supabase.auth.onAuthStateChange` via the `useCloudSession` hook; cloud file lists refresh on screen focus via `useFocusEffect`, never on `setInterval`.
  - Don't call Supabase on app launch. `getSession` runs on mount of `BackupScreen` / `CloudAuthScreen` only (the hook); `DataContext` and `App.tsx` must not import `supabase`.
  - The Supabase password is the cloud ACCOUNT password. The backup password is what encrypts the `.forshe` content. Never conflate them in UI copy. CloudAuthScreen + BackupScreen modal copy already draws the distinction — maintain it.
  - Bucket `backups` + 4 RLS policies must exist in the Supabase project (see `supabase-setup.sql` at repo root). If a new Supabase project is spun up, run the SQL first.
  - `expo-doctor` must continue to report zero new native modules after any `@supabase/*` package update — if a new native dep sneaks in (e.g. a future `@supabase/storage-js` requiring FS access), check SDK 55 compat and a prebuild before merging.
- **Vendors screen tel/WhatsApp wiring (v1.2.2-dev)**: `VendorsScreen` uses React Native's built-in `Linking` API (NOT `expo-linking`). Phone numbers are sanitized via `cleanPhone(phone)` which strips spaces, dashes, and parentheses — but keeps the leading `+` if present. Call action fires `Linking.openURL('tel:' + clean)`; WhatsApp action fires `Linking.openURL('https://wa.me/' + clean)`. Both actions MUST update `vendor.lastUsed` to today's ISO (via `stampUsed(id)`) on tap. Phone validation: `countDigits(phone) >= 7` before saving. Long-press on the Call button when `altPhone` exists shows an Alert to choose primary/alt. No new npm packages — do NOT add `expo-linking` or `react-native-communications`.
- **Household group item count (v1.2.2-dev)**: the drawer's 🏠 Household group now has EXACTLY 3 items in this order — `MaidTasks`, `Remind`, `Vendors`. Adding a 4th item to Household requires explicit user approval. The qa-expert rule for "Household = 2" from v1.2.1 is now "Household = 3".
- **adhan usage (v1.2.2-dev)**: Prayer time computation always goes through `src/utils/prayer.ts`. NEVER import `adhan` directly from a screen. `computePrayerTimes(date, settings)` returns `null` if `settings.location` is absent — always handle the null case with a setup prompt. `buildParameters` wires the `method` key into `CalculationMethod[method]()`, sets `params.madhab = settings.asrMethod === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi`, and maps the string `highLatitudeRule` into the `adhan.HighLatitudeRule` enum (3 real options only — `MiddleOfTheNight`, `SeventhOfTheNight`, `TwilightAngle`). adhan has no `HijriDate` export in v4.4.3; use `hijriToday()` which wraps `Intl.DateTimeFormat('en-u-ca-islamic-umalqura', …)` with a coarse arithmetic fallback.
- **Prayer notification scheduling (v1.2.2-dev)**: `schedulePrayerNotifications` and `scheduleFastingNotifications` in `src/utils/prayer.ts` both (1) cancel previous IDs from `settings.prayerNotifIds` / `settings.fastingNotifIds` FIRST, (2) check `Notifications.getPermissionsAsync()` and request if needed (3) return `[]` when `settings.enabled === false` or when permission is denied. Every schedule call is typed `SchedulableTriggerInputTypes.DATE`. Callers MUST store the returned IDs back into `prayerSettings` (see `PrayerSettingsScreen.saveAndSchedule`). Prayer notifications cover today + next 6 days (max 35); fasting covers the next 4 weeks of Mon/Thu (fires 20:00 day before) + the next 2 Ayyam al-Bid windows (fires 20:00 the night before 13 Hijri).
- **Location permission handling (v1.2.2-dev)**: `PrayerSettingsScreen.useGPS` calls `Location.requestForegroundPermissionsAsync()` and falls back to the manual picker on denial (with a Pakistani city grid + free-form lat/lng entry). Never treat permission denial as an error — always degrade gracefully. `app.json` has `expo-location` plugin with a clear `locationWhenInUsePermission` string + iOS `NSLocationWhenInUseUsageDescription` + Android `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION`.
- **Inline-expand home accordion (v1.2.3-dev)**: `TodayScreen` home blocks are a single-open accordion. There are EXACTLY 6 blocks rendered in a vertical stack (Money, Kitchen, Household, Personal, Spiritual, System — in that order, matching `DRAWER_GROUPS`). Each block is a full-width `Card` with a themed gradient. Tapping a block toggles inline expansion (it does NOT navigate to a default screen — that behavior is removed). Only one block is open at a time; tapping a different block collapses the previously open one and opens the new one. Tapping the same block again collapses it. State lives in `useState<string | null>(null)` named `expandedGroup` in `TodayScreen` — never persisted. Expand/collapse animates via `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` + `Haptics.selectionAsync()` (no new deps). Block header shows: emoji + group name + chevron (`▸` collapsed, `▾` expanded) + status badge on the row below. When expanded, the block reveals its sub-modules as a 2-column grid of mini-tiles INSIDE the block (mini-tile layout: `flexBasis: '47%'`, `minHeight: 80`, `borderRadius: 14`, icon 22px + label 14px Outfit-SemiBold, background `rgba(255,255,255,0.55)` light / `rgba(255,255,255,0.06)` dark so the block's gradient still reads through). Each mini-tile is a `TouchableOpacity` with `activeOpacity={0.7}`, `accessibilityRole="button"`, `accessibilityLabel` = `` `${sub.label}, inside ${block.name}` `` and navigates to the target screen (`navigation.navigate('Home', { screen: target })` when `targetIsTab` or target is in `TAB_NAMES`; else plain `navigation.navigate(target)`). Header `accessibilityState={{ expanded }}` + `accessibilityLabel` = `` `${expanded ? 'Collapse' : 'Expand'} ${block.name} group` ``. Submodule definitions are computed once inside the `blocks` `useMemo` alongside badges — keep them there so a prayer-settings change doesn't duplicate the list. Do NOT re-add the v1.2.2-dev `aspectRatio` / `width: '47%'` 2×2 grid — that pattern is superseded.
- **Spiritual group block (v1.2.3-dev)**: Spiritual reuses the `greenHero` / `greenHeroDark` gradient (same as Kitchen). Rationale: green reads as calm / spiritual and the gradient palette stays tight — no new pair was added to `gradients`. Kitchen keeps its own `greenHero`; the two blocks never sit adjacent because drawer order is Kitchen (2nd) → Household → Personal → Spiritual (5th). Spiritual badge logic: (1) `!prayerSettings.enabled` → `"Setup"` (gold tone); (2) `isSunnahWeekday(now) || isAyyamAlBid(now) !== null` → `"Sunnah day 🌙"` (gold); (3) location set + prayer times computable → `"{PrayerName} {h:MM AM/PM}"` via `getNextPrayer` + `formatPrayerTime` (muted); (4) fallback → `"Setup"`. If Spiritual grows to 3+ items, introduce a dedicated `spiritualHero` gradient pair (`['#e8f5e9','#c8e6c9']` light / `['#0a1a12','#050d08']` dark) so it visually separates from Kitchen — until then, the shared green is fine.
- **Personal block reverts to wellness-only (v1.2.3-dev)**: Personal no longer has Prayer Times. Block badge is `bodyLogs.some(b => b.date === todayISO())` → `"logged today"` (green) else `"no log today"` (muted). Sub-modules are `CycleTracker` + `BodyStats` only. No prayer awareness — that logic moved to the Spiritual block. The pink gradient stays. When v1.3 adds Routine/Habits/Mood/Journal/Me Time/Weekly Summary/Hidden Notes, they all live inside Personal — Spiritual stays Islamic-only.
- **Home-tile grid pattern (v1.2.2-dev, superseded by v1.2.3-dev accordion)**: `TodayScreen` uses a 2-column block grid (4 square-ish blocks — Money/Kitchen/Household/Personal) + a compact full-width System tile below. Each block is a `Card` with a themed gradient (light + dark variant), aspect ratio 1:0.9, the group emoji in the top-right (fontSize 32), the name in the bottom-left (Outfit-Bold 18), and a status badge pill. Layout uses `flex-wrap` + `width: '47%'` + `gap: 12` — NOT FlatList (only 4 items). System tile is narrower (paddingVertical: 14) because users rarely visit it. Pressed state is `activeOpacity={0.8}`. Personal block target is dynamic (`PrayerTimes` when enabled, else `BodyStats`). Personal badge is prayer-aware: "Sunnah day 🌙" on Mon/Thu/13-14-15 Hijri, "{next prayer} {HH:MM AM/PM}" otherwise, "Setup Prayer Times" when not enabled. Replaces the v1.2.1-dev stacked-strip tile layout.
- **Home-tile grid pattern (v1.2.1-dev, superseded)**: `TodayScreen` is a home page, not a stats wall. The hero card keeps greeting + balance + spent today (NO more 4-box stat grid, NO weekly bars, NO insights block). Below the hero, render 5 "Explore" tiles — one per drawer group — in a vertical stack (each tile is a `Card` with icon, name, dynamic count badge, and a subtle chevron). Tapping a tile navigates to that group's most actionable screen: Money → Expenses, Kitchen → Cooking, Household → Remind, Personal → BodyStats, System → Settings. Dynamic badges are computed from existing `DataContext` state:
  - 💰 Money: "over budget" if `budget > 0 && monthSpent > budget`, else "on track" if `budget > 0`, else no badge
  - 🍽️ Kitchen: `"${n} low stock"` when `inventory.filter(i => i.qty <= i.lowStockThreshold).length > 0`, else "stocked"
  - 🏠 Household: `"${n} due today"` when any `reminder.date === todayISO() && !isDone`, else "all clear"
  - 💝 Personal: "logged today" if any `bodyLog.date === todayISO()`, else "no log today"
  - ⚙️ System: no badge
  Badge tones: red (warning), gold (actionable), green (positive), muted (neutral). Badge colors use `colors.redBg/red`, `colors.goldBg/gold`, `colors.greenBg/green`, `colors.bg3/muted` — never hardcoded hex. Below the tiles, the "Today's Essentials" section renders due-soon reminders, today's meals, and maid tasks (existing logic preserved). Empty state rendered when all three are empty. The v1.1-era bottom "Insights" block (month-over-month, top category, avg daily) has been removed from this screen — that content now lives on `InsightsScreen`. `<Toast />` still mounted.
