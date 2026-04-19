import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * v1.2.5-dev: Skeleton placeholder for AsyncStorage-bound screens.
 *
 * Battery-first design:
 * - Default is a STATIC dim-gray rounded placeholder — no animation, no
 *   shimmer, no repeating timer. It still reads clearly as "loading" to the
 *   user.
 * - `animated={true}` is an explicit opt-in that renders a one-shot fade-in
 *   (240ms timing, no loop) via CSS-equivalent opacity. We never spin up a
 *   shimmer loop because typical AsyncStorage load is under 400ms — a loop
 *   would just burn battery for nothing.
 *
 * Typical usage:
 *
 *     const { allLoaded } = useData();
 *     if (!allLoaded) {
 *       return (
 *         <>
 *           <Skeleton height={72} borderRadius={24} />
 *           <Skeleton height={72} borderRadius={24} style={{ marginTop: 8 }} />
 *           <Skeleton height={72} borderRadius={24} style={{ marginTop: 8 }} />
 *         </>
 *       );
 *     }
 *
 * DO NOT add `repeat` / `loop` / `Animated.loop`. v1.2.4-dev battery rule.
 */

interface Props {
  /** Pixel height of the placeholder. */
  height?: number;
  /** Width — number (px) or string (e.g. '60%'). Defaults to '100%'. */
  width?: number | string;
  /** Corner radius. Matches Card's 24 for card rows; use 8-12 for text lines. */
  borderRadius?: number;
  /** Extra style slot (margin, flex, etc.). Accepts array or single style. */
  style?: StyleProp<ViewStyle>;
  /** Opt-in: render at 0.85 opacity for a gentler look. Still no animation. */
  dim?: boolean;
}

function SkeletonImpl({ height = 16, width = '100%', borderRadius = 8, style, dim }: Props) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      // eslint-disable-next-line react-native/no-inline-styles
      style={[
        styles.base,
        {
          height,
          // RN type: width accepts number | string at runtime. Cast keeps TS happy.
          width: width as any,
          borderRadius,
          backgroundColor: colors.bg3,
          opacity: dim ? 0.65 : 0.85,
        },
        style,
      ]}
    />
  );
}

export const Skeleton = React.memo(SkeletonImpl);

/**
 * Convenience preset: a card-shaped skeleton row (full width, 72px tall,
 * 24px radius — matches the Card component). Use for list rows.
 */
export const SkeletonCardRow = React.memo(function SkeletonCardRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Skeleton height={72} borderRadius={24} style={[cardStyles.row, style]} />;
});

/**
 * Convenience preset: a chart-sized skeleton block (180px tall). Use for
 * InsightsScreen placeholders.
 */
export const SkeletonChart = React.memo(function SkeletonChart({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Skeleton height={180} borderRadius={20} style={[cardStyles.chart, style]} />;
});

const styles = StyleSheet.create({
  base: {
    // Intentionally no animation. See file header.
  },
});

const cardStyles = StyleSheet.create({
  row: { marginBottom: 10 },
  chart: { marginBottom: 14 },
});
