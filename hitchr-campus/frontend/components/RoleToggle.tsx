import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useCampusStore } from '../store/campusStore';
import { campusUserAPI } from '../utils/campusApi';

export default function RoleToggle() {
  const { colors, shadows } = useTheme('light');
  const { user, userRole, toggleRole } = useCampusStore();
  const [slideAnim] = React.useState(new Animated.Value(userRole === 'rider' ? 0 : 1));

  const handleToggle = async (role: 'rider' | 'pilot') => {
    if (role === userRole) return;
    
    Animated.spring(slideAnim, {
      toValue: role === 'pilot' ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();
    
    await toggleRole();
    if (user) {
      try {
        await campusUserAPI.toggleRole(user.id, role);
      } catch (error) {
        console.error('Error updating role:', error);
      }
    }
  };

  const slideInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.divider,
      borderRadius: BorderRadius.pill,
      padding: 3,
      flexDirection: 'row',
      position: 'relative',
    },
    slider: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: '48%',
      height: 38,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.pill,
      ...shadows.sm,
    },
    button: {
      flex: 1,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    buttonText: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
    },
    activeText: {
      color: colors.text,
    },
    inactiveText: {
      color: colors.textTertiary,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.slider, { left: slideInterpolate }]} />
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleToggle('rider')}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, userRole === 'rider' ? styles.activeText : styles.inactiveText]}>
          Rider
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleToggle('pilot')}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, userRole === 'pilot' ? styles.activeText : styles.inactiveText]}>
          Pilot
        </Text>
      </TouchableOpacity>
    </View>
  );
}
