import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Pill } from './ui/Pill';
import { DAYS } from '../constants/data';

interface Props {
  selected: string;
  onSelect: (day: string) => void;
  hasDot?: (day: string) => boolean;
  activeColor?: string;
  activeBg?: string;
  activeBorder?: string;
  dotColor?: string;
}

export const DayStrip = React.memo(function DayStrip({ selected, onSelect, hasDot, activeColor, activeBg, activeBorder, dotColor }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {DAYS.map(d => (
        <Pill
          key={d}
          label={d}
          active={selected === d}
          onPress={() => onSelect(d)}
          activeColor={activeColor}
          activeBg={activeBg}
          activeBorder={activeBorder}
          showDot={hasDot?.(d)}
          dotColor={dotColor}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 12,
  },
});
