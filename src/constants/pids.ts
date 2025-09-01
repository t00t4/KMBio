// OBD-II PIDs constants and definitions
export const OBD_PIDS = {
  // Engine RPM
  ENGINE_RPM: '010C',
  
  // Vehicle Speed
  VEHICLE_SPEED: '010D',
  
  // Engine Coolant Temperature
  ENGINE_COOLANT_TEMP: '0105',
  
  // Mass Air Flow (MAF)
  MAF_SENSOR: '0110',
  
  // Manifold Absolute Pressure (MAP)
  INTAKE_MAP: '010B',
  
  // Throttle Position
  THROTTLE_POSITION: '0111',
  
  // Engine Load
  ENGINE_LOAD: '0104',
  
  // Fuel Level
  FUEL_LEVEL: '012F',
  
  // Intake Air Temperature
  INTAKE_AIR_TEMP: '010F',
  
  // Fuel Pressure
  FUEL_PRESSURE: '010A',
  
  // Timing Advance
  TIMING_ADVANCE: '010E',
  
  // Oxygen Sensor
  O2_SENSOR_B1S1: '0114',
  
  // Short Term Fuel Trim
  SHORT_FUEL_TRIM_B1: '0106',
  
  // Long Term Fuel Trim
  LONG_FUEL_TRIM_B1: '0107',
  
  // Supported PIDs
  SUPPORTED_PIDS_01_20: '0100',
  SUPPORTED_PIDS_21_40: '0120',
  SUPPORTED_PIDS_41_60: '0140',
  
  // Vehicle Identification Number
  VIN: '0902',
  
  // Fuel Type
  FUEL_TYPE: '0151',
  
  // Absolute Barometric Pressure
  BAROMETRIC_PRESSURE: '0133',
} as const;

export interface PIDDefinition {
  pid: string;
  name: string;
  description: string;
  unit: string;
  minValue: number;
  maxValue: number;
  formula: string;
  bytes: number;
  priority: 'high' | 'medium' | 'low';
  category: 'engine' | 'fuel' | 'emissions' | 'diagnostic' | 'vehicle';
}

export const PID_DEFINITIONS: Record<string, PIDDefinition> = {
  [OBD_PIDS.ENGINE_RPM]: {
    pid: OBD_PIDS.ENGINE_RPM,
    name: 'Engine RPM',
    description: 'Engine revolutions per minute',
    unit: 'rpm',
    minValue: 0,
    maxValue: 16383.75,
    formula: '((A*256)+B)/4',
    bytes: 2,
    priority: 'high',
    category: 'engine',
  },
  
  [OBD_PIDS.VEHICLE_SPEED]: {
    pid: OBD_PIDS.VEHICLE_SPEED,
    name: 'Vehicle Speed',
    description: 'Vehicle speed sensor',
    unit: 'km/h',
    minValue: 0,
    maxValue: 255,
    formula: 'A',
    bytes: 1,
    priority: 'high',
    category: 'vehicle',
  },
  
  [OBD_PIDS.ENGINE_COOLANT_TEMP]: {
    pid: OBD_PIDS.ENGINE_COOLANT_TEMP,
    name: 'Engine Coolant Temperature',
    description: 'Engine coolant temperature',
    unit: '°C',
    minValue: -40,
    maxValue: 215,
    formula: 'A-40',
    bytes: 1,
    priority: 'medium',
    category: 'engine',
  },
  
  [OBD_PIDS.MAF_SENSOR]: {
    pid: OBD_PIDS.MAF_SENSOR,
    name: 'Mass Air Flow',
    description: 'Mass air flow sensor',
    unit: 'g/s',
    minValue: 0,
    maxValue: 655.35,
    formula: '((A*256)+B)/100',
    bytes: 2,
    priority: 'high',
    category: 'fuel',
  },
  
  [OBD_PIDS.INTAKE_MAP]: {
    pid: OBD_PIDS.INTAKE_MAP,
    name: 'Intake Manifold Pressure',
    description: 'Intake manifold absolute pressure',
    unit: 'kPa',
    minValue: 0,
    maxValue: 255,
    formula: 'A',
    bytes: 1,
    priority: 'high',
    category: 'engine',
  },
  
  [OBD_PIDS.THROTTLE_POSITION]: {
    pid: OBD_PIDS.THROTTLE_POSITION,
    name: 'Throttle Position',
    description: 'Absolute throttle position',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    formula: 'A*100/255',
    bytes: 1,
    priority: 'medium',
    category: 'engine',
  },
  
  [OBD_PIDS.ENGINE_LOAD]: {
    pid: OBD_PIDS.ENGINE_LOAD,
    name: 'Engine Load',
    description: 'Calculated engine load value',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    formula: 'A*100/255',
    bytes: 1,
    priority: 'medium',
    category: 'engine',
  },
  
  [OBD_PIDS.FUEL_LEVEL]: {
    pid: OBD_PIDS.FUEL_LEVEL,
    name: 'Fuel Tank Level',
    description: 'Fuel tank level input',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    formula: 'A*100/255',
    bytes: 1,
    priority: 'low',
    category: 'fuel',
  },
  
  [OBD_PIDS.INTAKE_AIR_TEMP]: {
    pid: OBD_PIDS.INTAKE_AIR_TEMP,
    name: 'Intake Air Temperature',
    description: 'Intake air temperature',
    unit: '°C',
    minValue: -40,
    maxValue: 215,
    formula: 'A-40',
    bytes: 1,
    priority: 'low',
    category: 'engine',
  },
};

// Priority-based PID groups for data collection
export const PID_GROUPS = {
  ESSENTIAL: [
    OBD_PIDS.ENGINE_RPM,
    OBD_PIDS.VEHICLE_SPEED,
    OBD_PIDS.MAF_SENSOR,
    OBD_PIDS.INTAKE_MAP,
  ],
  
  IMPORTANT: [
    OBD_PIDS.ENGINE_COOLANT_TEMP,
    OBD_PIDS.THROTTLE_POSITION,
    OBD_PIDS.ENGINE_LOAD,
  ],
  
  OPTIONAL: [
    OBD_PIDS.FUEL_LEVEL,
    OBD_PIDS.INTAKE_AIR_TEMP,
    OBD_PIDS.FUEL_PRESSURE,
    OBD_PIDS.TIMING_ADVANCE,
  ],
} as const;

// Fallback strategies when primary PIDs are not available
export const PID_FALLBACKS = {
  [OBD_PIDS.MAF_SENSOR]: [OBD_PIDS.INTAKE_MAP],
  [OBD_PIDS.INTAKE_MAP]: [OBD_PIDS.MAF_SENSOR],
} as const;

// ELM327 specific commands
export const ELM327_COMMANDS = {
  // Reset
  RESET: 'ATZ',
  
  // Echo off
  ECHO_OFF: 'ATE0',
  
  // Linefeed off
  LINEFEED_OFF: 'ATL0',
  
  // Headers off
  HEADERS_OFF: 'ATH0',
  
  // Spaces off
  SPACES_OFF: 'ATS0',
  
  // Set protocol to auto
  PROTOCOL_AUTO: 'ATSP0',
  
  // Get protocol
  GET_PROTOCOL: 'ATDP',
  
  // Get voltage
  GET_VOLTAGE: 'ATRV',
  
  // Set timeout
  SET_TIMEOUT: 'ATST',
  
  // Adaptive timing on
  ADAPTIVE_TIMING_ON: 'ATAT1',
  
  // Adaptive timing off
  ADAPTIVE_TIMING_OFF: 'ATAT0',
} as const;
