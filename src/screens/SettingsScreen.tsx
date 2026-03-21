import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Switch, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Divider } from '../components/ui/Divider';
import { Picker } from '@react-native-picker/picker';
import { useStorage } from '../hooks/useStorage';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { CAT_KEYS } from '../constants/data';
import { pkrF } from '../utils/currency';
import { RecurringExpense } from '../types';

export default function SettingsScreen() {
  const { colors, dark, setDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { recurring, setRecurring, history, setHistory } = useData();
  const [pin, setPin] = useStorage<string>('forshe_pin', '');
  const [pinInput, setPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [recLabel, setRecLabel] = useState('');
  const [recAmt, setRecAmt] = useState('');
  const [recCat, setRecCat] = useState(CAT_KEYS[0]);
  const [recDay, setRecDay] = useState('1');

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.deep }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Customize your experience</Text>
          </View>
          <DrawerMenuButton />
        </View>

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
              onValueChange={() => setDark(d => !d)}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
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
              onValueChange={(val) => {
                if (!val) {
                  setPin('');
                  setShowPinInput(false);
                } else {
                  setShowPinInput(true);
                }
              }}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>
          {showPinInput && !pin && (
            <View style={{ marginTop: 12 }}>
              <Input
                label="Set 4-digit PIN"
                placeholder="Enter 4 digits"
                value={pinInput}
                onChangeText={(t: string) => setPinInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              <Button
                title="Set PIN"
                variant="gold"
                small
                onPress={() => {
                  if (pinInput.length === 4) {
                    setPin(pinInput);
                    setPinInput('');
                    setShowPinInput(false);
                    Alert.alert('PIN Set', 'Your app is now protected with a PIN.');
                  } else {
                    Alert.alert('Invalid', 'PIN must be exactly 4 digits.');
                  }
                }}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              />
            </View>
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
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Input placeholder="Amount (PKR)" keyboardType="numeric" value={recAmt} onChangeText={setRecAmt} />
            </View>
            <View style={{ flex: 1 }}>
              <Input placeholder="Day (1-28)" keyboardType="numeric" value={recDay} onChangeText={(t: string) => setRecDay(t.replace(/[^0-9]/g, '').slice(0, 2))} />
            </View>
          </View>
          <View style={[{ borderRadius: 16, overflow: 'hidden', marginBottom: 8, backgroundColor: colors.bg3 }]}>
            <Picker selectedValue={recCat} onValueChange={setRecCat} style={{ color: colors.text }} dropdownIconColor={colors.muted}>
              {CAT_KEYS.map(c => <Picker.Item key={c} value={c} label={c} />)}
            </Picker>
          </View>
          <Button title="+ Add Recurring" variant="gold" small onPress={() => {
            const amt = parseFloat(recAmt);
            const day = parseInt(recDay);
            if (!recLabel.trim() || !amt || day < 1 || day > 28) {
              Alert.alert('Invalid', 'Fill all fields. Day must be 1-28.');
              return;
            }
            setRecurring(r => [...r, { id: Date.now(), label: recLabel.trim(), amount: amt, cat: recCat, dayOfMonth: day, enabled: true }]);
            setRecLabel(''); setRecAmt(''); setRecDay('1');
          }} style={{ alignSelf: 'flex-start', marginBottom: 12 }} />

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
              <TouchableOpacity onPress={() => setRecurring(rr => rr.filter(x => x.id !== r.id))} style={{ padding: 8 }}>
                <Text style={{ fontSize: 16 }}>🗑</Text>
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
            <Text style={[styles.aboutVersion, { color: colors.muted }]}>Version 1.0.0</Text>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleSection: { flex: 1 },
  title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28 },
  subtitle: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 2 },
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
  settingDesc: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22 },
  aboutSection: { alignItems: 'center', paddingVertical: 10 },
  aboutName: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, marginBottom: 4 },
  aboutVersion: { fontSize: 13, fontFamily: 'Outfit-Regular', marginBottom: 12 },
  aboutDesc: {
    fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22, textAlign: 'center',
  },
  bottomPad: { height: 40 },
});
