import { OBDService } from '../OBDService';
import { BLEServiceInterface } from '../../../types/ble';
import { OBD_PIDS } from '../../../constants/pids';
import { parseVehicleData, detectDrivingEvents, calculateFuelConsumptionFromMAF } from '../../../utils/obd-calculations';

// Enhanced Mock BLE Service for integration testing
class IntegrationMockBLEService implements BLEServiceInterface {
  private connected = false;
  private mockResponses: Map<string, string> = new Map();

  constructor() {
    this.setupRealisticResponses();
  }

  private setupRealisticResponses() {
    // ELM327 initialization
    this.mockResponses.set('ATZ\r', 'ELM327 v1.5');
    this.mockResponses.set('ATE0\r', 'OK');
    this.mockResponses.set('ATL0\r', 'OK');
    this.mockResponses.set('ATH0\r', 'OK');
    this.mockResponses.set('ATS0\r', 'OK');
    this.mockResponses.set('ATST32\r', 'OK');
    this.mockResponses.set('ATAT1\r', 'OK');
    this.mockResponses.set('ATSP0\r', 'OK');
    this.mockResponses.set('ATDP\r', 'CAN 11/500');
    
    // PID support discovery
    this.mockResponses.set('0100\r', '4100BE3EA813'); // PIDs 01-20 supported
    this.mockResponses.set('0120\r', '412098180001'); // PIDs 21-40 supported
    this.mockResponses.set('0140\r', '414040000000'); // PIDs 41-60 supported
    
    // Realistic driving scenario: City driving
    this.mockResponses.set('010C\r', '410C0BB8'); // RPM: 750 rpm (idle)
    this.mockResponses.set('010D\r', '410D00');   // Speed: 0 km/h (stopped)
    this.mockResponses.set('0105\r', '41055A');   // Coolant: 50°C (normal)
    this.mockResponses.set('0110\r', '41100A28'); // MAF: 26.0 g/s (idle)
    this.mockResponses.set('010B\r', '410B32');   // MAP: 50 kPa (idle)
    this.mockResponses.set('0111\r', '411110');   // Throttle: 6.3% (idle)
  }

  // Simulate driving scenario changes
  simulateDrivingScenario(scenario: 'idle' | 'acceleration' | 'highway' | 'harsh_braking') {
    switch (scenario) {
      case 'idle':
        this.mockResponses.set('010C\r', '410C0BB8'); // 750 rpm
        this.mockResponses.set('010D\r', '410D00');   // 0 km/h
        this.mockResponses.set('0110\r', '41100A28'); // 26.0 g/s
        this.mockResponses.set('0111\r', '411110');   // 6.3%
        break;
      
      case 'acceleration':
        this.mockResponses.set('010C\r', '410C1770'); // 1500 rpm
        this.mockResponses.set('010D\r', '410D32');   // 50 km/h
        this.mockResponses.set('0110\r', '41101F40'); // 80.0 g/s
        this.mockResponses.set('0111\r', '411180');   // 50.2%
        break;
      
      case 'highway':
        this.mockResponses.set('010C\r', '410C0FA0'); // 1000 rpm
        this.mockResponses.set('010D\r', '410D78');   // 120 km/h
        this.mockResponses.set('0110\r', '41101388'); // 50.0 g/s
        this.mockResponses.set('0111\r', '411140');   // 25.1%
        break;
      
      case 'harsh_braking':
        this.mockResponses.set('010C\r', '410C0C80'); // 800 rpm
        this.mockResponses.set('010D\r', '410D1E');   // 30 km/h (rapid deceleration)
        this.mockResponses.set('0110\r', '41100640'); // 16.0 g/s
        this.mockResponses.set('0111\r', '411100');   // 0% (no throttle)
        break;
    }
  }

  async scanForDevices(): Promise<any[]> {
    return [{ 
      id: 'elm327-integration', 
      name: 'ELM327 Test Device',
      rssi: -45,
      isConnectable: true
    }];
  }

  async connectToDevice(deviceId?: string): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionState(): any {
    return {
      isScanning: false,
      isConnecting: false,
      isConnected: this.connected,
      availableDevices: [],
      connectionAttempts: 0
    };
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    const response = this.mockResponses.get(command);
    if (response) {
      return response;
    }

    return 'NO DATA';
  }

  startDataCollection(): void {}
  stopDataCollection(): void {}
  onConnectionStateChange(): void {}
  onDataReceived(): void {}
  onError(): void {}
}

describe('OBD Integration Tests', () => {
  let obdService: OBDService;
  let mockBLEService: IntegrationMockBLEService;

  beforeEach(async () => {
    mockBLEService = new IntegrationMockBLEService();
    obdService = new OBDService(mockBLEService);
    
    // Connect and initialize
    await mockBLEService.connectToDevice('elm327-integration');
    await obdService.initialize();
  });

  describe('Complete OBD workflow', () => {
    it('should complete full initialization and data collection workflow', async () => {
      // 1. Verify initialization completed successfully
      expect(obdService).toBeDefined();
      
      // 2. Check supported PIDs were discovered
      const supportedPIDs = await obdService.getSupportedPIDs();
      expect(supportedPIDs.length).toBeGreaterThan(0);
      expect(supportedPIDs).toContain(OBD_PIDS.ENGINE_RPM);
      
      // 3. Read essential data
      const essentialData = await obdService.readEssentialData();
      expect(essentialData.length).toBeGreaterThan(0);
      expect(essentialData.every(r => r.isValid)).toBe(true);
      
      // 4. Parse to vehicle data structure
      const vehicleData = parseVehicleData(essentialData);
      expect(vehicleData.rpm).toBeDefined();
      expect(vehicleData.speed).toBeDefined();
    });

    it('should handle different driving scenarios', async () => {
      // Test idle scenario
      mockBLEService.simulateDrivingScenario('idle');
      const idleData = await obdService.readEssentialData();
      const idleVehicleData = parseVehicleData(idleData);
      
      expect(idleVehicleData.rpm).toBe(750);
      expect(idleVehicleData.speed).toBe(0);
      
      // Test acceleration scenario
      mockBLEService.simulateDrivingScenario('acceleration');
      const accelData = await obdService.readEssentialData();
      const accelVehicleData = parseVehicleData(accelData);
      
      expect(accelVehicleData.rpm).toBe(1500);
      expect(accelVehicleData.speed).toBe(50);
      
      // Test highway scenario
      mockBLEService.simulateDrivingScenario('highway');
      const highwayData = await obdService.readEssentialData();
      const highwayVehicleData = parseVehicleData(highwayData);
      
      expect(highwayVehicleData.rpm).toBe(1000);
      expect(highwayVehicleData.speed).toBe(120);
    });

    it('should calculate fuel consumption from real data', async () => {
      // Test with acceleration scenario (higher MAF)
      mockBLEService.simulateDrivingScenario('acceleration');
      const responses = await obdService.readEssentialData();
      const vehicleData = parseVehicleData(responses);
      
      if (vehicleData.maf) {
        const fuelConsumption = calculateFuelConsumptionFromMAF(vehicleData.maf, 'gasoline');
        expect(fuelConsumption).toBeGreaterThan(0);
        expect(fuelConsumption).toBeLessThan(50); // Reasonable range for L/h
      }
    });

    it('should detect driving events', async () => {
      // Start with idle
      mockBLEService.simulateDrivingScenario('idle');
      const idleData = parseVehicleData(await obdService.readEssentialData());
      
      // Simulate acceleration
      mockBLEService.simulateDrivingScenario('acceleration');
      const accelData = parseVehicleData(await obdService.readEssentialData());
      
      // Detect events between idle and acceleration
      const events = detectDrivingEvents(accelData, idleData, 1000);
      
      // Should detect acceleration event (speed change from 0 to 50 km/h)
      const accelerationEvent = events.find(e => e.type === 'harsh_acceleration');
      expect(accelerationEvent).toBeDefined();
      expect(accelerationEvent?.value).toBeGreaterThan(0);
    });

    it('should handle PID reading errors gracefully', async () => {
      // Try to read a PID that returns NO DATA
      const unsupportedPID = '01FF';
      
      await expect(obdService.readPID(unsupportedPID)).rejects.toThrow();
      
      // But other PIDs should still work
      const rpmResponse = await obdService.readPID(OBD_PIDS.ENGINE_RPM);
      expect(rpmResponse.isValid).toBe(true);
    });

    it('should validate all responses correctly', async () => {
      const responses = await obdService.readEssentialData();
      
      for (const response of responses) {
        const isValid = obdService.validateOBDResponse(response);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Real-time data collection simulation', () => {
    it('should simulate continuous data collection', async () => {
      const collectedData: any[] = [];
      const scenarios = ['idle', 'acceleration', 'highway', 'harsh_braking'] as const;
      
      // Simulate collecting data over different scenarios
      for (const scenario of scenarios) {
        mockBLEService.simulateDrivingScenario(scenario);
        
        const responses = await obdService.readEssentialData();
        const vehicleData = parseVehicleData(responses);
        
        collectedData.push({
          scenario,
          timestamp: new Date(),
          data: vehicleData,
        });
      }
      
      expect(collectedData).toHaveLength(4);
      
      // Verify data progression makes sense
      const idleRPM = collectedData.find(d => d.scenario === 'idle')?.data.rpm;
      const accelRPM = collectedData.find(d => d.scenario === 'acceleration')?.data.rpm;
      const highwayRPM = collectedData.find(d => d.scenario === 'highway')?.data.rpm;
      
      expect(accelRPM).toBeGreaterThan(idleRPM);
      expect(highwayRPM).toBeGreaterThan(idleRPM);
    });
  });
});