// src/components/Button.tsx
// Modern Indian Design - Bold, Tactile, Authentic

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { theme } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...sizeStyles[size].button,
      ...(disabled && styles.disabled),
      ...(fullWidth && styles.fullWidth),
    };

    return { ...baseStyle, ...variantStyles[variant].button };
  };

  const getTextStyle = (): TextStyle => {
    return {
      ...styles.buttonText,
      ...sizeStyles[size].text,
      ...variantStyles[variant].text,
    };
  };

  const getLoaderColor = () => {
    if (variant === 'primary') return theme.colors.textOnPrimary;
    if (variant === 'outline' || variant === 'ghost') return theme.colors.primary;
    if (variant === 'accent') return theme.colors.textInverse;
    return theme.colors.textInverse;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Variant styles - the "spicy" variations
const variantStyles = {
  primary: {
    button: {
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.black,
      ...theme.shadows.glow,
    } as ViewStyle,
    text: {
      color: theme.colors.textOnPrimary,
      fontWeight: theme.fontWeight.bold,
    } as TextStyle,
  },
  secondary: {
    button: {
      backgroundColor: theme.colors.secondary,
      borderWidth: 2,
      borderColor: theme.colors.black,
      ...theme.shadows.magenta,
    } as ViewStyle,
    text: {
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.bold,
    } as TextStyle,
  },
  accent: {
    button: {
      backgroundColor: theme.colors.accent,
      borderWidth: 2,
      borderColor: theme.colors.black,
    } as ViewStyle,
    text: {
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.bold,
    } as TextStyle,
  },
  outline: {
    button: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.black,
    } as ViewStyle,
    text: {
      color: theme.colors.textPrimary,
      fontWeight: theme.fontWeight.semibold,
    } as TextStyle,
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    } as ViewStyle,
    text: {
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.semibold,
    } as TextStyle,
  },
  danger: {
    button: {
      backgroundColor: theme.colors.danger,
      borderWidth: 2,
      borderColor: theme.colors.black,
    } as ViewStyle,
    text: {
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.bold,
    } as TextStyle,
  },
};

// Size variations
const sizeStyles = {
  sm: {
    button: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.md,
      minHeight: 40,
    } as ViewStyle,
    text: {
      fontSize: theme.fontSize.sm,
    } as TextStyle,
  },
  md: {
    button: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: theme.borderRadius.lg,
      minHeight: 52,
    } as ViewStyle,
    text: {
      fontSize: theme.fontSize.base,
    } as TextStyle,
  },
  lg: {
    button: {
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: theme.borderRadius.xl,
      minHeight: 60,
    } as ViewStyle,
    text: {
      fontSize: theme.fontSize.lg,
    } as TextStyle,
  },
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
