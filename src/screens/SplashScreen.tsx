import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LottieBox } from '../components/ui/LottieBox';
import { hennaColors } from '../constants/hennaTokens';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

/**
 * v1.2.4-dev: The branded splash image stays (familiarity) and a one-shot
 * Lottie `splash-intro` animation sits in the lower third for the premium
 * entrance. Both respect `loop={false}` — the LottieBox wrapper hard-codes it.
 * The 2.5s dismiss timer covers the animation + fade.
 */
export default function SplashScreen({ onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: hennaColors.pearl }]}>
      <Animated.Image
        source={require('../../assets/splash.png')}
        style={[styles.splashImage, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        resizeMode="cover"
      />
      {/* Lottie intro — one-shot, no loop. LottieBox falls back to emoji if
          the user hasn't dropped the real JSON file yet. */}
      <View style={styles.lottieWrap} pointerEvents="none">
        <LottieBox animation="splash-intro" size={120} fallbackEmoji="✨" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0eb', // fallback; overridden by inline theme color
  },
  splashImage: {
    width,
    height,
  },
  lottieWrap: {
    position: 'absolute',
    bottom: height * 0.14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
