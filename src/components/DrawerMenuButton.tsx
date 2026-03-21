import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export function DrawerMenuButton() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const openDrawer = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      // Fallback: try parent navigator
      navigation.getParent()?.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: colors.surfaceMuted }]}
      activeOpacity={0.7}
      onPress={openDrawer}
    >
      <Text style={[styles.icon, { color: colors.deep }]}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
});
