# ForSHE - Home Management App

## Overview
A React Native (Expo) home management app for tracking household expenses, cooking plans, maid tasks, reminders, and menstrual cycles. Built with TypeScript. Features a premium luxury design with gradient surfaces, hamburger drawer navigation, and a 4-tab bottom bar.

## Current Version
**v1.1.0** (tagged 2026-04-10) — see `CHANGELOG.md` for full history.
- `app.json`: version `1.1.0`, `ios.buildNumber "4"`, `android.versionCode 4`
- `package.json`: name `forshe`, version `1.1.0`
- Git tags: `v1.0.0` on 14a2dfe (first APK 2026-03-21), `v1.0.1` on cdf35a0, `v1.0.2`, `v1.1.0` on master
- Orchestration: every task routes through `project-manager` (see Agents section)

## Tech Stack
- **Framework**: Expo SDK 55 (React Native 0.83)
- **Language**: TypeScript
- **Navigation**: Hybrid — @react-navigation/drawer + @react-navigation/bottom-tabs (4 tabs + drawer)
- **State**: React Context (DataContext + ThemeContext) + @react-native-async-storage via useStorage hook
- **Styling**: StyleSheet + expo-linear-gradient for gradient backgrounds
- **Fonts**: @expo-google-fonts — PlayfairDisplay-Bold/ExtraBold, Outfit-Regular/SemiBold/Bold
- **Notifications**: expo-notifications (local reminders + budget alerts, typed triggers + cancellation)
- **File I/O**: expo-document-picker, expo-clipboard
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
  constants/
    colors.ts    # Theme colors + gradients (light/dark hero variants)
    data.ts      # DAYS, MONTHS, EXPENSE_PRESETS, SHOPPING_CATS, CAT_KEYS, STORAGE_KEYS
    seedData.ts  # Default seed data from user's real data
  context/
    DataContext.tsx  # Central data provider (history, cooking, maid, recurring, shopping, maidSalary, recurring auto-trigger)
    ThemeContext.tsx # Light/dark theme (useMemo on context value)
  navigation/
    BottomTabs.tsx  # 4-tab floating pill bar (React.memo, theme-aware colors)
    DrawerNav.tsx   # Drawer wrapping BottomTabs + extra screens
  screens/
    SplashScreen.tsx       # Full-screen branded splash (theme-aware)
    OnboardingScreen.tsx   # 5-slide first-launch walkthrough (theme-aware)
    AppLockScreen.tsx      # 4-digit PIN lock (theme-aware, brute-force protection, functional updater for failCount)
    TodayScreen.tsx        # Dashboard/home (Quick Add with category picker)
    ExpensesScreen.tsx     # Finance tracking (edit Modal, receipt thumbnails, memoized ListHeader)
    CookingScreen.tsx      # Meal planning (safe area on all views)
    MaidScreen.tsx         # Maid task & attendance (salary validation)
    RemindersScreen.tsx    # Reminders with typed triggers + notification cancellation on delete/done
    CycleScreen.tsx        # Period/cycle tracker (all handlers useCallback)
    BodyStatsScreen.tsx    # Body vitals tracker — weight, BP, sugar, oxygen, HR (feature-flagged, BMI, memoized LogRow)
    MonthlyReportScreen.tsx  # Monthly spending report with charts (handlers useCallback)
    ShoppingListScreen.tsx   # Grocery/shopping checklist (memoized ListHeader, imports ShoppingItem from types)
    BackupScreen.tsx         # Import/export data (schema validation, CSV escaping, handlers useCallback, summaryItems useMemo)
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
  types.ts       # TypeScript type definitions (Transaction, RecurringExpense, Reminder with notifIds, PeriodLog, ShoppingItem, BodyProfile, BodyLog, BodyStatsSettings, etc.)
assets/
  logo.png       # App logo (512x512, 393KB)
  splash.png     # Full-screen branded splash image (1024w, 3.2MB)
  icon.png       # App icon (512x512, 393KB)
  favicon.png    # Web favicon (48x48, 4KB)
  android-icon-foreground.png  # Android adaptive icon (432x432, 278KB)
```

## Navigation Architecture
- **Drawer** (top level): Home, Shopping List, Maid Tasks, Cycle Tracker, Body Stats, Monthly Report, Backup, Settings
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
- **Currency**: Pakistani Rupees (Rs)
- **Logo**: assets/logo.png used in splash, drawer header, app lock

## Features
1. **Expense Tracking**: Unified toggle form (received/spent), categories, search, monthly budget, NaN/negative validation
2. **Quick Add Expense**: FAB on Today screen with category picker for instant expense logging
3. **Preset Templates**: One-tap expense presets (Milk, Bread, Bills, etc.)
4. **Receipt Photos**: Attach photos to expenses — displayed as thumbnails in transaction list
5. **Recurring Expenses**: Auto-add on app open if today >= dayOfMonth and not yet added this month
6. **Budget Alerts**: Push notifications at 80%/100% — deduplicated per month via AsyncStorage keys
7. **Shopping List**: Checkable grocery list with presets, sharing, clear-done
8. **Cooking Planner**: Weekly meal planning by day and meal type
9. **Maid Management**: Daily task lists, attendance tracking, salary tracker (validates salary > 0)
10. **Reminders**: Push notifications with typed triggers (SchedulableTriggerInputTypes.DATE), cancelled on delete/done
11. **Cycle Tracker**: Period logging with symptoms and flow
12. **Monthly Reports**: Category breakdown, daily spending chart, top expenses
13. **Expense Insights**: Month-over-month comparison, top category, avg daily spend
14. **Weekly Trend**: 7-day spending bar chart on Today dashboard
15. **Backup/Restore**: JSON export/import with schema validation, CSV export with proper escaping, legacy format safety
16. **Settings**: Dark mode toggle, PIN lock, recurring expenses, about info
17. **Onboarding**: 5-slide walkthrough (theme-aware dark mode)
18. **App Lock**: 4-digit PIN with brute-force protection (5 attempts → 30s lockout, functional updater pattern)
19. **Splash Screen**: Full-screen branded image — theme-aware background
20. **Body Stats** (v1.1.0): Optional vitals tracker — weight, BP, blood sugar (fasting/post-meal/random), SpO2, heart rate, BMI calculation, daily reminder notification. Feature-flagged (off by default, enable in Settings). Height set once, logs kept forever. Backup/restore round-tripped. Drawer entry hidden nowhere — disabled state on screen routes user to Settings.

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
- **Dead deps removed**: expo-local-authentication, expo-file-system, expo-sharing, expo-status-bar
- **Latest successful APK build**: ef365c41-75c1-4f26-8429-de3a6def989b (v1.0.2, 2026-04-10)
- **Previous builds**: 92191648-529d-40c0-9be5-2b0d49743154 (v1.0.1, 2026-03-22), 1e9166de-ad86-47e0-8b24-1d94aee1706d (v1.0.0, 2026-03-21)

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

- **Android**: Actively built and tested (latest APK: 92191648-529d-40c0-9be5-2b0d49743154)
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
