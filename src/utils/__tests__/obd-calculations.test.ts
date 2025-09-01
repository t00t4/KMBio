import {
  parseVehicleData,
  calculateFuelConsumptionFromMAF,
  estimateFuelConsumptionFromMAP,
  calculateConsumptionPer100km,
  convertToKmPerLiter,
  detectDrivingEvents,
  validateVehicleData,
  VehicleData,
} from '../obd-calculations';
import { OBDResponse } from '../../types/ble/obd-protocol';
import { OBD_PIDS } from '../../constants/pids';

describe('OBD Calculations', () => {
  describe('parseVehicleData', () => {
    it('should parse OBD responses to vehicle data', () => {
      const responses: OBDResponse[] = [
        {
          pid: OBD_PIDS.ENGINE_RPM,
          rawValue: '1AF8',
          processedValue: 1750,
          timestamp: new Date(),
          isValid: true,
          unit: 'rpm',
          description: 'Engine RPM',
        },
        {
          pid: OBD_PIDS.VEHICLE_SPEED,
          rawValue: '2D',
          processedValue: 45,
          timestamp: new Date(),
          isValid: true,
          unit: 'km/h',
          description: 'Vehicle Speed',
        },
      ];

      const vehicleData = parseVehicleData(responses);
      
      expect(vehicleData.rpm).toBe(1750);
      expect(vehicleData.speed).toBe(45);
    });

    it('should ignore invalid responses', () => {
      const responses: OBDResponse[] = [
        {
          pid: OBD_PIDS.ENGINE_RPM,
          rawValue: 'ERROR',
          timestamp: new Date(),
          isValid: false,
          unit: 'rpm',
          description: 'Engine RPM',
          error: 'Communication error',
        },
      ];

      const vehicleData = parseVehicleData(responses);
      
      expect(vehicleData.rpm).toBeUndefined();
    });
  });

  describe('fuel consumption calculations', () => {
    it('should calculate fuel consumption from MAF for gasoline', () => {
      const maf = 5.0; // g/s
      const consumption = calculateFuelConsumptionFromMAF(maf, 'gasoline');
      
      // Expected: 5.0 / 14.7 * 3600 / 750 ≈ 1.63 L/h
      expect(consumption).toBeCloseTo(1.63, 1);
    });

    it('should calculate fuel consumption from MAF for ethanol', () => {
      const maf = 5.0; // g/s
      const consumption = calculateFuelConsumptionFromMAF(maf, 'ethanol');
      
      // Expected: 5.0 / 9.0 * 3600 / 790 ≈ 2.53 L/h
      expect(consumption).toBeCloseTo(2.53, 1);
    });

    it('should estimate fuel consumption from MAP', () => {
      const map = 80; // kPa
      const rpm = 2000;
      const engineSize = 2.0; // L
      
      const consumption = estimateFuelConsumptionFromMAP(map, rpm, engineSize, 'gasoline');
      
      expect(consumption).toBeGreaterThan(0);
      expect(consumption).toBeLessThan(20); // Reasonable range
    });

    it('should calculate consumption per 100km', () => {
      const fuelFlowLH = 6.0; // L/h
      const speedKmH = 60; // km/h
      
      const consumption = calculateConsumptionPer100km(fuelFlowLH, speedKmH);
      
      // Expected: 6.0 * 100 / 60 = 10.0 L/100km
      expect(consumption).toBe(10.0);
    });

    it('should handle zero speed in consumption calculation', () => {
      const consumption = calculateConsumptionPer100km(6.0, 0);
      expect(consumption).toBe(0);
    });

    it('should convert L/100km to km/L', () => {
      const l100km = 10.0;
      const kmL = convertToKmPerLiter(l100km);
      
      // Expected: 100 / 10 = 10 km/L
      expect(kmL).toBe(10.0);
    });

    it('should handle zero consumption in km/L conversion', () => {
      const kmL = convertToKmPerLiter(0);
      expect(kmL).toBe(0);
    });
  });

  describe('driving event detection', () => {
    it('should detect high RPM event', () => {
      const currentData: VehicleData = {
        rpm: 3500,
        speed: 80,
      };

      const events = detectDrivingEvents(currentData);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('high_rpm');
      expect(events[0].severity).toBe('medium');
      expect(events[0].value).toBe(3500);
    });

    it('should detect harsh acceleration', () => {
      const previousData: VehicleData = { speed: 30 };
      const currentData: VehicleData = { speed: 45 }; // +15 km/h in 1 second
      
      const events = detectDrivingEvents(currentData, previousData, 1000);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('harsh_acceleration');
      expect(events[0].severity).toBe('high');
    });

    it('should detect harsh braking', () => {
      const previousData: VehicleData = { speed: 60 };
      const currentData: VehicleData = { speed: 40 }; // -20 km/h in 1 second
      
      const events = detectDrivingEvents(currentData, previousData, 1000);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('harsh_braking');
      expect(events[0].severity).toBe('high');
    });

    it('should detect high engine temperature', () => {
      const currentData: VehicleData = {
        engineTemp: 115,
      };

      const events = detectDrivingEvents(currentData);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('high_temp');
      expect(events[0].severity).toBe('high');
    });

    it('should detect idle time', () => {
      const currentData: VehicleData = {
        speed: 0,
        rpm: 800,
      };

      const events = detectDrivingEvents(currentData);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('idle_time');
      expect(events[0].severity).toBe('low');
    });
  });

  describe('data validation', () => {
    it('should validate normal vehicle data', () => {
      const data: VehicleData = {
        rpm: 2000,
        speed: 60,
        engineTemp: 90,
      };

      const validation = validateVehicleData(data);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid RPM', () => {
      const data: VehicleData = {
        rpm: -100, // Invalid negative RPM
      };

      const validation = validateVehicleData(data);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid RPM value: -100');
    });

    it('should detect invalid speed', () => {
      const data: VehicleData = {
        speed: 350, // Unrealistic speed
      };

      const validation = validateVehicleData(data);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid speed value: 350');
    });

    it('should warn about high values', () => {
      const data: VehicleData = {
        rpm: 6500, // High but valid RPM
        speed: 220, // High but valid speed
        engineTemp: 115, // High temperature
      };

      const validation = validateVehicleData(data);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Very high RPM: 6500');
      expect(validation.warnings).toContain('Very high speed: 220 km/h');
      expect(validation.warnings).toContain('High engine temperature: 115°C');
    });

    it('should detect inconsistent speed vs RPM', () => {
      const data: VehicleData = {
        speed: 0,
        rpm: 2000, // High RPM while stationary
      };

      const validation = validateVehicleData(data);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('High RPM while stationary: 2000 rpm');
    });
  });
});