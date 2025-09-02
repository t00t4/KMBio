import { BluetoothPermissionHandler } from '../../../services/ble/BluetoothPermissionHandler';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { BLUETOOTH_PERMISSIONS } from '../../../types/ble/bluetooth-permission-handler';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 31
  },
  PermissionsAndroid: {
    check: jest.fn(),
    requestMultiple: jest.fn(),
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again'
    }
  },
  Alert: {
    alert: jest.fn()
  },
  Linking: {
    openSettings: jest.fn()
  }
}));

const mockPermissionsAndroid = PermissionsAndroid as jest.Mocked<typeof PermissionsAndroid>;
const mockAlert = Alert as jest.Mocked<typeof Alert>;
const mockLinking = Linking as jest.Mocked<typeof Linking>;

describe('BluetoothPermissionHandler', () => {
  let permissionHandler: BluetoothPermissionHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset Platform.OS to Android for most tests
    (Platform as any).OS = 'android';
    (Platform as any).Version = 31;

    permissionHandler = new BluetoothPermissionHandler();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const handler = new BluetoothPermissionHandler();
      expect(handler).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        maxRetryAttempts: 5,
        enableDetailedLogging: false
      };

      const handler = new BluetoothPermissionHandler(customConfig);
      expect(handler).toBeDefined();
    });
  });

  describe('getRequiredPermissions', () => {
    it('should return new permissions for Android 12+', () => {
      (Platform as any).Version = 31;

      const permissions = permissionHandler.getRequiredPermissions();

      expect(permissions).toHaveLength(3);
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.BLUETOOTH_SCAN);
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.BLUETOOTH_CONNECT);
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.ACCESS_FINE_LOCATION);
    });

    it('should return legacy permissions for older Android versions', () => {
      (Platform as any).Version = 30;

      const permissions = permissionHandler.getRequiredPermissions();

      expect(permissions).toHaveLength(3);
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.BLUETOOTH_LEGACY);
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.BLUETOOTH_ADMIN_LEGACY);
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.ACCESS_FINE_LOCATION);
    });

    it('should return empty array for iOS', () => {
      (Platform as any).OS = 'ios';

      const permissions = permissionHandler.getRequiredPermissions();

      expect(permissions).toHaveLength(0);
    });
  });

  describe('checkPermissions', () => {
    it('should return granted status when all permissions are granted on Android', async () => {
      mockPermissionsAndroid.check.mockResolvedValue(true);

      const status = await permissionHandler.checkPermissions();

      expect(status.granted).toBe(true);
      expect(status.denied).toBe(false);
      expect(status.missingPermissions).toHaveLength(0);
      expect(status.grantedPermissions).toHaveLength(3);
      expect(status.partiallyGranted).toBe(false);
    });

    it('should return denied status when some permissions are missing', async () => {
      mockPermissionsAndroid.check
        .mockResolvedValueOnce(true)  // BLUETOOTH_SCAN granted
        .mockResolvedValueOnce(false) // BLUETOOTH_CONNECT denied
        .mockResolvedValueOnce(true); // ACCESS_FINE_LOCATION granted

      const status = await permissionHandler.checkPermissions();

      expect(status.granted).toBe(false);
      expect(status.denied).toBe(true);
      expect(status.missingPermissions).toHaveLength(1);
      expect(status.grantedPermissions).toHaveLength(2);
      expect(status.partiallyGranted).toBe(true);
    });

    it('should return granted status for iOS', async () => {
      (Platform as any).OS = 'ios';

      const status = await permissionHandler.checkPermissions();

      expect(status.granted).toBe(true);
      expect(status.denied).toBe(false);
      expect(status.missingPermissions).toHaveLength(0);
    });

    it('should handle permission check errors', async () => {
      mockPermissionsAndroid.check.mockRejectedValue(new Error('Permission check failed'));

      const status = await permissionHandler.checkPermissions();

      expect(status.granted).toBe(false);
      expect(status.denied).toBe(true);
      expect(status.missingPermissions.length).toBeGreaterThan(0);
    });
  });

  describe('requestPermissions', () => {
    it('should return success when all permissions are already granted', async () => {
      mockPermissionsAndroid.check.mockResolvedValue(true);

      const result = await permissionHandler.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.granted).toBe(true);
      expect(result.deniedPermissions).toHaveLength(0);
      expect(result.grantedPermissions).toHaveLength(3);
    });

    it('should request missing permissions and handle grants', async () => {
      // Create handler without rationale to avoid timeout
      const handler = new BluetoothPermissionHandler({
        showRationaleBeforeRequest: false
      });

      // First check shows missing permissions
      mockPermissionsAndroid.check.mockResolvedValue(false);

      // Request returns all granted
      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_SCAN': PermissionsAndroid.RESULTS.GRANTED,
        'android.permission.BLUETOOTH_CONNECT': PermissionsAndroid.RESULTS.GRANTED,
        'android.permission.ACCESS_FINE_LOCATION': PermissionsAndroid.RESULTS.GRANTED
      } as any);

      const result = await handler.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.granted).toBe(true);
      expect(result.deniedPermissions).toHaveLength(0);
      expect(mockPermissionsAndroid.requestMultiple).toHaveBeenCalled();
    });

    it('should handle denied permissions', async () => {
      const handler = new BluetoothPermissionHandler({
        showRationaleBeforeRequest: false
      });

      mockPermissionsAndroid.check.mockResolvedValue(false);

      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_SCAN': PermissionsAndroid.RESULTS.GRANTED,
        'android.permission.BLUETOOTH_CONNECT': PermissionsAndroid.RESULTS.DENIED,
        'android.permission.ACCESS_FINE_LOCATION': PermissionsAndroid.RESULTS.GRANTED
      } as any);

      const result = await handler.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.granted).toBe(false);
      expect(result.deniedPermissions).toHaveLength(1);
      expect(result.grantedPermissions).toHaveLength(2);
    });

    it('should handle never ask again permissions', async () => {
      const handler = new BluetoothPermissionHandler({
        showRationaleBeforeRequest: false
      });

      mockPermissionsAndroid.check.mockResolvedValue(false);

      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_SCAN': PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
        'android.permission.BLUETOOTH_CONNECT': PermissionsAndroid.RESULTS.GRANTED,
        'android.permission.ACCESS_FINE_LOCATION': PermissionsAndroid.RESULTS.GRANTED
      } as any);

      const result = await handler.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.granted).toBe(false);
      expect(result.neverAskAgainPermissions).toHaveLength(1);
      expect(result.grantedPermissions).toHaveLength(2);
    });

    it('should return success for iOS', async () => {
      (Platform as any).OS = 'ios';

      const result = await permissionHandler.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.granted).toBe(true);
    });

    it('should handle permission request errors', async () => {
      const handler = new BluetoothPermissionHandler({
        showRationaleBeforeRequest: false
      });

      mockPermissionsAndroid.check.mockResolvedValue(false);
      mockPermissionsAndroid.requestMultiple.mockRejectedValue(new Error('Request failed'));

      await expect(handler.requestPermissions()).rejects.toThrow();
    });
  });

  describe('shouldShowRationale', () => {
    it('should return false for iOS', async () => {
      (Platform as any).OS = 'ios';

      const shouldShow = await permissionHandler.shouldShowRationale();

      expect(shouldShow).toBe(false);
    });

    it('should return true when permissions are denied on Android', async () => {
      mockPermissionsAndroid.check.mockResolvedValue(false);

      const shouldShow = await permissionHandler.shouldShowRationale();

      expect(shouldShow).toBe(true);
    });

    it('should return false when all permissions are granted', async () => {
      mockPermissionsAndroid.check.mockResolvedValue(true);

      const shouldShow = await permissionHandler.shouldShowRationale();

      expect(shouldShow).toBe(false);
    });

    it('should handle rationale check errors gracefully', async () => {
      mockPermissionsAndroid.check.mockRejectedValue(new Error('Check failed'));

      const shouldShow = await permissionHandler.shouldShowRationale();

      expect(shouldShow).toBe(false);
    });
  });

  describe('openPermissionSettings', () => {
    it('should call Linking.openSettings', () => {
      permissionHandler.openPermissionSettings();

      expect(mockLinking.openSettings).toHaveBeenCalled();
    });

    it('should handle settings open errors gracefully', () => {
      mockLinking.openSettings.mockImplementation(() => {
        throw new Error('Settings failed');
      });

      expect(() => permissionHandler.openPermissionSettings()).not.toThrow();
    });
  });

  describe('handlePermissionDenied', () => {
    it('should return recovery action for denied permission', async () => {
      const permission = BLUETOOTH_PERMISSIONS.BLUETOOTH_SCAN;

      const action = await permissionHandler.handlePermissionDenied(permission);

      expect(action).toBeDefined();
      expect(action.type).toBe('RETRY_REQUEST');
      expect(action.priority).toBe('HIGH');
      expect(action.title).toBe('Tentar Novamente');
    });

    it('should provide actionable recovery options', async () => {
      const permission = BLUETOOTH_PERMISSIONS.BLUETOOTH_CONNECT;

      const action = await permissionHandler.handlePermissionDenied(permission);

      expect(action.action).toBeDefined();
      expect(typeof action.action).toBe('function');
    });
  });

  describe('Permission Flow Integration', () => {
    it('should handle complete permission flow with rationale', async () => {
      // Configure to show rationale
      const handler = new BluetoothPermissionHandler({
        showRationaleBeforeRequest: true
      });

      // Mock rationale acceptance
      mockAlert.alert.mockImplementation((title, message, buttons) => {
        // Simulate user accepting rationale
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      mockPermissionsAndroid.check.mockResolvedValue(false);
      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_SCAN': PermissionsAndroid.RESULTS.GRANTED,
        'android.permission.BLUETOOTH_CONNECT': PermissionsAndroid.RESULTS.GRANTED,
        'android.permission.ACCESS_FINE_LOCATION': PermissionsAndroid.RESULTS.GRANTED
      } as any);

      const result = await handler.requestPermissions();

      expect(result.success).toBe(true);
      expect(mockAlert.alert).toHaveBeenCalled();
    });

    it('should handle rationale rejection', async () => {
      const handler = new BluetoothPermissionHandler({
        showRationaleBeforeRequest: true
      });

      // Mock rationale rejection
      mockAlert.alert.mockImplementation((title, message, buttons) => {
        // Simulate user rejecting rationale
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });

      mockPermissionsAndroid.check.mockResolvedValue(false);

      const result = await handler.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.shouldShowRationale).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permission list gracefully', async () => {
      (Platform as any).OS = 'ios';

      const status = await permissionHandler.checkPermissions();
      const result = await permissionHandler.requestPermissions();

      expect(status.granted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should handle platform version edge cases', () => {
      // Test boundary between legacy and new permissions
      (Platform as any).Version = 30;
      let permissions = permissionHandler.getRequiredPermissions();
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.BLUETOOTH_LEGACY);

      (Platform as any).Version = 31;
      permissions = permissionHandler.getRequiredPermissions();
      expect(permissions).toContainEqual(BLUETOOTH_PERMISSIONS.BLUETOOTH_SCAN);
    });

    it('should handle mixed permission results correctly', async () => {
      const handler = new BluetoothPermissionHandler({
        showRationaleBeforeRequest: false
      });

      mockPermissionsAndroid.check
        .mockResolvedValueOnce(true)   // BLUETOOTH_SCAN already granted
        .mockResolvedValueOnce(false)  // BLUETOOTH_CONNECT need to request
        .mockResolvedValueOnce(false); // ACCESS_FINE_LOCATION need to request

      mockPermissionsAndroid.requestMultiple.mockResolvedValue({
        'android.permission.BLUETOOTH_CONNECT': PermissionsAndroid.RESULTS.GRANTED,
        'android.permission.ACCESS_FINE_LOCATION': PermissionsAndroid.RESULTS.DENIED
      } as any);

      const result = await handler.requestPermissions();

      expect(result.success).toBe(false);
      expect(result.grantedPermissions).toHaveLength(2); // 1 already granted + 1 newly granted
      expect(result.deniedPermissions).toHaveLength(1);
    });
  });
});