import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utilities for emotional micro-interactions
 * Makes the app feel alive and social, not transactional
 */

// Light tap - used for selection, toggles
export const tapLight = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

// Medium tap - used for button presses, confirmations
export const tapMedium = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

// Heavy tap - used for important actions
export const tapHeavy = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

// Success - used for completed actions, celebrations
export const success = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

// Warning - used for alerts, important notices
export const warning = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

// Error - used for failed actions
export const error = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

// Selection - used for picker, segmented control changes
export const selection = () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
};

/**
 * Celebration pattern - for big moments like:
 * - Request accepted
 * - Ride completed
 * - Payment successful
 */
export const celebrate = async () => {
  if (Platform.OS === 'web') return;
  
  // Quick succession of haptics for celebration
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise(resolve => setTimeout(resolve, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await new Promise(resolve => setTimeout(resolve, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Journey start pattern - for ride started moments
 */
export const journeyStart = async () => {
  if (Platform.OS === 'web') return;
  
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise(resolve => setTimeout(resolve, 150));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export default {
  tapLight,
  tapMedium,
  tapHeavy,
  success,
  warning,
  error,
  selection,
  celebrate,
  journeyStart,
};
