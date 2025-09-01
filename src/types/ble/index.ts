// BLE Device and connection types
export * from './device';

// OBD-II protocol and communication types
export * from './obd-protocol';

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