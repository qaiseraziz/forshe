import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  percent: number;
  fillColor: string;
  bgColor?: string;
  height?: number;
}

export function ProgressBar({ percent, fillColor, bgColor = 'rgba(0,0,0,0.06)', height = 8 }: Props) {
  return (
    <View style={[styles.bg, { backgroundColor: bgColor, height }]}>
      <View style={[styles.fill, { width: `${Math.min(Math.max(percent, 0), 100)}%`, backgroundColor: fillColor, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});
