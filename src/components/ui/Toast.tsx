import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

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

  return { toast, show, dismiss };
}

export function Toast({ toast, dismiss }: { toast: ToastData | null; dismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      opacity.setValue(0);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.msg}>{toast.msg}</Text>
      {toast.undoFn && (
        <TouchableOpacity onPress={() => { toast.undoFn?.(); dismiss(); }} style={styles.undoBtn}>
          <Text style={styles.undoText}>Undo</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
    zIndex: 300,
  },
  msg: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  undoBtn: {
    backgroundColor: '#c8860a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
});
