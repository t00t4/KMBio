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
  processedValue: number;
  unit: string;
  timestamp: Date;
  isValid: boolean;
  error?: string;
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
  | 'SAE_J1850_PWM'
  | 'SAE_J1850_VPW'
  | 'ISO_9141_2'
  | 'ISO_14230_4_KWP'
  | 'ISO_15765_4_CAN'
  | 'SAE_J1939_CAN'
  | 'USER1_CAN'
  | 'USER2_CAN';

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