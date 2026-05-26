import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import TodayHennaScreen from '../screens/TodayHennaScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import CookingScreen from '../screens/CookingScreen';
import RemindersScreen from '../screens/RemindersScreen';
import { HennaTabBar } from '../components/henna';
import type { HennaTabDef } from '../components/henna';

const Tab = createBottomTabNavigator();

// Phase 6F: bottom tab bar is now the HennaTabBar. The 4 tabs stay
// the same (Today, Expenses, Cooking, Remind). The custom-floating-pill
// gold version is gone — replaced by the Henna pearl pill from
// `src/components/henna/HennaTabBar.tsx`.
const TABS: { name: string; component: React.ComponentType<any>; icon: HennaTabDef['icon'] }[] = [
  { name: 'Today',    component: TodayHennaScreen, icon: 'home' },
  { name: 'Expenses', component: ExpensesScreen,   icon: 'money' },
  { name: 'Cooking',  component: CookingScreen,    icon: 'pot' },
  { name: 'Remind',   component: RemindersScreen,  icon: 'bell' },
];

const CustomTabBar = React.memo(function CustomTabBar({ state, navigation }: any) {
  const { reminders } = useData();
  const insets = useSafeAreaInsets();
  const activeReminders = useMemo(
    () =>
      reminders.filter((r: any) => {
        const t = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
        return t >= new Date() && !r.isDone;
      }).length,
    [reminders],
  );

  const tabs: HennaTabDef[] = useMemo(
    () =>
      TABS.map(t => ({
        name: t.name,
        icon: t.icon,
        badge: t.name === 'Remind' && activeReminders > 0 ? activeReminders : undefined,
      })),
    [activeReminders],
  );

  const active = state.routes[state.index].name as string;
  const onChange = useCallback(
    (name: string) => {
      navigation.navigate(name);
    },
    [navigation],
  );

  return (
    <View
      style={[
        styles.barWrap,
        { marginBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <HennaTabBar tabs={tabs} active={active} onChange={onChange} />
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
  barWrap: {
    marginHorizontal: 16,
  },
});
