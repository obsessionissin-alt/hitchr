// src/screens/NotificationSentScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface NotificationSentScreenProps {
  route: {
    params: {
      rideId: string;
      pilotId: string;
      pilotName: string;
    };
  };
  navigation: any;
}

export default function NotificationSentScreen({ route, navigation }: NotificationSentScreenProps) {
  const { pilotName } = route.params;

  const handleCancel = () => {
    // TODO: Implement cancel notification API call
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={64} color={theme.colors.secondary} />
        </View>
      </View>

      {/* Heading */}
      <Text style={styles.heading}>Notification Sent!</Text>
      <Text style={styles.subtitle}>
        {pilotName} has been alerted you're ahead
      </Text>

      {/* Voice Alert Card */}
      <View style={styles.alertCard}>
        <Ionicons name="volume-high" size={20} color={theme.colors.secondary} />
        <View style={styles.alertCardContent}>
          <Text style={styles.alertCardTitle}>Voice Alert Sent</Text>
          <Text style={styles.alertCardText}>
            "Rider ahead on your route"
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>What happens next?</Text>
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Pilot receives notification</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Pilot approaches your location</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Both confirm when nearby (10-20m)</Text>
          </View>
        </View>
      </View>

      {/* ETA Card */}
      <View style={styles.etaCard}>
        <Text style={styles.etaLabel}>Estimated Arrival</Text>
        <Text style={styles.etaValue}>2 mins</Text>
      </View>

      {/* Small Map Preview (Placeholder) */}
      <View style={styles.mapPreview}>
        <Ionicons name="map" size={40} color={theme.colors.textTertiary} />
        <Text style={styles.mapPreviewText}>Pilot location approaching</Text>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Cancel Notification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryLight + '20',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  alertCardContent: {
    flex: 1,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  alertCardText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    ...theme.shadows.md,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  etaCard: {
    backgroundColor: theme.colors.white,
    padding: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    ...theme.shadows.md,
  },
  etaLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  etaValue: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  mapPreview: {
    width: '100%',
    height: 150,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  mapPreviewText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 8,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
