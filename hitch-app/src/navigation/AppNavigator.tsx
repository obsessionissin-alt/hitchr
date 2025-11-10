// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Screens
import AuthScreen from '../screens/AuthScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PilotProfileModal from '../screens/PilotProfileModal';
import RidePendingScreen from '../screens/RidePendingScreen';
import RideActiveScreen from '../screens/RideActiveScreen';
import RideCompleteScreen from '../screens/RideCompleteScreen';
import TokenWalletScreen from '../screens/TokenWalletScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.error}>
          <Text style={styles.errorText}>Navigation Error</Text>
          <Text style={styles.errorDetail}>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Loading Screen
const LoadingScreen = () => {
  console.log('🔄 LoadingScreen component rendering');
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#F59E0B" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

// Main tabs for authenticated users
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tokens"
        component={TokenWalletScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  console.log('📱 AppNavigator rendering - loading:', loading, 'user:', !!user);

  // Show loading screen while checking auth
  if (loading) {
    console.log('⏳ Showing loading screen');
    return <LoadingScreen />;
  }

  console.log('🎯 Rendering main navigation - authenticated:', !!user);

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              {console.log('🔐 Rendering Auth screen')}
              <Stack.Screen name="Auth" component={AuthScreen} />
            </>
          ) : (
            <>
              {console.log('✅ Rendering Main tabs')}
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen 
                name="PilotProfile" 
                component={PilotProfileModal}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen name="RidePending" component={RidePendingScreen} />
              <Stack.Screen name="RideActive" component={RideActiveScreen} />
              <Stack.Screen name="RideComplete" component={RideCompleteScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#991B1B',
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  placeholderText: {
    fontSize: 18,
    color: '#64748B',
  },
});