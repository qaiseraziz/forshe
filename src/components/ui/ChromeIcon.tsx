import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * ChromeIcon — v1.2.5 hotfix: Phosphor icons disabled.
 *
 * `phosphor-react-native` depends on `react-native-svg` (a native module)
 * as a peer dep. It's only present transitively, not declared in package.json,
 * which means its native side may not be linked — contributing to the launch
 * crash alongside expo-blur / lottie-react-native.
 *
 * This file now renders simple emoji glyphs in the same footprint. Every
 * screen that imports from here keeps working unchanged. When we verify
 * react-native-svg is linked correctly on-device, we can restore the Phosphor
 * icons here without touching any screen.
 */

type Props = { size?: number; color?: string };

const defaultSize = 22;

function EmojiIcon({ emoji, size = defaultSize, color }: Props & { emoji: string }) {
  return <Text style={[styles.icon, { fontSize: size, color: color ?? '#000' }]}>{emoji}</Text>;
}

export const TabHouseIcon = React.memo(function TabHouseIcon(props: Props) {
  return <EmojiIcon emoji="🏠" {...props} />;
});

export const TabMoneyIcon = React.memo(function TabMoneyIcon(props: Props) {
  return <EmojiIcon emoji="💰" {...props} />;
});

export const TabForkKnifeIcon = React.memo(function TabForkKnifeIcon(props: Props) {
  return <EmojiIcon emoji="🍽️" {...props} />;
});

export const TabBellIcon = React.memo(function TabBellIcon(props: Props) {
  return <EmojiIcon emoji="🔔" {...props} />;
});

export const MenuListIcon = React.memo(function MenuListIcon(props: Props) {
  return <EmojiIcon emoji="☰" size={props.size ?? 20} color={props.color} />;
});

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    lineHeight: undefined,
  },
});
