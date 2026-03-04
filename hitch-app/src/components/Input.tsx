// src/components/Input.tsx
// Modern Indian Design - Bold, clear, tactile inputs

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native';
import { theme } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  variant = 'outlined',
  size = 'md',
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputContainerStyle = [
    styles.inputContainer,
    variantStyles[variant].container,
    sizeStyles[size].container,
    isFocused && styles.focused,
    error && styles.error,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        
        <TextInput
          style={[
            styles.input,
            sizeStyles[size].input,
            variantStyles[variant].input,
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {suffix && <View style={styles.suffix}>{suffix}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

// Variant styles
const variantStyles: Record<string, { container: ViewStyle; input: ViewStyle }> = {
  default: {
    container: {
      backgroundColor: theme.colors.surfaceSecondary,
      borderWidth: 0,
    },
    input: {},
  },
  filled: {
    container: {
      backgroundColor: theme.colors.surfaceSecondary,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    input: {},
  },
  outlined: {
    container: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    input: {},
  },
};

// Size styles
const sizeStyles: Record<string, { container: ViewStyle; input: ViewStyle }> = {
  sm: {
    container: {
      borderRadius: theme.borderRadius.md,
      minHeight: 44,
    },
    input: {
      fontSize: theme.fontSize.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
  },
  md: {
    container: {
      borderRadius: theme.borderRadius.lg,
      minHeight: 52,
    },
    input: {
      fontSize: theme.fontSize.base,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
  },
  lg: {
    container: {
      borderRadius: theme.borderRadius.xl,
      minHeight: 60,
    },
    input: {
      fontSize: theme.fontSize.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
  },
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  prefix: {
    paddingLeft: theme.spacing.md,
  },
  suffix: {
    paddingRight: theme.spacing.md,
  },
  focused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  error: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
  hintText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
});
