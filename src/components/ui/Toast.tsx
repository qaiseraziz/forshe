import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ToastData {
  msg: string;
  undoFn?: (() => void) | null;
}

interface ToastState {
  toast: ToastData | null;
  show: (msg: string, undoFn?: (() => void) | null) => void;
  dismiss: () => void;
}

export function useToast(): ToastState {
  const [toast, setToast] = React.useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, undoFn: (() => void) | null = null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, undoFn });
    timerRef.current = setTimeout(() => setToast(null), undoFn ? 4000 : 2500);
  }, []);

  const dismiss = useCallback(() => {
    setToast(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { toast, show, dismiss };
}

function ToastImpl({ toast, dismiss }: { toast: ToastData | null; dismiss: () => void }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.deep,
      shadowColor: colors.shadow,
    },
    msg: {
      color: colors.bg,
    },
    undoBtn: {
      backgroundColor: colors.gold,
    },
    undoText: {
      color: colors.bg,
    },
  }), [colors]);

  useEffect(() => {
    if (toast) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      opacity.setValue(0);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <Animated.View style={[styles.container, dynamicStyles.container, { opacity }]}>
      <Text style={[styles.msg, dynamicStyles.msg]}>{toast.msg}</Text>
      {toast.undoFn && (
        <TouchableOpacity onPress={() => { toast.undoFn?.(); dismiss(); }} style={[styles.undoBtn, dynamicStyles.undoBtn]}>
          <Text style={[styles.undoText, dynamicStyles.undoText]}>Undo</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export const Toast = React.memo(ToastImpl);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
    zIndex: 300,
  },
  msg: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  undoBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
});
