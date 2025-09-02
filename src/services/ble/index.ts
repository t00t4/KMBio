// Export BLE Manager
export { BLEManager } from './BLEManager';

// Export Bluetooth Initializer
export { BluetoothInitializer } from './BluetoothInitializer';

// Export Bluetooth State Manager
export { BluetoothStateManager } from './BluetoothStateManager';

// Export BLE service interface
export type { BLEServiceInterface } from '../../types/ble';

// Re-export BLE types for convenience
export type {
  BLEDevice,
  BLEConnectionState,
  BLEError,
  BLEConfiguration
} from '../../types/ble';