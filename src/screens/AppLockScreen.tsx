import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onUnlock: () => void;
  storedPin: string;
}

export default function AppLockScreen({ onUnlock, storedPin }: Props) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === storedPin) {
        onUnlock();
      } else {
        setError(true);
        Vibration.vibrate(200);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    }
  }, [pin, storedPin, onUnlock]);

  const addDigit = (d: string) => {
    if (pin.length < 4) setPin(p => p + d);
  };

  const deleteLast = () => setPin(p => p.slice(0, -1));

  return (
    <LinearGradient colors={['#fdfcfa', '#f5f0eb']} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <Image source={require('../../assets/logo.png')} style={styles.lockLogo} resizeMode="contain" />
        <Text style={styles.title}>ForSHE</Text>
        <Text style={styles.subtitle}>Enter your PIN to continue</Text>

        {/* PIN dots */}
        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.pinDot,
                pin.length > i && styles.pinDotFilled,
                error && styles.pinDotError,
              ]}
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>Incorrect PIN</Text>}

        {/* Number pad */}
        <View style={styles.numPad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(key => (
            <TouchableOpacity
              key={key || 'empty'}
              style={[styles.numKey, !key && styles.numKeyEmpty]}
              activeOpacity={0.6}
              onPress={() => {
                if (key === '⌫') deleteLast();
                else if (key) addDigit(key);
              }}
              disabled={!key}
            >
              <Text style={[styles.numKeyText, key === '⌫' && { fontSize: 22 }]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  lockLogo: { width: 100, height: 100, marginBottom: 16 },
  title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontFamily: 'Outfit-Regular', fontSize: 15, color: '#4a5568', marginBottom: 40 },
  pinDots: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  pinDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.08)', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)',
  },
  pinDotFilled: { backgroundColor: '#c8860a', borderColor: '#c8860a' },
  pinDotError: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  errorText: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#c0392b', marginBottom: 20 },
  numPad: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    maxWidth: 300, gap: 16, marginTop: 24,
  },
  numKey: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center',
  },
  numKeyEmpty: { backgroundColor: 'transparent' },
  numKeyText: { fontFamily: 'Outfit-Bold', fontSize: 26, color: '#1a1a2e' },
});
