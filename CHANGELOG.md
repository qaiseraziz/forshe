# Changelog

All notable changes to ForSHE will be documented in this file.

## v1.1.2 — 2026-04-10

Patch release — two UI tightening fixes on top of v1.1.1.

### Fixed
- **Drawer hamburger button now lives INSIDE the hero card** — on all 11 drawer screens (`TodayScreen`, `ExpensesScreen`, `CookingScreen`, `RemindersScreen`, `MaidScreen`, `CycleScreen`, `BodyStatsScreen`, `MonthlyReportScreen`, `ShoppingListScreen`, `BackupScreen`, `SettingsScreen`) the `DrawerMenuButton` is now the first child of a `heroHeaderRow` flex row inside the hero `<Card>`, left-aligned next to the hero label/title. The v1.1.1 standalone `topBar` row wrapper (which sat ABOVE the hero and added ~56px of empty space on every screen) is gone. All 11 screens remain pixel-identical to each other. Still 44×44 touch target, still `accessibilityLabel` + `hitSlop`.
- **Bottom tab bar no longer double-counts the safe-area inset** (`src/navigation/BottomTabs.tsx`) — the previous code set BOTH `paddingBottom: Math.max(insets.bottom, 12)` AND `marginBottom: insets.bottom`, effectively reserving the Android nav bar height twice and leaving a visible empty strip under the floating pill. Fixed to a single safe-area-aware `marginBottom: Math.max(insets.bottom, 8)` with NO interior `paddingBottom` override (the tab buttons' `paddingVertical: 10` handles internal spacing). The pill still floats above Android system gestures; touch targets still ≥44×44.

### Changed
- Every drawer screen style sheet replaces `topBar` + `topBarSpacer` with `heroHeaderRow` (`flexDirection: 'row'`, `alignItems: 'flex-start'`, `gap: 12`, `marginBottom: 4`) and `heroHeaderText` (`flex: 1`).
- CookingScreen, MaidScreen monthly + daily views: dropped topBar between ScrollView and MonthBar — MonthBar is now the first element under the status bar and owns its own padding.
- ExpensesScreen: removed the separate `topBar` row (and its `screenTitle` "Expenses" label — the hero's "Remaining Balance" label replaces it).
- ShoppingListScreen: removed the `topBar` row above the sticky title section; drawer button moved into the hero card inside the `FlatList` `ListHeaderComponent`.

### Chore
- `app.json` → version `1.1.2`, `ios.buildNumber` `"6"`, `android.versionCode` `6`.
- `package.json` → version `1.1.2`.
- `SettingsScreen` About card → `Version 1.1.2`.
- `DrawerNav` footer → `ForSHE v1.1.2`.
- `CLAUDE.md` workflow rules updated: the v1.1.1 `topBar` rule is replaced with the new v1.1.2 in-hero `heroHeaderRow` rule.
- `.claude/agents/ui-designer.md` + `.claude/agents/qa-expert.md` updated to match the new pattern.
- `CHANGELOG.md` updated with this entry.

## v1.1.1 — 2026-04-10

Patch release — Body Stats gains health insights + threshold alerts, negative balance now displays correctly, Expenses gains a collapsible budget card and a 15-item Pakistani quick-add rail, and the drawer hamburger button is now standardised on the LEFT of every screen.

### Added
- **Body Stats insights + alerts** (`BodyStatsScreen.tsx`) — new single `useMemo` computes 7-day and 30-day summary tiles (weight delta, avg BP, avg sugar, avg SpO2, avg HR) plus threshold-based health alerts. Alert rules: Systolic ≥140 or Diastolic ≥90 → "High blood pressure"; ≥180/≥120 → urgent red "Very high blood pressure"; <90/<60 → "Low blood pressure"; fasting sugar ≥126 / post-meal ≥200 / random ≥200 → "High blood sugar"; <70 → "Low blood sugar"; SpO2 <95 → "Low oxygen", <90 → urgent red "Very low oxygen"; resting HR <50 or >100 → "Abnormal heart rate"; BMI ≥30 → "BMI in obese range"; BMI <18.5 → "BMI in underweight range". Each alert card references the most recent triggering reading and date. Calm tone, includes "This is not medical advice" disclaimer at the bottom of the alerts block.
- **15 Pakistani household quick-add presets** on `ExpensesScreen` (`constants/data.ts` → `EXPENSE_PRESETS`) — Vegetables, Bread/Naan, Milk, Meat/Chicken, Fruits, Grocery, Petrol/Fuel, Rickshaw/Uber, Medicine, Mobile Top-up, Electricity Bill, Gas Bill, Water Bill, School Fees, Eating Out. Rendered as a horizontal rail above the Add expense form; each tile has an icon, label, optional default amount, 88×88 minimum touch target, and stable `applyPreset` handler wrapped in `useCallback` + haptic selection feedback.
- **Collapsible monthly budget card** on `ExpensesScreen` — tap the header to expand or collapse the budget input. Default state collapses when a budget is set, expands when no budget is set. Uses `LayoutAnimation.configureNext` (no new dependencies), haptic selection on toggle, proper `accessibilityState.expanded` reporting, chevron indicator (`▴`/`▾`).
- **"Over budget" badge** on Expenses balance hero — shown when balance goes negative OR when monthly spent exceeds monthly budget.
- Accessibility label and 8px hitSlop on `DrawerMenuButton`.

### Fixed
- **Negative balance display** — `pkr()` and `pkrF()` in `src/utils/currency.ts` no longer strip the minus sign; they now render `-Rs 1.2K` / `-Rs 1,200` when passed a negative number. `ExpensesScreen` balance hero, `TodayScreen` Balance stat box, `MonthlyReportScreen` Saved/Deficit tile, and the Expenses monthly summary `Deficit` tile now pass the raw (possibly negative) value to `pkrF` instead of wrapping it in `Math.abs()`, so overspending surfaces as a real red number across every screen that shows it.
- **Drawer hamburger button placement** — every one of the 11 drawer screens (`TodayScreen`, `ExpensesScreen`, `CookingScreen`, `RemindersScreen`, `MaidScreen`, `CycleScreen`, `BodyStatsScreen`, `MonthlyReportScreen`, `ShoppingListScreen`, `BackupScreen`, `SettingsScreen`) now renders the hamburger on the LEFT via a dedicated `topBar` flex row (`justifyContent: 'space-between'`, 44×44 drawer button, 44×44 right spacer). Hero labels / titles moved inline into the Hero Card body directly below the top bar. Pixel-identical positioning across the whole app.

### Changed
- `EXPENSE_PRESETS` shape now includes an `icon` field (typed inline in `constants/data.ts`). Previous 13 generic items replaced by the new 15-item Pakistani household list.
- `MaidScreen`, `CookingScreen`, `MonthlyReportScreen`, `BodyStatsScreen`, `BackupScreen`, `RemindersScreen`, `CycleScreen`, `TodayScreen`, `ShoppingListScreen`, `SettingsScreen` — removed the in-hero `heroTopRow` / `titleRow + section` wrapper around the drawer button, added a reusable `topBar` + `topBarSpacer` pair at the top of each ScrollView.

### Performance
- `applyPreset` (ExpensesScreen) — `useCallback`'d so the 15 preset tiles don't recreate handler closures every render.
- `toggleBudgetCollapsed` — `useCallback`'d with `LayoutAnimation.configureNext` for a single frame cost toggle.
- `insights` useMemo on BodyStatsScreen computes both windows and all alerts in a single pass, keyed only on `bodyLogs`, `bodyProfile.height`, and `hasHeight`.

### Style
- Over-budget badge: tinted red pill (`colors.redBg` + `colors.red` text), Outfit-Bold 12px, `⚠️ Over budget` copy.
- Body Stats alert cards: 18px radius, 14px padding, icon + bold coloured title, muted detail, muted-semibold "Most recent" reading line, urgent variant uses `redBg`/`red`, warn variant uses `goldBg`/`gold`.
- Insights tiles: 14px radius, flex-basis 48%, 2-col grid with 8px gap, icon+value+label stack, labels uppercased with 0.6 letter-spacing.
- Quick Add preset rail: 88×88 tiles, 24px icon, centered 12px label, 16px border radius, 10px gap, `colors.surfaceMuted` background.

### Chore
- `app.json` → version `1.1.1`, `ios.buildNumber` `"5"`, `android.versionCode` `5`.
- `package.json` → version `1.1.1`.
- `SettingsScreen` About card → `Version 1.1.1`.
- `DrawerNav` footer → `ForSHE v1.1.1`.
- `CHANGELOG.md` updated with this entry.
- `CLAUDE.md` updated — current version, drawer architecture note, utility + playbook refs.

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
