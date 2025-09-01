import { OBDServiceInterface } from '../../types/ble';
import { OBDData, RealTimeData, CalculatedData, ConnectionStatus, DataQuality } from '../../types/entities/obd-data';
import { OBD_PIDS, PID_GROUPS } from '../../constants/pids';
import { calculateFuelConsumption, calculateEfficiency, calculateCO2Emission } from '../../utils/calculations';

export interface TelemetryConfig {
  frequency: number; // Hz (1-2 Hz as per requirements)
  enabledPIDs: readonly string[];
  fallbackEnabled: boolean;
  qualityThreshold: number; // 0-100
}

export interface TelemetryServiceInterface {
  start(config?: Partial<TelemetryConfig>): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getCurrentData(): RealTimeData | null;
  getDataHistory(duration: number): RealTimeData[];
  onDataUpdate(callback: (data: RealTimeData) => void): () => void;
  updateConfig(config: Partial<TelemetryConfig>): void;
}

export class TelemetryService implements TelemetryServiceInterface {
  private obdService: OBDServiceInterface;
  private isCollecting: boolean = false;
  private collectionInterval?: NodeJS.Timeout;
  private currentData: RealTimeData | null = null;
  private dataHistory: RealTimeData[] = [];
  private dataCallbacks: Set<(data: RealTimeData) => void> = new Set();

  private config: TelemetryConfig = {
    frequency: 1.5, // 1.5 Hz default
    enabledPIDs: [...PID_GROUPS.ESSENTIAL], // Spread to create mutable copy
    fallbackEnabled: true,
    qualityThreshold: 70,
  };

  // Data collection statistics
  private stats = {
    totalCollections: 0,
    successfulCollections: 0,
    failedCollections: 0,
    lastCollectionTime: 0,
    averageCollectionTime: 0,
  };

  // Last valid data for fallback purposes
  private lastValidData: Partial<OBDData> = {};

  constructor(obdService: OBDServiceInterface) {
    this.obdService = obdService;
  }

  async start(config?: Partial<TelemetryConfig>): Promise<void> {
    if (this.isCollecting) {
      console.warn('Telemetry service is already running');
      return;
    }

    // Update configuration
    if (config) {
      this.updateConfig(config);
    }

    console.log('Starting telemetry service with config:', this.config);

    try {
      // Validate OBD service is ready
      const isConnected = await this.obdService.validateConnection();
      if (!isConnected) {
        throw new Error('OBD service is not connected');
      }

      // Initialize data collection
      this.isCollecting = true;
      this.resetStats();

      // Start collection loop
      const intervalMs = 1000 / this.config.frequency;
      console.log(`Starting data collection interval: ${intervalMs}ms (${this.config.frequency} Hz)`);

      this.collectionInterval = setInterval(() => {
        console.log('Collection interval triggered');
        this.collectData().catch(error => {
          console.error('Data collection error:', error);
          this.stats.failedCollections++;
        });
      }, intervalMs);

      console.log(`Telemetry service started at ${this.config.frequency} Hz`);
    } catch (error) {
      this.isCollecting = false;
      throw new Error(`Failed to start telemetry service: ${error}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isCollecting) {
      return;
    }

    console.log('Stopping telemetry service');

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }

    // Log final statistics
    console.log('Telemetry service stopped. Final stats:', this.getStats());
  }

  isRunning(): boolean {
    return this.isCollecting;
  }

  getCurrentData(): RealTimeData | null {
    return this.currentData;
  }

  getDataHistory(duration: number): RealTimeData[] {
    const cutoffTime = Date.now() - (duration * 1000);
    return this.dataHistory.filter(data =>
      data.timestamp.getTime() > cutoffTime
    );
  }

  onDataUpdate(callback: (data: RealTimeData) => void): () => void {
    this.dataCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.dataCallbacks.delete(callback);
    };
  }

  updateConfig(config: Partial<TelemetryConfig>): void {
    this.config = { ...this.config, ...config };

    // If frequency changed and we're running, restart collection
    if (this.isCollecting && config.frequency) {
      const intervalMs = 1000 / this.config.frequency;

      if (this.collectionInterval) {
        clearInterval(this.collectionInterval);
        this.collectionInterval = setInterval(() => {
          this.collectData().catch(error => {
            console.error('Data collection error:', error);
            this.stats.failedCollections++;
          });
        }, intervalMs);
      }
    }
  }

  getStats() {
    const successRate = this.stats.totalCollections > 0
      ? (this.stats.successfulCollections / this.stats.totalCollections) * 100
      : 0;

    return {
      ...this.stats,
      successRate: Math.round(successRate * 100) / 100,
      isRunning: this.isCollecting,
      currentFrequency: this.config.frequency,
    };
  }

  private async collectData(): Promise<void> {
    const startTime = Date.now();
    this.stats.totalCollections++;
    console.log(`Starting data collection #${this.stats.totalCollections}`);

    try {
      // Collect OBD data
      console.log('Collecting OBD data...');
      const obdData = await this.collectOBDData();

      // Calculate derived data
      console.log('Calculating derived data...');
      const calculatedData = this.calculateDerivedData(obdData);

      // Assess data quality
      console.log('Assessing data quality...');
      const dataQuality = this.assessDataQuality(obdData);

      // Determine connection status
      console.log('Getting connection status...');
      const connectionStatus = await this.getConnectionStatus();

      // Create real-time data object
      const realTimeData: RealTimeData = {
        ...obdData,
        calculated: calculatedData,
        connectionStatus,
        dataQuality,
      };

      console.log('Real-time data created:', {
        rpm: realTimeData.rpm,
        speed: realTimeData.speed,
        dataQuality: realTimeData.dataQuality.score,
        callbackCount: this.dataCallbacks.size,
      });

      // Update current data and history
      this.currentData = realTimeData;
      this.addToHistory(realTimeData);

      // Update last valid data for fallbacks
      this.updateLastValidData(obdData);

      // Notify callbacks
      console.log(`Notifying ${this.dataCallbacks.size} callbacks...`);
      this.notifyCallbacks(realTimeData);

      // Update statistics
      this.stats.successfulCollections++;
      const collectionTime = Date.now() - startTime;
      this.updateAverageCollectionTime(collectionTime);

      console.log(`Data collection #${this.stats.totalCollections} completed successfully in ${collectionTime}ms`);

    } catch (error) {
      console.error('Failed to collect telemetry data:', error);
      this.stats.failedCollections++;

      // Try to provide fallback data if enabled
      if (this.config.fallbackEnabled) {
        this.provideFallbackData();
      }
    }
  }

  private async collectOBDData(): Promise<OBDData> {
    const timestamp = new Date();
    const obdData: Partial<OBDData> = { timestamp };

    console.log('Collecting OBD data for PIDs:', this.config.enabledPIDs);

    // Collect data from enabled PIDs
    const pidPromises = this.config.enabledPIDs.map(async (pid) => {
      try {
        const response = await this.obdService.readPID(pid);
        if (response.isValid && response.processedValue !== undefined) {
          this.mapPIDToOBDData(pid, response.processedValue, obdData);
          console.log(`Successfully read PID ${pid}: ${response.processedValue}`);
        }
      } catch (error) {
        console.warn(`Failed to read PID ${pid}:`, error);
        // Try fallback if available
        this.applyFallbackForPID(pid, obdData);
      }
    });

    await Promise.allSettled(pidPromises);

    // Ensure required fields have values (use fallbacks or defaults)
    this.ensureRequiredFields(obdData);

    console.log('Final OBD data:', obdData);
    return obdData as OBDData;
  }

  private mapPIDToOBDData(pid: string, value: number, obdData: Partial<OBDData>): void {
    switch (pid) {
      case OBD_PIDS.ENGINE_RPM:
        obdData.rpm = value;
        break;
      case OBD_PIDS.VEHICLE_SPEED:
        obdData.speed = value;
        break;
      case OBD_PIDS.ENGINE_COOLANT_TEMP:
        obdData.engineTemp = value;
        break;
      case OBD_PIDS.MAF_SENSOR:
        obdData.maf = value;
        break;
      case OBD_PIDS.INTAKE_MAP:
        obdData.map = value;
        break;
      case OBD_PIDS.THROTTLE_POSITION:
        obdData.throttlePosition = value;
        break;
      case OBD_PIDS.FUEL_LEVEL:
        obdData.fuelLevel = value;
        break;
      case OBD_PIDS.ENGINE_LOAD:
        obdData.engineLoad = value;
        break;
      case OBD_PIDS.INTAKE_AIR_TEMP:
        obdData.intakeAirTemp = value;
        break;
      case OBD_PIDS.FUEL_PRESSURE:
        obdData.fuelPressure = value;
        break;
      case OBD_PIDS.TIMING_ADVANCE:
        obdData.timingAdvance = value;
        break;
      default:
        console.warn(`Unknown PID mapping: ${pid}`);
    }
  }

  private applyFallbackForPID(pid: string, obdData: Partial<OBDData>): void {
    if (!this.config.fallbackEnabled) {
      return;
    }

    console.log(`Applying fallback for PID ${pid}`);

    // Use last valid data as fallback
    switch (pid) {
      case OBD_PIDS.ENGINE_RPM:
        if (this.lastValidData.rpm !== undefined) {
          obdData.rpm = this.lastValidData.rpm;
        } else {
          obdData.rpm = 800; // Default idle RPM
        }
        break;
      case OBD_PIDS.VEHICLE_SPEED:
        if (this.lastValidData.speed !== undefined) {
          obdData.speed = this.lastValidData.speed;
        } else {
          obdData.speed = 0; // Default stopped
        }
        break;
      case OBD_PIDS.MAF_SENSOR:
        // Try MAP as fallback for MAF
        if (obdData.map !== undefined) {
          obdData.maf = this.estimateMAFFromMAP(obdData.map, obdData.rpm || 800);
          console.log(`Estimated MAF from MAP: ${obdData.maf}`);
        } else if (this.lastValidData.maf !== undefined) {
          obdData.maf = this.lastValidData.maf;
        } else {
          // Estimate based on RPM and throttle
          obdData.maf = this.estimateMAFFromRPMAndThrottle(obdData.rpm || 800, obdData.throttlePosition || 0);
          console.log(`Estimated MAF from RPM/throttle: ${obdData.maf}`);
        }
        break;
      case OBD_PIDS.INTAKE_MAP:
        // Try MAF as fallback for MAP
        if (obdData.maf !== undefined) {
          obdData.map = this.estimateMAPFromMAF(obdData.maf, obdData.rpm || 800);
          console.log(`Estimated MAP from MAF: ${obdData.map}`);
        } else if (this.lastValidData.map !== undefined) {
          obdData.map = this.lastValidData.map;
        } else {
          obdData.map = 100; // Default atmospheric pressure
        }
        break;
      default:
        // Use last valid data for other PIDs
        const lastValue = this.getLastValidValueForPID(pid);
        if (lastValue !== undefined) {
          this.mapPIDToOBDData(pid, lastValue, obdData);
        }
    }
  }

  private ensureRequiredFields(obdData: Partial<OBDData>): void {
    // Only apply fallbacks if fallback is enabled
    if (!this.config.fallbackEnabled) {
      return;
    }

    // Ensure RPM has a value (required for calculations)
    if (obdData.rpm === undefined) {
      obdData.rpm = this.lastValidData.rpm || 800; // Default idle RPM
    }

    // Ensure speed has a value
    if (obdData.speed === undefined) {
      obdData.speed = this.lastValidData.speed || 0;
    }

    // Ensure engine temp has a value
    if (obdData.engineTemp === undefined) {
      obdData.engineTemp = this.lastValidData.engineTemp || 90; // Normal operating temp
    }

    // Ensure throttle position has a value
    if (obdData.throttlePosition === undefined) {
      obdData.throttlePosition = this.lastValidData.throttlePosition || 0;
    }

    // Try to ensure either MAF or MAP is available for fuel calculations
    if (obdData.maf === undefined && obdData.map === undefined) {
      if (this.lastValidData.maf !== undefined) {
        obdData.maf = this.lastValidData.maf;
      } else if (this.lastValidData.map !== undefined) {
        obdData.map = this.lastValidData.map;
      } else {
        // Estimate based on RPM and throttle position
        obdData.maf = this.estimateMAFFromRPMAndThrottle(obdData.rpm, obdData.throttlePosition);
      }
    }
  }

  private calculateDerivedData(obdData: OBDData): CalculatedData {
    // Calculate fuel flow rate
    const fuelFlow = calculateFuelConsumption(obdData);

    // Calculate instant consumption
    const instantConsumption = obdData.speed > 0
      ? (fuelFlow / obdData.speed) * 100 // L/100km
      : 0;

    // Calculate average consumption from history
    const recentData = this.getDataHistory(60); // Last 60 seconds
    const averageConsumption = this.calculateAverageConsumption(recentData);

    // Calculate efficiency score
    const efficiency = calculateEfficiency(obdData, recentData);

    // Calculate CO2 emissions
    const co2Emission = calculateCO2Emission(fuelFlow);

    return {
      instantConsumption,
      averageConsumption,
      efficiency,
      co2Emission,
      fuelFlow,
    };
  }

  private assessDataQuality(obdData: OBDData): DataQuality {
    const missingPIDs: string[] = [];
    const estimatedValues: string[] = [];
    let score = 100;

    // Check for missing essential PIDs by comparing with enabled PIDs
    this.config.enabledPIDs.forEach(pid => {
      const hasValue = this.hasPIDValue(pid, obdData);
      if (!hasValue) {
        missingPIDs.push(pid);
        score -= 20; // Higher penalty for each missing PID
      }
    });

    // Check if we're missing critical air flow data
    if (obdData.maf === undefined && obdData.map === undefined) {
      estimatedValues.push('fuel_flow');
      score -= 30; // Higher penalty for missing air flow data
    }

    // Check for estimated values (when fallbacks were used)
    if (this.isUsingFallbackData(obdData)) {
      estimatedValues.push('fallback_data');
      score -= 20;
    }

    // Additional penalties for critical missing data
    if (obdData.rpm === undefined) {
      score -= 35;
    }
    if (obdData.speed === undefined) {
      score -= 25;
    }

    // If fallbacks are disabled and we have missing PIDs, penalize more heavily
    if (!this.config.fallbackEnabled && missingPIDs.length > 0) {
      score -= missingPIDs.length * 15; // Additional penalty when fallbacks disabled
    }

    return {
      score: Math.max(0, score),
      missingPIDs,
      estimatedValues,
      lastUpdate: new Date(),
    };
  }

  private hasPIDValue(pid: string, obdData: OBDData): boolean {
    switch (pid) {
      case OBD_PIDS.ENGINE_RPM:
        return obdData.rpm !== undefined;
      case OBD_PIDS.VEHICLE_SPEED:
        return obdData.speed !== undefined;
      case OBD_PIDS.ENGINE_COOLANT_TEMP:
        return obdData.engineTemp !== undefined;
      case OBD_PIDS.MAF_SENSOR:
        return obdData.maf !== undefined;
      case OBD_PIDS.INTAKE_MAP:
        return obdData.map !== undefined;
      case OBD_PIDS.THROTTLE_POSITION:
        return obdData.throttlePosition !== undefined;
      case OBD_PIDS.FUEL_LEVEL:
        return obdData.fuelLevel !== undefined;
      case OBD_PIDS.ENGINE_LOAD:
        return obdData.engineLoad !== undefined;
      default:
        return false;
    }
  }

  private async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      const isConnected = await this.obdService.validateConnection();
      if (isConnected) {
        return 'connected';
      } else {
        return 'disconnected';
      }
    } catch (error) {
      return 'error';
    }
  }

  private addToHistory(data: RealTimeData): void {
    this.dataHistory.push(data);

    // Keep only last 5 minutes of data (300 seconds at 1.5Hz = ~450 records)
    const maxHistorySize = 450;
    if (this.dataHistory.length > maxHistorySize) {
      this.dataHistory = this.dataHistory.slice(-maxHistorySize);
    }
  }

  private updateLastValidData(obdData: OBDData): void {
    // Update last valid values for fallback purposes
    Object.keys(obdData).forEach(key => {
      const value = obdData[key as keyof OBDData];
      if (value !== undefined && value !== null) {
        (this.lastValidData as any)[key] = value;
      }
    });
  }

  private notifyCallbacks(data: RealTimeData): void {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in telemetry callback:', error);
      }
    });
  }

  private updateAverageCollectionTime(collectionTime: number): void {
    if (this.stats.averageCollectionTime === 0) {
      this.stats.averageCollectionTime = collectionTime;
    } else {
      // Exponential moving average
      this.stats.averageCollectionTime =
        (this.stats.averageCollectionTime * 0.9) + (collectionTime * 0.1);
    }
  }

  private provideFallbackData(): void {
    if (!this.currentData) {
      return;
    }

    // Create fallback data based on last known good data
    const fallbackData: RealTimeData = {
      ...this.currentData,
      timestamp: new Date(),
      connectionStatus: 'error',
      dataQuality: {
        score: 30,
        missingPIDs: [...this.config.enabledPIDs], // Spread to create mutable copy
        estimatedValues: ['all_data'],
        lastUpdate: new Date(),
      },
    };

    this.currentData = fallbackData;
    this.notifyCallbacks(fallbackData);
  }

  private resetStats(): void {
    this.stats = {
      totalCollections: 0,
      successfulCollections: 0,
      failedCollections: 0,
      lastCollectionTime: 0,
      averageCollectionTime: 0,
    };
  }

  // Estimation methods for fallback calculations

  private estimateMAFFromMAP(map: number, rpm: number): number {
    // Simplified estimation: MAF ≈ (MAP * RPM * VE) / (R * T)
    // Using typical values for a 2.0L engine
    const engineDisplacement = 2.0; // liters
    const volumetricEfficiency = 0.85; // typical VE

    return (map * rpm * engineDisplacement * volumetricEfficiency) / 120000;
  }

  private estimateMAPFromMAF(maf: number, rpm: number): number {
    // Reverse calculation of above
    const engineDisplacement = 2.0;
    const volumetricEfficiency = 0.85;

    return (maf * 120000) / (rpm * engineDisplacement * volumetricEfficiency);
  }

  private estimateMAFFromRPMAndThrottle(rpm: number, throttlePosition: number): number {
    // Very basic estimation based on RPM and throttle position
    // This is a fallback when no air flow data is available
    const baseMAF = (rpm / 1000) * (throttlePosition / 100) * 15; // g/s
    return Math.max(0.5, Math.min(baseMAF, 200)); // Clamp to reasonable range
  }

  private calculateAverageConsumption(recentData: RealTimeData[]): number {
    if (recentData.length === 0) {
      return 0;
    }

    const totalConsumption = recentData.reduce((sum, data) =>
      sum + data.calculated.instantConsumption, 0
    );

    return totalConsumption / recentData.length;
  }

  private isUsingFallbackData(obdData: OBDData): boolean {
    // Check if any critical data is using fallback values
    // This is a simplified check - in practice you'd track which values are fallbacks
    
    // For now, check if we have very basic data but missing critical PIDs
    const hasCriticalData = obdData.maf !== undefined || obdData.map !== undefined;
    const hasBasicData = obdData.rpm !== undefined && obdData.speed !== undefined;
    
    // If we have basic data but no critical air flow data, we're likely using fallbacks
    return hasBasicData && !hasCriticalData;
  }

  private getLastValidValueForPID(pid: string): number | undefined {
    // Map PID to last valid data field
    switch (pid) {
      case OBD_PIDS.ENGINE_RPM:
        return this.lastValidData.rpm;
      case OBD_PIDS.VEHICLE_SPEED:
        return this.lastValidData.speed;
      case OBD_PIDS.ENGINE_COOLANT_TEMP:
        return this.lastValidData.engineTemp;
      case OBD_PIDS.MAF_SENSOR:
        return this.lastValidData.maf;
      case OBD_PIDS.INTAKE_MAP:
        return this.lastValidData.map;
      case OBD_PIDS.THROTTLE_POSITION:
        return this.lastValidData.throttlePosition;
      case OBD_PIDS.FUEL_LEVEL:
        return this.lastValidData.fuelLevel;
      case OBD_PIDS.ENGINE_LOAD:
        return this.lastValidData.engineLoad;
      default:
        return undefined;
    }
  }
}