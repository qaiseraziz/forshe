# Changelog

All notable changes to ForSHE will be documented in this file.

## v1.2.8 — 2026-04-20 "Cloud Backup"

Tagged release. Supabase-backed cloud backup now live.

### Added
- **Cloud backup via Supabase.** Optional "Cloud Backup" section on the Backup screen. Users sign in to their own Supabase account, then upload encrypted `.forshe` backups to a private storage bucket, list them, restore from them, or delete them. Every cloud upload is encrypted on-device with the user's chosen backup password BEFORE leaving the phone — Supabase only stores ciphertext. Cloud account password and backup password are intentionally separate (cloud = Supabase auth, backup = AES key for the file).
- `src/lib/supabase.ts` — singleton client using AsyncStorage for session persistence, `detectSessionInUrl: false` (mobile), `persistSession: true`, `autoRefreshToken: true`. Publishable key embedded in source (safe — new `sb_publishable_*` format, scoped by RLS policies).
- `src/utils/cloudBackup.ts` — four helpers: `uploadBackup`, `listBackups`, `downloadBackup`, `deleteBackup`. All scoped to `${userId}/` path prefix.
- `src/hooks/useCloudSession.ts` — subscribes to `supabase.auth.onAuthStateChange`; no polling (battery rule).
- `src/screens/CloudAuthScreen.tsx` — new drawer-registered route (deep-linked from Backup only, not in drawer groups — same pattern as `PrayerSettings`). Sign In / Sign Up toggle pill, 6-char min password, "Forgot password" row, email-confirmation fallback message.
- `src/screens/BackupScreen.tsx` — new Cloud Backup section with Upload / Restore / Manage cards and modal. Auth-gated; refreshes the cloud file list on focus via `useFocusEffect`, never on a timer.
- `src/navigation/DrawerNav.tsx` — `CloudAuth` registered as a `Drawer.Screen` (not listed in `DRAWER_GROUPS`).
- `supabase-setup.sql` at repo root — idempotent bucket + RLS policy script. Run once in the Supabase dashboard.

### Deps
- `@supabase/supabase-js` ^2.x — pure JS, NO native modules. `expo-doctor` confirmed no new native init surface.

### Chore
- `src/utils/backup.ts` — promoted `encryptData`, `decryptData`, `isEncrypted`, `buildBackupJSON`, `validateBackupData`, and the `AllData` interface to exports so cloud upload / restore can reuse the same encryption + schema validation path as local backups. No behaviour change to existing local backup flows.
- `src/navigation/BottomTabs.tsx` — removed unused `Platform` import and unused `dark` destructure (pre-existing lint debt surfaced while running `tsc --noUnusedLocals --noUnusedParameters`).

### Manual Supabase setup (one-time, user)
1. Run `supabase-setup.sql` in Dashboard → SQL Editor (creates `backups` bucket + 4 RLS policies).
2. Dashboard → Authentication → Providers → Email → toggle **Confirm email** OFF (smoother first-run).
3. Open the app → Backup → Cloud Backup → Sign in → Sign Up → test upload + restore + delete.

## v1.2.7 — 2026-04-20 "Launch-Crash Root-Cause Fix"

Third hotfix after v1.2.4. Root cause finally identified + resolved.

### Fixed
- **App launches reliably.** Actual root cause of the v1.2.4 / v1.2.5 / v1.2.6 launch crashes: **`moti@0.30.0` is incompatible with `react-native-reanimated@4.2.1`**. Moti 0.30 was tested against reanimated 3.11 (see its package.json devDependency) — it calls reanimated-3 internals that don't exist in v4's new Worklets architecture. Importing `MotiView` crashed the JS bridge at module init before anything rendered. Both call sites (`MotiEnter` wrapper and `Toast` redesign) now render inside plain `View` — no animation, no crash. `moti` stays in `package.json` for a future upgrade to a reanimated-4-compatible Moti release.
- BlurView (v1.2.5), LottieView (v1.2.5), Phosphor icons + react-native-svg (v1.2.6) were red herrings I chased while bisecting the crash. Those stay in their disabled-at-call-site state.

### Chore
- `app.json` → version `1.2.7`, `ios.buildNumber "14"`, `android.versionCode 14`.
- `package.json` → version `1.2.7`.
- `SettingsScreen` About → `Version 1.2.7`; `DrawerNav` footer → `ForSHE v1.2.7`.
- Lesson documented in `rn-performance-expert.md` + `eas-release-expert.md`: when adding a JS-only animation library, verify its `react-native-reanimated` peer version matches the installed major.

### APK
- Build ID: `519dc1ff-4a36-4756-a78c-8194f49fb942` · https://expo.dev/accounts/smartbzss/projects/forshe/builds/519dc1ff-4a36-4756-a78c-8194f49fb942
- Superseded broken APKs: `d718bd8a` (v1.2.4), `ed6cce5f` (v1.2.5), `36423651`/`7GB6CZXguVbLXPDgLS7XJf` (v1.2.6) — ALL crash on launch. Do not distribute.
- Last confirmed-working prior APK: `2218683b` (v1.2.3, https://expo.dev/artifacts/eas/5dceXqTVYSAxAvVjmx5Eo5.apk).

## v1.2.5 — 2026-04-19 "Launch-Crash Hotfix"

Emergency patch on top of v1.2.4. The v1.2.4 APK crashed on launch on some devices — suspected native-module init failure for `expo-blur` and/or `lottie-react-native`.

### Fixed
- **App launches reliably again.** `BlurView` usage removed from bottom tab bar, QuickAdd sheet, Expenses edit modal, and PrayerSettings manual-location modal; each now uses a solid theme-coloured background with a darker scrim (`rgba(0,0,0,0.45)`) so modals still feel deep. `LottieBox` replaced with a pure-emoji fallback — every Lottie slot in the app (SplashScreen, celebrations, tasbeeh, biometric pulse, etc.) now renders the provided `fallbackEmoji` in the same footprint. The `expo-blur` and `lottie-react-native` packages remain in `package.json` so future builds can re-enable them once on-device native init is verified — no dependency churn.

### Kept (no regression)
- Swipeable list rows (Expenses, Reminders, Vendors, Inventory, Shopping, Savings Goals) — pure JS via `react-native-gesture-handler`.
- Skeleton loaders while AsyncStorage hydrates — pure JS.
- Time-aware hero gradient (morning / afternoon / evening / night) — static lookup, no animation.
- Redesigned floating-pill Toast — pure JS via existing `moti`.
- Phosphor icons in chrome — pure JS tree-shake.
- Moti entrance animations on hero + block grid — reanimated UI-thread only.
- Micro-copy pass, form keyboard flow, perf audit fixes.

### Chore
- `app.json` → version `1.2.5`, `ios.buildNumber` `"12"`, `android.versionCode` `12`.
- `package.json` → version `1.2.5`.
- `SettingsScreen` About → `Version 1.2.5`; `DrawerNav` footer → `ForSHE v1.2.5`.
- Added qa-expert rule: before re-enabling `BlurView` or `LottieView`, verify on-device native init on a real Android device (ideally a low-RAM Tecno/Vivo that matches wife's phone class).

### APK
- Build ID: `ed6cce5f-5f15-49f3-8971-7aaa603c0bb6` · https://expo.dev/accounts/smartbzss/projects/forshe/builds/ed6cce5f-5f15-49f3-8971-7aaa603c0bb6
- Previous (crashed on launch): `d718bd8a-ab12-4135-af31-f028aa200103` (v1.2.4)

## v1.2.4 — 2026-04-19 "Design Polish + Battery Audit"

Tagged release bundling the v1.2.4-dev + v1.2.5-dev work: four new visual-polish libraries (frosted glass, one-shot Lotties, Phosphor icons, Moti entrances), swipeable list rows across six screens, battery-first Skeleton loaders, floating-pill Toast redesign, time-aware hero gradient, micro-copy pass, form keyboard flow, plus a full performance/battery audit with the PrayerTimesScreen countdown-leak fix.

### APK

- Preview APK queued 2026-04-19 — build id `d718bd8a-ab12-4135-af31-f028aa200103` (https://expo.dev/accounts/smartbzss/projects/forshe/builds/d718bd8a-ab12-4135-af31-f028aa200103). Artifact URL visible after build finishes.

### Added

- **Four new libraries** — `expo-blur` ~15.0.8, `lottie-react-native` 7.3.5, `phosphor-react-native` 2.3.1, `moti` 0.30.0. No new native modules introduced beyond the ones already required by the existing stack (phosphor-react-native depends on react-native-svg which was already a transitive dep of gifted-charts; moti builds on reanimated 4.2.1 we already ship).
- **`src/components/ui/LottieBox.tsx`** — a safety-railed wrapper around `lottie-react-native`. Hard-codes `loop={false}` (cannot be overridden). Falls back to an emoji if the JSON asset is missing. Accepts a `LottieKey` enum so only approved animations ship. Centralises the audit surface — screens never import `LottieView` directly.
- **`src/components/ui/MotiEnter.tsx`** — one-shot `fade + translateY` entrance wrapper around Moti. No `loop`/`repeat` props exposed. Accepts a `delay` for staggering children by ~30ms.
- **`src/components/ui/ChromeIcon.tsx`** — named Phosphor icon exports (`House`, `CurrencyCircleDollar`, `ForkKnife`, `Bell`, `List`) at `regular` weight. Screens never import `phosphor-react-native` directly — they go through this file, which guarantees one weight across the app and keeps the bundle tree-shaken to only the icons we use (~20KB total despite phosphor's 55MB on-disk source).
- **`assets/lottie/` directory** with three hand-authored bodymovin v5.7.4 JSONs (commercial-use safe, MIT): `celebrate.json` (1.8KB, 2.0s, 6-confetti burst for savings goal 100%), `pulse.json` (1.3KB, 1.6s, gold ring pulse for biometric unlock), `sparkle.json` (1.2KB, 1.5s, rotating star for recipe "Cook this"). Three more slots documented for drop-in Lottiefiles.com replacements: `splash-intro`, `empty-inbox`, `tasbeeh` — until those JSONs drop, LottieBox falls back to our hand-authored sparkle/celebrate so the animation slot is never empty. Full sourcing instructions in `assets/lottie/README.md`.
- **SavingsGoals 100% celebration overlay** (`src/screens/SavingsGoalsScreen.tsx`) — when a contribution pushes a goal to 100%, the `celebrate` Lottie plays once at the screen center via a z-index-500 absolute overlay. `onAnimationFinish` auto-dismisses — no lingering render, no manual timer.
- **RecipeBookScreen "Cook this" sparkle** (`src/screens/RecipeBookScreen.tsx`) — tapping the "🍽️ Cook" button on a recipe fires the `sparkle` Lottie as a one-shot overlay while the meal is logged and inventory deducted. Dismisses on animation finish.
- **BiometricLockScreen pulse animation** (`src/screens/BiometricLockScreen.tsx`) — while the native biometric sheet is prompting, a one-shot `pulse` Lottie replaces the static 🔒 emoji. Reverts to the emoji if the user cancels or the device lacks biometrics.
- **PrayerTimesScreen tasbeeh** (`src/screens/PrayerTimesScreen.tsx`) — when today is a Sunnah fasting weekday (Mon/Thu), the `tasbeeh` Lottie plays once alongside the fasting status line. Re-renders from the 30s countdown tick don't re-trigger the animation because Lottie fires on mount.
- **SplashScreen Lottie intro** (`src/screens/SplashScreen.tsx`) — the existing fade+scale on the branded splash image is preserved; a `splash-intro` Lottie layers in the lower third for a premium entrance. Kept well inside the 2500ms splash dismissal window.
- **EmptyState animation slot** (`src/components/ui/EmptyState.tsx`) — accepts an optional `animation?: LottieKey` prop; when provided, the icon circle renders a LottieBox instead of the emoji. Falls back to emoji when absent, so existing call sites work unchanged.
- **Color refinements** (`src/constants/colors.ts`) — two new named colors per theme: `bg2Elevated` (elevated surface variant for raised cards / frosted chrome), `goldBorderActive` (subtle gradient-border tint for active nav items); plus `tabBarBlurTint` used as a theme-aware scrim layer underneath the BlurView in the bottom tab bar so the pill reads on busy backgrounds. No palette rewrite — existing colors are unchanged.
- **Swipeable list rows** (`src/components/ui/SwipeableRow.tsx`) — new wrapper around `react-native-gesture-handler/Swipeable` (already a peer dep of `@react-navigation/drawer` — no new deps added). Left-swipe reveals Edit/Delete/Done/Call actions with 44×44 touch targets, one `Haptics.impactAsync(Light)` per trigger, and automatic row close after the callback fires. Applied to the flat list rows on: `ExpensesScreen` (Edit + Delete), `RemindersScreen` (Done + Delete), `VendorsScreen` (Call + Delete), `InventoryScreen` (Edit + Delete), `ShoppingListScreen` active-session item rows (Delete only), `SavingsGoalsScreen` (Edit + Delete). NOT applied to grid tiles, drawer items, or single-row headers. Every destructive swipe still fires the existing undo Toast (v1.1.3 rule).
- **Skeleton loaders** (`src/components/ui/Skeleton.tsx` + `SkeletonCardRow` + `SkeletonChart`) — battery-first static placeholder. No shimmer / no repeat / no animation loop by default. A dim-gray rounded block reads clearly as "loading" while AsyncStorage warms up (typically <400ms). Gated behind `allLoaded` from `DataContext`. Applied to: `ExpensesScreen` (5 rows), `RemindersScreen` (3 rows), `VendorsScreen` (4 rows), `InventoryScreen` (4 rows), `RecipeBookScreen` (3 rows), `InsightsScreen` (2 charts), `TodayScreen` (hero numbers + 4 block rows).
- **Time-aware hero gradient** on `TodayScreen` — `src/constants/colors.ts` now exports `heroMorning/Afternoon/Evening/Night` + dark-mode counterparts, plus a `heroGradientForHour(hour, dark)` picker. TodayScreen's greeting hero picks the pair via a `useMemo` keyed on `currentHour` (a primitive captured once per mount — never keyed on `new Date()` directly). Static — zero animation, zero runtime cost. Morning 5–10 = warm gold-ivory, Afternoon 11–16 = default, Evening 17–20 = warmer peach, Night 21–4 = cool lavender.
- **Floating-pill Toast redesign** (`src/components/ui/Toast.tsx`) — now a floating pill: `colors.bg2` background, 18px radius, shadow, auto-width. Icon on the left inside a tinted circle (green ✓ / red ✕ / gold ⓘ — accept optional `icon` prop via `show(msg, undoFn, icon)`). Slide + fade entrance via Moti one-shot spring (damping 18, stiffness 220). Stacks gracefully — a new toast dismisses the previous one before mounting (20ms gap) so animations don't overlap. Auto-dismisses at 4s with Undo / 2.5s without. Floats above bottom tab bar at `bottom = max(insets.bottom, 8) + 90`. **API compatibility preserved** — existing `showToast(msg, undoFn)` still works; all 33+ callsites across the app are unchanged.
- **Micro-copy pass** across empty-state and placeholder text. Examples: Shopping "No shopping lists yet. Tap above to create one!" → "Nothing on your list yet — tap + to start."; Expenses "No transactions found." → "No expenses logged yet. Your balance is your own."; Reminders "No reminders yet. Add one above to get started!" → "All caught up for now ✨"; Recipes "No recipes yet." → "Let's cook something. Tap + to save your first recipe."; Inventory "No items tracked yet." → "Your pantry is empty. Add items to track what you have."; Savings "No savings goals yet." → "Dream big. Tap + to start your first savings goal."; Vendors "No vendors yet." → "Add your trusted service providers so they're one tap away."; BodyStats "No logs yet." → "Log your first measurement to see insights over time."; TodayScreen "No tasks, meals, or reminders for today. Enjoy your day!" → "All caught up for today. Enjoy yourself."; Insights "No expense data to analyse yet." → "No expense data yet — log a few and your trends will appear here."
- **Form keyboard flow** — every multi-field Add/Edit modal now auto-focuses the first field, passes `returnKeyType="next"` on intermediate fields with `blurOnSubmit={false}` + `onSubmitEditing` → next ref, and `returnKeyType="done"` + primary submit on the last field. Applied to: Expenses edit modal (2 fields), Reminders add form with bill/medication branches (title → amount → done, or title → dosage → duration → done, or title → done), Vendors add/edit (name → phone → altPhone → address → notes → save), Inventory add/edit (name → qty → unit → threshold → notes → save), Recipes edit (name → servings → prep → cook → notes → ingredient name/qty/unit → add), Savings Goals (name → target → saved → notes → save), PrayerSettings manual-city (city → lat → lng → save). `Input` component now `forwardRef`s to the underlying `TextInput`; still `React.memo`-wrapped. New `src/utils/formRefs.ts` utility (`useFormRefs`) documented but not required — refs are currently wired directly for explicitness.

### Changed

- **Bottom tab bar is now frosted glass** (`src/navigation/BottomTabs.tsx`) — the solid `tabBarBg` fill is replaced with a `<BlurView intensity={40} tint="light|dark">` occupying `StyleSheet.absoluteFill`, topped by a theme-aware `tabBarBlurTint` scrim for contrast. The pill's `borderRadius: 28` + `overflow: 'hidden'` clips the blur to shape. Chrome icons swapped from emoji to Phosphor (`House`, `CurrencyCircleDollar`, `ForkKnife`, `Bell`) at regular weight. Active tab now also gets a 1px `goldBorderActive` border on top of the existing gold pill background — the invisible-border default prevents layout shift when focused.
- **Hamburger button is now Phosphor `List`** (`src/components/DrawerMenuButton.tsx`) — the `☰` text glyph is replaced with the `List` Phosphor icon at bold weight. Button footprint (44×44 + `accessibilityLabel` + `hitSlop`) is unchanged.
- **Modal backdrops are now frosted** (3 spots — `src/components/QuickAddFAB.tsx`, `src/screens/ExpensesScreen.tsx`, `src/screens/PrayerSettingsScreen.tsx`) — each `rgba(0,0,0,0.4)` or `rgba(0,0,0,0.5)` backdrop is now `<BlurView intensity={20} tint="dark">` with a thin `rgba(0,0,0,0.18)` (or 0.22) tint on top for tap-capture. Gives a premium "depth" feel without touching scrolling surfaces.
- **TodayScreen hero + block grid get Moti entrance animations** (`src/screens/TodayScreen.tsx`) — the hero card fades + slides up on mount (240ms timing); each of the 6 group blocks staggers 30ms behind the previous. Wrapped via the new `MotiEnter` component — no `repeat` / `loop` possible.
- **EmptyState can now render an animation instead of a static emoji** — backward-compatible (`animation` prop is optional). See Added entry above.
- **`Input` component now forwards refs** — required by the form keyboard flow. Memoization preserved. Existing callers that don't pass `ref` work unchanged.
- **Toast internals** — `show()` signature gains an optional third `icon` parameter (default `'success'`). All existing two-arg callers continue to work and get the default green check.

### Performance

- **PrayerTimesScreen countdown now pauses on blur** (`src/screens/PrayerTimesScreen.tsx`) — the 30s tick `setInterval` was previously registered in `useEffect(() => ..., [])` and ran forever after mount, firing even when the user was on a different tab/drawer screen. Switched to `useFocusEffect(useCallback(...))` from `@react-navigation/native`. On focus we trigger an immediate `setTick(t => t + 1)` to re-compute `now`, then start the interval; on blur the return function clears it. Net effect: zero CPU / timer callbacks when the screen is hidden. This was the single largest battery leak in the audit.
- **Location audit** — `expo-location` usage verified: only `getCurrentPositionAsync` is called, never `watchPositionAsync`; `accuracy: Location.Accuracy.Balanced` is used (not `High`); the returned coordinates are persisted in `prayerSettings.location` and never re-fetched automatically. No changes required.
- **Notification scheduling caps verified** — `schedulePrayerNotifications` scales at most 5 prayers × 7 days = 35 notifications; `scheduleFastingNotifications` scales at most 28 days scanned × Mon/Thu = 8 fasting + 2 Ayyam al-Bid = 10 notifications. Both cancel their previous IDs before re-scheduling. Budget-alert dedup key in AsyncStorage prevents duplicate 80/100% alerts within a month. Body-stats daily reminder uses a single `DAILY` trigger. No notification-pile issue found.
- **Animation loop audit** — grep for `setInterval`, `Animated.loop`, `requestAnimationFrame`, `repeat: Infinity` across `src/`: only two `setInterval` call sites exist. (1) `AppLockScreen.tsx` countdown during 30s PIN lockout — self-clearing, only runs during lockout, safe. (2) `PrayerTimesScreen.tsx` 30s tick — now focus-gated (see above). No `Animated.loop`, no `requestAnimationFrame`, no `repeat: Infinity` anywhere. Moti usages are all one-shot via `MotiEnter`. LottieBox hard-codes `loop={false}`. SwipeableRow uses gesture-handler's built-in spring (one-shot per gesture). Toast uses a single Moti spring on mount. Skeleton uses no animation at all.
- **Re-render audit** — `DataContext` value wraps `useMemo` with complete deps. `ThemeContext` + `CurrencyContext` same. All UI kit components (`Card`, `Button`, `Pill`, `Toast`, `Badge`, `Divider`, `EmptyState`, `Input`, `ProgressBar`, `DayStrip`, `MonthBar`, `DrawerMenuButton`, `CustomTabBar`, `CustomDrawerContent`, `QuickAddFAB`, `LottieBox`, `MotiEnter`, `Skeleton`, `SwipeableRow`) are `React.memo`. FlatList screens (ExpensesScreen, ShoppingListScreen) use memoized `renderItem` with stable keys + `maxToRenderPerBatch` / `windowSize` / `removeClippedSubviews`. Static filter arrays are module-level constants. Drawer content ref is extracted as a module-level constant. No re-mount issues found.
- **Storage-write audit** — `useStorage` persists on every `set()` call. Form drafts (inventory quantity editors, recipe ingredient fields, expense edit modal, add-reminder inputs) uniformly use local `useState` for in-flight values and only call the storage setter on the Save/Done action, NOT on every keystroke. Spot-checked `InventoryScreen`, `RecipeBookScreen`, `ExpensesScreen` edit modal, `RemindersScreen` — all clean.
- **Bundle-size audit** — new libs on disk: `phosphor-react-native` 55MB (all icon SVGs; Metro tree-shakes to the 5 icons we import ≈ 20KB bundled), `moti` 11MB (pure JS, no native), `lottie-react-native` 506KB (native module), `expo-blur` 214KB (native module). No `@shopify/react-native-skia` transitive dep (confirmed via `npm ls`) — avoided the ~10MB native. Top-5 heaviest deps by on-disk size: `expo` (18MB), `moti` (11MB), `react-native-reanimated` (8MB), `react-native-svg` (7MB), `react-native-screens` (5MB).
- **Asset audit** — `splash.png` is still 3.2MB (was already flagged in v1.1.2). No compression was done in this pass because it requires an external imaging tool and we want to keep brand quality intact. Follow-up: compress before the next tagged release, target &lt;500KB via mozjpeg/pngquant. Other assets are already fine: `logo.png` 393KB, `icon.png` 393KB, `android-icon-foreground.png` 278KB.
- **AsyncStorage compaction (proposal, NOT implemented)** — history / bodyLogs / attendance are stored as full arrays and grow unbounded. After 24+ months of daily use, reads on startup will become expensive. Proposed strategy (backlog): keep the last 24 months under the existing keys; anything older gets aggregated into monthly summaries under `hm_history_archive_YYYY_MM` (totals per category, count, list of top-5 transactions only). Trigger compaction on app open when `history.length > 2000`. Requires a schema bump + migration. Do NOT ship without user opt-in prompt and a "restore raw history" path via backup JSON.
- **Skeleton battery win** — the pattern deliberately uses a static placeholder instead of a shimmering one. Shimmer loops repaint 60× per second for the duration they're visible; a static block costs nothing. Since AsyncStorage loads in <400ms typically, the user never sees a loop either way — the difference is purely battery. If shimmer is ever needed, `Skeleton`'s API already reserves space for it via a future `animated` prop.
- **No new deps for v1.2.5-dev additions.** `react-native-gesture-handler` 2.30.0 was already installed (peer of `@react-navigation/drawer`) and `GestureHandlerRootView` already wraps App in `App.tsx`. `moti` 0.30.0 came in with v1.2.4-dev. Skeleton is pure `View` + `StyleSheet`.

### Chore

- Package.json: `expo-blur` / `lottie-react-native` / `phosphor-react-native` / `moti` added in v1.2.4-dev. New files from v1.2.5-dev: `src/components/ui/Skeleton.tsx`, `src/components/ui/SwipeableRow.tsx`, `src/utils/formRefs.ts`. `src/components/ui/Toast.tsx` rewritten (API-compatible). `src/components/ui/Input.tsx` updated to forwardRef. `src/constants/colors.ts` gains 8 time-aware gradient entries + `heroGradientForHour`. Screens touched: ExpensesScreen, RemindersScreen, VendorsScreen, InventoryScreen, ShoppingListScreen, SavingsGoalsScreen, RecipeBookScreen, InsightsScreen, TodayScreen, PrayerSettingsScreen, PrayerTimesScreen, BiometricLockScreen, BodyStatsScreen. `npx tsc --noEmit` + `--strict` + `--noUnusedLocals --noUnusedParameters` all exit 0.
- `app.json` version bumped to `1.2.4`, `ios.buildNumber "11"`, `android.versionCode 11`. `package.json` version bumped to `1.2.4`. Drawer footer + SettingsScreen About now display `v1.2.4`.
- Previous released tag: `v1.2.3` on master.

## v1.2.3 — 2026-04-19 "Inline-Expand Home + Spiritual Group"

Patch release on top of v1.2.2. Two connected UX fixes addressing user feedback that the v1.2.2 block grid was "complex and not flexible" because each block jumped to a default screen, hiding the rest of the group's sub-modules behind the drawer. Also carves a dedicated 🕌 Spiritual drawer group out of Personal so Islamic features have a home to grow into.

### APK

- Build ID: `2218683b-51d8-4db2-9f49-9a3d559a8068` (queued 2026-04-19, preview profile, Android)
- Build page: https://expo.dev/accounts/smartbzss/projects/forshe/builds/2218683b-51d8-4db2-9f49-9a3d559a8068

### Added

- _(none — this release is purely UX polish on existing modules)_

### Changed

- **TodayScreen home blocks are now an inline-expand accordion** (`src/screens/TodayScreen.tsx`) — the v1.2.2 "tap block = jump to default screen" behavior is removed. Tapping a block now expands it in place to reveal the group's sub-modules as a 2-column mini-tile grid INSIDE the block. Single-open accordion: tapping a different block collapses the previous one; tapping the same block again collapses it. Animation via `LayoutAnimation.Presets.easeInEaseOut` + `Haptics.selectionAsync()` — no new deps. Block header renders emoji + name + chevron (`▸` collapsed, `▾` expanded) + badge row. Sub-module tiles navigate to the specific screen (`navigation.navigate('Home', { screen })` for bottom-tab targets, plain `navigation.navigate()` otherwise). The v1.2.2 2×2 grid with `aspectRatio: 1/0.9` + `width: '47%'` is superseded — blocks are now full-width stacked cards. Sub-module tile backgrounds use `rgba(255,255,255,0.55)` light / `rgba(255,255,255,0.06)` dark so the parent block's gradient still reads through. `accessibilityState={{ expanded }}` + `accessibilityLabel` = `` `${expanded ? 'Collapse' : 'Expand'} ${block.name} group` `` on every header for screen readers.
- **Drawer now has 6 groups** (`src/navigation/DrawerNav.tsx`) — new 🕌 **Spiritual** group inserted between Personal and System with a single item (Prayer Times). `DRAWER_GROUPS.length` goes from 5 → 6. Order: Money, Kitchen, Household, Personal, Spiritual, System. Personal is back to its pre-v1.2.2 shape with only Cycle Tracker + Body Stats (wellness-only). PrayerSettings stays registered as a deep-link-only `Drawer.Screen` and is NOT listed inside any group (same pattern as v1.2.2).
- **TodayScreen Personal block reverts to wellness-only badge logic** — prayer-aware copy moved to the Spiritual block. Personal badge = `loggedToday ? 'logged today' (green) : 'no log today' (muted)`. `prayerSettings.enabled` no longer influences the Personal block's target or badge.
- **TodayScreen Spiritual block** — new block, 5th in the stack. Reuses the `greenHero` / `greenHeroDark` gradient (designer chose to reuse rather than introduce a new `spiritualHero` pair; rationale is the palette stays tight, and Kitchen/Spiritual are 3 blocks apart so never visually adjacent). Badge logic: `!prayerSettings.enabled` → `"Setup"` (gold); today is Mon/Thu or 13/14/15 Hijri → `"Sunnah day 🌙"` (gold); location set + times computable → `"{PrayerName} {h:MM AM/PM}"` (muted); fallback → `"Setup"`. When Spiritual grows to 3+ items, revisit the shared gradient and consider adding `spiritualHero` (`['#e8f5e9','#c8e6c9']` light / `['#0a1a12','#050d08']` dark).

### Fixed

- _(none — behavior change rolled into Changed above)_

### Chore

- Bumped `app.json` version `1.2.2` → `1.2.3`; `ios.buildNumber` `"9"` → `"10"`; `android.versionCode` `9` → `10`. Bumped `package.json` version `1.2.2` → `1.2.3`. Updated `SettingsScreen` About copy + `DrawerNav` footer to `v1.2.3`.
- `npx tsc --noEmit` and `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` both exit 0 at release.
- No new npm packages.
- Documentation updated: `CLAUDE.md` (Navigation Architecture → 6 groups; new workflow rules for the accordion pattern, the Spiritual group, and the Personal wellness-only badge), `.claude/agents/ui-designer.md` (canonical JSX for the inline-expand block), `.claude/agents/qa-expert.md` (6-group assertions, Spiritual count = 1, Personal count = 2, `expandedGroup` state shape).
- Tagged `v1.2.3` on `master`; APK queued on EAS preview profile.

## v1.2.2 — 2026-04-19 "Block Grid Home + Prayer Times"

Patch release on top of v1.2.1. Two connected UX additions: TodayScreen's stacked group tiles become a real 2-column block grid with themed gradients, and a brand-new Prayer Times + Sunnah Fasting module ships inside the 💝 Personal group.

### APK

- Build ID: `8e74a970-8e4d-4bbb-a0c5-402dee135cc4` (queued 2026-04-19, preview profile, Android)
- Build page: https://expo.dev/accounts/smartbzss/projects/forshe/builds/8e74a970-8e4d-4bbb-a0c5-402dee135cc4

### Added

- **PrayerTimesScreen** (`src/screens/PrayerTimesScreen.tsx`) — new drawer screen inside the 💝 Personal group (1st item, before Cycle Tracker + Body Stats). Hero card with `heroHeaderRow` + 🕌 Prayer Times label + location name + Hijri date. "Next prayer" card (name + formatted time + minutes-until countdown, ticks every 30s). Today's 6 times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) with the next one highlighted in gold. Sunnah fasting status card: "✨ Sunnah fasting day (Monday/Thursday)" on Mon/Thu; "🌙 Ayyam al-Bid — day X of 3" on 13/14/15 Hijri; else a neutral line with upcoming-reminder hint. Settings gear in the hero row and an outline button below the list both navigate to `PrayerSettings`. No-location state: shows an `EmptyState` with a single "Set Up Prayer Times" button.
- **PrayerSettingsScreen** (`src/screens/PrayerSettingsScreen.tsx`) — drawer-level route accessed from the Prayer Times hero or from `SettingsScreen`. Sections: Master toggle, Location (Use GPS + Enter Manually buttons), Calculation Method (Picker, 12 options), Asr Juristic Method (segmented Standard/Hanafi), High Latitude Rule (Picker, 3 options), 5 per-prayer notification switches, 2 Sunnah fasting switches (Monday/Thursday + Ayyam al-Bid). "Save & Schedule Reminders" green button at the bottom cancels previous notification IDs and reschedules both prayer + fasting notifs, then stores the new IDs back into `prayerSettings`. Manual location modal is a bottom-sheet with an 8-city Pakistani chip grid (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Quetta, Multan) plus free-form name/lat/lng inputs.
- **`src/utils/prayer.ts`** — adhan wrapper. `computePrayerTimes(date, settings)`, `getNextPrayer(times, now?)`, `formatPrayerTime(date)`, `formatCountdown(minutes)`, `hijriToday(date?)` (Intl `en-u-ca-islamic-umalqura` with arithmetic fallback), `isSunnahWeekday(date?)`, `isAyyamAlBid(date?)`, `schedulePrayerNotifications(settings)`, `scheduleFastingNotifications(settings)`. Exports `METHOD_OPTIONS`, `HIGH_LAT_OPTIONS`, `ASR_OPTIONS`, `PAKISTAN_CITIES`. All scheduling cancels previous IDs first, gracefully returns `[]` when disabled or permission is denied, and uses typed `SchedulableTriggerInputTypes.DATE`.
- **TodayScreen onboarding nudge** — while `prayerSettings.enabled === false`, a green-gradient card below the block grid invites the user to set up Prayer Times and navigates to `PrayerSettings` on tap.
- **SettingsScreen row** — new "Prayer Times" card under App Lock shows a one-line summary (location + method when enabled, setup CTA otherwise) and navigates into `PrayerSettings`.
- **npm packages** — `adhan` `^4.4.3` (pure JS, MIT, Batoul Apps) + `expo-location` `~55.1.8` (SDK 55 compatible, installed via `npx expo install`). No native module dependencies.
- **app.json plugin** — added `expo-location` plugin block with `locationWhenInUsePermission` + `locationAlwaysAndWhenInUsePermission` strings; iOS `NSLocationWhenInUseUsageDescription` under `ios.infoPlist`; Android `ACCESS_COARSE_LOCATION` + `ACCESS_FINE_LOCATION` permissions.

### Changed

- **TodayScreen block grid** (`src/screens/TodayScreen.tsx`) — the vertical "long strips" tile list from v1.2.1-dev is replaced by a proper 2-column block grid. Money / Kitchen / Household / Personal render as 2×2 square-ish blocks (`aspectRatio: 1 / 0.9`) with themed soft gradient backgrounds (Money→`goldHero`, Kitchen→`greenHero`, Household→blue-ish custom pair, Personal→`pinkHero`) and dark-mode variants. Top-right shows the large group emoji (fontSize 32); bottom-left shows the group name (Outfit-Bold 18) + status badge pill. System gets its own full-width compact tile at the bottom of the grid (narrower paddingVertical since users rarely visit it). Uses `flex-wrap` + `width: '47%'` + `gap: 12` — no FlatList since only 4 items in the main grid. `activeOpacity={0.8}` for tactile press feedback. Personal target is dynamic: `PrayerTimes` when enabled, else `BodyStats`. Personal badge is prayer-aware: "Sunnah day 🌙" on Mon/Thu/13-14-15 Hijri, else "{next prayer} {HH:MM AM/PM}", falling back to "logged today" / "no log today" / "Setup Prayer Times" when prayer is off. Hero card (greeting + balance + today's spend) unchanged. "Today's Essentials" (due-soon / meals / maid) unchanged.
- **Personal drawer group now 3 items** (`src/navigation/DrawerNav.tsx`) — Prayer Times (new) → Cycle Tracker → Body Stats. Both Prayer screens registered as drawer routes (`Drawer.Screen name="PrayerTimes"` + `Drawer.Screen name="PrayerSettings"`). The qa-expert "Personal = 2" assertion from v1.2.1 becomes "Personal = 3".
- `src/types.ts` — new `CalculationMethodKey`, `AsrJuristicMethod`, `HighLatitudeRule`, `PrayerLocation`, `PrayerSettings` types; `BackupData` gains optional `prayerSettings?: PrayerSettings`.
- `src/constants/data.ts` — new `STORAGE_KEYS.prayerSettings = 'hm_prayer_settings'`.
- `src/context/DataContext.tsx` — new `prayerSettings` / `setPrayerSettings` slice via `useStorage<PrayerSettings>`, default from exported `DEFAULT_PRAYER_SETTINGS`. `allLoaded` widened to include `l19`. `handleImport` restores `data.prayerSettings`. Context value memo dep array extended.
- `src/utils/backup.ts` — `AllData` gains `prayerSettings?: PrayerSettings`; `buildBackupJSON` includes them and bumps schema to `2.5`; `validateBackupData` checks the object shape (enabled/method/asrMethod types).
- `src/screens/BackupScreen.tsx` — destructures `prayerSettings` from `useData`, adds it to the `allData` memo + deps so export includes them.

### Chore

- Bumped `app.json` version to `1.2.2`, `ios.buildNumber` to `"9"`, `android.versionCode` to `9`. Bumped `package.json` version to `1.2.2`. Updated `SettingsScreen` About copy + `DrawerNav` footer to `v1.2.2`.
- `npx tsc --noEmit` and `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` both exit 0 at release.
- Tagged `v1.2.2` on `master`; APK queued on EAS preview profile.

## v1.2.1 — 2026-04-18 "Grouped Home + Vendor Directory"

Patch release on top of v1.2.0 bundling two UX iterations (drawer grouping + TodayScreen redesign) and one new mini-module (Vendor & Services Directory). No framework upgrades, no new npm packages — all work uses existing primitives.

### APK

- Build ID: `507b9347-1bb5-49bc-b26e-6e4af1000009`
- Build page: https://expo.dev/accounts/smartbzss/projects/forshe/builds/507b9347-1bb5-49bc-b26e-6e4af1000009
- Profile: `preview` (Android APK). Queued 2026-04-18 via `eas build --profile preview --platform android --non-interactive --no-wait`.

### Added

- **Vendors screen** (`src/screens/VendorsScreen.tsx`) — new drawer screen inside the 🏠 Household group (3rd item, after Maid Tasks + Reminders). Tracks trusted service providers with: name, category (12 options: Plumber 🔧, Electrician ⚡, AC Repair ❄️, Appliance Repair 🔌, Doctor 👨‍⚕️, Pharmacy 💊, Tailor 🧵, Carpenter 🔨, Gardener 🌱, Cleaner 🧹, Mechanic 🚗, Other 📋), primary phone (required), optional alt phone, optional address, 0-5 star personal rating, favorite/pin flag, lastUsed ISO date, optional notes, and createdAt timestamp.
- **FlatList + memoized listHeader** — follows the ExpensesScreen / InventoryScreen pattern with gold gradient hero ("💼 Vendors · N · Your trusted service providers").
- **Search** by name or category substring, case-insensitive.
- **Filter pills** — horizontal scrollable rail: "All", "★ Favorites" (only shown when any favorites exist), and one pill per non-empty category (empty categories hidden to keep the rail short).
- **Tap-expand rows** — tapping a vendor row expands/collapses a 4-button action row: 📞 Call (gold tinted bg), 💬 WhatsApp (green tinted bg), ✏️ Edit (outline), 🗑 Delete (red). The favorite ☆/★ toggle sits on the right of every row and works without expanding.
- **tel: / wa.me wiring via React Native `Linking`** — Call fires `Linking.openURL('tel:' + cleanedPhone)`; WhatsApp fires `Linking.openURL('https://wa.me/' + cleanedPhone)`. `cleanPhone` strips spaces, dashes, and parentheses. Both actions stamp `lastUsed` to today's ISO via a dedicated `stampUsed(id)` helper so the sort "recent first" always reflects real usage.
- **Long-press Call for alt number** — when a vendor has `altPhone` set, long-pressing the Call button shows an Alert to choose Primary or Alt. Short-press always dials the primary.
- **Add/Edit bottom-sheet modal** — Name (required), Category picker (12 options with emoji + label), Phone (required, phone-pad keyboard, ≥7 digits after stripping non-digits), Alt phone (optional), Address (optional multiline), 5 tappable stars for rating (tap same star again to clear), Pin-as-favorite switch, Notes (optional multiline). Validation messages via native `Alert`.
- **Sort order** — favorites first → then `lastUsed` desc (recent first, entries without lastUsed sink below) → alphabetical fallback by name.
- **Undo on delete** — follows the v1.1.3 rule. Deleting a vendor shows a Toast with an Undo CTA that re-adds the vendor to the top of the list.
- **Empty state** — "No vendors yet. Tap + to add your first trusted service provider." when list is empty; "No vendors match this filter." when a filter hides everything.

### Changed

- **Drawer grouping** (`src/navigation/DrawerNav.tsx`) — the flat 12-item drawer is gone. Drawer is now "Today" (standalone row) + 5 collapsible groups:
  - 💰 Money — Expenses, Savings Goals, Insights, Monthly Report
  - 🍽️ Kitchen — Cooking, Recipe Book, Shopping List, Inventory
  - 🏠 Household — Maid Tasks, Reminders, Vendors
  - 💝 Personal — Cycle Tracker, Body Stats
  - ⚙️ System — Backup, Settings
  Each group header is tappable to expand/collapse (default expanded). Tap animation uses `LayoutAnimation.Presets.easeInEaseOut`. Group items are indented under their header and keep the existing gold active-indicator. Accessibility label on headers is "Expand/Collapse [group]"; item labels are unchanged. `DRAWER_GROUPS` array exported for tests/audits. For bottom-tab routes (Expenses, Cooking, Remind) the drawer navigates via `navigation.navigate('Home', { screen: tabName })`; drawer-level routes still use plain `navigate(name)`. The active indicator reads the nested tab state so Expenses/Cooking/Remind correctly highlight inside the Kitchen/Money/Household groups.
- **TodayScreen as a home page** (`src/screens/TodayScreen.tsx`) — redesigned from a stats wall to a group-tile grid:
  - Hero card kept: greeting + balance + today's spend. The old 4-box stat grid and 7-day bars were removed (those live on Expenses / Insights).
  - 5 "Explore" tiles under the hero, one per drawer group, each a Card with icon + name + dynamic count badge + chevron. Tapping navigates to the group's most actionable screen (Money→Expenses, Kitchen→Cooking, Household→Remind, Personal→BodyStats, System→Settings).
  - Dynamic badges (read from existing `DataContext`): "over budget" / "on track" for Money, "N low stock" / "stocked" for Kitchen, "N due today" / "all clear" for Household, "logged today" / "no log today" for Personal. System has no badge.
  - "Today's Essentials" section below the tiles keeps the existing due-soon / meals / maid task lists. Empty state when all three are empty.
  - The duplicated "Insights" block (MoM, top category, avg daily) was removed from this screen — that content is now exclusively on `InsightsScreen`.
- `src/types.ts` — new `VendorCategory` union and `Vendor` interface; `BackupData` gains optional `vendors?: Vendor[]`.
- `src/constants/data.ts` — new `STORAGE_KEYS.vendors = 'hm_vendors'`; new `VENDOR_CATS` array with 12 `{ key, label, icon }` entries.
- `src/context/DataContext.tsx` — new `vendors` / `setVendors` slice via `useStorage<Vendor[]>`, default `[]`. `allLoaded` widened to include `l18`. `handleImport` now restores `data.vendors`. Context value memo dep array extended.
- `src/utils/backup.ts` — `AllData` gains `vendors?: Vendor[]`; `buildBackupJSON` includes them and bumps schema to `2.4`; `validateBackupData` checks vendors as an array of objects with id/name/category/phone.
- `src/screens/BackupScreen.tsx` — destructures `vendors` from `useData`, adds it to the `allData` memo + deps so export includes them.

### Fixed

- **TodayScreen duplicate Quick-Add FAB removed** — the inline Quick-Add card on the Today dashboard was redundant with the global `QuickAddFAB` introduced in v1.2.0 (mounted once at the app root). The Today screen now relies solely on the global FAB, eliminating the duplicate entry path and simplifying the home layout.

### Chore

- `app.json` version `1.2.0` → `1.2.1`; `ios.buildNumber` `"7"` → `"8"`; `android.versionCode` `7` → `8`.
- `package.json` version `1.2.0` → `1.2.1`.
- `SettingsScreen` About updated from `Version 1.2.0` → `Version 1.2.1`.
- `DrawerNav` footer updated from `ForSHE v1.2.0` → `ForSHE v1.2.1`.
- `HomeManagerApp/CLAUDE.md` — Current Version bumped to `v1.2.1`.

### Notes

- `npx tsc --noEmit` clean. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` clean.
- No new npm packages. `Linking` is built into React Native.
- No seed data for vendors — user-populated.
- `TodayScreen` Household tile badge logic stays at reminders-due-today count; vendors are not time-sensitive, so they do not contribute to the badge.

## v1.2.0 — 2026-04-18 "Connected Home + Product Completeness"

Minor release bundling two dev streams into a single public cut. Thirteen new user-facing features — the v1.1.3-dev **product completeness** wave (multi-currency, dark-mode match-system, global Quick-Add FAB, biometric lock, undo-everywhere, session-based shopping, encrypted backup, Gmail/Drive file sharing) plus the v1.2-dev **Connected Home** integration wave (Inventory Tracker, Recipe Book + Auto Grocery, Bill Reminders, Medication Reminders, Savings Goals, Expense Insights dashboard). The modules now talk to each other: recipes deduct inventory, inventory drives shopping lists, cooking plans generate weekly groceries, bills auto-advance, medication shows up on Body Stats today.

### Added

**Product completeness (from v1.1.3-dev)**

- **Multi-currency support** (`src/constants/currencies.ts`, `src/context/CurrencyContext.tsx`, `src/utils/currency.ts`) — picker in Settings with 7 options (PKR ₨, USD $, EUR €, GBP £, INR ₹, SAR ﷼, AED د.إ). Default PKR. Selection persisted under AsyncStorage key `hm_currency`. Every `pkr()` / `pkrF()` call site (TodayScreen, ExpensesScreen, MonthlyReportScreen, MaidScreen, SettingsScreen, BackupScreen, QuickAddFAB, SavingsGoalsScreen, InsightsScreen, RemindersScreen, share.ts) reads from the `useCurrency()` hook. Sign-preservation rule (v1.1.1) preserved — negative values still render as `-$ 1,200` / `-Rs 1.2K`. Lakh shorthand (`1.2L`) is kept for PKR and INR only; USD/EUR/GBP/SAR/AED switch to `1.2M` at a million. Locale-aware thousand separators via `toLocaleString(cur.locale)` with a raw-number fallback.
- **Dark-mode "Match system" button** (`SettingsScreen.tsx`) — under the Dark Mode switch, shows a one-tap button to sync the app theme with the device's current `useColorScheme()` value whenever they differ. Switch still lets the user override manually.
- **Global Quick-Add FAB** (`src/components/QuickAddFAB.tsx`) — circular gold-gradient floating action button in the bottom-right on every authenticated screen. Opens a bottom-sheet modal with a two-way toggle (Received / Expense), label + amount input, category picker (expense only), and saves into `history` via `DataContext`. Fires budget alerts when `budget > 0`. Undo callback in the Toast if you save by mistake. Positioned with `bottom = max(insets.bottom, 8) + 82` so it clears the floating tab pill on Android gestures + iOS home indicator. Mounted once at the app root (inside the authenticated tree in `App.tsx`) — screens do not render their own copies.
- **Biometric app lock** (`src/screens/BiometricLockScreen.tsx`, `App.tsx`) — `expo-local-authentication` re-added (SDK 55 compatible). New Settings toggle "Biometric Lock" under App Lock; flipping it ON prompts the user to authenticate once before saving. Stored under `hm_biometric_lock` via `useStorage`. When enabled, app launch (and resume after ≥5s in background) routes through `BiometricLockScreen` which auto-prompts `authenticateAsync`. If the device has no hardware/enrollment, a friendly banner is shown; if a PIN is also set, a "Use PIN instead" link flips to the existing `AppLockScreen` as fallback. No hardware/enrollment and no PIN → the app unlocks normally (toggle simply refuses to turn on).
- **App Lock card in Settings** now hosts BOTH the PIN toggle and the new Biometric toggle as sibling rows under a shared section header.
- **Currency card in Settings** placed right after Appearance.
- **Undo everywhere** — every destructive user action now shows a Toast with an Undo button that re-adds the deleted item:
  - `ExpensesScreen.deleteEntry` (already present, verified)
  - `ShoppingListScreen.deleteItem` + `clearDone` (already present, verified)
  - `RemindersScreen.deleteReminder` — restores the reminder and reschedules its notifications via `scheduleNotifications`
  - `CycleScreen.deleteLog` — restores the period log into the sorted list
  - `BodyStatsScreen.deleteLog` — restores the body stats entry
  - `SettingsScreen` recurring-expense remove — restores the recurring row
  - `QuickAddFAB.save` — one-tap undo for accidental quick-adds
  - `InventoryScreen`, `RecipeBookScreen`, `SavingsGoalsScreen` delete handlers — undo restores the item.
- **Session-based Shopping Lists** (`ShoppingListScreen`, new type `ShoppingSession`, storage key `hm_shopping_sessions`) — shopping is now trip-based. List of sessions (active first, completed at bottom). "New Shopping List" modal offers: name the list, copy items from a previous list, or start empty. Each session can be completed / reopened / deleted / copied. Old flat `ShoppingItem[]` auto-migrates to a single session on first load. Locale-independent `DD MMM` / `DD MMM YYYY` formatting via local helpers (no `toLocaleDateString`).
- **Encrypted backup** (`src/utils/backup.ts`, `BackupScreen`) — AES-256 via `crypto-js`. Export writes a `.forshe` file (prefixed `FORSHE_ENC_V1:` + ciphertext). Password modal with min 4 chars + confirm. Import auto-detects encrypted files and prompts for a password. Cancelling the prompt aborts cleanly; wrong password returns `null` (never throws).
- **File-based sharing** (Gmail / Drive / WhatsApp) — `expo-file-system` new API (`File` / `Paths.cache`) writes the backup to cache then `Share.share({ url })` opens the native share sheet. Purple `Button` variant added (`gradients.purpleBtn`).

**Connected Home (from v1.2-dev)**

- **Inventory Tracker** (`src/screens/InventoryScreen.tsx`, new type `InventoryItem`, storage key `hm_inventory`) — new drawer screen between Shopping List and Maid Tasks. Tracks name, qty, unit, category (Grocery / Household / Pantry / Fridge / Freezer), low-stock threshold, notes. Per-item ± quantity buttons. Low-stock badge when `qty <= lowStockThreshold`. Search + category filter pills. Add/edit modal. Undo toast on delete. Sort: alphabetical.
- **Recipe Book** (`src/screens/RecipeBookScreen.tsx`, new types `Recipe` + `RecipeIngredient`, storage key `hm_recipes`, seed file `src/constants/seedRecipes.ts`) — new drawer screen between Maid Tasks and Savings. Three modes: list, detail, edit. Ingredients cross-reference inventory (matched by `name` + `unit` with no unit conversion). Ships with 6 Pakistani starter recipes: Chicken Biryani, Daal Chawal, Chicken Karahi, Chicken Pulao, Kheer, Aloo Paratha. Detail view shows in-stock vs missing badges per ingredient. "Cook this" button logs the meal into today's cooking slot (time-of-day heuristic → Breakfast/Lunch/Dinner) and deducts matching units from inventory. Undo toast on delete. Accepts `route.params.pickForMeal` for one-shot recipe assignment from CookingScreen.
- **Auto Grocery Generation** (`RecipeBookScreen` detail view + `CookingScreen` weekly planner) — two integration points, no new screen:
  - Recipe detail → "Add N missing to shopping" button opens a modal listing active shopping sessions; user picks one to append to, or creates a new list named after the recipe.
  - Cooking screen → "🛒 Shopping List from This Week" button at the top of the daily view. Walks DAYS × MEALS, matches assigned meal names against recipes (case-insensitive), aggregates ingredients across all matches, subtracts inventory (same name + unit), deduplicates by name, creates a new session `"Week of DD/MM"`.
  - No unit conversions — mismatched units skip deduction but the ingredient is still added to shopping.
- **Bill Reminder System** (`src/screens/RemindersScreen.tsx`, extended `Reminder` type) — 5 new bill preset categories (💡 Utility, 🏠 Rent, 📚 School Fees, 📺 Subscription, 🧾 Other Bills), new optional `amount` field rendered next to the title, new optional `recurring` field (`monthly`/`quarterly`/`yearly`/null). Marking a recurring bill Done creates the next occurrence automatically at the advanced date + reschedules its notifications. Bill amount + recurring picker shown conditionally in the add form when the category is a bill category.
- **Medication Reminders** (`RemindersScreen`, extended `Reminder` type + `BodyStatsScreen`) — new Medication category with optional `dosage` string and `withFood` flag. Duration picker: "for N days" auto-generates N daily reminders starting on the picked date (N clamped 1-60). Medication reminders get a filter pill on RemindersScreen. BodyStatsScreen shows a "💊 Today's Medication" card under the hero when any medication reminder falls on today — tap to toggle taken/not taken (does NOT cancel notifications on toggle).
- **Savings Goals** (`src/screens/SavingsGoalsScreen.tsx`, new type `SavingsGoal`, storage key `hm_savings_goals`) — new drawer screen. Create goals with target, saved amount, optional deadline, notes. Progress bar + percentage + days-remaining (with overdue red state). "+ Contribute" modal bumps savedAmount and optionally logs a Transaction under the `💰 Savings` category. Celebrates reaching 100% with a success toast + haptic. MonthlyReport gains a "Savings" overview box showing the Savings category spend for the month. Undo toast on delete.
- **Expense Insights / Visual Dashboard** (`src/screens/InsightsScreen.tsx`) — new drawer screen. Uses `react-native-gifted-charts` (pure-JS, SDK 55 compatible, no native deps). Shows:
  - 6-month spending trend (animated bar chart)
  - Category breakdown pie chart + percentages legend (current month)
  - Top 5 expenses this month
  - Month-over-month comparison widget with arrow, percentage delta, saved/over copy
  - Daily average spend
  - All charts theme-aware and respect dark mode. All currency via `useCurrency()`.
- **Reminder filter pills** (`RemindersScreen`) — All / Bills / Medication / Other with live counts. Replaces the previous un-filtered flat list.

### Changed
- `src/types.ts` — new types `InventoryItem`, `InventoryCategory`, `Recipe`, `RecipeIngredient`, `SavingsGoal`, `ReminderRecurring`, `ShoppingSession`. `Reminder` gains optional `amount`, `recurring`, `dosage`, `withFood` fields. `BackupData` gains `inventory`, `recipes`, `savingsGoals`, `shoppingSessions`.
- `src/constants/data.ts` — new storage keys `hm_inventory`, `hm_recipes`, `hm_savings_goals`, `hm_shopping_sessions`. New category constants `BILL_CATS`, `MEDICATION_CAT`, `RECURRING_FREQS`, `INVENTORY_CATS`, `UNIT_HINTS`, `SAVINGS_CAT`. `REMINDER_CATS` extended with 6 new categories (Utility, Rent, School Fees, Subscription, Other Bills, Medication).
- `src/context/DataContext.tsx` — four new state slices + their setters (`inventory`, `recipes`, `savingsGoals`, `shoppingSessions`). `recipes` seeds from `SEED_RECIPES` on first launch. `allLoaded` widened to `l1…l17`. One-time migration of old flat `hm_shopping` → single session. `handleImport` round-trips everything.
- `src/utils/backup.ts` — `buildBackupJSON` bumped to version `2.3` and writes the new collections. Validator now checks `inventory`/`recipes`/`savingsGoals`/`shoppingSessions` as arrays. Encrypted path via `encryptData` / `decryptData` (prefix check, null on wrong password).
- `src/utils/currency.ts` — `pkr()` / `pkrF()` accept an optional `CurrencyDef` argument and default to PKR for legacy callers. Shorthand still `1.2K` / `1.2L` but `L` is gated to South-Asian currencies (PKR, INR); others get `M` at a million.
- `src/utils/share.ts` — `buildShareText` takes a `currency: CurrencyDef` argument so the shared report uses the user's selected currency symbol.
- `src/screens/BackupScreen.tsx` — `allData` memo now includes the new collections. Export flow offers plain JSON, encrypted `.forshe`, and CSV.
- `src/navigation/DrawerNav.tsx` — 4 new drawer entries (Inventory, Recipes, Savings Goals, Insights) and 4 new `Drawer.Screen` registrations. Order: Home, Shopping, Inventory, Maid, Recipes, Savings, Insights, Cycle, Body Stats, Monthly Report, Backup, Settings (12 total). Footer bumped to `ForSHE v1.2.0`.
- `src/screens/CookingScreen.tsx` — new "🛒 Shopping List from This Week" button at the top of the daily view; new "📖 Pick from Recipe" button per meal in the edit state that navigates to `Recipes` with `{ pickForMeal: { day, meal } }`. Mounts `<Toast />`.
- `src/screens/RemindersScreen.tsx` — filter pills, conditional form fields (amount + recurring for bills, dosage + duration + with-food for medication), per-card amount/recurring/with-food badges, auto-reschedule of recurring bills on Done.
- `src/screens/BodyStatsScreen.tsx` — new "Today's Medication" card under the hero (conditional on any medication reminder dated today).
- `src/screens/MonthlyReportScreen.tsx` — new "Savings" box in the overview grid showing the total of `💰 Savings` category transactions for the selected month.
- `src/screens/ShoppingListScreen.tsx` — session-based rewrite. Locale-independent date helpers (`fmtShort`, `fmtShortYear`) replace `toLocaleDateString`.
- `App.tsx` — new `CurrencyProvider` wraps `DataProvider` (inside `ThemeProvider`). New `AppState` listener re-locks the app on background→foreground transitions older than 5 seconds when either PIN or biometric is enabled. `QuickAddFAB` mounted as a sibling to `NavigationContainer`. Background→foreground re-lock only fires if the user actually has a lock configured.
- `SettingsScreen` — added Currency card, "Match system" dark-mode button, Biometric Lock toggle alongside PIN. Recurring-expense row delete shows Undo toast. About version → `1.2.0`.

### Fixed
- `ShoppingListScreen` — two `toLocaleDateString('en-GB', …)` calls replaced with locale-independent `fmtShort` / `fmtShortYear` helpers, restoring the project rule that forbids locale-dependent date formatting.

### Chore
- `package.json` — added `react-native-gifted-charts` dependency. Re-added `expo-local-authentication` (`~55.0.13`) for biometric lock. `crypto-js` + `@types/crypto-js` for encrypted backup. `expo-file-system` kept at new-API version.
- `app.json` → version `1.2.0`, `ios.buildNumber` `"7"`, `android.versionCode` `7`.
- `package.json` → version `1.2.0`.
- `SettingsScreen` About card → `Version 1.2.0`.
- `DrawerNav` footer → `ForSHE v1.2.0`.
- `CHANGELOG.md` + `CLAUDE.md` updated; agent playbooks (`qa-expert.md`, `ui-designer.md`, `rn-performance-expert.md`, `eas-release-expert.md`, `git-release-manager.md`, `project-manager.md`) updated for all v1.1.3-dev + v1.2-dev patterns.
- qa-expert TypeScript pass — both `tsc --noEmit` and `tsc --noEmit --noUnusedLocals --noUnusedParameters` exit 0.

### APK
- Build ID: `2181a3b8-3611-4882-ba41-b33cc9ba18b4` (queued 2026-04-18 via `eas build --profile preview --platform android --non-interactive --no-wait`)
- Build page: https://expo.dev/accounts/smartbzss/projects/forshe/builds/2181a3b8-3611-4882-ba41-b33cc9ba18b4
- Artifact URL: (visible after build FINISHES — `https://expo.dev/artifacts/eas/<hash>.apk` format)

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

### APK
- Build ID: `9ce82345-5d1d-42d2-934a-d8971387af2f` (FINISHED 2026-04-11 09:25 UTC — https://expo.dev/artifacts/eas/knMfhN6yNhTxnzybRzzKdk.apk)
- Previous attempt `d9dc1bb8-3514-4e4c-9f3c-ed0940449cfe` was CANCELED 2026-04-10 and never produced an artifact.

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
