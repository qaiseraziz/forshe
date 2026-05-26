import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { todayISO, fmtISO } from '../utils/dates';
import { BodyLog, BloodSugarContext } from '../types';
import {
  hennaColors,
  hennaFonts,
  hennaGradients,
  hennaRadii,
  hennaShadows,
  hennaTextStyles,
} from '../constants/hennaTokens';
import {
  HennaHeader,
  HennaButton,
  HennaCard,
  HennaIcon,
  HennaInput,
  HennaBadge,
  HennaPill,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
  DividerOrnament,
} from '../components/henna';

// Henna color shim — maps the legacy `colors.*` keys this screen still uses
// to the new Henna palette. This keeps the body of the screen unchanged
// while the visual layer is fully Henna.
const colors = {
  red: hennaColors.henna,
  redBg: hennaColors.hennaBg,
  green: hennaColors.sage,
  greenBg: hennaColors.sageBg,
  gold: hennaColors.bronze,
  goldBg: hennaColors.bronzeBg,
  purple: hennaColors.plum,
  purpleBg: hennaColors.plumBg,
  blue: hennaColors.plum,
  blueBg: hennaColors.plumBg,
  pink: hennaColors.pink,
  pinkBg: hennaColors.pinkBg,
  deep: hennaColors.ink,
  text: hennaColors.ink,
  sub: hennaColors.ink2,
  muted: hennaColors.muted,
  border: hennaColors.line,
  bg: hennaColors.pearl,
  bg2: hennaColors.paper,
  bg3: hennaColors.paper2,
};

// Replacements for ui/* components — re-export the Henna primitives under
// the legacy names this file uses.
const Card = HennaCard as any;
const Button = HennaButton as any;
const Input = HennaInput as any;
const Divider = ({ label }: { label: string }) => (
  <View style={{ paddingHorizontal: 8, paddingVertical: 14 }}>
    <DividerOrnament color={hennaColors.henna} />
    <Text style={{
      marginTop: 8,
      textAlign: 'center',
      fontFamily: hennaFonts.uiSemi,
      fontSize: 10,
      color: hennaColors.muted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    }}>{label}</Text>
  </View>
);
const EmptyState = ({ text, hint }: { icon?: string; text: string; hint?: string }) => (
  <View style={{ paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' }}>
    <Text style={{ fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' }}>{text}</Text>
    {hint ? <Text style={{ marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' }}>{hint}</Text> : null}
  </View>
);
const DrawerMenuButton = () => null; // header has its own menu button now

// --- Validation ranges ---
const RANGES = {
  weight: { min: 20, max: 300, unit: 'kg' },
  bpSys: { min: 60, max: 250, unit: 'mmHg' },
  bpDia: { min: 40, max: 150, unit: 'mmHg' },
  sugar: { min: 40, max: 600, unit: 'mg/dL' },
  oxygen: { min: 50, max: 100, unit: '%' },
  hr: { min: 30, max: 220, unit: 'bpm' },
  temp: { min: 30, max: 45, unit: '°C' },
} as const;

const SUGAR_CONTEXTS: { key: BloodSugarContext; label: string }[] = [
  { key: 'fasting', label: 'Fasting' },
  { key: 'post-meal', label: 'Post-meal' },
  { key: 'random', label: 'Random' },
];

const GENDER_OPTIONS: { key: 'female' | 'male' | 'other'; label: string }[] = [
  { key: 'female', label: '♀ Female' },
  { key: 'male', label: '♂ Male' },
  { key: 'other', label: 'Other' },
];

// --- BMI helpers ---
function calcBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

function bmiCategory(bmi: number): { label: string; key: 'low' | 'normal' | 'over' | 'obese' } {
  if (bmi < 18.5) return { label: 'Underweight', key: 'low' };
  if (bmi < 25) return { label: 'Normal', key: 'normal' };
  if (bmi < 30) return { label: 'Overweight', key: 'over' };
  return { label: 'Obese', key: 'obese' };
}

// --- Parse helper that allows empty ---
function parseOptFloat(s: string): number | undefined {
  if (!s.trim()) return undefined;
  const n = parseFloat(s);
  if (isNaN(n)) return NaN;
  return n;
}

function inRange(n: number | undefined, range: { min: number; max: number }): boolean {
  if (n === undefined) return true;
  if (isNaN(n)) return false;
  return n >= range.min && n <= range.max;
}

// --- Memoized log row ---
interface LogRowProps {
  log: BodyLog;
  onDelete: (id: number) => void;
  colors: typeof colors;
}
const LogRow = React.memo(function LogRow({ log, onDelete, colors }: LogRowProps) {
  const handleDelete = useCallback(() => onDelete(log.id), [onDelete, log.id]);

  const parts: string[] = [];
  if (log.weight !== undefined) parts.push(`⚖️ ${log.weight} kg`);
  if (log.bpSystolic !== undefined && log.bpDiastolic !== undefined) {
    parts.push(`🩺 ${log.bpSystolic}/${log.bpDiastolic}`);
  }
  if (log.bloodSugar !== undefined) {
    const ctx = log.bloodSugarContext ? ` (${log.bloodSugarContext})` : '';
    parts.push(`🍬 ${log.bloodSugar} mg/dL${ctx}`);
  }
  if (log.oxygen !== undefined) parts.push(`🫁 ${log.oxygen}%`);
  if (log.heartRate !== undefined) parts.push(`❤️ ${log.heartRate} bpm`);
  if (log.temperature !== undefined) parts.push(`🌡️ ${log.temperature}°C`);

  return (
    <Card style={styles.logCard}>
      <View style={styles.logRow}>
        <View style={[styles.logIcon, { backgroundColor: colors.redBg }]}>
          <Text style={styles.logIconText}>💪</Text>
        </View>
        <View style={styles.logContent}>
          <Text style={[styles.logTitle, { color: colors.deep }]}>{fmtISO(log.date)}</Text>
          <Text style={[styles.logMeta, { color: colors.muted }]}>
            {parts.length ? parts.join(' · ') : 'No metrics'}
          </Text>
          {log.notes ? (
            <Text style={[styles.logNotes, { color: colors.sub }]}>{log.notes}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteBtn}
          accessibilityLabel={`Delete body stats entry from ${fmtISO(log.date)}`}
          accessibilityRole="button"
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
});

export default function BodyStatsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);
  const { bodyProfile, setBodyProfile, bodyLogs, setBodyLogs, bodyStatsSettings, reminders, setReminders } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  // Height setup form (only shown when height not yet set)
  const [heightInput, setHeightInput] = useState('');
  const [birthYearInput, setBirthYearInput] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | ''>('');

  // Quick log form
  const [weight, setWeight] = useState('');
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [sugar, setSugar] = useState('');
  const [sugarCtx, setSugarCtx] = useState<BloodSugarContext>('fasting');
  const [oxygen, setOxygen] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');

  const hasHeight = bodyProfile.height > 0;
  const enabled = bodyStatsSettings.enabled;

  // v1.2 — today's medication reminders
  const todayMeds = useMemo(() => {
    const today = todayISO();
    return reminders
      .filter(r => r.cat === '💊 Medication' && r.date === today)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [reminders]);

  const toggleMedDone = useCallback((id: number) => {
    setReminders(r => r.map(x => (x.id === id ? { ...x, isDone: !x.isDone } : x)));
  }, [setReminders]);

  // --- Derived values ---
  const latestLog = useMemo(
    () => (bodyLogs.length ? [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date))[0] : null),
    [bodyLogs],
  );

  const daysSinceLast = useMemo(() => {
    if (!latestLog) return null;
    const today = new Date(todayISO());
    const last = new Date(latestLog.date);
    return Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000));
  }, [latestLog]);

  const latestBMI = useMemo(() => {
    if (!latestLog || latestLog.weight === undefined || !hasHeight) return null;
    const bmi = calcBMI(latestLog.weight, bodyProfile.height);
    if (bmi === null) return null;
    return { value: bmi, ...bmiCategory(bmi) };
  }, [latestLog, bodyProfile.height, hasHeight]);

  const displayLogs = useMemo(
    () => [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [bodyLogs],
  );

  // --- Insights & Alerts (single useMemo on bodyLogs + profile) ---
  const insights = useMemo(() => {
    type Stat = { key: string; label: string; value: string; icon: string };
    type Alert = {
      key: string;
      severity: 'warn' | 'urgent';
      icon: string;
      title: string;
      detail: string;
      reading: string;
      date: string;
    };

    const empty = { stats7: [] as Stat[], stats30: [] as Stat[], alerts: [] as Alert[] };
    if (!bodyLogs.length) return empty;

    const today = new Date(todayISO());
    const msDay = 86400000;
    const sorted = [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date));

    const inWindow = (days: number) =>
      sorted.filter(l => {
        const d = new Date(l.date);
        const diff = (today.getTime() - d.getTime()) / msDay;
        return diff >= 0 && diff <= days;
      });

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const buildStats = (days: number): Stat[] => {
      const win = inWindow(days);
      if (!win.length) return [];
      const out: Stat[] = [];

      // Weight delta: latest in window - earliest in window
      const weights = win.filter(l => l.weight !== undefined).sort((a, b) => a.date.localeCompare(b.date));
      if (weights.length >= 2) {
        const delta = (weights[weights.length - 1].weight as number) - (weights[0].weight as number);
        const sign = delta > 0 ? '+' : '';
        out.push({
          key: 'weight',
          label: 'Weight change',
          value: `${sign}${delta.toFixed(1)} kg`,
          icon: '⚖️',
        });
      } else if (weights.length === 1) {
        out.push({
          key: 'weight',
          label: 'Weight',
          value: `${weights[0].weight} kg`,
          icon: '⚖️',
        });
      }

      // Avg BP
      const bps = win.filter(l => l.bpSystolic !== undefined && l.bpDiastolic !== undefined);
      if (bps.length) {
        const avgSys = Math.round(avg(bps.map(l => l.bpSystolic as number)) as number);
        const avgDia = Math.round(avg(bps.map(l => l.bpDiastolic as number)) as number);
        out.push({
          key: 'bp',
          label: 'Avg BP',
          value: `${avgSys}/${avgDia}`,
          icon: '🩺',
        });
      }

      // Avg sugar
      const sugars = win.filter(l => l.bloodSugar !== undefined);
      if (sugars.length) {
        const avgSugar = Math.round(avg(sugars.map(l => l.bloodSugar as number)) as number);
        out.push({
          key: 'sugar',
          label: 'Avg sugar',
          value: `${avgSugar} mg/dL`,
          icon: '🍬',
        });
      }

      // Avg oxygen
      const oxys = win.filter(l => l.oxygen !== undefined);
      if (oxys.length) {
        const avgOx = Math.round(avg(oxys.map(l => l.oxygen as number)) as number);
        out.push({
          key: 'oxygen',
          label: 'Avg SpO2',
          value: `${avgOx}%`,
          icon: '🫁',
        });
      }

      // Avg heart rate
      const hrs = win.filter(l => l.heartRate !== undefined);
      if (hrs.length) {
        const avgHr = Math.round(avg(hrs.map(l => l.heartRate as number)) as number);
        out.push({
          key: 'hr',
          label: 'Avg HR',
          value: `${avgHr} bpm`,
          icon: '❤️',
        });
      }

      return out;
    };

    // Alerts — check the MOST RECENT reading for each metric (not averages)
    const alerts: Alert[] = [];
    const dateLabel = (iso: string) => fmtISO(iso);

    // Most recent BP
    const recentBP = sorted.find(l => l.bpSystolic !== undefined && l.bpDiastolic !== undefined);
    if (recentBP) {
      const sys = recentBP.bpSystolic as number;
      const dia = recentBP.bpDiastolic as number;
      if (sys >= 180 || dia >= 120) {
        alerts.push({
          key: 'bp-urgent',
          severity: 'urgent',
          icon: '🩺',
          title: 'Very high blood pressure',
          detail: 'This reading is in the hypertensive crisis range. Please seek medical attention.',
          reading: `${sys}/${dia} mmHg`,
          date: dateLabel(recentBP.date),
        });
      } else if (sys >= 140 || dia >= 90) {
        alerts.push({
          key: 'bp-high',
          severity: 'warn',
          icon: '🩺',
          title: 'High blood pressure',
          detail: 'Readings above 140/90 are considered high. Consider discussing with your doctor.',
          reading: `${sys}/${dia} mmHg`,
          date: dateLabel(recentBP.date),
        });
      } else if (sys < 90 || dia < 60) {
        alerts.push({
          key: 'bp-low',
          severity: 'warn',
          icon: '🩺',
          title: 'Low blood pressure',
          detail: 'Readings below 90/60 may indicate hypotension. Rest and hydrate if feeling unwell.',
          reading: `${sys}/${dia} mmHg`,
          date: dateLabel(recentBP.date),
        });
      }
    }

    // Most recent sugar
    const recentSugar = sorted.find(l => l.bloodSugar !== undefined);
    if (recentSugar) {
      const sug = recentSugar.bloodSugar as number;
      const ctx = recentSugar.bloodSugarContext;
      const ctxLabel = ctx ? ` (${ctx})` : '';
      if (sug < 70) {
        alerts.push({
          key: 'sugar-low',
          severity: 'warn',
          icon: '🍬',
          title: 'Low blood sugar',
          detail: 'Below 70 mg/dL is hypoglycemic. A small snack with quick carbs can help.',
          reading: `${sug} mg/dL${ctxLabel}`,
          date: dateLabel(recentSugar.date),
        });
      } else if (
        (ctx === 'fasting' && sug >= 126) ||
        (ctx === 'post-meal' && sug >= 200) ||
        (ctx === 'random' && sug >= 200) ||
        (!ctx && sug >= 200)
      ) {
        alerts.push({
          key: 'sugar-high',
          severity: 'warn',
          icon: '🍬',
          title: 'High blood sugar',
          detail: 'This reading is above the typical range. Consider discussing with your doctor.',
          reading: `${sug} mg/dL${ctxLabel}`,
          date: dateLabel(recentSugar.date),
        });
      }
    }

    // Most recent oxygen
    const recentOx = sorted.find(l => l.oxygen !== undefined);
    if (recentOx) {
      const ox = recentOx.oxygen as number;
      if (ox < 90) {
        alerts.push({
          key: 'ox-urgent',
          severity: 'urgent',
          icon: '🫁',
          title: 'Very low oxygen',
          detail: 'SpO2 below 90% is concerning. Please seek medical attention.',
          reading: `${ox}%`,
          date: dateLabel(recentOx.date),
        });
      } else if (ox < 95) {
        alerts.push({
          key: 'ox-low',
          severity: 'warn',
          icon: '🫁',
          title: 'Low oxygen',
          detail: 'SpO2 below 95% is below the normal range. Rest and re-check after a few minutes.',
          reading: `${ox}%`,
          date: dateLabel(recentOx.date),
        });
      }
    }

    // Most recent HR
    const recentHR = sorted.find(l => l.heartRate !== undefined);
    if (recentHR) {
      const hr = recentHR.heartRate as number;
      if (hr < 50 || hr > 100) {
        alerts.push({
          key: 'hr',
          severity: 'warn',
          icon: '❤️',
          title: 'Abnormal heart rate',
          detail: 'Resting heart rate outside 50-100 bpm may need attention. Consider re-measuring at rest.',
          reading: `${hr} bpm`,
          date: dateLabel(recentHR.date),
        });
      }
    }

    // BMI (needs latest weight + height)
    if (hasHeight) {
      const recentW = sorted.find(l => l.weight !== undefined);
      if (recentW) {
        const bmi = calcBMI(recentW.weight as number, bodyProfile.height);
        if (bmi !== null) {
          if (bmi >= 30) {
            alerts.push({
              key: 'bmi-obese',
              severity: 'warn',
              icon: '⚖️',
              title: 'BMI in obese range',
              detail: 'BMI above 30 is considered obese. Consider discussing a wellness plan with your doctor.',
              reading: `BMI ${bmi.toFixed(1)}`,
              date: dateLabel(recentW.date),
            });
          } else if (bmi < 18.5) {
            alerts.push({
              key: 'bmi-low',
              severity: 'warn',
              icon: '⚖️',
              title: 'BMI in underweight range',
              detail: 'BMI below 18.5 is considered underweight. A balanced, nourishing diet may help.',
              reading: `BMI ${bmi.toFixed(1)}`,
              date: dateLabel(recentW.date),
            });
          }
        }
      }
    }

    return {
      stats7: buildStats(7),
      stats30: buildStats(30),
      alerts,
    };
  }, [bodyLogs, bodyProfile.height, hasHeight]);

  // --- Handlers ---
  const goToSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const saveHeight = useCallback(() => {
    const h = parseFloat(heightInput);
    if (isNaN(h) || h < 50 || h > 260) {
      Alert.alert('Invalid Height', 'Please enter a height between 50 and 260 cm.');
      return;
    }
    let by: number | undefined;
    if (birthYearInput.trim()) {
      const yr = parseInt(birthYearInput, 10);
      const now = new Date().getFullYear();
      if (isNaN(yr) || yr < 1900 || yr > now) {
        Alert.alert('Invalid Birth Year', 'Please enter a valid birth year.');
        return;
      }
      by = yr;
    }
    setBodyProfile({
      height: h,
      heightUnit: 'cm',
      birthYear: by,
      gender: gender || undefined,
    });
  }, [heightInput, birthYearInput, gender, setBodyProfile]);

  const handleBirthYearChange = useCallback((t: string) => {
    setBirthYearInput(t.replace(/[^0-9]/g, '').slice(0, 4));
  }, []);

  const pickFemale = useCallback(() => setGender('female'), []);
  const pickMale = useCallback(() => setGender('male'), []);
  const pickOther = useCallback(() => setGender('other'), []);

  const resetForm = useCallback(() => {
    setWeight('');
    setBpSys('');
    setBpDia('');
    setSugar('');
    setSugarCtx('fasting');
    setOxygen('');
    setHeartRate('');
    setNotes('');
  }, []);

  const logEntry = useCallback(() => {
    const w = parseOptFloat(weight);
    const sys = parseOptFloat(bpSys);
    const dia = parseOptFloat(bpDia);
    const sug = parseOptFloat(sugar);
    const ox = parseOptFloat(oxygen);
    const hr = parseOptFloat(heartRate);

    if (!inRange(w, RANGES.weight)) {
      Alert.alert('Invalid Weight', `Weight must be ${RANGES.weight.min}-${RANGES.weight.max} kg.`);
      return;
    }
    if (!inRange(sys, RANGES.bpSys)) {
      Alert.alert('Invalid BP', `Systolic must be ${RANGES.bpSys.min}-${RANGES.bpSys.max} mmHg.`);
      return;
    }
    if (!inRange(dia, RANGES.bpDia)) {
      Alert.alert('Invalid BP', `Diastolic must be ${RANGES.bpDia.min}-${RANGES.bpDia.max} mmHg.`);
      return;
    }
    if ((sys !== undefined && dia === undefined) || (dia !== undefined && sys === undefined)) {
      Alert.alert('Invalid BP', 'Enter both systolic and diastolic, or neither.');
      return;
    }
    if (sys !== undefined && dia !== undefined && dia >= sys) {
      Alert.alert('Invalid BP', 'Diastolic must be lower than systolic.');
      return;
    }
    if (!inRange(sug, RANGES.sugar)) {
      Alert.alert('Invalid Blood Sugar', `Must be ${RANGES.sugar.min}-${RANGES.sugar.max} mg/dL.`);
      return;
    }
    if (!inRange(ox, RANGES.oxygen)) {
      Alert.alert('Invalid Oxygen', `SpO2 must be ${RANGES.oxygen.min}-${RANGES.oxygen.max}%.`);
      return;
    }
    if (!inRange(hr, RANGES.hr)) {
      Alert.alert('Invalid Heart Rate', `Must be ${RANGES.hr.min}-${RANGES.hr.max} bpm.`);
      return;
    }

    // At least one metric required
    if (
      w === undefined && sys === undefined && dia === undefined &&
      sug === undefined && ox === undefined && hr === undefined
    ) {
      Alert.alert('Nothing to Log', 'Enter at least one metric.');
      return;
    }

    const entry: BodyLog = {
      id: Date.now(),
      date: todayISO(),
      weight: w,
      bpSystolic: sys,
      bpDiastolic: dia,
      bloodSugar: sug,
      bloodSugarContext: sug !== undefined ? sugarCtx : undefined,
      oxygen: ox,
      heartRate: hr,
      notes: notes.trim() || undefined,
    };

    setBodyLogs(l => [entry, ...l]);
    resetForm();
  }, [weight, bpSys, bpDia, sugar, sugarCtx, oxygen, heartRate, notes, setBodyLogs, resetForm]);

  const deleteLog = useCallback(
    (id: number) => {
      Alert.alert('Delete Entry', 'Delete this body stats entry?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const entry = bodyLogs.find(x => x.id === id);
            setBodyLogs(l => l.filter(x => x.id !== id));
            if (entry) {
              showToast('Entry deleted', () => {
                setBodyLogs(l => [entry, ...l].sort((a, b) => b.id - a.id));
              });
            }
          },
        },
      ]);
    },
    [bodyLogs, setBodyLogs, showToast],
  );

  const pickFasting = useCallback(() => setSugarCtx('fasting'), []);
  const pickPostMeal = useCallback(() => setSugarCtx('post-meal'), []);
  const pickRandom = useCallback(() => setSugarCtx('random'), []);

  const sugarCtxHandlers: Record<BloodSugarContext, () => void> = useMemo(
    () => ({ fasting: pickFasting, 'post-meal': pickPostMeal, random: pickRandom }),
    [pickFasting, pickPostMeal, pickRandom],
  );

  // --- Disabled state ---
  if (!enabled) {
    return (
      <LinearGradient colors={hennaGradients.page} style={styles.container}>
        <HennaHeader title="Body Stats" onMenu={onMenu} style={{ paddingTop: insets.top + 6 }} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: 0 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <View style={styles.heroHeaderRow}>
              <DrawerMenuButton />
              <View style={styles.heroHeaderText}>
                <Text style={[styles.heroLabel, { color: colors.red }]}>💪 Body Stats</Text>
                <Text style={[styles.heroTitle, { color: colors.deep }]}>Track your vitals</Text>
                <Text style={[styles.heroSub, { color: colors.sub }]}>
                  Log weight, blood pressure, sugar, oxygen and more in one place.
                </Text>
              </View>
            </View>
          </Card>

          <EmptyState
            icon="💤"
            text="Body Stats is currently disabled."
            hint="Enable it in Settings to start logging your vitals."
          />

          <Button
            title="Enable in Settings"
            variant="gold"
            full
            onPress={goToSettings}
            style={styles.enableBtn}
          />

          <View style={styles.bottomPad} />
        </ScrollView>
      </LinearGradient>
    );
  }

  // --- Height setup state ---
  if (!hasHeight) {
    return (
      <LinearGradient colors={hennaGradients.page} style={styles.container}>
        <HennaHeader title="Body Stats" onMenu={onMenu} style={{ paddingTop: insets.top + 6 }} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: 0 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <View style={styles.heroHeaderRow}>
              <DrawerMenuButton />
              <View style={styles.heroHeaderText}>
                <Text style={[styles.heroLabel, { color: colors.red }]}>💪 Body Stats</Text>
                <Text style={[styles.heroTitle, { color: colors.deep }]}>Let's get started</Text>
                <Text style={[styles.heroSub, { color: colors.sub }]}>
                  Tell us your height once — we'll use it to calculate BMI for every weigh-in.
                </Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: colors.red }]}>📏 Your Profile</Text>

            <Input
              label="Height (cm)"
              placeholder="e.g. 162"
              keyboardType="numeric"
              value={heightInput}
              onChangeText={setHeightInput}
              style={styles.inputSpace}
            />

            <Input
              label="Birth Year (optional)"
              placeholder="e.g. 1990"
              keyboardType="numeric"
              value={birthYearInput}
              onChangeText={handleBirthYearChange}
              style={styles.inputSpace}
            />

            <Text style={[styles.fieldLabel, { color: colors.muted }]}>GENDER (OPTIONAL)</Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map(g => {
                const active = gender === g.key;
                const onPress =
                  g.key === 'female' ? pickFemale : g.key === 'male' ? pickMale : pickOther;
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={onPress}
                    accessibilityRole="button"
                    accessibilityLabel={`Select gender ${g.label}`}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? colors.red : colors.bg3 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? '#fff' : colors.sub },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Save Profile"
              variant="gold"
              full
              onPress={saveHeight}
              style={styles.inputSpace}
            />
          </Card>

          <View style={styles.bottomPad} />
        </ScrollView>
      </LinearGradient>
    );
  }

  // --- Main logging screen ---
  return (
    <LinearGradient colors={hennaGradients.page} style={styles.container}>
      <HennaHeader title="Body Stats" onMenu={onMenu} style={{ paddingTop: insets.top + 6 }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Card */}
        <Card>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.red }]}>💪 Body Stats</Text>
              <Text style={[styles.heroNumber, { color: colors.red }]}>
                {latestLog?.weight !== undefined ? `${latestLog.weight} kg` : '—'}
              </Text>
              <Text style={[styles.heroSub, { color: colors.sub }]}>
                {daysSinceLast === null
                  ? 'No logs yet — add your first below'
                  : daysSinceLast === 0
                    ? 'Logged today'
                    : `${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'} since last log`}
              </Text>
            </View>
          </View>

          {latestBMI && (
            <View style={styles.bmiRow}>
              <View style={styles.bmiItem}>
                <Text style={[styles.statVal, { color: colors.red }]}>
                  {latestBMI.value.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>BMI</Text>
              </View>
              <View style={styles.bmiItem}>
                <Text style={[styles.statVal, { color: colors.red }]}>{latestBMI.label}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Category</Text>
              </View>
              <View style={styles.bmiItem}>
                <Text style={[styles.statVal, { color: colors.red }]}>{bodyLogs.length}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Logged</Text>
              </View>
            </View>
          )}
        </Card>

        {/* v1.2 — Today's Medication */}
        {todayMeds.length > 0 && (
          <Card>
            <Text style={[styles.medHeader, { color: colors.purple }]}>💊 Today's Medication</Text>
            {todayMeds.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.medRow, { borderBottomColor: colors.border }]}
                onPress={() => toggleMedDone(m.id)}
                activeOpacity={0.7}
                accessibilityLabel={m.isDone ? `Mark ${m.title} as not taken` : `Mark ${m.title} as taken`}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.medCheck,
                    {
                      backgroundColor: m.isDone ? colors.green : 'transparent',
                      borderColor: m.isDone ? colors.green : colors.muted,
                    },
                  ]}
                >
                  {m.isDone && <Text style={styles.medCheckMark}>✓</Text>}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      styles.medTitle,
                      { color: colors.deep },
                      m.isDone && { textDecorationLine: 'line-through', color: colors.muted },
                    ]}
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                  <Text style={[styles.medMeta, { color: colors.muted }]}>
                    {m.time ? `⏰ ${m.time}` : 'Today'}
                    {m.dosage ? ` · ${m.dosage}` : ''}
                    {m.withFood ? ' · with food' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Health Alerts */}
        {insights.alerts.length > 0 && (
          <View style={styles.alertsWrap}>
            {insights.alerts.map(a => {
              const urgent = a.severity === 'urgent';
              const bg = urgent ? colors.redBg : colors.goldBg;
              const accent = urgent ? colors.red : colors.gold;
              return (
                <View
                  key={a.key}
                  style={[styles.alertCard, { backgroundColor: bg }]}
                  accessibilityRole="alert"
                  accessibilityLabel={`${urgent ? 'Urgent' : 'Warning'}: ${a.title}. ${a.detail}. Recent reading ${a.reading} on ${a.date}.`}
                >
                  <View style={styles.alertHeaderRow}>
                    <Text style={styles.alertIcon}>{a.icon}</Text>
                    <Text style={[styles.alertTitle, { color: accent }]}>{a.title}</Text>
                  </View>
                  <Text style={[styles.alertDetail, { color: colors.sub }]}>{a.detail}</Text>
                  <Text style={[styles.alertReading, { color: colors.muted }]}>
                    Most recent: {a.reading} · {a.date}
                  </Text>
                </View>
              );
            })}
            <Text style={[styles.alertDisclaimer, { color: colors.muted }]}>
              ⚠️ This is not medical advice. Always consult a qualified healthcare provider.
            </Text>
          </View>
        )}

        {/* Insights — 7 day + 30 day summary */}
        {(insights.stats7.length > 0 || insights.stats30.length > 0) && (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.red }]}>📊 Insights</Text>

            {insights.stats7.length > 0 && (
              <View style={styles.insightsBlock}>
                <Text style={[styles.insightsLabel, { color: colors.muted }]}>LAST 7 DAYS</Text>
                <View style={styles.insightsGrid}>
                  {insights.stats7.map(s => (
                    <View
                      key={s.key}
                      style={[styles.insightTile, { backgroundColor: colors.bg3 }]}
                    >
                      <Text style={styles.insightIcon}>{s.icon}</Text>
                      <Text style={[styles.insightVal, { color: colors.deep }]}>{s.value}</Text>
                      <Text style={[styles.insightLabel, { color: colors.muted }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {insights.stats30.length > 0 && (
              <View style={styles.insightsBlock}>
                <Text style={[styles.insightsLabel, { color: colors.muted }]}>LAST 30 DAYS</Text>
                <View style={styles.insightsGrid}>
                  {insights.stats30.map(s => (
                    <View
                      key={s.key}
                      style={[styles.insightTile, { backgroundColor: colors.bg3 }]}
                    >
                      <Text style={styles.insightIcon}>{s.icon}</Text>
                      <Text style={[styles.insightVal, { color: colors.deep }]}>{s.value}</Text>
                      <Text style={[styles.insightLabel, { color: colors.muted }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Quick Log Form */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.red }]}>📝 Quick Log</Text>
          <Text style={[styles.dateHint, { color: colors.muted }]}>
            📅 Today · {fmtISO(todayISO())}
          </Text>

          <Input
            label="Weight (kg)"
            placeholder="e.g. 62.5"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            style={styles.inputSpace}
          />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>BLOOD PRESSURE</Text>
          <View style={styles.bpRow}>
            <View style={styles.bpFlex}>
              <Input
                placeholder="Sys"
                keyboardType="numeric"
                value={bpSys}
                onChangeText={setBpSys}
              />
            </View>
            <Text style={[styles.bpSep, { color: colors.muted }]}>/</Text>
            <View style={styles.bpFlex}>
              <Input
                placeholder="Dia"
                keyboardType="numeric"
                value={bpDia}
                onChangeText={setBpDia}
              />
            </View>
          </View>

          <Input
            label="Blood Sugar (mg/dL)"
            placeholder="e.g. 95"
            keyboardType="numeric"
            value={sugar}
            onChangeText={setSugar}
            style={styles.inputSpace}
          />
          <View style={styles.chipRow}>
            {SUGAR_CONTEXTS.map(c => {
              const active = sugarCtx === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={sugarCtxHandlers[c.key]}
                  accessibilityRole="button"
                  accessibilityLabel={`Blood sugar context ${c.label}`}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? colors.red : colors.bg3 },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? '#fff' : colors.sub },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputSpace}>
            <Input
              label="Oxygen SpO2 (%)"
              placeholder="e.g. 98"
              keyboardType="numeric"
              value={oxygen}
              onChangeText={setOxygen}
            />
          </View>

          <View style={styles.inputSpace}>
            <Input
              label="Heart Rate (bpm)"
              placeholder="e.g. 72"
              keyboardType="numeric"
              value={heartRate}
              onChangeText={setHeartRate}
            />
          </View>

          <View style={styles.inputSpace}>
            <Input
              label="Notes (optional)"
              placeholder="e.g. after walk"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <Button
            title="+ Log Entry"
            variant="gold"
            full
            onPress={logEntry}
            style={styles.logBtn}
          />
        </Card>

        {/* Recent Logs */}
        <Divider label={`Recent Logs · ${bodyLogs.length} entries`} />

        {!bodyLogs.length && (
          <EmptyState
            icon="💪"
            text="Log your first measurement to see insights over time."
            hint="Just a weight or BP today is enough to start the trend."
          />
        )}

        {displayLogs.map(log => (
          <LogRow key={log.id} log={log} onDelete={deleteLog} colors={colors} />
        ))}

        {/* Medical disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: `${colors.red}10` }]}>
          <Text style={[styles.disclaimerText, { color: colors.muted }]}>
            ⚠️ This tracker is for informational purposes only. It does not replace professional
            medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  // v1.2 — today's medication card
  medHeader: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  medCheck: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  medCheckMark: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold' },
  medTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  medMeta: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  heroNumber: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 42,
    lineHeight: 48,
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
  },
  bmiRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  bmiItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    marginBottom: 10,
  },
  dateHint: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    marginBottom: 14,
  },
  inputSpace: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 10,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpFlex: { flex: 1 },
  bpSep: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    paddingHorizontal: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  logBtn: {
    marginTop: 18,
  },
  enableBtn: {
    marginTop: 12,
  },
  logCard: {
    marginBottom: 8,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  logIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logIconText: {
    fontSize: 19,
  },
  logContent: {
    flex: 1,
    minWidth: 0,
  },
  logTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    marginBottom: 3,
  },
  logMeta: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    lineHeight: 18,
  },
  logNotes: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: { fontSize: 18 },
  disclaimer: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomPad: { height: 40 },
  alertsWrap: {
    marginTop: 12,
  },
  alertCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  alertIcon: {
    fontSize: 22,
  },
  alertTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    flex: 1,
  },
  alertDetail: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    lineHeight: 19,
    marginBottom: 6,
  },
  alertReading: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
  },
  alertDisclaimer: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 16,
  },
  insightsBlock: {
    marginTop: 8,
  },
  insightsLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insightTile: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
  },
  insightIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  insightVal: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
