import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function RideCompleteScreen({ route, navigation }: any) {
  const { pilot } = route.params;
  const [rating, setRating] = React.useState(4);

  const handleComplete = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        
        <Text style={styles.title}>Trip Complete!</Text>
        <Text style={styles.subtitle}>8.5 km • 24 mins</Text>
        
        <View style={styles.tokenCard}>
          <View style={styles.tokenIconContainer}>
            <Text style={styles.tokenIcon}>🪙</Text>
          </View>
          <Text style={styles.tokenValue}>+15</Text>
          <Text style={styles.tokenLabel}>Tokens Earned</Text>
          <Text style={styles.bonusText}>+5 distance bonus included</Text>
        </View>
        
        <View style={styles.plateCard}>
          <View style={styles.plateLeft}>
            <View style={styles.plateBox}>
              <Text style={styles.plateCode}>KA-01</Text>
            </View>
            <View>
              <Text style={styles.plateTitle}>New Plate!</Text>
              <Text style={styles.plateCity}>Bangalore East</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.collectButton}>
            <Text style={styles.collectButtonText}>Collect</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Rate {pilot.name}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Text style={[
                  styles.star,
                  star <= rating && styles.starFilled
                ]}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tags}>
            <TouchableOpacity style={styles.tag}>
              <Text style={styles.tagText}>Safe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <Text style={styles.tagText}>Friendly</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <Text style={styles.tagText}>Punctual</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>📝 Share Your Story</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={handleComplete}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 48,
    color: '#10B981',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 25,
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tokenIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  tokenIcon: {
    fontSize: 28,
  },
  tokenValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 6,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  bonusText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '600',
  },
  plateCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  plateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plateBox: {
    width: 55,
    height: 35,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  plateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  plateCity: {
    fontSize: 12,
    color: '#64748B',
  },
  collectButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  collectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 32,
    opacity: 0.3,
  },
  starFilled: {
    opacity: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
});
