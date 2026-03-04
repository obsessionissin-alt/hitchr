// src/components/Badge.tsx
// Modern Indian Design - Bold badges with character

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  icon?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
}) => {
  return (
    <View style={[styles.badge, variantStyles[variant], sizeStyles[size].container, style]}>
      {icon && <Text style={[styles.icon, sizeStyles[size].icon]}>{icon}</Text>}
      <Text style={[styles.label, variantTextStyles[variant], sizeStyles[size].text]}>
        {label}
      </Text>
    </View>
  );
};

const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  success: {
    backgroundColor: `${theme.colors.success}20`,
  },
  warning: {
    backgroundColor: `${theme.colors.warning}20`,
  },
  danger: {
    backgroundColor: `${theme.colors.danger}20`,
  },
  info: {
    backgroundColor: `${theme.colors.info}20`,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
};

const variantTextStyles: Record<string, TextStyle> = {
  default: {
    color: theme.colors.textSecondary,
  },
  primary: {
    color: theme.colors.textOnPrimary,
  },
  secondary: {
    color: theme.colors.textInverse,
  },
  success: {
    color: theme.colors.success,
  },
  warning: {
    color: theme.colors.warning,
  },
  danger: {
    color: theme.colors.danger,
  },
  info: {
    color: theme.colors.info,
  },
  outline: {
    color: theme.colors.textSecondary,
  },
};

const sizeStyles = {
  sm: {
    container: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    } as ViewStyle,
    text: {
      fontSize: 10,
    } as TextStyle,
    icon: {
      fontSize: 10,
    } as TextStyle,
  },
  md: {
    container: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
    } as ViewStyle,
    text: {
      fontSize: 12,
    } as TextStyle,
    icon: {
      fontSize: 12,
    } as TextStyle,
  },
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default Badge;



