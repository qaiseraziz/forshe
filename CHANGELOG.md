# Changelog

All notable changes to ForSHE will be documented in this file.

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
