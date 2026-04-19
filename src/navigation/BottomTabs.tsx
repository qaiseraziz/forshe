import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import TodayScreen from '../screens/TodayScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import CookingScreen from '../screens/CookingScreen';
import RemindersScreen from '../screens/RemindersScreen';
import {
  TabHouseIcon,
  TabMoneyIcon,
  TabForkKnifeIcon,
  TabBellIcon,
} from '../components/ui/ChromeIcon';

const Tab = createBottomTabNavigator();

// v1.2.4-dev: chrome icons now come from `phosphor-react-native` (regular weight).
// Emojis are reserved for *content* (category pickers, recipe names, reminder
// category labels) — see CLAUDE.md "Phosphor icons in chrome / emojis in content".
type TabIconComponent = React.ComponentType<{ size?: number; color?: string }>;
type TabDef = { name: string; Icon: TabIconComponent; component: React.ComponentType<any> };

const TABS: TabDef[] = [
  { name: 'Today', Icon: TabHouseIcon, component: TodayScreen },
  { name: 'Expenses', Icon: TabMoneyIcon, component: ExpensesScreen },
  { name: 'Cooking', Icon: TabForkKnifeIcon, component: CookingScreen },
  { name: 'Remind', Icon: TabBellIcon, component: RemindersScreen },
];

const CustomTabBar = React.memo(function CustomTabBar({ state, navigation }: any) {
  const { colors, dark } = useTheme();
  const { reminders } = useData();
  const insets = useSafeAreaInsets();
  const activeReminders = useMemo(() => reminders.filter((r: any) => {
    const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
    return t >= new Date() && !r.isDone;
  }).length, [reminders]);

  return (
    // v1.2.4-dev: BlurView replaces the solid tabBarBg fill. The container's
    // borderRadius + overflow hidden keeps the frosted glass confined to the
    // pill shape. A subtle theme-tint overlay keeps contrast on busy
    // backgrounds (gradients, photos in Recipes).
    <View style={[styles.tabBar, {
      shadowColor: '#000',
      // v1.2.5 hotfix: BlurView removed — was causing a native-module init
      // crash on some devices. Solid theme fill preserved via tabBarBg.
      backgroundColor: colors.tabBarBg,
      // Float above Android nav gestures with a single safe-area-aware margin.
      // Interior padding is fixed — no double-counting the inset (v1.1.2 fix).
      marginBottom: Math.max(insets.bottom, 8),
    }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const tab = TABS[index];
        const Icon = tab.Icon;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.8}
            style={[
              styles.tabBtn,
              focused && { backgroundColor: 'rgba(200,134,10,0.12)' },
              focused && { borderWidth: 1, borderColor: colors.goldBorderActive },
            ]}
          >
            <Icon size={22} color={focused ? colors.gold : colors.muted} />
            <Text style={[
              styles.tabLabel,
              { color: focused ? colors.gold : colors.muted },
            ]}>
              {tab.name}
            </Text>
            {tab.name === 'Remind' && activeReminders > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.red, borderColor: colors.tabBarBg }]}>
                <Text style={styles.badgeText}>{activeReminders}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

export function BottomTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0,
    borderWidth: 0,
    paddingTop: 8,
    paddingHorizontal: 4,
    gap: 2,
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
    // Default invisible border so focused state doesn't cause a layout shift
    // when `borderWidth: 1` is added for active items.
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: undefined,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    lineHeight: 14,
  },
});
