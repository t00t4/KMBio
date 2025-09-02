import { BLEManager } from '../../../services/ble/BLEManager';
import { BluetoothInitializer } from '../../../services/ble/BluetoothInitializer';
import { BleManager, State } from 'react-native-ble-plx';

// Mock dependencies
jest.mock('react-native-ble-plx');
jest.mock('../../../services/ble/BluetoothInitializer');

const MockedBleManager = BleManager as jest.MockedClass<typeof BleManager>;
const MockedBluetoothInitializer = BluetoothInitializer as jest.MockedClass<typeof BluetoothInitializer>;

describe('BLEManager Unit Tests', () => {
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

  describe('Constructor and Initialization', () => {
    it('should create BLEManager instance with default configuration', () => {
      bleManager = new BLEManager();

      expect(MockedBluetoothInitializer).toHaveBeenCalledTimes(1);
      expect(mockBluetoothInitializer.onInitializationComplete).toHaveBeenCalledWith(
        expect.any(Function)
      );

      const state = bleManager.getConnectionState();
      expect(state).toMatchObject({
        isScanning: false,
        isConnecting: false,
        isConnected: false,
        availableDevices: [],
        connectionAttempts: 0,
        initializationStatus: 'IN_PROGRESS', // Initialization starts automatically
      });
    });

    it('should create BLEManager instance with custom configuration', () => {
      const customConfig = {
        scanTimeoutMs: 15000,
        connectionTimeoutMs: 8000,
        maxReconnectAttempts: 5,
        enableAutoReconnect: false,
      };

      bleManager = new BLEManager(customConfig);

      expect(MockedBluetoothInitializer).toHaveBeenCalledTimes(1);
      expect(bleManager).toBeDefined();
    });

    it('should start initialization automatically', async () => {
      bleManager = new BLEManager();

      // Wait for initialization to be called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockBluetoothInitializer.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection State Management', () => {
    beforeEach(() => {
      bleManager = new BLEManager();
    });

    it('should return current connection state', () => {
      const state = bleManager.getConnectionState();

      expect(state).toHaveProperty('isScanning');
      expect(state).toHaveProperty('isConnecting');
      expect(state).toHaveProperty('isConnected');
      expect(state).toHaveProperty('availableDevices');
      expect(state).toHaveProperty('connectionAttempts');
      expect(state).toHaveProperty('initializationStatus');
    });

    it('should return false for isConnected initially', () => {
      expect(bleManager.isConnected()).toBe(false);
    });

    it('should emit connection state changes', async () => {
      const stateCallback = jest.fn();
      bleManager.onConnectionStateChange(stateCallback);

      // Simulate initialization completion to trigger state change
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

      expect(stateCallback).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      bleManager = new BLEManager();
    });

    it('should emit errors through error callback', async () => {
      const errorCallback = jest.fn();
      bleManager.onError(errorCallback);

      // Simulate initialization failure
      const initCallback = mockBluetoothInitializer.onInitializationComplete.mock.calls[0][0];
      initCallback({
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

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'BLUETOOTH_DISABLED',
          message: 'Bluetooth está desligado',
        })
      );
    });
  });

  describe('Data Collection', () => {
    beforeEach(() => {
      bleManager = new BLEManager();
    });

    it('should start data collection', () => {
      const dataCallback = jest.fn();
      bleManager.onDataReceived(dataCallback);

      expect(() => bleManager.startDataCollection(1)).not.toThrow();
    });

    it('should stop data collection', () => {
      bleManager.startDataCollection(1);
      expect(() => bleManager.stopDataCollection()).not.toThrow();
    });
  });

  describe('New Initialization Methods', () => {
    beforeEach(() => {
      bleManager = new BLEManager();
    });

    it('should return initialization status', () => {
      mockBluetoothInitializer.getInitializationStatus.mockReturnValue('COMPLETED_SUCCESS');

      const status = bleManager.getInitializationStatus();
      expect(status).toBe('COMPLETED_SUCCESS');
    });

    it('should return initialization result after completion', () => {
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
  });

  describe('Cleanup', () => {
    it('should cleanup all resources on destroy', () => {
      bleManager = new BLEManager();

      bleManager.destroy();

      expect(mockBluetoothInitializer.destroy).toHaveBeenCalledTimes(1);
      expect(bleManager.getInitializationResult()).toBeNull();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain all original BLEManager methods', () => {
      bleManager = new BLEManager();

      // Verify all original methods exist
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

    it('should maintain original callback behavior', () => {
      bleManager = new BLEManager();

      const stateCallback = jest.fn();
      const dataCallback = jest.fn();
      const errorCallback = jest.fn();

      expect(() => bleManager.onConnectionStateChange(stateCallback)).not.toThrow();
      expect(() => bleManager.onDataReceived(dataCallback)).not.toThrow();
      expect(() => bleManager.onError(errorCallback)).not.toThrow();
    });

    it('should work with existing configuration format', () => {
      const config = {
        scanTimeoutMs: 20000,
        connectionTimeoutMs: 10000,
        maxReconnectAttempts: 2,
        reconnectDelayMs: [2000, 5000],
        enableAutoReconnect: true,
      };

      expect(() => {
        bleManager = new BLEManager(config);
      }).not.toThrow();

      expect(bleManager).toBeDefined();
    });
  });
});