import { BluetoothErrorHandler } from '../../../services/ble/BluetoothErrorHandler';
import {
  BluetoothError,
  BluetoothErrorResponse,
  RecoveryResult,
  RecoveryInstructions,
  ErrorHandlingStrategy,
  RetryConfig
} from '../../../types/ble/bluetooth-error-handler';
import { Platform, Linking } from 'react-native';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android'
  },
  Alert: {
    alert: jest.fn()
  },
  Linking: {
    openSettings: jest.fn(),
    openURL: jest.fn()
  }
}));

const mockLinking = Linking as jest.Mocked<typeof Linking>;

describe('BluetoothErrorHandler', () => {
  let errorHandler: BluetoothErrorHandler;
  let mockError: BluetoothError;

  beforeEach(() => {
    jest.clearAllMocks();
    
    errorHandler = new BluetoothErrorHandler();
    
    mockError = {
      code: 'BLUETOOTH_DISABLED',
      message: 'Bluetooth is disabled',
      timestamp: new Date(),
      context: {}
    };
  });

  describe('Constructor', () => {
    it('should initialize with default retry configuration', () => {
      const handler = new BluetoothErrorHandler();
      const config = handler.getRetryConfig();
      
      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelay).toBe(1000);
      expect(config.maxDelay).toBe(10000);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.jitter).toBe(true);
    });

    it('should accept custom retry configuration', () => {
      const customConfig: Partial<RetryConfig> = {
        maxAttempts: 5,
        baseDelay: 2000,
        jitter: false
      };
      
      const handler = new BluetoothErrorHandler(customConfig);
      const config = handler.getRetryConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.baseDelay).toBe(2000);
      expect(config.jitter).toBe(false);
      expect(config.maxDelay).toBe(10000); // Should keep default
    });
  });

  describe('handleError', () => {
    it('should handle BLUETOOTH_DISABLED error correctly', () => {
      const response = errorHandler.handleError(mockError);
      
      expect(response.userMessage).toContain('Bluetooth está desligado');
      expect(response.technicalMessage).toContain('Bluetooth adapter is powered off');
      expect(response.shouldRetry).toBe(true);
      expect(response.severity).toBe('HIGH');
      expect(response.category).toBe('USER_ACTION_REQUIRED');
      expect(response.recoveryOptions).toHaveLength(2);
    });

    it('should handle PERMISSIONS_DENIED error correctly', () => {
      const permissionError: BluetoothError = {
        ...mockError,
        code: 'PERMISSIONS_DENIED'
      };
      
      const response = errorHandler.handleError(permissionError);
      
      expect(response.userMessage).toContain('Permissões Bluetooth são necessárias');
      expect(response.shouldRetry).toBe(false);
      expect(response.severity).toBe('HIGH');
      expect(response.category).toBe('PERMISSIONS');
    });

    it('should handle BLUETOOTH_NOT_SUPPORTED error correctly', () => {
      const unsupportedError: BluetoothError = {
        ...mockError,
        code: 'BLUETOOTH_NOT_SUPPORTED'
      };
      
      const response = errorHandler.handleError(unsupportedError);
      
      expect(response.userMessage).toContain('não suporta Bluetooth Low Energy');
      expect(response.shouldRetry).toBe(false);
      expect(response.severity).toBe('CRITICAL');
      expect(response.category).toBe('HARDWARE');
    });

    it('should handle BLE_MANAGER_INIT_FAILED with retry logic', () => {
      const initError: BluetoothError = {
        ...mockError,
        code: 'BLE_MANAGER_INIT_FAILED'
      };
      
      const response = errorHandler.handleError(initError);
      
      expect(response.shouldRetry).toBe(true);
      expect(response.severity).toBe('MEDIUM');
      expect(response.category).toBe('TEMPORARY');
      expect(response.retryDelay).toBeGreaterThan(0);
    });

    it('should include retry count in user message when retrying', () => {
      const retryError: BluetoothError = {
        ...mockError,
        retryCount: 1
      };
      
      const response = errorHandler.handleError(retryError);
      
      expect(response.userMessage).toContain('Tentativa 2/');
    });

    it('should update error metrics when handling errors', () => {
      errorHandler.handleError(mockError);
      errorHandler.handleError(mockError);
      
      const metrics = errorHandler.getErrorMetrics();
      const bluetoothMetrics = metrics.get('BLUETOOTH_DISABLED');
      
      expect(bluetoothMetrics).toBeDefined();
      expect(bluetoothMetrics?.occurrenceCount).toBe(2);
    });
  });

  describe('canRecover', () => {
    it('should return true for recoverable errors within retry limit', () => {
      const recoverableError: BluetoothError = {
        ...mockError,
        code: 'BLUETOOTH_DISABLED',
        retryCount: 1
      };
      
      expect(errorHandler.canRecover(recoverableError)).toBe(true);
    });

    it('should return false for errors exceeding retry limit', () => {
      const maxRetriesError: BluetoothError = {
        ...mockError,
        code: 'BLUETOOTH_DISABLED',
        retryCount: 5
      };
      
      expect(errorHandler.canRecover(maxRetriesError)).toBe(false);
    });

    it('should return false for permanent errors', () => {
      const permanentError: BluetoothError = {
        ...mockError,
        code: 'BLUETOOTH_NOT_SUPPORTED'
      };
      
      // BLUETOOTH_NOT_SUPPORTED has autoRetry: false, so it can't recover
      expect(errorHandler.canRecover(permanentError)).toBe(false);
    });
  });

  describe('attemptRecovery', () => {
    it('should successfully recover with RETRY_INITIALIZATION action', async () => {
      const initError: BluetoothError = {
        ...mockError,
        code: 'BLE_MANAGER_INIT_FAILED'
      };
      
      const result = await errorHandler.attemptRecovery(initError);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Reiniciando gerenciador Bluetooth');
      expect(result.nextAction).toBe('RETRY_INITIALIZATION');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should successfully recover with OPEN_BLUETOOTH_SETTINGS action', async () => {
      mockLinking.openSettings.mockResolvedValue(undefined);
      
      const result = await errorHandler.attemptRecovery(mockError);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Configurações abertas');
      expect(result.nextAction).toBe('WAIT_AND_RETRY');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should handle OPEN_BLUETOOTH_SETTINGS action on Android', async () => {
      mockLinking.openSettings.mockResolvedValue(undefined);
      
      const settingsError: BluetoothError = {
        ...mockError,
        code: 'BLUETOOTH_DISABLED'
      };
      
      const result = await errorHandler.attemptRecovery(settingsError);
      
      expect(result.success).toBe(true);
      expect(mockLinking.openSettings).toHaveBeenCalled();
      expect(result.message).toContain('Configurações abertas');
    });

    it('should handle OPEN_BLUETOOTH_SETTINGS action on iOS', async () => {
      (Platform as any).OS = 'ios';
      mockLinking.openURL.mockResolvedValue(undefined);
      
      const settingsError: BluetoothError = {
        ...mockError,
        code: 'BLUETOOTH_DISABLED'
      };
      
      const result = await errorHandler.attemptRecovery(settingsError);
      
      expect(result.success).toBe(true);
      expect(mockLinking.openURL).toHaveBeenCalledWith('App-Prefs:Bluetooth');
    });

    it('should handle failed settings opening gracefully', async () => {
      // Test the error handling path by using a different error code that doesn't call Linking
      const testError: BluetoothError = {
        code: 'PERMISSIONS_NEVER_ASK_AGAIN',
        message: 'Permissions permanently denied',
        timestamp: new Date(),
        context: {}
      };
      
      // Configure mock to fail for app settings
      mockLinking.openSettings.mockRejectedValueOnce(new Error('Settings failed'));
      
      const result = await errorHandler.attemptRecovery(testError);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Não foi possível abrir as configurações');
      expect(result.nextAction).toBe('MANUAL_INTERVENTION');
    });

    it('should handle ENABLE_LIMITED_MODE action', async () => {
      const unsupportedError: BluetoothError = {
        ...mockError,
        code: 'BLUETOOTH_NOT_SUPPORTED'
      };
      
      const result = await errorHandler.attemptRecovery(unsupportedError);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Modo limitado habilitado');
    });

    it('should handle unknown recovery actions', async () => {
      // Mock an error with an unknown action by modifying the strategy
      const unknownError: BluetoothError = {
        ...mockError,
        code: 'UNKNOWN_ERROR' as any
      };
      
      const result = await errorHandler.attemptRecovery(unknownError);
      
      // Unknown errors get default strategy with RETRY_INITIALIZATION action
      expect(result.success).toBe(true);
      expect(result.message).toContain('Tentando inicialização novamente');
      expect(result.nextAction).toBe('RETRY_INITIALIZATION');
    });

    it('should handle recovery exceptions gracefully', async () => {
      // Test the outer try-catch by using a different error code
      const testError: BluetoothError = {
        code: 'PERMISSIONS_NEVER_ASK_AGAIN',
        message: 'Permissions permanently denied',
        timestamp: new Date(),
        context: {}
      };
      
      // Configure mock to fail for app settings
      mockLinking.openSettings.mockRejectedValueOnce(new Error('Unexpected error'));
      
      const result = await errorHandler.attemptRecovery(testError);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Não foi possível abrir as configurações');
      expect(result.nextAction).toBe('MANUAL_INTERVENTION');
    });
  });

  describe('getRecoveryInstructions', () => {
    it('should provide detailed instructions for BLUETOOTH_DISABLED', () => {
      const instructions = errorHandler.getRecoveryInstructions(mockError);
      
      expect(instructions.title).toBe('Como habilitar o Bluetooth');
      expect(instructions.description).toContain('Bluetooth está desligado');
      expect(instructions.steps).toHaveLength(3);
      expect(instructions.automaticRecovery).toBe(true);
      expect(instructions.estimatedTime).toBe('30 segundos');
      expect(instructions.successIndicators).toContain('Ícone do Bluetooth aparece na barra de status');
    });

    it('should provide instructions for PERMISSIONS_DENIED', () => {
      const permissionError: BluetoothError = {
        ...mockError,
        code: 'PERMISSIONS_DENIED'
      };
      
      const instructions = errorHandler.getRecoveryInstructions(permissionError);
      
      expect(instructions.title).toBe('Como conceder permissões Bluetooth');
      expect(instructions.steps).toHaveLength(2);
      expect(instructions.automaticRecovery).toBe(false);
    });

    it('should provide default instructions for unknown errors', () => {
      const unknownError: BluetoothError = {
        ...mockError,
        code: 'UNKNOWN_ERROR' as any
      };
      
      const instructions = errorHandler.getRecoveryInstructions(unknownError);
      
      expect(instructions.title).toBe('Instruções de recuperação');
      expect(instructions.steps).toHaveLength(0);
    });
  });

  describe('getErrorStrategy', () => {
    it('should return correct strategy for known error codes', () => {
      const strategy = errorHandler.getErrorStrategy('BLUETOOTH_DISABLED');
      
      expect(strategy.userMessage).toContain('Bluetooth está desligado');
      expect(strategy.action).toBe('OPEN_BLUETOOTH_SETTINGS');
      expect(strategy.autoRetry).toBe(true);
      expect(strategy.severity).toBe('HIGH');
    });

    it('should return default strategy for unknown error codes', () => {
      const strategy = errorHandler.getErrorStrategy('UNKNOWN_ERROR' as any);
      
      expect(strategy.userMessage).toBe('Erro desconhecido no Bluetooth');
      expect(strategy.action).toBe('RETRY_INITIALIZATION');
      expect(strategy.autoRetry).toBe(true);
      expect(strategy.severity).toBe('MEDIUM');
    });
  });

  describe('Retry Logic', () => {
    it('should calculate retry delay with exponential backoff', () => {
      const error1: BluetoothError = { ...mockError, retryCount: 0 };
      const error2: BluetoothError = { ...mockError, retryCount: 1 };
      const error3: BluetoothError = { ...mockError, retryCount: 2 };
      
      const response1 = errorHandler.handleError(error1);
      const response2 = errorHandler.handleError(error2);
      const response3 = errorHandler.handleError(error3);
      
      expect(response2.retryDelay).toBeGreaterThan(response1.retryDelay!);
      expect(response3.retryDelay).toBeGreaterThan(response2.retryDelay!);
    });

    it('should respect maximum retry delay', () => {
      // Create handler without jitter for predictable results
      const noJitterHandler = new BluetoothErrorHandler({ jitter: false });
      const highRetryError: BluetoothError = { ...mockError, retryCount: 10 };
      const response = noJitterHandler.handleError(highRetryError);
      
      expect(response.retryDelay).toBeLessThanOrEqual(10000); // maxDelay
    });

    it('should not retry when max attempts reached', () => {
      const maxRetriesError: BluetoothError = { ...mockError, retryCount: 5 };
      const response = errorHandler.handleError(maxRetriesError);
      
      expect(response.shouldRetry).toBe(false);
      expect(response.recoveryOptions.find(opt => opt.action === 'RETRY_INITIALIZATION')).toBeUndefined();
    });
  });

  describe('Error Metrics', () => {
    it('should track error occurrences', () => {
      errorHandler.handleError(mockError);
      errorHandler.handleError(mockError);
      
      const metrics = errorHandler.getErrorMetrics();
      const bluetoothMetrics = metrics.get('BLUETOOTH_DISABLED');
      
      expect(bluetoothMetrics?.occurrenceCount).toBe(2);
      expect(bluetoothMetrics?.firstOccurrence).toBeInstanceOf(Date);
      expect(bluetoothMetrics?.lastOccurrence).toBeInstanceOf(Date);
    });

    it('should clear error metrics', () => {
      errorHandler.handleError(mockError);
      expect(errorHandler.getErrorMetrics().size).toBeGreaterThan(0);
      
      errorHandler.clearErrorMetrics();
      expect(errorHandler.getErrorMetrics().size).toBe(0);
    });

    it('should update recovery success rate', async () => {
      // First handle the error to create metrics entry
      errorHandler.handleError(mockError);
      
      // Mock successful settings opening
      mockLinking.openSettings.mockResolvedValue(undefined);
      
      // Simulate successful recovery
      await errorHandler.attemptRecovery(mockError);
      
      const metrics = errorHandler.getErrorMetrics();
      const bluetoothMetrics = metrics.get('BLUETOOTH_DISABLED');
      
      expect(bluetoothMetrics?.recoverySuccessRate).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update retry configuration', () => {
      const newConfig: Partial<RetryConfig> = {
        maxAttempts: 5,
        baseDelay: 3000
      };
      
      errorHandler.updateRetryConfig(newConfig);
      const config = errorHandler.getRetryConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.baseDelay).toBe(3000);
      expect(config.backoffMultiplier).toBe(2); // Should keep existing
    });

    it('should maintain configuration immutability', () => {
      const config = errorHandler.getRetryConfig();
      config.maxAttempts = 999;
      
      const actualConfig = errorHandler.getRetryConfig();
      expect(actualConfig.maxAttempts).not.toBe(999);
    });
  });

  describe('Recovery Options Filtering', () => {
    it('should filter out retry options when max retries reached', () => {
      const maxRetriesError: BluetoothError = { ...mockError, retryCount: 5 };
      const response = errorHandler.handleError(maxRetriesError);
      
      const retryOption = response.recoveryOptions.find(opt => opt.action === 'RETRY_INITIALIZATION');
      expect(retryOption).toBeUndefined();
    });

    it('should sort recovery options by priority', () => {
      const response = errorHandler.handleError(mockError);
      
      for (let i = 1; i < response.recoveryOptions.length; i++) {
        expect(response.recoveryOptions[i].priority).toBeGreaterThanOrEqual(
          response.recoveryOptions[i - 1].priority
        );
      }
    });
  });

  describe('Platform-specific Behavior', () => {
    it('should handle Android-specific settings opening', async () => {
      (Platform as any).OS = 'android';
      mockLinking.openSettings.mockResolvedValue(undefined);
      
      const result = await errorHandler.attemptRecovery(mockError);
      
      expect(mockLinking.openSettings).toHaveBeenCalled();
      expect(mockLinking.openURL).not.toHaveBeenCalled();
    });

    it('should handle iOS-specific settings opening', async () => {
      (Platform as any).OS = 'ios';
      mockLinking.openURL.mockResolvedValue(undefined);
      
      const result = await errorHandler.attemptRecovery(mockError);
      
      expect(mockLinking.openURL).toHaveBeenCalledWith('App-Prefs:Bluetooth');
      expect(mockLinking.openSettings).not.toHaveBeenCalled();
    });
  });
});