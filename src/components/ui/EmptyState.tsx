import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LottieBox, LottieKey } from './LottieBox';

interface Props {
  icon: string;
  text: string;
  hint?: string;
  /**
   * v1.2.4-dev: optional one-shot Lottie animation key. When provided, we
   * render the animation (one-shot, no loop — LottieBox enforces) in the
   * icon circle. When absent, we fall back to the emoji `icon` prop.
   * Callers should pass `animation="empty-inbox"` on list EmptyStates.
   */
  animation?: LottieKey;
}

export const EmptyState = React.memo(function EmptyState({ icon, text, hint, animation }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg2Elevated ?? colors.bg2 }]}>
        {animation ? (
          <LottieBox animation={animation} size={56} fallbackEmoji={icon} />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>
      <Text style={[styles.text, { color: colors.sub }]}>{text}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginVertical: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  text: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    lineHeight: 22,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
});
