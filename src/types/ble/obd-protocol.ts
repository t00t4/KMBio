export interface OBDCommand {
  pid: string;
  command: string;
  description: string;
  responseLength: number;
  unit?: string;
  formula?: string;
}

export interface OBDResponse {
  pid: string;
  rawValue: string;
  processedValue?: number;
  unit?: string;
  timestamp: Date;
  isValid: boolean;
  error?: string;
  description?: string;
}

export interface ELM327Config {
  echo: boolean;
  linefeed: boolean;
  headers: boolean;
  spaces: boolean;
  protocol: OBDProtocol;
  timeout: number; // milliseconds
  adaptiveTiming: boolean;
}

export type OBDProtocol = 
  | 'AUTO'
  | 'ISO9141-2'
  | 'KWP2000_5_BAUD'
  | 'KWP2000_FAST'
  | 'CAN_11BIT_500K'
  | 'CAN_29BIT_500K'
  | 'CAN_11BIT_250K'
  | 'CAN_29BIT_250K';

export interface OBDConnectionInfo {
  protocol: OBDProtocol;
  voltage: number;
  isInitialized: boolean;
  supportedPIDs: string[];
  ecuCount: number;
  lastCommand?: string;
  lastResponse?: string;
  commandQueue: OBDCommand[];
}

export interface PIDSupport {
  pid: string;
  isSupported: boolean;
  testedAt?: Date;
  fallbackPID?: string;
  estimationMethod?: 'calculation' | 'lookup' | 'interpolation';
}