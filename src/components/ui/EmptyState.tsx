import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  icon: string;
  text: string;
}

export function EmptyState({ icon, text }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.text, { color: colors.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { textAlign: 'center', alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  icon: { fontSize: 42, marginBottom: 10 },
  text: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22, textAlign: 'center' },
});
