// src/screens/RideCompleteScreen.tsx
// Modern Indian Design - Celebratory ride completion

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../contexts/UserContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'RideComplete'>;

export default function RideCompleteScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { tokensEarned, distance } = route.params;
  const { refreshProfile } = useUser();
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    refreshProfile();
  }, []);

  const handleDone = () => {
    navigation.navigate('Main');
  };

  const distanceKm = (distance / 1000).toFixed(1);
  const baseTokens = 10;
  const bonusTokens = tokensEarned - baseTokens;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successBadge}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Ride Complete!</Text>
          <Text style={styles.subtitle}>
            {distanceKm} km • {Math.ceil(distance / 500)} mins
          </Text>
        </View>

        {/* Token Earned Card */}
        <View style={styles.tokenCard}>
          <View style={styles.tokenGlow}>
            <View style={styles.tokenCircle}>
              <Text style={styles.tokenEmoji}>🪙</Text>
            </View>
          </View>
          
          <Text style={styles.tokenAmount}>+{tokensEarned}</Text>
          <Text style={styles.tokenLabel}>Tokens Earned</Text>
          
          {bonusTokens > 0 && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>+{bonusTokens} distance bonus!</Text>
            </View>
          )}
        </View>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>
          
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <Text style={styles.breakdownIcon}>🎯</Text>
              <Text style={styles.breakdownLabel}>Base reward</Text>
            </View>
            <Text style={styles.breakdownValue}>+{baseTokens}</Text>
          </View>
          
          {bonusTokens > 0 && (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownIcon}>🚀</Text>
                <Text style={styles.breakdownLabel}>Distance bonus</Text>
              </View>
              <Text style={[styles.breakdownValue, styles.bonusValue]}>+{bonusTokens}</Text>
            </View>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalValue}>+{tokensEarned} 🪙</Text>
            </View>
          </View>
        </View>

        {/* Plate Collection Card */}
        <View style={styles.plateCard}>
          <View style={styles.plateLeft}>
            <View style={styles.plateCode}>
              <Text style={styles.plateCodeText}>KA-01</Text>
            </View>
            <View>
              <Text style={styles.plateTitle}>New Plate!</Text>
              <Text style={styles.plateSubtitle}>Bangalore East</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.collectButton}>
            <Text style={styles.collectButtonText}>Collect</Text>
          </TouchableOpacity>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Rate your ride</Text>
          <Text style={styles.ratingSubtitle}>How was your experience?</Text>
          
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star} 
                style={[
                  styles.starButton,
                  selectedRating >= star && styles.starButtonActive
                ]}
                onPress={() => setSelectedRating(star)}
              >
                <Text style={[
                  styles.starText,
                  selectedRating >= star && styles.starTextActive
                ]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {selectedRating > 0 && (
            <Text style={styles.ratingFeedback}>
              {selectedRating >= 4 ? 'Awesome! Thanks for the feedback 🎉' : 
               selectedRating >= 2 ? 'Thanks for the feedback!' : 
               'Sorry to hear that. We\'ll improve!'}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>📝</Text>
            <Text style={styles.shareButtonText}>Share Your Story</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
            <Text style={styles.doneIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Hint */}
        <View style={styles.statsHint}>
          <Text style={styles.statsHintText}>
            Check your updated stats in Profile →
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  
  // Success Header
  successHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.accent}20`,
    borderWidth: 3,
    borderColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  successIcon: {
    fontSize: 40,
    color: theme.colors.accent,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  
  // Token Card
  tokenCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    ...theme.shadows.md,
  },
  tokenGlow: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}20`,
    marginBottom: theme.spacing.md,
  },
  tokenCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenEmoji: {
    fontSize: 32,
  },
  tokenAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  bonusBadge: {
    backgroundColor: `${theme.colors.accent}20`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    marginTop: theme.spacing.md,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  
  // Breakdown Card
  breakdownCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownIcon: {
    fontSize: 16,
  },
  breakdownLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  bonusValue: {
    color: theme.colors.accent,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  totalBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textOnPrimary,
  },
  
  // Plate Card
  plateCard: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plateCode: {
    backgroundColor: `${theme.colors.rider}20`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.rider,
  },
  plateCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.rider,
  },
  plateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  plateSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  collectButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
  },
  collectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  
  // Rating Card
  ratingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  ratingSubtitle: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.borderStrong,
  },
  starText: {
    fontSize: 24,
    color: theme.colors.textTertiary,
  },
  starTextActive: {
    color: theme.colors.textOnPrimary,
  },
  ratingFeedback: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },
  
  // Actions
  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: 10,
  },
  shareIcon: {
    fontSize: 18,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    gap: 8,
    ...theme.shadows.magenta,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  doneIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  
  // Stats Hint
  statsHint: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  statsHintText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
});
