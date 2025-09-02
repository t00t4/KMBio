// BLE Device and connection types
export * from './device';

// OBD-II protocol and communication types
export * from './obd-protocol';

// Bluetooth Initializer types
export type {
  BluetoothInitializer as IBluetoothInitializer,
  BluetoothInitializationResult,
  BluetoothInitializationStatus,
  BluetoothCapabilities,
  BluetoothInitializationError,
  BluetoothErrorCode,
  BluetoothStateChange
} from './bluetooth-initializer';

// Bluetooth State Manager types
export type {
  BluetoothStateManager as IBluetoothStateManager,
  BluetoothSystemState,
  BluetoothValidationResult,
  BluetoothValidationIssue,
  BluetoothValidationIssueType,
  BluetoothStateChangeEvent,
  BluetoothStateMonitoringConfig,
  BluetoothPowerState
} from './bluetooth-state-manager';

// Bluetooth Permission Handler types
export type {
  BluetoothPermissionHandler as IBluetoothPermissionHandler,
  PermissionStatus,
  PermissionRequestResult,
  BluetoothPermission,
  PermissionError,
  PermissionErrorCode,
  PermissionRecoveryAction,
  PermissionRecoveryActionType,
  PermissionRationaleConfig,
  PermissionFlowConfig
} from './bluetooth-permission-handler';

export { BLUETOOTH_PERMISSIONS } from './bluetooth-permission-handler';

// Bluetooth Error Handler types
export type {
  BluetoothErrorHandler as IBluetoothErrorHandler,
  BluetoothError,
  BluetoothErrorResponse,
  RecoveryResult,
  RecoveryInstructions,
  RecoveryOption,
  RecoveryStep,
  ErrorHandlingStrategy,
  RecoveryAction,
  ErrorSeverity,
  ErrorCategory,
  RetryConfig,
  ErrorMetrics
} from './bluetooth-error-handler';

// Bluetooth Diagnostics types
export type {
  BluetoothDiagnostics as IBluetoothDiagnostics,
  BluetoothDiagnosticInfo,
  BluetoothDiagnosticReport,
  BluetoothDiagnosticConfig,
  DiagnosticLogEntry,
  DiagnosticSummary,
  PermissionChange,
  SystemInfo,
  PerformanceMetrics
} from './bluetooth-diagnostics';

// Re-export types for service interfaces
import { BLEDevice, BLEConnectionState, BLEError } from './device';
import { OBDResponse, OBDProtocol } from './obd-protocol';

// Service interfaces
export interface BLEServiceInterface {
  scanForDevices(timeoutMs?: number): Promise<BLEDevice[]>;
  connectToDevice(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionState(): BLEConnectionState;
  sendCommand(command: string): Promise<string>;
  startDataCollection(frequency: number): void;
  stopDataCollection(): void;
  onConnectionStateChange(callback: (state: BLEConnectionState) => void): void;
  onDataReceived(callback: (data: unknown) => void): void;
  onError(callback: (error: BLEError) => void): void;
  // New initialization methods
  retryInitialization(): Promise<import('./bluetooth-initializer').BluetoothInitializationResult>;
  getInitializationStatus(): import('./bluetooth-initializer').BluetoothInitializationStatus;
  getInitializationResult(): import('./bluetooth-initializer').BluetoothInitializationResult | null;
}

export interface OBDServiceInterface {
  initialize(): Promise<void>;
  getSupportedPIDs(): Promise<string[]>;
  readPID(pid: string): Promise<OBDResponse>;
  readMultiplePIDs(pids: string[]): Promise<OBDResponse[]>;
  validateConnection(): Promise<boolean>;
  getVehicleInfo(): Promise<any>;
  resetAdapter(): Promise<void>;
  setProtocol(protocol: OBDProtocol): Promise<void>;
}