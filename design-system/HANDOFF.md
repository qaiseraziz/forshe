# How to commit this to qaiseraziz/forshe @ redesign

This folder is the **drop-in package** for the Henna & Pearl redesign. The
files are written for React DOM (the web prototype) — you'll need to port
them to React Native for the production app. See "Porting notes" at the
bottom.

## Step-by-step

```bash
cd /path/to/your/local/forshe
git checkout redesign
# (or: git checkout master && git pull && git checkout -b redesign-henna-v2)

# Drop this folder in as a reference next to your src/
cp -R /path/to/git-drop/forshe-design  ./design-system

git add design-system
git commit -m "Add Henna & Pearl design-system reference (web prototype)

- Tokens (colors, type, radii, shadows, gradients) as CSS vars
- 50-icon hand-drawn library (web SVG; needs RN <Svg> port)
- Five ornaments (arabesque, divider, margin mark, mesh, trefoil)
- Six primitives (Card, Button, Pill, Input, Badge, Progress)
- Five chrome components (Header, TabBar, FAB, Drawer, QuickAddSheet)
- 17 screens written in React DOM as porting references
- README with full visual + content + iconography rules"

git push origin redesign   # or redesign-henna-v2
```

## What's in here

| File | Purpose |
|---|---|
| `tokens.css` | The new design tokens. Copy values into a `src/constants/tokens.ts` for the RN port. |
| `HennaIcons.web.jsx` | ~50 hand-drawn icons. **Port** to `react-native-svg` `<Svg><Path d="…"/>`. |
| `HennaOrnaments.web.jsx` | ArabesqueCorner / DividerOrnament / MarginMark / MeshOverlay. Same RN-port note. |
| `HennaPrimitives.web.jsx` | Card / Button / Pill / Input / Badge / Progress / StatusBar. |
| `HennaChrome.web.jsx` | Header / TabBar / FAB / Drawer / QuickAddSheet. |
| `screens/*.jsx` | All 17 screens (Today, Expenses, Cooking, Recipe Book, Reminders, Vendors, Savings Goals, Insights, Monthly Report, Shopping List, Inventory, Maid Tasks, Cycle Tracker, Body Stats, Prayer Times, Fasting, Settings, Backup). |
| `README.md` | Full system reference. Read this first. |

## Porting notes — React DOM → React Native

The `.web.jsx` files are deliberately suffixed so you don't import them
into RN by accident. The mappings:

| Web | React Native |
|---|---|
| `<div>` | `<View>` |
| `<button>` | `<Pressable>` or `<TouchableOpacity>` |
| `<span>` | `<Text>` (RN forces all text into `<Text>`) |
| `<input>` | `<TextInput>` |
| `<svg><path d="…"/></svg>` | `<Svg><Path d="…"/></Svg>` from `react-native-svg` |
| Inline `style={{ background, borderRadius, padding }}` | Mostly 1:1 — RN flexbox is the default |
| `var(--henna)` CSS vars | Replace with `tokens.henna` imported from a JS constants file |
| `box-shadow` strings | RN: `shadowColor / shadowOffset / shadowOpacity / shadowRadius / elevation` |
| `linear-gradient(…)` | `<LinearGradient>` from `expo-linear-gradient` |
| `radial-gradient(…)` | Use an `<ImageBackground>` or a pre-rendered SVG mesh — RN has no radial-gradient primitive |
| `background-image: radial-gradient(…dots…)` (paper noise) | Drop, or use a tiled PNG asset |

**Easiest first port:** `redesign/screens/Today.jsx` — it's the densest
screen and covers every primitive, ornament, and layout pattern. Get
that working in RN, and the other 16 follow the same patterns.

## Branch protection note

If `redesign` is a protected branch (you can't push directly), push to a
side branch and PR it in:

```bash
git checkout -b redesign-henna-v2
git push origin redesign-henna-v2
# Open a PR from redesign-henna-v2 → redesign on GitHub
```
