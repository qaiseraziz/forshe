import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { gradients } from '../constants/colors';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Toast, useToast } from './ui/Toast';
import { CAT_KEYS } from '../constants/data';
import { todayStr } from '../utils/dates';
import { checkBudgetAlert } from '../utils/budgetAlerts';
import { Transaction } from '../types';

/**
 * Global floating action button: appears above the bottom tab bar, adds an
 * expense or top-up from anywhere. Respects safe-area inset + the ~90px the
 * floating tab pill eats so it never clips the tabs.
 *
 * Mounted once inside the authenticated tree, at the `DrawerNav`'s sibling in
 * `App.tsx`. Screens should not render their own copy.
 */
export const QuickAddFAB = React.memo(function QuickAddFAB() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { history, setHistory, budget } = useData();
  const { currency, pkrF } = useCurrency();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'expense' | 'topup'>('expense');
  const [label, setLabel] = useState('');
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState(CAT_KEYS[0]);

  const resetForm = useCallback(() => {
    setLabel('');
    setAmt('');
    setCat(CAT_KEYS[0]);
    setMode('expense');
  }, []);

  const openSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  }, []);
  const closeSheet = useCallback(() => {
    setOpen(false);
    resetForm();
  }, [resetForm]);

  const save = useCallback(() => {
    const value = parseFloat(amt);
    if (isNaN(value) || value <= 0) return;
    if (mode === 'expense' && !label.trim()) return;

    const td = todayStr();
    const entry: Transaction = mode === 'expense'
      ? {
          id: Date.now(),
          type: 'expense',
          label: label.trim(),
          amount: value,
          cat,
          date: td,
        }
      : {
          id: Date.now(),
          type: 'topup',
          label: label.trim() || 'Received from husband',
          amount: value,
          cat: '',
          date: td,
        };

    setHistory(h => [entry, ...h]);

    if (mode === 'expense' && budget > 0) {
      // Recompute month-to-date including this new entry
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthSpent = history
        .filter(h => {
          if (h.type !== 'expense') return false;
          const p = h.date.split('/');
          return p.length === 3 && `${p[2]}-${p[1]}` === ym;
        })
        .reduce((s, h) => s + h.amount, 0);
      checkBudgetAlert(monthSpent + value, budget);
    }

    const icon = mode === 'expense' ? '🛒' : '💵';
    const suffix = mode === 'expense' ? ' logged' : ' received';
    showToast(icon + ' ' + pkrF(value) + suffix, () => {
      setHistory(h => h.filter(x => x.id !== entry.id));
    });
    setOpen(false);
    resetForm();
  }, [mode, label, amt, cat, budget, history, setHistory, pkrF, showToast, resetForm]);

  // Keep the FAB above the floating tab pill (~75px from BottomTabs + safe area).
  const fabBottom = Math.max(insets.bottom, 8) + 82;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel="Quick add expense or top-up"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.fab, { bottom: fabBottom, shadowColor: '#c8860a' }]}
      >
        <LinearGradient
          colors={gradients.goldBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeSheet}
          />
          <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.handle}>
                <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
              </View>
              <Text style={[styles.sheetTitle, { color: colors.deep }]}>
                Quick Add
              </Text>
              <Text style={[styles.sheetSub, { color: colors.muted }]}>
                Log a transaction in {currency.code}
              </Text>

              {/* Toggle */}
              <View style={styles.toggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: mode === 'topup' ? 'rgba(200,134,10,0.12)' : colors.bg3 },
                  ]}
                  onPress={() => setMode('topup')}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: mode === 'topup' ? colors.gold : colors.muted },
                  ]}>💰 Received</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: mode === 'expense' ? 'rgba(200,134,10,0.12)' : colors.bg3 },
                  ]}
                  onPress={() => setMode('expense')}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: mode === 'expense' ? colors.gold : colors.muted },
                  ]}>🛒 Expense</Text>
                </TouchableOpacity>
              </View>

              <Input
                placeholder={mode === 'expense' ? 'What did you buy?' : 'Note (optional)'}
                value={label}
                onChangeText={setLabel}
                style={styles.input}
              />
              <Input
                placeholder={`Amount in ${currency.code}`}
                keyboardType="numeric"
                value={amt}
                onChangeText={setAmt}
                style={styles.input}
              />

              {mode === 'expense' && (
                <View style={[styles.pickerWrap, { backgroundColor: colors.bg3 }]}>
                  <Picker
                    selectedValue={cat}
                    onValueChange={setCat}
                    style={{ color: colors.text }}
                    dropdownIconColor={colors.sub}
                  >
                    {CAT_KEYS.map(c => (
                      <Picker.Item key={c} value={c} label={c} style={{ fontSize: 13 }} />
                    ))}
                  </Picker>
                </View>
              )}

              <View style={styles.btnRow}>
                <Button title="Cancel" variant="outline" small onPress={closeSheet} style={{ flex: 1 }} />
                <Button
                  title={mode === 'expense' ? '+ Add Expense' : '+ Add Received'}
                  variant={mode === 'expense' ? 'gold' : 'green'}
                  small
                  onPress={save}
                  style={{ flex: 2 }}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </>
  );
});
QuickAddFAB.displayName = 'QuickAddFAB';

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 200,
  },
  fabIcon: {
    fontSize: 34,
    color: '#fff',
    fontFamily: 'Outfit-Bold',
    lineHeight: 36,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: { alignItems: 'center', marginBottom: 12 },
  handleBar: { width: 48, height: 4, borderRadius: 2 },
  sheetTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, marginBottom: 4 },
  sheetSub: { fontFamily: 'Outfit-Regular', fontSize: 13, marginBottom: 16 },
  toggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  toggleText: { fontFamily: 'Outfit-Bold', fontSize: 14 },
  input: { marginBottom: 10 },
  pickerWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, minHeight: 54, justifyContent: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
