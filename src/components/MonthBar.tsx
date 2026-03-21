import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';
import { MONTHS } from '../constants/data';
import { parseDMY } from '../utils/dates';
import { Transaction } from '../types';

interface Props {
  filter: string;
  setFilter: (f: string) => void;
  selMonth: number;
  selYear: number;
  setSelMonth: (m: number) => void;
  setSelYear: (y: number) => void;
  history?: Transaction[];
}

export function MonthBar({ filter, setFilter, selMonth, selYear, setSelMonth, setSelYear, history = [] }: Props) {
  const { colors } = useTheme();

  const months = React.useMemo(() => {
    const seen = new Set<string>();
    const now = new Date();
    seen.add(`${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`);
    history.forEach(h => {
      const p = parseDMY(h.date);
      if (p) seen.add(`${p.y}-${String(p.m).padStart(2, '0')}`);
    });
    return [...seen].sort((a, b) => b.localeCompare(a));
  }, [history]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'month', label: 'Monthly' },
  ];

  return (
    <View style={[styles.bar, { backgroundColor: colors.bg2, borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.pill,
              {
                backgroundColor: filter === f.key ? colors.goldBg : 'transparent',
              },
            ]}
          >
            <Text style={[styles.pillText, { color: filter === f.key ? colors.gold : colors.sub }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
        {filter === 'month' && (
          <View style={[styles.pickerWrap, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
            <Picker
              selectedValue={`${selYear}-${String(selMonth).padStart(2, '0')}`}
              onValueChange={(v: string) => {
                const [y, m] = v.split('-').map(Number);
                setSelYear(y);
                setSelMonth(m);
              }}
              style={{ color: colors.text, height: 36, flex: 1 }}
              dropdownIconColor={colors.sub}
            >
              {months.map(k => {
                const [y, m] = k.split('-').map(Number);
                return <Picker.Item key={k} value={k} label={`${MONTHS[m]} ${y}`} style={{ fontSize: 13 }} />;
              })}
            </Picker>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 0,
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 0,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
  pickerWrap: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1.5,
    borderRadius: 20,
    overflow: 'hidden',
    height: 36,
    justifyContent: 'center',
  },
});
