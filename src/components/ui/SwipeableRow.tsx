import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

/**
 * v1.2.5-dev: SwipeableRow — a thin wrapper around
 * `react-native-gesture-handler/Swipeable` that enforces the ForSHE swipe
 * contract for list rows:
 *
 *  - Left-swipe only (actions render on the right edge).
 *  - Each action is 44×44 minimum (WCAG).
 *  - Each action fires `Haptics.impactAsync(Light)` once, then the callback.
 *  - Destructive delete actions MUST show an Undo toast (the v1.1.3 rule).
 *    This wrapper doesn't fire the toast itself — it simply calls your
 *    callback; wiring the toast is the screen's responsibility (exactly like
 *    it always has been).
 *  - Tap still works for navigation — Swipeable does not intercept vertical
 *    pans or taps unless the user crosses the swipe threshold.
 *  - Do NOT wrap single-column grid tiles (home block mini-tiles, drawer
 *    items) in this. Only flat list rows.
 *
 * Canonical usage:
 *
 *     <SwipeableRow
 *       actions={[
 *         { kind: 'edit', onPress: () => openEdit(item) },
 *         { kind: 'delete', onPress: () => deleteItem(item.id) },
 *       ]}
 *     >
 *       <Card>...</Card>
 *     </SwipeableRow>
 *
 * Supported kinds:
 *   'delete'  — red gradient, 🗑 icon, "Delete" label
 *   'edit'    — outline neutral, ✏️ icon, "Edit" label
 *   'done'    — green solid, ✓ icon, "Done" label
 *   'call'    — gold solid, 📞 icon, "Call" label
 *   'custom'  — caller supplies { label, icon, bg, fg }
 */

export type SwipeActionKind = 'delete' | 'edit' | 'done' | 'call' | 'custom';

export interface SwipeAction {
  kind: SwipeActionKind;
  onPress: () => void;
  /** Only used when kind === 'custom'. */
  label?: string;
  /** Only used when kind === 'custom'. */
  icon?: string;
  /** Only used when kind === 'custom'. */
  bg?: string;
  /** Only used when kind === 'custom'. */
  fg?: string;
}

interface Props {
  children: React.ReactNode;
  actions: SwipeAction[];
  /** Optional identifier passed to `accessibilityLabel` for each action button. */
  itemLabel?: string;
}

function SwipeableRowImpl({ children, actions, itemLabel }: Props) {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable | null>(null);

  const resolveTone = useCallback((a: SwipeAction) => {
    switch (a.kind) {
      case 'delete':
        return { bg: colors.red, fg: '#fff', icon: '🗑', label: 'Delete' };
      case 'edit':
        return { bg: colors.bg3, fg: colors.deep, icon: '✏️', label: 'Edit' };
      case 'done':
        return { bg: colors.green, fg: '#fff', icon: '✓', label: 'Done' };
      case 'call':
        return { bg: colors.gold, fg: '#fff', icon: '📞', label: 'Call' };
      case 'custom':
      default:
        return {
          bg: a.bg || colors.bg3,
          fg: a.fg || colors.deep,
          icon: a.icon || '•',
          label: a.label || '',
        };
    }
  }, [colors]);

  const fireAction = useCallback((a: SwipeAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Close the row, then fire the callback. Gives the user visual feedback
    // that their swipe was accepted.
    swipeableRef.current?.close();
    a.onPress();
  }, []);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, _drag: Animated.AnimatedInterpolation<number>) => {
      return (
        <View style={styles.actionsRow}>
          {actions.map((a, i) => {
            const t = resolveTone(a);
            const labelText = itemLabel ? `${t.label} ${itemLabel}` : t.label;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.actionBtn, { backgroundColor: t.bg }]}
                onPress={() => fireAction(a)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={labelText}
              >
                <Text style={[styles.actionIcon, { color: t.fg }]}>{t.icon}</Text>
                {t.label ? (
                  <Text style={[styles.actionLabel, { color: t.fg }]} numberOfLines={1}>
                    {t.label}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    },
    [actions, resolveTone, fireAction, itemLabel],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

export const SwipeableRow = React.memo(SwipeableRowImpl);

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    // Make sure the row lines up vertically with the Card's internal padding.
    paddingLeft: 8,
    marginBottom: 10, // matches Card default gap in list screens
  },
  actionBtn: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: 12,
    marginLeft: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionIcon: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 0.3,
  },
});
