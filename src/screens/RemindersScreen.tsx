import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { Toast, useToast } from '../components/ui/Toast';
import {
  REMINDER_CATS,
  BILL_CATS,
  MEDICATION_CAT,
  RECURRING_FREQS,
} from '../constants/data';
import { fmtISO, dateToISO, addDays } from '../utils/dates';
import { Reminder, ReminderRecurring } from '../types';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { SkeletonCardRow } from '../components/ui/Skeleton';
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
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';
import type { HennaIconName } from '../components/henna';

async function scheduleNotifications(rem: Reminder): Promise<string[]> {
  const ids: string[] = [];
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return ids;

    const target = new Date(rem.date + (rem.time ? 'T' + rem.time : 'T23:59'));
    const now = Date.now();

    const t24h = target.getTime() - 24 * 3600 * 1000;
    if (t24h > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: 'Reminder tomorrow', body: rem.title },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(t24h) },
      });
      ids.push(id);
    }

    const t12h = target.getTime() - 12 * 3600 * 1000;
    if (t12h > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: 'Reminder in 12 hours', body: rem.title },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(t12h) },
      });
      ids.push(id);
    }
  } catch {
    // silently fail
  }
  return ids;
}

function advanceByFreq(iso: string, freq: ReminderRecurring): string {
  if (!freq) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (freq === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (freq === 'quarterly') date.setMonth(date.getMonth() + 3);
  else if (freq === 'yearly') date.setFullYear(date.getFullYear() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Map reminder cat to Henna icon
function iconForReminder(cat: string): HennaIconName {
  if (cat === MEDICATION_CAT) return 'pill';
  if (cat.includes('Bills') || cat.includes('Utility')) return 'electricity';
  if (cat.includes('Rent')) return 'house';
  if (cat.includes('School')) return 'book';
  if (cat.includes('Subscription')) return 'sparkle';
  if (cat.includes('Family')) return 'heart';
  if (cat.includes('Health')) return 'doctor';
  return 'bell';
}

function reminderType(cat: string): 'bill' | 'med' | 'general' {
  if (BILL_CATS.includes(cat)) return 'bill';
  if (cat === MEDICATION_CAT) return 'med';
  return 'general';
}

type FilterKey = 'all' | 'bills' | 'medication' | 'other';

// Format the date for a section header — "Today", "Tomorrow", "Fri 30 May"
function sectionLabel(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return target.toDateString().split(' ').slice(0, 3).join(' '); // "Fri 30 May"
}

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { reminders, setReminders, allLoaded } = useData();
  const { pkrF } = useCurrency();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState<Date | null>(null);
  const [cat, setCat] = useState(REMINDER_CATS[0]);
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState<ReminderRecurring>(null);
  const [dosage, setDosage] = useState('');
  const [withFood, setWithFood] = useState(false);
  const [medDuration, setMedDuration] = useState('1');

  const titleRef = useRef<TextInput | null>(null);
  const amountRef = useRef<TextInput | null>(null);
  const dosageRef = useRef<TextInput | null>(null);
  const medDurationRef = useRef<TextInput | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [formOpen, setFormOpen] = useState(false);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const isBillCat = BILL_CATS.includes(cat);
  const isMedCat = cat === MEDICATION_CAT;

  const categorize = useCallback((r: Reminder): FilterKey => {
    if (BILL_CATS.includes(r.cat)) return 'bills';
    if (r.cat === MEDICATION_CAT) return 'medication';
    return 'other';
  }, []);

  const upcoming = useMemo(
    () =>
      reminders.filter(r => {
        const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
        return t >= new Date() && !r.isDone;
      }),
    [reminders],
  );

  const nextUp = useMemo(() => {
    if (upcoming.length === 0) return null;
    return [...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [upcoming]);

  const dueToday = useMemo(() => {
    const todayIso = dateToISO(new Date());
    return upcoming.filter(r => r.date === todayIso).length;
  }, [upcoming]);

  const sorted = useMemo(() => {
    const now = new Date();
    return [...reminders]
      .filter(r => filter === 'all' || categorize(r) === filter)
      .sort((a, b) => {
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
        const ta = new Date(a.date + (a.time ? 'T' + a.time : 'T23:59'));
        const tb = new Date(b.date + (b.time ? 'T' + b.time : 'T23:59'));
        const af = ta >= now;
        const bf = tb >= now;
        if (af && !bf) return -1;
        if (!af && bf) return 1;
        return ta.getTime() - tb.getTime();
      });
  }, [reminders, filter, categorize]);

  const counts = useMemo(() => {
    const bills = reminders.filter(r => BILL_CATS.includes(r.cat)).length;
    const meds = reminders.filter(r => r.cat === MEDICATION_CAT).length;
    const other = reminders.filter(r => !BILL_CATS.includes(r.cat) && r.cat !== MEDICATION_CAT).length;
    return { all: reminders.length, bills, meds, other };
  }, [reminders]);

  // Group sorted list by date for section rendering
  const grouped = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    sorted.forEach(r => {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sorted]);

  const addReminder = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please enter a reminder title.');
      return;
    }
    const dateStr = dateToISO(date);
    const timeStr = time
      ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
      : '';

    let amtVal: number | undefined;
    if (isBillCat && amount.trim()) {
      const n = parseFloat(amount);
      if (isNaN(n) || n <= 0) {
        Alert.alert('Invalid amount', 'Amount must be a positive number.');
        return;
      }
      amtVal = n;
    }

    if (isMedCat) {
      const duration = Math.max(1, Math.min(60, parseInt(medDuration, 10) || 1));
      for (let i = 0; i < duration; i++) {
        const d = addDays(dateStr, i);
        const rem: Reminder = {
          id: Date.now() + i,
          title: title.trim(),
          date: d,
          time: timeStr,
          cat,
          isDone: false,
          dosage: dosage.trim() || undefined,
          withFood,
        };
        setReminders(r => [rem, ...r]);
        const notifIds = await scheduleNotifications(rem);
        if (notifIds.length > 0) {
          setReminders(r => r.map(x => (x.id === rem.id ? { ...x, notifIds } : x)));
        }
      }
      showToast(`${duration} ${duration === 1 ? 'dose' : 'doses'} scheduled`);
    } else {
      const rem: Reminder = {
        id: Date.now(),
        title: title.trim(),
        date: dateStr,
        time: timeStr,
        cat,
        isDone: false,
        amount: amtVal,
        recurring: recurring ?? null,
      };
      setReminders(r => [rem, ...r]);
      const notifIds = await scheduleNotifications(rem);
      if (notifIds.length > 0) {
        setReminders(r => r.map(x => (x.id === rem.id ? { ...x, notifIds } : x)));
      }
      showToast('Reminder added');
    }

    setTitle('');
    setTime(null);
    setAmount('');
    setRecurring(null);
    setDosage('');
    setWithFood(false);
    setMedDuration('1');
    setFormOpen(false);
  }, [title, date, time, cat, setReminders, isBillCat, isMedCat, amount, recurring, dosage, withFood, medDuration, showToast]);

  const cancelNotifications = useCallback(async (notifIds?: string[]) => {
    if (!notifIds) return;
    for (const nid of notifIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(nid);
      } catch {
        // silently fail
      }
    }
  }, []);

  const deleteReminder = useCallback(
    (id: number) => {
      Alert.alert('Delete Reminder', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const target = reminders.find(x => x.id === id);
            cancelNotifications(target?.notifIds);
            setReminders(r => r.filter(x => x.id !== id));
            if (target) {
              showToast('Reminder deleted', async () => {
                const notifIds = await scheduleNotifications(target);
                setReminders(r => [
                  { ...target, notifIds: notifIds.length ? notifIds : target.notifIds },
                  ...r,
                ]);
              });
            }
          },
        },
      ]);
    },
    [setReminders, reminders, cancelNotifications, showToast],
  );

  const toggleDone = useCallback(
    (id: number) => {
      const target = reminders.find(x => x.id === id);
      if (target && !target.isDone) {
        cancelNotifications(target.notifIds);
        if (target.recurring) {
          const nextDate = advanceByFreq(target.date, target.recurring);
          const nextRem: Reminder = {
            ...target,
            id: Date.now() + Math.random(),
            date: nextDate,
            isDone: false,
            notifIds: undefined,
          };
          setReminders(r => [nextRem, ...r.map(x => (x.id === id ? { ...x, isDone: true } : x))]);
          scheduleNotifications(nextRem).then(ids => {
            if (ids.length > 0) {
              setReminders(rr => rr.map(x => (x.id === nextRem.id ? { ...x, notifIds: ids } : x)));
            }
          });
          showToast(`Rescheduled for ${fmtISO(nextDate)}`);
          return;
        }
      }
      setReminders(r => r.map(x => (x.id === id ? { ...x, isDone: !x.isDone } : x)));
    },
    [setReminders, reminders, cancelNotifications, showToast],
  );

  const onDateChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  }, []);

  const onTimeChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) setTime(selected);
  }, []);

  const openSetTime = useCallback(() => {
    setTime(new Date());
    setShowTimePicker(true);
  }, []);

  const heroSubtitle = `${upcoming.length} upcoming${dueToday > 0 ? ` · ${dueToday} due today` : ''}`;
  const heroLine =
    nextUp != null
      ? `${nextUp.title}${nextUp.time ? ', ' + nextUp.time : ''}`
      : 'Nothing due today';
  const heroMeta = nextUp
    ? `${nextUp.amount ? pkrF(nextUp.amount) + ' · ' : ''}${nextUp.recurring ? 'recurring ' + nextUp.recurring : nextUp.cat}`
    : 'Add one below';

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HennaHeader title="Reminders" subtitle={heroSubtitle} onMenu={onMenu} />

        {/* Hero — sage */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroSage}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={100} color={hennaColors.sage} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.sage} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.sage }]}>Next up</Text>
              </View>
              <Text style={styles.heroLine}>{heroLine}</Text>
              <Text style={styles.heroMeta}>{heroMeta}</Text>
              {nextUp && (
                <View style={styles.heroBtnRow}>
                  <HennaButton
                    title="Mark done"
                    icon="check"
                    variant="sage"
                    size="sm"
                    onPress={() => toggleDone(nextUp.id)}
                  />
                  <HennaButton
                    title="Snooze 1 day"
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setReminders(r =>
                        r.map(x =>
                          x.id === nextUp.id
                            ? { ...x, date: addDays(x.date, 1) }
                            : x,
                        ),
                      );
                      showToast('Snoozed 1 day');
                    }}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Filter rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRail}
        >
          <HennaPill label={`All${counts.all ? ' · ' + counts.all : ''}`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <HennaPill label={`Bills${counts.bills ? ' · ' + counts.bills : ''}`} active={filter === 'bills'} onPress={() => setFilter('bills')} />
          <HennaPill label={`Medication${counts.meds ? ' · ' + counts.meds : ''}`} active={filter === 'medication'} onPress={() => setFilter('medication')} />
          <HennaPill label={`Other${counts.other ? ' · ' + counts.other : ''}`} active={filter === 'other'} onPress={() => setFilter('other')} />
          <View style={{ flex: 1 }} />
          <HennaPill label="New" icon="plus" onPress={() => setFormOpen(o => !o)} />
        </ScrollView>

        {/* Add form (collapsed by default) */}
        {formOpen && (
          <View style={styles.formCardWrap}>
            <HennaCard padding={18}>
              <Text style={styles.formTitle}>New reminder</Text>
              <HennaInput
                ref={titleRef}
                label="Title"
                placeholder={isMedCat ? 'e.g. Amoxicillin' : isBillCat ? 'e.g. Electricity bill' : 'e.g. Call plumber'}
                value={title}
                onChangeText={setTitle}
                containerStyle={{ marginBottom: 10 }}
                returnKeyType={isBillCat || isMedCat ? 'next' : 'done'}
                blurOnSubmit={!(isBillCat || isMedCat)}
                onSubmitEditing={() => {
                  if (isBillCat) amountRef.current?.focus();
                  else if (isMedCat) dosageRef.current?.focus();
                  else addReminder();
                }}
              />

              <Text style={[hennaTextStyles.eyebrow, styles.fieldLabel]}>Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={styles.dateBtn}
                accessibilityRole="button"
                accessibilityLabel="Pick date"
              >
                <HennaIcon name="calendar" size={14} color={hennaColors.ink2} />
                <Text style={styles.dateBtnText}>{fmtISO(dateToISO(date))}</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              )}

              <Text style={[hennaTextStyles.eyebrow, styles.fieldLabel]}>Time (optional)</Text>
              {time ? (
                <View style={styles.timeRow}>
                  <Pressable onPress={() => setShowTimePicker(true)} style={[styles.dateBtn, { flex: 1 }]}>
                    <HennaIcon name="clock" size={14} color={hennaColors.ink2} />
                    <Text style={styles.dateBtnText}>
                      {String(time.getHours()).padStart(2, '0')}:
                      {String(time.getMinutes()).padStart(2, '0')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setTime(null)} style={styles.clearBtn} accessibilityLabel="Clear time">
                    <HennaIcon name="close" size={14} color={hennaColors.muted} />
                  </Pressable>
                </View>
              ) : (
                <HennaButton title="Set time" icon="clock" variant="outline" size="sm" onPress={openSetTime} />
              )}
              {showTimePicker && time && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}

              <Text style={[hennaTextStyles.eyebrow, styles.fieldLabel]}>Category</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={cat}
                  onValueChange={v => setCat(v)}
                  style={{ color: hennaColors.ink }}
                  dropdownIconColor={hennaColors.muted}
                >
                  {REMINDER_CATS.map(c => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
              </View>

              {isBillCat && (
                <>
                  <HennaInput
                    ref={amountRef}
                    label="Amount (optional)"
                    placeholder="e.g. 2500"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    containerStyle={{ marginTop: 10 }}
                    returnKeyType="done"
                    onSubmitEditing={addReminder}
                  />
                  <Text style={[hennaTextStyles.eyebrow, styles.fieldLabel]}>Recurring</Text>
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={recurring ?? 'none'}
                      onValueChange={v => setRecurring(v === 'none' ? null : (v as 'monthly' | 'quarterly' | 'yearly'))}
                      style={{ color: hennaColors.ink }}
                      dropdownIconColor={hennaColors.muted}
                    >
                      {RECURRING_FREQS.map(f => (
                        <Picker.Item key={f.key ?? 'none'} value={f.key ?? 'none'} label={f.label} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              {isMedCat && (
                <>
                  <HennaInput
                    ref={dosageRef}
                    label="Dosage (optional)"
                    placeholder="e.g. 500mg, 1 tablet"
                    value={dosage}
                    onChangeText={setDosage}
                    containerStyle={{ marginTop: 10 }}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => medDurationRef.current?.focus()}
                  />
                  <HennaInput
                    ref={medDurationRef}
                    label="Duration (days)"
                    placeholder="7"
                    value={medDuration}
                    onChangeText={t => setMedDuration(t.replace(/[^0-9]/g, '').slice(0, 2))}
                    keyboardType="numeric"
                    containerStyle={{ marginTop: 10 }}
                    returnKeyType="done"
                    onSubmitEditing={addReminder}
                  />
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchTitle}>Take with food</Text>
                      <Text style={styles.switchSub}>Flag this dose</Text>
                    </View>
                    <Switch
                      value={withFood}
                      onValueChange={setWithFood}
                      trackColor={{ false: hennaColors.line, true: hennaColors.henna }}
                      thumbColor={hennaColors.paper}
                    />
                  </View>
                </>
              )}

              <HennaButton
                title={isMedCat ? `+ Schedule ${medDuration || 1} doses` : '+ Add reminder'}
                variant="primary"
                full
                onPress={addReminder}
                style={{ marginTop: 14 }}
              />
            </HennaCard>
          </View>
        )}

        {/* List */}
        {!allLoaded && (
          <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
            <SkeletonCardRow />
            <SkeletonCardRow />
            <SkeletonCardRow />
          </View>
        )}

        {allLoaded && sorted.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'All caught up for today.' : 'Nothing in this category.'}
            </Text>
            <Text style={styles.emptyHint}>Add one above and we'll nudge you in time.</Text>
          </View>
        )}

        {/* Grouped list */}
        <View style={styles.listWrap}>
          {grouped.map(([dateIso, items]) => (
            <View key={dateIso} style={{ marginBottom: 10 }}>
              <Text style={[hennaTextStyles.eyebrow, styles.dateEyebrow]}>
                {sectionLabel(dateIso)}
              </Text>
              <HennaCard padding={0}>
                {items.map((r, i) => {
                  const t = reminderType(r.cat);
                  const tintBg =
                    t === 'bill' ? hennaColors.hennaBg : t === 'med' ? hennaColors.plumBg : hennaColors.bronzeBg;
                  const tintFg =
                    t === 'bill' ? hennaColors.henna : t === 'med' ? hennaColors.plum : hennaColors.bronze;
                  return (
                    <SwipeableRow
                      key={r.id}
                      itemLabel={r.title}
                      actions={[
                        { kind: 'done', onPress: () => toggleDone(r.id) },
                        { kind: 'delete', onPress: () => deleteReminder(r.id) },
                      ]}
                    >
                      <View
                        style={[
                          styles.remRow,
                          i < items.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: hennaColors.line,
                          },
                          r.isDone && { opacity: 0.55 },
                        ]}
                      >
                        <View style={[styles.remIcon, { backgroundColor: tintBg }]}>
                          <HennaIcon name={iconForReminder(r.cat)} size={17} color={tintFg} />
                        </View>
                        <View style={styles.remInfo}>
                          <View style={styles.remTitleRow}>
                            <Text
                              style={[
                                styles.remTitle,
                                r.isDone && { textDecorationLine: 'line-through' },
                              ]}
                              numberOfLines={1}
                            >
                              {r.title}
                            </Text>
                            {r.amount !== undefined && (
                              <Text style={styles.remAmount}>{pkrF(r.amount)}</Text>
                            )}
                          </View>
                          <View style={styles.remMetaRow}>
                            {r.time ? (
                              <View style={styles.metaItem}>
                                <HennaIcon name="clock" size={10} color={hennaColors.muted} />
                                <Text style={styles.metaText}>{r.time}</Text>
                              </View>
                            ) : null}
                            {r.recurring ? <Text style={styles.metaText}>· {r.recurring}</Text> : null}
                            {r.dosage ? <Text style={styles.metaText}>· {r.dosage}</Text> : null}
                            {r.withFood ? <Text style={styles.metaText}>· with food</Text> : null}
                          </View>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={r.isDone ? `Reopen ${r.title}` : `Mark ${r.title} done`}
                          onPress={() => toggleDone(r.id)}
                          hitSlop={6}
                          style={styles.checkBtn}
                        >
                          {r.isDone ? (
                            <HennaIcon name="check" size={14} color={hennaColors.sage} />
                          ) : null}
                        </Pressable>
                      </View>
                    </SwipeableRow>
                  );
                })}
              </HennaCard>
            </View>
          ))}
        </View>
      </ScrollView>
      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },

  // Hero
  heroWrap: { paddingHorizontal: 16 },
  heroCard: {
    borderRadius: hennaRadii.card,
    overflow: 'hidden',
    position: 'relative',
    ...hennaShadows.md,
  },
  heroCorner: { position: 'absolute', top: -6, right: -6 },
  heroInner: { paddingVertical: 20, paddingHorizontal: 22, position: 'relative' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroLine: {
    marginTop: 6,
    fontFamily: hennaFonts.serif,
    fontSize: 22,
    color: hennaColors.ink,
  },
  heroMeta: {
    marginTop: 6,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.ink2,
  },
  heroBtnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },

  // Filter
  filterRail: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Form
  formCardWrap: { paddingHorizontal: 16, paddingTop: 12 },
  formTitle: {
    fontFamily: hennaFonts.serif,
    fontSize: 18,
    color: hennaColors.ink,
    marginBottom: 14,
  },
  fieldLabel: { marginTop: 10, marginBottom: 8 },
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
  dateBtnText: {
    fontFamily: hennaFonts.ui,
    fontSize: 13,
    color: hennaColors.ink,
  },
  timeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hennaColors.paper2,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  pickerWrap: {
    backgroundColor: hennaColors.paper2,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    overflow: 'hidden',
    minHeight: 50,
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  switchTitle: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  switchSub: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, marginTop: 2 },

  // Empty
  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },

  // List
  listWrap: { paddingHorizontal: 16, paddingTop: 12 },
  dateEyebrow: { paddingHorizontal: 6, paddingTop: 6, paddingBottom: 8 },
  remRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  remIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remInfo: { flex: 1, minWidth: 0 },
  remTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  remTitle: {
    flex: 1,
    fontFamily: hennaFonts.uiSemi,
    fontSize: 14,
    color: hennaColors.ink,
  },
  remAmount: {
    fontFamily: hennaFonts.serif,
    fontSize: 14,
    color: hennaColors.henna,
  },
  remMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3,
    gap: 4,
    alignItems: 'center',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },
  checkBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: hennaColors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
