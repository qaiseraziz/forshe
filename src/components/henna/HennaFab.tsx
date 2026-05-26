import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  hennaColors,
  hennaGradients,
  hennaShadows,
} from '../../constants/hennaTokens';
import { HennaIcon } from './HennaIcons';
import type { HennaIconName } from './HennaIcons';

interface Props {
  onPress: () => void;
  icon?: HennaIconName;
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Floating action button. The henna gradient + soft inset highlight is
 * captured via the bottom-shadow recipe in tokens. Positioning is the
 * caller's responsibility — pass `style={{ position: 'absolute', right: 24, bottom: 90 }}`
 * from the screen.
 */
function HennaFabImpl({
  onPress,
  icon = 'plus',
  size = 56,
  accessibilityLabel,
  style,
}: Props) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Quick add'}
      hitSlop={8}
      style={({ pressed }) => [
        styles.fab,
        hennaShadows.fab,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={hennaGradients.buttonHenna}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <HennaIcon name={icon} size={size * 0.43} color={hennaColors.paper} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export const HennaFab = React.memo(HennaFabImpl);
