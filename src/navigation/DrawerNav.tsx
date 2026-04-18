import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
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

const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { name: 'Home', icon: '🏠', label: 'Home' },
  { name: 'Shopping', icon: '🛒', label: 'Shopping List' },
  { name: 'Inventory', icon: '📦', label: 'Inventory' },
  { name: 'MaidTasks', icon: '🧹', label: 'Maid Tasks' },
  { name: 'Recipes', icon: '📖', label: 'Recipe Book' },
  { name: 'SavingsGoals', icon: '💰', label: 'Savings Goals' },
  { name: 'Insights', icon: '📈', label: 'Insights' },
  { name: 'CycleTracker', icon: '🌸', label: 'Cycle Tracker' },
  { name: 'BodyStats', icon: '💪', label: 'Body Stats' },
  { name: 'MonthlyReport', icon: '📊', label: 'Monthly Report' },
  { name: 'Backup', icon: '💾', label: 'Backup & Restore' },
  { name: 'Settings', icon: '⚙️', label: 'Settings' },
];

const CustomDrawerContent = React.memo(function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, navigation } = props;
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.bg }]}>
      <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
        <Image source={require('../../assets/logo.png')} style={styles.drawerLogoImg} resizeMode="contain" />
        <Text style={[styles.drawerTitle, { color: colors.deep }]}>ForSHE</Text>
        <Text style={[styles.drawerSlogan, { color: colors.muted }]}>Your home, your way</Text>
      </View>

      <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

      <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
        {DRAWER_ITEMS.map(item => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.drawerItem,
                isActive && { backgroundColor: 'rgba(200,134,10,0.1)' },
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.name)}
            >
              <Text style={styles.drawerItemIcon}>{item.icon}</Text>
              <Text style={[
                styles.drawerItemLabel,
                { color: isActive ? colors.gold : colors.sub },
              ]}>
                {item.label}
              </Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.gold }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.drawerFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
        <Text style={[styles.footerText, { color: colors.muted }]}>ForSHE v1.2.0</Text>
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
      <Drawer.Screen name="Recipes" component={RecipeBookScreen} />
      <Drawer.Screen name="SavingsGoals" component={SavingsGoalsScreen} />
      <Drawer.Screen name="Insights" component={InsightsScreen} />
      <Drawer.Screen name="CycleTracker" component={CycleScreen} />
      <Drawer.Screen name="BodyStats" component={BodyStatsScreen} />
      <Drawer.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <Drawer.Screen name="Backup" component={BackupScreen} />
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
