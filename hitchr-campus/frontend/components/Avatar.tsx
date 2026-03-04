import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSizes, FontWeights } from '../constants/theme';

interface AvatarProps {
  name?: string;
  size?: number;
  source?: ImageSourcePropType;
}

export default function Avatar({ name, size = 40, source }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  if (source) {
    return <Image source={source} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {initials ? (
        <Text style={[styles.initials, { fontSize: size / 2.4 }]}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={size / 2} color={Colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
});
