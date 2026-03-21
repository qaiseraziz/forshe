import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { SYMPTOM_OPTIONS, FLOW_OPTIONS } from '../constants/data';
import { fmtISO, daysBetween, addDays, dateToISO } from '../utils/dates';
import { PeriodLog } from '../types';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function CycleScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { periods, setPeriods } = useData();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [flow, setFlow] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const toggleSym = (sym: string) =>
    setSymptoms(s => (s.includes(sym) ? s.filter(x => x !== sym) : [...s, sym]));

  // Calculations
  const sorted = useMemo(
    () => [...periods].sort((a, b) => a.start.localeCompare(b.start)),
    [periods],
  );

  const durations = useMemo(
    () => sorted.filter(p => p.end).map(p => daysBetween(p.start, p.end) + 1),
    [sorted],
  );

  const cycles = useMemo(() => {
    const c: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      c.push(daysBetween(sorted[i - 1].start, sorted[i].start));
    }
    return c;
  }, [sorted]);

  const avgCycle = cycles.length
    ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
    : null;
  const avgDur = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const predictions = useMemo(() => {
    if (sorted.length < 2 || !avgCycle) return null;
    const last = sorted[sorted.length - 1];
    const nextStart = addDays(last.start, avgCycle);
    const ovulation = addDays(nextStart, -14);
    const fertileStart = addDays(ovulation, -2);
    const fertileEnd = addDays(ovulation, 2);
    const pmsStart = addDays(nextStart, -5);

    const now = new Date();
    const lastDate = new Date(last.start);
    const dayInCycle = Math.round((now.getTime() - lastDate.getTime()) / 86400000);
    const cyclePct = Math.min(Math.round((dayInCycle / avgCycle) * 100), 100);

    const daysUntilNext = Math.round(
      (new Date(nextStart).getTime() - now.getTime()) / 86400000,
    );

    return {
      nextStart,
      ovulation,
      fertileStart,
      fertileEnd,
      pmsStart,
      dayInCycle,
      cyclePct,
      daysUntilNext,
    };
  }, [sorted, avgCycle]);

  const addLog = useCallback(() => {
    const start = dateToISO(startDate);
    const end = endDate ? dateToISO(endDate) : '';

    if (end && end < start) {
      Alert.alert('Invalid Dates', "End date can't be before start date.");
      return;
    }
    if (periods.some(p => p.start === start)) {
      Alert.alert('Duplicate', 'An entry for this start date already exists.');
      return;
    }

    const log: PeriodLog = {
      id: Date.now(),
      start,
      end,
      notes,
      flow,
      symptoms: [...symptoms],
    };

    setPeriods(l =>
      [log, ...l].sort((a, b) => b.start.localeCompare(a.start)),
    );
    setEndDate(null);
    setNotes('');
    setFlow('');
    setSymptoms([]);
  }, [startDate, endDate, flow, symptoms, notes, periods, setPeriods]);

  const deleteLog = useCallback(
    (id: number) => {
      Alert.alert('Delete Entry', 'Are you sure you want to delete this period log?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setPeriods(l => l.filter(x => x.id !== id)),
        },
      ]);
    },
    [setPeriods],
  );

  const onStartChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selected) setStartDate(selected);
  };

  const onEndChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selected) setEndDate(selected);
  };

  // descending for display
  const displayPeriods = useMemo(
    () => [...periods].sort((a, b) => b.start.localeCompare(a.start)),
    [periods],
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card */}
      <Card style={{ backgroundColor: colors.pinkBg, borderColor: colors.pinkBorder }}>
        <View style={styles.heroTopRow}>
          <Text style={[styles.heroLabel, { color: colors.pink }]}>🌸 Next Period</Text>
          <DrawerMenuButton />
        </View>
        <Text style={[styles.heroDate, { color: colors.pink }]}>
          {predictions ? fmtISO(predictions.nextStart) : '—'}
        </Text>
        <Text style={[styles.heroSub, { color: colors.sub }]}>
          {predictions
            ? predictions.daysUntilNext > 0
              ? `In ${predictions.daysUntilNext} days`
              : predictions.daysUntilNext === 0
                ? 'Today!'
                : `${Math.abs(predictions.daysUntilNext)} days ago`
            : 'Log at least 2 cycles to predict'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.pink }]}>
              {avgCycle ? avgCycle + 'd' : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Cycle</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.pink }]}>
              {avgDur ? avgDur + 'd' : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.pink }]}>{periods.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Logged</Text>
          </View>
        </View>
      </Card>

      {/* Prediction Card */}
      {predictions && (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.pink }]}>📊 Cycle Insights</Text>

          {/* Cycle Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: colors.muted }]}>Day 1</Text>
              <Text style={[styles.progressLabel, { color: colors.muted }]}>Day {avgCycle}</Text>
            </View>
            <ProgressBar
              percent={predictions.cyclePct}
              fillColor={colors.pink}
              bgColor={colors.pinkBg}
              height={10}
            />
            <Text style={[styles.progressMeta, { color: colors.muted }]}>
              Day {predictions.dayInCycle} of ~{avgCycle}-day cycle
            </Text>
          </View>

          {/* Prediction Rows */}
          {[
            {
              color: colors.pink,
              label: 'Next Period',
              value:
                fmtISO(predictions.nextStart) +
                (avgDur ? ` – ${fmtISO(addDays(predictions.nextStart, avgDur - 1))}` : ''),
            },
            {
              color: colors.gold,
              label: 'Ovulation (est.)',
              value: fmtISO(predictions.ovulation),
            },
            {
              color: colors.green,
              label: 'Fertile Window',
              value: `${fmtISO(predictions.fertileStart)} – ${fmtISO(predictions.fertileEnd)}`,
            },
            {
              color: colors.purple,
              label: 'PMS (est.)',
              value: `from ${fmtISO(predictions.pmsStart)}`,
            },
          ].map(row => (
            <View key={row.label} style={styles.predictRow}>
              <View style={[styles.predictDot, { backgroundColor: row.color }]} />
              <Text style={[styles.predictLabel, { color: colors.sub }]}>{row.label}</Text>
              <Text style={[styles.predictValue, { color: colors.deep }]}>{row.value}</Text>
            </View>
          ))}

          <View style={[styles.disclaimer, { backgroundColor: `${colors.pink}12` }]}>
            <Text style={[styles.disclaimerText, { color: colors.sub }]}>
              ⚠️ Predictions are estimates based on your logged data. Consult a healthcare
              professional for medical advice.
            </Text>
          </View>
        </Card>
      )}

      {/* Log Form */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.pink }]}>🌸 Log Period</Text>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>START DATE</Text>
        <TouchableOpacity
          onPress={() => setShowStartPicker(true)}
          style={[styles.dateButton, { backgroundColor: colors.bg3, borderColor: colors.border }]}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>
            📅 {fmtISO(dateToISO(startDate))}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartChange}
          />
        )}

        <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 10 }]}>
          END DATE (OPTIONAL)
        </Text>
        {endDate ? (
          <View style={styles.dateRow}>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={[
                styles.dateButton,
                { backgroundColor: colors.bg3, borderColor: colors.border, flex: 1 },
              ]}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                📅 {fmtISO(dateToISO(endDate))}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEndDate(null)}
              style={[styles.clearBtn, { backgroundColor: colors.bg3, borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 14, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            title="Set End Date"
            icon="📅"
            variant="outline"
            small
            onPress={() => {
              setEndDate(new Date());
              setShowEndPicker(true);
            }}
            style={{ alignSelf: 'flex-start', marginBottom: 4 }}
          />
        )}
        {showEndPicker && endDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndChange}
          />
        )}

        <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 12 }]}>
          FLOW INTENSITY
        </Text>
        <View style={styles.chipRow}>
          {FLOW_OPTIONS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFlow(flow === f ? '' : f)}
              style={[
                styles.flowBtn,
                {
                  backgroundColor: flow === f ? colors.pink : colors.bg3,
                  borderColor: flow === f ? colors.pink : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.flowText,
                  { color: flow === f ? '#fff' : colors.sub },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 12 }]}>SYMPTOMS</Text>
        <View style={styles.chipRow}>
          {SYMPTOM_OPTIONS.map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => toggleSym(s)}
              style={[
                styles.symChip,
                {
                  backgroundColor: symptoms.includes(s) ? colors.pink : colors.bg3,
                  borderColor: symptoms.includes(s) ? colors.pink : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.symText,
                  { color: symptoms.includes(s) ? '#fff' : colors.sub },
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Notes (optional)"
          placeholder="Anything else to note..."
          value={notes}
          onChangeText={setNotes}
          style={{ marginTop: 12, marginBottom: 14 }}
        />

        <Button title="+ Log Period" variant="pink" full onPress={addLog} />
      </Card>

      {/* Period History */}
      <Divider label={`Period History · ${periods.length} entries`} />

      {!periods.length && (
        <EmptyState icon="🌸" text="No periods logged yet. Start tracking above!" />
      )}

      {displayPeriods.map((p, i) => {
        const dur = p.end ? daysBetween(p.start, p.end) + 1 : null;
        // cycle length: days between this start and next entry's start (next in desc order = i+1)
        const nextEntry = i < displayPeriods.length - 1 ? displayPeriods[i + 1] : null;
        const cycleLen = nextEntry ? daysBetween(nextEntry.start, p.start) : null;

        return (
          <Card key={p.id} style={styles.logCard}>
            <View style={styles.logRow}>
              <View style={[styles.logIcon, { backgroundColor: colors.pinkBg }]}>
                <Text style={{ fontSize: 19 }}>🌸</Text>
              </View>

              <View style={styles.logContent}>
                <Text style={[styles.logTitle, { color: colors.deep }]}>
                  {fmtISO(p.start)}
                  {p.end ? ' → ' + fmtISO(p.end) : ''}
                </Text>
                <Text style={[styles.logMeta, { color: colors.muted }]}>
                  {[
                    dur ? dur + ' days' : null,
                    p.flow || null,
                    cycleLen ? 'Cycle: ' + cycleLen + 'd' : null,
                    p.symptoms?.length
                      ? p.symptoms.map(s => s.split(' ')[0]).join(' ')
                      : null,
                    p.notes || null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>

              <TouchableOpacity onPress={() => deleteLog(p.id)} style={styles.deleteBtn}>
                <Text style={{ fontSize: 18 }}>🗑</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}

      {/* Medical Disclaimer */}
      <View style={[styles.medicalDisclaimer, { backgroundColor: `${colors.pink}10` }]}>
        <Text style={[styles.medicalText, { color: colors.muted }]}>
          ⚠️ This tracker is for informational purposes only. It does not replace professional
          medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider
          with questions about your health.
        </Text>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroDate: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 42,
    lineHeight: 48,
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
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
    marginBottom: 14,
  },
  progressSection: {
    marginBottom: 18,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
  },
  progressMeta: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    marginTop: 4,
  },
  predictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  predictDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  predictLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    flex: 1,
  },
  predictValue: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    textAlign: 'right',
    flexShrink: 0,
  },
  disclaimer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    lineHeight: 17,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  dateButton: {
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  clearBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flowBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 0,
  },
  flowText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  symChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0,
  },
  symText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
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
    lineHeight: 17,
  },
  deleteBtn: {
    padding: 4,
  },
  medicalDisclaimer: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
  },
  medicalText: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomPad: {
    height: 40,
  },
});
