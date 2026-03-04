import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';

type ChipVariant = 'default' | 'primary' | 'success' | 'info' | 'warning';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  style?: ViewStyle;
}

export default function Chip({ label, variant = 'default', style }: ChipProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  default: {
    backgroundColor: Colors.gray100,
  },
  defaultText: {
    color: Colors.textSecondary,
  },
  primary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  primaryText: {
    color: Colors.white,
  },
  success: {
    backgroundColor: Colors.trustGreenLight,
    borderColor: Colors.trustGreen,
  },
  successText: {
    color: Colors.trustGreen,
  },
  info: {
    backgroundColor: Colors.trustBlueLight,
    borderColor: Colors.trustBlue,
  },
  infoText: {
    color: Colors.trustBlue,
  },
  warning: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.warning,
  },
  warningText: {
    color: Colors.warning,
  },
});
