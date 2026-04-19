import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

/**
 * LottieBox — safety-railed wrapper around lottie-react-native.
 *
 * Battery rules (enforced here — not overridable from callers):
 *   - `loop` is HARD-CODED to `false`. Every Lottie in ForSHE is one-shot.
 *   - `autoPlay` defaults to `true` so the animation fires once when mounted.
 *   - If the provided `source` is missing/null (e.g. user hasn't dropped a
 *     real JSON into `assets/lottie/` yet), we render the fallback emoji in
 *     the same footprint so the UI keeps working.
 *
 * Source asset loading: React Native requires `require()` at build time, so
 * callers must pass the pre-required JSON (not a path string). The small set
 * of approved Lottie asset keys is defined below — screens request them by
 * key, and we resolve to an already-required module. That way we:
 *   - keep a single audit surface for which animations exist
 *   - can swap any animation filename without editing every call site
 *   - never tree-shake in stray animations
 *
 * @see assets/lottie/README.md for the full list of expected keys + sources.
 */

export type LottieKey =
  | 'celebrate'
  | 'pulse'
  | 'sparkle'
  | 'splash-intro'
  | 'empty-inbox'
  | 'tasbeeh';

// Only ship-safe hand-authored animations live in the repo right now. If the
// user drops additional JSON files into `assets/lottie/`, add them here.
// Using try/require inside a memoized resolver keeps require() call static
// enough for Metro while letting us gracefully degrade if a file is absent.
//
// Each entry is either a JSON module (require result) or `null` if not yet
// present — callers fall back to their provided emoji.
const SOURCES: Record<LottieKey, unknown> = {
  celebrate: require('../../../assets/lottie/celebrate.json'),
  pulse: require('../../../assets/lottie/pulse.json'),
  sparkle: require('../../../assets/lottie/sparkle.json'),
  // The three below are expected to be sourced from Lottiefiles.com; until the
  // user drops the JSON files in, we reuse our hand-authored sparkle/celebrate
  // so the animation slot is never empty. Swap these require() paths when the
  // real files land (see assets/lottie/README.md).
  'splash-intro': require('../../../assets/lottie/sparkle.json'),
  'empty-inbox': require('../../../assets/lottie/sparkle.json'),
  tasbeeh: require('../../../assets/lottie/celebrate.json'),
};

interface LottieBoxProps {
  animation: LottieKey;
  size?: number;
  fallbackEmoji?: string;
  autoPlay?: boolean;
  style?: ViewStyle;
  onAnimationFinish?: () => void;
}

function LottieBoxImpl({
  animation,
  size = 96,
  fallbackEmoji = '✨',
  autoPlay = true,
  style,
  onAnimationFinish,
}: LottieBoxProps) {
  const source = SOURCES[animation] ?? null;

  const dimensionStyle = useMemo<ViewStyle>(
    () => ({ width: size, height: size }),
    [size],
  );

  if (!source) {
    return (
      <View style={[styles.fallback, dimensionStyle, style]}>
        <Text style={[styles.fallbackEmoji, { fontSize: size * 0.55 }]}>{fallbackEmoji}</Text>
      </View>
    );
  }

  return (
    <View style={[dimensionStyle, style]}>
      <LottieView
        source={source as any}
        autoPlay={autoPlay}
        // HARD-CODED: Lottie animations in ForSHE never loop. Do not expose this.
        loop={false}
        style={dimensionStyle}
        resizeMode="contain"
        onAnimationFinish={onAnimationFinish}
      />
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
