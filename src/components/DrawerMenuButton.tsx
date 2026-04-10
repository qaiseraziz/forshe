import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

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
      <Text style={[styles.icon, { color: colors.deep }]}>☰</Text>
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
  icon: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
});
