import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  hennaColors,
  hennaRadii,
  hennaShadows,
  hennaAccentPairs,
  HennaAccent,
} from '../../constants/hennaTokens';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  accent?: HennaAccent;
  padding?: number;
  onPress?: () => void;
}

/**
 * Henna & Pearl card surface.
 * Inset hairline = absolutely-positioned 1px-border subview (RN has no
 * inset box-shadow). Tint shifts with `accent`; default uses the neutral
 * henna line color.
 */
function HennaCardImpl({ children, style, bg, accent, padding = 20, onPress }: Props) {
  const backgroundColor = bg ?? hennaColors.paper;
  // Inset hairline color — accent-tinted at 8% (matches web prototype's `+ '14'` alpha hex).
  const hairlineColor = accent ? withAlpha(hennaAccentPairs[accent].fg, 0.08) : hennaColors.line;

  const content = (
    <>
      {children}
      <View pointerEvents="none" style={[styles.hairline, { borderColor: hairlineColor }]} />
    </>
  );

  const baseStyle: StyleProp<ViewStyle> = [
    styles.card,
    hennaShadows.md,
    { backgroundColor, padding },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={baseStyle}
        accessibilityRole="button"
        hitSlop={4}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={baseStyle}>{content}</View>;
}

function withAlpha(hex: string, alpha: number): string {
  // Accepts #RRGGBB or rgba()/rgb() — passes rgba through.
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: hennaRadii.card,
    overflow: 'hidden',
    position: 'relative',
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: hennaRadii.card,
    borderWidth: 1,
  },
});

export const HennaCard = React.memo(HennaCardImpl);
