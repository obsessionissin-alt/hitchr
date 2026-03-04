// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Contexts
import { useAuth } from '../contexts/AuthContext';

// Screens
import AuthScreen from '../screens/AuthScreen';
import MapScreen from '../screens/MapScreen';
import ProfileModalScreen from '../screens/ProfileModalScreen';
import NotificationSentScreen from '../screens/NotificationSentScreen';
import OfferSentScreen from '../screens/OfferSentScreen';
import ProximityConfirmScreen from '../screens/ProximityConfirmScreen';
import RideLiveScreen from '../screens/RideLiveScreen';
import RideCompleteScreen from '../screens/RideCompleteScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Types
import type { UserMarker } from '../types/userMarker';

// Type definitions
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProfileModal: { person: UserMarker; type: 'pilot' | 'rider' };
  NotificationSent: { rideId: string; pilot: UserMarker };
  OfferSent: { rideId: string; rider: UserMarker };
  ProximityConfirm: { rideId: string };
  RideLive: { rideId: string };
  RideComplete: { rideId: string; tokensEarned: number; distance: number };
  EditProfile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  MapTab: undefined;
  ProfileTab: undefined;
  WalletTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'WalletTab') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletScreen}
        options={{ tabBarLabel: 'Wallet' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="ProfileModal"
            component={ProfileModalScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="NotificationSent"
            component={NotificationSentScreen}
            options={{ headerShown: true, headerTitle: 'Notification Sent' }}
          />
          <Stack.Screen
            name="OfferSent"
            component={OfferSentScreen}
            options={{ headerShown: true, headerTitle: 'Offer Sent' }}
          />
          <Stack.Screen
            name="ProximityConfirm"
            component={ProximityConfirmScreen}
            options={{ headerShown: true, headerTitle: 'Confirm Ride' }}
          />
          <Stack.Screen
            name="RideLive"
            component={RideLiveScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RideComplete"
            component={RideCompleteScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: true, headerTitle: 'Edit Profile' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, headerTitle: 'Settings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
