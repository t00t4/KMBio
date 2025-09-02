export interface BluetoothPermissionHandler {
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionRequestResult>;
  openPermissionSettings(): void;
  getRequiredPermissions(): BluetoothPermission[];
  shouldShowRationale(): Promise<boolean>;
  handlePermissionDenied(permission: BluetoothPermission): Promise<PermissionRecoveryAction>;
}

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  neverAskAgain: boolean;
  missingPermissions: BluetoothPermission[];
  grantedPermissions: BluetoothPermission[];
  partiallyGranted: boolean;
}

export interface PermissionRequestResult {
  success: boolean;
  granted: boolean;
  deniedPermissions: BluetoothPermission[];
  grantedPermissions: BluetoothPermission[];
  neverAskAgainPermissions: BluetoothPermission[];
  shouldShowRationale: boolean;
  error?: PermissionError;
}

export interface BluetoothPermission {
  name: string;
  androidPermission?: string;
  iosPermission?: string;
  required: boolean;
  description: string;
  rationale: string;
  minAndroidVersion?: number;
  minIOSVersion?: string;
}

export interface PermissionError {
  code: PermissionErrorCode;
  message: string;
  technicalDetails: string;
  recoverable: boolean;
  recoveryActions: PermissionRecoveryAction[];
}

export type PermissionErrorCode =
  | 'PERMISSION_REQUEST_FAILED'
  | 'PERMISSION_CHECK_FAILED'
  | 'PLATFORM_NOT_SUPPORTED'
  | 'SYSTEM_ERROR'
  | 'TIMEOUT_ERROR';

export interface PermissionRecoveryAction {
  type: PermissionRecoveryActionType;
  title: string;
  description: string;
  action: () => void | Promise<void>;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type PermissionRecoveryActionType =
  | 'RETRY_REQUEST'
  | 'OPEN_SETTINGS'
  | 'SHOW_RATIONALE'
  | 'CONTACT_SUPPORT'
  | 'USE_LIMITED_MODE';

export interface PermissionRationaleConfig {
  title: string;
  message: string;
  positiveButton: string;
  negativeButton: string;
  showOnlyOnce?: boolean;
}

export interface PermissionFlowConfig {
  showRationaleBeforeRequest: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  autoOpenSettings: boolean;
  enableDetailedLogging: boolean;
}

// Platform-specific permission mappings
export const BLUETOOTH_PERMISSIONS: Record<string, BluetoothPermission> = {
  BLUETOOTH_SCAN: {
    name: 'BLUETOOTH_SCAN',
    androidPermission: 'android.permission.BLUETOOTH_SCAN',
    required: true,
    description: 'Permite escanear dispositivos Bluetooth próximos',
    rationale: 'Necessário para encontrar seu dispositivo OBD-II',
    minAndroidVersion: 31
  },
  BLUETOOTH_CONNECT: {
    name: 'BLUETOOTH_CONNECT',
    androidPermission: 'android.permission.BLUETOOTH_CONNECT',
    required: true,
    description: 'Permite conectar com dispositivos Bluetooth',
    rationale: 'Necessário para conectar com seu dispositivo OBD-II',
    minAndroidVersion: 31
  },
  BLUETOOTH_LEGACY: {
    name: 'BLUETOOTH_LEGACY',
    androidPermission: 'android.permission.BLUETOOTH',
    required: true,
    description: 'Permite usar funcionalidades Bluetooth (versões antigas do Android)',
    rationale: 'Necessário para usar Bluetooth em seu dispositivo',
    minAndroidVersion: 1
  },
  BLUETOOTH_ADMIN_LEGACY: {
    name: 'BLUETOOTH_ADMIN_LEGACY',
    androidPermission: 'android.permission.BLUETOOTH_ADMIN',
    required: true,
    description: 'Permite gerenciar configurações Bluetooth (versões antigas do Android)',
    rationale: 'Necessário para gerenciar conexões Bluetooth',
    minAndroidVersion: 1
  },
  ACCESS_FINE_LOCATION: {
    name: 'ACCESS_FINE_LOCATION',
    androidPermission: 'android.permission.ACCESS_FINE_LOCATION',
    required: true,
    description: 'Permite acesso à localização precisa',
    rationale: 'Necessário para escanear dispositivos Bluetooth (requerimento do Android)',
    minAndroidVersion: 23
  }
};