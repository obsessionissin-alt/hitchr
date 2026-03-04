// src/screens/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Types
import { theme } from '../constants/theme';

export default function SettingsScreen() {
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Location Services</Text>
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#e2e8f0', true: theme.colors.success }}
                thumbColor="#fff"
              />
            </View>
          </View>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#e2e8f0', true: theme.colors.success }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Safety Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SAFETY</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Emergency Contacts</Text>
                <Text style={styles.settingSubtitle}>Add trusted contacts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>SOS Settings</Text>
                <Text style={styles.settingSubtitle}>Configure emergency alerts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>
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
  section: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  versionText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
});



















