import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  percent: number;
  fillColor: string;
  bgColor?: string;
  height?: number;
}

export const ProgressBar = React.memo(function ProgressBar({ percent, fillColor, bgColor = 'rgba(128,128,128,0.15)', height = 8 }: Props) {
  return (
    <View style={[styles.bg, { backgroundColor: bgColor, height }]}>
      <View style={[styles.fill, { width: `${Math.min(Math.max(percent, 0), 100)}%`, backgroundColor: fillColor, height }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  bg: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});
