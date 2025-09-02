import { BluetoothStateManager } from '../../../services/ble/BluetoothStateManager';
import { BleManager, State } from 'react-native-ble-plx';
import { PermissionsManager } from '../../../utils/permissions';
import { BluetoothUtils } from '../../../utils/bluetooth';
import {
  BluetoothSystemState,
  BluetoothValidationResult,
  BluetoothStateMonitoringConfig
} from '../../../types/ble/bluetooth-state-manager';

// Mock dependencies
jest.mock('react-native-ble-plx');
jest.mock('../../../utils/permissions');
jest.mock('../../../utils/bluetooth');

const mockBleManager = {
  state: jest.fn(),
  onStateChange: jest.fn(),
  destroy: jest.fn()
} as unknown as BleManager;

const mockPermissionsManager = PermissionsManager as jest.Mocked<typeof PermissionsManager>;
const mockBluetoothUtils = BluetoothUtils as jest.Mocked<typeof BluetoothUtils>;

describe('BluetoothStateManager', () => {
  let stateManager: BluetoothStateManager;
  let mockStateSubscription: { remove: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock subscription
    mockStateSubscription = { remove: jest.fn() };
    (mockBleManager.onStateChange as jest.Mock).mockReturnValue(mockStateSubscription);
    
    // Setup default mock responses
    mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
    mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
    mockBluetoothUtils.getBluetoothState.mockResolvedValue({ 
      isEnabled: true, 
      isSupported: true, 
      state: 'PoweredOn' as any 
    });
    (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOn');
    
    stateManager = new BluetoothStateManager(mockBleManager);
  });

  afterEach(() => {
    stateManager.destroy();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const manager = new BluetoothStateManager();
      const state = manager.getCurrentState();
      
      expect(state.isEnabled).toBe(false);
      expect(state.isSupported).toBe(false);
      expect(state.hasPermissions).toBe(false);
      expect(state.powerState).toBe('Unknown');
      expect(state.isStable).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<BluetoothStateMonitoringConfig> = {
        stabilityCheckInterval: 2000,
        stabilityRequiredDuration: 5000,
        enableDetailedLogging: false
      };
      
      const manager = new BluetoothStateManager(mockBleManager, customConfig);
      expect(manager).toBeDefined();
    });
  });

  describe('getCurrentState', () => {
    it('should return a copy of current state', () => {
      const state1 = stateManager.getCurrentState();
      const state2 = stateManager.getCurrentState();
      
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Should be different objects
    });

    it('should return state with correct structure', () => {
      const state = stateManager.getCurrentState();
      
      expect(state).toHaveProperty('isEnabled');
      expect(state).toHaveProperty('isSupported');
      expect(state).toHaveProperty('hasPermissions');
      expect(state).toHaveProperty('powerState');
      expect(state).toHaveProperty('lastChecked');
      expect(state).toHaveProperty('isStable');
      expect(state.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('startMonitoring', () => {
    it('should start monitoring successfully', async () => {
      await stateManager.startMonitoring();
      
      expect(mockBleManager.onStateChange).toHaveBeenCalledWith(
        expect.any(Function),
        true
      );
    });

    it('should not start monitoring twice', async () => {
      await stateManager.startMonitoring();
      await stateManager.startMonitoring();
      
      expect(mockBleManager.onStateChange).toHaveBeenCalledTimes(1);
    });

    it('should work without BLE manager', async () => {
      const managerWithoutBle = new BluetoothStateManager();
      
      expect(() => managerWithoutBle.startMonitoring()).not.toThrow();
      managerWithoutBle.destroy();
    });

    it('should update state on start', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOn');
      
      await stateManager.startMonitoring();
      
      // Wait for async state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = stateManager.getCurrentState();
      expect(state.isSupported).toBe(true);
      expect(state.hasPermissions).toBe(true);
      expect(state.powerState).toBe('PoweredOn');
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring successfully', async () => {
      await stateManager.startMonitoring();
      stateManager.stopMonitoring();
      
      expect(mockStateSubscription.remove).toHaveBeenCalled();
    });

    it('should not fail when stopping without starting', () => {
      expect(() => stateManager.stopMonitoring()).not.toThrow();
    });

    it('should clean up intervals', async () => {
      await stateManager.startMonitoring();
      
      // Spy on clearInterval
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      stateManager.stopMonitoring();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('onStateChange', () => {
    it('should register state change callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      stateManager.onStateChange(callback1);
      stateManager.onStateChange(callback2);
      
      // Callbacks should be registered (we can't directly test this without triggering a state change)
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should call callbacks when state changes', async () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);
      
      // Start monitoring to trigger state updates
      await stateManager.startMonitoring();
      
      // Wait for async state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(callback).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const goodCallback = jest.fn();
      
      stateManager.onStateChange(errorCallback);
      stateManager.onStateChange(goodCallback);
      
      // Start monitoring to trigger callbacks
      await stateManager.startMonitoring();
      
      // Wait for async state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('validateState', () => {
    it('should validate healthy state successfully', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOn');
      
      // Start monitoring and wait for stability
      await stateManager.startMonitoring();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Manually set stable state for this test
      const currentState = stateManager.getCurrentState();
      (stateManager as any).currentState = { ...currentState, isStable: true };
      
      const result = await stateManager.validateState();
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toContain('Sistema Bluetooth funcionando corretamente');
      expect(result.lastValidated).toBeInstanceOf(Date);
    });

    it('should detect BLE not supported', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(false);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOn');
      
      const result = await stateManager.validateState();
      
      expect(result.isValid).toBe(false);
      const bleIssue = result.issues.find(issue => issue.type === 'BLE_NOT_SUPPORTED');
      expect(bleIssue).toBeDefined();
      expect(bleIssue?.severity).toBe('CRITICAL');
    });

    it('should detect missing permissions', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: false });
      
      const result = await stateManager.validateState();
      
      expect(result.isValid).toBe(false);
      const permissionIssue = result.issues.find(issue => issue.type === 'PERMISSIONS_MISSING');
      expect(permissionIssue).toBeDefined();
      expect(permissionIssue?.severity).toBe('HIGH');
    });

    it('should detect Bluetooth disabled', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOff');
      
      const result = await stateManager.validateState();
      
      expect(result.isValid).toBe(false);
      const bluetoothIssue = result.issues.find(issue => issue.type === 'BLUETOOTH_DISABLED');
      expect(bluetoothIssue).toBeDefined();
      expect(bluetoothIssue?.severity).toBe('HIGH');
    });

    it('should detect unstable state', async () => {
      mockBluetoothUtils.supportsBLE.mockResolvedValue(true);
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOn');
      
      // Start monitoring to set up stability tracking
      await stateManager.startMonitoring();
      
      const result = await stateManager.validateState();
      
      // State should be unstable initially (hasn't been stable long enough)
      const stabilityIssue = result.issues.find(issue => issue.type === 'STATE_UNSTABLE');
      expect(stabilityIssue).toBeDefined();
      expect(stabilityIssue?.severity).toBe('MEDIUM');
    });

    it('should detect missing BLE manager', async () => {
      const managerWithoutBle = new BluetoothStateManager();
      
      const result = await managerWithoutBle.validateState();
      
      expect(result.isValid).toBe(false);
      const managerIssue = result.issues.find(issue => issue.type === 'MANAGER_NOT_INITIALIZED');
      expect(managerIssue).toBeDefined();
      expect(managerIssue?.severity).toBe('HIGH');
      
      managerWithoutBle.destroy();
    });

    it('should handle validation errors gracefully', async () => {
      // Mock all methods to throw errors to trigger error handling
      mockBluetoothUtils.supportsBLE.mockRejectedValue(new Error('Test error'));
      mockPermissionsManager.checkBLEPermissions.mockRejectedValue(new Error('Permission error'));
      (mockBleManager.state as jest.Mock).mockRejectedValue(new Error('State error'));
      
      const result = await stateManager.validateState();
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      // When errors occur during state update, the state will have default values
      // which will trigger various validation issues
      expect(result.lastValidated).toBeInstanceOf(Date);
    });
  });

  describe('setBleManager', () => {
    it('should set BLE manager successfully', () => {
      const newManager = {} as BleManager;
      
      expect(() => stateManager.setBleManager(newManager)).not.toThrow();
    });

    it('should restart monitoring when manager is set during monitoring', async () => {
      await stateManager.startMonitoring();
      
      const newManager = {
        onStateChange: jest.fn().mockReturnValue({ remove: jest.fn() }),
        state: jest.fn().mockResolvedValue('PoweredOn')
      } as unknown as BleManager;
      
      stateManager.setBleManager(newManager);
      
      expect(newManager.onStateChange).toHaveBeenCalled();
    });
  });

  describe('getStateHistory', () => {
    it('should return empty history initially', () => {
      const history = stateManager.getStateHistory();
      
      expect(history).toEqual([]);
    });

    it('should return copy of history', async () => {
      await stateManager.startMonitoring();
      
      // Wait for state change
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const history1 = stateManager.getStateHistory();
      const history2 = stateManager.getStateHistory();
      
      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2);
    });
  });

  describe('clearStateHistory', () => {
    it('should clear state history', async () => {
      await stateManager.startMonitoring();
      
      // Wait for state change
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let history = stateManager.getStateHistory();
      expect(history.length).toBeGreaterThan(0);
      
      stateManager.clearStateHistory();
      
      history = stateManager.getStateHistory();
      expect(history).toEqual([]);
    });
  });

  describe('State Change Detection', () => {
    it('should detect when Bluetooth is enabled', async () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);
      
      // Start with Bluetooth off
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOff');
      await stateManager.startMonitoring();
      
      // Wait for initial state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate Bluetooth being turned on
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOn');
      
      // Trigger the state change callback that was registered with BleManager
      const stateChangeCallback = (mockBleManager.onStateChange as jest.Mock).mock.calls[0][0];
      stateChangeCallback('PoweredOn');
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(callback).toHaveBeenCalled();
      const finalState = stateManager.getCurrentState();
      expect(finalState.powerState).toBe('PoweredOn');
      expect(finalState.isEnabled).toBe(true);
    });

    it('should detect permission changes', async () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);
      
      // Start with no permissions
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: false });
      await stateManager.startMonitoring();
      
      // Wait for initial state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Grant permissions
      mockPermissionsManager.checkBLEPermissions.mockResolvedValue({ granted: true });
      
      // Trigger state update manually (simulating permission change)
      const stateChangeCallback = (mockBleManager.onStateChange as jest.Mock).mock.calls[0][0];
      stateChangeCallback('PoweredOn');
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(callback).toHaveBeenCalled();
      const finalState = stateManager.getCurrentState();
      expect(finalState.hasPermissions).toBe(true);
    });
  });

  describe('Stability Monitoring', () => {
    it('should mark state as stable after required duration', async () => {
      const customConfig: Partial<BluetoothStateMonitoringConfig> = {
        stabilityCheckInterval: 100,
        stabilityRequiredDuration: 200
      };
      
      const manager = new BluetoothStateManager(mockBleManager, customConfig);
      
      await manager.startMonitoring();
      
      // Initially should be unstable
      let state = manager.getCurrentState();
      expect(state.isStable).toBe(false);
      
      // Wait for stability duration + buffer
      await new Promise(resolve => setTimeout(resolve, 350));
      
      state = manager.getCurrentState();
      expect(state.isStable).toBe(true);
      
      manager.destroy();
    });

    it('should reset stability on state change', async () => {
      const customConfig: Partial<BluetoothStateMonitoringConfig> = {
        stabilityCheckInterval: 50,
        stabilityRequiredDuration: 100
      };
      
      const manager = new BluetoothStateManager(mockBleManager, customConfig);
      
      await manager.startMonitoring();
      
      // Wait for initial stability
      await new Promise(resolve => setTimeout(resolve, 150));
      
      let state = manager.getCurrentState();
      expect(state.isStable).toBe(true);
      
      // Change the mock to return a different state
      (mockBleManager.state as jest.Mock).mockResolvedValue('PoweredOff');
      
      // Trigger state change
      const stateChangeCallback = (mockBleManager.onStateChange as jest.Mock).mock.calls[0][0];
      stateChangeCallback('PoweredOff');
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      state = manager.getCurrentState();
      expect(state.isStable).toBe(false);
      
      manager.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle BLE manager state errors', async () => {
      (mockBleManager.state as jest.Mock).mockRejectedValue(new Error('State error'));
      
      await stateManager.startMonitoring();
      
      // Wait for state update attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = stateManager.getCurrentState();
      expect(state.powerState).toBe('Unknown');
      expect(state.isEnabled).toBe(false);
    });

    it('should handle permission check errors', async () => {
      mockPermissionsManager.checkBLEPermissions.mockRejectedValue(new Error('Permission error'));
      
      const result = await stateManager.validateState();
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle BLE support check errors', async () => {
      mockBluetoothUtils.supportsBLE.mockRejectedValue(new Error('Support check error'));
      
      const result = await stateManager.validateState();
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', async () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);
      
      await stateManager.startMonitoring();
      
      stateManager.destroy();
      
      // Should stop monitoring
      expect(mockStateSubscription.remove).toHaveBeenCalled();
      
      // Should clear callbacks
      const history = stateManager.getStateHistory();
      expect(history).toEqual([]);
    });

    it('should not fail when called multiple times', () => {
      expect(() => {
        stateManager.destroy();
        stateManager.destroy();
      }).not.toThrow();
    });
  });
});