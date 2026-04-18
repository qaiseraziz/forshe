import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast, useToast } from '../components/ui/Toast';
import {
  REMINDER_CATS,
  BILL_CATS,
  MEDICATION_CAT,
  RECURRING_FREQS,
} from '../constants/data';
import { fmtISO, dateToISO, addDays } from '../utils/dates';
import { Reminder, ReminderRecurring } from '../types';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

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
        content: {
          title: '🔔 Reminder Tomorrow',
          body: rem.title,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(t24h) },
      });
      ids.push(id);
    }

    const t12h = target.getTime() - 12 * 3600 * 1000;
    if (t12h > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Reminder in 12 Hours',
          body: rem.title,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(t12h) },
      });
      ids.push(id);
    }
  } catch {
    // silently fail
  }
  return ids;
}

function remStatus(rem: Reminder): { label: string; cls: 'past' | 'due' | 'soon' | 'ok' } {
  const now = new Date();
  const target = new Date(rem.date + (rem.time ? 'T' + rem.time : 'T23:59'));
  const diff = target.getTime() - now.getTime();
  const hrs = diff / 3600000;
  if (diff < 0) return { label: 'Past', cls: 'past' };
  if (hrs <= 12) return { label: '< 12h', cls: 'due' };
  if (hrs <= 26) return { label: 'Tomorrow', cls: 'soon' };
  return { label: 'Upcoming', cls: 'ok' };
}

function daysUntil(d: string, t: string): string | null {
  const now = new Date();
  const target = new Date(d + (t ? 'T' + t : 'T23:59'));
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return null;
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hrs}h away` : `${hrs}h away`;
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

type FilterKey = 'all' | 'bills' | 'medication' | 'other';

export default function RemindersScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { reminders, setReminders } = useData();
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

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

  const nextUpcomingTitle = useMemo(() => {
    if (upcoming.length === 0) return null;
    return [...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0].title;
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

  // Counts for filter pills
  const counts = useMemo(() => {
    const bills = reminders.filter(r => BILL_CATS.includes(r.cat)).length;
    const meds = reminders.filter(r => r.cat === MEDICATION_CAT).length;
    const other = reminders.filter(r => !BILL_CATS.includes(r.cat) && r.cat !== MEDICATION_CAT).length;
    return { all: reminders.length, bills, meds, other };
  }, [reminders]);

  const addReminder = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please enter a reminder title.');
      return;
    }
    const dateStr = dateToISO(date);
    const timeStr = time
      ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
      : '';

    // Parse amount for bill reminders
    let amtVal: number | undefined;
    if (isBillCat && amount.trim()) {
      const n = parseFloat(amount);
      if (isNaN(n) || n <= 0) {
        Alert.alert('Invalid amount', 'Amount must be a positive number.');
        return;
      }
      amtVal = n;
    }

    // Medication: generate N days of daily reminders
    if (isMedCat) {
      const duration = Math.max(1, Math.min(60, parseInt(medDuration, 10) || 1));
      const createdIds: number[] = [];
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
        createdIds.push(rem.id);
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
      Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
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
        // Marking as done — cancel scheduled notifications
        cancelNotifications(target.notifIds);

        // If it's a recurring bill, create the next occurrence
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

  const badgeProps = useCallback((cls: string) => {
    switch (cls) {
      case 'past':
        return { bg: colors.bg3, color: colors.muted };
      case 'due':
        return { bg: colors.purpleBg, color: colors.purple };
      case 'soon':
        return { bg: colors.goldBg, color: colors.gold };
      case 'ok':
        return { bg: colors.greenBg, color: colors.green };
      default:
        return { bg: colors.bg3, color: colors.muted };
    }
  }, [colors]);

  const FilterPill = useCallback(({ k, label, count }: { k: FilterKey; label: string; count: number }) => {
    const active = filter === k;
    return (
      <TouchableOpacity
        onPress={() => setFilter(k)}
        style={[styles.filterPill, { backgroundColor: active ? colors.purpleBg : colors.bg3 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterPillText, { color: active ? colors.purple : colors.sub }]}>
          {label} {count > 0 ? `· ${count}` : ''}
        </Text>
      </TouchableOpacity>
    );
  }, [filter, colors]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card */}
      <Card gradient={dark ? gradients.purpleHeroDark : gradients.purpleHero} style={{ backgroundColor: colors.purpleBg, borderColor: colors.purpleBorder }}>
        <View style={styles.heroHeaderRow}>
          <DrawerMenuButton />
          <View style={styles.heroHeaderText}>
            <Text style={[styles.heroLabel, { color: colors.purple }]}>🔔 Active Reminders</Text>
            <Text style={[styles.heroCount, { color: colors.purple }]}>{upcoming.length}</Text>
            <Text style={[styles.heroSub, { color: colors.sub }]}>
              {nextUpcomingTitle ? `Next: ${nextUpcomingTitle}` : 'No upcoming reminders'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <FilterPill k="all" label="All" count={counts.all} />
        <FilterPill k="bills" label="💡 Bills" count={counts.bills} />
        <FilterPill k="medication" label="💊 Medication" count={counts.meds} />
        <FilterPill k="other" label="Other" count={counts.other} />
      </ScrollView>

      {/* Add Reminder Form */}
      <Card>
        <Text style={[styles.formLabel, { color: colors.purple }]}>📝 New Reminder</Text>

        <Input
          label="Reminder Title"
          placeholder={isMedCat ? 'e.g. Amoxicillin' : isBillCat ? 'e.g. Pay electricity bill' : 'e.g. Call plumber...'}
          value={title}
          onChangeText={setTitle}
          style={{ marginBottom: 10 }}
        />

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>DATE</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[styles.dateButton, { backgroundColor: colors.bg3, borderColor: colors.border }]}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>📅 {fmtISO(dateToISO(date))}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 10 }]}>
          TIME (OPTIONAL)
        </Text>
        {time ? (
          <View style={styles.timeRow}>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[
                styles.dateButton,
                { backgroundColor: colors.bg3, borderColor: colors.border, flex: 1 },
              ]}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                ⏰{' '}
                {`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTime(null)}
              style={[styles.clearBtn, { backgroundColor: colors.bg3, borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 14, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            title="Set Time"
            icon="⏰"
            variant="outline"
            small
            onPress={openSetTime}
            style={{ alignSelf: 'flex-start', marginBottom: 4 }}
          />
        )}
        {showTimePicker && time && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}

        <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 10 }]}>CATEGORY</Text>
        <View
          style={[styles.pickerWrap, { backgroundColor: colors.bg3, borderColor: colors.border }]}
        >
          <Picker
            selectedValue={cat}
            onValueChange={v => setCat(v)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.muted}
          >
            {REMINDER_CATS.map(c => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        {/* Bill-specific fields */}
        {isBillCat && (
          <>
            <Input
              label="Amount (optional)"
              placeholder="e.g. 2500"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{ marginTop: 10 }}
            />
            <Text style={[styles.fieldLabel, { color: colors.muted, marginTop: 10 }]}>RECURRING</Text>
            <View style={[styles.pickerWrap, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
              <Picker
                selectedValue={recurring ?? 'none'}
                onValueChange={(v) => setRecurring(v === 'none' ? null : (v as 'monthly' | 'quarterly' | 'yearly'))}
                style={{ color: colors.text }}
                dropdownIconColor={colors.muted}
              >
                {RECURRING_FREQS.map(f => (
                  <Picker.Item key={f.key ?? 'none'} value={f.key ?? 'none'} label={f.label} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {/* Medication-specific fields */}
        {isMedCat && (
          <>
            <Input
              label="Dosage (optional)"
              placeholder="e.g. 500mg, 1 tablet"
              value={dosage}
              onChangeText={setDosage}
              style={{ marginTop: 10 }}
            />
            <Input
              label="Duration (days)"
              placeholder="7"
              value={medDuration}
              onChangeText={(t) => setMedDuration(t.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="numeric"
              style={{ marginTop: 10 }}
            />
            <View style={[styles.switchRow, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchTitle, { color: colors.deep }]}>Take with food</Text>
                <Text style={[styles.switchSub, { color: colors.muted }]}>Flag this dose</Text>
              </View>
              <Switch
                value={withFood}
                onValueChange={setWithFood}
                trackColor={{ false: colors.border, true: colors.purple }}
                thumbColor="#fff"
              />
            </View>
          </>
        )}

        <Button
          title={isMedCat ? `+ Schedule ${medDuration || 1} Doses` : '+ Add Reminder'}
          variant="gold"
          full
          onPress={addReminder}
          style={{ marginTop: 14 }}
        />
      </Card>

      {/* Reminders List */}
      <Divider label={`${filter === 'all' ? 'All Reminders' : filter === 'bills' ? 'Bills' : filter === 'medication' ? 'Medication' : 'Other'} · ${sorted.length} ${sorted.length === 1 ? 'item' : 'items'}`} />

      {!sorted.length && (
        <EmptyState icon="🔔" text={filter === 'all' ? 'No reminders yet. Add one above to get started!' : 'No reminders in this category.'} />
      )}

      {sorted.map(r => {
        const st = remStatus(r);
        const until = daysUntil(r.date, r.time);
        const isPast = !until;
        const bp = badgeProps(st.cls);
        const isBill = BILL_CATS.includes(r.cat);
        const isMed = r.cat === MEDICATION_CAT;

        return (
          <Card
            key={r.id}
            style={{
              ...styles.remCard,
              ...(isPast || r.isDone ? { opacity: 0.6 } : {}),
            }}
          >
            <View style={styles.remRow}>
              <View
                style={[
                  styles.remIcon,
                  { backgroundColor: colors.purpleBg },
                ]}
              >
                <Text style={{ fontSize: 19 }}>{r.cat.split(' ')[0] || '📋'}</Text>
              </View>

              <View style={styles.remContent}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.remTitle,
                      { color: colors.deep },
                      r.isDone && styles.doneTitle,
                    ]}
                  >
                    {r.title}
                  </Text>
                  {isBill && r.amount !== undefined && (
                    <Text style={[styles.remAmount, { color: colors.gold }]}>
                      {pkrF(r.amount)}
                    </Text>
                  )}
                </View>

                <View style={styles.badgeRow}>
                  {r.isDone ? (
                    <Badge text="✅ Done" bg={colors.greenBg} color={colors.green} />
                  ) : (
                    <Badge text={st.label} bg={bp.bg} color={bp.color} />
                  )}
                  {r.recurring && (
                    <Badge text={`🔁 ${r.recurring}`} bg={colors.blueBg} color={colors.blue} />
                  )}
                  {isMed && r.withFood && (
                    <Badge text="🍽 with food" bg={colors.goldBg} color={colors.gold} />
                  )}
                </View>

                <Text style={[styles.remMeta, { color: colors.muted }]}>
                  {fmtISO(r.date)}
                  {r.time ? ' at ' + r.time : ''}
                  {until && !r.isDone ? ' · ' + until : ''}
                </Text>
                <Text style={[styles.remCat, { color: colors.muted }]}>{r.cat}</Text>
                {isMed && r.dosage ? (
                  <Text style={[styles.remDosage, { color: colors.purple }]}>💊 {r.dosage}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => toggleDone(r.id)}
                style={styles.actionBtn}
                accessibilityLabel={r.isDone ? `Mark ${r.title} as not done` : `Mark ${r.title} as done`}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 18 }}>{r.isDone ? '↩️' : '✅'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteReminder(r.id)}
                style={styles.actionBtn}
                accessibilityLabel={`Delete reminder ${r.title}`}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 18 }}>🗑</Text>
              </TouchableOpacity>
            </View>

            {!isPast && !r.isDone && (
              <View style={styles.notifyRow}>
                {new Date(r.date + (r.time ? 'T' + r.time : 'T23:59')).getTime() - Date.now() >
                  24 * 3600 * 1000 && (
                  <View style={[styles.notifyTag, { backgroundColor: colors.purpleBg }]}>
                    <Text style={[styles.notifyText, { color: colors.purple }]}>🔔 1 day before</Text>
                  </View>
                )}
                {new Date(r.date + (r.time ? 'T' + r.time : 'T23:59')).getTime() - Date.now() >
                  12 * 3600 * 1000 && (
                  <View style={[styles.notifyTag, { backgroundColor: colors.goldBg }]}>
                    <Text style={[styles.notifyText, { color: colors.gold }]}>⏰ 12 hrs before</Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        );
      })}

      <View style={styles.bottomPad} />
    </ScrollView>
    <Toast toast={toast} dismiss={dismissToast} />
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
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroCount: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 42,
    lineHeight: 48,
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  filterRow: { flexGrow: 0, marginBottom: 12 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, minHeight: 44, justifyContent: 'center' },
  filterPillText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  formLabel: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    marginBottom: 14,
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
    fontSize: 17,
    fontFamily: 'Outfit-Regular',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerWrap: {
    borderWidth: 0,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  switchSub: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  remCard: {
    marginBottom: 10,
  },
  remRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  remIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  remContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  remTitle: {
    flex: 1,
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  remAmount: { fontFamily: 'Outfit-Bold', fontSize: 15, marginBottom: 4 },
  doneTitle: {
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  remMeta: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    lineHeight: 17,
  },
  remCat: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  remDosage: { fontSize: 13, fontFamily: 'Outfit-SemiBold', marginTop: 4 },
  actionBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  notifyTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  notifyText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
  },
  bottomPad: {
    height: 40,
  },
});
