import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme, spacing, typography } from '../constants/theme';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  message: {
    ...typography.weights,
    color: theme.colors.textGray,
    marginTop: spacing.md,
  },
});