/**
 * Example usage of the TelemetryService for real-time data collection
 * 
 * This example demonstrates:
 * 1. Setting up telemetry service with OBD service
 * 2. Starting data collection with custom configuration
 * 3. Handling real-time data updates
 * 4. Managing trip lifecycle with the trip store
 */

import { TelemetryService } from '../services/telemetry';
import { OBDService } from '../services/obd';
import { BLEManager } from '../services/ble';
import { useTripStore } from '../stores/trip';
import { OBD_PIDS } from '../constants/pids';

// Example: Basic telemetry setup and usage
export async function basicTelemetryExample() {
  console.log('=== Basic Telemetry Example ===');
  
  try {
    // 1. Initialize BLE and OBD services
    const bleManager = new BLEManager();
    const obdService = new OBDService(bleManager);
    
    // 2. Create telemetry service
    const telemetryService = new TelemetryService(obdService);
    
    // 3. Configure telemetry for real-time collection (1.5 Hz as per requirements)
    const telemetryConfig = {
      frequency: 1.5, // 1.5 Hz
      enabledPIDs: [
        OBD_PIDS.ENGINE_RPM,
        OBD_PIDS.VEHICLE_SPEED,
        OBD_PIDS.ENGINE_COOLANT_TEMP,
        OBD_PIDS.MAF_SENSOR,
        OBD_PIDS.INTAKE_MAP,
        OBD_PIDS.THROTTLE_POSITION,
      ],
      fallbackEnabled: true,
      qualityThreshold: 70,
    };
    
    // 4. Set up data callback to handle real-time updates
    const unsubscribe = telemetryService.onDataUpdate((realTimeData) => {
      console.log('Real-time data received:', {
        timestamp: realTimeData.timestamp,
        rpm: realTimeData.rpm,
        speed: realTimeData.speed,
        consumption: realTimeData.calculated.instantConsumption,
        efficiency: realTimeData.calculated.efficiency,
        connectionStatus: realTimeData.connectionStatus,
        dataQuality: realTimeData.dataQuality.score,
      });
      
      // Check for alerts based on data
      if (realTimeData.rpm > 3000) {
        console.log('⚠️ High RPM detected:', realTimeData.rpm);
      }
      
      if (realTimeData.calculated.efficiency < 50) {
        console.log('⚠️ Low efficiency detected:', realTimeData.calculated.efficiency);
      }
      
      if (realTimeData.dataQuality.score < 70) {
        console.log('⚠️ Low data quality:', realTimeData.dataQuality);
      }
    });
    
    // 5. Start telemetry collection
    await telemetryService.start(telemetryConfig);
    console.log('Telemetry service started successfully');
    
    // 6. Run for 10 seconds then stop
    setTimeout(async () => {
      await telemetryService.stop();
      unsubscribe();
      
      // Show final statistics
      const stats = telemetryService.getStats();
      console.log('Final telemetry statistics:', stats);
      
      // Show data history
      const history = telemetryService.getDataHistory(10);
      console.log(`Collected ${history.length} data points in 10 seconds`);
    }, 10000);
    
  } catch (error) {
    console.error('Telemetry example failed:', error);
  }
}

// Example: Trip management with telemetry
export async function tripManagementExample() {
  console.log('=== Trip Management Example ===');
  
  try {
    // 1. Get trip store instance
    const { startTrip, stopTrip, updateTelemetryConfig, setBackgroundMode } = useTripStore.getState();
    
    // 2. Set up services
    const bleManager = new BLEManager();
    const obdService = new OBDService(bleManager);
    const telemetryService = new TelemetryService(obdService);
    
    // 3. Configure for trip mode
    updateTelemetryConfig({
      frequency: 1.5, // Standard frequency
      enabledPIDs: [
        OBD_PIDS.ENGINE_RPM,
        OBD_PIDS.VEHICLE_SPEED,
        OBD_PIDS.ENGINE_COOLANT_TEMP,
        OBD_PIDS.MAF_SENSOR,
        OBD_PIDS.THROTTLE_POSITION,
      ],
      fallbackEnabled: true,
      qualityThreshold: 60, // Lower threshold for trip mode
    });
    
    // 4. Start a trip
    const vehicleId = 'vehicle_123';
    await startTrip(vehicleId, telemetryService);
    console.log('Trip started successfully');
    
    // 5. Subscribe to trip store updates
    const unsubscribe = useTripStore.subscribe(
      (state) => state.realTimeData,
      (realTimeData) => {
        if (realTimeData) {
          console.log('Trip data update:', {
            speed: realTimeData.speed,
            consumption: realTimeData.calculated.instantConsumption,
            efficiency: realTimeData.calculated.efficiency,
          });
        }
      }
    );
    
    // 6. Simulate background mode after 5 seconds
    setTimeout(() => {
      console.log('Switching to background mode...');
      setBackgroundMode(true); // Reduces frequency to 0.5 Hz
    }, 5000);
    
    // 7. Stop trip after 15 seconds
    setTimeout(async () => {
      console.log('Stopping trip...');
      await stopTrip();
      unsubscribe();
      
      // Show trip summary
      const { currentTrip, tripStatistics } = useTripStore.getState();
      console.log('Trip completed:', {
        duration: currentTrip?.duration,
        distance: tripStatistics.totalDistance,
        averageConsumption: tripStatistics.averageConsumption,
        efficiency: tripStatistics.efficiencyScore,
      });
    }, 15000);
    
  } catch (error) {
    console.error('Trip management example failed:', error);
  }
}

// Example: Handling fallbacks when PIDs are not available
export async function fallbackHandlingExample() {
  console.log('=== Fallback Handling Example ===');
  
  try {
    const bleManager = new BLEManager();
    const obdService = new OBDService(bleManager);
    const telemetryService = new TelemetryService(obdService);
    
    // Configure with fallbacks enabled
    const config = {
      frequency: 1,
      enabledPIDs: [
        OBD_PIDS.ENGINE_RPM,
        OBD_PIDS.VEHICLE_SPEED,
        OBD_PIDS.MAF_SENSOR, // This might not be available
        OBD_PIDS.INTAKE_MAP,  // This will be used as fallback
      ],
      fallbackEnabled: true,
      qualityThreshold: 50, // Lower threshold to accept fallback data
    };
    
    const unsubscribe = telemetryService.onDataUpdate((data) => {
      console.log('Data with fallbacks:', {
        rpm: data.rpm,
        speed: data.speed,
        maf: data.maf,
        map: data.map,
        fuelFlow: data.calculated.fuelFlow,
        dataQuality: data.dataQuality.score,
        estimatedValues: data.dataQuality.estimatedValues,
        missingPIDs: data.dataQuality.missingPIDs,
      });
      
      // Log when fallbacks are being used
      if (data.dataQuality.estimatedValues.length > 0) {
        console.log('🔄 Using fallback calculations for:', data.dataQuality.estimatedValues);
      }
    });
    
    await telemetryService.start(config);
    
    // Run for 8 seconds
    setTimeout(async () => {
      await telemetryService.stop();
      unsubscribe();
      console.log('Fallback example completed');
    }, 8000);
    
  } catch (error) {
    console.error('Fallback handling example failed:', error);
  }
}

// Example: Performance monitoring and statistics
export async function performanceMonitoringExample() {
  console.log('=== Performance Monitoring Example ===');
  
  try {
    const bleManager = new BLEManager();
    const obdService = new OBDService(bleManager);
    const telemetryService = new TelemetryService(obdService);
    
    // High frequency for performance testing
    const config = {
      frequency: 2, // 2 Hz
      enabledPIDs: [
        OBD_PIDS.ENGINE_RPM,
        OBD_PIDS.VEHICLE_SPEED,
        OBD_PIDS.ENGINE_COOLANT_TEMP,
        OBD_PIDS.MAF_SENSOR,
        OBD_PIDS.THROTTLE_POSITION,
      ],
      fallbackEnabled: true,
      qualityThreshold: 80,
    };
    
    let dataCount = 0;
    const startTime = Date.now();
    
    const unsubscribe = telemetryService.onDataUpdate((data) => {
      dataCount++;
      
      // Log every 10th data point
      if (dataCount % 10 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const actualFrequency = dataCount / elapsed;
        
        console.log(`Performance check #${dataCount}:`, {
          targetFrequency: config.frequency,
          actualFrequency: actualFrequency.toFixed(2),
          dataQuality: data.dataQuality.score,
          connectionStatus: data.connectionStatus,
        });
      }
    });
    
    await telemetryService.start(config);
    
    // Monitor for 12 seconds
    setTimeout(async () => {
      await telemetryService.stop();
      unsubscribe();
      
      const finalStats = telemetryService.getStats();
      const elapsed = (Date.now() - startTime) / 1000;
      
      console.log('Performance monitoring results:', {
        ...finalStats,
        actualDuration: elapsed,
        targetDataPoints: config.frequency * elapsed,
        actualDataPoints: dataCount,
        efficiency: (dataCount / (config.frequency * elapsed)) * 100,
      });
    }, 12000);
    
  } catch (error) {
    console.error('Performance monitoring example failed:', error);
  }
}

// Export all examples for easy testing
export const telemetryExamples = {
  basic: basicTelemetryExample,
  tripManagement: tripManagementExample,
  fallbackHandling: fallbackHandlingExample,
  performanceMonitoring: performanceMonitoringExample,
};

// Run all examples (uncomment to test)
// export async function runAllExamples() {
//   await basicTelemetryExample();
//   await new Promise(resolve => setTimeout(resolve, 2000));
//   
//   await tripManagementExample();
//   await new Promise(resolve => setTimeout(resolve, 2000));
//   
//   await fallbackHandlingExample();
//   await new Promise(resolve => setTimeout(resolve, 2000));
//   
//   await performanceMonitoringExample();
// }