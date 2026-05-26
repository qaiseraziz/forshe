import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  hennaColors,
  hennaRadii,
  hennaFonts,
  hennaGradients,
  hennaAccentPairs,
} from '../../constants/hennaTokens';

export type HennaButtonVariant =
  | 'primary'
  | 'sage'
  | 'bronze'
  | 'plum'
  | 'soft'
  | 'outline'
  | 'ghost';

export type HennaButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  children?: React.ReactNode;
  title?: string;
  onPress: () => void;
  variant?: HennaButtonVariant;
  size?: HennaButtonSize;
  full?: boolean;
  icon?: string; // HennaIconName — wired in phase 3
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const SIZE_PADDING: Record<HennaButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 12 },
  md: { paddingVertical: 12, paddingHorizontal: 18, fontSize: 13 },
  lg: { paddingVertical: 14, paddingHorizontal: 22, fontSize: 15 },
};

const SOLID_GRADIENTS: Record<'primary' | 'sage' | 'bronze' | 'plum', [string, string]> = {
  primary: hennaGradients.buttonHenna,
  sage: hennaGradients.buttonSage,
  bronze: hennaGradients.buttonBronze,
  plum: hennaGradients.buttonPlum,
};

const SHADOW_COLORS: Record<HennaButtonVariant, string | undefined> = {
  primary: hennaColors.henna,
  sage: hennaColors.sage,
  bronze: hennaColors.bronze,
  plum: hennaColors.plum,
  soft: undefined,
  outline: undefined,
  ghost: undefined,
};

function HennaButtonImpl({
  children,
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  full,
  icon: _icon,
  style,
  textStyle,
  disabled,
  accessibilityLabel,
}: Props) {
  const s = SIZE_PADDING[size];
  const pressing = useRef(false);

  const handlePress = useCallback(() => {
    if (pressing.current) return;
    pressing.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
    setTimeout(() => {
      pressing.current = false;
    }, 200);
  }, [onPress]);

  const isSolid = variant === 'primary' || variant === 'sage' || variant === 'bronze' || variant === 'plum';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isSoft = variant === 'soft';

  let fg: string;
  let bg: string | undefined;
  if (isSoft) {
    fg = hennaAccentPairs.henna.fg;
    bg = hennaAccentPairs.henna.bg;
  } else if (isOutline) {
    fg = hennaColors.ink;
    bg = 'transparent';
  } else if (isGhost) {
    fg = hennaColors.ink2;
    bg = 'transparent';
  } else {
    fg = hennaColors.paper;
    bg = undefined; // gradient takes over
  }

  const shadowColor = SHADOW_COLORS[variant];

  const label = title ?? (typeof children === 'string' ? children : undefined);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        {
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: bg,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? hennaColors.lineStrong : 'transparent',
          width: full ? '100%' : undefined,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          ...(shadowColor && !disabled
            ? {
                shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 3,
              }
            : null),
        },
        style,
      ]}
    >
      {isSolid ? (
        <LinearGradient
          colors={SOLID_GRADIENTS[variant as 'primary' | 'sage' | 'bronze' | 'plum']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.inner}>
        {/* icon slot — phase 3 will render <HennaIcon name={_icon}/> here. */}
        {label != null ? (
          <Text style={[styles.text, { color: fg, fontSize: s.fontSize }, textStyle]}>{label}</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: hennaRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 44,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontFamily: hennaFonts.uiSemi,
    letterSpacing: 0.2,
  },
});

export const HennaButton = React.memo(HennaButtonImpl);
