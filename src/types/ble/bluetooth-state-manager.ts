export interface BluetoothStateManager {
  getCurrentState(): BluetoothSystemState;
  startMonitoring(): void;
  stopMonitoring(): void;
  onStateChange(callback: (state: BluetoothSystemState) => void): void;
  validateState(): Promise<BluetoothValidationResult>;
}

export interface BluetoothSystemState {
  isEnabled: boolean;
  isSupported: boolean;
  hasPermissions: boolean;
  powerState: BluetoothPowerState;
  lastChecked: Date;
  isStable: boolean;
}

export type BluetoothPowerState = 
  | 'PoweredOn' 
  | 'PoweredOff' 
  | 'Resetting' 
  | 'Unauthorized' 
  | 'Unsupported' 
  | 'Unknown';

export interface BluetoothValidationResult {
  isValid: boolean;
  issues: BluetoothValidationIssue[];
  recommendations: string[];
  lastValidated: Date;
}

export interface BluetoothValidationIssue {
  type: BluetoothValidationIssueType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  technicalDetails: string;
  recoverable: boolean;
  recoverySteps: string[];
}

export type BluetoothValidationIssueType =
  | 'BLUETOOTH_DISABLED'
  | 'PERMISSIONS_MISSING'
  | 'BLE_NOT_SUPPORTED'
  | 'STATE_UNSTABLE'
  | 'MANAGER_NOT_INITIALIZED'
  | 'UNKNOWN_STATE';

export interface BluetoothStateChangeEvent {
  timestamp: Date;
  previousState: BluetoothSystemState;
  newState: BluetoothSystemState;
  trigger: string;
  isStabilityChange: boolean;
}

export interface BluetoothStateMonitoringConfig {
  stabilityCheckInterval: number; // milliseconds
  stabilityRequiredDuration: number; // milliseconds
  maxStateHistorySize: number;
  enableDetailedLogging: boolean;
}