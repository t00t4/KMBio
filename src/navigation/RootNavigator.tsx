import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';

// Import navigators and screens
import AuthStackNavigator from './AuthStackNavigator';
import MainTabNavigator from './MainTabNavigator';
import PairingScreen from '../screens/pairing/PairingScreen';
import TripDetailsScreen from '../screens/dashboard/TripDetailsScreen';

// Import auth store to check authentication state
import { useAuthStore } from '../stores/auth';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading screen while checking auth state
  if (isLoading) {
    // TODO: Replace with proper loading component
    return <></>;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {!isAuthenticated ? (
        // Auth flow - user is not authenticated
        <Stack.Screen 
          name="Auth" 
          component={AuthStackNavigator}
          options={{
            animationTypeForReplace: 'pop',
          }}
        />
      ) : (
        // Main app flow - user is authenticated
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator}
          />
          <Stack.Screen 
            name="Pairing" 
            component={PairingScreen}
            options={{
              title: 'Conectar OBD-II',
              headerShown: true,
              headerStyle: {
                backgroundColor: '#2E7D32',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="TripDetails" 
            component={TripDetailsScreen}
            options={{
              title: 'Detalhes da Viagem',
              headerShown: true,
              headerStyle: {
                backgroundColor: '#2E7D32',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}