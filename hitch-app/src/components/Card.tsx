// src/components/Card.tsx
// Modern Indian Design - Bold borders, warm surfaces, tactile feel

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { theme } from '../constants/theme';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'highlight' | 'dark';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  selected = false,
  style,
}) => {
  const cardStyle = [
    styles.card,
    variantStyles[variant],
    paddingStyles[padding],
    selected && styles.selected,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// Variant styles
const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0,
    ...theme.shadows.sm,
  },
  elevated: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    ...theme.shadows.md,
  },
  outlined: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  highlight: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    ...theme.shadows.glow,
  },
  dark: {
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
  },
};

// Padding styles
const paddingStyles: Record<string, ViewStyle> = {
  none: {
    padding: 0,
  },
  sm: {
    padding: theme.spacing.sm,
  },
  md: {
    padding: theme.spacing.md,
  },
  lg: {
    padding: theme.spacing.lg,
  },
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  selected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
});

export default Card;
