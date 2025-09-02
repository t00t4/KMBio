import { BluetoothPermissionExample } from '../../examples/BluetoothPermissionExample';
import { BluetoothPermissionHandler } from '../../services/ble/BluetoothPermissionHandler';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../services/ble/BluetoothPermissionHandler');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}));

const mockBluetoothPermissionHandler = BluetoothPermissionHandler as jest.MockedClass<typeof BluetoothPermissionHandler>;
const mockAlert = Alert as jest.Mocked<typeof Alert>;

describe('BluetoothPermissionExample', () => {
  let example: BluetoothPermissionExample;
  let mockHandler: jest.Mocked<BluetoothPermissionHandler>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock handler instance
    mockHandler = {
      checkPermissions: jest.fn(),
      requestPermissions: jest.fn(),
      openPermissionSettings: jest.fn(),
      getRequiredPermissions: jest.fn(),
      shouldShowRationale: jest.fn(),
      handlePermissionDenied: jest.fn()
    } as any;

    // Mock constructor to return our mock instance
    mockBluetoothPermissionHandler.mockImplementation(() => mockHandler);
    
    example = new BluetoothPermissionExample();
  });

  describe('requestBluetoothPermissions', () => {
    it('should return true when permissions are already granted', async () => {
      mockHandler.checkPermissions.mockResolvedValue({
        granted: true,
        denied: false,
        neverAskAgain: false,
        missingPermissions: [],
        grantedPermissions: [],
        partiallyGranted: false
      });

      const result = await example.requestBluetoothPermissions();

      expect(result).toBe(true);
      expect(mockHandler.checkPermissions).toHaveBeenCalled();
      expect(mockHandler.requestPermissions).not.toHaveBeenCalled();
    });

    it('should request permissions when not granted', async () => {
      mockHandler.checkPermissions.mockResolvedValue({
        granted: false,
        denied: true,
        neverAskAgain: false,
        missingPermissions: [{ name: 'BLUETOOTH_SCAN' }],
        grantedPermissions: [],
        partiallyGranted: false
      } as any);

      mockHandler.requestPermissions.mockResolvedValue({
        success: true,
        granted: true,
        deniedPermissions: [],
        grantedPermissions: [],
        neverAskAgainPermissions: [],
        shouldShowRationale: false
      });

      const result = await example.requestBluetoothPermissions();

      expect(result).toBe(true);
      expect(mockHandler.checkPermissions).toHaveBeenCalled();
      expect(mockHandler.requestPermissions).toHaveBeenCalled();
    });

    it('should handle permanently denied permissions', async () => {
      mockHandler.checkPermissions.mockResolvedValue({
        granted: false,
        denied: true,
        neverAskAgain: false,
        missingPermissions: [],
        grantedPermissions: [],
        partiallyGranted: false
      } as any);

      mockHandler.requestPermissions.mockResolvedValue({
        success: false,
        granted: false,
        deniedPermissions: [],
        grantedPermissions: [],
        neverAskAgainPermissions: [{ name: 'BLUETOOTH_SCAN' }],
        shouldShowRationale: false
      } as any);

      const result = await example.requestBluetoothPermissions();

      expect(result).toBe(false);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        'Permissões Necessárias',
        expect.stringContaining('negadas permanentemente'),
        expect.any(Array)
      );
    });

    it('should handle temporarily denied permissions', async () => {
      mockHandler.checkPermissions.mockResolvedValue({
        granted: false,
        denied: true,
        neverAskAgain: false,
        missingPermissions: [],
        grantedPermissions: [],
        partiallyGranted: false
      } as any);

      mockHandler.requestPermissions.mockResolvedValue({
        success: false,
        granted: false,
        deniedPermissions: [{ name: 'BLUETOOTH_CONNECT' }],
        grantedPermissions: [],
        neverAskAgainPermissions: [],
        shouldShowRationale: true
      } as any);

      const result = await example.requestBluetoothPermissions();

      expect(result).toBe(false);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        'Permissões Negadas',
        expect.stringContaining('necessárias para o funcionamento'),
        expect.any(Array)
      );
    });

    it('should handle permission request errors', async () => {
      mockHandler.checkPermissions.mockRejectedValue(new Error('Permission check failed'));

      const result = await example.requestBluetoothPermissions();

      expect(result).toBe(false);
      expect(mockAlert.alert).toHaveBeenCalledWith(
        'Erro nas Permissões',
        expect.stringContaining('erro ao solicitar permissões'),
        expect.any(Array)
      );
    });
  });

  describe('ensurePermissionsForBluetooth', () => {
    it('should return true when permissions are granted', async () => {
      mockHandler.checkPermissions.mockResolvedValue({
        granted: true,
        denied: false,
        neverAskAgain: false,
        missingPermissions: [],
        grantedPermissions: [],
        partiallyGranted: false
      });

      const result = await example.ensurePermissionsForBluetooth();

      expect(result).toBe(true);
    });

    it('should request permissions when not granted', async () => {
      mockHandler.checkPermissions.mockResolvedValue({
        granted: false,
        denied: true,
        neverAskAgain: false,
        missingPermissions: [],
        grantedPermissions: [],
        partiallyGranted: false
      } as any);

      mockHandler.requestPermissions.mockResolvedValue({
        success: true,
        granted: true,
        deniedPermissions: [],
        grantedPermissions: [],
        neverAskAgainPermissions: [],
        shouldShowRationale: false
      });

      const result = await example.ensurePermissionsForBluetooth();

      expect(result).toBe(true);
      expect(mockHandler.requestPermissions).toHaveBeenCalled();
    });
  });

  describe('getPermissionDetails', () => {
    it('should log permission details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockHandler.getRequiredPermissions.mockReturnValue([
        { name: 'BLUETOOTH_SCAN' },
        { name: 'BLUETOOTH_CONNECT' }
      ] as any);

      mockHandler.checkPermissions.mockResolvedValue({
        granted: false,
        denied: true,
        neverAskAgain: false,
        missingPermissions: [{ name: 'BLUETOOTH_SCAN' }],
        grantedPermissions: [{ name: 'BLUETOOTH_CONNECT' }],
        partiallyGranted: true
      } as any);

      await example.getPermissionDetails();

      expect(consoleSpy).toHaveBeenCalledWith('📋 Permission Details:');
      expect(consoleSpy).toHaveBeenCalledWith('Required permissions:', 2);
      expect(consoleSpy).toHaveBeenCalledWith('Granted permissions:', 1);
      expect(consoleSpy).toHaveBeenCalledWith('Missing permissions:', 1);

      consoleSpy.mockRestore();
    });
  });

  describe('handlePermissionRecovery', () => {
    it('should show recovery dialog for valid permission', async () => {
      mockHandler.getRequiredPermissions.mockReturnValue([
        { 
          name: 'BLUETOOTH_SCAN',
          description: 'Scan for Bluetooth devices',
          rationale: 'Required for OBD-II connection'
        }
      ] as any);

      mockHandler.handlePermissionDenied.mockResolvedValue({
        type: 'RETRY_REQUEST',
        title: 'Tentar Novamente',
        description: 'Solicitar a permissão novamente',
        action: jest.fn(),
        priority: 'HIGH'
      } as any);

      await example.handlePermissionRecovery('BLUETOOTH_SCAN');

      expect(mockHandler.handlePermissionDenied).toHaveBeenCalled();
      expect(mockAlert.alert).toHaveBeenCalledWith(
        'Recuperar Permissão',
        expect.stringContaining('Solicitar a permissão novamente'),
        expect.any(Array)
      );
    });

    it('should handle invalid permission name gracefully', async () => {
      mockHandler.getRequiredPermissions.mockReturnValue([]);

      await example.handlePermissionRecovery('INVALID_PERMISSION');

      expect(mockHandler.handlePermissionDenied).not.toHaveBeenCalled();
      expect(mockAlert.alert).not.toHaveBeenCalled();
    });
  });
});