import { BLEManager } from '../../../services/ble/BLEManager';
import { BluetoothInitializer } from '../../../services/ble/BluetoothInitializer';
import { PermissionsManager } from '../../../utils/permissions';
import { BluetoothUtils } from '../../../utils/bluetooth';
import { BleManager, State } from 'react-native-ble-plx';

// Mock dependencies
jest.mock('react-native-ble-plx');
jest.mock('../../../services/ble/BluetoothInitializer');
jest.mock('../../../utils/permissions');
jest.mock('../../../utils/bluetooth');

const MockedBleManager = BleManager as jest.MockedClass<typeof BleManager>;
const MockedBluetoothInitializer = BluetoothInitializer as jest.MockedClass<typeof BluetoothInitializer>;
const MockedPermissionsManager = PermissionsManager as jest.Mocked<typeof PermissionsManager>;
const MockedBluetoothUtils = BluetoothUtils as jest.Mocked<typeof BluetoothUtils>;

describe('BLEManager Integration with BluetoothInitializer', () => {
  let bleManager: BLEManager;
  let mockBleManagerInstance: jest.Mocked<BleManager>;
  let mockBluetoothInitializer: jest.Mocked<BluetoothInitializer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup BleManager mock
    mockBleManagerInstance = {
      state: jest.fn(),
      onStateChange: jest.fn(),
      startDeviceScan: jest.fn(),
      stopDeviceScan: jest.fn(),
      connectToDevice: jest.fn(),
      cancelDeviceConnection: jest.fn(),
      destroy: jest.fn(),
    } as any;

    MockedBleManager.mockImplementation(() => mockBleManagerInstance);

    // Setup BluetoothInitializer mock
    mockBluetoothInitializer = {
      initialize: jest.fn(),
      retry: jest.fn(),
      getInitializationStatus: jest.fn(),
      onInitializationComplete: jest.fn(),
      destroy: jest.fn(),
    } as any;

    MockedBluetoothInitializer.mockImplementation(() => mockBluetoothInitializer);

    // Setup default successful initialization
    mockBluetoothInitializer.initialize.mockResolvedValue({
      success: true,
      capabilities: {
        bleSupported: true,
        permissionsGranted: true,
        bluetoothEnabled: true,
        canScan: true,
        canConnect: true,
      },
      recommendations: ['Sistema Bluetooth pronto para uso'],
    });

    mockBluetoothInitializer.getInitializationStatus.mockReturnValue('COMPLETED_SUCCESS');
    mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as State);
  });

  afterEach(() => {
    if (bleManager) {
      bleManager.destroy();
    }
  });

  describe('Initialization Integration', () => {
    it('should use BluetoothInitializer for initialization', async () => {
      bleManager = new BLEManager();

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(MockedBluetoothInitializer).toHaveBeenCalledTimes(1);
      expect(mockBluetoothInitializer.initialize).toHaveBeenCalledTimes(1);
      expect(mockBluetoothInitializer.onInitializationComplete).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should update connection state during initialization', async () => {
      const stateCallback = jest.fn();
      
      bleManager = new BLEManager();
      bleManager.onConnectionStateChange(stateCallback);

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(stateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          initializationStatus: expect.any(String),
        })
      );
    });

    it('should handle successful initialization', async () => {
      bleManager = new BLEManager();

      // Simulate initialization completion
      const initCallback = mockBluetoothInitializer.onInitializationComplete.mock.calls[0][0];
      initCallback({
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true,
        },
        recommendations: ['Sistema Bluetooth pronto para uso'],
      });

      const state = bleManager.getConnectionState();
      expect(state.initializationStatus).toBe('COMPLETED_SUCCESS');
    });

    it('should handle initialization failure', async () => {
      const errorCallback = jest.fn();
      
      mockBluetoothInitializer.initialize.mockResolvedValue({
        success: false,
        error: {
          code: 'BLUETOOTH_DISABLED',
          message: 'Bluetooth está desligado',
          technicalDetails: 'Bluetooth state is PoweredOff',
          timestamp: new Date(),
          recoverable: true,
          recoverySteps: ['Ligue o Bluetooth'],
          diagnosticInfo: {} as any,
        },
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: false,
          canScan: false,
          canConnect: false,
        },
        recommendations: ['Ligue o Bluetooth'],
      });

      bleManager = new BLEManager();
      bleManager.onError(errorCallback);

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'BLUETOOTH_DISABLED',
          message: 'Bluetooth está desligado',
        })
      );

      const state = bleManager.getConnectionState();
      expect(state.initializationStatus).toBe('COMPLETED_ERROR');
    });
  });

  describe('Scanning Integration', () => {
    beforeEach(async () => {
      bleManager = new BLEManager();
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should ensure initialization before scanning', async () => {
      mockBluetoothInitializer.getInitializationStatus.mockReturnValue('NOT_STARTED');
      
      const scanPromise = bleManager.scanForDevices(1000);

      // Should trigger re-initialization
      expect(mockBluetoothInitializer.initialize).toHaveBeenCalledTimes(2); // Once in constructor, once in ensureInitialized

      // Complete the scan
      setTimeout(() => {
        mockBleManagerInstance.stopDeviceScan.mockImplementation(() => {});
      }, 100);

      await expect(scanPromise).rejects.toThrow();
    });

    it('should wait for ongoing initialization before scanning', async () => {
      mockBluetoothInitializer.getInitializationStatus
        .mockReturnValueOnce('IN_PROGRESS')
        .mockReturnValueOnce('IN_PROGRESS')
        .mockReturnValue('COMPLETED_SUCCESS');

      const scanPromise = bleManager.scanForDevices(1000);

      // Should wait for initialization to complete
      setTimeout(() => {
        mockBleManagerInstance.stopDeviceScan.mockImplementation(() => {});
      }, 100);

      await expect(scanPromise).rejects.toThrow();
    });

    it('should scan successfully after initialization', async () => {
      mockBluetoothInitializer.getInitializationStatus.mockReturnValue('COMPLETED_SUCCESS');
      
      // Mock successful scan
      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => {
          callback(null, {
            id: 'test-device',
            name: 'ELM327',
            rssi: -50,
            isConnectable: true,
          } as any);
        }, 50);
      });

      const devicesPromise = bleManager.scanForDevices(1000);

      // Stop scan after timeout
      setTimeout(() => {
        mockBleManagerInstance.stopDeviceScan.mockImplementation(() => {});
      }, 100);

      const devices = await devicesPromise;
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('ELM327');
    });
  });

  describe('Connection Integration', () => {
    beforeEach(async () => {
      bleManager = new BLEManager();
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should ensure initialization before connecting', async () => {
      mockBluetoothInitializer.getInitializationStatus.mockReturnValue('NOT_STARTED');
      
      await expect(bleManager.connectToDevice('test-device')).rejects.toThrow();
      
      // Should trigger re-initialization
      expect(mockBluetoothInitializer.initialize).toHaveBeenCalledTimes(2);
    });

    it('should connect successfully after initialization', async () => {
      mockBluetoothInitializer.getInitializationStatus.mockReturnValue('COMPLETED_SUCCESS');
      
      const mockDevice = {
        id: 'test-device',
        name: 'ELM327',
        rssi: -50,
        discoverAllServicesAndCharacteristics: jest.fn().mockResolvedValue(undefined),
        onDisconnected: jest.fn(),
      };

      mockBleManagerInstance.connectToDevice.mockResolvedValue(mockDevice as any);

      await bleManager.connectToDevice('test-device');

      expect(mockBleManagerInstance.connectToDevice).toHaveBeenCalledWith(
        'test-device',
        { timeout: 5000 }
      );

      const state = bleManager.getConnectionState();
      expect(state.isConnected).toBe(true);
      expect(state.connectedDevice?.id).toBe('test-device');
    });
  });

  describe('Retry Mechanism', () => {
    beforeEach(async () => {
      bleManager = new BLEManager();
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should retry initialization when requested', async () => {
      const retryResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true,
        },
        recommendations: ['Sistema Bluetooth pronto para uso'],
      };

      mockBluetoothInitializer.retry.mockResolvedValue(retryResult);

      const result = await bleManager.retryInitialization();

      expect(mockBluetoothInitializer.retry).toHaveBeenCalledTimes(1);
      expect(result).toEqual(retryResult);
    });

    it('should update state during retry', async () => {
      const stateCallback = jest.fn();
      bleManager.onConnectionStateChange(stateCallback);

      mockBluetoothInitializer.retry.mockResolvedValue({
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true,
        },
        recommendations: ['Sistema Bluetooth pronto para uso'],
      });

      await bleManager.retryInitialization();

      expect(stateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          initializationStatus: 'RETRYING',
        })
      );
    });
  });

  describe('Status and Result Access', () => {
    beforeEach(async () => {
      bleManager = new BLEManager();
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return initialization status', () => {
      mockBluetoothInitializer.getInitializationStatus.mockReturnValue('COMPLETED_SUCCESS');

      const status = bleManager.getInitializationStatus();
      expect(status).toBe('COMPLETED_SUCCESS');
      expect(mockBluetoothInitializer.getInitializationStatus).toHaveBeenCalledTimes(1);
    });

    it('should return initialization result', () => {
      const mockResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true,
        },
        recommendations: ['Sistema Bluetooth pronto para uso'],
      };

      // Simulate initialization completion
      const initCallback = mockBluetoothInitializer.onInitializationComplete.mock.calls[0][0];
      initCallback(mockResult);

      const result = bleManager.getInitializationResult();
      expect(result).toEqual(mockResult);
    });
  });

  describe('Cleanup Integration', () => {
    it('should cleanup BluetoothInitializer on destroy', () => {
      bleManager = new BLEManager();
      
      bleManager.destroy();

      expect(mockBluetoothInitializer.destroy).toHaveBeenCalledTimes(1);
    });

    it('should reset initialization state on destroy', () => {
      bleManager = new BLEManager();
      
      // Set some initialization result
      const initCallback = mockBluetoothInitializer.onInitializationComplete.mock.calls[0][0];
      initCallback({
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true,
        },
        recommendations: ['Sistema Bluetooth pronto para uso'],
      });

      expect(bleManager.getInitializationResult()).not.toBeNull();

      bleManager.destroy();

      expect(bleManager.getInitializationResult()).toBeNull();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing BLEManager interface', () => {
      bleManager = new BLEManager();

      // Test that all original methods are still available
      expect(typeof bleManager.scanForDevices).toBe('function');
      expect(typeof bleManager.connectToDevice).toBe('function');
      expect(typeof bleManager.disconnect).toBe('function');
      expect(typeof bleManager.isConnected).toBe('function');
      expect(typeof bleManager.getConnectionState).toBe('function');
      expect(typeof bleManager.sendCommand).toBe('function');
      expect(typeof bleManager.startDataCollection).toBe('function');
      expect(typeof bleManager.stopDataCollection).toBe('function');
      expect(typeof bleManager.onConnectionStateChange).toBe('function');
      expect(typeof bleManager.onDataReceived).toBe('function');
      expect(typeof bleManager.onError).toBe('function');
    });

    it('should work with existing configuration options', () => {
      const config = {
        scanTimeoutMs: 15000,
        connectionTimeoutMs: 8000,
        maxReconnectAttempts: 5,
        enableAutoReconnect: false,
      };

      bleManager = new BLEManager(config);

      const connectionState = bleManager.getConnectionState();
      expect(connectionState).toBeDefined();
    });

    it('should emit connection state changes as before', async () => {
      const stateCallback = jest.fn();
      
      bleManager = new BLEManager();
      bleManager.onConnectionStateChange(stateCallback);

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(stateCallback).toHaveBeenCalled();
      
      // Verify the state structure includes both old and new fields
      const lastCall = stateCallback.mock.calls[stateCallback.mock.calls.length - 1][0];
      expect(lastCall).toHaveProperty('isScanning');
      expect(lastCall).toHaveProperty('isConnecting');
      expect(lastCall).toHaveProperty('isConnected');
      expect(lastCall).toHaveProperty('availableDevices');
      expect(lastCall).toHaveProperty('connectionAttempts');
      expect(lastCall).toHaveProperty('initializationStatus'); // New field
    });
  });
});