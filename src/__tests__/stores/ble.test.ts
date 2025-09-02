import { useBLEStore } from '../../stores/ble';
import { BluetoothInitializer } from '../../services/ble/BluetoothInitializer';
import { BLEManager } from '../../services/ble/BLEManager';
import {
  BluetoothInitializationResult,
  BluetoothInitializationError,
  BluetoothCapabilities
} from '../../types/ble/bluetooth-initializer';

// Mock dependencies
jest.mock('../../services/ble/BluetoothInitializer');
jest.mock('../../services/ble/BLEManager');

const MockedBluetoothInitializer = BluetoothInitializer as jest.MockedClass<typeof BluetoothInitializer>;
const MockedBLEManager = BLEManager as jest.MockedClass<typeof BLEManager>;

describe('BLE Store - Initialization Integration', () => {
  let mockInitializer: jest.Mocked<BluetoothInitializer>;
  let mockBLEManager: jest.Mocked<BLEManager>;
  let store: ReturnType<typeof useBLEStore.getState>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state
    useBLEStore.getState().cleanup();
    store = useBLEStore.getState();
    
    // Create mock instances
    mockInitializer = {
      initialize: jest.fn(),
      retry: jest.fn(),
      getInitializationStatus: jest.fn(),
      onInitializationComplete: jest.fn(),
      destroy: jest.fn()
    } as unknown as jest.Mocked<BluetoothInitializer>;

    mockBLEManager = {
      scanForDevices: jest.fn(),
      connectToDevice: jest.fn(),
      disconnect: jest.fn(),
      startDataCollection: jest.fn(),
      stopDataCollection: jest.fn(),
      onConnectionStateChange: jest.fn(),
      onError: jest.fn(),
      destroy: jest.fn()
    } as unknown as jest.Mocked<BLEManager>;

    MockedBluetoothInitializer.mockImplementation(() => mockInitializer);
    MockedBLEManager.mockImplementation(() => mockBLEManager);
  });

  describe('Initial State', () => {
    it('should have correct initial initialization state', () => {
      expect(store.initializationState).toEqual({
        status: 'NOT_STARTED',
        progress: 0,
        recommendations: [],
        isRetrying: false,
        retryCount: 0
      });
      
      expect(store.isInitialized).toBe(false);
      expect(store.bluetoothInitializer).toBeNull();
    });
  });

  describe('Successful Initialization', () => {
    it('should handle successful initialization flow', async () => {
      const mockCapabilities: BluetoothCapabilities = {
        bleSupported: true,
        permissionsGranted: true,
        bluetoothEnabled: true,
        canScan: true,
        canConnect: true
      };

      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: mockCapabilities,
        recommendations: ['Sistema Bluetooth pronto para uso']
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);
      mockInitializer.getInitializationStatus.mockReturnValue('COMPLETED_SUCCESS');

      const initResult = await store.initialize();
      expect(initResult).toEqual(mockResult);

      // Get updated store state
      const updatedStore = useBLEStore.getState();

      // Check initialization state updates
      expect(updatedStore.initializationState.status).toBe('COMPLETED_SUCCESS');
      expect(updatedStore.initializationState.progress).toBe(100);
      expect(updatedStore.initializationState.capabilities).toEqual(mockCapabilities);
      expect(updatedStore.initializationState.recommendations).toEqual(['Sistema Bluetooth pronto para uso']);
      expect(updatedStore.initializationState.error).toBeUndefined();
      expect(updatedStore.isInitialized).toBe(true);
      expect(updatedStore.bleManager).toBeDefined();
    });

    it('should set up BLE Manager event listeners on successful initialization', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true
        },
        recommendations: []
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);

      await store.initialize();

      expect(mockBLEManager.onConnectionStateChange).toHaveBeenCalled();
      expect(mockBLEManager.onError).toHaveBeenCalled();
    });
  });

  describe('Failed Initialization', () => {
    it('should handle initialization failure with error details', async () => {
      const mockError: BluetoothInitializationError = {
        code: 'BLUETOOTH_DISABLED',
        message: 'Bluetooth está desligado',
        technicalDetails: 'Bluetooth state is PoweredOff',
        timestamp: new Date(),
        recoverable: true,
        recoverySteps: ['Ligue o Bluetooth nas configurações'],
        diagnosticInfo: {
          deviceModel: 'Test Device',
          osVersion: '14.0',
          appVersion: '1.0.0',
          bleLibraryVersion: '3.5.0',
          initializationAttempts: 1,
          stateHistory: [],
          permissionHistory: []
        }
      };

      const mockResult: BluetoothInitializationResult = {
        success: false,
        error: mockError,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: false,
          canScan: false,
          canConnect: false
        },
        recommendations: mockError.recoverySteps
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);

      const initResult = await store.initialize();
      expect(initResult).toEqual(mockResult);

      const updatedStore = useBLEStore.getState();
      expect(updatedStore.initializationState.status).toBe('COMPLETED_ERROR');
      expect(updatedStore.initializationState.progress).toBe(0);
      expect(updatedStore.initializationState.error).toEqual(mockError);
      expect(updatedStore.initializationState.capabilities).toEqual(mockResult.capabilities);
      expect(updatedStore.initializationState.recommendations).toEqual(mockError.recoverySteps);
      expect(updatedStore.isInitialized).toBe(false);
      expect(updatedStore.bleManager).toBeNull();
    });

    it('should handle unexpected errors during initialization', async () => {
      const unexpectedError = new Error('Unexpected initialization error');
      mockInitializer.initialize.mockRejectedValue(unexpectedError);

      const initResult = await store.initialize();
      expect(initResult.success).toBe(false);
      expect(initResult.error?.code).toBe('UNKNOWN_ERROR');
      expect(initResult.error?.message).toContain('Falha na inicialização do Bluetooth');

      const updatedStore = useBLEStore.getState();
      expect(updatedStore.initializationState.status).toBe('COMPLETED_ERROR');
      expect(updatedStore.isInitialized).toBe(false);
    });
  });

  describe('Retry Initialization', () => {
    it('should handle successful retry', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true
        },
        recommendations: ['Sistema Bluetooth pronto para uso']
      };

      mockInitializer.retry.mockResolvedValue(mockResult);

      // First set up an initializer
      await store.initialize();

      const retryResult = await store.retryInitialization();
      expect(retryResult).toEqual(mockResult);

      const updatedStore = useBLEStore.getState();
      expect(updatedStore.initializationState.status).toBe('COMPLETED_SUCCESS');
      expect(updatedStore.initializationState.retryCount).toBe(1);
      expect(updatedStore.initializationState.isRetrying).toBe(false);
    });

    it('should create new initializer if none exists during retry', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true
        },
        recommendations: []
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);

      const retryResult = await store.retryInitialization();
      expect(retryResult).toEqual(mockResult);

      expect(MockedBluetoothInitializer).toHaveBeenCalled();
      const updatedStore = useBLEStore.getState();
      expect(updatedStore.bluetoothInitializer).toBeDefined();
    });
  });

  describe('Operations with Initialization Checks', () => {
    it('should prevent scanning when not initialized', async () => {
      await expect(store.scanForDevices()).rejects.toThrow(
        'Sistema Bluetooth não inicializado. Execute a inicialização primeiro.'
      );
    });

    it('should prevent scanning when capabilities are insufficient', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: false,
          bluetoothEnabled: true,
          canScan: false,
          canConnect: false
        },
        recommendations: []
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);

      await store.initialize();

      await expect(store.scanForDevices()).rejects.toThrow(
        'Não é possível escanear dispositivos. Verifique as permissões e o estado do Bluetooth.'
      );
    });

    it('should allow scanning when properly initialized', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true
        },
        recommendations: []
      };

      const mockDevices = [{ id: 'device1', name: 'Test Device' }];
      mockInitializer.initialize.mockResolvedValue(mockResult);
      mockBLEManager.scanForDevices.mockResolvedValue(mockDevices as any);

      await store.initialize();

      const devices = await store.scanForDevices();
      expect(devices).toEqual(mockDevices);
      expect(mockBLEManager.scanForDevices).toHaveBeenCalled();
    });

    it('should prevent connection when not initialized', async () => {
      await expect(store.connectToDevice('device1')).rejects.toThrow(
        'Sistema Bluetooth não inicializado. Execute a inicialização primeiro.'
      );
    });

    it('should prevent connection when capabilities are insufficient', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: false,
          canScan: false,
          canConnect: false
        },
        recommendations: []
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);

      await store.initialize();

      await expect(store.connectToDevice('device1')).rejects.toThrow(
        'Não é possível conectar a dispositivos. Verifique as permissões e o estado do Bluetooth.'
      );
    });
  });

  describe('State Management', () => {
    it('should clear initialization error', () => {
      // Set an error first
      store.updateInitializationState({
        error: {
          code: 'BLUETOOTH_DISABLED',
          message: 'Test error',
          technicalDetails: 'Test',
          timestamp: new Date(),
          recoverable: true,
          recoverySteps: [],
          diagnosticInfo: {} as any
        }
      });

      let updatedStore = useBLEStore.getState();
      expect(updatedStore.initializationState.error).toBeDefined();

      store.clearInitializationError();

      updatedStore = useBLEStore.getState();
      expect(updatedStore.initializationState.error).toBeUndefined();
    });

    it('should update initialization state', () => {
      store.updateInitializationState({
        status: 'IN_PROGRESS',
        progress: 50
      });

      const updatedStore = useBLEStore.getState();
      expect(updatedStore.initializationState.status).toBe('IN_PROGRESS');
      expect(updatedStore.initializationState.progress).toBe(50);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup both BLE manager and initializer', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true
        },
        recommendations: []
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);

      await store.initialize();

      store.cleanup();

      expect(mockBLEManager.destroy).toHaveBeenCalled();
      expect(mockInitializer.destroy).toHaveBeenCalled();
      
      const updatedStore = useBLEStore.getState();
      expect(updatedStore.bleManager).toBeNull();
      expect(updatedStore.bluetoothInitializer).toBeNull();
      expect(updatedStore.isInitialized).toBe(false);
      expect(updatedStore.initializationState.status).toBe('NOT_STARTED');
    });
  });

  describe('Already Initialized Check', () => {
    it('should return success immediately if already initialized', async () => {
      const mockResult: BluetoothInitializationResult = {
        success: true,
        capabilities: {
          bleSupported: true,
          permissionsGranted: true,
          bluetoothEnabled: true,
          canScan: true,
          canConnect: true
        },
        recommendations: []
      };

      mockInitializer.initialize.mockResolvedValue(mockResult);
      mockInitializer.getInitializationStatus.mockReturnValue('COMPLETED_SUCCESS');

      // First initialization
      await store.initialize();

      // Reset mock call count
      mockInitializer.initialize.mockClear();

      // Second initialization should not call initializer again
      const secondResult = await store.initialize();
      expect(secondResult.success).toBe(true);

      expect(mockInitializer.initialize).not.toHaveBeenCalled();
    });
  });
});