import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
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
import CloudAuthScreen from '../screens/CloudAuthScreen';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Drawer = createDrawerNavigator();

type DrawerItemDef = { name: string; icon: string; label: string };
type DrawerGroup = { title: string; icon: string; items: DrawerItemDef[] };

// v1.2.3-dev: 6 grouped sections (Today stays outside, standalone at the top).
// Spiritual split out of Personal — Islamic features get their own home (Qibla, Duas, Quran
// bookmarks, Zakat calc, Islamic events will land here). Personal goes back to wellness-only.
export const DRAWER_GROUPS: DrawerGroup[] = [
  {
    title: 'Money',
    icon: '💰',
    items: [
      { name: 'Expenses', icon: '💸', label: 'Expenses' },
      { name: 'SavingsGoals', icon: '🎯', label: 'Savings Goals' },
      { name: 'Insights', icon: '📈', label: 'Insights' },
      { name: 'MonthlyReport', icon: '📊', label: 'Monthly Report' },
    ],
  },
  {
    title: 'Kitchen',
    icon: '🍽️',
    items: [
      { name: 'Cooking', icon: '🍳', label: 'Cooking' },
      { name: 'Recipes', icon: '📖', label: 'Recipe Book' },
      { name: 'Shopping', icon: '🛒', label: 'Shopping List' },
      { name: 'Inventory', icon: '📦', label: 'Inventory' },
    ],
  },
  {
    title: 'Household',
    icon: '🏠',
    items: [
      { name: 'MaidTasks', icon: '🧹', label: 'Maid Tasks' },
      { name: 'Remind', icon: '🔔', label: 'Reminders' },
      { name: 'Vendors', icon: '💼', label: 'Vendors' },
    ],
  },
  {
    title: 'Personal',
    icon: '💝',
    items: [
      { name: 'CycleTracker', icon: '🌸', label: 'Cycle Tracker' },
      { name: 'BodyStats', icon: '💪', label: 'Body Stats' },
    ],
  },
  {
    title: 'Spiritual',
    icon: '🕌',
    items: [
      { name: 'PrayerTimes', icon: '🕌', label: 'Prayer Times' },
    ],
  },
  {
    title: 'System',
    icon: '⚙️',
    items: [
      { name: 'Backup', icon: '💾', label: 'Backup & Restore' },
      { name: 'Settings', icon: '⚙️', label: 'Settings' },
    ],
  },
];

const TODAY_ITEM: DrawerItemDef = { name: 'Home', icon: '🏠', label: 'Today' };

// Tab-names inside BottomTabs (hosted under Drawer route "Home")
const TAB_NAMES = new Set(['Today', 'Expenses', 'Cooking', 'Remind']);

const CustomDrawerContent = React.memo(function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, navigation } = props;
  const currentDrawerRoute = state.routes[state.index].name;

  // Resolve the currently active leaf route — if drawer is on "Home", look at the nested tab
  let activeRoute = currentDrawerRoute;
  if (currentDrawerRoute === 'Home') {
    const homeState = state.routes[state.index].state;
    if (homeState && typeof homeState.index === 'number' && homeState.routes) {
      activeRoute = homeState.routes[homeState.index].name;
    } else {
      activeRoute = 'Today';
    }
  }

  // Default: all groups expanded
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const navigateTo = useCallback(
    (routeName: string) => {
      // Tab routes live inside the "Home" drawer screen — nest the navigation
      if (TAB_NAMES.has(routeName)) {
        navigation.navigate('Home', { screen: routeName });
      } else {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.bg }]}>
      <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
        <Image source={require('../../assets/logo.png')} style={styles.drawerLogoImg} resizeMode="contain" />
        <Text style={[styles.drawerTitle, { color: colors.deep }]}>ForSHE</Text>
        <Text style={[styles.drawerSlogan, { color: colors.muted }]}>Your home, your way</Text>
      </View>

      <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

      <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
        {/* Today — standalone row above groups */}
        {(() => {
          const isActive = activeRoute === 'Today';
          return (
            <TouchableOpacity
              key={TODAY_ITEM.name}
              style={[
                styles.drawerItem,
                styles.drawerItemTop,
                isActive && { backgroundColor: 'rgba(200,134,10,0.1)' },
              ]}
              activeOpacity={0.7}
              onPress={() => navigateTo('Today')}
              accessibilityRole="button"
              accessibilityLabel="Today home"
            >
              <Text style={styles.drawerItemIcon}>{TODAY_ITEM.icon}</Text>
              <Text
                style={[
                  styles.drawerItemLabel,
                  { color: isActive ? colors.gold : colors.sub },
                ]}
              >
                {TODAY_ITEM.label}
              </Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.gold }]} />
              )}
            </TouchableOpacity>
          );
        })()}

        {/* 5 groups */}
        {DRAWER_GROUPS.map(group => {
          const isCollapsed = !!collapsed[group.title];
          return (
            <View key={group.title} style={styles.group}>
              <TouchableOpacity
                style={styles.groupHeader}
                activeOpacity={0.7}
                onPress={() => toggleGroup(group.title)}
                accessibilityRole="button"
                accessibilityLabel={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.title}`}
              >
                <Text style={styles.groupIcon}>{group.icon}</Text>
                <Text style={[styles.groupTitle, { color: colors.sub }]}>{group.title}</Text>
                <Text style={[styles.groupChevron, { color: colors.muted }]}>
                  {isCollapsed ? '▸' : '▾'}
                </Text>
              </TouchableOpacity>

              {!isCollapsed &&
                group.items.map(item => {
                  const isActive = activeRoute === item.name;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.drawerItem,
                        styles.drawerItemNested,
                        isActive && { backgroundColor: 'rgba(200,134,10,0.1)' },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => navigateTo(item.name)}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Text style={styles.drawerItemIcon}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.drawerItemLabel,
                          { color: isActive ? colors.gold : colors.sub },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isActive && (
                        <View style={[styles.activeIndicator, { backgroundColor: colors.gold }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.drawerFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <Text style={[styles.footerText, { color: colors.muted }]}>ForSHE v1.2.8</Text>
      </View>
    </View>
  );
});

const renderDrawerContent = (props: any) => <CustomDrawerContent {...props} />;

export function DrawerNav() {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: colors.bg,
        },
        overlayColor: 'rgba(0,0,0,0.4)',
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
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  drawerLogoImg: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  drawerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
  },
  drawerSlogan: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  drawerDivider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
    position: 'relative',
    minHeight: 44,
  },
  drawerItemTop: {
    marginTop: 4,
    marginBottom: 8,
  },
  drawerItemNested: {
    marginLeft: 8,
    paddingVertical: 12,
  },
  drawerItemIcon: {
    fontSize: 22,
    marginRight: 16,
  },
  drawerItemLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    flex: 1,
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    position: 'absolute',
    right: 8,
  },
  group: {
    marginTop: 6,
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  groupIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  groupTitle: {
    flex: 1,
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  groupChevron: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    marginLeft: 6,
    width: 16,
    textAlign: 'center',
  },
  drawerFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
  },
});
