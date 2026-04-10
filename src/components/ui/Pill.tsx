import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
  activeBg?: string;
  activeBorder?: string; // deprecated — kept for API compatibility
  showDot?: boolean;
  dotColor?: string;
  sublabel?: string;
}

export const Pill = React.memo(function Pill({ label, active, onPress, activeColor, activeBg, showDot, dotColor, sublabel }: Props) {
  const { colors } = useTheme();
  const ac = activeColor || colors.gold;
  const ab = activeBg || colors.goldBg;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        {
          backgroundColor: active ? ab : colors.bg3,
        },
      ]}
    >
      <Text style={[styles.text, { color: active ? ac : colors.sub }]}>{label}</Text>
      {sublabel ? <Text style={[styles.sub, { color: active ? ac : colors.muted }]}>{sublabel}</Text> : null}
      {showDot && <View style={[styles.dot, { backgroundColor: dotColor || colors.green, opacity: showDot ? 1 : 0 }]} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 48,
    minHeight: 44,
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },
  sub: {
    fontSize: 9,
    fontFamily: 'Outfit-Medium',
    marginTop: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
});
