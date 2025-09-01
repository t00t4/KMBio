// AI rules and thresholds for driving behavior analysis
export const DRIVING_THRESHOLDS = {
  // RPM thresholds
  HIGH_RPM_THRESHOLD: 3000, // RPM above which is considered high
  REDLINE_RPM_THRESHOLD: 4500, // RPM approaching redline
  OPTIMAL_RPM_RANGE: [1500, 2500], // Optimal RPM range for fuel efficiency
  
  // Speed thresholds
  CITY_SPEED_LIMIT: 60, // km/h
  HIGHWAY_SPEED_LIMIT: 120, // km/h
  EXCESSIVE_SPEED_THRESHOLD: 20, // km/h above speed limit
  
  // Acceleration/Deceleration thresholds (m/s²)
  HARSH_ACCELERATION_THRESHOLD: 2.5,
  HARSH_BRAKING_THRESHOLD: -3.0,
  SMOOTH_ACCELERATION_MAX: 1.5,
  
  // Temperature thresholds
  ENGINE_TEMP_NORMAL_MIN: 80, // °C
  ENGINE_TEMP_NORMAL_MAX: 105, // °C
  ENGINE_TEMP_WARNING: 110, // °C
  ENGINE_TEMP_CRITICAL: 120, // °C
  
  // Idle time thresholds
  IDLE_TIME_WARNING: 30, // seconds
  IDLE_TIME_EXCESSIVE: 120, // seconds
  IDLE_PERCENTAGE_WARNING: 10, // % of trip time
  
  // Fuel consumption thresholds
  CONSUMPTION_INCREASE_WARNING: 15, // % increase from baseline
  CONSUMPTION_INCREASE_CRITICAL: 25, // % increase from baseline
  
  // Engine load thresholds
  HIGH_ENGINE_LOAD: 80, // %
  EXCESSIVE_ENGINE_LOAD: 95, // %
} as const;

export interface DrivingRule {
  id: string;
  name: string;
  description: string;
  category: 'efficiency' | 'safety' | 'maintenance' | 'emissions';
  priority: 'low' | 'medium' | 'high' | 'critical';
  condition: RuleCondition;
  action: RuleAction;
  cooldownSeconds?: number;
}

export interface RuleCondition {
  type: 'threshold' | 'pattern' | 'duration' | 'frequency';
  parameter: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between';
  value: number | number[];
  duration?: number; // seconds
  frequency?: number; // occurrences per time period
}

export interface RuleAction {
  type: 'alert' | 'tip' | 'log' | 'metric';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  impact?: string;
}

export const DRIVING_RULES: DrivingRule[] = [
  {
    id: 'high_rpm_sustained',
    name: 'High RPM Sustained',
    description: 'Engine RPM above 3000 for extended period',
    category: 'efficiency',
    priority: 'medium',
    condition: {
      type: 'duration',
      parameter: 'rpm',
      operator: '>',
      value: DRIVING_THRESHOLDS.HIGH_RPM_THRESHOLD,
      duration: 10,
    },
    action: {
      type: 'alert',
      severity: 'warning',
      message: 'RPM alto detectado',
      suggestion: 'Considere trocar para uma marcha mais alta',
      impact: 'Pode aumentar o consumo em até 20%',
    },
    cooldownSeconds: 30,
  },
  
  {
    id: 'harsh_acceleration',
    name: 'Harsh Acceleration',
    description: 'Rapid acceleration detected',
    category: 'efficiency',
    priority: 'medium',
    condition: {
      type: 'threshold',
      parameter: 'acceleration',
      operator: '>',
      value: DRIVING_THRESHOLDS.HARSH_ACCELERATION_THRESHOLD,
    },
    action: {
      type: 'alert',
      severity: 'info',
      message: 'Aceleração brusca detectada',
      suggestion: 'Acelere gradualmente para economizar combustível',
      impact: 'Aceleração suave pode economizar até 15% de combustível',
    },
    cooldownSeconds: 15,
  },
  
  {
    id: 'harsh_braking',
    name: 'Harsh Braking',
    description: 'Sudden braking detected',
    category: 'safety',
    priority: 'high',
    condition: {
      type: 'threshold',
      parameter: 'deceleration',
      operator: '<',
      value: DRIVING_THRESHOLDS.HARSH_BRAKING_THRESHOLD,
    },
    action: {
      type: 'alert',
      severity: 'warning',
      message: 'Frenagem brusca detectada',
      suggestion: 'Antecipe as frenagens para maior segurança e economia',
      impact: 'Frenagem suave reduz desgaste e melhora eficiência',
    },
    cooldownSeconds: 20,
  },
  
  {
    id: 'excessive_idle_time',
    name: 'Excessive Idle Time',
    description: 'Vehicle idling for too long',
    category: 'efficiency',
    priority: 'medium',
    condition: {
      type: 'duration',
      parameter: 'speed',
      operator: '==',
      value: 0,
      duration: DRIVING_THRESHOLDS.IDLE_TIME_WARNING,
    },
    action: {
      type: 'alert',
      severity: 'info',
      message: 'Veículo parado há muito tempo',
      suggestion: 'Considere desligar o motor em paradas longas',
      impact: 'Desligar o motor pode economizar até 0.5L/h',
    },
    cooldownSeconds: 60,
  },
  
  {
    id: 'high_engine_temperature',
    name: 'High Engine Temperature',
    description: 'Engine temperature above normal range',
    category: 'maintenance',
    priority: 'high',
    condition: {
      type: 'threshold',
      parameter: 'engineTemp',
      operator: '>',
      value: DRIVING_THRESHOLDS.ENGINE_TEMP_WARNING,
    },
    action: {
      type: 'alert',
      severity: 'warning',
      message: 'Temperatura do motor elevada',
      suggestion: 'Verifique o sistema de arrefecimento',
      impact: 'Temperatura alta pode causar danos ao motor',
    },
    cooldownSeconds: 120,
  },
  
  {
    id: 'fuel_consumption_increase',
    name: 'Fuel Consumption Increase',
    description: 'Significant increase in fuel consumption',
    category: 'efficiency',
    priority: 'medium',
    condition: {
      type: 'threshold',
      parameter: 'consumptionIncrease',
      operator: '>',
      value: DRIVING_THRESHOLDS.CONSUMPTION_INCREASE_WARNING,
    },
    action: {
      type: 'tip',
      severity: 'info',
      message: 'Aumento no consumo detectado',
      suggestion: 'Revise seus hábitos de direção recentes',
      impact: 'Pequenos ajustes podem restaurar a eficiência',
    },
  },
];

// Tip generation rules
export const TIP_GENERATION_RULES = {
  // Frequency thresholds for generating tips
  MIN_HARSH_ACCELERATION_COUNT: 3, // per trip
  MIN_HARSH_BRAKING_COUNT: 2, // per trip
  MIN_HIGH_RPM_DURATION: 60, // seconds per trip
  MIN_IDLE_TIME_PERCENTAGE: 15, // % of trip time
  
  // Weekly analysis thresholds
  WEEKLY_EFFICIENCY_DROP_THRESHOLD: 10, // %
  WEEKLY_EVENT_INCREASE_THRESHOLD: 50, // % increase in events
  
  // Tip categories and priorities
  TIP_CATEGORIES: {
    FUEL_EFFICIENCY: 'fuel_efficiency',
    DRIVING_BEHAVIOR: 'driving_behavior',
    MAINTENANCE: 'maintenance',
    ROUTE_OPTIMIZATION: 'route_optimization',
    VEHICLE_SETTINGS: 'vehicle_settings',
    GENERAL: 'general',
  },
  
  // Cooldown periods for tips (days)
  TIP_COOLDOWNS: {
    fuel_efficiency: 3,
    driving_behavior: 2,
    maintenance: 7,
    route_optimization: 5,
    vehicle_settings: 14,
    general: 7,
  },
} as const;

// Fuel consumption calculation constants
export const FUEL_CONSTANTS = {
  // Fuel density (g/L)
  GASOLINE_DENSITY: 737,
  ETHANOL_DENSITY: 789,
  DIESEL_DENSITY: 832,
  
  // Air/Fuel ratios (stoichiometric)
  GASOLINE_AFR: 14.7,
  ETHANOL_AFR: 9.0,
  DIESEL_AFR: 14.5,
  
  // Energy content (MJ/L)
  GASOLINE_ENERGY: 32.0,
  ETHANOL_ENERGY: 21.2,
  DIESEL_ENERGY: 35.8,
  
  // CO2 emissions (g/L)
  GASOLINE_CO2: 2310,
  ETHANOL_CO2: 1510,
  DIESEL_CO2: 2640,
} as const;

// Efficiency scoring weights
export const EFFICIENCY_WEIGHTS = {
  FUEL_CONSUMPTION: 0.4,
  DRIVING_SMOOTHNESS: 0.3,
  ENGINE_EFFICIENCY: 0.2,
  MAINTENANCE_INDICATORS: 0.1,
} as const;
