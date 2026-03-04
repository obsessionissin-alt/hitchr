// src/components/Avatar.tsx
// Modern Indian Design - Bold, expressive avatars with character

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface AvatarProps {
  name?: string;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'default' | 'pilot' | 'rider' | 'highlight';
  showBorder?: boolean;
  badge?: React.ReactNode;
  style?: ViewStyle;
}

const sizeMap = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  variant = 'default',
  showBorder = true,
  badge,
  style,
}) => {
  const numericSize = typeof size === 'number' ? size : sizeMap[size];
  const initial = name?.[0]?.toUpperCase() || '?';
  
  const backgroundColor = variantColors[variant];

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: numericSize,
            height: numericSize,
            borderRadius: numericSize / 2,
            backgroundColor,
          },
          showBorder && styles.border,
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, { borderRadius: numericSize / 2 }]}
          />
        ) : (
          <Text
            style={[
              styles.initial,
              {
                fontSize: numericSize * 0.4,
                color: variant === 'highlight' ? theme.colors.textOnPrimary : theme.colors.textInverse,
              },
            ]}
          >
            {initial}
          </Text>
        )}
      </View>
      
      {badge && (
        <View style={styles.badgeContainer}>
          {badge}
        </View>
      )}
    </View>
  );
};

const variantColors: Record<string, string> = {
  default: theme.colors.textTertiary,
  pilot: theme.colors.pilot,
  rider: theme.colors.rider,
  highlight: theme.colors.primary,
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  border: {
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontWeight: '800',
    letterSpacing: 0,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
});

export default Avatar;
