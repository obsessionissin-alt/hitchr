import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface AvatarProps {
  name?: string;
  imageUrl?: string | null;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 50,
}) => {
  const initial = name?.[0]?.toUpperCase() || '?';

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    color: theme.colors.white,
    fontWeight: '700',
  },
});