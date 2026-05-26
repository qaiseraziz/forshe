import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  hennaColors,
  hennaFonts,
  hennaTextStyles,
} from '../../constants/hennaTokens';
import { HennaIcon } from './HennaIcons';
import type { HennaIconName } from './HennaIcons';

export interface HennaDrawerItem {
  name: string;
  icon: HennaIconName;
}

export interface HennaDrawerGroup {
  title: string;
  icon: HennaIconName;
  items: HennaDrawerItem[];
}

interface Props {
  active: string;
  onNavigate: (name: string) => void;
  groups: HennaDrawerGroup[];
  versionLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Drawer content — presentational only. Phase 4 ships this component;
 * the real navigator (`src/navigation/DrawerNav.tsx`) is NOT swapped to
 * this yet — that's phase 6 scope.
 */
function HennaDrawerImpl({ active, onNavigate, groups, versionLabel, style }: Props) {
  return (
    <View style={[styles.container, style]}>
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

      {/* Today standalone row */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Today"
        accessibilityState={{ selected: active === 'Today' }}
        onPress={() => onNavigate('Today')}
        style={({ pressed }) => [
          styles.todayRow,
          active === 'Today' && { backgroundColor: hennaColors.hennaBg },
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <HennaIcon
          name="home"
          size={18}
          color={active === 'Today' ? hennaColors.henna : hennaColors.ink2}
        />
        <Text
          style={[
            styles.todayText,
            { color: active === 'Today' ? hennaColors.henna : hennaColors.ink2 },
          ]}
        >
          Today
        </Text>
      </Pressable>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <View style={styles.groupHeader}>
              <HennaIcon name={group.icon} size={14} color={hennaColors.henna} />
              <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.henna }]}>
                {group.title}
              </Text>
            </View>
            {group.items.map((item) => {
              const isActive = item.name === active;
              return (
                <Pressable
                  key={item.name}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: isActive }}
                  onPress={() => onNavigate(item.name)}
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
                    {item.name}
                  </Text>
                  {isActive ? <View style={styles.activeBar} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {versionLabel ? (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{versionLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 290,
    backgroundColor: hennaColors.pearl,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
    marginTop: 1,
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
  },
  todayText: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  group: {
    marginTop: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
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
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: hennaColors.line,
  },
  footerText: {
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },
});

export const HennaDrawer = React.memo(HennaDrawerImpl);
