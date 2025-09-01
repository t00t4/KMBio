// App configuration constants
export const APP_CONFIG = {
  // BLE Configuration
  BLE_SCAN_TIMEOUT: parseInt(
    process.env.EXPO_PUBLIC_BLE_SCAN_TIMEOUT || '10000'
  ), // 10 seconds
  BLE_CONNECTION_TIMEOUT: parseInt(
    process.env.EXPO_PUBLIC_BLE_CONNECTION_TIMEOUT || '5000'
  ), // 5 seconds
  BLE_RECONNECT_ATTEMPTS: parseInt(
    process.env.EXPO_PUBLIC_BLE_RECONNECT_ATTEMPTS || '3'
  ),
  BLE_RECONNECT_DELAYS: [1000, 3000, 10000], // milliseconds
  
  // OBD Data Collection
  OBD_DATA_FREQUENCY_FOREGROUND: parseInt(
    process.env.EXPO_PUBLIC_OBD_DATA_FREQUENCY_FG || '1000'
  ), // 1 Hz (1000ms)
  OBD_DATA_FREQUENCY_BACKGROUND: parseInt(
    process.env.EXPO_PUBLIC_OBD_DATA_FREQUENCY_BG || '2000'
  ), // 0.5 Hz (2000ms)
  OBD_COMMAND_TIMEOUT: parseInt(
    process.env.EXPO_PUBLIC_OBD_COMMAND_TIMEOUT || '2000'
  ), // 2 seconds
  
  // Data Storage
  MAX_OFFLINE_TRIPS: parseInt(
    process.env.EXPO_PUBLIC_MAX_OFFLINE_TRIPS || '30'
  ),
  MAX_LOG_FILE_SIZE: parseInt(
    process.env.EXPO_PUBLIC_MAX_LOG_SIZE || '2097152'
  ), // 2MB
  DATA_RETENTION_DAYS: parseInt(
    process.env.EXPO_PUBLIC_DATA_RETENTION_DAYS || '90'
  ),
  
  // Performance
  BATTERY_OPTIMIZATION_THRESHOLD: parseInt(
    process.env.EXPO_PUBLIC_BATTERY_THRESHOLD || '20'
  ), // %
  MEMORY_WARNING_THRESHOLD: parseInt(
    process.env.EXPO_PUBLIC_MEMORY_THRESHOLD || '85'
  ), // %
  
  // API Configuration
  API_TIMEOUT: parseInt(
    process.env.EXPO_PUBLIC_API_TIMEOUT || '10000'
  ), // 10 seconds
  SYNC_RETRY_ATTEMPTS: parseInt(
    process.env.EXPO_PUBLIC_SYNC_RETRY_ATTEMPTS || '3'
  ),
  SYNC_BATCH_SIZE: parseInt(
    process.env.EXPO_PUBLIC_SYNC_BATCH_SIZE || '50'
  ),
} as const;

// Application metadata
export const APP_METADATA = {
  NAME: 'KMBio',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  SUPPORTED_ANDROID_VERSION: 26, // Android 8.0+
  MIN_BLUETOOTH_VERSION: '4.0',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_CRASH_REPORTING: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG_LOGGING: process.env.EXPO_PUBLIC_ENABLE_DEBUG_LOGGING === 'true',
  ENABLE_MOCK_BLE: process.env.EXPO_PUBLIC_ENABLE_MOCK_BLE === 'true',
  ENABLE_OFFLINE_MODE: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE !== 'false',
} as const;

// BLE Service UUIDs (for ELM327 compatibility)
export const BLE_SERVICES = {
  // Standard Serial Port Profile UUID
  SPP_SERVICE_UUID: '00001101-0000-1000-8000-00805F9B34FB',
  
  // Common ELM327 service UUIDs
  ELM327_SERVICE_UUID: 'FFE0',
  ELM327_CHARACTERISTIC_UUID: 'FFE1',
  
  // Alternative UUIDs for different ELM327 variants
  ALTERNATIVE_SERVICE_UUIDS: [
    '0000FFE0-0000-1000-8000-00805F9B34FB',
    '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', // Nordic UART
  ],
} as const;

// Default user preferences
export const DEFAULT_PREFERENCES = {
  fuelUnit: 'L/100km' as const,
  language: 'pt-BR' as const,
  theme: 'system' as const,
  notifications: {
    realTimeAlerts: true,
    weeklyReports: true,
    tips: true,
    maintenance: true,
    sound: true,
    vibration: true,
  },
  dataCollection: {
    frequency: 1, // Hz
    backgroundFrequency: 0.5, // Hz
    autoStart: true,
    autoStop: true,
  },
} as const;
