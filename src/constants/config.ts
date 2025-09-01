// App configuration constants
export const APP_CONFIG = {
  BLE_SCAN_TIMEOUT: parseInt(
    process.env.EXPO_PUBLIC_BLE_SCAN_TIMEOUT || '10000'
  ),
  BLE_CONNECTION_TIMEOUT: parseInt(
    process.env.EXPO_PUBLIC_BLE_CONNECTION_TIMEOUT || '5000'
  ),
  OBD_DATA_FREQUENCY: parseInt(
    process.env.EXPO_PUBLIC_OBD_DATA_COLLECTION_FREQUENCY || '1000'
  ),
  RECONNECT_ATTEMPTS: parseInt(
    process.env.EXPO_PUBLIC_OBD_RECONNECT_ATTEMPTS || '3'
  ),
} as const;
