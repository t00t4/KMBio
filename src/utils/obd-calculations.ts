import { OBDResponse } from '../types/ble/obd-protocol';
import { PID_DEFINITIONS, OBD_PIDS } from '../constants/pids';

/**
 * Utility functions for OBD-II data calculations and validations
 */

export interface VehicleData {
  rpm?: number;
  speed?: number;
  engineTemp?: number;
  maf?: number;
  map?: number;
  throttlePosition?: number;
  engineLoad?: number;
  fuelLevel?: number;
  intakeAirTemp?: number;
}

/**
 * Convert OBD responses to structured vehicle data
 */
export function parseVehicleData(responses: OBDResponse[]): VehicleData {
  const data: VehicleData = {};

  responses.forEach(response => {
    if (!response.isValid || response.processedValue === undefined) {
      return;
    }

    switch (response.pid) {
      case OBD_PIDS.ENGINE_RPM:
        data.rpm = response.processedValue;
        break;
      case OBD_PIDS.VEHICLE_SPEED:
        data.speed = response.processedValue;
        break;
      case OBD_PIDS.ENGINE_COOLANT_TEMP:
        data.engineTemp = response.processedValue;
        break;
      case OBD_PIDS.MAF_SENSOR:
        data.maf = response.processedValue;
        break;
      case OBD_PIDS.INTAKE_MAP:
        data.map = response.processedValue;
        break;
      case OBD_PIDS.THROTTLE_POSITION:
        data.throttlePosition = response.processedValue;
        break;
      case OBD_PIDS.ENGINE_LOAD:
        data.engineLoad = response.processedValue;
        break;
      case OBD_PIDS.FUEL_LEVEL:
        data.fuelLevel = response.processedValue;
        break;
      case OBD_PIDS.INTAKE_AIR_TEMP:
        data.intakeAirTemp = response.processedValue;
        break;
    }
  });

  return data;
}

/**
 * Calculate instantaneous fuel consumption from MAF sensor
 */
export function calculateFuelConsumptionFromMAF(
  maf: number, // g/s
  fuelType: 'gasoline' | 'ethanol' | 'diesel' = 'gasoline'
): number {
  // Air-fuel ratios for different fuel types
  const airFuelRatios = {
    gasoline: 14.7,
    ethanol: 9.0,
    diesel: 14.5,
  };

  const afr = airFuelRatios[fuelType];
  
  // Calculate fuel flow in g/s
  const fuelFlowGS = maf / afr;
  
  // Convert to L/h (assuming fuel density: gasoline ~0.75 kg/L, ethanol ~0.79 kg/L, diesel ~0.85 kg/L)
  const fuelDensities = {
    gasoline: 750, // g/L
    ethanol: 790,  // g/L
    diesel: 850,   // g/L
  };
  
  const density = fuelDensities[fuelType];
  const fuelFlowLH = (fuelFlowGS * 3600) / density; // L/h
  
  return Math.round(fuelFlowLH * 100) / 100;
}

/**
 * Estimate fuel consumption from MAP sensor when MAF is not available
 */
export function estimateFuelConsumptionFromMAP(
  map: number, // kPa
  rpm: number,
  engineSize: number, // L
  fuelType: 'gasoline' | 'ethanol' | 'diesel' = 'gasoline'
): number {
  // Volumetric efficiency estimation (simplified)
  const volumetricEfficiency = Math.min(0.85, map / 100);
  
  // Calculate air flow estimation
  const airFlowLMin = (engineSize * rpm * volumetricEfficiency) / 2; // L/min
  const airFlowGS = (airFlowLMin * 1.225) / 60; // Convert to g/s (air density ~1.225 g/L)
  
  return calculateFuelConsumptionFromMAF(airFlowGS, fuelType);
}

/**
 * Calculate fuel consumption in L/100km from instantaneous consumption
 */
export function calculateConsumptionPer100km(
  fuelFlowLH: number,
  speedKmH: number
): number {
  if (speedKmH <= 0) {
    return 0; // Avoid division by zero
  }
  
  const consumptionL100km = (fuelFlowLH * 100) / speedKmH;
  return Math.round(consumptionL100km * 100) / 100;
}

/**
 * Convert L/100km to km/L
 */
export function convertToKmPerLiter(l100km: number): number {
  if (l100km <= 0) {
    return 0;
  }
  
  const kmL = 100 / l100km;
  return Math.round(kmL * 100) / 100;
}

/**
 * Detect driving events based on OBD data
 */
export interface DrivingEvent {
  type: 'harsh_acceleration' | 'harsh_braking' | 'high_rpm' | 'idle_time' | 'high_temp';
  severity: 'low' | 'medium' | 'high';
  value: number;
  timestamp: Date;
  description: string;
}

export function detectDrivingEvents(
  currentData: VehicleData,
  previousData?: VehicleData,
  deltaTime: number = 1000 // ms
): DrivingEvent[] {
  const events: DrivingEvent[] = [];
  const now = new Date();

  // High RPM detection
  if (currentData.rpm && currentData.rpm > 3000) {
    const severity = currentData.rpm > 4000 ? 'high' : 
                    currentData.rpm > 3200 ? 'medium' : 'low';
    
    events.push({
      type: 'high_rpm',
      severity,
      value: currentData.rpm,
      timestamp: now,
      description: `High RPM detected: ${currentData.rpm} rpm`,
    });
  }

  // High engine temperature
  if (currentData.engineTemp && currentData.engineTemp > 100) {
    const severity = currentData.engineTemp > 110 ? 'high' : 
                    currentData.engineTemp > 105 ? 'medium' : 'low';
    
    events.push({
      type: 'high_temp',
      severity,
      value: currentData.engineTemp,
      timestamp: now,
      description: `High engine temperature: ${currentData.engineTemp}°C`,
    });
  }

  // Acceleration/deceleration detection (requires previous data)
  if (previousData && currentData.speed !== undefined && previousData.speed !== undefined) {
    const speedDelta = currentData.speed - previousData.speed;
    const acceleration = (speedDelta * 1000) / deltaTime; // km/h/s
    
    // Harsh acceleration (> 8 km/h/s)
    if (acceleration > 8) {
      const severity = acceleration > 12 ? 'high' : 
                      acceleration > 10 ? 'medium' : 'low';
      
      events.push({
        type: 'harsh_acceleration',
        severity,
        value: acceleration,
        timestamp: now,
        description: `Harsh acceleration detected: ${acceleration.toFixed(1)} km/h/s`,
      });
    }
    
    // Harsh braking (< -8 km/h/s)
    if (acceleration < -8) {
      const severity = acceleration < -15 ? 'high' : 
                      acceleration < -12 ? 'medium' : 'low';
      
      events.push({
        type: 'harsh_braking',
        severity,
        value: Math.abs(acceleration),
        timestamp: now,
        description: `Harsh braking detected: ${Math.abs(acceleration).toFixed(1)} km/h/s`,
      });
    }
  }

  // Idle time detection (speed = 0, RPM > 0)
  if (currentData.speed === 0 && currentData.rpm && currentData.rpm > 500) {
    events.push({
      type: 'idle_time',
      severity: 'low',
      value: currentData.rpm,
      timestamp: now,
      description: `Vehicle idling at ${currentData.rpm} rpm`,
    });
  }

  return events;
}

/**
 * Validate OBD data for consistency and reasonableness
 */
export function validateVehicleData(data: VehicleData): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // RPM validation
  if (data.rpm !== undefined) {
    if (data.rpm < 0 || data.rpm > 8000) {
      errors.push(`Invalid RPM value: ${data.rpm}`);
    } else if (data.rpm > 6000) {
      warnings.push(`Very high RPM: ${data.rpm}`);
    }
  }

  // Speed validation
  if (data.speed !== undefined) {
    if (data.speed < 0 || data.speed > 300) {
      errors.push(`Invalid speed value: ${data.speed}`);
    } else if (data.speed > 200) {
      warnings.push(`Very high speed: ${data.speed} km/h`);
    }
  }

  // Engine temperature validation
  if (data.engineTemp !== undefined) {
    if (data.engineTemp < -40 || data.engineTemp > 150) {
      errors.push(`Invalid engine temperature: ${data.engineTemp}°C`);
    } else if (data.engineTemp > 110) {
      warnings.push(`High engine temperature: ${data.engineTemp}°C`);
    } else if (data.engineTemp < 60 && data.rpm && data.rpm > 1000) {
      warnings.push(`Engine may not be warmed up: ${data.engineTemp}°C`);
    }
  }

  // Cross-validation: speed vs RPM consistency
  if (data.speed !== undefined && data.rpm !== undefined) {
    // Very rough check: if speed is 0, RPM should be idle (500-1200)
    if (data.speed === 0 && data.rpm > 1500) {
      warnings.push(`High RPM while stationary: ${data.rpm} rpm`);
    }
    
    // If speed > 0, RPM should be > idle
    if (data.speed > 10 && data.rpm < 800) {
      warnings.push(`Low RPM while moving: ${data.rpm} rpm at ${data.speed} km/h`);
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}