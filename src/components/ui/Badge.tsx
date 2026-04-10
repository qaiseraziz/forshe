import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  text: string;
  bg: string;
  color: string;
  borderColor?: string;
}

export const Badge = React.memo(function Badge({ text, bg, color, borderColor }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: borderColor || bg }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 0,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
  },
});
