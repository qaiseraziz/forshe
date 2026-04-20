import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { gradients } from '../constants/colors';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Divider } from '../components/ui/Divider';
import { Toast, useToast } from '../components/ui/Toast';
import { Picker } from '@react-native-picker/picker';
import { useSecureStorage } from '../hooks/useSecureStorage';
import { useStorage } from '../hooks/useStorage';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { CAT_KEYS } from '../constants/data';
import { CURRENCIES } from '../constants/currencies';
import { useCurrency } from '../context/CurrencyContext';
import { scheduleBodyStatsReminder, cancelBodyStatsReminder } from '../utils/bodyStatsNotifications';

export default function SettingsScreen() {
  const { colors, dark, setDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { recurring, setRecurring, bodyStatsSettings, setBodyStatsSettings, prayerSettings } = useData();
  const { pkrF, currencyCode, currency, setCurrency } = useCurrency();
  const systemScheme = useColorScheme();
  const [biometricEnabled, setBiometricEnabled] = useStorage<boolean>('hm_biometric_lock', false);
  const { toast, show: showToast, dismiss: dismissToast } = useToast();
  const [pin, setPin] = useSecureStorage('forshe_pin', '');
  const [pinInput, setPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [recLabel, setRecLabel] = useState('');
  const [recAmt, setRecAmt] = useState('');
  const [recCat, setRecCat] = useState(CAT_KEYS[0]);
  const [recDay, setRecDay] = useState('1');
  const [showBodyTimePicker, setShowBodyTimePicker] = useState(false);

  const addRecurring = useCallback(() => {
    const amt = parseFloat(recAmt);
    const day = parseInt(recDay, 10);
    if (!recLabel.trim() || isNaN(amt) || amt <= 0 || isNaN(day) || day < 1 || day > 28) {
      Alert.alert('Invalid', 'Fill all fields correctly. Amount must be > 0 and day must be 1-28.');
      return;
    }
    setRecurring(r => [...r, { id: Date.now(), label: recLabel.trim(), amount: amt, cat: recCat, dayOfMonth: day, enabled: true }]);
    setRecLabel(''); setRecAmt(''); setRecDay('1');
  }, [recLabel, recAmt, recDay, recCat, setRecurring]);

  const toggleDark = useCallback(() => setDark(d => !d), [setDark]);

  const matchSystemTheme = useCallback(() => {
    setDark(systemScheme === 'dark');
  }, [setDark, systemScheme]);

  const toggleBiometric = useCallback(async (val: boolean) => {
    if (!val) {
      setBiometricEnabled(false);
      return;
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware) {
        Alert.alert('Not supported', 'This device does not have biometric hardware.');
        return;
      }
      if (!enrolled) {
        Alert.alert(
          'Not enrolled',
          'No fingerprint or face is enrolled. Enroll one in your device settings first.',
        );
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm to enable biometric lock',
      });
      if (res.success) {
        setBiometricEnabled(true);
      }
    } catch {
      Alert.alert('Error', 'Could not verify biometric authentication.');
    }
  }, [setBiometricEnabled]);

  const togglePinLock = useCallback((val: boolean) => {
    if (!val) {
      setPin('');
      setShowPinInput(false);
    } else {
      setShowPinInput(true);
    }
  }, [setPin]);

  const handleSetPin = useCallback(() => {
    if (pinInput.length === 4) {
      setPin(pinInput);
      setPinInput('');
      setShowPinInput(false);
      Alert.alert('PIN Set', 'Your app is now protected with a PIN.');
    } else {
      Alert.alert('Invalid', 'PIN must be exactly 4 digits.');
    }
  }, [pinInput, setPin]);

  const handlePinInputChange = useCallback((t: string) => {
    setPinInput(t.replace(/[^0-9]/g, '').slice(0, 4));
  }, []);

  const handleRecDayChange = useCallback((t: string) => {
    setRecDay(t.replace(/[^0-9]/g, '').slice(0, 2));
  }, []);

  // --- Body Stats ---
  const toggleBodyStats = useCallback(async (val: boolean) => {
    if (val) {
      Alert.alert(
        'Enable Body Stats',
        'Body Stats lets you log weight, blood pressure, sugar and more. Open the drawer and tap "Body Stats" to get started.',
        [{ text: 'OK' }],
      );
      setBodyStatsSettings(s => ({ ...s, enabled: true }));
    } else {
      Alert.alert(
        'Disable Body Stats?',
        'Your existing logs will be preserved but the Body Stats screen will show a disabled message until re-enabled.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await cancelBodyStatsReminder(bodyStatsSettings.reminderNotifIds);
              setBodyStatsSettings(s => ({
                ...s,
                enabled: false,
                reminderEnabled: false,
                reminderNotifIds: [],
              }));
            },
          },
        ],
      );
    }
  }, [bodyStatsSettings.reminderNotifIds, setBodyStatsSettings]);

  const toggleBodyReminder = useCallback(async (val: boolean) => {
    if (val) {
      const ids = await scheduleBodyStatsReminder(bodyStatsSettings.reminderTime);
      if (ids.length === 0) {
        Alert.alert(
          'Permission Needed',
          'Please grant notification permission in your device settings to receive reminders.',
        );
        return;
      }
      setBodyStatsSettings(s => ({ ...s, reminderEnabled: true, reminderNotifIds: ids }));
    } else {
      await cancelBodyStatsReminder(bodyStatsSettings.reminderNotifIds);
      setBodyStatsSettings(s => ({ ...s, reminderEnabled: false, reminderNotifIds: [] }));
    }
  }, [bodyStatsSettings.reminderTime, bodyStatsSettings.reminderNotifIds, setBodyStatsSettings]);

  const openBodyTimePicker = useCallback(() => setShowBodyTimePicker(true), []);

  const onBodyTimeChange = useCallback(async (_: DateTimePickerEvent, selected?: Date) => {
    setShowBodyTimePicker(Platform.OS === 'ios');
    if (!selected) return;
    const hh = String(selected.getHours()).padStart(2, '0');
    const mm = String(selected.getMinutes()).padStart(2, '0');
    const newTime = `${hh}:${mm}`;

    // If reminders were already enabled, reschedule
    if (bodyStatsSettings.reminderEnabled) {
      await cancelBodyStatsReminder(bodyStatsSettings.reminderNotifIds);
      const ids = await scheduleBodyStatsReminder(newTime);
      setBodyStatsSettings(s => ({ ...s, reminderTime: newTime, reminderNotifIds: ids }));
    } else {
      setBodyStatsSettings(s => ({ ...s, reminderTime: newTime }));
    }
  }, [bodyStatsSettings.reminderEnabled, bodyStatsSettings.reminderNotifIds, setBodyStatsSettings]);

  // Parse HH:MM into a Date for the native picker
  const parseTimeToDate = useCallback((t: string): Date => {
    const [hStr, mStr] = t.split(':');
    const d = new Date();
    d.setHours(parseInt(hStr, 10) || 0, parseInt(mStr, 10) || 0, 0, 0);
    return d;
  }, []);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.gold }]}>⚙️ Preferences</Text>
              <Text style={[styles.title, { color: colors.deep }]}>Settings</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>Customize your experience</Text>
            </View>
          </View>
        </Card>

        {/* Appearance */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🎨 Appearance</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.deep }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: colors.muted }]}>
                {dark ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
            <Switch
              value={dark}
              onValueChange={toggleDark}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>
          {systemScheme && ((systemScheme === 'dark') !== dark) && (
            <Button
              title={`Match system (${systemScheme})`}
              variant="outline"
              small
              onPress={matchSystemTheme}
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
            />
          )}
        </Card>

        {/* Currency */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>💱 Currency</Text>
          <Text style={[styles.settingDesc, { color: colors.muted, marginBottom: 12 }]}>
            Selected: {currency.symbol} {currency.code} · {currency.name}
          </Text>
          <View style={[styles.recPickerWrap, { backgroundColor: colors.bg3 }]}>
            <Picker
              selectedValue={currencyCode}
              onValueChange={setCurrency}
              style={{ color: colors.text }}
              dropdownIconColor={colors.muted}
            >
              {CURRENCIES.map(c => (
                <Picker.Item key={c.code} value={c.code} label={`${c.symbol}  ${c.code} — ${c.name}`} />
              ))}
            </Picker>
          </View>
        </Card>

        {/* App Lock */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🔒 App Lock</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.deep }]}>PIN Lock</Text>
              <Text style={[styles.settingSub, { color: colors.muted }]}>
                {pin ? 'PIN is set — app will ask for PIN on launch' : 'No PIN set'}
              </Text>
            </View>
            <Switch
              value={!!pin}
              onValueChange={togglePinLock}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>
          {showPinInput && !pin && (
            <View style={styles.pinInputWrap}>
              <Input
                label="Set 4-digit PIN"
                placeholder="Enter 4 digits"
                value={pinInput}
                onChangeText={handlePinInputChange}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              <Button
                title="Set PIN"
                variant="gold"
                small
                onPress={handleSetPin}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              />
            </View>
          )}

          <View style={[styles.settingRow, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.deep }]}>Biometric Lock</Text>
              <Text style={[styles.settingSub, { color: colors.muted }]}>
                {biometricEnabled
                  ? 'Fingerprint or face required on launch'
                  : pin
                    ? 'Use fingerprint / face instead of PIN'
                    : 'Use fingerprint / face to unlock the app'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* Prayer Times */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🕌 Prayer Times</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrayerSettings')}
            accessibilityRole="button"
            accessibilityLabel="Open prayer times settings"
            activeOpacity={0.75}
            style={[styles.settingRow, { minHeight: 44 }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.deep }]}>
                Salah & Sunnah Fasting
              </Text>
              <Text style={[styles.settingSub, { color: colors.muted }]}>
                {prayerSettings.enabled && prayerSettings.location
                  ? `${prayerSettings.location.name} · ${prayerSettings.method} method`
                  : 'Tap to set up accurate prayer times and fasting reminders'}
              </Text>
            </View>
            <Text style={[styles.settingChevron, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Body Stats */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>💪 Body Stats</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.deep }]}>Enable Body Stats</Text>
              <Text style={[styles.settingSub, { color: colors.muted }]}>
                {bodyStatsSettings.enabled
                  ? 'Track weight, BP, sugar, oxygen and more'
                  : 'Turn on to log your vitals from the drawer'}
              </Text>
            </View>
            <Switch
              value={bodyStatsSettings.enabled}
              onValueChange={toggleBodyStats}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingRow, styles.bodyRowSpace, { opacity: bodyStatsSettings.enabled ? 1 : 0.4 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.deep }]}>Daily Reminder</Text>
              <Text style={[styles.settingSub, { color: colors.muted }]}>
                Push a notification once a day at your chosen time
              </Text>
            </View>
            <Switch
              value={bodyStatsSettings.reminderEnabled}
              onValueChange={toggleBodyReminder}
              disabled={!bodyStatsSettings.enabled}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            onPress={openBodyTimePicker}
            disabled={!bodyStatsSettings.enabled || !bodyStatsSettings.reminderEnabled}
            accessibilityRole="button"
            accessibilityLabel="Change body stats reminder time"
            style={[
              styles.timePickerBtn,
              {
                backgroundColor: colors.bg3,
                opacity:
                  bodyStatsSettings.enabled && bodyStatsSettings.reminderEnabled ? 1 : 0.4,
              },
            ]}
          >
            <Text style={[styles.timePickerLabel, { color: colors.muted }]}>REMINDER TIME</Text>
            <Text style={[styles.timePickerValue, { color: colors.text }]}>
              ⏰ {bodyStatsSettings.reminderTime}
            </Text>
          </TouchableOpacity>
          {showBodyTimePicker && (
            <DateTimePicker
              value={parseTimeToDate(bodyStatsSettings.reminderTime)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onBodyTimeChange}
            />
          )}
        </Card>

        {/* Recurring Expenses */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🔄 Recurring Expenses</Text>
          <Text style={[styles.settingDesc, { color: colors.muted, marginBottom: 12 }]}>
            Auto-add expenses on a specific day each month
          </Text>

          {/* Add form */}
          <Input placeholder="e.g. Rent, Electricity..." value={recLabel} onChangeText={setRecLabel} style={{ marginBottom: 8 }} />
          <View style={styles.recRow}>
            <View style={styles.recFlex}>
              <Input placeholder={`Amount (${currencyCode})`} keyboardType="numeric" value={recAmt} onChangeText={setRecAmt} />
            </View>
            <View style={styles.recFlex}>
              <Input placeholder="Day (1-28)" keyboardType="numeric" value={recDay} onChangeText={handleRecDayChange} />
            </View>
          </View>
          <View style={[styles.recPickerWrap, { backgroundColor: colors.bg3 }]}>
            <Picker selectedValue={recCat} onValueChange={setRecCat} style={{ color: colors.text }} dropdownIconColor={colors.muted}>
              {CAT_KEYS.map(c => <Picker.Item key={c} value={c} label={c} />)}
            </Picker>
          </View>
          <Button title="+ Add Recurring" variant="gold" small onPress={addRecurring} style={styles.addRecurringBtn} />

          {/* List */}
          {recurring.map(r => (
            <View key={r.id} style={[styles.settingRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.deep }]}>{r.label}</Text>
                <Text style={[styles.settingSub, { color: colors.muted }]}>
                  {pkrF(r.amount)} · Day {r.dayOfMonth} · {r.cat}
                </Text>
              </View>
              <Switch
                value={r.enabled}
                onValueChange={() => setRecurring(rr => rr.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}
                trackColor={{ false: colors.border, true: colors.gold }}
                thumbColor="#fff"
              />
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Remove Recurring', `Stop auto-adding "${r.label}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => {
                        setRecurring(rr => rr.filter(x => x.id !== r.id));
                        showToast('Recurring removed', () => {
                          setRecurring(rr => [r, ...rr]);
                        });
                      },
                    },
                  ]);
                }}
                style={styles.delBtn}
                accessibilityLabel={`Delete recurring expense ${r.label}`}
              >
                <Text style={{ fontSize: 18 }}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {/* Notifications */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🔔 Notifications</Text>
          <Text style={[styles.settingDesc, { color: colors.muted }]}>
            Reminders send push notifications at 24h and 12h before the due time. Make sure notifications are enabled in your device settings.
          </Text>
        </Card>

        {/* About */}
        <Divider label="About" />
        <Card>
          <View style={styles.aboutSection}>
            <Text style={[styles.aboutName, { color: colors.deep }]}>ForSHE</Text>
            <Text style={[styles.aboutVersion, { color: colors.muted }]}>Version 1.2.6</Text>
            <Text style={[styles.aboutDesc, { color: colors.sub }]}>
              Your complete home management companion. Track expenses, plan meals, manage maid tasks, set reminders, and more — all in one beautiful app.
            </Text>
          </View>
        </Card>

        {/* Data */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>💾 Data</Text>
          <Text style={[styles.settingDesc, { color: colors.muted }]}>
            All your data is stored locally on this device. Use the Backup screen to export your data regularly.
          </Text>
        </Card>

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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleSection: { flex: 1 },
  heroLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  title: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 30, lineHeight: 36 },
  subtitle: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },
  delBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, fontFamily: 'Outfit-SemiBold', marginBottom: 2 },
  settingSub: { fontSize: 13, fontFamily: 'Outfit-Regular' },
  settingChevron: { fontSize: 24, fontFamily: 'Outfit-Bold', marginLeft: 12 },
  settingDesc: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22 },
  aboutSection: { alignItems: 'center', paddingVertical: 10 },
  aboutName: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, marginBottom: 4 },
  aboutVersion: { fontSize: 13, fontFamily: 'Outfit-Regular', marginBottom: 12 },
  aboutDesc: {
    fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22, textAlign: 'center',
  },
  bottomPad: { height: 40 },
  pinInputWrap: { marginTop: 12 },
  recRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  recFlex: { flex: 1 },
  recPickerWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  addRecurringBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  bodyRowSpace: { marginTop: 14 },
  timePickerBtn: {
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 54,
  },
  timePickerLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timePickerValue: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
  },
});
