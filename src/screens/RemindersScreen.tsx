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
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { REMINDER_CATS } from '../constants/data';
import { fmtISO, todayISO, dateToISO } from '../utils/dates';
import { Reminder } from '../types';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

async function scheduleNotifications(rem: Reminder) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const target = new Date(rem.date + (rem.time ? 'T' + rem.time : 'T23:59'));
    const now = Date.now();

    // 24h before
    const t24h = target.getTime() - 24 * 3600 * 1000;
    if (t24h > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Reminder Tomorrow',
          body: rem.title,
        },
        trigger: { date: new Date(t24h) } as any,
      });
    }

    // 12h before
    const t12h = target.getTime() - 12 * 3600 * 1000;
    if (t12h > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Reminder in 12 Hours',
          body: rem.title,
        },
        trigger: { date: new Date(t12h) } as any,
      });
    }
  } catch {
    // silently fail
  }
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

export default function RemindersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { reminders, setReminders } = useData();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState<Date | null>(null);
  const [cat, setCat] = useState(REMINDER_CATS[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const upcoming = useMemo(
    () =>
      reminders.filter(r => {
        const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
        return t >= new Date() && !r.isDone;
      }),
    [reminders],
  );

  const sorted = useMemo(() => {
    const now = new Date();
    return [...reminders].sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      const ta = new Date(a.date + (a.time ? 'T' + a.time : 'T23:59'));
      const tb = new Date(b.date + (b.time ? 'T' + b.time : 'T23:59'));
      const af = ta >= now;
      const bf = tb >= now;
      if (af && !bf) return -1;
      if (!af && bf) return 1;
      return ta.getTime() - tb.getTime();
    });
  }, [reminders]);

  const addReminder = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please enter a reminder title.');
      return;
    }
    const dateStr = dateToISO(date);
    const timeStr = time
      ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
      : '';
    const rem: Reminder = {
      id: Date.now(),
      title: title.trim(),
      date: dateStr,
      time: timeStr,
      cat,
      isDone: false,
    };
    setReminders(r => [rem, ...r]);
    scheduleNotifications(rem);
    setTitle('');
    setTime(null);
  }, [title, date, time, cat, setReminders]);

  const deleteReminder = useCallback(
    (id: number) => {
      Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setReminders(r => r.filter(x => x.id !== id)),
        },
      ]);
    },
    [setReminders],
  );

  const toggleDone = useCallback(
    (id: number) => {
      setReminders(r => r.map(x => (x.id === id ? { ...x, isDone: !x.isDone } : x)));
    },
    [setReminders],
  );

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  };

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) setTime(selected);
  };

  const badgeProps = (cls: string) => {
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
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card */}
      <Card style={{ backgroundColor: colors.purpleBg, borderColor: colors.purpleBorder }}>
        <View style={styles.heroTopRow}>
          <Text style={[styles.heroLabel, { color: colors.purple }]}>🔔 Active Reminders</Text>
          <DrawerMenuButton />
        </View>
        <Text style={[styles.heroCount, { color: colors.purple }]}>{upcoming.length}</Text>
        <Text style={[styles.heroSub, { color: colors.sub }]}>
          {upcoming.length
            ? `Next: ${[...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0].title}`
            : 'No upcoming reminders'}
        </Text>
      </Card>

      {/* Add Reminder Form */}
      <Card>
        <Text style={[styles.formLabel, { color: colors.purple }]}>📝 New Reminder</Text>

        <Input
          label="Reminder Title"
          placeholder="e.g. Pay electricity bill..."
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
            onPress={() => {
              setTime(new Date());
              setShowTimePicker(true);
            }}
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

        <Button
          title="+ Add Reminder"
          variant="gold"
          full
          onPress={addReminder}
          style={{ marginTop: 14 }}
        />
      </Card>

      {/* Reminders List */}
      <Divider label={`All Reminders · ${reminders.length} items`} />

      {!reminders.length && (
        <EmptyState icon="🔔" text="No reminders yet. Add one above to get started!" />
      )}

      {sorted.map(r => {
        const st = remStatus(r);
        const until = daysUntil(r.date, r.time);
        const isPast = !until;
        const bp = badgeProps(st.cls);

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
                <Text
                  style={[
                    styles.remTitle,
                    { color: colors.deep },
                    r.isDone && styles.doneTitle,
                  ]}
                >
                  {r.title}
                </Text>

                <View style={styles.badgeRow}>
                  {r.isDone ? (
                    <Badge text="✅ Done" bg={colors.greenBg} color={colors.green} />
                  ) : (
                    <Badge text={st.label} bg={bp.bg} color={bp.color} />
                  )}
                </View>

                <Text style={[styles.remMeta, { color: colors.muted }]}>
                  {fmtISO(r.date)}
                  {r.time ? ' at ' + r.time : ''}
                  {until && !r.isDone ? ' · ' + until : ''}
                </Text>
                <Text style={[styles.remCat, { color: colors.muted }]}>{r.cat}</Text>
              </View>

              <TouchableOpacity onPress={() => toggleDone(r.id)} style={styles.actionBtn}>
                <Text style={{ fontSize: 18 }}>{r.isDone ? '↩️' : '✅'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteReminder(r.id)} style={styles.actionBtn}>
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
    width: 42,
    height: 42,
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
  remTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  doneTitle: {
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
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
  actionBtn: {
    padding: 6,
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
