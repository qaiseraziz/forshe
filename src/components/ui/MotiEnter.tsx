import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';

/**
 * MotiEnter — v1.2.7 hotfix: moti disabled.
 *
 * Root cause of the v1.2.4 → v1.2.6 launch crashes: `moti@0.30.0` was built
 * against `react-native-reanimated@3.11.0` (see its package.json). This
 * project uses `reanimated@4.2.1` — a major breaking rewrite. Importing
 * `MotiView` crashes the JS bridge at module init because Moti calls
 * reanimated 3 internals that don't exist in v4.
 *
 * This wrapper now renders children inside a plain `View` (no animation).
 * The app launches reliably and every caller keeps working. When we adopt
 * a Moti version compatible with reanimated 4, restore the animated variant
 * here without touching any screen.
 */

interface MotiEnterProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
}

function MotiEnterImpl({ children, style }: MotiEnterProps) {
  return <View style={style}>{children}</View>;
}

export const MotiEnter = React.memo(MotiEnterImpl);
