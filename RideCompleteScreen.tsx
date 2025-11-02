// src/screens/RideCompleteScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RideCompleteScreen({ route, navigation }: any) {
  const {
    rideId,
    pilotName = 'Pilot',
    distance = 2.5,
    duration = 8,
    tokensEarned = 15,
  } = route.params || {};

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tags = ['Safe', 'Friendly', 'Punctual', 'Clean Car', 'Good Music'];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDone = () => {
    navigation.navigate('MainTabs', { screen: 'Map' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Icon */}
      <View style={styles.successIcon}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={48} color="#10B981" />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Trip Complete!</Text>
      <Text style={styles.subtitle}>
        {distance} km • {duration} mins
      </Text>

      {/* Token Reward */}
      <View style={styles.tokenCard}>
        <View style={styles.tokenIcon}>
          <Ionicons name="wallet" size={28} color="#F59E0B" />
        </View>
        <Text style={styles.tokenAmount}>+{tokensEarned}</Text>
        <Text style={styles.tokenLabel}>Tokens Earned</Text>
        <Text style={styles.tokenBonus}>+5 distance bonus included</Text>
      </View>

      {/* New Plate (Demo) */}
      <View style={styles.plateCard}>
        <View style={styles.plateContainer}>
          <View style={styles.plateBox}>
            <Text style={styles.plateCode}>KA-01</Text>
          </View>
          <View style={styles.plateInfo}>
            <Text style={styles.plateTitle}>New Plate!</Text>
            <Text style={styles.plateLocation}>Bangalore East</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.collectButton}>
          <Text style={styles.collectButtonText}>Collect</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Section */}
      <View style={styles.ratingCard}>
        <Text style={styles.ratingTitle}>Rate {pilotName}</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#FBBF24' : '#CBD5E1'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags */}
        <View style={styles.tags}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                selectedTags.includes(tag) && styles.tagSelected,
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.tagTextSelected,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.shareButton}>
        <Ionicons name="share-social" size={20} color="#FFFFFF" />
        <Text style={styles.shareButtonText}>📖 Share Your Story</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  successIcon: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  tokenCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tokenIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  tokenBonus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  plateCard: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  plateBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  plateCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  plateInfo: {
    flex: 1,
  },
  plateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  plateLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  collectButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  collectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tagText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  shareButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});