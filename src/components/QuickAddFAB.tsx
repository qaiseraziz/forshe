import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useCurrency } from '../context/CurrencyContext';
import { Toast, useToast } from './ui/Toast';
import { CAT_KEYS } from '../constants/data';
import { todayStr } from '../utils/dates';
import { checkBudgetAlert } from '../utils/budgetAlerts';
import { Transaction } from '../types';
import { HennaFab, HennaQuickAddSheet } from './henna';
import type { QuickAddPayload } from './henna';

/**
 * Phase 6F: the FAB visual is HennaFab; the open-sheet is HennaQuickAddSheet.
 * All previous wiring is preserved — mode toggle, budget alerts, undo toast.
 */
export const QuickAddFAB = React.memo(function QuickAddFAB() {
  const insets = useSafeAreaInsets();
  const { history, setHistory, budget } = useData();
  const { currency, pkrF } = useCurrency();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [open, setOpen] = useState(false);

  const openSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setOpen(false);
  }, []);

  const save = useCallback(
    (payload: QuickAddPayload) => {
      const value = payload.amount;
      if (isNaN(value) || value <= 0) return;
      const label = payload.label?.trim() || (payload.mode === 'topup' ? 'Received from husband' : '');
      if (payload.mode === 'expense' && !label) return;

      const td = todayStr();
      const entry: Transaction =
        payload.mode === 'expense'
          ? {
              id: Date.now(),
              type: 'expense',
              label,
              amount: value,
              cat: payload.cat || CAT_KEYS[0],
              date: td,
            }
          : {
              id: Date.now(),
              type: 'topup',
              label,
              amount: value,
              cat: '',
              date: td,
            };

      setHistory(h => [entry, ...h]);

      if (payload.mode === 'expense' && budget > 0) {
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

      const suffix = payload.mode === 'expense' ? ' logged' : ' received';
      showToast(pkrF(value) + suffix, () => {
        setHistory(h => h.filter(x => x.id !== entry.id));
      });
    },
    [budget, history, setHistory, pkrF, showToast],
  );

  // Keep the FAB above the floating tab pill (~75px from BottomTabs + safe area).
  const fabBottom = Math.max(insets.bottom, 8) + 82;

  return (
    <>
      <HennaFab
        onPress={openSheet}
        style={{ position: 'absolute', right: 20, bottom: fabBottom, zIndex: 200 }}
        accessibilityLabel="Quick add expense or top-up"
      />

      <HennaQuickAddSheet
        visible={open}
        onClose={closeSheet}
        onSave={save}
        currencyCode={currency.code}
      />

      <Toast toast={toast} dismiss={dismissToast} />
    </>
  );
});
QuickAddFAB.displayName = 'QuickAddFAB';
