import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';

type NoticeVariant = 'info' | 'success' | 'warning' | 'error';

interface NoticeProps {
  title: string;
  message: string;
  variant?: NoticeVariant;
}

const VARIANT_CONFIG: Record<NoticeVariant, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: { color: Colors.trustBlue, icon: 'information-circle' },
  success: { color: Colors.trustGreen, icon: 'checkmark-circle' },
  warning: { color: Colors.warning, icon: 'alert-circle' },
  error: { color: Colors.error, icon: 'close-circle' },
};

export default function Notice({ title, message, variant = 'info' }: NoticeProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View style={[styles.container, { borderColor: config.color, backgroundColor: config.color + '12' }]}>
      <Ionicons name={config.icon} size={20} color={config.color} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: config.color }]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    marginBottom: 2,
  },
  message: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
