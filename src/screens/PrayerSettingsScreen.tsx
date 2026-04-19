import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, Alert, TouchableOpacity, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { gradients } from '../constants/colors';
import {
  METHOD_OPTIONS,
  HIGH_LAT_OPTIONS,
  ASR_OPTIONS,
  PAKISTAN_CITIES,
  schedulePrayerNotifications,
  scheduleFastingNotifications,
} from '../utils/prayer';
import type {
  CalculationMethodKey,
  HighLatitudeRule,
  AsrJuristicMethod,
  PrayerLocation,
  PrayerSettings,
} from '../types';

export default function PrayerSettingsScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { prayerSettings, setPrayerSettings } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [manualModal, setManualModal] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualName, setManualName] = useState('');
  const [locating, setLocating] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const useGPS = useCallback(async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Location denied',
          'ForSHE needs your location to calculate prayer times. You can still pick a city manually.',
        );
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let name = 'My Location';
      try {
        const rev = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (rev.length > 0) {
          const r = rev[0];
          name = r.city || r.subregion || r.region || r.country || 'My Location';
        }
      } catch {
        /* ignore */
      }
      const location: PrayerLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, name };
      setPrayerSettings(s => ({
        ...s,
        enabled: true,
        location,
        locationSource: 'gps',
      }));
      showToast(`Location set to ${name}`);
    } catch (e: any) {
      Alert.alert('Location error', e?.message || 'Could not determine your location. Pick a city manually instead.');
    } finally {
      setLocating(false);
    }
  }, [setPrayerSettings, showToast]);

  const openManual = useCallback(() => {
    setManualLat(prayerSettings.location ? String(prayerSettings.location.lat) : '');
    setManualLng(prayerSettings.location ? String(prayerSettings.location.lng) : '');
    setManualName(prayerSettings.location?.name || '');
    setManualModal(true);
  }, [prayerSettings.location]);

  const saveManual = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const name = manualName.trim();
    if (!name || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid', 'Please enter a valid city name, latitude (-90..90) and longitude (-180..180).');
      return;
    }
    setPrayerSettings(s => ({
      ...s,
      enabled: true,
      location: { lat, lng, name },
      locationSource: 'manual',
    }));
    setManualModal(false);
    showToast(`Location set to ${name}`);
  }, [manualLat, manualLng, manualName, setPrayerSettings, showToast]);

  const pickCity = useCallback(
    (city: { name: string; lat: number; lng: number }) => {
      setPrayerSettings(s => ({
        ...s,
        enabled: true,
        location: { lat: city.lat, lng: city.lng, name: city.name },
        locationSource: 'manual',
      }));
      setManualModal(false);
      showToast(`Location set to ${city.name}`);
    },
    [setPrayerSettings, showToast],
  );

  const toggleMaster = useCallback(
    (val: boolean) => {
      setPrayerSettings(s => ({ ...s, enabled: val }));
    },
    [setPrayerSettings],
  );

  const setMethod = useCallback(
    (m: CalculationMethodKey) => setPrayerSettings(s => ({ ...s, method: m })),
    [setPrayerSettings],
  );
  const setAsr = useCallback(
    (a: AsrJuristicMethod) => setPrayerSettings(s => ({ ...s, asrMethod: a })),
    [setPrayerSettings],
  );
  const setHighLat = useCallback(
    (h: HighLatitudeRule) => setPrayerSettings(s => ({ ...s, highLatitudeRule: h })),
    [setPrayerSettings],
  );

  const toggle = useCallback(
    (key: keyof PrayerSettings) => (val: boolean) => {
      setPrayerSettings(s => ({ ...s, [key]: val } as PrayerSettings));
    },
    [setPrayerSettings],
  );

  const saveAndSchedule = useCallback(async () => {
    if (!prayerSettings.location) {
      Alert.alert('Location needed', 'Set a location first — either via GPS or by picking a city manually.');
      return;
    }
    setScheduling(true);
    try {
      const prayerIds = await schedulePrayerNotifications(prayerSettings);
      const fastingIds = await scheduleFastingNotifications(prayerSettings);
      setPrayerSettings(s => ({
        ...s,
        prayerNotifIds: prayerIds,
        fastingNotifIds: fastingIds,
      }));
      if (prayerIds.length === 0 && fastingIds.length === 0 && prayerSettings.enabled) {
        Alert.alert(
          'Notifications permission',
          'ForSHE could not schedule reminders. Enable notification permission in your device settings.',
        );
      } else {
        showToast(`Scheduled ${prayerIds.length} prayer + ${fastingIds.length} fasting reminders`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not schedule reminders.');
    } finally {
      setScheduling(false);
    }
  }, [prayerSettings, setPrayerSettings, showToast]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Card gradient={dark ? gradients.greenHeroDark : gradients.greenHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.green }]}>🕌 Prayer Settings</Text>
              <Text style={[styles.title, { color: colors.deep }]}>Salah & Fasting</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Configure accurate times and Sunnah reminders
              </Text>
            </View>
          </View>
        </Card>

        {/* Master toggle */}
        <Card>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.deep }]}>Enable Prayer Times</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>
                {prayerSettings.enabled
                  ? 'Salah schedule + Sunnah reminders active'
                  : 'Turn on to use the feature'}
              </Text>
            </View>
            <Switch
              value={prayerSettings.enabled}
              onValueChange={toggleMaster}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* Location */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>📍 Location</Text>
          <Text style={[styles.desc, { color: colors.muted }]}>
            {prayerSettings.location
              ? `${prayerSettings.location.name} · ${prayerSettings.location.lat.toFixed(3)}, ${prayerSettings.location.lng.toFixed(3)} · ${prayerSettings.locationSource === 'gps' ? 'GPS' : 'Manual'}`
              : 'Not set yet'}
          </Text>
          <View style={styles.btnRow}>
            <Button
              title={locating ? 'Locating…' : 'Use GPS'}
              icon="📡"
              variant="gold"
              small
              onPress={useGPS}
              disabled={locating}
              style={styles.btnFlex}
            />
            <Button
              title="Enter manually"
              icon="✏️"
              variant="outline"
              small
              onPress={openManual}
              style={styles.btnFlex}
            />
          </View>
        </Card>

        {/* Calculation method */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🧭 Calculation Method</Text>
          <Text style={[styles.desc, { color: colors.muted }]}>
            Karachi is the default for South Asia.
          </Text>
          <View style={[styles.pickerWrap, { backgroundColor: colors.bg3 }]}>
            <Picker
              selectedValue={prayerSettings.method}
              onValueChange={setMethod}
              style={{ color: colors.text }}
              dropdownIconColor={colors.muted}
            >
              {METHOD_OPTIONS.map(m => (
                <Picker.Item key={m.key} value={m.key} label={m.label} />
              ))}
            </Picker>
          </View>
        </Card>

        {/* Asr juristic */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>📐 Asr Juristic Method</Text>
          <View style={styles.segmented}>
            {ASR_OPTIONS.map(opt => {
              const active = prayerSettings.asrMethod === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setAsr(opt.key)}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: active ? colors.goldBg : colors.bg3,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.gold : colors.sub,
                      fontFamily: 'Outfit-SemiBold',
                      fontSize: 13,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* High-latitude rule */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🌍 High Latitude Rule</Text>
          <Text style={[styles.desc, { color: colors.muted }]}>
            Only matters at very high/low latitudes. Middle of the Night is the safe default.
          </Text>
          <View style={[styles.pickerWrap, { backgroundColor: colors.bg3 }]}>
            <Picker
              selectedValue={prayerSettings.highLatitudeRule}
              onValueChange={setHighLat}
              style={{ color: colors.text }}
              dropdownIconColor={colors.muted}
            >
              {HIGH_LAT_OPTIONS.map(h => (
                <Picker.Item key={h.key} value={h.key} label={h.label} />
              ))}
            </Picker>
          </View>
        </Card>

        {/* Prayer notifications */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🔔 Prayer Notifications</Text>
          {[
            { key: 'prayerNotifyFajr' as const, label: '🌅 Fajr' },
            { key: 'prayerNotifyDhuhr' as const, label: '🌞 Dhuhr' },
            { key: 'prayerNotifyAsr' as const, label: '🌤️ Asr' },
            { key: 'prayerNotifyMaghrib' as const, label: '🌆 Maghrib' },
            { key: 'prayerNotifyIsha' as const, label: '🌙 Isha' },
          ].map(r => (
            <View
              key={r.key}
              style={[
                styles.row,
                { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 },
              ]}
            >
              <Text style={[styles.rowTitle, { color: colors.deep, flex: 1 }]}>{r.label}</Text>
              <Switch
                value={prayerSettings[r.key]}
                onValueChange={toggle(r.key)}
                trackColor={{ false: colors.border, true: colors.gold }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </Card>

        {/* Sunnah fasting */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.deep }]}>🌙 Sunnah Fasting Reminders</Text>
          <View style={[styles.row, { paddingVertical: 10 }]}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.deep }]}>Monday & Thursday</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>
                Reminder at 20:00 the night before
              </Text>
            </View>
            <Switch
              value={prayerSettings.mondayThursdayFasting}
              onValueChange={toggle('mondayThursdayFasting')}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.deep }]}>Ayyam al-Bid</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>
                13, 14, 15 of each Hijri month
              </Text>
            </View>
            <Switch
              value={prayerSettings.ayyamAlBidFasting}
              onValueChange={toggle('ayyamAlBidFasting')}
              trackColor={{ false: colors.border, true: colors.gold }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Button
          title={scheduling ? 'Scheduling…' : 'Save & Schedule Reminders'}
          icon="✅"
          variant="green"
          full
          onPress={saveAndSchedule}
          disabled={scheduling}
        />
      </ScrollView>

      {/* Manual location modal */}
      <Modal visible={manualModal} transparent animationType="slide" onRequestClose={() => setManualModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.bg }]}>
            <ScrollView
              contentContainerStyle={[styles.modalScroll, { paddingBottom: insets.bottom + 20 }]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalTitle, { color: colors.deep }]}>Pick a city</Text>
              <Text style={[styles.desc, { color: colors.muted }]}>
                Tap a Pakistani city for instant setup, or enter coordinates manually.
              </Text>
              <View style={styles.citiesWrap}>
                {PAKISTAN_CITIES.map(city => (
                  <TouchableOpacity
                    key={city.name}
                    onPress={() => pickCity(city)}
                    style={[styles.cityChip, { backgroundColor: colors.goldBg }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Set location to ${city.name}`}
                  >
                    <Text style={[styles.cityText, { color: colors.gold }]}>{city.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSubhead, { color: colors.deep }]}>Or enter manually</Text>
              <Input
                label="City name"
                placeholder="e.g. Dubai"
                value={manualName}
                onChangeText={setManualName}
              />
              <View style={styles.modalRow}>
                <View style={styles.modalFlex}>
                  <Input
                    label="Latitude"
                    placeholder="24.8607"
                    value={manualLat}
                    onChangeText={setManualLat}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.modalFlex}>
                  <Input
                    label="Longitude"
                    placeholder="67.0011"
                    value={manualLng}
                    onChangeText={setManualLng}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.btnRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  small
                  onPress={() => setManualModal(false)}
                  style={styles.btnFlex}
                />
                <Button
                  title="Save"
                  icon="✅"
                  variant="gold"
                  small
                  onPress={saveManual}
                  style={styles.btnFlex}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  heroLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 6,
  },
  title: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 28, lineHeight: 34 },
  subtitle: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },

  sectionLabel: {
    fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 10,
  },
  desc: { fontSize: 13, fontFamily: 'Outfit-Regular', marginBottom: 12, lineHeight: 20 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  rowSub: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnFlex: { flex: 1 },

  pickerWrap: { borderRadius: 16, overflow: 'hidden', minHeight: 44 },

  segmented: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalScroll: { padding: 24 },
  modalTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, marginBottom: 8 },
  modalSubhead: {
    fontSize: 13, fontFamily: 'Outfit-Bold', textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 16, marginBottom: 8,
  },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalFlex: { flex: 1 },

  citiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  cityText: { fontFamily: 'Outfit-SemiBold', fontSize: 13 },
});
