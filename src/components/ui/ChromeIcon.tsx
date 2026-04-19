import React from 'react';
import {
  House,
  CurrencyCircleDollar,
  ForkKnife,
  Bell,
  List,
} from 'phosphor-react-native';

/**
 * ChromeIcon — ONE consistent Phosphor icon weight across all ForSHE chrome.
 *
 * Rules (enforced via qa-expert):
 *   - Chrome = hamburger / bottom tab bar / hero headers / action buttons
 *   - Content = category pickers, recipe / reminder names, drawer group
 *     emojis — those stay as emoji for warmth and personality.
 *   - We ship ONLY the icons we actually use (no barrel imports of the whole
 *     phosphor set) so the bundle stays small.
 *   - Weight: `regular` — do not mix weights across the app.
 *
 * If a new chrome icon is needed, add a named export below — do NOT import
 * Phosphor directly in screens/components.
 */

const DEFAULT_WEIGHT = 'regular' as const;

type Props = { size?: number; color?: string };

const defaultSize = 22;

export const TabHouseIcon = React.memo(function TabHouseIcon({ size = defaultSize, color }: Props) {
  return <House size={size} color={color ?? '#000'} weight={DEFAULT_WEIGHT} />;
});

export const TabMoneyIcon = React.memo(function TabMoneyIcon({ size = defaultSize, color }: Props) {
  return <CurrencyCircleDollar size={size} color={color ?? '#000'} weight={DEFAULT_WEIGHT} />;
});

export const TabForkKnifeIcon = React.memo(function TabForkKnifeIcon({ size = defaultSize, color }: Props) {
  return <ForkKnife size={size} color={color ?? '#000'} weight={DEFAULT_WEIGHT} />;
});

export const TabBellIcon = React.memo(function TabBellIcon({ size = defaultSize, color }: Props) {
  return <Bell size={size} color={color ?? '#000'} weight={DEFAULT_WEIGHT} />;
});

export const MenuListIcon = React.memo(function MenuListIcon({ size = 20, color }: Props) {
  return <List size={size} color={color ?? '#000'} weight="bold" />;
});
