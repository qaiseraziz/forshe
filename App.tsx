import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
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
import { DrawerNav } from './src/navigation/DrawerNav';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AppLockScreen from './src/screens/AppLockScreen';
import { useStorage } from './src/hooks/useStorage';
import { useSecureStorage } from './src/hooks/useSecureStorage';

SplashScreenExpo.preventAutoHideAsync();

function AppContent() {
  const { colors, dark } = useTheme();
  const { allLoaded } = useData();

  const [showSplash, setShowSplash] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useStorage<boolean>('forshe_onboarded', false);
  const [pin, setPin] = useSecureStorage('forshe_pin', '');
  const [isUnlocked, setIsUnlocked] = useState(false);

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

  // Show app lock if PIN is set and not yet unlocked
  if (pin && !isUnlocked) {
    return <AppLockScreen onUnlock={() => setIsUnlocked(true)} storedPin={pin} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg2} />
      <NavigationContainer>
        <DrawerNav />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-ExtraBold': PlayfairDisplay_800ExtraBold,
    'Outfit-Light': Outfit_300Light,
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreenExpo.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
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
