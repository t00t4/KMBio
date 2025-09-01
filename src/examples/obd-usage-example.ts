/**
 * Example usage of the enhanced OBD service
 * This demonstrates how to use the OBD service for real-time data collection
 */

import { OBDService } from '../services/obd/OBDService';
import { BLEManager } from '../services/ble/BLEManager';
import { parseVehicleData, detectDrivingEvents, calculateFuelConsumptionFromMAF } from '../utils/obd-calculations';
import { OBD_PIDS } from '../constants/pids';

export class OBDDataCollector {
  private obdService: OBDService;
  private bleManager: BLEManager;
  private isCollecting = false;
  private collectionInterval?: NodeJS.Timeout;

  constructor() {
    this.bleManager = new BLEManager();
    this.obdService = new OBDService(this.bleManager);
  }

  /**
   * Initialize and connect to ELM327 device
   */
  async connect(deviceId: string): Promise<void> {
    try {
      console.log('Connecting to ELM327 device...');
      
      // Connect via BLE
      await this.bleManager.connectToDevice(deviceId);
      
      // Initialize OBD communication
      await this.obdService.initialize();
      
      console.log('OBD service initialized successfully');
      
      // Log supported PIDs
      const supportedPIDs = await this.obdService.getSupportedPIDs();
      console.log('Supported PIDs:', supportedPIDs);
      
    } catch (error) {
      console.error('Failed to connect and initialize OBD:', error);
      throw error;
    }
  }

  /**
   * Start collecting OBD data at specified frequency
   */
  async startDataCollection(frequencyHz: number = 1): Promise<void> {
    if (this.isCollecting) {
      console.warn('Data collection already in progress');
      return;
    }

    this.isCollecting = true;
    const intervalMs = 1000 / frequencyHz;

    console.log(`Starting data collection at ${frequencyHz} Hz`);

    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectAndProcessData();
      } catch (error) {
        console.error('Error during data collection:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop data collection
   */
  stopDataCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
    this.isCollecting = false;
    console.log('Data collection stopped');
  }

  /**
   * Collect and process OBD data
   */
  private async collectAndProcessData(): Promise<void> {
    try {
      // Read essential PIDs
      const responses = await this.obdService.readEssentialData();
      
      // Parse to structured vehicle data
      const vehicleData = parseVehicleData(responses);
      
      // Validate data
      const validation = this.validateData(responses);
      if (!validation.isValid) {
        console.warn('Invalid data detected:', validation.errors);
        return;
      }

      // Calculate fuel consumption if MAF is available
      let fuelConsumption: number | undefined;
      if (vehicleData.maf) {
        fuelConsumption = calculateFuelConsumptionFromMAF(vehicleData.maf, 'gasoline');
      }

      // Detect driving events
      const events = detectDrivingEvents(vehicleData);
      
      // Log real-time data
      this.logRealTimeData(vehicleData, fuelConsumption, events);
      
      // Process events for alerts
      if (events.length > 0) {
        this.handleDrivingEvents(events);
      }

    } catch (error) {
      console.error('Failed to collect OBD data:', error);
    }
  }

  /**
   * Validate collected OBD responses
   */
  private validateData(responses: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const response of responses) {
      if (!this.obdService.validateOBDResponse(response)) {
        errors.push(`Invalid response for PID ${response.pid}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Log real-time vehicle data
   */
  private logRealTimeData(
    vehicleData: any,
    fuelConsumption?: number,
    events: any[] = []
  ): void {
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] Vehicle Data:`, {
      rpm: vehicleData.rpm,
      speed: vehicleData.speed,
      engineTemp: vehicleData.engineTemp,
      throttlePosition: vehicleData.throttlePosition,
      fuelConsumption: fuelConsumption ? `${fuelConsumption} L/h` : 'N/A',
      eventsCount: events.length,
    });
  }

  /**
   * Handle driving events for real-time alerts
   */
  private handleDrivingEvents(events: any[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'high_rpm':
          console.warn(`⚠️ High RPM Alert: ${event.value} rpm - Consider shifting up`);
          break;
        case 'harsh_acceleration':
          console.warn(`⚠️ Harsh Acceleration: ${event.value.toFixed(1)} km/h/s - Accelerate more smoothly`);
          break;
        case 'harsh_braking':
          console.warn(`⚠️ Harsh Braking: ${event.value.toFixed(1)} km/h/s - Anticipate stops better`);
          break;
        case 'high_temp':
          console.error(`🔥 High Engine Temperature: ${event.value}°C - Check cooling system`);
          break;
        case 'idle_time':
          console.info(`💡 Idling detected: ${event.value} rpm - Consider turning off engine for long stops`);
          break;
      }
    }
  }

  /**
   * Read specific PID with error handling
   */
  async readSpecificPID(pid: string): Promise<any> {
    try {
      if (!this.obdService.isPIDSupported(pid)) {
        throw new Error(`PID ${pid} is not supported by this vehicle`);
      }

      const response = await this.obdService.readPID(pid);
      
      if (!this.obdService.validateOBDResponse(response)) {
        throw new Error(`Invalid response for PID ${pid}`);
      }

      return response;
    } catch (error) {
      console.error(`Failed to read PID ${pid}:`, error);
      throw error;
    }
  }

  /**
   * Get vehicle information
   */
  async getVehicleInfo(): Promise<any> {
    try {
      const info = await this.obdService.getVehicleInfo();
      console.log('Vehicle Information:', info);
      return info;
    } catch (error) {
      console.error('Failed to get vehicle info:', error);
      throw error;
    }
  }

  /**
   * Disconnect from OBD device
   */
  async disconnect(): Promise<void> {
    try {
      this.stopDataCollection();
      await this.bleManager.disconnect();
      console.log('Disconnected from OBD device');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }
}

// Example usage:
/*
const collector = new OBDDataCollector();

async function example() {
  try {
    // Connect to ELM327 device
    await collector.connect('device-id-here');
    
    // Get vehicle information
    await collector.getVehicleInfo();
    
    // Start collecting data at 1 Hz
    await collector.startDataCollection(1);
    
    // Let it run for 30 seconds
    setTimeout(async () => {
      await collector.disconnect();
    }, 30000);
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}
*/