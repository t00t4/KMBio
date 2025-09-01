export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  consentGiven: boolean;
  telemetryEnabled: boolean;
}

export interface UserPreferences {
  fuelUnit: 'L/100km' | 'km/L';
  language: 'pt-BR' | 'en-US';
  notifications: NotificationSettings;
  theme?: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  realTimeAlerts: boolean;
  weeklyReports: boolean;
  tips: boolean;
  maintenance: boolean;
  sound: boolean;
  vibration: boolean;
}