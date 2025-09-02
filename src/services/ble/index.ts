// Export BLE Manager
export { BLEManager } from './BLEManager';

// Export Bluetooth Initializer
export { BluetoothInitializer } from './BluetoothInitializer';

// Export Bluetooth State Manager
export { BluetoothStateManager } from './BluetoothStateManager';

// Export Bluetooth Error Handler
export { BluetoothErrorHandler } from './BluetoothErrorHandler';

// Export Bluetooth Permission Handler
export { BluetoothPermissionHandler } from './BluetoothPermissionHandler';

// Export Bluetooth Diagnostics
export { BluetoothDiagnostics } from './BluetoothDiagnostics';

// Export BLE service interface
export type { BLEServiceInterface } from '../../types/ble';

// Re-export BLE types for convenience
export type {
  BLEDevice,
  BLEConnectionState,
  BLEError,
  BLEConfiguration
} from '../../types/ble';