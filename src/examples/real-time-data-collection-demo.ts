/**
 * Real-time Data Collection Demo
 * 
 * This example demonstrates the complete real-time data collection system
 * including TelemetryService, Trip Store integration, and consumption calculations.
 */

import { TelemetryService } from '../services/telemetry/TelemetryService';
import { OBDService } from '../services/obd/OBDService';
import { BLEManager } from '../services/ble/BLEManager';
import { useTripStore } from '../stores/trip';
import { OBD_PIDS } from '../constants/pids';

// Mock BLE Manager for demonstration
class MockBLEManager {
  private connected = true;
  private mockResponses: Record<string, string> = {
    // ELM327 initialization responses
    'ATZ\r': 'ELM327 v1.5',
    'ATE0\r': 'OK',
    'ATL0\r': 'OK',
    'ATS0\r': 'OK',
    'ATH0\r': 'OK',
    'ATSP0\r': 'OK',
    'ATAT1\r': 'OK',
    
    // OBD-II responses (Mode 01 responses)
    '010C\r': '41 0C 1F 40', // RPM: 2000 RPM
    '010D\r': '41 0D 3C',    // Speed: 60 km/h
    '0105\r': '41 05 5A',    // Engine temp: 90°C
    '0110\r': '41 10 0F A0', // MAF: 15.5 g/s
    '010B\r': '41 0B 64',    // MAP: 100 kPa
    '0111\r': '41 11 80',    // Throttle: 50%
    '0100\r': '41 00 BE 3F A8 13', // Supported PIDs 01-20
  };

  async scanForDevices() {
    return [{ id: 'mock-elm327', name: 'ELM327 Mock', rssi: -45 }];
  }

  async connectToDevice(deviceId: string) {
    console.log(`Mock BLE: Connected to ${deviceId}`);
    this.connected = true;
  }

  async disconnect() {
    console.log('Mock BLE: Disconnected');
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async sendCommand(command: string): Promise<string> {
    console.log(`Mock BLE TX: ${command.trim()}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    const response = this.mockResponses[command] || 'NO DATA';
    console.log(`Mock BLE RX: ${response}`);
    
    return response;
  }

  // Simulate dynamic data changes
  updateMockData(updates: Record<string, string>) {
    Object.assign(this.mockResponses, updates);
  }
}

/**
 * Demonstrates basic real-time data collection setup
 */
export async function demonstrateBasicDataCollection() {
  console.log('\n=== Basic Real-time Data Collection Demo ===\n');

  // 1. Initialize services
  const mockBLE = new MockBLEManager();
  const obdService = new OBDService(mockBLE as any);
  const telemetryService = new TelemetryService(obdService);

  try {
    // 2. Connect to device
    await mockBLE.connectToDevice('mock-elm327');
    
    // 3. Initialize OBD service
    console.log('Initializing OBD service...');
    await obdService.initialize();
    
    // 4. Set up data collection callback
    let dataCount = 0;
    const unsubscribe = telemetryService.onDataUpdate((data) => {
      dataCount++;
      console.log(`\n--- Data Collection #${dataCount} ---`);
      console.log(`Timestamp: ${data.timestamp.toISOString()}`);
      console.log(`RPM: ${data.rpm} rpm`);
      console.log(`Speed: ${data.speed} km/h`);
      console.log(`Engine Temp: ${data.engineTemp}°C`);
      console.log(`MAF: ${data.maf} g/s`);
      console.log(`Throttle: ${data.throttlePosition}%`);
      console.log(`Instant Consumption: ${data.calculated.instantConsumption.toFixed(2)} L/100km`);
      console.log(`Average Consumption: ${data.calculated.averageConsumption.toFixed(2)} L/100km`);
      console.log(`Efficiency Score: ${data.calculated.efficiency.toFixed(1)}/100`);
      console.log(`Data Quality: ${data.dataQuality.score}/100`);
      console.log(`Connection Status: ${data.connectionStatus}`);
      
      if (data.dataQuality.missingPIDs.length > 0) {
        console.log(`Missing PIDs: ${data.dataQuality.missingPIDs.join(', ')}`);
      }
      
      if (data.dataQuality.estimatedValues.length > 0) {
        console.log(`Estimated Values: ${data.dataQuality.estimatedValues.join(', ')}`);
      }
    });

    // 5. Start data collection at 1.5 Hz
    console.log('Starting telemetry collection at 1.5 Hz...');
    await telemetryService.start({
      frequency: 1.5,
      enabledPIDs: [
        OBD_PIDS.ENGINE_RPM,
        OBD_PIDS.VEHICLE_SPEED,
        OBD_PIDS.ENGINE_COOLANT_TEMP,
        OBD_PIDS.MAF_SENSOR,
        OBD_PIDS.THROTTLE_POSITION,
      ],
      fallbackEnabled: true,
      qualityThreshold: 70,
    });

    // 6. Let it run for a few seconds
    console.log('Collecting data for 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 7. Show statistics
    const stats = telemetryService.getStats();
    console.log('\n--- Collection Statistics ---');
    console.log(`Total Collections: ${stats.totalCollections}`);
    console.log(`Successful: ${stats.successfulCollections}`);
    console.log(`Failed: ${stats.failedCollections}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Average Collection Time: ${stats.averageCollectionTime.toFixed(1)}ms`);

    // 8. Show data history
    const history = telemetryService.getDataHistory(5);
    console.log(`\nData History (last 5 seconds): ${history.length} records`);

    // 9. Clean up
    unsubscribe();
    await telemetryService.stop();
    await mockBLE.disconnect();

    console.log('\nBasic demo completed successfully!');

  } catch (error) {
    console.error('Demo failed:', error);
    throw error;
  }
}

/**
 * Demonstrates fallback behavior when PIDs are not available
 */
export async function demonstrateFallbackBehavior() {
  console.log('\n=== Fallback Behavior Demo ===\n');

  const mockBLE = new MockBLEManager();
  const obdService = new OBDService(mockBLE as any);
  const telemetryService = new TelemetryService(obdService);

  try {
    await mockBLE.connectToDevice('mock-elm327');
    await obdService.initialize();

    // Remove MAF sensor from mock responses to test fallback
    mockBLE.updateMockData({
      '0110\r': 'NO DATA', // MAF not available
    });

    let dataCount = 0;
    const unsubscribe = telemetryService.onDataUpdate((data) => {
      dataCount++;
      console.log(`\n--- Fallback Data #${dataCount} ---`);
      console.log(`RPM: ${data.rpm} rpm`);
      console.log(`Speed: ${data.speed} km/h`);
      console.log(`MAF: ${data.maf ? data.maf + ' g/s' : 'Not available'}`);
      console.log(`MAP: ${data.map ? data.map + ' kPa' : 'Not available'}`);
      console.log(`Fuel Flow: ${data.calculated.fuelFlow.toFixed(2)} L/h`);
      console.log(`Data Quality: ${data.dataQuality.score}/100`);
      
      if (data.dataQuality.missingPIDs.length > 0) {
        console.log(`Missing PIDs: ${data.dataQuality.missingPIDs.join(', ')}`);
      }
      
      if (data.dataQuality.estimatedValues.length > 0) {
        console.log(`Using Fallbacks: ${data.dataQuality.estimatedValues.join(', ')}`);
      }
    });

    console.log('Starting collection with MAF unavailable (will use MAP fallback)...');
    await telemetryService.start({
      frequency: 1,
      enabledPIDs: [
        OBD_PIDS.ENGINE_RPM,
        OBD_PIDS.VEHICLE_SPEED,
        OBD_PIDS.MAF_SENSOR, // This will fail
        OBD_PIDS.INTAKE_MAP,  // This will be used as fallback
      ],
      fallbackEnabled: true,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Now remove MAP as well to test RPM/throttle estimation
    console.log('\nRemoving MAP as well - will use RPM/throttle estimation...');
    mockBLE.updateMockData({
      '010B\r': 'NO DATA', // MAP also not available
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    unsubscribe();
    await telemetryService.stop();
    await mockBLE.disconnect();

    console.log('\nFallback demo completed!');

  } catch (error) {
    console.error('Fallback demo failed:', error);
    throw error;
  }
}

/**
 * Demonstrates integration with Trip Store
 */
export async function demonstrateTripIntegration() {
  console.log('\n=== Trip Store Integration Demo ===\n');

  const mockBLE = new MockBLEManager();
  const obdService = new OBDService(mockBLE as any);
  const telemetryService = new TelemetryService(obdService);

  try {
    await mockBLE.connectToDevice('mock-elm327');
    await obdService.initialize();

    // Get trip store instance
    const tripStore = useTripStore.getState();

    // Start a trip
    console.log('Starting trip...');
    await tripStore.startTrip('vehicle-123', telemetryService);

    // Monitor trip data
    let updateCount = 0;
    const unsubscribe = useTripStore.subscribe(
      (state) => state.realTimeData,
      (realTimeData) => {
        if (realTimeData) {
          updateCount++;
          console.log(`\n--- Trip Update #${updateCount} ---`);
          console.log(`Trip ID: ${tripStore.currentTrip?.id}`);
          console.log(`Trip Active: ${tripStore.isActive}`);
          console.log(`Current Speed: ${realTimeData.speed} km/h`);
          console.log(`Current RPM: ${realTimeData.rpm} rpm`);
          console.log(`Instant Consumption: ${realTimeData.calculated.instantConsumption.toFixed(2)} L/100km`);
          
          const stats = tripStore.tripStatistics;
          console.log(`Total Distance: ${stats.totalDistance.toFixed(2)} km`);
          console.log(`Average Speed: ${stats.averageSpeed.toFixed(1)} km/h`);
          console.log(`Fuel Consumed: ${stats.fuelConsumed.toFixed(3)} L`);
          console.log(`Efficiency Score: ${stats.efficiencyScore.toFixed(1)}/100`);
          
          if (tripStore.tripEvents.length > 0) {
            const lastEvent = tripStore.tripEvents[tripStore.tripEvents.length - 1];
            console.log(`Last Event: ${lastEvent.type} (${lastEvent.severity})`);
          }
        }
      }
    );

    // Simulate driving scenario
    console.log('\nSimulating driving scenario...');
    
    // Phase 1: Acceleration
    console.log('\nPhase 1: Accelerating...');
    mockBLE.updateMockData({
      '010C\r': '41 0C 2E E0', // RPM: 3000 RPM
      '010D\r': '41 0D 50',    // Speed: 80 km/h
      '0111\r': '41 11 CC',    // Throttle: 80%
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Phase 2: Cruising
    console.log('\nPhase 2: Cruising...');
    mockBLE.updateMockData({
      '010C\r': '41 0C 1F 40', // RPM: 2000 RPM
      '010D\r': '41 0D 50',    // Speed: 80 km/h
      '0111\r': '41 11 66',    // Throttle: 40%
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Phase 3: Deceleration
    console.log('\nPhase 3: Decelerating...');
    mockBLE.updateMockData({
      '010C\r': '41 0C 0F A0', // RPM: 1000 RPM
      '010D\r': '41 0D 1E',    // Speed: 30 km/h
      '0111\r': '41 11 33',    // Throttle: 20%
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stop trip
    console.log('\nStopping trip...');
    await tripStore.stopTrip();

    // Show trip summary
    const finalTrip = tripStore.currentTrip;
    if (finalTrip) {
      console.log('\n--- Trip Summary ---');
      console.log(`Trip Duration: ${finalTrip.duration} seconds`);
      console.log(`Total Distance: ${finalTrip.distance.toFixed(2)} km`);
      console.log(`Average Speed: ${finalTrip.averageSpeed.toFixed(1)} km/h`);
      console.log(`Max Speed: ${finalTrip.maxSpeed} km/h`);
      console.log(`Average RPM: ${finalTrip.averageRPM.toFixed(0)} rpm`);
      console.log(`Max RPM: ${finalTrip.maxRPM} rpm`);
      console.log(`Average Consumption: ${finalTrip.averageConsumption.toFixed(2)} L/100km`);
      console.log(`Total Events: ${finalTrip.events.length}`);
      
      const summary = finalTrip.summary;
      console.log(`Fuel Consumed: ${summary.totalFuelConsumed.toFixed(3)} L`);
      console.log(`CO2 Emissions: ${summary.co2Emissions.toFixed(2)} kg`);
      console.log(`Estimated Cost: R$ ${summary.costEstimate.toFixed(2)}`);
      console.log(`Efficiency Score: ${summary.averageEfficiency.toFixed(1)}/100`);
    }

    unsubscribe();
    await mockBLE.disconnect();

    console.log('\nTrip integration demo completed!');

  } catch (error) {
    console.error('Trip integration demo failed:', error);
    throw error;
  }
}

/**
 * Demonstrates background mode and frequency adjustment
 */
export async function demonstrateBackgroundMode() {
  console.log('\n=== Background Mode Demo ===\n');

  const mockBLE = new MockBLEManager();
  const obdService = new OBDService(mockBLE as any);
  const telemetryService = new TelemetryService(obdService);

  try {
    await mockBLE.connectToDevice('mock-elm327');
    await obdService.initialize();

    let dataCount = 0;
    const startTime = Date.now();
    
    const unsubscribe = telemetryService.onDataUpdate((data) => {
      dataCount++;
      const elapsed = (Date.now() - startTime) / 1000;
      const actualFreq = dataCount / elapsed;
      
      console.log(`Data #${dataCount} (${elapsed.toFixed(1)}s) - Freq: ${actualFreq.toFixed(2)} Hz`);
    });

    // Start in normal mode (1.5 Hz)
    console.log('Starting in normal mode (1.5 Hz)...');
    await telemetryService.start({ frequency: 1.5 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Switch to background mode (0.5 Hz)
    console.log('\nSwitching to background mode (0.5 Hz)...');
    telemetryService.updateConfig({ frequency: 0.5 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Switch back to foreground mode (2 Hz)
    console.log('\nSwitching to high frequency mode (2 Hz)...');
    telemetryService.updateConfig({ frequency: 2 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const stats = telemetryService.getStats();
    console.log('\n--- Final Statistics ---');
    console.log(`Total Collections: ${stats.totalCollections}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Current Frequency: ${stats.currentFrequency} Hz`);

    unsubscribe();
    await telemetryService.stop();
    await mockBLE.disconnect();

    console.log('\nBackground mode demo completed!');

  } catch (error) {
    console.error('Background mode demo failed:', error);
    throw error;
  }
}

/**
 * Run all demonstrations
 */
export async function runAllDemos() {
  console.log('🚗 KMBio Real-time Data Collection System Demo');
  console.log('='.repeat(50));

  try {
    await demonstrateBasicDataCollection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await demonstrateFallbackBehavior();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await demonstrateTripIntegration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await demonstrateBackgroundMode();

    console.log('\n🎉 All demos completed successfully!');
    console.log('\nThe real-time data collection system is working correctly with:');
    console.log('✅ Configurable frequency (1-2 Hz)');
    console.log('✅ MAF/MAP based fuel consumption calculations');
    console.log('✅ Fallback strategies for missing PIDs');
    console.log('✅ Real-time trip data management');
    console.log('✅ Background mode optimization');
    console.log('✅ Data quality assessment');
    console.log('✅ Event detection and logging');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    throw error;
  }
}

// Export for use in other files
export {
  MockBLEManager,
};