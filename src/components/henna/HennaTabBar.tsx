import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  hennaColors,
  hennaFonts,
  hennaRadii,
  hennaShadows,
} from '../../constants/hennaTokens';
import { HennaIcon } from './HennaIcons';
import type { HennaIconName } from './HennaIcons';

export interface HennaTabDef {
  name: string;
  icon: HennaIconName;
  badge?: number;
}

interface Props {
  tabs: HennaTabDef[];
  active: string;
  onChange: (name: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Presentational bottom tab bar — pearl pill, hand-drawn icons, henna
 * active state. NOT yet wired into the React Navigation tab navigator;
 * the existing `src/navigation/BottomTabs.tsx` continues to handle real
 * navigation until phase 6 swaps it.
 */
function HennaTabBarImpl({ tabs, active, onChange, style }: Props) {
  return (
    <View style={[styles.bar, hennaShadows.md, style]}>
      {tabs.map((t) => {
        const isActive = t.name === active;
        return (
          <Pressable
            key={t.name}
            onPress={() => onChange(t.name)}
            accessibilityRole="button"
            accessibilityLabel={t.name}
            accessibilityState={{ selected: isActive }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.tab,
              isActive && { backgroundColor: hennaColors.henna },
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <HennaIcon
              name={t.icon}
              size={18}
              color={isActive ? hennaColors.paper : hennaColors.muted}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? hennaColors.paper : hennaColors.muted },
              ]}
            >
              {t.name}
            </Text>
            {t.badge && !isActive ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: hennaColors.paper,
    borderRadius: hennaRadii.tab,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 44,
    position: 'relative',
  },
  label: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 14,
    backgroundColor: hennaColors.henna,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 14,
    borderWidth: 1.5,
    borderColor: hennaColors.paper,
  },
  badgeText: {
    color: hennaColors.paper,
    fontFamily: hennaFonts.uiBold,
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 12,
  },
});

export const HennaTabBar = React.memo(HennaTabBarImpl);
