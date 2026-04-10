# Changelog

All notable changes to ForSHE will be documented in this file.

## v1.1.0 — 2026-04-10

Minor feature release — adds an opt-in **Body Stats** module for tracking personal vitals alongside the household data already in the app. No breaking changes to existing data; v1.0.2 backups import cleanly.

### Added
- **Body Stats screen** (`src/screens/BodyStatsScreen.tsx`) — log weight, blood pressure (sys/dia), blood sugar with context (fasting/post-meal/random), SpO2 oxygen, heart rate, and free-form notes. Stored as timestamped `BodyLog` entries alongside a one-time `BodyProfile` (height + optional birth year + gender).
- **BMI calculation** — hero card on BodyStatsScreen shows latest weight, computed BMI, and category (Underweight / Normal / Overweight / Obese) whenever a recent log contains weight and the profile has a height.
- **Feature flag** — Body Stats is off by default. Users enable it from `Settings → 💪 Body Stats → Enable Body Stats`. Disabling the feature cancels scheduled reminders and hides the feed behind a dedicated disabled-state empty view, but preserves all logs.
- **Daily reminder notification** — optional local push at a user-chosen time, wired to `expo-notifications` `SchedulableTriggerInputTypes.DAILY`. Schedules on enable, reschedules on time change, cancels on disable. Graceful fallback if permission is denied.
- **Drawer entry** — `💪 Body Stats` now appears in the drawer between Cycle Tracker and Monthly Report. Always visible (even when feature disabled) so users can discover it; disabled state routes back to Settings.
- **Backup schema** — `bodyProfile`, `bodyLogs`, `bodyStatsSettings` added to `BackupData`, `validateBackupData()`, export JSON, and import flow. Export format version bumped to `2.1`. `BackupScreen` data summary now includes a "Body Logs" tile.
- **New utility** — `src/utils/bodyStatsNotifications.ts` exports `scheduleBodyStatsReminder(time)` / `cancelBodyStatsReminder(ids)`.
- **New AsyncStorage keys** — `hm_body_profile`, `hm_body_logs`, `hm_body_settings` (added to `STORAGE_KEYS` in `constants/data.ts`).
- **New types** — `BodyProfile`, `BodyLog`, `BodyStatsSettings`, `BloodSugarContext` in `src/types.ts`.

### Validation
- Weight 20–300 kg, systolic 60–250, diastolic 40–150 (diastolic must be < systolic), blood sugar 40–600 mg/dL, SpO2 50–100%, heart rate 30–220 bpm, height 50–260 cm. At least one metric required per log. All `parseFloat` / `parseInt` results guarded for NaN. Inline alerts on invalid input.

### Performance
- `LogRow` extracted as a `React.memo` sub-component — the recent-logs list won't re-render each parent update.
- All BodyStatsScreen handlers (`saveHeight`, `logEntry`, `deleteLog`, `resetForm`, gender/sugar context pickers, navigation to Settings) wrapped in `useCallback`.
- `latestLog`, `daysSinceLast`, `latestBMI`, `displayLogs`, and `sugarCtxHandlers` all `useMemo`'d with minimal deps.
- Recent logs are capped at 10 rendered rows — no FlatList virtualization needed.

### Style
- Reuses the existing luxury design system — gold gradient hero with dark variant, no borders on chips, 44×44 minimum touch targets everywhere, `useSafeAreaInsets` wrapper, locale-independent date formatting via `fmtISO` / `todayISO`.
- All colors sourced from `useTheme()`; only `#fff` literal is used for text on gradient surfaces (per design system rule).

### Chore
- `app.json` → version `1.1.0`, `ios.buildNumber` `"4"`, `android.versionCode` `4`.
- `package.json` → version `1.1.0`.
- `SettingsScreen` About card → `Version 1.1.0`.
- `DrawerNav` footer → `ForSHE v1.1.0`.
- `CLAUDE.md` updated — current version, feature list, drawer architecture, utils listing, types listing.

## v1.0.2 — 2026-04-10

Post-v1.0.1 UX polish and performance hardening. No new features — focused on closing design gaps, tightening memoization, and improving accessibility.

### Added
- Gradient hero Cards on CookingScreen and MaidScreen daily views (the last two main screens missing the premium hero pattern).
- `EmptyState` component now supports an optional `hint` line with a circular icon tile for better empty-state guidance.
- Accessibility labels and roles on icon-only buttons across RemindersScreen, CycleScreen, ShoppingListScreen, and SettingsScreen.

### Fixed
- Cooking meal edit UX — raw `TextInput` replaced with themed `Input`, contextual placeholders per meal type ("e.g. Paratha & chai", "Chicken biryani", "Daal chawal"), proper Save/Clear/Cancel `Button` components.
- MonthlyReportScreen restructured — title row + separate month nav + separate overview card merged into one cohesive gradient hero Card with centered month nav ("← Prev" / "Next →" instead of cryptic arrows).
- BackupScreen + SettingsScreen title rows merged into gradient hero Cards; Backup options now use 52px colored icon tiles (goldBg / blueBg / greenBg) instead of flat emoji.
- ShoppingList delete + checkbox buttons: `hitSlop` expanded for effective 52×52 touch area.
- CycleScreen delete button (was 16×16) now 44×44 with accessibilityLabel.
- `addTopup` and budget "Set" in ExpensesScreen now use explicit `isNaN(amt) || amt <= 0` guards.
- Removed dead `monthText` style from MonthlyReportScreen.

### Performance
- **MaidScreen**: `ATT_STATUSES` and `ATT_ICONS` extracted as module-level constants. `handleAddPreset`, `handleAddCustom`, `toggleSalaryPaid` wrapped in `useCallback`. Attendance status array no longer allocated per render.
- **CookingScreen**: `handleSaveEdit`, `handleClearEdit`, `handleCancelEdit` wrapped in `useCallback` — no more inline closures capturing loop-local `key`.
- **RemindersScreen**: `nextUpcomingTitle` `useMemo` — sort of upcoming reminders now runs only when the list changes, not every render.
- **CycleScreen**: `predictionRows` `useMemo` — 4-row prediction array rebuilt only when predictions/theme change.
- **ExpensesScreen**: `handleSetBudget`, `handleClearBudget`, `openDatePicker`, `openEditDatePicker`, `closeEditModal`, `handleSaveEdit` wrapped in `useCallback`. `listHeader` `useMemo` deps tightened — header rebuilds less frequently.
- **SettingsScreen**: `toggleDark`, `togglePinLock`, `handleSetPin`, `handlePinInputChange`, `handleRecDayChange` wrapped in `useCallback` — Switch / Button / Input memoization now actually cache-hits.
- Over 20 inline arrow handlers passed to `React.memo` children eliminated across MaidScreen, CookingScreen, RemindersScreen, CycleScreen, ExpensesScreen, and SettingsScreen.

### Style
- All hero titles standardized: `PlayfairDisplay-ExtraBold` 30px lineHeight 36 with 12px uppercase label and 14px subtitle.
- Expenses edit modal placeholders upgraded ("Label" → "e.g. Groceries", "PKR" → "Amount in PKR").
- ShoppingList Qty placeholder: "Qty" → "1 kg" (shows expected format).

### Chore
- `app.json`: version `1.0.2`, `ios.buildNumber "3"`, `android.versionCode 3`.
- `package.json`: version `1.0.2`.
- Orchestration workflow: `project-manager` is now the mandatory entry point for every task (see CLAUDE.md).

## v1.0.1 — 2026-04-10

### Fixed
- **CRITICAL**: MaidScreen Rules of Hooks violation — hooks (`saveSalary`, `sortedSalary`, `presets`) were declared after an early return, causing crashes when toggling between monthly and daily views.
- Locale-dependent date formatting replaced with manual formatter using DAYS/MONTHS constants in TodayScreen and CookingScreen — ensures consistent output across devices with different locales.
- `saveEdit` in ExpensesScreen now validates amount (NaN, <= 0) and label before saving.
- `parseInt` in SettingsScreen now uses radix 10 and properly validates NaN.
- App no longer hangs forever if font loading fails — proceeds with system fonts via `fontError` handling in `useFonts`.
- Reminder and Maid delete buttons now meet the 44×44 touch target minimum.

### Added
- Gradient hero cards on RemindersScreen (purple), CycleScreen (pink), MaidScreen (green, both views), BackupScreen (gold warning), and SettingsScreen (gold appearance card).
- `ios.buildNumber` and `android.versionCode` bumped to 2.

### Performance
- `Toast` component wrapped in `React.memo`.
- `CustomDrawerContent` wrapped in `React.memo` and `drawerContent` prop stabilized as a module-level function (no new reference per render).
- Event handlers in ExpensesScreen (`handleExpDateChange`, `handleEditDateChange`, `pickReceipt`) wrapped in `useCallback`.

### Style
- Removed stray `borderWidth` leaks across `Pill`, `MonthBar`, `BottomTabs`, `CookingScreen`, `MaidScreen`, `TodayScreen` — now fully borderless per the luxury design system.
- `Pill` inactive state uses a filled `bg3` background instead of a 1.5px border.
- `ExpensesScreen` screen title corrected from 20px to 28px to match the design system.

### Chore
- Renamed `package.json` name from `homemanagerapp` to `forshe`.
- Expanded `.gitignore` with `.env`, `*.log`, `.vscode/`, `.idea/`, `.expo-shared/`, Firebase config files, and `credentials.json`.

## v1.0.0 — 2026-03-21

Initial release.

### Added
- 7 modules: Today dashboard, Expenses, Cooking, Maid, Reminders, Cycle Tracker, Backup.
- Hybrid drawer + 4-tab bottom bar navigation.
- Dark mode, PIN lock, onboarding, and splash screen.
- Recurring expenses, budget alerts, shopping list, monthly reports.
- First successful Android APK build: `1e9166de-ad86-47e0-8b24-1d94aee1706d`.
