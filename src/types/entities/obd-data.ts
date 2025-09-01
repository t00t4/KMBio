export interface OBDData {
  timestamp: Date;
  rpm: number;
  speed: number; // km/h
  engineTemp: number; // Celsius
  maf?: number; // Mass Air Flow - grams/second
  map?: number; // Manifold Absolute Pressure - kPa
  throttlePosition: number; // percentage 0-100
  fuelLevel?: number; // percentage 0-100
  engineLoad?: number; // percentage 0-100
  intakeAirTemp?: number; // Celsius
  fuelPressure?: number; // kPa
  timingAdvance?: number; // degrees
  oxygenSensor?: number; // voltage
  fuelTrim?: {
    shortTerm: number; // percentage
    longTerm: number; // percentage
  };
}

export interface CalculatedData {
  instantConsumption: number; // L/100km or km/L
  averageConsumption: number; // L/100km or km/L
  efficiency: number; // score 0-100
  co2Emission: number; // grams per km
  fuelFlow: number; // L/h
  distanceToEmpty?: number; // km
}

export interface RealTimeData extends OBDData {
  calculated: CalculatedData;
  connectionStatus: ConnectionStatus;
  dataQuality: DataQuality;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface DataQuality {
  score: number; // 0-100, based on available PIDs and data consistency
  missingPIDs: string[];
  estimatedValues: string[];
  lastUpdate: Date;
}

export interface OBDCapabilities {
  supportedPIDs: string[];
  protocolVersion: string;
  deviceInfo: {
    name: string;
    version: string;
    voltage: number;
  };
  vehicleInfo?: {
    vin?: string;
    ecuCount: number;
    protocols: string[];
  };
}