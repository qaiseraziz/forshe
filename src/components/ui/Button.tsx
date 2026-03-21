import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { gradients } from '../../constants/colors';

type Variant = 'gold' | 'green' | 'blue' | 'red' | 'pink' | 'outline';

const VARIANT_GRADIENTS: Record<string, [string, string]> = {
  gold: gradients.goldBtn,
  green: gradients.greenBtn,
  blue: gradients.blueBtn,
  red: gradients.redBtn,
  pink: gradients.pinkBtn,
};

const VARIANT_SHADOW_COLORS: Record<string, string> = {
  gold: '#c8860a',
  green: '#1a8a5a',
  blue: '#1d6fa4',
  red: '#c0392b',
  pink: '#c0395a',
};

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  small?: boolean;
  full?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'gold', small, full, style, textStyle, icon, disabled }: Props) {
  const { colors } = useTheme();
  const isOutline = variant === 'outline';
  const grad = VARIANT_GRADIENTS[variant];
  const shadowColor = VARIANT_SHADOW_COLORS[variant] || '#000';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.btn,
        small && styles.small,
        full && styles.full,
        {
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? colors.border : 'transparent',
          opacity: disabled ? 0.5 : 1,
          overflow: 'hidden',
          ...(isOutline
            ? {}
            : {
                shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }),
        },
        style,
      ]}
    >
      {!isOutline && grad ? (
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Text style={[
        styles.text,
        small && styles.smallText,
        { color: isOutline ? colors.sub : '#fff' },
        textStyle,
      ]}>
        {icon ? icon + ' ' : ''}{title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  full: {
    width: '100%',
  },
  text: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  smallText: {
    fontSize: 13,
  },
});
