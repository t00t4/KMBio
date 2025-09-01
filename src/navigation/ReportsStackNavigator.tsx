import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ReportsStackParamList } from './types';

// Import screen components (placeholders for now)
import ReportsListScreen from '../screens/reports/ReportsListScreen';
import WeeklyReportScreen from '../screens/reports/WeeklyReportScreen';
import TripHistoryScreen from '../screens/reports/TripHistoryScreen';
import TripDetailScreen from '../screens/reports/TripDetailScreen';

const Stack = createStackNavigator<ReportsStackParamList>();

export default function ReportsStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="ReportsList"
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
        name="ReportsList" 
        component={ReportsListScreen}
        options={{ title: 'Relatórios' }}
      />
      <Stack.Screen 
        name="WeeklyReport" 
        component={WeeklyReportScreen}
        options={{ title: 'Relatório Semanal' }}
      />
      <Stack.Screen 
        name="TripHistory" 
        component={TripHistoryScreen}
        options={{ title: 'Histórico de Viagens' }}
      />
      <Stack.Screen 
        name="TripDetail" 
        component={TripDetailScreen}
        options={{ title: 'Detalhes da Viagem' }}
      />
    </Stack.Navigator>
  );
}