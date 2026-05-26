# ForSHE Design System
**Henna & Pearl edition · v2**

> **ForSHE** is a home-management mobile app for Pakistani / South Asian Muslim women. It pulls expenses, cooking plans, maid tasks, shopping lists, inventory, savings goals, cycle tracking, body stats, prayer times and Sunnah fasting into one warm, illuminated experience.
>
> Slogan: *"Your home, your way."*
> Tagline (Arabic-feel): *Salaam, Hina.*

The app is a **hybrid Expo build** that ships natively on both iOS and Android from one codebase. The design system is the same on both platforms — verified in this project by rendering the Today screen inside iPhone + Android device frames side-by-side.

---

## Source repo
- **GitHub:** https://github.com/qaiseraziz/forshe/tree/redesign
- Files imported into `src/` for reference: `constants/colors.ts`, `constants/data.ts`, all of `components/ui/`, `navigation/*`, plus screen ports of Today, Expenses, Onboarding.
- Production CLAUDE.md (the long feature log) at https://github.com/qaiseraziz/forshe/blob/redesign/CLAUDE.md.

---

## What changed in v2

The original ForSHE used a saffron-gold + emoji aesthetic. **v2 (this version) is a complete reset** to a warmer, more refined "Henna & Pearl" system:

- **Palette pivot:** gold/red → henna red + sage + bronze + plum + pink + dust on a pearl/cream base.
- **Type pivot:** Playfair Display + Outfit → **Marcellus + DM Sans**, with **Cormorant Garamond italic** as a flourish on numerals.
- **Icon pivot:** dual-system (Phosphor regular for chrome + emoji for content) → **one hand-drawn icon system** for everything. ~50 icons, all 24px viewBox, 1.4px stroke, rounded caps & joins. **Emoji is dropped.**
- **Ornament layer added:** arabesque corner pieces, divider ornaments, margin marks, italic Cormorant flourishes — gives the page a hand-illuminated, Mughal-manuscript feel.
- **Shapes softened:** card radius 24 → **28**, button radius 16 → **999 (pill)**, tab bar 28 → **32**.
- **Page bg upgraded:** flat ivory → **radial pearl gradient** with paper-grain texture.

---

## Index

```
ForSHE Design System/
├── README.md                ← you are here
├── SKILL.md                 ← agent skill descriptor (cross-compat w/ Claude Code)
├── colors_and_type.css      ← canonical Henna & Pearl tokens (CSS vars + .henna scope)
├── assets/                  ← logo, app icon, splash, adaptive Android icons
├── preview/                 ← Design System tab cards
│   ├── palette-brand.html
│   ├── palette-surface.html
│   ├── palette-foreground.html
│   ├── type-display.html · type-ui.html
│   ├── hero-gradients.html
│   ├── radius-scale.html · spacing-scale.html · elevation.html
│   ├── buttons.html · pills.html · badges.html · inputs.html
│   ├── card.html · empty-state.html
│   ├── drawer-groups.html · tab-bar.html · quick-add-fab.html · status-dots.html
│   ├── iconography.html · ornaments.html · logo.html · voice.html
├── redesign/                ← Hi-fi click-through prototype (the new UI kit)
│   ├── index.html           ← Design canvas with all 17 screens + iOS/Android frames
│   ├── henna-tokens.css     ← Source for /colors_and_type.css
│   ├── HennaIcons.jsx       ← The ~50-icon hand-drawn library
│   ├── HennaOrnaments.jsx   ← ArabesqueCorner, MarginMark, DividerOrnament, MeshOverlay
│   ├── HennaPrimitives.jsx  ← Card, Button, Pill, Input, Badge, Progress
│   ├── HennaChrome.jsx      ← Header, TabBar, FAB, Drawer, QuickAddSheet
│   ├── screens/*.jsx        ← 17 screens (Today, Expenses, …, Settings, Backup)
│   ├── android-frame.jsx · ios-frame.jsx · design-canvas.jsx
└── src/                     ← Imported reference files from the production repo
```

---

## Visual foundations

### Palette

Six accent hues, each paired with a soft tinted background:

| Accent | Solid | Soft bg | Used in |
|---|---|---|---|
| **Henna** | `#934939` | `#FBEFE3` | Money, Expenses, Vendors, Shopping, primary buttons, FAB |
| **Bronze** | `#B07A3A` | `#EFE5D2` | Cooking, Fasting |
| **Plum** | `#6A5891` | `#E8E1F0` | Prayer Times |
| **Pink** | `#9C6A6A` | `#F1E4DD` | Cycle Tracker, Body Stats |
| **Sage** | `#7E9C70` | `#E2EAD8` | Reminders, Backup, Maid Tasks, "achieved" badges |
| **Dust** | `#8A7F70` | `#EFEAE0` | System, Settings |

**Surfaces:** `--pearl: #FAF6EE` (page base) · `--paper: #FFFCF5` (card) · `--paper-2: #F5EFE2` (recessed input) · `--line: rgba(147,73,57,0.14)`.

**Ink:** `--ink: #3D362E` (primary) · `--ink-2: #5A4E40` (emphasis) · `--muted: #8A7F70` (metadata) · `--soft: #B5A998` (placeholder).

**Page background:** radial `var(--page-grad)` — `radial-gradient(120% 80% at 50% 0%, #FFFCF5 0%, #F2EBDD 100%)` plus a 6px paper-noise overlay (`<PaperNoise />`).

### Type

- **Marcellus** — serif display, used for screen titles, hero stats, recipe titles, prayer names. Single weight (400).
- **DM Sans** — UI sans, used for everything else. 400 / 500 / 600 / 700.
- **Cormorant Garamond italic** — *flourish only*. The last digits of hero numerals render in italic Cormorant in the screen's accent color (e.g. "Rs 40,**150**" with "150" in italic henna). This single move gives every number a hand-lettered moment.

Type ramp: 10 (eyebrow) · 11 · 12 (caption) · 13 (body sm) · 14 (body) · 15–17 (titles) · 18–22 (display) · **42 (hero numeral)**.

### Iconography — one system, hand-drawn

Dropped emoji entirely. All glyphs come from **`HennaIcons.jsx`** — ~50 icons in one consistent style:

- **24×24 viewBox · stroke 1.4 · rounded caps & joins · currentColor**
- Hand-drawn feel that matches the arabesque ornaments on hero cards
- Used uniformly for chrome (tab bar, hamburger, search, edit, share) AND content (categories, vendor types, meals, presets, drawer groups)
- Icons available: `home · wallet · pot · house · heart · mosque · gear · menu · search · bell · plus · chev-right · chev-down · close · check · pencil · trash · share · filter · phone · message · star · calendar · clock · sparkle · moon · sun · veg · bread · milk · fruit · pill · fuel · electricity · water · flame · book · cart · utensils · wrench · bolt · snow · doctor · tailor · hammer · leaf · broom · car · list · goal · chart · report · lock · box · cycle · body · prayer`

### Ornaments

Five hand-drawn ornaments live in `HennaOrnaments.jsx`. They're what make the system feel illuminated rather than corporate:

1. **ArabesqueCorner** — curving stem + 3 leaves + dots. Sits in the top-right of every hero card. Inherits the screen's accent color at 14–18% opacity.
2. **DividerOrnament** — diamond + leaf curls + bracketing dots inside a hairline rule. Separates Today's hero from the group grid.
3. **MarginMark** — tiny vertical dot-stem (3 dots on a hairline). Sits left of every hero's eyebrow label, like a manuscript margin glyph.
4. **MeshOverlay** — soft radial highlights layered on top of hero gradients. Adds dimensional luminosity without being a separate element.
5. **Trefoil + Drop** — used inside the drawer-logo badge.

### Cards

- **28px radius** (was 24)
- **Zero border** — separation is shadow + hairline inset
- Shadow: `0 10px 30px rgba(147,73,57,0.10), inset 0 0 0 1px rgba(147,73,57,0.06)`
- Hero gradient + arabesque + mesh + margin mark = the brand's signature surface

### Buttons

- **All pill-shaped** (`border-radius: 999px`)
- Primary variant: henna gradient (`#B86553 → #934939`) with henna-tinted shadow
- Six accent variants (primary/henna · sage · bronze · plum · soft · outline · ghost)
- Floating Action Button: 56×56 round, henna gradient, 42%-opacity shadow

### Motion & states

- Press: opacity 0.85, no scale, no color flash
- Active tab: solid henna fill (not tint) — gives the tab bar a confident anchor
- "Today" / drawer group active: `henna-bg` tint + henna text
- Status dots: red (`--henna`) = needs attention, bronze (`--bronze`) = scheduled soon, **no dot = silent** ("all clear" never broadcasts)

---

## Content fundamentals

### Voice

- **Calm, never urgent.** "All caught up for today." not "INBOX ZERO!".
- **First-person / you-form.** "Stays on this device" not "User data is stored locally".
- **Culturally rooted.** "Salaam, Hina" greeting. PKR default. Pakistani city presets. Hanafi prayer-school default. Sunnah-fasting first-class screen.
- **Brief, plain.** Headings in Title Case; status badges in lowercase; eyebrow labels in `UPPERCASE TRACKED`.

### Microcopy samples

| Surface | Copy |
|---|---|
| Greeting | *Salaam, Hina · Tue 26 May* |
| Hero stat | *Rs 40,150* (italic flourish on "150") |
| Privacy line | *Stays on this device. Encrypted end-to-end.* |
| Empty state | *All caught up for today.* |
| Toast | *Rs 450 logged · Undo* |
| Reminder | *Electricity bill · due at 6 PM* |
| Encourage | *Your best month yet · 48% saved* |

---

## Screens built

All 17 screens render at full fidelity in `redesign/index.html`. Open it from the Design System tab.

| Section | Screens |
|---|---|
| Core (tab bar) | Today · Expenses · Cooking · Reminders |
| Money | Savings Goals · Insights · Monthly Report |
| Kitchen | Recipe Book · Shopping List · Inventory |
| Household | Vendors · Maid Tasks |
| Personal & Spiritual | Cycle Tracker · Body Stats · Prayer Times · Fasting |
| System | Settings · Backup & Restore |
| Chrome overlays | Drawer (full nav) · Quick Add (bottom sheet) |
| Hybrid proof | Today rendered in both iPhone and Android device frames |

---

## Caveats

- **Fonts** are loaded from Google Fonts CDN (Marcellus, DM Sans, Cormorant Garamond). The app uses the same families via `@expo-google-fonts/*` — no font file substitution.
- **Hand-drawn icons** are inline SVG in `HennaIcons.jsx`. For the production RN port, copy paths into a `<Svg>` from `react-native-svg`.
- **Screens are static** — no real data layer, no `AsyncStorage`, no Supabase. The redesign is a hi-fi visual + interaction prototype, not a working app.
- **Logo asset is unchanged** — the existing `assets/logo.png` works on the new pearl background; if you want a logo update too, that's a separate ask.
- **Old saffron-gold preview cards and `ui_kits/forshe-mobile/` directory have been removed.** Henna & Pearl is now the canonical system.

---

## Where to start

1. **Open `redesign/index.html`** in the Design System tab — see every screen on the canvas
2. **Browse the Design System cards** to understand tokens individually
3. **Read `colors_and_type.css`** for the source-of-truth tokens
4. **Read `SKILL.md`** if you're invoking ForSHE design from another agent session
