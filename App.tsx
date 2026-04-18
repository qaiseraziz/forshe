import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreenExpo from 'expo-splash-screen';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
} from '@expo-google-fonts/playfair-display';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { DataProvider, useData } from './src/context/DataContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import { DrawerNav } from './src/navigation/DrawerNav';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AppLockScreen from './src/screens/AppLockScreen';
import BiometricLockScreen from './src/screens/BiometricLockScreen';
import { QuickAddFAB } from './src/components/QuickAddFAB';
import { useStorage } from './src/hooks/useStorage';
import { useSecureStorage } from './src/hooks/useSecureStorage';

SplashScreenExpo.preventAutoHideAsync();

// Re-require biometric auth after this many ms of being backgrounded.
const RELOCK_AFTER_BACKGROUND_MS = 5000;

function AppContent() {
  const { colors, dark } = useTheme();
  const { allLoaded } = useData();

  const [showSplash, setShowSplash] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useStorage<boolean>('forshe_onboarded', false);
  const [pin] = useSecureStorage('forshe_pin', '');
  const [biometricEnabled] = useStorage<boolean>('hm_biometric_lock', false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [usePinFallback, setUsePinFallback] = useState(false);

  // Re-lock on background → foreground when biometric is enabled.
  const backgroundedAt = useRef<number | null>(null);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (next === 'active') {
        const wasAway = backgroundedAt.current
          ? Date.now() - backgroundedAt.current > RELOCK_AFTER_BACKGROUND_MS
          : false;
        if (wasAway && (biometricEnabled || pin)) {
          setIsUnlocked(false);
          setUsePinFallback(false);
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [biometricEnabled, pin]);

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    setUsePinFallback(false);
  }, []);

  const switchToPin = useCallback(() => setUsePinFallback(true), []);

  if (!allLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show onboarding for first time
  if (!hasOnboarded) {
    return (
      <OnboardingScreen
        onComplete={() => setHasOnboarded(true)}
      />
    );
  }

  // Unlock gate: biometric first (if enabled), PIN as fallback OR alternative
  if (!isUnlocked) {
    if (biometricEnabled && !usePinFallback) {
      return (
        <BiometricLockScreen
          onUnlock={handleUnlock}
          onFallbackToPin={pin ? switchToPin : undefined}
          hasPinFallback={!!pin}
        />
      );
    }
    if (pin) {
      return <AppLockScreen onUnlock={handleUnlock} storedPin={pin} />;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg2} />
      <NavigationContainer>
        <DrawerNav />
      </NavigationContainer>
      <QuickAddFAB />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-ExtraBold': PlayfairDisplay_800ExtraBold,
    'Outfit-Light': Outfit_300Light,
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreenExpo.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // If fonts failed to load, proceed with system fonts rather than blocking the app forever
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <DataProvider>
              <AppContent />
            </DataProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
