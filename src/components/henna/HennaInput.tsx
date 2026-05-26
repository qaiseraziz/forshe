import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  hennaColors,
  hennaRadii,
  hennaFonts,
  hennaType,
  hennaTextStyles,
} from '../../constants/hennaTokens';

interface Props extends TextInputProps {
  label?: string;
  icon?: string; // HennaIconName — wired in phase 3
  containerStyle?: StyleProp<ViewStyle>;
}

const HennaInputImpl = forwardRef<TextInput, Props>(function HennaInput(
  { label, icon: _icon, containerStyle, style, ...props },
  ref,
) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={[hennaTextStyles.eyebrow, styles.label]}>{label}</Text> : null}
      <View style={styles.fieldRow}>
        {/* icon slot — phase 3 wires <HennaIcon name={_icon} size={16} color={hennaColors.muted} /> */}
        <TextInput
          ref={ref}
          placeholderTextColor={hennaColors.muted}
          style={[styles.input, style]}
          {...props}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: hennaColors.paper2,
    borderRadius: hennaRadii.input,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  input: {
    flex: 1,
    color: hennaColors.ink,
    fontFamily: hennaFonts.ui,
    fontSize: hennaType.body,
    paddingVertical: 0,
    minHeight: 24,
  },
});

export const HennaInput = React.memo(HennaInputImpl);
