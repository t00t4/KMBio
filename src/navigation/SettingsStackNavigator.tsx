import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { SettingsStackParamList } from './types';

// Import screen components (placeholders for now)
import SettingsMainScreen from '../screens/settings/SettingsMainScreen';
import VehicleManagementScreen from '../screens/settings/VehicleManagementScreen';
import AddVehicleScreen from '../screens/settings/AddVehicleScreen';
import EditVehicleScreen from '../screens/settings/EditVehicleScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import PreferencesScreen from '../screens/settings/PreferencesScreen';
import AboutScreen from '../screens/settings/AboutScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="SettingsMain"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsMainScreen}
        options={{ title: 'Configurações' }}
      />
      <Stack.Screen 
        name="VehicleManagement" 
        component={VehicleManagementScreen}
        options={{ title: 'Gerenciar Veículos' }}
      />
      <Stack.Screen 
        name="AddVehicle" 
        component={AddVehicleScreen}
        options={{ title: 'Adicionar Veículo' }}
      />
      <Stack.Screen 
        name="EditVehicle" 
        component={EditVehicleScreen}
        options={{ title: 'Editar Veículo' }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{ title: 'Privacidade' }}
      />
      <Stack.Screen 
        name="Preferences" 
        component={PreferencesScreen}
        options={{ title: 'Preferências' }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ title: 'Sobre' }}
      />
    </Stack.Navigator>
  );
}