import React from 'react';
import { MotiView } from 'moti';
import type { ViewStyle } from 'react-native';

/**
 * MotiEnter — centralised entrance animation used for hero cards, list rows,
 * and any premium "fade + slide up" mount behaviour.
 *
 * Battery rule (enforced here — cannot be overridden by callers):
 *   - One-shot `timing` only. There is no `loop` or `repeat` prop.
 *   - Pure CSS-equivalent transform + opacity, no layout thrash.
 *
 * Use a `delay` to stagger children by ~30ms for a premium feel.
 */

interface MotiEnterProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
}

function MotiEnterImpl({
  children,
  delay = 0,
  duration = 240,
  translateY = 12,
  style,
}: MotiEnterProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

export const MotiEnter = React.memo(MotiEnterImpl);
