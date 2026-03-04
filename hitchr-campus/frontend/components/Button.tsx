import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? Colors.primary : Colors.white} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={variant === 'ghost' ? Colors.primary : Colors.white}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.trustBlue,
  },
  ghost: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  text: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.white,
  },
  ghostText: {
    color: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginTop: 1,
  },
});
