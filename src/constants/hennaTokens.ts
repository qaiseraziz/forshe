/**
 * Henna & Pearl — Design tokens
 *
 * Port of design-system/tokens.css to a typed JS module so the React Native
 * app can consume the same values the web prototype uses. The web prototype
 * lives at design-system/ — it's the source of truth for visuals.
 *
 * Palette story: warm pearl/cream pages, henna-red primary, sage/bronze/plum/
 * pink/dust secondary accents. Soft pillow cards (28px radius, no border,
 * inset hairline shadow). All buttons pill-shaped (radius 999).
 */

export const hennaColors = {
  // Surfaces
  pearl: '#FAF6EE',        // page base
  pearlAlt: '#F2EBDD',     // page gradient end
  paper: '#FFFCF5',        // card surface
  paper2: '#F5EFE2',       // recessed input
  line: 'rgba(147,73,57,0.14)',
  lineStrong: 'rgba(147,73,57,0.28)',

  // Ink scale
  ink: '#3D362E',          // primary text
  ink2: '#5A4E40',
  muted: '#8A7F70',
  soft: '#B5A998',

  // Accents — solid
  henna: '#934939',
  hennaBg: '#FBEFE3',
  hennaSoft: '#E8C9C0',

  bronze: '#B07A3A',
  bronzeBg: '#EFE5D2',

  plum: '#6A5891',
  plumBg: '#E8E1F0',

  pink: '#9C6A6A',
  pinkBg: '#F1E4DD',

  sage: '#7E9C70',
  sageBg: '#E2EAD8',

  dust: '#8A7F70',
  dustBg: '#EFEAE0',

  // Semantic
  success: '#7E9C70',      // = sage
  warn: '#B07A3A',         // = bronze
  danger: '#934939',       // = henna
} as const;

export type HennaAccent = 'henna' | 'sage' | 'bronze' | 'plum' | 'pink' | 'dust';

export const hennaAccentPairs: Record<HennaAccent, { fg: string; bg: string }> = {
  henna:  { fg: hennaColors.henna,  bg: hennaColors.hennaBg },
  sage:   { fg: hennaColors.sage,   bg: hennaColors.sageBg },
  bronze: { fg: hennaColors.bronze, bg: hennaColors.bronzeBg },
  plum:   { fg: hennaColors.plum,   bg: hennaColors.plumBg },
  pink:   { fg: hennaColors.pink,   bg: hennaColors.pinkBg },
  dust:   { fg: hennaColors.dust,   bg: hennaColors.dustBg },
};

/**
 * Gradient pairs — use with expo-linear-gradient as
 *   <LinearGradient colors={hennaGradients.heroHenna} ... />
 *
 * Web equivalents from the prototype:
 *   --page-grad:  radial-gradient(120% 80% at 50% 0%, #FFFCF5 0%, #F2EBDD 100%)
 * RN has no radial-gradient primitive, so the page background is rendered as
 * a near-vertical linear gradient (top→bottom) using the same two stops.
 */
export const hennaGradients = {
  // Page background — pearl top → pearl-alt bottom (linear stand-in for radial)
  page: [hennaColors.paper, hennaColors.pearlAlt] as [string, string],
  // Hero card gradients per accent (from the screens)
  heroHenna:  ['#FBE7DD', '#F2D9CB'] as [string, string],
  heroSage:   ['#E9EFDD', '#DBE5C8'] as [string, string],
  heroBronze: ['#F4E9D2', '#E7D7B5'] as [string, string],
  heroPlum:   ['#EEE6F4', '#DED2EC'] as [string, string],
  heroPink:   ['#F6E6DF', '#EAD2C9'] as [string, string],
  heroDust:   ['#F1EBDF', '#E4DCC9'] as [string, string],
  // Button — primary henna pill
  buttonHenna:  ['#B86553', '#934939'] as [string, string],
  buttonSage:   ['#99B68A', '#7E9C70'] as [string, string],
  buttonBronze: ['#C99548', '#B07A3A'] as [string, string],
  buttonPlum:   ['#8975AA', '#6A5891'] as [string, string],
  // Progress fills (90deg in web → horizontal LinearGradient with start/end)
  progressHenna:  ['#B86553', '#934939'] as [string, string],
  progressSage:   ['#99B68A', '#7E9C70'] as [string, string],
  progressBronze: ['#C99548', '#B07A3A'] as [string, string],
  progressPlum:   ['#8975AA', '#6A5891'] as [string, string],
};

/**
 * Shadow recipes — RN ports of the CSS box-shadow strings.
 * Apply `elevation` on Android (RN ignores shadow* on Android by default).
 */
export const hennaShadows = {
  sm: {
    shadowColor: '#3C2814',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    // 0 10px 30px rgba(147,73,57,0.10)
    shadowColor: '#934939',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 5,
  },
  lg: {
    // 0 20px 50px rgba(70,40,20,0.18)
    shadowColor: '#462814',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 50,
    elevation: 10,
  },
  fab: {
    // 0 10px 24px rgba(147,73,57,0.42)
    shadowColor: '#934939',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const hennaRadii = {
  pill: 999,
  card: 28,
  tile: 24,
  input: 18,
  tab: 32,
  fab: 32,
} as const;

/**
 * Font family names — these are the strings @expo-google-fonts/* exports.
 * Loading is done at app root with useFonts() — see App.tsx.
 *
 *   - Marcellus   → serif display (screen titles, hero stats, recipe titles, prayer names)
 *   - DM Sans     → UI sans (everything else)
 *   - Cormorant Garamond italic → flourish only (last digits of hero numerals)
 */
export const hennaFonts = {
  serif: 'Marcellus_400Regular',
  ui: 'DMSans_400Regular',
  uiMedium: 'DMSans_500Medium',
  uiSemi: 'DMSans_600SemiBold',
  uiBold: 'DMSans_700Bold',
  flourish: 'CormorantGaramond_600SemiBold_Italic',
} as const;

/**
 * Type ramp — pixel sizes match tokens.css exactly.
 * 10 (eyebrow) · 11 · 12 (caption) · 13 (small) · 14 (body)
 * 15–17 (titles) · 18–22 (display) · 26 (display large) · 42 (hero numeral)
 */
export const hennaType = {
  hero: 42,
  display: 26,
  h1: 22,
  h2: 18,
  body: 14,
  small: 13,
  caption: 11,
  eyebrow: 10,
} as const;

/**
 * Eyebrow text style — uppercase tracked label used above stats and section heads.
 * Spread onto a <Text style={[hennaTextStyles.eyebrow, ...]} />.
 */
export const hennaTextStyles = {
  eyebrow: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: hennaType.eyebrow,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: hennaColors.muted,
  },
  displayNumber: {
    fontFamily: hennaFonts.serif,
    fontSize: hennaType.hero,
    lineHeight: hennaType.hero,
    letterSpacing: -0.5,
    color: hennaColors.ink,
  },
  sectionHead: {
    fontFamily: hennaFonts.serif,
    fontSize: hennaType.display,
    letterSpacing: -0.3,
    color: hennaColors.ink,
    lineHeight: hennaType.display,
  },
  bodySerif: {
    fontFamily: hennaFonts.serif,
    fontSize: hennaType.body,
    color: hennaColors.ink,
  },
  body: {
    fontFamily: hennaFonts.ui,
    fontSize: hennaType.body,
    color: hennaColors.ink,
  },
  caption: {
    fontFamily: hennaFonts.ui,
    fontSize: hennaType.caption,
    color: hennaColors.muted,
  },
};

/**
 * Status-dot color map. Per the design rules:
 *   red (henna)  = needs attention (over budget / low stock / due today)
 *   bronze       = scheduled soon
 *   no dot       = silent ("all clear" never broadcasts)
 */
export const hennaStatusDot = {
  attention: hennaColors.henna,
  soon: hennaColors.bronze,
} as const;
