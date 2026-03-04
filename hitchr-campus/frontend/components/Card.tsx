import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
}

export default function Card({ children, style, padding = Spacing.md, elevated = true }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  elevated: {
    ...Shadows.sm,
  },
});
