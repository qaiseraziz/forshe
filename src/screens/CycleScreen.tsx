import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { SYMPTOM_OPTIONS, FLOW_OPTIONS } from '../constants/data';
import { fmtISO, daysBetween, addDays, dateToISO } from '../utils/dates';
import { PeriodLog } from '../types';
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
  HennaPill,
  HennaProgress,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
  DividerOrnament,
} from '../components/henna';

export default function CycleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { periods, setPeriods } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [flow, setFlow] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const toggleSym = useCallback(
    (sym: string) =>
      setSymptoms(s => (s.includes(sym) ? s.filter(x => x !== sym) : [...s, sym])),
    [],
  );

  const { avgCycle, avgDur, predictions } = useMemo(() => {
    const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
    const durations = sorted.filter(p => p.end).map(p => daysBetween(p.start, p.end) + 1);
    const cycles: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      cycles.push(daysBetween(sorted[i - 1].start, sorted[i].start));
    }
    const avgC = cycles.length ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : null;
    const avgD = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    let preds = null;
    if (sorted.length >= 2 && avgC) {
      const last = sorted[sorted.length - 1];
      const nextStart = addDays(last.start, avgC);
      const ovulation = addDays(nextStart, -14);
      const fertileStart = addDays(ovulation, -2);
      const fertileEnd = addDays(ovulation, 2);
      const pmsStart = addDays(nextStart, -5);

      const now = new Date();
      const lastDate = new Date(last.start);
      const dayInCycle = Math.round((now.getTime() - lastDate.getTime()) / 86400000);
      const cyclePct = Math.min(Math.round((dayInCycle / avgC) * 100), 100);
      const daysUntilNext = Math.round((new Date(nextStart).getTime() - now.getTime()) / 86400000);
      preds = { nextStart, ovulation, fertileStart, fertileEnd, pmsStart, dayInCycle, cyclePct, daysUntilNext };
    }
    return { avgCycle: avgC, avgDur: avgD, predictions: preds };
  }, [periods]);

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
    setPeriods(l => [log, ...l].sort((a, b) => b.start.localeCompare(a.start)));
    setEndDate(null);
    setNotes('');
    setFlow('');
    setSymptoms([]);
  }, [startDate, endDate, flow, symptoms, notes, periods, setPeriods]);

  const deleteLog = useCallback(
    (id: number) => {
      Alert.alert('Delete entry', 'Delete this period log?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const entry = periods.find(x => x.id === id);
            setPeriods(l => l.filter(x => x.id !== id));
            if (entry) {
              showToast('Period log deleted', () => {
                setPeriods(l => [entry, ...l].sort((a, b) => b.start.localeCompare(a.start)));
              });
            }
          },
        },
      ]);
    },
    [periods, setPeriods, showToast],
  );

  const onStartChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selected) setStartDate(selected);
  }, []);

  const onEndChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selected) setEndDate(selected);
  }, []);

  const displayPeriods = useMemo(
    () => [...periods].sort((a, b) => b.start.localeCompare(a.start)),
    [periods],
  );

  const predictionRows = useMemo(() => {
    if (!predictions) return [];
    return [
      {
        color: hennaColors.pink,
        label: 'Next period',
        value: fmtISO(predictions.nextStart) + (avgDur ? ` – ${fmtISO(addDays(predictions.nextStart, avgDur - 1))}` : ''),
      },
      { color: hennaColors.bronze, label: 'Ovulation', value: fmtISO(predictions.ovulation) },
      {
        color: hennaColors.sage,
        label: 'Fertile window',
        value: `${fmtISO(predictions.fertileStart)} – ${fmtISO(predictions.fertileEnd)}`,
      },
      { color: hennaColors.plum, label: 'PMS', value: `from ${fmtISO(predictions.pmsStart)}` },
    ];
  }, [predictions, avgDur]);

  const openSetEndDate = useCallback(() => {
    setEndDate(new Date());
    setShowEndPicker(true);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HennaHeader
          title="Cycle"
          subtitle={
            predictions
              ? predictions.daysUntilNext > 0
                ? `Next in ${predictions.daysUntilNext} days`
                : predictions.daysUntilNext === 0
                  ? 'Today'
                  : `${Math.abs(predictions.daysUntilNext)} days ago`
              : 'Log 2 cycles to predict'
          }
          onMenu={onMenu}
        />

        {/* Hero — pink */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroPink}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.pink} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.pink} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.pink }]}>Next period</Text>
              </View>
              <Text style={styles.heroDate}>{predictions ? fmtISO(predictions.nextStart) : '—'}</Text>
              <Text style={styles.heroSub}>
                {predictions
                  ? predictions.daysUntilNext > 0
                    ? `In ${predictions.daysUntilNext} days`
                    : predictions.daysUntilNext === 0
                      ? 'Today'
                      : `${Math.abs(predictions.daysUntilNext)} days ago`
                  : 'Log at least 2 cycles to predict'}
              </Text>
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatVal}>{avgCycle ? `${avgCycle}d` : '—'}</Text>
                  <Text style={styles.heroStatLbl}>Avg cycle</Text>
                </View>
                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatVal}>{avgDur ? `${avgDur}d` : '—'}</Text>
                  <Text style={styles.heroStatLbl}>Avg duration</Text>
                </View>
                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatVal}>{periods.length}</Text>
                  <Text style={styles.heroStatLbl}>Logged</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Predictions */}
        {predictions && (
          <>
            <DividerOrnament color={hennaColors.pink} />
            <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Cycle insights</Text>
            <View style={styles.body}>
              <HennaCard padding={18} style={{ marginBottom: 14 }}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Day 1</Text>
                  <Text style={styles.progressLabel}>Day {avgCycle}</Text>
                </View>
                <HennaProgress value={predictions.cyclePct} max={100} accent="henna" height={8} />
                <Text style={styles.progressMeta}>
                  Day {predictions.dayInCycle} of ~{avgCycle}-day cycle
                </Text>
                <View style={{ marginTop: 14 }}>
                  {predictionRows.map(row => (
                    <View key={row.label} style={styles.predictRow}>
                      <View style={[styles.predictDot, { backgroundColor: row.color }]} />
                      <Text style={styles.predictLabel}>{row.label}</Text>
                      <Text style={styles.predictValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.disclaimerText}>
                  Predictions are estimates. For medical advice, consult a healthcare professional.
                </Text>
              </HennaCard>
            </View>
          </>
        )}

        {/* Log form */}
        <DividerOrnament color={hennaColors.pink} />
        <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Log period</Text>
        <View style={styles.body}>
          <HennaCard padding={18} style={{ marginBottom: 14 }}>
            <Text style={[hennaTextStyles.eyebrow, { marginBottom: 8 }]}>Start date</Text>
            <Pressable onPress={() => setShowStartPicker(true)} style={styles.dateBtn} accessibilityRole="button">
              <HennaIcon name="calendar" size={14} color={hennaColors.ink2} />
              <Text style={styles.dateBtnText}>{fmtISO(dateToISO(startDate))}</Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartChange}
              />
            )}

            <Text style={[hennaTextStyles.eyebrow, { marginTop: 14, marginBottom: 8 }]}>
              End date (optional)
            </Text>
            {endDate ? (
              <View style={styles.dateRow}>
                <Pressable onPress={() => setShowEndPicker(true)} style={[styles.dateBtn, { flex: 1 }]}>
                  <HennaIcon name="calendar" size={14} color={hennaColors.ink2} />
                  <Text style={styles.dateBtnText}>{fmtISO(dateToISO(endDate))}</Text>
                </Pressable>
                <Pressable onPress={() => setEndDate(null)} style={styles.clearBtn} accessibilityLabel="Clear end date">
                  <HennaIcon name="close" size={13} color={hennaColors.muted} />
                </Pressable>
              </View>
            ) : (
              <HennaButton title="Set end date" icon="calendar" variant="outline" size="sm" onPress={openSetEndDate} />
            )}
            {showEndPicker && endDate && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndChange}
              />
            )}

            <Text style={[hennaTextStyles.eyebrow, { marginTop: 14, marginBottom: 8 }]}>Flow</Text>
            <View style={styles.chipRow}>
              {FLOW_OPTIONS.map(f => (
                <HennaPill
                  key={f}
                  label={f}
                  active={flow === f}
                  onPress={() => setFlow(flow === f ? '' : f)}
                  accent="pink"
                />
              ))}
            </View>

            <Text style={[hennaTextStyles.eyebrow, { marginTop: 14, marginBottom: 8 }]}>Symptoms</Text>
            <View style={styles.chipRow}>
              {SYMPTOM_OPTIONS.map(s => (
                <HennaPill
                  key={s}
                  label={s}
                  active={symptoms.includes(s)}
                  onPress={() => toggleSym(s)}
                  accent="pink"
                />
              ))}
            </View>

            <HennaInput
              label="Notes (optional)"
              placeholder="Anything else"
              value={notes}
              onChangeText={setNotes}
              containerStyle={{ marginTop: 14 }}
            />

            <HennaButton title="+ Log period" icon="plus" variant="primary" full onPress={addLog} style={{ marginTop: 14 }} />
          </HennaCard>
        </View>

        {/* History */}
        <DividerOrnament color={hennaColors.pink} />
        <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>
          History · {periods.length}
        </Text>
        <View style={styles.body}>
          {!periods.length ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No periods logged yet.</Text>
              <Text style={styles.emptyHint}>Start tracking above.</Text>
            </View>
          ) : (
            displayPeriods.map((p, i) => {
              const dur = p.end ? daysBetween(p.start, p.end) + 1 : null;
              const nextEntry = i < displayPeriods.length - 1 ? displayPeriods[i + 1] : null;
              const cycleLen = nextEntry ? daysBetween(nextEntry.start, p.start) : null;
              return (
                <HennaCard key={p.id} padding={16} style={{ marginBottom: 8 }}>
                  <View style={styles.logRow}>
                    <View style={styles.logIcon}>
                      <HennaIcon name="cycle" size={17} color={hennaColors.pink} />
                    </View>
                    <View style={styles.logContent}>
                      <Text style={styles.logTitle}>
                        {fmtISO(p.start)}
                        {p.end ? ' → ' + fmtISO(p.end) : ''}
                      </Text>
                      <Text style={styles.logMeta}>
                        {[
                          dur ? dur + ' days' : null,
                          p.flow || null,
                          cycleLen ? 'Cycle: ' + cycleLen + 'd' : null,
                          p.symptoms?.length ? p.symptoms.join(' · ') : null,
                          p.notes || null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => deleteLog(p.id)}
                      style={styles.deleteBtn}
                      hitSlop={8}
                      accessibilityLabel={`Delete period log from ${fmtISO(p.start)}`}
                    >
                      <HennaIcon name="trash" size={16} color={hennaColors.henna} />
                    </Pressable>
                  </View>
                </HennaCard>
              );
            })
          )}
          <Text style={styles.medicalText}>
            For informational purposes only. Always consult a qualified healthcare provider for medical advice.
          </Text>
        </View>
      </ScrollView>
      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },

  heroWrap: { paddingHorizontal: 16 },
  heroCard: {
    borderRadius: hennaRadii.card,
    overflow: 'hidden',
    position: 'relative',
    ...hennaShadows.md,
  },
  heroCorner: { position: 'absolute', top: -6, right: -6 },
  heroInner: { paddingVertical: 22, paddingHorizontal: 24, position: 'relative' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroDate: {
    marginTop: 8,
    fontFamily: hennaFonts.serif,
    fontSize: 28,
    color: hennaColors.ink,
    letterSpacing: -0.5,
  },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  heroStatsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  heroStatBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  heroStatVal: { fontFamily: hennaFonts.serif, fontSize: 16, color: hennaColors.pink },
  heroStatLbl: {
    marginTop: 2,
    fontFamily: hennaFonts.uiSemi,
    fontSize: 9,
    color: hennaColors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  body: { paddingHorizontal: 16 },
  sectionEyebrow: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 10 },

  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontFamily: hennaFonts.ui, fontSize: 10, color: hennaColors.muted },
  progressMeta: { marginTop: 4, fontFamily: hennaFonts.ui, fontSize: 10, color: hennaColors.muted },
  predictRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  predictDot: { width: 8, height: 8, borderRadius: 4 },
  predictLabel: { flex: 1, fontFamily: hennaFonts.ui, fontSize: 13, color: hennaColors.ink2 },
  predictValue: { fontFamily: hennaFonts.serif, fontSize: 13, color: hennaColors.ink },

  disclaimerText: {
    marginTop: 12,
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
    lineHeight: 17,
  },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: hennaColors.paper2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    minHeight: 44,
  },
  dateBtnText: { fontFamily: hennaFonts.ui, fontSize: 13, color: hennaColors.ink },
  dateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: hennaColors.paper2,
    borderWidth: 1,
    borderColor: hennaColors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 16, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },

  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: hennaColors.pinkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: { flex: 1, minWidth: 0 },
  logTitle: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.ink },
  logMeta: { marginTop: 4, fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, lineHeight: 16 },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  medicalText: {
    marginTop: 16,
    paddingHorizontal: 8,
    fontFamily: hennaFonts.ui,
    fontSize: 10,
    color: hennaColors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
