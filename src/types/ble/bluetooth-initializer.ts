export interface BluetoothInitializer {
  initialize(): Promise<BluetoothInitializationResult>;
  retry(): Promise<BluetoothInitializationResult>;
  getInitializationStatus(): BluetoothInitializationStatus;
  onInitializationComplete(callback: (result: BluetoothInitializationResult) => void): void;
}

export interface BluetoothInitializationResult {
  success: boolean;
  error?: BluetoothInitializationError;
  capabilities: BluetoothCapabilities;
  recommendations: string[];
}

export interface BluetoothCapabilities {
  bleSupported: boolean;
  permissionsGranted: boolean;
  bluetoothEnabled: boolean;
  canScan: boolean;
  canConnect: boolean;
}

export interface BluetoothInitializationError {
  code: BluetoothErrorCode;
  message: string;
  technicalDetails: string;
  timestamp: Date;
  recoverable: boolean;
  recoverySteps: string[];
  diagnosticInfo: BluetoothDiagnosticInfo;
}

export type BluetoothErrorCode = 
  | 'BLUETOOTH_NOT_SUPPORTED'
  | 'BLUETOOTH_DISABLED'
  | 'PERMISSIONS_DENIED'
  | 'PERMISSIONS_NEVER_ASK_AGAIN'
  | 'BLE_MANAGER_INIT_FAILED'
  | 'STATE_MONITORING_FAILED'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface BluetoothDiagnosticInfo {
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  bleLibraryVersion: string;
  initializationAttempts: number;
  lastSuccessfulInit?: Date;
  stateHistory: BluetoothStateChange[];
  permissionHistory: PermissionChange[];
}

export interface BluetoothStateChange {
  timestamp: Date;
  previousState: string;
  newState: string;
  trigger: string;
}

export interface PermissionChange {
  timestamp: Date;
  permission: string;
  previousStatus: string;
  newStatus: string;
}

export type BluetoothInitializationStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED_SUCCESS'
  | 'COMPLETED_ERROR'
  | 'RETRYING';