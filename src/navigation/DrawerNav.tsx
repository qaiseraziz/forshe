import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from './BottomTabs';
import MaidScreen from '../screens/MaidScreen';
import CycleScreen from '../screens/CycleScreen';
import BodyStatsScreen from '../screens/BodyStatsScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import BackupScreen from '../screens/BackupScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import InventoryScreen from '../screens/InventoryScreen';
import RecipeBookScreen from '../screens/RecipeBookScreen';
import SavingsGoalsScreen from '../screens/SavingsGoalsScreen';
import InsightsScreen from '../screens/InsightsScreen';
import VendorsScreen from '../screens/VendorsScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import PrayerSettingsScreen from '../screens/PrayerSettingsScreen';
import FastingCalendarScreen from '../screens/FastingCalendarScreen';
import CloudAuthScreen from '../screens/CloudAuthScreen';
import {
  hennaColors,
  hennaFonts,
  hennaTextStyles,
} from '../constants/hennaTokens';
import { HennaIcon } from '../components/henna';
import type { HennaIconName } from '../components/henna';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Drawer = createDrawerNavigator();

type DrawerItemDef = { name: string; label: string; icon: HennaIconName };
type DrawerGroup = { title: string; icon: HennaIconName; items: DrawerItemDef[] };

// Phase 6F: Henna drawer with collapsible groups preserved. Icons are
// Henna hand-drawn glyphs instead of emoji.
export const DRAWER_GROUPS: DrawerGroup[] = [
  {
    title: 'Money',
    icon: 'money',
    items: [
      { name: 'Expenses',      icon: 'wallet', label: 'Expenses' },
      { name: 'SavingsGoals',  icon: 'goal',   label: 'Savings Goals' },
      { name: 'Insights',      icon: 'chart',  label: 'Insights' },
      { name: 'MonthlyReport', icon: 'report', label: 'Monthly Report' },
    ],
  },
  {
    title: 'Kitchen',
    icon: 'pot',
    items: [
      { name: 'Cooking',   icon: 'utensils', label: 'Cooking' },
      { name: 'Recipes',   icon: 'book',     label: 'Recipe Book' },
      { name: 'Shopping',  icon: 'cart',     label: 'Shopping List' },
      { name: 'Inventory', icon: 'box',      label: 'Inventory' },
    ],
  },
  {
    title: 'Household',
    icon: 'house',
    items: [
      { name: 'MaidTasks', icon: 'broom', label: 'Maid Tasks' },
      { name: 'Remind',    icon: 'bell',  label: 'Reminders' },
      { name: 'Vendors',   icon: 'list',  label: 'Vendors' },
    ],
  },
  {
    title: 'Personal',
    icon: 'heart',
    items: [
      { name: 'CycleTracker', icon: 'cycle', label: 'Cycle Tracker' },
      { name: 'BodyStats',    icon: 'body',  label: 'Body Stats' },
    ],
  },
  {
    title: 'Spiritual',
    icon: 'mosque',
    items: [
      { name: 'PrayerTimes', icon: 'prayer', label: 'Prayer Times' },
      { name: 'Fasting',     icon: 'moon',   label: 'Fasting' },
    ],
  },
  {
    title: 'System',
    icon: 'gear',
    items: [
      { name: 'Backup',   icon: 'box',  label: 'Backup & Restore' },
      { name: 'Settings', icon: 'gear', label: 'Settings' },
    ],
  },
];

const TODAY_ITEM: DrawerItemDef = { name: 'Home', icon: 'home', label: 'Today' };
const TAB_NAMES = new Set(['Today', 'Expenses', 'Cooking', 'Remind']);

const CustomDrawerContent = React.memo(function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const { state, navigation } = props;
  const currentDrawerRoute = state.routes[state.index].name;

  let activeRoute = currentDrawerRoute;
  if (currentDrawerRoute === 'Home') {
    const homeState = state.routes[state.index].state;
    if (homeState && typeof homeState.index === 'number' && homeState.routes) {
      activeRoute = homeState.routes[homeState.index].name;
    } else {
      activeRoute = 'Today';
    }
  }

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const navigateTo = useCallback(
    (routeName: string) => {
      if (TAB_NAMES.has(routeName)) {
        navigation.navigate('Home', { screen: routeName });
      } else {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 18 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <HennaIcon name="sparkle" size={22} color={hennaColors.henna} />
        </View>
        <View>
          <Text style={styles.brand}>ForSHE</Text>
          <Text style={styles.tagline}>Your home, your way</Text>
        </View>
      </View>

      {/* Today standalone */}
      {(() => {
        const isActive = activeRoute === 'Today';
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Today home"
            accessibilityState={{ selected: isActive }}
            onPress={() => navigateTo('Today')}
            style={({ pressed }) => [
              styles.todayRow,
              isActive && { backgroundColor: hennaColors.hennaBg },
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <HennaIcon
              name={TODAY_ITEM.icon}
              size={18}
              color={isActive ? hennaColors.henna : hennaColors.ink2}
            />
            <Text
              style={[
                styles.todayText,
                { color: isActive ? hennaColors.henna : hennaColors.ink2 },
              ]}
            >
              {TODAY_ITEM.label}
            </Text>
            {isActive ? <View style={styles.activeBar} /> : null}
          </Pressable>
        );
      })()}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {DRAWER_GROUPS.map(group => {
          const isCollapsed = !!collapsed[group.title];
          return (
            <View key={group.title} style={styles.group}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.title}`}
                onPress={() => toggleGroup(group.title)}
                style={styles.groupHeader}
              >
                <HennaIcon name={group.icon} size={14} color={hennaColors.henna} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.henna, flex: 1 }]}>
                  {group.title}
                </Text>
                <HennaIcon
                  name={isCollapsed ? 'chev-right' : 'chev-down'}
                  size={12}
                  color={hennaColors.muted}
                />
              </Pressable>

              {!isCollapsed &&
                group.items.map(item => {
                  const isActive = activeRoute === item.name;
                  return (
                    <Pressable
                      key={item.name}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected: isActive }}
                      onPress={() => navigateTo(item.name)}
                      style={({ pressed }) => [
                        styles.itemRow,
                        isActive && { backgroundColor: hennaColors.hennaBg },
                        { opacity: pressed ? 0.92 : 1 },
                      ]}
                    >
                      <HennaIcon
                        name={item.icon}
                        size={16}
                        color={isActive ? hennaColors.henna : hennaColors.ink2}
                      />
                      <Text
                        style={[
                          styles.itemText,
                          { color: isActive ? hennaColors.henna : hennaColors.ink2 },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isActive ? <View style={styles.activeBar} /> : null}
                    </Pressable>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.footerText}>ForSHE v1.2.17</Text>
      </View>
    </View>
  );
});

const renderDrawerContent = (props: any) => <CustomDrawerContent {...props} />;

export function DrawerNav() {
  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 290,
          backgroundColor: hennaColors.pearl,
        },
        overlayColor: 'rgba(60,40,20,0.45)',
      }}
    >
      <Drawer.Screen name="Home" component={BottomTabs} />
      <Drawer.Screen name="Shopping" component={ShoppingListScreen} />
      <Drawer.Screen name="Inventory" component={InventoryScreen} />
      <Drawer.Screen name="MaidTasks" component={MaidScreen} />
      <Drawer.Screen name="Vendors" component={VendorsScreen} />
      <Drawer.Screen name="Recipes" component={RecipeBookScreen} />
      <Drawer.Screen name="SavingsGoals" component={SavingsGoalsScreen} />
      <Drawer.Screen name="Insights" component={InsightsScreen} />
      <Drawer.Screen name="PrayerTimes" component={PrayerTimesScreen} />
      <Drawer.Screen name="PrayerSettings" component={PrayerSettingsScreen} />
      <Drawer.Screen name="Fasting" component={FastingCalendarScreen} />
      <Drawer.Screen name="CycleTracker" component={CycleScreen} />
      <Drawer.Screen name="BodyStats" component={BodyStatsScreen} />
      <Drawer.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <Drawer.Screen name="Backup" component={BackupScreen} />
      <Drawer.Screen name="CloudAuth" component={CloudAuthScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: hennaColors.pearl,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: hennaColors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  brand: {
    fontFamily: hennaFonts.serif,
    fontSize: 22,
    color: hennaColors.ink,
  },
  tagline: {
    marginTop: 1,
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },

  todayRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    position: 'relative',
  },
  todayText: {
    flex: 1,
    fontFamily: hennaFonts.uiSemi,
    fontSize: 14,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  group: { marginTop: 14 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
  },
  itemRow: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    position: 'relative',
  },
  itemText: {
    flex: 1,
    fontFamily: hennaFonts.uiMedium,
    fontSize: 13,
  },
  activeBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: hennaColors.henna,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: hennaColors.line,
  },
  footerText: {
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },
});
