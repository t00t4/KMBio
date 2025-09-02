import { BluetoothErrorCode, BluetoothDiagnosticInfo } from './bluetooth-initializer';
import { BLEErrorCode } from './device';

export interface BluetoothErrorHandler {
  handleError(error: BluetoothError): BluetoothErrorResponse;
  canRecover(error: BluetoothError): boolean;
  attemptRecovery(error: BluetoothError): Promise<RecoveryResult>;
  getRecoveryInstructions(error: BluetoothError): RecoveryInstructions;
  getErrorStrategy(errorCode: BluetoothErrorCode | BLEErrorCode): ErrorHandlingStrategy;
}

export interface BluetoothError {
  code: BluetoothErrorCode | BLEErrorCode;
  message: string;
  technicalDetails?: string;
  timestamp: Date;
  context?: any;
  diagnosticInfo?: BluetoothDiagnosticInfo;
  retryCount?: number;
  originalError?: Error;
}

export interface BluetoothErrorResponse {
  userMessage: string;
  technicalMessage: string;
  recoveryOptions: RecoveryOption[];
  shouldRetry: boolean;
  retryDelay?: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
}

export interface RecoveryResult {
  success: boolean;
  error?: BluetoothError;
  message: string;
  nextAction?: RecoveryAction;
  retryAfter?: number;
}

export interface RecoveryInstructions {
  title: string;
  description: string;
  steps: RecoveryStep[];
  automaticRecovery: boolean;
  estimatedTime?: string;
  successIndicators: string[];
}

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: RecoveryAction;
  isAutomatic: boolean;
  priority: number;
}

export interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  isAutomatic: boolean;
  action?: RecoveryAction;
  expectedResult?: string;
}

export interface ErrorHandlingStrategy {
  userMessage: string;
  technicalMessage: string;
  action: RecoveryAction;
  autoRetry: boolean;
  retryInterval?: number;
  maxRetries?: number;
  showInstructions: boolean;
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoveryOptions: RecoveryOption[];
}

export type RecoveryAction = 
  | 'RETRY_INITIALIZATION'
  | 'REQUEST_PERMISSIONS'
  | 'OPEN_BLUETOOTH_SETTINGS'
  | 'OPEN_APP_SETTINGS'
  | 'RESTART_BLE_MANAGER'
  | 'SHOW_INSTRUCTIONS'
  | 'CONTACT_SUPPORT'
  | 'ENABLE_LIMITED_MODE'
  | 'WAIT_AND_RETRY'
  | 'MANUAL_INTERVENTION';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ErrorCategory = 
  | 'PERMISSIONS'
  | 'HARDWARE'
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'TEMPORARY'
  | 'PERMANENT'
  | 'USER_ACTION_REQUIRED';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorMetrics {
  errorCode: BluetoothErrorCode | BLEErrorCode;
  occurrenceCount: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  userActions: string[];
}