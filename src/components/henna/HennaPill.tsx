import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  hennaColors,
  hennaRadii,
  hennaFonts,
  hennaAccentPairs,
  HennaAccent,
} from '../../constants/hennaTokens';

interface Props {
  children?: React.ReactNode;
  label?: string;
  active?: boolean;
  onPress: () => void;
  accent?: HennaAccent;
  icon?: string; // HennaIconName — wired in phase 3
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function HennaPillImpl({
  children,
  label,
  active,
  onPress,
  accent = 'henna',
  icon: _icon,
  style,
  accessibilityLabel,
}: Props) {
  const a = hennaAccentPairs[accent];
  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  const text = label ?? (typeof children === 'string' ? children : undefined);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={accessibilityLabel ?? text}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: active ? a.bg : hennaColors.paper2,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {/* icon slot — phase 3 wires <HennaIcon name={_icon} size={13} /> */}
        {text != null ? (
          <Text style={[styles.text, { color: active ? a.fg : hennaColors.muted }]}>{text}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: hennaRadii.pill,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 12,
  },
});

export const HennaPill = React.memo(HennaPillImpl);
