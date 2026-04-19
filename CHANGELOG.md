# Changelog

All notable changes to ForSHE will be documented in this file.

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
