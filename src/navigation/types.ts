import type { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Pairing: undefined;
  TripDetails: { tripId: string };
};

// Auth Stack Navigator Types
export type AuthStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingFeatures: undefined;
  OnboardingPrivacy: undefined;
  OnboardingPreferences: {
    consentGiven: boolean;
    telemetryEnabled: boolean;
  };
  Onboarding: undefined; // Keep for backward compatibility
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator Types
export type MainTabParamList = {
  Dashboard: undefined;
  Reports: NavigatorScreenParams<ReportsStackParamList>;
  Tips: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// Reports Stack Navigator Types
export type ReportsStackParamList = {
  ReportsList: undefined;
  WeeklyReport: { weekStart: string };
  TripHistory: undefined;
  TripDetail: { tripId: string };
};

// Settings Stack Navigator Types
export type SettingsStackParamList = {
  SettingsMain: undefined;
  VehicleManagement: undefined;
  AddVehicle: undefined;
  EditVehicle: { vehicleId: string };
  Privacy: undefined;
  Preferences: undefined;
  About: undefined;
};

// Navigation prop types for screens - simplified for now
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: any;
  route: { params: RootStackParamList[T] };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = {
  navigation: any;
  route: { params: AuthStackParamList[T] };
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  navigation: any;
  route: { params: MainTabParamList[T] };
};

export type ReportsStackScreenProps<T extends keyof ReportsStackParamList> = {
  navigation: any;
  route: { params: ReportsStackParamList[T] };
};

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> = {
  navigation: any;
  route: { params: SettingsStackParamList[T] };
};