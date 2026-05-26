import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  hennaRadii,
  hennaFonts,
  hennaAccentPairs,
  HennaAccent,
} from '../../constants/hennaTokens';

interface Props {
  children: React.ReactNode;
  accent?: HennaAccent;
  style?: StyleProp<ViewStyle>;
}

function HennaBadgeImpl({ children, accent = 'henna', style }: Props) {
  const a = hennaAccentPairs[accent];
  return (
    <View style={[styles.badge, { backgroundColor: a.bg }, style]}>
      <Text style={[styles.text, { color: a.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: hennaRadii.pill,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

export const HennaBadge = React.memo(HennaBadgeImpl);
