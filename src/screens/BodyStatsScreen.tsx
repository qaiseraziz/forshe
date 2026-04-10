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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { todayISO, fmtISO } from '../utils/dates';
import { BodyLog, BloodSugarContext } from '../types';

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
  colors: ReturnType<typeof useTheme>['colors'];
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
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { bodyProfile, setBodyProfile, bodyLogs, setBodyLogs, bodyStatsSettings } = useData();

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
          onPress: () => setBodyLogs(l => l.filter(x => x.id !== id)),
        },
      ]);
    },
    [setBodyLogs],
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
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
            <View style={styles.heroTopRow}>
              <Text style={[styles.heroLabel, { color: colors.red }]}>💪 Body Stats</Text>
              <DrawerMenuButton />
            </View>
            <Text style={[styles.heroTitle, { color: colors.deep }]}>Track your vitals</Text>
            <Text style={[styles.heroSub, { color: colors.sub }]}>
              Log weight, blood pressure, sugar, oxygen and more in one place.
            </Text>
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
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
            <View style={styles.heroTopRow}>
              <Text style={[styles.heroLabel, { color: colors.red }]}>💪 Body Stats</Text>
              <DrawerMenuButton />
            </View>
            <Text style={[styles.heroTitle, { color: colors.deep }]}>Let's get started</Text>
            <Text style={[styles.heroSub, { color: colors.sub }]}>
              Tell us your height once — we'll use it to calculate BMI for every weigh-in.
            </Text>
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
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Card */}
        <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
          <View style={styles.heroTopRow}>
            <Text style={[styles.heroLabel, { color: colors.red }]}>💪 Body Stats</Text>
            <DrawerMenuButton />
          </View>
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
            text="No logs yet."
            hint="Log your first entry above to start tracking."
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
});
