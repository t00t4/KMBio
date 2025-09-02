import { BluetoothInitializer } from '../../../services/ble/BluetoothInitializer';
import { PermissionsManager } from '../../../utils/permissions';
import { BluetoothUtils } from '../../../utils/bluetooth';
import { BleManager } from 'react-native-ble-plx';

// Mock dependencies
jest.mock('../../../utils/permissions');
jest.mock('../../../utils/bluetooth');
jest.mock('react-native-ble-plx');

const mockPermissionsManager = PermissionsManager as jest.Mocked<typeof PermissionsManager>;
const mockBluetoothUtils = BluetoothUtils as jest.Mocked<typeof BluetoothUtils>;
const mockBleManager = BleManager as jest.MockedClass<typeof BleManager>;

describe('BluetoothInitializer', () => {
  let initializer: BluetoothInitializer;
  let mockBleManagerInstance: jest.Mocked<BleManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock BLE Manager instance
    mockBleManagerInstance = {
      state: jest.fn(),
      startDeviceScan: jest.fn().mockImplementation((_, __, callback) => {
        // Default successful implementation
        setTimeout(() => callback && callback(null, null), 10);
        return Promise.resolve();
      }),
      stopDeviceScan: jest.fn(),
      destroy: jest.fn(),
    } as any;
    
    mockBleManager.mockImplementation(() => mockBleManagerInstance);
    
    initializer = new BluetoothInitializer();
  });

  afterEach(() => {
    initializer.destroy();
  });

  describe('initialize', () => {
    it('should successfully initialize when all conditions are met', async () => {
      // Setup successful mocks
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockPermissionsManager.requestBLEPermissions.mockResolvedValue({ granted: true });
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);

      // Mock successful scan test
      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        // Simulate successful scan start
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      const result = await initializer.initialize();

      expect(result.success).toBe(true);
      expect(result.capabilities.bleSupported).toBe(true);
      expect(result.capabilities.permissionsGranted).toBe(true);
      expect(result.capabilities.bluetoothEnabled).toBe(true);
      expect(result.capabilities.canScan).toBe(true);
      expect(result.capabilities.canConnect).toBe(true);
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_SUCCESS');
    });

    it('should fail when BLE is not supported', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(false);

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BLUETOOTH_NOT_SUPPORTED');
      expect(result.error?.recoverable).toBe(false);
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_ERROR');
    });

    it('should fail when permissions are denied', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: false });
      mockPermissionsManager.requestBLEPermissions.mockResolvedValue({ 
        granted: false, 
        shouldShowRationale: true 
      });

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSIONS_DENIED');
      expect(result.error?.recoverable).toBe(true);
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_ERROR');
    });

    it('should fail when permissions are permanently denied', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: false });
      mockPermissionsManager.requestBLEPermissions.mockResolvedValue({ 
        granted: false, 
        shouldShowRationale: false 
      });

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSIONS_NEVER_ASK_AGAIN');
      expect(result.error?.recoverable).toBe(false);
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_ERROR');
    });

    it('should fail when Bluetooth is disabled', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOff' as any);

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BLUETOOTH_DISABLED');
      expect(result.error?.recoverable).toBe(true);
      expect(result.error?.recoverySteps).toContain('Ligue o Bluetooth nas configurações do dispositivo');
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_ERROR');
    });

    it('should fail when BLE Manager initialization fails', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManager.mockImplementation(() => {
        throw new Error('BLE Manager creation failed');
      });

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BLE_MANAGER_INIT_FAILED');
      expect(result.error?.recoverable).toBe(true);
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_ERROR');
    });

    it('should handle Bluetooth state "Resetting" by waiting and retrying', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });

      // First call returns Resetting, second call returns PoweredOn
      mockBleManagerInstance.state
        .mockResolvedValueOnce('Resetting' as any)
        .mockResolvedValueOnce('PoweredOn' as any);

      // Mock successful scan test
      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      const result = await initializer.initialize();

      expect(result.success).toBe(true);
      expect(mockBleManagerInstance.state).toHaveBeenCalledTimes(2);
    });

    it('should handle scan functionality test failure', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });

      // Mock scan failure
      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        const bleError = {
          name: 'BleError',
          errorCode: 1,
          attErrorCode: null,
          iosErrorCode: null,
          androidErrorCode: null,
          reason: 'Scan failed',
          message: 'Scan failed'
        };
        setTimeout(() => callback(bleError, null), 10);
        return Promise.resolve();
      });

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BLE_MANAGER_INIT_FAILED');
      expect(result.error?.message).toContain('Teste de funcionalidade Bluetooth falhou');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockBluetoothUtils.supportsBLE.mockRejectedValue(new Error('Unexpected error'));

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.recoverable).toBe(true);
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_ERROR');
    });
  });

  describe('retry', () => {
    it('should retry initialization when under max attempts', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });

      // Mock successful scan test
      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      const result = await initializer.retry();

      expect(result.success).toBe(true);
      expect(initializer.getInitializationStatus()).toBe('COMPLETED_SUCCESS');
    });

    it('should fail when max attempts exceeded', async () => {
      // Force max attempts by calling initialize multiple times
      for (let i = 0; i < 3; i++) {
        mockBluetoothUtils.supportsBLE.mockResolvedValue(false);
        await initializer.initialize();
      }

      const result = await initializer.retry();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
      expect(result.error?.message).toContain('Número máximo de tentativas');
    });

    it('should set status to RETRYING during retry', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });

      // Mock successful scan test
      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      const retryPromise = initializer.retry();
      
      // Check status during retry
      expect(initializer.getInitializationStatus()).toBe('RETRYING');
      
      await retryPromise;
    });
  });

  describe('getInitializationStatus', () => {
    it('should return NOT_STARTED initially', () => {
      expect(initializer.getInitializationStatus()).toBe('NOT_STARTED');
    });

    it('should return IN_PROGRESS during initialization', async () => {
      mockBluetoothUtils.supportsBLE.mockImplementation(() => {
        // Check status during execution
        expect(initializer.getInitializationStatus()).toBe('IN_PROGRESS');
        return Promise.resolve(true);
      });
      
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });

      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      await initializer.initialize();
    });
  });

  describe('onInitializationComplete', () => {
    it('should call callbacks when initialization completes successfully', async () => {
      const callback = jest.fn();
      initializer.onInitializationComplete(callback);

      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });

      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      const result = await initializer.initialize();

      expect(callback).toHaveBeenCalledWith(result);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call callbacks when initialization fails', async () => {
      const callback = jest.fn();
      initializer.onInitializationComplete(callback);

      mockBluetoothUtils.supportsBLE.mockResolvedValue(false);

      const result = await initializer.initialize();

      expect(callback).toHaveBeenCalledWith(result);
      expect(result.success).toBe(false);
    });

    it('should handle callback errors gracefully', async () => {
      const faultyCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const goodCallback = jest.fn();
      
      initializer.onInitializationComplete(faultyCallback);
      initializer.onInitializationComplete(goodCallback);

      mockBluetoothUtils.supportsBLE.mockResolvedValue(false);

      const result = await initializer.initialize();

      expect(faultyCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalledWith(result);
    });
  });

  describe('diagnostic information', () => {
    it('should include diagnostic info in error results', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(false);

      const result = await initializer.initialize();

      expect(result.error?.diagnosticInfo).toBeDefined();
      expect(result.error?.diagnosticInfo.appVersion).toBe('1.0.0');
      expect(result.error?.diagnosticInfo.bleLibraryVersion).toBe('3.5.0');
      expect(result.error?.diagnosticInfo.initializationAttempts).toBe(1);
    });

    it('should track state changes', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);

      await initializer.initialize();

      // Get diagnostic info from any error (we'll force one)
      mockBluetoothUtils.supportsBLE.mockResolvedValue(false);
      const result = await initializer.initialize();

      expect(result.error?.diagnosticInfo.stateHistory.length).toBeGreaterThan(0);
      expect(result.error?.diagnosticInfo.stateHistory[0].trigger).toBe('Constructor');
    });

    it('should track permission changes', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: false });
      mockPermissionsManager.requestBLEPermissions.mockResolvedValue({ granted: false });

      const result = await initializer.initialize();

      expect(result.error?.diagnosticInfo.permissionHistory.length).toBeGreaterThan(0);
      expect(result.error?.diagnosticInfo.permissionHistory.some(h => h.permission === 'BLE_PERMISSIONS')).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should cleanup resources properly', async () => {
      // First initialize to create BLE manager
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });
      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      await initializer.initialize();
      
      // Now destroy
      initializer.destroy();

      expect(mockBleManagerInstance.destroy).toHaveBeenCalled();
      expect(initializer.getInitializationStatus()).toBe('NOT_STARTED');
    });

    it('should clear callbacks', async () => {
      const callback = jest.fn();
      initializer.onInitializationComplete(callback);

      initializer.destroy();

      // Try to initialize after destroy - callback should not be called
      mockBluetoothUtils.supportsBLE.mockResolvedValue(false);
      await initializer.initialize();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('capabilities and recommendations', () => {
    it('should generate appropriate recommendations for successful initialization', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOn' as any);
      mockBluetoothUtils.getBluetoothState.mockResolvedValue({
        isEnabled: true,
        isSupported: true,
        state: 'PoweredOn' as any
      });

      mockBleManagerInstance.startDeviceScan.mockImplementation((_, __, callback) => {
        setTimeout(() => callback(null, null), 10);
        return Promise.resolve();
      });

      const result = await initializer.initialize();

      expect(result.recommendations).toContain('Sistema Bluetooth pronto para uso');
    });

    it('should generate appropriate recommendations for missing permissions', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: false });
      mockPermissionsManager.requestBLEPermissions.mockResolvedValue({ granted: false });

      const result = await initializer.initialize();

      expect(result.recommendations).toContain('Toque em "Permitir" quando solicitado');
    });

    it('should generate appropriate recommendations for disabled Bluetooth', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      mockBleManagerInstance.state.mockResolvedValue('PoweredOff' as any);

      const result = await initializer.initialize();

      expect(result.recommendations).toContain('Ligue o Bluetooth nas configurações do dispositivo');
    });
  });
});