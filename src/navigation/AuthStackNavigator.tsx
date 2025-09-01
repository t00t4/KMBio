import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AuthStackParamList } from './types';
import { useAuthStore } from '../stores/auth';

// Import screen components
import OnboardingWelcomeScreen from '../screens/auth/OnboardingWelcomeScreen';
import OnboardingFeaturesScreen from '../screens/auth/OnboardingFeaturesScreen';
import OnboardingPrivacyScreen from '../screens/auth/OnboardingPrivacyScreen';
import OnboardingPreferencesScreen from '../screens/auth/OnboardingPreferencesScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen'; // Keep for backward compatibility
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator(): React.JSX.Element {
  const { hasCompletedOnboarding } = useAuthStore();

  // Determine initial route based on onboarding status
  const getInitialRouteName = (): keyof AuthStackParamList => {
    if (!hasCompletedOnboarding) {
      return 'OnboardingWelcome';
    }
    return 'Login';
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      {/* New Onboarding Flow */}
      <Stack.Screen 
        name="OnboardingWelcome" 
        component={OnboardingWelcomeScreen}
        options={{ title: 'Bem-vindo ao KMBio' }}
      />
      <Stack.Screen 
        name="OnboardingFeatures" 
        component={OnboardingFeaturesScreen}
        options={{ title: 'Recursos' }}
      />
      <Stack.Screen 
        name="OnboardingPrivacy" 
        component={OnboardingPrivacyScreen}
        options={{ title: 'Privacidade' }}
      />
      <Stack.Screen 
        name="OnboardingPreferences" 
        component={OnboardingPreferencesScreen}
        options={{ title: 'Preferências' }}
      />
      
      {/* Legacy Onboarding (keep for backward compatibility) */}
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{ title: 'Bem-vindo ao KMBio' }}
      />
      
      {/* Auth Screens */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Entrar' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Criar Conta' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ title: 'Recuperar Senha' }}
      />
    </Stack.Navigator>
  );
}