export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number;
  isConnectable: boolean;
  serviceUUIDs?: string[];
  manufacturerData?: string;
  localName?: string;
}

export interface BLEService {
  uuid: string;
  isPrimary: boolean;
  characteristics: BLECharacteristic[];
}

export interface BLECharacteristic {
  uuid: string;
  isReadable: boolean;
  isWritableWithoutResponse: boolean;
  isWritableWithResponse: boolean;
  isNotifiable: boolean;
  isIndicatable: boolean;
  value?: string;
}

export interface BLEConnectionState {
  isScanning: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  connectedDevice?: BLEDevice;
  availableDevices: BLEDevice[];
  lastError?: BLEError;
  connectionAttempts: number;
  lastConnectionTime?: Date;
  signalStrength?: number;
}

export interface BLEError {
  code: BLEErrorCode;
  message: string;
  timestamp: Date;
  deviceId?: string;
  context?: any;
}

export type BLEErrorCode = 
  | 'BLUETOOTH_DISABLED'
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'SERVICE_NOT_FOUND'
  | 'CHARACTERISTIC_NOT_FOUND'
  | 'READ_FAILED'
  | 'WRITE_FAILED'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface BLEConfiguration {
  scanTimeoutMs: number;
  connectionTimeoutMs: number;
  maxReconnectAttempts: number;
  reconnectDelayMs: number[];
  serviceUUID?: string;
  characteristicUUID?: string;
  enableAutoReconnect: boolean;
}