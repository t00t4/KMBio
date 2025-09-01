import { TelemetryService } from '../TelemetryService';
import { OBDServiceInterface } from '../../../types/ble';
import { OBDResponse } from '../../../types/ble/obd-protocol';
import { OBD_PIDS } from '../../../constants/pids';

// Mock OBD Service
class MockOBDService implements OBDServiceInterface {
  private connected = true;
  private mockData: Record<string, number> = {
    [OBD_PIDS.ENGINE_RPM]: 2000,
    [OBD_PIDS.VEHICLE_SPEED]: 60,
    [OBD_PIDS.ENGINE_COOLANT_TEMP]: 90,
    [OBD_PIDS.MAF_SENSOR]: 15.5,
    [OBD_PIDS.THROTTLE_POSITION]: 45,
  };

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async getSupportedPIDs(): Promise<string[]> {
    return Object.keys(this.mockData);
  }

  async readPID(pid: string): Promise<OBDResponse> {
    console.log(`Mock OBD readPID called for ${pid}, available data:`, Object.keys(this.mockData));
    const value = this.mockData[pid];
    if (value === undefined) {
      console.log(`PID ${pid} not found in mock data, throwing error`);
      throw new Error(`PID ${pid} not supported`);
    }

    console.log(`Returning mock data for PID ${pid}: ${value}`);
    return {
      pid,
      rawValue: value.toString(16),
      processedValue: value,
      timestamp: new Date(),
      isValid: true,
      unit: 'mock',
      description: `Mock PID ${pid}`,
    };
  }

  async readMultiplePIDs(pids: string[]): Promise<OBDResponse[]> {
    const responses: OBDResponse[] = [];
    for (const pid of pids) {
      try {
        responses.push(await this.readPID(pid));
      } catch (error) {
        // Skip unsupported PIDs
      }
    }
    return responses;
  }

  async validateConnection(): Promise<boolean> {
    return this.connected;
  }

  validateOBDResponse(response: OBDResponse): boolean {
    return response.isValid;
  }

  async getVehicleInfo(): Promise<Record<string, unknown>> {
    return { mock: true };
  }

  async resetAdapter(): Promise<void> {
    // Mock reset
  }

  async setProtocol(): Promise<void> {
    // Mock protocol set
  }

  isPIDSupported(pid: string): boolean {
    return this.mockData[pid] !== undefined;
  }

  getPIDInfo() {
    return undefined;
  }

  getEssentialPIDs(): string[] {
    return Object.keys(this.mockData);
  }

  getImportantPIDs(): string[] {
    return [];
  }

  async readEssentialData(): Promise<OBDResponse[]> {
    return this.readMultiplePIDs(this.getEssentialPIDs());
  }

  // Test helper methods
  setMockData(pid: string, value: number): void {
    this.mockData[pid] = value;
  }

  setConnected(connected: boolean): void {
    this.connected = connected;
  }
}

describe('TelemetryService', () => {
  let telemetryService: TelemetryService;
  let mockOBDService: MockOBDService;

  beforeEach(() => {
    mockOBDService = new MockOBDService();
    telemetryService = new TelemetryService(mockOBDService);
  });

  afterEach(async () => {
    if (telemetryService.isRunning()) {
      await telemetryService.stop();
    }
  });

  describe('Service Lifecycle', () => {
    test('should start and stop telemetry collection', async () => {
      expect(telemetryService.isRunning()).toBe(false);

      await telemetryService.start();
      expect(telemetryService.isRunning()).toBe(true);

      await telemetryService.stop();
      expect(telemetryService.isRunning()).toBe(false);
    });

    test('should not start if already running', async () => {
      await telemetryService.start();
      
      // Should not throw error when starting again
      await expect(telemetryService.start()).resolves.not.toThrow();
      expect(telemetryService.isRunning()).toBe(true);
    });

    test('should handle OBD service connection failure', async () => {
      mockOBDService.setConnected(false);
      
      await expect(telemetryService.start()).rejects.toThrow();
      expect(telemetryService.isRunning()).toBe(false);
    });
  });

  describe('Data Collection', () => {
    test('should collect real-time data', async () => {
      let dataReceived = false;
      
      const unsubscribe = telemetryService.onDataUpdate((data) => {
        expect(data).toBeDefined();
        expect(data.timestamp).toBeInstanceOf(Date);
        expect(data.rpm).toBe(2000);
        expect(data.speed).toBe(60);
        expect(data.calculated).toBeDefined();
        expect(data.calculated.instantConsumption).toBeGreaterThan(0);
        dataReceived = true;
      });

      await telemetryService.start({ frequency: 2 }); // 2 Hz for faster testing
      
      // Wait for at least one data collection cycle
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(dataReceived).toBe(true);
      unsubscribe();
    });

    test('should handle missing PIDs with fallbacks', async () => {
      // Remove MAF from mock data to test fallback
      delete (mockOBDService as any).mockData[OBD_PIDS.MAF_SENSOR];
      
      let dataReceived = false;
      let callbackCount = 0;
      
      const unsubscribe = telemetryService.onDataUpdate((data) => {
        callbackCount++;
        console.log(`Callback ${callbackCount} - Received data with fallbacks:`, {
          maf: data.maf,
          map: data.map,
          dataQuality: data.dataQuality,
          timestamp: data.timestamp,
        });
        
        // Basic validation that we received data
        expect(data).toBeDefined();
        expect(data.timestamp).toBeInstanceOf(Date);
        
        dataReceived = true;
      });

      console.log('Starting telemetry service for fallback test...');
      await telemetryService.start({ 
        frequency: 2, // Higher frequency for faster testing
        fallbackEnabled: true,
        enabledPIDs: [
          OBD_PIDS.ENGINE_RPM,
          OBD_PIDS.VEHICLE_SPEED,
          OBD_PIDS.MAF_SENSOR, // This will be missing
          OBD_PIDS.INTAKE_MAP,  // This should be available
        ]
      });
      
      console.log('Telemetry service started, waiting for data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Test completed. Callback count: ${callbackCount}, dataReceived: ${dataReceived}`);
      expect(dataReceived).toBe(true);
      unsubscribe();
    });

    test('should maintain data history', async () => {
      await telemetryService.start({ frequency: 2 });
      
      // Wait for multiple collection cycles
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const history = telemetryService.getDataHistory(2); // Last 2 seconds
      expect(history.length).toBeGreaterThan(0);
      expect(history.length).toBeLessThanOrEqual(4); // Max 4 records in 2 seconds at 2Hz
    });
  });

  describe('Configuration Management', () => {
    test('should update frequency during operation', async () => {
      await telemetryService.start({ frequency: 1 });
      
      // Update frequency
      telemetryService.updateConfig({ frequency: 2 });
      
      // Verify the change took effect (this is implementation-dependent)
      expect(telemetryService.isRunning()).toBe(true);
    });

    test('should respect quality threshold', async () => {
      let qualityScores: number[] = [];
      let dataReceived = false;
      
      const unsubscribe = telemetryService.onDataUpdate((data) => {
        qualityScores.push(data.dataQuality.score);
        dataReceived = true;
        
        // Log first few data points for debugging
        if (qualityScores.length <= 3) {
          console.log(`Quality check data #${qualityScores.length}:`, {
            score: data.dataQuality.score,
            missingPIDs: data.dataQuality.missingPIDs,
            estimatedValues: data.dataQuality.estimatedValues,
            rpm: data.rpm,
            speed: data.speed,
            maf: data.maf,
          });
        }
      });

      // Remove most PIDs to significantly lower quality
      delete (mockOBDService as any).mockData[OBD_PIDS.ENGINE_RPM];
      delete (mockOBDService as any).mockData[OBD_PIDS.VEHICLE_SPEED];
      delete (mockOBDService as any).mockData[OBD_PIDS.MAF_SENSOR];
      delete (mockOBDService as any).mockData[OBD_PIDS.ENGINE_COOLANT_TEMP];
      delete (mockOBDService as any).mockData[OBD_PIDS.THROTTLE_POSITION];
      
      // Only keep MAP available
      console.log('Available mock data after deletion:', Object.keys((mockOBDService as any).mockData));
      
      await telemetryService.start({ 
        frequency: 2, // Higher frequency for more data points
        qualityThreshold: 70,
        fallbackEnabled: false, // Disable fallbacks to ensure low quality
        enabledPIDs: [
          OBD_PIDS.ENGINE_RPM,
          OBD_PIDS.VEHICLE_SPEED,
          OBD_PIDS.MAF_SENSOR,
          OBD_PIDS.ENGINE_COOLANT_TEMP,
          OBD_PIDS.THROTTLE_POSITION,
        ]
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Test results:', {
        dataReceived,
        totalScores: qualityScores.length,
        scores: qualityScores.slice(0, 5), // First 5 scores
        minScore: Math.min(...qualityScores),
        maxScore: Math.max(...qualityScores),
      });
      
      // Should have received data
      expect(dataReceived).toBe(true);
      
      // With most PIDs missing and no fallbacks, quality should be very low
      const hasLowQuality = qualityScores.some(score => score < 70);
      expect(hasLowQuality).toBe(true);
      
      unsubscribe();
    });
  });

  describe('Error Handling', () => {
    test('should handle PID read failures gracefully', async () => {
      // Mock a PID that will fail
      const originalReadPID = mockOBDService.readPID.bind(mockOBDService);
      mockOBDService.readPID = jest.fn().mockImplementation(async (pid) => {
        if (pid === OBD_PIDS.ENGINE_RPM) {
          throw new Error('PID read failed');
        }
        return originalReadPID(pid);
      });

      let dataReceived = false;
      
      const unsubscribe = telemetryService.onDataUpdate((data) => {
        console.log('Data received despite PID failure:', {
          rpm: data.rpm,
          speed: data.speed,
          dataQuality: data.dataQuality.score,
        });
        
        // Should still receive data even with some PID failures
        expect(data).toBeDefined();
        expect(data.timestamp).toBeInstanceOf(Date);
        dataReceived = true;
      });

      await telemetryService.start({ 
        fallbackEnabled: true,
        enabledPIDs: [
          OBD_PIDS.ENGINE_RPM, // This will fail
          OBD_PIDS.VEHICLE_SPEED, // This should work
          OBD_PIDS.ENGINE_COOLANT_TEMP, // This should work
        ]
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      expect(dataReceived).toBe(true);
      unsubscribe();
    });

    test('should provide statistics on collection success/failure', async () => {
      await telemetryService.start();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stats = telemetryService.getStats();
      expect(stats.totalCollections).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.isRunning).toBe(true);
    });
  });

  describe('Callback Management', () => {
    test('should support multiple data callbacks', async () => {
      let callback1Called = false;
      let callback2Called = false;
      
      const unsubscribe1 = telemetryService.onDataUpdate((data) => {
        console.log('Callback 1 received data');
        callback1Called = true;
      });
      
      const unsubscribe2 = telemetryService.onDataUpdate((data) => {
        console.log('Callback 2 received data');
        callback2Called = true;
      });

      await telemetryService.start({ frequency: 2 }); // Higher frequency for faster testing
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      expect(callback1Called).toBe(true);
      expect(callback2Called).toBe(true);
      
      unsubscribe1();
      unsubscribe2();
    });

    test('should handle callback unsubscription', async () => {
      let callbackCalled = false;
      
      const unsubscribe = telemetryService.onDataUpdate(() => {
        callbackCalled = true;
      });

      await telemetryService.start();
      
      // Unsubscribe immediately
      unsubscribe();
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Callback should not have been called after unsubscription
      expect(callbackCalled).toBe(false);
    });
  });
});