# Lottie animations for ForSHE

All files in this folder MUST obey the following rules — they are enforced by
`rn-performance-expert` + `qa-expert`:

1. **No looping animations.** Every `LottieView` usage must pass `loop={false}`.
2. **Short duration.** Keep each animation 1.0s–2.5s. Longer animations burn battery.
3. **One-shot only.** Play once on mount / on event, then stop. Never ambient.
4. **File size < 50KB per file.** If a file exceeds that, use [lottiefiles.com](https://lottiefiles.com) to trim layers or drop fidelity.
5. **Commercial-use license only.** Free community Lottiefiles are fine (Creative Commons / Lottie Community License). Paid-tier-only animations are banned.

Any new animation added here MUST be documented below with its source URL so the
license and origin are traceable.

## Current files

### Hand-authored (ship-safe, zero license risk)

| File | Size | Duration | Usage | Source |
|------|------|----------|-------|--------|
| `celebrate.json` | 1.8 KB | 2.0s | Savings goal 100% celebration (rotates + fades 6 confetti dots, then fades) | Hand-authored by ForSHE team, bodymovin v5.7.4 schema, MIT |
| `pulse.json` | 1.3 KB | 1.6s | Biometric unlock success (gold ring pulses outward + core bounce) | Hand-authored, MIT |
| `sparkle.json` | 1.2 KB | 1.5s | Recipe "cook this" confirmation + prayer completion (rotating star pops + fades) | Hand-authored, MIT |

### Recommended external sources for premium polish (drop-in replacements)

If you want higher-fidelity animations for the three slots below, sourced from
[lottiefiles.com](https://lottiefiles.com) (free tier, CC licenses), drop the
downloaded JSON into this folder with the exact filename. The `LottieBox`
component auto-loads whichever filename matches. Until they're added, the
fallback emoji is shown instead.

| Slot | Expected filename | Suggested search | Preferred duration |
|------|-------------------|------------------|--------------------|
| Splash intro | `splash-intro.json` | "home logo reveal" / "minimal burst" / "gold shimmer" | 2.0s |
| Empty state | `empty-inbox.json` | "empty inbox" / "empty box minimal" | 1.5s |
| Prayer completion | `tasbeeh.json` | "crescent moon" / "tasbeeh beads" / "islamic minimal" | 2.0s |

**Recommended filters when searching Lottiefiles:**
- License: Lottie Simple License (free for commercial use) OR Creative Commons
- Format: `.json` download (NOT `.lottie`)
- Loop: One-shot preferred (we strip loops even on imported files)
- File size: &lt; 50KB
- Style: minimalist, flat, matches our gold + pink + green palette

## How new animations get loaded

`src/components/ui/LottieBox.tsx` wraps `lottie-react-native` with these safety
rails:

- `loop={false}` is hard-coded — cannot be overridden from the caller
- Falls back to an emoji if the JSON asset is missing / fails to load
- Stops on unmount (no lingering animations)
- Accepts a `size` prop; no inline style computation

Never import `LottieView` directly from `lottie-react-native` in screens — always
go through `LottieBox` so we maintain a single audit point.
