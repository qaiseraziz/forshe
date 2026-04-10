import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import TodayScreen from '../screens/TodayScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import CookingScreen from '../screens/CookingScreen';
import RemindersScreen from '../screens/RemindersScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Today', icon: '🏠', component: TodayScreen },
  { name: 'Expenses', icon: '💰', component: ExpensesScreen },
  { name: 'Cooking', icon: '🍳', component: CookingScreen },
  { name: 'Remind', icon: '🔔', component: RemindersScreen },
];

const CustomTabBar = React.memo(function CustomTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const { reminders } = useData();
  const insets = useSafeAreaInsets();
  const activeReminders = useMemo(() => reminders.filter((r: any) => {
    const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
    return t >= new Date() && !r.isDone;
  }).length, [reminders]);

  return (
    <View style={[styles.tabBar, {
      backgroundColor: colors.tabBarBg,
      borderColor: colors.border,
      // Float above Android nav gestures with a single safe-area-aware margin.
      // Interior padding is fixed — no double-counting the inset (v1.1.2 fix).
      marginBottom: Math.max(insets.bottom, 8),
    }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const tab = TABS[index];

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.8}
            style={[
              styles.tabBtn,
              focused && styles.tabBtnActive,
            ]}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
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
    shadowColor: '#000',
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
  },
  tabBtnActive: {
    backgroundColor: 'rgba(200,134,10,0.12)',
  },
  tabIcon: {
    fontSize: 22,
    lineHeight: 26,
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
