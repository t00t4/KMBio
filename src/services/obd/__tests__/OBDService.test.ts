import { OBDService } from '../OBDService';
import { BLEServiceInterface } from '../../../types/ble';
import { OBD_PIDS } from '../../../constants/pids';

// Mock BLE Service
class MockBLEService implements BLEServiceInterface {
  private connected = false;
  private mockResponses: Map<string, string> = new Map();

  constructor() {
    // Setup mock responses for common commands
    this.setupMockResponses();
  }

  private setupMockResponses() {
    // ELM327 initialization responses
    this.mockResponses.set('ATZ\r', 'ELM327 v1.5');
    this.mockResponses.set('ATE0\r', 'OK');
    this.mockResponses.set('ATL0\r', 'OK');
    this.mockResponses.set('ATH0\r', 'OK');
    this.mockResponses.set('ATS0\r', 'OK');
    this.mockResponses.set('ATST32\r', 'OK');
    this.mockResponses.set('ATAT1\r', 'OK');
    this.mockResponses.set('ATSP0\r', 'OK');
    this.mockResponses.set('ATDP\r', 'ISO 9141-2');
    
    // OBD validation
    this.mockResponses.set('0100\r', '4100BE3EA813');
    this.mockResponses.set('010C\r', '410C1AF8'); // RPM: 1726 rpm
    
    // Supported PIDs responses
    this.mockResponses.set('0120\r', '412098180001');
    this.mockResponses.set('0140\r', '414040000000');
    
    // Individual PID responses
    this.mockResponses.set('010D\r', '410D50'); // Speed: 80 km/h
    this.mockResponses.set('0105\r', '410550'); // Coolant temp: 40°C
    this.mockResponses.set('0110\r', '41101F40'); // MAF: 80.0 g/s
    this.mockResponses.set('010B\r', '410B64'); // MAP: 100 kPa
    this.mockResponses.set('0111\r', '411180'); // Throttle: 50.2%
    
    // Vehicle info
    this.mockResponses.set('0902\r', '4902014A484D424D4F434B56494E313233');
    this.mockResponses.set('ATDPN\r', '6');
  }

  async scanForDevices(): Promise<any[]> {
    return [{ id: 'mock-elm327', name: 'ELM327 Mock' }];
  }

  async connectToDevice(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionState(): any {
    return this.connected ? 'connected' : 'disconnected';
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    const response = this.mockResponses.get(command);
    if (response) {
      return response;
    }

    // Default error response for unknown commands
    return 'NO DATA';
  }

  startDataCollection(): void {}
  stopDataCollection(): void {}
  onConnectionStateChange(): void {}
  onDataReceived(): void {}
  onError(): void {}

  // Helper method to add custom responses for testing
  setMockResponse(command: string, response: string) {
    this.mockResponses.set(command, response);
  }
}

describe('OBDService', () => {
  let obdService: OBDService;
  let mockBLEService: MockBLEService;

  beforeEach(() => {
    mockBLEService = new MockBLEService();
    obdService = new OBDService(mockBLEService);
  });

  describe('initialization', () => {
    it('should initialize successfully with mock ELM327', async () => {
      await mockBLEService.connectToDevice('mock-device');
      
      await expect(obdService.initialize()).resolves.not.toThrow();
    });

    it('should throw error if BLE device not connected', async () => {
      await expect(obdService.initialize()).rejects.toThrow('BLE device not connected');
    });

    it('should throw error if device is not ELM327', async () => {
      await mockBLEService.connectToDevice('mock-device');
      mockBLEService.setMockResponse('ATZ\r', 'UNKNOWN DEVICE');
      
      await expect(obdService.initialize()).rejects.toThrow('Device is not responding as ELM327');
    });
  });

  describe('PID support detection', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
      await obdService.initialize();
    });

    it('should discover supported PIDs', async () => {
      const supportedPIDs = await obdService.getSupportedPIDs();
      
      expect(supportedPIDs).toContain(OBD_PIDS.ENGINE_RPM);
      expect(supportedPIDs.length).toBeGreaterThan(0);
    });

    it('should check if specific PID is supported', async () => {
      const isRPMSupported = obdService.isPIDSupported(OBD_PIDS.ENGINE_RPM);
      expect(isRPMSupported).toBe(true);
    });

    it('should return essential PIDs that are supported', async () => {
      const essentialPIDs = obdService.getEssentialPIDs();
      expect(essentialPIDs).toContain(OBD_PIDS.ENGINE_RPM);
    });
  });

  describe('PID reading', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
      await obdService.initialize();
    });

    it('should read RPM PID successfully', async () => {
      const response = await obdService.readPID(OBD_PIDS.ENGINE_RPM);
      
      expect(response.isValid).toBe(true);
      expect(response.pid).toBe(OBD_PIDS.ENGINE_RPM);
      expect(response.processedValue).toBe(1726); // Expected RPM from mock
      expect(response.unit).toBe('rpm');
    });

    it('should read vehicle speed PID successfully', async () => {
      const response = await obdService.readPID(OBD_PIDS.VEHICLE_SPEED);
      
      expect(response.isValid).toBe(true);
      expect(response.processedValue).toBe(80); // Expected speed from mock
      expect(response.unit).toBe('km/h');
    });

    it('should read MAF sensor PID successfully', async () => {
      const response = await obdService.readPID(OBD_PIDS.MAF_SENSOR);
      
      expect(response.isValid).toBe(true);
      expect(response.processedValue).toBe(80.0); // Expected MAF from mock
      expect(response.unit).toBe('g/s');
    });

    it('should throw error for unsupported PID', async () => {
      const unsupportedPID = '01FF'; // Non-existent PID
      
      await expect(obdService.readPID(unsupportedPID)).rejects.toThrow('not supported by vehicle');
    });

    it('should use fallback PID when primary is not available', async () => {
      // First, manually mark MAF as not supported and MAP as supported
      // This simulates the scenario where PID discovery found MAP but not MAF
      const obdServiceAny = obdService as any;
      obdServiceAny.supportedPIDs.set(OBD_PIDS.MAF_SENSOR, { pid: OBD_PIDS.MAF_SENSOR, isSupported: false });
      obdServiceAny.supportedPIDs.set(OBD_PIDS.INTAKE_MAP, { pid: OBD_PIDS.INTAKE_MAP, isSupported: true });
      
      const response = await obdService.readPID(OBD_PIDS.MAF_SENSOR);
      
      // Should fallback to MAP sensor but return with original PID
      expect(response.isValid).toBe(true);
      expect(response.pid).toBe(OBD_PIDS.MAF_SENSOR); // Original PID preserved
      expect(response.description).toContain('fallback');
    });
  });

  describe('multiple PID reading', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
      await obdService.initialize();
    });

    it('should read multiple PIDs successfully', async () => {
      const pids = [OBD_PIDS.ENGINE_RPM, OBD_PIDS.VEHICLE_SPEED, OBD_PIDS.ENGINE_COOLANT_TEMP];
      const responses = await obdService.readMultiplePIDs(pids);
      
      expect(responses).toHaveLength(3);
      expect(responses.every(r => r.isValid)).toBe(true);
    });

    it('should read essential data', async () => {
      const responses = await obdService.readEssentialData();
      
      expect(responses.length).toBeGreaterThan(0);
      expect(responses.every(r => r.isValid)).toBe(true);
    });

    it('should continue with other PIDs if one fails', async () => {
      const pids = [OBD_PIDS.ENGINE_RPM, '01FF', OBD_PIDS.VEHICLE_SPEED]; // Middle PID is invalid
      const responses = await obdService.readMultiplePIDs(pids);
      
      expect(responses).toHaveLength(2); // Should get 2 valid responses
      expect(responses.every(r => r.isValid)).toBe(true);
    });
  });

  describe('response validation', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
      await obdService.initialize();
    });

    it('should validate correct OBD response', async () => {
      const response = await obdService.readPID(OBD_PIDS.ENGINE_RPM);
      const isValid = obdService.validateOBDResponse(response);
      
      expect(isValid).toBe(true);
    });

    it('should detect invalid response values', async () => {
      // Mock an invalid RPM response with wrong length (should be 4 hex chars but only 2)
      mockBLEService.setMockResponse('010C\r', '410CFF'); // Missing one byte
      
      const response = await obdService.readPID(OBD_PIDS.ENGINE_RPM);
      
      // The response should be marked as invalid due to length mismatch
      const isValid = obdService.validateOBDResponse(response);
      expect(isValid).toBe(false); // Validation fails due to length check
    });
  });

  describe('connection validation', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
    });

    it('should validate OBD connection successfully', async () => {
      const isValid = await obdService.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should fail validation with error response', async () => {
      mockBLEService.setMockResponse('0100\r', 'NO DATA');
      
      const isValid = await obdService.validateConnection();
      expect(isValid).toBe(false);
    });
  });

  describe('vehicle information', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
      await obdService.initialize();
    });

    it('should get vehicle information', async () => {
      const info = await obdService.getVehicleInfo();
      
      expect(info).toHaveProperty('protocol');
      expect(info.protocol).toBe('6');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
      await obdService.initialize();
    });

    it('should handle NO DATA response', async () => {
      mockBLEService.setMockResponse('010C\r', 'NO DATA');
      
      await expect(obdService.readPID(OBD_PIDS.ENGINE_RPM)).rejects.toThrow('Error reading PID');
    });

    it('should handle BUS ERROR response', async () => {
      mockBLEService.setMockResponse('010C\r', 'BUS ERROR');
      
      await expect(obdService.readPID(OBD_PIDS.ENGINE_RPM)).rejects.toThrow('Error reading PID');
    });

    it('should handle connection loss during command', async () => {
      // Simulate connection loss
      await mockBLEService.disconnect();
      
      await expect(obdService.readPID(OBD_PIDS.ENGINE_RPM)).rejects.toThrow('BLE device not connected');
    });
  });

  describe('protocol management', () => {
    beforeEach(async () => {
      await mockBLEService.connectToDevice('mock-device');
      await obdService.initialize();
    });

    it('should set protocol successfully', async () => {
      await expect(obdService.setProtocol('CAN_11BIT_500K')).resolves.not.toThrow();
    });

    it('should reset adapter successfully', async () => {
      await expect(obdService.resetAdapter()).resolves.not.toThrow();
    });
  });
});