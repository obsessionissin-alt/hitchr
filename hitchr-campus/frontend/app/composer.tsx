import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/theme';
import { useCampusStore } from '../store/campusStore';
import { campusRouteAPI, campusPlannedTripAPI, campusMemoryAPI } from '../utils/campusApi';
import haptics from '../utils/haptics';

type ComposerMode = 'live' | 'plan' | 'memory';

const MODE_CONFIG: Record<ComposerMode, { 
  title: string; 
  icon: string; 
  color: string; 
  description: string;
  buttonText: string;
}> = {
  live: {
    title: 'Live Now',
    icon: 'flash',
    color: Colors.success,
    description: 'Post a route you\'re about to take. Riders can join you!',
    buttonText: 'Post Route',
  },
  plan: {
    title: 'Plan Trip',
    icon: 'calendar',
    color: Colors.info,
    description: 'Plan a future journey. Find co-travelers ahead of time.',
    buttonText: 'Post Plan',
  },
  memory: {
    title: 'Share Memory',
    icon: 'camera',
    color: Colors.accent,
    description: 'Share a journey story. Inspire the community!',
    buttonText: 'Share Memory',
  },
};

export default function ComposerScreen() {
  const router = useRouter();
  const { user, userRole } = useCampusStore();
  
  // Mode state
  const [mode, setMode] = useState<ComposerMode>('live');
  
  // Common fields
  const [fromName, setFromName] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toName, setToName] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [note, setNote] = useState('');
  
  // Live-specific
  const [seats, setSeats] = useState('3');
  const [timeWindow, setTimeWindow] = useState('15');
  
  // Plan-specific
  const [plannedDate, setPlannedDate] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState('1');
  
  // Memory-specific
  const [story, setStory] = useState('');
  const [tags, setTags] = useState('');
  
  const [creating, setCreating] = useState(false);

  // Mock coordinates helper
  const getMockCoords = () => {
    const fromLat = 28.6901 + (Math.random() - 0.5) * 0.1;
    const fromLng = 77.2197 + (Math.random() - 0.5) * 0.1;
    const toLat = 28.6139 + (Math.random() - 0.5) * 0.1;
    const toLng = 77.2090 + (Math.random() - 0.5) * 0.1;
    const distance = Math.sqrt(
      Math.pow(toLat - fromLat, 2) + Math.pow(toLng - fromLng, 2)
    ) * 111;
    return { fromLat, fromLng, toLat, toLng, distance: Math.round(distance * 10) / 10 };
  };

  const handleCreate = async () => {
    if (!fromName || !toName || !user) {
      Alert.alert('Missing Info', 'Please fill From and To locations');
      return;
    }

    setCreating(true);
    try {
      const coords = getMockCoords();

      if (mode === 'live') {
        // Create live route post (pilot only)
        const routeData = {
          pilot_id: user.id,
          pilot_name: user.name,
          pilot_college: user.college,
          from_point: {
            lat: coords.fromLat,
            lng: coords.fromLng,
            address: fromAddress || fromName,
            name: fromName,
          },
          to_point: {
            lat: coords.toLat,
            lng: coords.toLng,
            address: toAddress || toName,
            name: toName,
          },
          departure_time: new Date(Date.now() + parseInt(timeWindow) * 60000).toISOString(),
          time_window_mins: parseInt(timeWindow),
          seats_available: parseInt(seats),
          distance_km: coords.distance,
          duration_mins: Math.round(coords.distance * 2),
          note: note || undefined,
        };
        await campusRouteAPI.create(routeData);
        Alert.alert('Route Posted! 🚗', 'Riders can now find and join your route.');
        
      } else if (mode === 'plan') {
        // Create planned trip
        const tripData = {
          user_id: user.id,
          user_name: user.name,
          user_college: user.college,
          from_point: {
            lat: coords.fromLat,
            lng: coords.fromLng,
            address: fromAddress || fromName,
            name: fromName,
          },
          to_point: {
            lat: coords.toLat,
            lng: coords.toLng,
            address: toAddress || toName,
            name: toName,
          },
          planned_date: plannedDate || new Date(Date.now() + 86400000).toISOString(), // Default: tomorrow
          seats_needed: parseInt(seatsNeeded),
          description: note || undefined,
        };
        await campusPlannedTripAPI.create(tripData);
        haptics.success();
        Alert.alert('Trip planned! 📅', 'Others heading the same way can find you now.');
        
      } else if (mode === 'memory') {
        // Create memory post
        const memoryData = {
          user_id: user.id,
          user_name: user.name,
          user_college: user.college,
          from_point: {
            lat: coords.fromLat,
            lng: coords.fromLng,
            address: fromAddress || fromName,
            name: fromName,
          },
          to_point: {
            lat: coords.toLat,
            lng: coords.toLng,
            address: toAddress || toName,
            name: toName,
          },
          story: story || note || 'A great journey!',
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          distance_km: coords.distance,
        };
        await campusMemoryAPI.create(memoryData);
        haptics.celebrate();
        Alert.alert('Memory shared! ✨', 'Your story is now inspiring the community.');
      }

      router.back();
    } catch (error: any) {
      haptics.error();
      console.error('Error creating post:', error);
      Alert.alert('Oops', error.response?.data?.detail || 'Couldn\'t post that. Give it another shot?');
    } finally {
      setCreating(false);
    }
  };

  const modeConfig = MODE_CONFIG[mode];
  const canSubmit = fromName && toName && !creating;

  // Additional validation for live mode (pilot only)
  const showPilotWarning = mode === 'live' && userRole === 'rider';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journey Composer</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        {(['live', 'plan', 'memory'] as ComposerMode[]).map((m) => {
          const config = MODE_CONFIG[m];
          const isActive = mode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeTab, isActive && { borderBottomColor: config.color }]}
              onPress={() => setMode(m)}
            >
              <Ionicons 
                name={config.icon as any} 
                size={20} 
                color={isActive ? config.color : Colors.textMuted} 
              />
              <Text style={[styles.modeTabText, isActive && { color: config.color }]}>
                {config.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mode Description */}
        <View style={[styles.modeDescription, { borderLeftColor: modeConfig.color }]}>
          <Ionicons name={modeConfig.icon as any} size={20} color={modeConfig.color} />
          <Text style={styles.modeDescriptionText}>{modeConfig.description}</Text>
        </View>

        {/* Pilot Warning for Live mode */}
        {showPilotWarning && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.warningText}>
              Switch to Pilot mode to post live routes. You're currently in Rider mode.
            </Text>
          </View>
        )}

        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {mode === 'memory' ? 'Journey Path' : 'Route Details'}
          </Text>
          <View style={styles.routeCard}>
            {/* From */}
            <View style={styles.routePointContainer}>
              <View style={styles.routePointHeader}>
                <View style={[styles.pointDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.pointLabel}>FROM</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder={mode === 'memory' ? 'Starting point of journey' : 'Starting location'}
                placeholderTextColor={Colors.textMuted}
                value={fromName}
                onChangeText={setFromName}
              />
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Address (optional)"
                placeholderTextColor={Colors.textMuted}
                value={fromAddress}
                onChangeText={setFromAddress}
              />
            </View>

            <View style={styles.routeArrow}>
              <Ionicons name="arrow-down" size={24} color={Colors.textMuted} />
            </View>

            {/* To */}
            <View style={styles.routePointContainer}>
              <View style={styles.routePointHeader}>
                <View style={[styles.pointDot, { backgroundColor: modeConfig.color }]} />
                <Text style={styles.pointLabel}>TO</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder={mode === 'memory' ? 'Destination reached' : 'Destination'}
                placeholderTextColor={Colors.textMuted}
                value={toName}
                onChangeText={setToName}
              />
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Address (optional)"
                placeholderTextColor={Colors.textMuted}
                value={toAddress}
                onChangeText={setToAddress}
              />
            </View>
          </View>
        </View>

        {/* Mode-specific options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {mode === 'live' ? 'Ride Options' : mode === 'plan' ? 'Trip Details' : 'Story Details'}
          </Text>
          <View style={styles.optionsCard}>
            
            {/* LIVE MODE OPTIONS */}
            {mode === 'live' && (
              <>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Available Seats</Text>
                  <View style={styles.optionButtons}>
                    {['1', '2', '3', '4'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.optionButton, seats === s && styles.optionButtonActive]}
                        onPress={() => setSeats(s)}
                      >
                        <Text style={[styles.optionButtonText, seats === s && styles.optionButtonTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Leaving in</Text>
                  <View style={styles.optionButtons}>
                    {['5', '10', '15', '30'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.optionButton, timeWindow === t && styles.optionButtonActive]}
                        onPress={() => setTimeWindow(t)}
                      >
                        <Text style={[styles.optionButtonText, timeWindow === t && styles.optionButtonTextActive]}>
                          {t}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* PLAN MODE OPTIONS */}
            {mode === 'plan' && (
              <>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>When are you planning to travel?</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Tomorrow morning, Next Saturday"
                    placeholderTextColor={Colors.textMuted}
                    value={plannedDate}
                    onChangeText={setPlannedDate}
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Travelers needed</Text>
                  <View style={styles.optionButtons}>
                    {['1', '2', '3', '4+'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.optionButton, seatsNeeded === s && styles.optionButtonActive]}
                        onPress={() => setSeatsNeeded(s.replace('+', ''))}
                      >
                        <Text style={[styles.optionButtonText, seatsNeeded === s.replace('+', '') && styles.optionButtonTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* MEMORY MODE OPTIONS */}
            {mode === 'memory' && (
              <>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Your Story</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Share what made this journey special..."
                    placeholderTextColor={Colors.textMuted}
                    value={story}
                    onChangeText={setStory}
                    multiline
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Tags (comma separated)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., roadtrip, mountains, friends"
                    placeholderTextColor={Colors.textMuted}
                    value={tags}
                    onChangeText={setTags}
                  />
                </View>
              </>
            )}

            {/* Common note field (for live & plan) */}
            {mode !== 'memory' && (
              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Note (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={mode === 'live' ? 'Add a friendly message for riders...' : 'Describe your trip plans...'}
                  placeholderTextColor={Colors.textMuted}
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton, 
            { backgroundColor: modeConfig.color },
            (!canSubmit || showPilotWarning) && styles.createButtonDisabled
          ]}
          onPress={handleCreate}
          disabled={!canSubmit || showPilotWarning}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name={modeConfig.icon as any} size={20} color={Colors.white} />
              <Text style={styles.createButtonText}>{modeConfig.buttonText}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  modeTabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  modeDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modeDescriptionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '20',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.warning,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  routePointContainer: {
    marginBottom: Spacing.md,
  },
  routePointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pointLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  inputSmall: {
    marginTop: Spacing.xs,
    fontSize: FontSizes.sm,
    paddingVertical: Spacing.sm,
  },
  routeArrow: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  optionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  optionRow: {
    marginBottom: Spacing.lg,
  },
  optionLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  createButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});
