export const lightColors = {
  bg: '#faf9f7',
  bg2: '#ffffff',
  bg3: '#f5f3f0',
  // v1.2.4-dev: elevated surface variant for raised cards / frosted chrome
  // under BlurView. Slightly brighter than bg2 so depth reads on top of the
  // gradient background.
  bg2Elevated: '#ffffff',
  border: '#f0ece6',
  shadow: 'rgba(30,25,20,0.06)',
  deep: '#1a1a2e',
  gold: '#c8860a',
  goldBg: '#fef8ee',
  goldBorder: '#f5d58a',
  // v1.2.4-dev: subtle gradient-border tint for active nav items — sits on
  // top of the existing active gold pill background without clashing.
  goldBorderActive: '#e9b84a',
  green: '#1a8a5a',
  greenBg: '#f0faf5',
  greenBorder: '#a8dfc5',
  red: '#c0392b',
  redBg: '#fef4f3',
  redBorder: '#f5c2be',
  blue: '#1d6fa4',
  blueBg: '#f0f7ff',
  blueBorder: '#bdd8f5',
  purple: '#6b3fa0',
  purpleBg: '#f5f2ff',
  purpleBorder: '#d8ccf5',
  pink: '#c0395a',
  pinkBg: '#fff2f6',
  pinkBorder: '#f5c2d8',
  orange: '#d35400',
  slate: '#607d8b',
  text: '#1a1a2e',
  sub: '#4a5568',
  muted: '#a0aab4',
  gradientStart: '#fdfcfa',
  gradientEnd: '#f5f0eb',
  surfaceMuted: 'rgba(0,0,0,0.02)',
  tabBarBg: 'rgba(255,255,255,0.92)',
  // v1.2.4-dev: blur tint for <BlurView intensity={40} tint="light"> — we
  // layer this over the BlurView so the pill still reads on busy backgrounds.
  tabBarBlurTint: 'rgba(255,255,255,0.55)',
};

export const darkColors: typeof lightColors = {
  bg: '#0d0d12',
  bg2: '#18181f',
  bg3: '#1f1f28',
  bg2Elevated: '#22222c',
  border: '#262633',
  shadow: 'rgba(0,0,0,0.5)',
  deep: '#f0ede8',
  gold: '#c8860a',
  goldBg: '#2a1f00',
  goldBorder: '#6b4800',
  goldBorderActive: '#b07804',
  green: '#1a8a5a',
  greenBg: '#001a0e',
  greenBorder: '#0a4a28',
  red: '#c0392b',
  redBg: '#1a0505',
  redBorder: '#6b1a1a',
  blue: '#1d6fa4',
  blueBg: '#050d1a',
  blueBorder: '#1a3a5a',
  purple: '#6b3fa0',
  purpleBg: '#160d2a',
  purpleBorder: '#3a2a5a',
  pink: '#c0395a',
  pinkBg: '#1a0510',
  pinkBorder: '#6b1a30',
  orange: '#d35400',
  slate: '#607d8b',
  text: '#f0ede8',
  sub: '#9aa3b0',
  muted: '#5a6172',
  gradientStart: '#0d0d12',
  gradientEnd: '#12121a',
  surfaceMuted: 'rgba(255,255,255,0.03)',
  tabBarBg: 'rgba(15,15,20,0.92)',
  tabBarBlurTint: 'rgba(15,15,20,0.55)',
};

export type Colors = typeof lightColors;

export const gradients = {
  goldHero: ['#fef8ee', '#fdf0d5'] as [string, string],
  greenHero: ['#f0faf5', '#e0f5eb'] as [string, string],
  purpleHero: ['#f5f2ff', '#ece5ff'] as [string, string],
  pinkHero: ['#fff2f6', '#ffe5ed'] as [string, string],
  goldBtn: ['#daa520', '#c8860a'] as [string, string],
  greenBtn: ['#22a86a', '#1a8a5a'] as [string, string],
  blueBtn: ['#3498db', '#1d6fa4'] as [string, string],
  redBtn: ['#e74c3c', '#c0392b'] as [string, string],
  pinkBtn: ['#e74c7a', '#c0395a'] as [string, string],
  purpleBtn: ['#7c4dba', '#5a2d8a'] as [string, string],
  goldHeroDark: ['#2a1f00', '#1a1400'] as [string, string],
  greenHeroDark: ['#001a0e', '#001208'] as [string, string],
  purpleHeroDark: ['#160d2a', '#0f0a1a'] as [string, string],
  pinkHeroDark: ['#1a0510', '#120008'] as [string, string],

  // v1.2.5-dev: time-aware hero gradient pairs for TodayScreen greeting card.
  // Picked by `new Date().getHours()` in a `useMemo` keyed on the hour value
  // (not the Date instance). Static — no animation, zero-cost swap.
  heroMorning:     ['#fef8ee', '#fff4d8'] as [string, string], // 05:00–10:59 warm gold-ivory
  heroAfternoon:   ['#fef8ee', '#fdf0d5'] as [string, string], // 11:00–16:59 default (= goldHero)
  heroEvening:     ['#fff0e5', '#ffe0cc'] as [string, string], // 17:00–20:59 warmer peach
  heroNight:       ['#f0ebf5', '#e6dff0'] as [string, string], // 21:00–04:59 cool lavender
  heroMorningDark:   ['#2a2100', '#1a1500'] as [string, string],
  heroAfternoonDark: ['#2a1f00', '#1a1400'] as [string, string], // = goldHeroDark
  heroEveningDark:   ['#2a1200', '#1a0a00'] as [string, string],
  heroNightDark:     ['#151028', '#0a0818'] as [string, string],
};

/**
 * v1.2.5-dev: Pick the time-aware hero gradient pair for a given hour.
 * Called from a `useMemo` keyed on the hour (0-23) — NEVER keyed on `new Date()`
 * directly, or the memo re-runs every render.
 */
export function heroGradientForHour(hour: number, dark: boolean): [string, string] {
  if (hour >= 5 && hour < 11) return dark ? gradients.heroMorningDark : gradients.heroMorning;
  if (hour >= 11 && hour < 17) return dark ? gradients.heroAfternoonDark : gradients.heroAfternoon;
  if (hour >= 17 && hour < 21) return dark ? gradients.heroEveningDark : gradients.heroEvening;
  return dark ? gradients.heroNightDark : gradients.heroNight; // 21:00–04:59
}
