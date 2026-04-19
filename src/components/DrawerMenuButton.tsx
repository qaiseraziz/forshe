import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { MenuListIcon } from './ui/ChromeIcon';

/**
 * v1.2.4-dev: hamburger icon swapped from text glyph `☰` to Phosphor `List`.
 * Chrome iconography uses Phosphor throughout (regular/bold weight only).
 * Content emojis remain untouched.
 */
export const DrawerMenuButton = React.memo(function DrawerMenuButton() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const openDrawer = useCallback(() => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      // Fallback: try parent navigator
      navigation.getParent()?.dispatch(DrawerActions.openDrawer());
    }
  }, [navigation]);

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: colors.surfaceMuted }]}
      activeOpacity={0.7}
      onPress={openDrawer}
      accessibilityRole="button"
      accessibilityLabel="Open navigation menu"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MenuListIcon size={20} color={colors.deep} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
