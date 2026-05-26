import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { hennaColors, hennaFonts, hennaShadows } from '../../constants/hennaTokens';
import { HennaIcon } from './HennaIcons';

interface Props {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
  action?: React.ReactNode;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Top-of-screen header: optional hamburger button, Marcellus title,
 * optional subtitle, optional right-aligned action slot.
 *
 * Phase 4 presentational only — actual screen wiring happens in phase 5+.
 */
function HennaHeaderImpl({ title, subtitle, onMenu, action, large, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      {onMenu ? (
        <Pressable
          onPress={onMenu}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={8}
          style={({ pressed }) => [
            styles.menuBtn,
            hennaShadows.sm,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <HennaIcon name="menu" size={18} />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { fontSize: large ? 26 : 20 }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: hennaColors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: hennaFonts.serif,
    color: hennaColors.ink,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.muted,
    marginTop: 3,
  },
});

export const HennaHeader = React.memo(HennaHeaderImpl);
