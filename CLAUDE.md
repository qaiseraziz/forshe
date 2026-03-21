# ForSHE - Home Management App

## Overview
A React Native (Expo) home management app for tracking household expenses, cooking plans, maid tasks, reminders, and menstrual cycles. Built with TypeScript. Features a premium luxury design with gradient surfaces, hamburger drawer navigation, and a 4-tab bottom bar.

## Tech Stack
- **Framework**: Expo SDK 55 (React Native 0.83)
- **Language**: TypeScript
- **Navigation**: Hybrid — @react-navigation/drawer + @react-navigation/bottom-tabs (4 tabs + drawer)
- **State**: React Context (DataContext) + @react-native-async-storage via useStorage hook
- **Styling**: StyleSheet + expo-linear-gradient for gradient backgrounds
- **Fonts**: @expo-google-fonts — PlayfairDisplay-Bold, Outfit-Regular/SemiBold/Bold
- **Notifications**: expo-notifications (local reminders)
- **File I/O**: expo-file-system, expo-document-picker, expo-sharing, expo-clipboard
- **Security**: expo-secure-store (PIN storage), expo-local-authentication
- **Media**: expo-image-picker (receipt photos)
- **Haptics**: expo-haptics for tactile feedback
- **Date picker**: @react-native-community/datetimepicker
- **Build**: EAS Build (project ID: 51ca4967-73b1-4656-9b1b-045e2933a842, owner: smartbzss)

## Project Structure
```
src/
  components/
    ui/                  # Card, Button, Input, Badge, Toast, Divider, EmptyState, Pill, ProgressBar
    DayStrip.tsx         # Day selector strip
    MonthBar.tsx         # Month filter bar
    DrawerMenuButton.tsx # Hamburger menu button (opens drawer)
  constants/
    colors.ts    # Theme colors + gradients (light/dark)
    data.ts      # DAYS, MONTHS constants
    seedData.ts  # Default seed data from user's real data
  context/
    DataContext.tsx  # Central data provider (history, cooking, maid, etc.)
    ThemeContext.tsx # Light/dark theme
  navigation/
    BottomTabs.tsx  # 4-tab floating pill bar (Today, Expenses, Cooking, Remind)
    DrawerNav.tsx   # Drawer wrapping BottomTabs + extra screens
  screens/
    SplashScreen.tsx       # Animated splash with logo + slogan
    OnboardingScreen.tsx   # 5-slide first-launch walkthrough
    AppLockScreen.tsx      # 4-digit PIN lock screen
    TodayScreen.tsx        # Dashboard/home
    ExpensesScreen.tsx     # Finance tracking (topups + expenses + search)
    CookingScreen.tsx      # Meal planning
    MaidScreen.tsx         # Maid task & attendance
    RemindersScreen.tsx    # Reminders with notifications
    CycleScreen.tsx        # Period/cycle tracker
    MonthlyReportScreen.tsx  # Monthly spending report with charts
    ShoppingListScreen.tsx   # Grocery/shopping checklist with sharing
    BackupScreen.tsx         # Import/export data
    SettingsScreen.tsx       # Dark mode, PIN lock, recurring expenses, about
  hooks/
    useStorage.ts   # AsyncStorage hook with default values
  utils/
    backup.ts        # JSON/CSV export & import
    budgetAlerts.ts  # Push notifications at 80%/100% budget
    currency.ts      # PKR formatter
    dates.ts         # Date formatting utilities
    share.ts         # Share functionality
  types.ts       # TypeScript type definitions
assets/
  logo.png       # App logo (woman + heart + home icons)
```

## Navigation Architecture
- **Drawer** (top level): Home, Shopping List, Maid Tasks, Cycle Tracker, Monthly Report, Backup, Settings
- **Bottom Tabs** (inside Home): Today, Expenses, Cooking, Reminders
- **Hamburger button**: DrawerMenuButton component on every screen opens the drawer
- **App flow**: Splash → Onboarding (first time) → PIN Lock (if set) → Main App

## Design System
- **Premium/luxury aesthetic**: No visible borders, soft shadows, gradient surfaces
- **Gradient backgrounds**: Every screen wrapped in LinearGradient
- **Cards**: borderRadius 24, no borders, elevated shadows
- **Buttons**: Gradient backgrounds (gold/green/blue/red/pink variants)
- **Tab bar**: Floating pill style, frosted glass bg, rounded corners, 4 tabs only
- **Drawer**: Custom drawer with logo, slogan, active indicator
- **Typography**: Large hero numbers (42px), titles (28-30px), Outfit font family
- **Safe areas**: All screens use useSafeAreaInsets for status bar + nav buttons
- **Currency**: Pakistani Rupees (Rs)
- **Logo**: assets/logo.png used in splash, drawer header, app lock

## Features
1. **Expense Tracking**: Unified toggle form (received/spent), categories, search, monthly budget
2. **Quick Add Expense**: FAB on Today screen for instant expense logging
3. **Preset Templates**: One-tap expense presets (Milk, Bread, Bills, etc.)
4. **Receipt Photos**: Attach photos to expenses via expo-image-picker
5. **Recurring Expenses**: Auto-add rent, utilities on a set day each month (Settings)
6. **Budget Alerts**: Push notifications at 80% and 100% of monthly budget
7. **Shopping List**: Checkable grocery list with presets, sharing, clear-done
8. **Cooking Planner**: Weekly meal planning by day and meal type
9. **Maid Management**: Daily task lists, attendance tracking, salary tracker
10. **Reminders**: Push notifications at 24h and 12h before due
11. **Cycle Tracker**: Period logging with symptoms and flow
12. **Monthly Reports**: Category breakdown, daily spending chart, top expenses
13. **Expense Insights**: Month-over-month comparison, top category, avg daily spend
14. **Weekly Trend**: 7-day spending bar chart on Today dashboard
15. **Backup/Restore**: JSON export/import, CSV export (includes all new data)
16. **Settings**: Dark mode toggle, PIN lock, recurring expenses, about info
17. **Onboarding**: 5-slide walkthrough on first launch
18. **App Lock**: 4-digit PIN protection
19. **Splash Screen**: Animated logo with slogan "Your home, your way"

## Build Commands
```bash
# Development
npx expo start

# Type check
npx tsc --noEmit

# Build APK (preview)
eas build --profile preview --platform android --non-interactive

# Build production AAB
eas build --profile production --platform android
```

## Workflow Rules
- Update CLAUDE.md after every significant change
- Update agent files when relevant
- Route to ui-designer agent for visual/design changes
- All screens must use LinearGradient wrapper and safe area insets
- All screens must include DrawerMenuButton for hamburger access
- No visible borders — use shadows and filled backgrounds
- Test with `npx tsc --noEmit` before building APK
