import { BluetoothStateChangeEvent } from './bluetooth-state-manager';

export interface BluetoothDiagnostics {
  collectDiagnosticInfo(): Promise<BluetoothDiagnosticInfo>;
  logInitializationAttempt(success: boolean, error?: string): void;
  logPermissionChange(granted: boolean, permissions: string[]): void;
  generateDiagnosticReport(): Promise<BluetoothDiagnosticReport>;
  clearDiagnosticHistory(): void;
  exportDiagnosticData(): Promise<string>;
}

export interface BluetoothDiagnosticInfo {
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  bleLibraryVersion: string;
  initializationAttempts: number;
  lastSuccessfulInit?: Date;
  stateHistory: BluetoothStateChangeEvent[];
  permissionHistory: PermissionChange[];
  systemInfo: SystemInfo;
  performanceMetrics: PerformanceMetrics;
}

export interface PermissionChange {
  timestamp: Date;
  granted: boolean;
  permissions: string[];
  trigger: string;
  previouslyGranted?: boolean;
}

export interface SystemInfo {
  platform: 'ios' | 'android' | 'web';
  platformVersion: string;
  deviceBrand?: string;
  deviceManufacturer?: string;
  totalMemory?: number;
  freeMemory?: number;
  batteryLevel?: number;
  isEmulator?: boolean;
}

export interface PerformanceMetrics {
  averageInitializationTime: number;
  successfulInitializations: number;
  failedInitializations: number;
  lastInitializationTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface BluetoothDiagnosticReport {
  timestamp: Date;
  summary: DiagnosticSummary;
  diagnosticInfo: BluetoothDiagnosticInfo;
  recommendations: string[];
  criticalIssues: string[];
  warnings: string[];
  logs: DiagnosticLogEntry[];
}

export interface DiagnosticSummary {
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  initializationSuccessRate: number;
  averageInitTime: number;
  lastSuccessfulConnection?: Date;
  totalIssuesFound: number;
  criticalIssuesCount: number;
}

export interface DiagnosticLogEntry {
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  category: 'INITIALIZATION' | 'PERMISSIONS' | 'STATE_CHANGE' | 'ERROR' | 'PERFORMANCE' | 'SYSTEM';
  message: string;
  details?: any;
  stackTrace?: string;
}

export interface BluetoothDiagnosticConfig {
  maxLogEntries: number;
  maxStateHistorySize: number;
  maxPermissionHistorySize: number;
  enablePerformanceTracking: boolean;
  enableDetailedLogging: boolean;
  logRetentionDays: number;
}