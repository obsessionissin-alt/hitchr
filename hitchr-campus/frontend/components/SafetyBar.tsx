import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';

export default function SafetyBar() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => alert('Share Ride feature')}>
        <Ionicons name="share-outline" size={20} color={Colors.text} />
        <Text style={styles.buttonText}>Share</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => alert('SOS: Call campus security')}>
        <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
        <Text style={[styles.buttonText, { color: Colors.error }]}>SOS</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => alert('Report user')}>
        <Ionicons name="flag-outline" size={20} color={Colors.text} />
        <Text style={styles.buttonText}>Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  button: {
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    color: Colors.text,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});
