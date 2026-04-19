import React, { forwardRef } from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
}

/**
 * v1.2.5-dev: now forwards a ref to the underlying `TextInput` so form
 * keyboard flow (see `src/utils/formRefs.ts`) can call `.focus()` on next
 * fields. Still `React.memo`-wrapped for re-render discipline.
 */
const InputImpl = forwardRef<TextInput, Props>(function Input({ label, style, ...props }, ref) {
  const { colors } = useTheme();
  return (
    <View>
      {label && <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.bg3,
            borderColor: colors.border,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
});

export const Input = React.memo(InputImpl);

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
    minHeight: 54,
  },
});
