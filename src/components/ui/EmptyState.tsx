import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  icon: string;
  text: string;
  hint?: string;
}

export const EmptyState = React.memo(function EmptyState({ icon, text, hint }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg2 }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.text, { color: colors.sub }]}>{text}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginVertical: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  text: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    lineHeight: 22,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
});
