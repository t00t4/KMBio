import React from 'react';
import { User, Vehicle, Trip, RealTimeData, UserPreferences, NotificationSettings } from './entities';
import { BLEConnectionState, BLEDevice } from './ble';

// Application-wide state interfaces
export interface AppState {
  auth: AuthState;
  ble: BLEState;
  trip: TripState;
  settings: SettingsState;
  ui: UIState;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: any | null;
  onboardingCompleted: boolean;
  error: string | null;
}

export interface BLEState extends BLEConnectionState {
  pairedDevices: BLEDevice[];
  currentDevice: BLEDevice | null;
  isInitialized: boolean;
  permissionsGranted: boolean;
  bluetoothEnabled: boolean;
}

export interface TripState {
  currentTrip: Trip | null;
  isActive: boolean;
  isPaused: boolean;
  realTimeData: RealTimeData | null;
  dataCollectionFrequency: number; // Hz
  lastDataUpdate: Date | null;
  alerts: TripAlert[];
  statistics: TripStatistics;
}

export interface TripAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  autoHide?: boolean;
  duration?: number; // milliseconds
}

export interface TripStatistics {
  sessionDistance: number;
  sessionDuration: number;
  averageSpeed: number;
  averageConsumption: number;
  fuelUsed: number;
  co2Emitted: number;
  eventsCount: Record<string, number>;
}

export interface SettingsState {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  preferences: UserPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  app: AppSettings;
}

export interface PrivacySettings {
  telemetryEnabled: boolean;
  crashReportingEnabled: boolean;
  analyticsEnabled: boolean;
  locationTrackingEnabled: boolean;
  dataRetentionDays: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US';
  units: {
    fuel: 'L/100km' | 'km/L';
    distance: 'km' | 'miles';
    temperature: 'celsius' | 'fahrenheit';
  };
  dataCollection: {
    frequency: number; // Hz
    backgroundFrequency: number; // Hz
    autoStart: boolean;
    autoStop: boolean;
  };
}

export interface UIState {
  isLoading: boolean;
  activeScreen: string;
  modals: {
    [key: string]: boolean;
  };
  notifications: UINotification[];
  theme: 'light' | 'dark';
  orientation: 'portrait' | 'landscape';
}

export interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isVisible: boolean;
  autoHide: boolean;
  duration?: number;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Pairing: undefined;
  TripActive: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Reports: undefined;
  Tips: undefined;
  History: undefined;
  Profile: undefined;
};

// Screen props types
export interface ScreenProps<T = any> {
  navigation: any;
  route: {
    params?: T;
  };
}

// Common component props
export interface BaseComponentProps {
  testID?: string;
  style?: any;
  children?: React.ReactNode;
}