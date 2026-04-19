import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

/**
 * LottieBox — safe emoji-fallback version.
 *
 * v1.2.5 hotfix: the previous version imported `lottie-react-native` at the
 * top of the module. That import initialises the native Lottie module at app
 * startup; if the native side fails to link (which appears to be happening on
 * some devices for this build), the whole app crashes on launch — not just
 * the animation surface.
 *
 * Until we can verify native Lottie init on-device, this component renders the
 * `fallbackEmoji` in the expected footprint. All call sites keep working, the
 * app launches reliably, and we can re-enable the animated variant later from
 * a single place without touching any screen.
 */

export type LottieKey =
  | 'celebrate'
  | 'pulse'
  | 'sparkle'
  | 'splash-intro'
  | 'empty-inbox'
  | 'tasbeeh';

interface LottieBoxProps {
  animation: LottieKey;
  size?: number;
  fallbackEmoji?: string;
  autoPlay?: boolean;
  style?: ViewStyle;
  onAnimationFinish?: () => void;
}

function LottieBoxImpl({
  size = 96,
  fallbackEmoji = '✨',
  style,
}: LottieBoxProps) {
  const dimensionStyle = useMemo<ViewStyle>(
    () => ({ width: size, height: size }),
    [size],
  );

  return (
    <View style={[styles.fallback, dimensionStyle, style]}>
      <Text style={[styles.fallbackEmoji, { fontSize: size * 0.55 }]}>{fallbackEmoji}</Text>
    </View>
  );
}

export const LottieBox = React.memo(LottieBoxImpl);

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: {
    textAlign: 'center',
  },
});
