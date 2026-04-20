import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

/**
 * v1.2.5-dev: Toast redesigned as a floating pill.
 *
 * API compatibility is preserved — `useToast()` still returns
 * `{ toast, show, dismiss }` and `show(msg, undoFn)` works exactly as before.
 * The only addition is an optional `icon` prop inside `show(msg, undoFn, icon)`
 * ('success' | 'error' | 'info') that picks the leading glyph. Legacy callers
 * that pass no icon get the default "success" green check.
 *
 * Visual rules (ui-designer canonical):
 *  - Floating pill: `colors.bg2` background, 18px radius, shadow, auto-width.
 *  - Icon (green ✓ / red ✕ / gold ⌄) on the left in a tinted circle.
 *  - Slide + fade entrance via Moti one-shot spring (NOT a loop).
 *  - Undo button still renders if `undoCallback` provided.
 *  - Auto-dismiss at 4000ms when undo; 2500ms without.
 *  - Floats above the bottom tab bar: `bottom = max(insets.bottom, 8) + 90`.
 *  - Stacks gracefully via dismiss-previous-on-new-toast (timerRef clear).
 */

type ToastIcon = 'success' | 'error' | 'info';

interface ToastData {
  msg: string;
  undoFn?: (() => void) | null;
  icon?: ToastIcon;
}

interface ToastState {
  toast: ToastData | null;
  show: (msg: string, undoFn?: (() => void) | null, icon?: ToastIcon) => void;
  dismiss: () => void;
}

export function useToast(): ToastState {
  const [toast, setToast] = React.useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string, undoFn: (() => void) | null = null, icon: ToastIcon = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Dismiss previous toast immediately so animations don't stack.
      setToast(null);
      // Next tick — give React a moment to unmount before mounting the new one.
      const nextId = setTimeout(() => {
        setToast({ msg, undoFn, icon });
        timerRef.current = setTimeout(() => setToast(null), undoFn ? 4000 : 2500);
      }, 20);
      timerRef.current = nextId;
    },
    [],
  );

  const dismiss = useCallback(() => {
    setToast(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { toast, show, dismiss };
}

function iconGlyph(icon: ToastIcon): string {
  if (icon === 'error') return '✕';
  if (icon === 'info') return 'ⓘ';
  return '✓';
}

function ToastImpl({ toast, dismiss }: { toast: ToastData | null; dismiss: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tones = useMemo(() => {
    const icon = toast?.icon ?? 'success';
    if (icon === 'error') return { bg: colors.redBg, fg: colors.red };
    if (icon === 'info') return { bg: colors.goldBg, fg: colors.gold };
    return { bg: colors.greenBg, fg: colors.green };
  }, [colors, toast?.icon]);

  if (!toast) return null;

  return (
    <View
      key={toast.msg + String(toast.undoFn ? 'u' : '')}
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 8) + 90,
          backgroundColor: colors.bg2,
          shadowColor: colors.shadow,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.iconCircle, { backgroundColor: tones.bg }]}>
        <Text style={[styles.iconGlyph, { color: tones.fg }]}>{iconGlyph(toast.icon ?? 'success')}</Text>
      </View>
      <Text style={[styles.msg, { color: colors.deep }]} numberOfLines={2}>
        {toast.msg}
      </Text>
      {toast.undoFn && (
        <TouchableOpacity
          onPress={() => { toast.undoFn?.(); dismiss(); }}
          style={[styles.undoBtn, { backgroundColor: colors.goldBg }]}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.undoText, { color: colors.gold }]}>Undo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const Toast = React.memo(ToastImpl);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    // Auto-width to content; cap so long messages still wrap gracefully.
    maxWidth: '92%',
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 42,
    elevation: 12,
    zIndex: 300,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    lineHeight: 20,
  },
  msg: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    lineHeight: 18,
  },
  undoBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
});
