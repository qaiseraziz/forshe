import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hennaGradients } from '../../constants/hennaTokens';

type ProgressAccent = 'henna' | 'sage' | 'bronze' | 'plum';

interface Props {
  value: number;
  max?: number;
  accent?: ProgressAccent;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const FILLS: Record<ProgressAccent, [string, string]> = {
  henna: hennaGradients.progressHenna,
  sage: hennaGradients.progressSage,
  bronze: hennaGradients.progressBronze,
  plum: hennaGradients.progressPlum,
};

function HennaProgressImpl({ value, max = 100, accent = 'henna', height = 6, style }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={[styles.track, { height }, style]}>
      <View style={[styles.fillWrap, { width: `${pct}%`, height }]}>
        <LinearGradient
          colors={FILLS[accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: 'rgba(147,73,57,0.10)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fillWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
});

export const HennaProgress = React.memo(HennaProgressImpl);
