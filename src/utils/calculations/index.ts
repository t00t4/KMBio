import { OBDData, RealTimeData } from '../../types/entities/obd-data';

// Fuel consumption calculation based on MAF (Mass Air Flow)
export const calculateFuelConsumption = (obdData: OBDData): number => {
  // Fuel flow rate in L/h based on MAF or MAP
  
  if (obdData.maf !== undefined) {
    // Primary method: Use MAF sensor data
    // Formula: Fuel Flow (L/h) = (MAF (g/s) * 3600) / (AFR * fuel_density)
    // AFR (Air-Fuel Ratio) for gasoline ≈ 14.7:1
    // Fuel density for gasoline ≈ 737 g/L
    const airFuelRatio = 14.7;
    const fuelDensity = 737; // g/L
    
    return (obdData.maf * 3600) / (airFuelRatio * fuelDensity);
  } 
  
  if (obdData.map !== undefined && obdData.rpm !== undefined) {
    // Fallback method: Use MAP (Manifold Absolute Pressure) and RPM
    // This is less accurate but provides an estimate
    const engineDisplacement = 2.0; // Assume 2.0L engine (should be configurable)
    const volumetricEfficiency = 0.85; // Typical VE
    const airDensity = 1.225; // kg/m³ at sea level
    const airFuelRatio = 14.7;
    const fuelDensity = 737; // g/L
    
    // Calculate air mass flow from MAP
    const airFlow = (obdData.map * obdData.rpm * engineDisplacement * volumetricEfficiency * airDensity) / 120000;
    
    // Convert to fuel flow
    return (airFlow * 3600) / (airFuelRatio * fuelDensity / 1000);
  }
  
  // Last resort: Estimate based on RPM and throttle position
  if (obdData.rpm !== undefined && obdData.throttlePosition !== undefined) {
    // Very rough estimation for when no air flow data is available
    const baseConsumption = 0.5; // L/h at idle
    const rpmFactor = Math.max(0, (obdData.rpm - 600) / 3000); // Normalized RPM above idle
    const throttleFactor = obdData.throttlePosition / 100; // Normalized throttle
    
    return baseConsumption + (rpmFactor * throttleFactor * 15); // Max ~15.5 L/h at full throttle/high RPM
  }
  
  return 0; // No data available
};

// Calculate instant fuel consumption in L/100km
export const calculateInstantConsumption = (fuelFlow: number, speed: number): number => {
  if (speed <= 0) {
    return 0; // Stationary
  }
  
  // Convert L/h to L/100km
  return (fuelFlow / speed) * 100;
};

// Calculate efficiency score (0-100) based on various factors
export const calculateEfficiency = (obdData: OBDData, recentData: RealTimeData[]): number => {
  let score = 100;
  
  // Penalize high RPM
  if (obdData.rpm > 2500) {
    score -= Math.min(30, (obdData.rpm - 2500) / 100);
  }
  
  // Penalize aggressive throttle usage
  if (obdData.throttlePosition > 70) {
    score -= Math.min(20, (obdData.throttlePosition - 70) / 2);
  }
  
  // Penalize high engine temperature
  if (obdData.engineTemp > 100) {
    score -= Math.min(15, (obdData.engineTemp - 100) / 2);
  }
  
  // Reward consistent speed (check recent data for stability)
  if (recentData.length > 5) {
    const speeds = recentData.slice(-5).map(d => d.speed);
    const speedVariation = Math.max(...speeds) - Math.min(...speeds);
    if (speedVariation < 5) {
      score += 5; // Bonus for steady driving
    } else if (speedVariation > 20) {
      score -= 10; // Penalty for erratic speed
    }
  }
  
  // Penalize idling (speed = 0, RPM > 800)
  if (obdData.speed === 0 && obdData.rpm > 800) {
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
};

// Calculate CO2 emissions in g/km
export const calculateCO2Emission = (fuelFlow: number): number => {
  // CO2 emission factor for gasoline: ~2.31 kg CO2 per liter
  // Convert L/h to g/km (assuming current speed)
  return fuelFlow * 2310; // g CO2 per hour
};

// Calculate average consumption from historical data
export const calculateAverageConsumption = (
  recentData: RealTimeData[], 
  timeWindowSeconds: number = 60
): number => {
  if (recentData.length === 0) {
    return 0;
  }
  
  const cutoffTime = Date.now() - (timeWindowSeconds * 1000);
  const relevantData = recentData.filter(data => 
    data.timestamp.getTime() > cutoffTime
  );
  
  if (relevantData.length === 0) {
    return 0;
  }
  
  const totalConsumption = relevantData.reduce((sum, data) => 
    sum + data.calculated.instantConsumption, 0
  );
  
  return totalConsumption / relevantData.length;
};

// Estimate fuel consumption when MAF/MAP is not available
export const estimateFuelConsumptionFromRPM = (
  rpm: number, 
  throttlePosition: number, 
  engineLoad?: number
): number => {
  // Base consumption at idle
  let fuelFlow = 0.8; // L/h
  
  // Add consumption based on RPM
  const rpmFactor = Math.max(0, (rpm - 600) / 6000); // Normalize RPM range
  fuelFlow += rpmFactor * 12; // Up to 12 L/h additional for high RPM
  
  // Multiply by throttle position
  const throttleFactor = Math.max(0.1, throttlePosition / 100);
  fuelFlow *= throttleFactor;
  
  // Adjust for engine load if available
  if (engineLoad !== undefined) {
    const loadFactor = Math.max(0.5, engineLoad / 100);
    fuelFlow *= loadFactor;
  }
  
  return Math.max(0.3, Math.min(fuelFlow, 25)); // Clamp to reasonable range
};

// Calculate distance traveled based on speed and time interval
export const calculateDistanceIncrement = (
  speed: number, 
  timeIntervalSeconds: number
): number => {
  // Convert km/h to m/s, multiply by time, convert back to km
  const speedMs = speed / 3.6;
  const distanceMeters = speedMs * timeIntervalSeconds;
  return distanceMeters / 1000; // Convert to km
};

// Calculate fuel cost estimate
export const calculateFuelCost = (
  fuelConsumed: number, 
  fuelPricePerLiter: number = 5.5
): number => {
  return fuelConsumed * fuelPricePerLiter;
};

// Validate OBD data for calculation reliability
export const validateOBDDataForCalculations = (obdData: OBDData): {
  isValid: boolean;
  confidence: number;
  missingCriticalData: string[];
} => {
  const missingCriticalData: string[] = [];
  let confidence = 100;
  
  // Check for essential data
  if (obdData.rpm === undefined) {
    missingCriticalData.push('RPM');
    confidence -= 40;
  }
  
  if (obdData.speed === undefined) {
    missingCriticalData.push('Speed');
    confidence -= 30;
  }
  
  if (obdData.maf === undefined && obdData.map === undefined) {
    missingCriticalData.push('MAF/MAP');
    confidence -= 25;
  }
  
  if (obdData.throttlePosition === undefined) {
    missingCriticalData.push('Throttle Position');
    confidence -= 10;
  }
  
  const isValid = confidence >= 50; // Require at least 50% confidence
  
  return {
    isValid,
    confidence: Math.max(0, confidence),
    missingCriticalData,
  };
};

// Legacy function for backward compatibility
export const calculateConsumption = (maf: number, speed: number): number => {
  const mockOBDData: OBDData = {
    timestamp: new Date(),
    rpm: 2000,
    speed,
    engineTemp: 90,
    maf,
    throttlePosition: 50,
  };
  
  const fuelFlow = calculateFuelConsumption(mockOBDData);
  return calculateInstantConsumption(fuelFlow, speed);
};
