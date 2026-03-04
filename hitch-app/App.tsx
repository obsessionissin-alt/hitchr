// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Components
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Context Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { UserProvider } from './src/contexts/UserContext';
import { SocketProvider } from './src/contexts/SocketContext';
import { RideProvider } from './src/contexts/RideContext';
import { MapProvider } from './src/contexts/MapContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <SocketProvider>
              <RideProvider>
                <MapProvider>
                  <NavigationContainer>
                    <AppNavigator />
                    <StatusBar style="auto" />
                  </NavigationContainer>
                </MapProvider>
              </RideProvider>
            </SocketProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
