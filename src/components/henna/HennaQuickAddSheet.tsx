import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  hennaColors,
  hennaFonts,
  hennaRadii,
  hennaTextStyles,
} from '../../constants/hennaTokens';
import { HennaIcon } from './HennaIcons';
import type { HennaIconName } from './HennaIcons';
import { HennaInput } from './HennaInput';
import { HennaButton } from './HennaButton';

export type QuickAddMode = 'expense' | 'topup';

export interface QuickAddPayload {
  mode: QuickAddMode;
  label: string;
  amount: number;
  cat: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: QuickAddPayload) => void;
  /** Pre-built preset rail. Falls back to default 6-preset rail when undefined. */
  presets?: { label: string; icon: HennaIconName; cat: string; amount?: number }[];
  currencyCode?: string;
}

const DEFAULT_PRESETS: { label: string; icon: HennaIconName; cat: string; amount: number }[] = [
  { label: 'Vegetables',  icon: 'veg',         cat: '🍔 Food',      amount: 200 },
  { label: 'Milk',        icon: 'milk',        cat: '🍔 Food',      amount: 200 },
  { label: 'Bread',       icon: 'bread',       cat: '🍔 Food',      amount: 200 },
  { label: 'Petrol',      icon: 'fuel',        cat: '🚗 Transport', amount: 200 },
  { label: 'Medicine',    icon: 'pill',        cat: '💊 Health',    amount: 200 },
  { label: 'Electricity', icon: 'electricity', cat: '💡 Bills',     amount: 200 },
];

/**
 * Bottom-sheet quick-add. Presentational only — phase 4 ships this; the
 * actual global FAB swap is phase 6 scope. Uses RN `Modal` (slide-up)
 * since RN has no native bottom-sheet primitive.
 */
function HennaQuickAddSheetImpl({
  visible,
  onClose,
  onSave,
  presets = DEFAULT_PRESETS,
  currencyCode = 'PKR',
}: Props) {
  const [mode, setMode] = useState<QuickAddMode>('expense');
  const [label, setLabel] = useState('');
  const [amt, setAmt] = useState('');

  const handleSave = useCallback(() => {
    const v = parseFloat(amt);
    if (!isNaN(v) && v > 0) {
      onSave({ mode, label, amount: v, cat: '🛒 Other' });
      setLabel('');
      setAmt('');
    }
    onClose();
  }, [amt, mode, label, onSave, onClose]);

  const handlePreset = useCallback(
    (p: typeof presets[number]) => {
      onSave({ mode: 'expense', label: p.label, amount: p.amount ?? 200, cat: p.cat });
      onClose();
    },
    [onSave, onClose],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" />
        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.title}>Quick Add</Text>
          <Text style={styles.tagline}>Log a transaction in {currencyCode}</Text>

          {/* Mode toggle */}
          <View style={styles.toggleRow}>
            {([
              ['topup', 'Received', hennaColors.sage] as const,
              ['expense', 'Expense', hennaColors.henna] as const,
            ]).map(([k, l, bg]) => {
              const on = mode === k;
              return (
                <Pressable
                  key={k}
                  accessibilityRole="button"
                  accessibilityLabel={l}
                  accessibilityState={{ selected: on }}
                  onPress={() => setMode(k)}
                  style={[
                    styles.toggleBtn,
                    on && { backgroundColor: bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: on ? hennaColors.paper : hennaColors.muted },
                    ]}
                  >
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[hennaTextStyles.eyebrow, styles.presetLabel]}>Quick presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            {presets.map((p) => (
              <Pressable
                key={p.label}
                accessibilityRole="button"
                accessibilityLabel={p.label}
                onPress={() => handlePreset(p)}
                style={styles.presetTile}
              >
                <HennaIcon name={p.icon} size={20} color={hennaColors.henna} />
                <Text style={styles.presetText}>{p.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <HennaInput
            label="Label"
            value={label}
            placeholder="What did you buy?"
            onChangeText={setLabel}
            containerStyle={styles.field}
          />
          <HennaInput
            label={`Amount (${currencyCode})`}
            value={amt}
            placeholder="Amount"
            keyboardType="decimal-pad"
            onChangeText={setAmt}
            icon="money"
            containerStyle={styles.fieldLast}
          />

          <View style={styles.actionsRow}>
            <HennaButton title="Cancel" onPress={onClose} variant="outline" style={{ flex: 1 }} />
            <HennaButton
              title={`+ Add ${mode === 'expense' ? 'Expense' : 'Received'}`}
              onPress={handleSave}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(60,40,20,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: hennaColors.pearl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: hennaColors.lineStrong,
  },
  title: {
    fontFamily: hennaFonts.serif,
    fontSize: 22,
    color: hennaColors.ink,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.muted,
    marginBottom: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
    backgroundColor: hennaColors.paper2,
    padding: 4,
    borderRadius: hennaRadii.pill,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: hennaRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  toggleText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 13,
  },
  presetLabel: {
    marginBottom: 10,
  },
  presetRow: {
    gap: 8,
    paddingBottom: 18,
  },
  presetTile: {
    backgroundColor: hennaColors.paper,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    minHeight: 72,
    gap: 4,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  presetText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    color: hennaColors.ink2,
  },
  field: {
    marginBottom: 12,
  },
  fieldLast: {
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export const HennaQuickAddSheet = React.memo(HennaQuickAddSheetImpl);
