/**
 * Prayer Times + Sunnah Fasting helpers (v1.2.2-dev)
 *
 * Wraps the Batoul Apps `adhan` library for salah computation and schedules
 * prayer + fasting notifications via `expo-notifications` typed DATE triggers.
 *
 * adhan is pure JS, MIT-licensed, no native deps — SDK 55 safe.
 */
import * as Notifications from 'expo-notifications';
import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  PrayerTimes,
  Madhab,
  HighLatitudeRule as AdhanHighLatitudeRule,
} from 'adhan';
import type {
  PrayerSettings,
  CalculationMethodKey,
  AsrJuristicMethod,
  HighLatitudeRule,
  HijriOffset,
} from '../types';

export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface DayPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

const METHOD_LABELS: Record<CalculationMethodKey, string> = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm al-Qura, Makkah',
  Dubai: 'Dubai',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  MoonsightingCommittee: 'Moonsighting Committee',
  NorthAmerica: 'North America (ISNA)',
  Turkey: 'Turkey (Diyanet)',
  Tehran: 'Institute of Geophysics, Tehran',
  Singapore: 'Singapore',
};

const HIGH_LAT_LABELS: Record<HighLatitudeRule, string> = {
  MiddleOfTheNight: 'Middle of the Night',
  SeventhOfTheNight: 'Seventh of the Night',
  TwilightAngle: 'Twilight Angle',
};

export const METHOD_OPTIONS: { key: CalculationMethodKey; label: string }[] = (
  Object.keys(METHOD_LABELS) as CalculationMethodKey[]
).map(k => ({ key: k, label: METHOD_LABELS[k] }));

export const HIGH_LAT_OPTIONS: { key: HighLatitudeRule; label: string }[] = (
  Object.keys(HIGH_LAT_LABELS) as HighLatitudeRule[]
).map(k => ({ key: k, label: HIGH_LAT_LABELS[k] }));

export const ASR_OPTIONS: { key: AsrJuristicMethod; label: string }[] = [
  { key: 'Standard', label: 'Standard (Shafi / Maliki / Hanbali)' },
  { key: 'Hanafi', label: 'Hanafi' },
];

/** Pakistani fallback cities for when GPS is denied / unavailable. */
export const PAKISTAN_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  { name: 'Rawalpindi', lat: 33.5651, lng: 73.0169 },
  { name: 'Faisalabad', lat: 31.4504, lng: 73.1350 },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249 },
  { name: 'Quetta', lat: 30.1798, lng: 66.9750 },
  { name: 'Multan', lat: 30.1575, lng: 71.5249 },
];

function buildParameters(settings: PrayerSettings): CalculationParameters {
  const methodBuilder =
    (CalculationMethod as unknown as Record<string, () => CalculationParameters>)[settings.method];
  const params = methodBuilder ? methodBuilder() : CalculationMethod.Karachi();
  params.madhab = settings.asrMethod === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  switch (settings.highLatitudeRule) {
    case 'SeventhOfTheNight':
      params.highLatitudeRule = AdhanHighLatitudeRule.SeventhOfTheNight;
      break;
    case 'TwilightAngle':
      params.highLatitudeRule = AdhanHighLatitudeRule.TwilightAngle;
      break;
    case 'MiddleOfTheNight':
    default:
      params.highLatitudeRule = AdhanHighLatitudeRule.MiddleOfTheNight;
      break;
  }
  return params;
}

/** Compute the six daily prayer times for a given date + settings. */
export function computePrayerTimes(date: Date, settings: PrayerSettings): DayPrayerTimes | null {
  if (!settings.location) return null;
  const coords = new Coordinates(settings.location.lat, settings.location.lng);
  const params = buildParameters(settings);
  const pt = new PrayerTimes(coords, date, params);
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

/** Get the next prayer after `now` within today (or Fajr tomorrow if Isha passed). */
export function getNextPrayer(
  times: DayPrayerTimes,
  now: Date = new Date(),
): { name: PrayerName; time: Date; minutesUntil: number } {
  const order: { name: PrayerName; time: Date }[] = [
    { name: 'Fajr', time: times.fajr },
    { name: 'Sunrise', time: times.sunrise },
    { name: 'Dhuhr', time: times.dhuhr },
    { name: 'Asr', time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isha', time: times.isha },
  ];
  for (const p of order) {
    if (p.time.getTime() > now.getTime()) {
      return {
        name: p.name,
        time: p.time,
        minutesUntil: Math.round((p.time.getTime() - now.getTime()) / 60000),
      };
    }
  }
  // Isha has passed — return a synthetic "next is Fajr tomorrow"
  const tmr = new Date(now.getTime() + 86400000);
  tmr.setHours(0, 0, 0, 0);
  return {
    name: 'Fajr',
    time: tmr,
    minutesUntil: Math.round((tmr.getTime() - now.getTime()) / 60000),
  };
}

export function formatPrayerTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Cancel any previously scheduled notifications by ID, silently ignoring gone ones. */
async function cancelIds(ids?: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      /* ignore */
    }
  }
}

async function ensurePermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted || req.status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule the 5 obligatory prayer notifications for today + next 6 days (7 total),
 * respecting each prayer's individual toggle. Cancels previous IDs first.
 */
export async function schedulePrayerNotifications(settings: PrayerSettings): Promise<string[]> {
  await cancelIds(settings.prayerNotifIds);
  if (!settings.enabled || !settings.location) return [];
  const granted = await ensurePermission();
  if (!granted) return [];

  const ids: string[] = [];
  const now = new Date();
  const prayerToggles: { name: PrayerName; enabled: boolean }[] = [
    { name: 'Fajr', enabled: settings.prayerNotifyFajr },
    { name: 'Dhuhr', enabled: settings.prayerNotifyDhuhr },
    { name: 'Asr', enabled: settings.prayerNotifyAsr },
    { name: 'Maghrib', enabled: settings.prayerNotifyMaghrib },
    { name: 'Isha', enabled: settings.prayerNotifyIsha },
  ];

  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const times = computePrayerTimes(day, settings);
    if (!times) continue;
    const lookup: Record<PrayerName, Date> = {
      Fajr: times.fajr,
      Sunrise: times.sunrise,
      Dhuhr: times.dhuhr,
      Asr: times.asr,
      Maghrib: times.maghrib,
      Isha: times.isha,
    };
    for (const p of prayerToggles) {
      if (!p.enabled) continue;
      const when = lookup[p.name];
      if (when.getTime() <= now.getTime()) continue; // skip already-passed
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 ${p.name} — ${formatPrayerTime(when)}`,
            body: 'Time for salah',
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
        ids.push(id);
      } catch {
        /* ignore per-notif errors */
      }
    }
  }
  return ids;
}

/**
 * v1.2.12-dev: Hijri date for an arbitrary Gregorian `date`, with an optional
 * per-country `offset` (days) applied BEFORE the conversion so month/year
 * rollovers are handled correctly by the Date object. Uses
 * `Intl.DateTimeFormat('en-u-ca-islamic-umalqura', …)` and falls back to a
 * coarse arithmetic calculation if the Intl Islamic calendar isn't available
 * on the device.
 */
export function hijriForDate(
  gregorianDate: Date,
  offset: number = 0,
): { day: number; month: number; monthName: string; year: number } {
  // Apply the offset by shifting the underlying Date. JS Date correctly rolls
  // months/years; the Intl converter then produces the right Hijri values.
  const baseDate = new Date(gregorianDate);
  if (offset !== 0) baseDate.setDate(baseDate.getDate() + offset);
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const nameFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'long' });
    const parts = fmt.formatToParts(baseDate);
    const pick = (t: string) => parts.find(p => p.type === t)?.value ?? '';
    const year = parseInt(pick('year'), 10);
    const month = parseInt(pick('month'), 10);
    const day = parseInt(pick('day'), 10);
    const monthName = nameFmt.format(baseDate).replace(/\sAH$/, '').trim();
    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) throw new Error('bad parse');
    return { day, month, monthName, year };
  } catch {
    // Coarse fallback based on a fixed anchor (2024-07-07 Gregorian ≈ 1 Muharram 1446 AH).
    const anchorGregorian = new Date(2024, 6, 7).getTime();
    const days = Math.floor((baseDate.getTime() - anchorGregorian) / 86400000);
    const hijriDaysSinceAnchor = days;
    // Approx 354.37 days per Hijri year, 29.53 per month — rough only.
    const year = 1446 + Math.floor(hijriDaysSinceAnchor / 354.37);
    const yearDay = Math.floor(hijriDaysSinceAnchor - (year - 1446) * 354.37);
    const month = Math.min(12, Math.max(1, Math.floor(yearDay / 29.53) + 1));
    const day = Math.max(1, Math.floor(yearDay - (month - 1) * 29.53) + 1);
    const HIJRI_MONTHS = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal',
      'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah',
    ];
    return { day, month, monthName: HIJRI_MONTHS[month - 1] || 'Muharram', year };
  }
}

/**
 * Today's Hijri date. Pass the user's `offset` from `PrayerSettings.hijriOffset`
 * so the returned value matches local moon sighting. `offset` defaults to 0.
 */
export function hijriToday(
  offset: number = 0,
): { day: number; month: number; monthName: string; year: number } {
  return hijriForDate(new Date(), offset);
}

/** Is today (optionally for a given date) Monday or Thursday? Returns the
 * weekday label or null — mirrors the v1.2.2-dev API used by PrayerTimesScreen. */
export function isSunnahWeekday(date: Date = new Date()): 'Monday' | 'Thursday' | null {
  const d = date.getDay();
  if (d === 1) return 'Monday';
  if (d === 4) return 'Thursday';
  return null;
}

/** v1.2.12-dev: simple boolean variant — day-of-week 1 (Mon) or 4 (Thu). */
export function isMondayOrThursday(gregorianDate: Date): boolean {
  const dow = gregorianDate.getDay();
  return dow === 1 || dow === 4;
}

/**
 * v1.2.12-dev: takes a Hijri day-of-month number and returns whether it falls
 * within Ayyam al-Bid (the 13th, 14th, or 15th — the "white days"). This is the
 * primitive form used by the calendar grid.
 */
export function isAyyamAlBid(hijriDay: number): boolean {
  return hijriDay === 13 || hijriDay === 14 || hijriDay === 15;
}

/**
 * Convenience: same idea as `isAyyamAlBid` but keyed on a Gregorian `date` so
 * legacy callers (PrayerTimesScreen, TodayScreen spiritualBadge) keep working.
 * Returns 1/2/3 for the position within the 3-day window, or null.
 */
export function ayyamAlBidPositionForDate(
  date: Date = new Date(),
  offset: number = 0,
): number | null {
  const h = hijriForDate(date, offset);
  if (h.day >= 13 && h.day <= 15) return h.day - 12;
  return null;
}

/**
 * v1.2.12-dev: maps a reverse-geocoded country name/code to the recommended
 * default `hijriOffset`. Pakistan / India / Bangladesh / Afghanistan typically
 * run a day behind the Umm al-Qura astronomical calendar due to the local
 * moon-sighting convention — defaulting new users to +1 gets them closer to
 * what their local mosque announces. If the country can't be determined, the
 * caller should leave the existing offset unchanged.
 */
export function countryToHijriOffset(rawCountry: string | null | undefined): HijriOffset {
  if (!rawCountry) return 0;
  const c = rawCountry.trim().toLowerCase();
  // Local moon-sighting typically runs a day AFTER Umm al-Qura's astronomical date,
  // so ADDING 1 day to the base Hijri calculation aligns with the local announcement.
  const plusOne = [
    'pakistan', 'pk',
    'india', 'in',
    'bangladesh', 'bd',
    'afghanistan', 'af',
  ];
  if (plusOne.includes(c)) return 1;
  // Most Gulf / Arab / SE Asia / Western countries follow (or closely track)
  // Saudi Arabia's Umm al-Qura — the library's base value — so the default
  // offset of 0 is correct. Listed here for clarity / future tuning.
  const zero = [
    'saudi arabia', 'sa',
    'united arab emirates', 'uae', 'ae',
    'qatar', 'qa',
    'kuwait', 'kw',
    'oman', 'om',
    'bahrain', 'bh',
    'egypt', 'eg',
    'morocco', 'ma',
    'tunisia', 'tn',
    'indonesia', 'id',
    'malaysia', 'my',
    'singapore', 'sg',
    'united kingdom', 'uk', 'gb',
    'united states', 'usa', 'us',
    'canada', 'ca',
  ];
  if (zero.includes(c)) return 0;
  return 0;
}

/**
 * Schedule Sunnah fasting reminders for:
 *  - Next 4 weeks of Mondays & Thursdays (if `mondayThursdayFasting`), fired ~20:00 the night before
 *  - Next 2 upcoming Ayyam al-Bid windows (if `ayyamAlBidFasting`), fired ~20:00 the night before 13 Hijri
 * Cancels previous IDs first. Returns the new IDs (empty if disabled / permission denied).
 */
export async function scheduleFastingNotifications(settings: PrayerSettings): Promise<string[]> {
  await cancelIds(settings.fastingNotifIds);
  if (!settings.enabled) return [];
  if (!settings.mondayThursdayFasting && !settings.ayyamAlBidFasting) return [];
  const granted = await ensurePermission();
  if (!granted) return [];

  const ids: string[] = [];
  const now = new Date();

  // Monday/Thursday — the night before (Sunday / Wednesday evening)
  if (settings.mondayThursdayFasting) {
    for (let offset = 0; offset < 28; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 20, 0, 0, 0);
      const nextDayDOW = new Date(d.getTime() + 86400000).getDay(); // what day IS tomorrow after d?
      if (nextDayDOW !== 1 && nextDayDOW !== 4) continue;
      if (d.getTime() <= now.getTime()) continue;
      const dayName = nextDayDOW === 1 ? 'Monday' : 'Thursday';
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🌙 Sunnah fasting tomorrow',
            body: `Intend to fast ${dayName} — niyyah tonight, suhoor before Fajr.`,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d },
        });
        ids.push(id);
      } catch {
        /* ignore */
      }
    }
  }

  // Ayyam al-Bid — reminder the night before the 13th of each of the next 2 Hijri months
  if (settings.ayyamAlBidFasting) {
    let found = 0;
    const hijriOffset = settings.hijriOffset ?? 0;
    for (let offset = 0; offset < 90 && found < 2; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const nextDay = new Date(d.getTime() + 86400000);
      const h = hijriForDate(nextDay, hijriOffset);
      if (h.day !== 13) continue;
      const when = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 20, 0, 0, 0);
      if (when.getTime() <= now.getTime()) continue;
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🌕 Ayyam al-Bid starts tomorrow',
            body: 'The white days (13, 14, 15 Hijri) — intend to fast tonight.',
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
        ids.push(id);
        found++;
      } catch {
        /* ignore */
      }
    }
  }

  return ids;
}

export function methodLabel(k: CalculationMethodKey): string {
  return METHOD_LABELS[k] || k;
}
