import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './RootNavigator';
import { useAuthStore } from '../stores/auth';

// Deep linking configuration
const linking = {
  prefixes: ['kmbio://', 'https://kmbio.app'],
  config: {
    screens: {
      Auth: 'auth',
      Main: 'main',
      Pairing: 'pairing',
      TripDetails: 'trip/:tripId',
    },
  },
};

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
    notification: '#4CAF50',
  },
};

export default function AppNavigationContainer(): React.JSX.Element {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state when app starts
    initialize();
  }, [initialize]);

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer 
        theme={theme}
        linking={linking}
        fallback={<></>} // TODO: Replace with proper loading component
      >
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}