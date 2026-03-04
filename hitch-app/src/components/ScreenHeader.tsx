// src/components/ScreenHeader.tsx
// Modern Indian Design - Bold, branded screen headers

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  leftAction?: {
    icon: string;
    onPress: () => void;
  };
  rightAction?: {
    icon: string;
    onPress: () => void;
    variant?: 'default' | 'highlight';
  };
  variant?: 'default' | 'transparent' | 'dark';
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showLogo = false,
  leftAction,
  rightAction,
  variant = 'default',
  style,
}) => {
  const isTransparent = variant === 'transparent';
  const isDark = variant === 'dark';

  return (
    <View style={[styles.header, variantStyles[variant], style]}>
      {/* Left side */}
      <View style={styles.left}>
        {leftAction && (
          <TouchableOpacity
            style={[styles.actionButton, isDark && styles.actionButtonDark]}
            onPress={leftAction.onPress}
          >
            <Text style={styles.actionIcon}>{leftAction.icon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Center */}
      <View style={styles.center}>
        {showLogo ? (
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </View>
            <Text style={[styles.brandName, isDark && styles.textLight]}>hitchr</Text>
          </View>
        ) : title ? (
          <View>
            <Text style={[styles.title, isDark && styles.textLight]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, isDark && styles.subtitleLight]}>
                {subtitle}
              </Text>
            )}
          </View>
        ) : null}
      </View>

      {/* Right side */}
      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              rightAction.variant === 'highlight' && styles.actionButtonHighlight,
              isDark && styles.actionButtonDark,
            ]}
            onPress={rightAction.onPress}
          >
            <Text style={styles.actionIcon}>{rightAction.icon}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: theme.colors.background,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  dark: {
    backgroundColor: theme.colors.surfaceDark,
  },
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 56,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonHighlight: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
  },
  actionIcon: {
    fontSize: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.textOnPrimary,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  title: {
    ...theme.typography.subheading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  textLight: {
    color: theme.colors.textInverse,
  },
  subtitleLight: {
    color: 'rgba(255,255,255,0.6)',
  },
});

export default ScreenHeader;



