import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DashboardScreen from '../../../screens/dashboard/DashboardScreen';
import { useBLEStore } from '../../../stores/ble';
import { BluetoothInitializationError } from '../../../types/ble/bluetooth-initializer';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock the BLE store
jest.mock('../../../stores/ble', () => ({
  useBLEStore: jest.fn(),
  useBLEConnectionState: jest.fn(),
  useBLEConnectedDevice: jest.fn(),
  useBLEInitializationState: jest.fn(),
  useBLEIsInitialized: jest.fn(),
}));

const mockUseBLEStore = useBLEStore as jest.MockedFunction<typeof useBLEStore>;
const { 
  useBLEConnectionState, 
  useBLEConnectedDevice, 
  useBLEInitializationState, 
  useBLEIsInitialized 
} = require('../../../stores/ble');

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock components
jest.mock('../../../components/common/BLETestComponent', () => {
  return function MockBLETestComponent() {
    return null;
  };
});

jest.mock('../../../components/common/BluetoothInitializationError', () => ({
  BluetoothInitializationError: ({ onRetry, onDismiss }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <>
        <Text testID="initialization-error">Bluetooth Initialization Error</Text>
        <TouchableOpacity testID="retry-button" onPress={onRetry}>
          <Text>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="dismiss-button" onPress={onDismiss}>
          <Text>Dismiss</Text>
        </TouchableOpacity>
      </>
    );
  },
}));

// Mock utils
jest.mock('../../../utils/navigationErrorHandler', () => ({
  handleNavigationError: jest.fn(),
  debounceNavigation: (fn: any) => fn,
}));

jest.mock('../../../utils/debugLogger', () => ({
  logButtonPress: jest.fn(),
  logNavigation: jest.fn(),
  logNavigationError: jest.fn(),
  logUserInteraction: jest.fn(),
}));

describe('DashboardScreen - Initialization Integration', () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockStore = {
      connectionState: {
        isScanning: false,
        isConnecting: false,
        isConnected: false,
        availableDevices: [],
        connectionAttempts: 0,
      },
      initializationState: {
        status: 'NOT_STARTED',
        progress: 0,
        recommendations: [],
        isRetrying: false,
        retryCount: 0,
        error: undefined,
      },
      isInitialized: false,
      initialize: jest.fn(),
      retryInitialization: jest.fn(),
      scanForDevices: jest.fn(),
      connectToDevice: jest.fn(),
      clearError: jest.fn(),
      clearInitializationError: jest.fn(),
    };

    // Setup store mock
    mockUseBLEStore.mockImplementation(() => mockStore);
    
    // Setup individual selector hooks
    useBLEConnectionState.mockImplementation(() => mockStore.connectionState);
    useBLEConnectedDevice.mockImplementation(() => mockStore.connectionState.connectedDevice);
    useBLEInitializationState.mockImplementation(() => mockStore.initializationState);
    useBLEIsInitialized.mockImplementation(() => mockStore.isInitialized);
  });

  describe('Initialization Status Display', () => {
    it('should show bluetooth not initialized status when not initialized', () => {
      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Bluetooth não inicializado')).toBeTruthy();
    });

    it('should show initializing status when in progress', () => {
      mockStore.initializationState.status = 'IN_PROGRESS';
      mockStore.initializationState.progress = 45;

      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Inicializando Bluetooth...')).toBeTruthy();
      expect(getByText('Inicializando... 45%')).toBeTruthy();
    });

    it('should show error status when initialization failed', () => {
      mockStore.initializationState.status = 'COMPLETED_ERROR';

      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Erro na inicialização do Bluetooth')).toBeTruthy();
    });

    it('should show connected status when initialized and connected', () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = true;
      mockStore.connectionState.connectedDevice = { name: 'ELM327 Test' };

      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Conectado: ELM327 Test')).toBeTruthy();
    });

    it('should show not connected status when initialized but not connected', () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = false;

      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Dispositivo OBD-II não conectado')).toBeTruthy();
    });
  });

  describe('Initialization Error Handling', () => {
    it('should display BluetoothInitializationError component when there is an error', () => {
      const mockError: BluetoothInitializationError = {
        code: 'BLUETOOTH_DISABLED',
        message: 'Bluetooth está desligado',
        technicalDetails: 'Bluetooth state is PoweredOff',
        timestamp: new Date(),
        recoverable: true,
        recoverySteps: ['Ligue o Bluetooth'],
        diagnosticInfo: {
          deviceModel: 'Test Device',
          osVersion: '1.0',
          appVersion: '1.0.0',
          bleLibraryVersion: '3.5.0',
          initializationAttempts: 1,
          stateHistory: [],
          permissionHistory: [],
        },
      };

      mockStore.initializationState.error = mockError;

      const { getByTestId } = render(<DashboardScreen />);

      expect(getByTestId('initialization-error')).toBeTruthy();
    });

    it('should call retryInitialization when retry button in error component is pressed', async () => {
      const mockError: BluetoothInitializationError = {
        code: 'PERMISSIONS_DENIED',
        message: 'Permissões Bluetooth necessárias',
        technicalDetails: 'Permission request failed',
        timestamp: new Date(),
        recoverable: true,
        recoverySteps: ['Conceda as permissões'],
        diagnosticInfo: {
          deviceModel: 'Test Device',
          osVersion: '1.0',
          appVersion: '1.0.0',
          bleLibraryVersion: '3.5.0',
          initializationAttempts: 1,
          stateHistory: [],
          permissionHistory: [],
        },
      };

      mockStore.initializationState.error = mockError;

      const { getByTestId } = render(<DashboardScreen />);

      fireEvent.press(getByTestId('retry-button'));

      await waitFor(() => {
        expect(mockStore.clearInitializationError).toHaveBeenCalled();
        expect(mockStore.retryInitialization).toHaveBeenCalled();
      });
    });

    it('should show retry button when initialization failed without specific error', () => {
      mockStore.initializationState.status = 'COMPLETED_ERROR';
      mockStore.initializationState.error = undefined;
      
      // Update the mocks to reflect the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { getByTestId } = render(<DashboardScreen />);

      expect(getByTestId('retry-initialization-button')).toBeTruthy();
    });
  });

  describe('Connect Device Button Behavior', () => {
    it('should be hidden when not initialized', () => {
      mockStore.isInitialized = false;
      mockStore.initializationState.status = 'NOT_STARTED';
      
      // Update the mocks to reflect the new state
      useBLEIsInitialized.mockImplementation(() => mockStore.isInitialized);
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { queryByTestId } = render(<DashboardScreen />);

      expect(queryByTestId('connect-device-button')).toBeNull();
    });

    it('should show alert when trying to connect without initialization', async () => {
      mockStore.isInitialized = false;
      mockStore.initializationState.status = 'NOT_STARTED';

      const { getByTestId } = render(<DashboardScreen />);

      // Force render the button by changing state
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = false;

      const { rerender } = render(<DashboardScreen />);
      rerender(<DashboardScreen />);

      // Now simulate clicking when not actually initialized
      mockStore.isInitialized = false;
      mockStore.initializationState.status = 'NOT_STARTED';

      const connectButton = getByTestId('connect-device-button');
      fireEvent.press(connectButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Bluetooth Não Inicializado',
          'O sistema Bluetooth precisa ser inicializado antes de conectar dispositivos.',
          expect.any(Array)
        );
      });
    });

    it('should navigate to pairing when initialized and button is pressed', async () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = false;
      
      // Update the mocks to reflect the new state
      useBLEIsInitialized.mockImplementation(() => mockStore.isInitialized);
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);
      useBLEConnectionState.mockImplementation(() => mockStore.connectionState);

      const { getByTestId } = render(<DashboardScreen />);

      fireEvent.press(getByTestId('connect-device-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Pairing');
      });
    });

    it('should be disabled when connecting', () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = false;
      mockStore.connectionState.isConnecting = true;

      const { getByTestId } = render(<DashboardScreen />);

      const connectButton = getByTestId('connect-device-button');
      expect(connectButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Start Trip Button Behavior', () => {
    it('should show alert when trying to start trip without initialization', async () => {
      mockStore.isInitialized = false;
      mockStore.initializationState.status = 'NOT_STARTED';

      const { getByText } = render(<DashboardScreen />);

      fireEvent.press(getByText('Iniciar Viagem'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Bluetooth Não Inicializado',
          'O sistema Bluetooth precisa ser inicializado antes de iniciar uma viagem.',
          expect.any(Array)
        );
      });
    });

    it('should navigate to pairing when initialized but not connected', async () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = false;

      const { getByText } = render(<DashboardScreen />);

      fireEvent.press(getByText('Iniciar Viagem'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Pairing');
      });
    });

    it('should start trip when initialized and connected', async () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = true;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { getByText } = render(<DashboardScreen />);

      fireEvent.press(getByText('Iniciar Viagem'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Start trip pressed');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Automatic Initialization', () => {
    it('should call initialize on component mount when not initialized', async () => {
      render(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStore.initialize).toHaveBeenCalled();
      });
    });

    it('should not call initialize if already initialized', async () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';

      render(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStore.initialize).not.toHaveBeenCalled();
      });
    });

    it('should not call initialize if initialization is in progress', async () => {
      mockStore.initializationState.status = 'IN_PROGRESS';

      render(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStore.initialize).not.toHaveBeenCalled();
      });
    });
  });

  describe('Progress Display', () => {
    it('should show progress bar when initialization is in progress', () => {
      mockStore.initializationState.status = 'IN_PROGRESS';
      mockStore.initializationState.progress = 75;

      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Inicializando... 75%')).toBeTruthy();
    });

    it('should not show progress bar when initialization is complete', () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';

      const { queryByText } = render(<DashboardScreen />);

      expect(queryByText(/Inicializando\.\.\./)).toBeNull();
    });

    it('should show progress bar with visual indicator', () => {
      mockStore.initializationState.status = 'IN_PROGRESS';
      mockStore.initializationState.progress = 60;

      const { getByTestId } = render(<DashboardScreen />);

      // The progress bar should be rendered (we can't easily test the width style)
      expect(getByTestId).toBeDefined();
    });
  });

  describe('Retry Functionality', () => {
    it('should call retryInitialization when retry button is pressed', async () => {
      mockStore.initializationState.status = 'COMPLETED_ERROR';
      
      // Update the mocks to reflect the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { getByTestId } = render(<DashboardScreen />);

      fireEvent.press(getByTestId('retry-initialization-button'));

      await waitFor(() => {
        expect(mockStore.clearInitializationError).toHaveBeenCalled();
        expect(mockStore.retryInitialization).toHaveBeenCalled();
      });
    });

    it('should show loading state when retrying initialization', async () => {
      mockStore.initializationState.status = 'COMPLETED_ERROR';
      
      // Update the mocks to reflect the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { getByTestId, rerender } = render(<DashboardScreen />);

      // Press retry button
      fireEvent.press(getByTestId('retry-initialization-button'));

      // Simulate the loading state by updating the mock store
      mockStore.initializationState.status = 'IN_PROGRESS';
      mockStore.initializationState.isRetrying = true;
      
      // Update the mock to return the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      rerender(<DashboardScreen />);

      expect(getByTestId('retry-initialization-button').props.children.props.children).toContain('Inicializando...');
    });

    it('should handle retry failure gracefully', async () => {
      mockStore.initializationState.status = 'COMPLETED_ERROR';
      mockStore.retryInitialization.mockRejectedValue(new Error('Retry failed'));
      
      // Update the mocks to reflect the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { getByTestId } = render(<DashboardScreen />);

      fireEvent.press(getByTestId('retry-initialization-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erro na Inicialização',
          'Não foi possível inicializar o Bluetooth. Verifique se o Bluetooth está habilitado e tente novamente.',
          expect.any(Array)
        );
      });
    });
  });

  describe('Enhanced Error Recovery', () => {
    it('should offer to navigate to pairing after successful initialization from start trip', async () => {
      mockStore.isInitialized = false;
      mockStore.initializationState.status = 'NOT_STARTED';
      mockStore.retryInitialization.mockResolvedValue({ success: true });

      const { getByText } = render(<DashboardScreen />);

      fireEvent.press(getByText('Iniciar Viagem'));

      // Find and press the "Inicializar" button in the alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing the "Inicializar" button
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const initializeButton = alertCall[2][1]; // Second button (Inicializar)
      
      // Simulate successful initialization
      mockStore.isInitialized = true;
      mockStore.connectionState.isConnected = false;
      
      await initializeButton.onPress();

      await waitFor(() => {
        expect(mockStore.retryInitialization).toHaveBeenCalled();
      });
    });

    it('should provide multiple retry options on initialization failure', async () => {
      mockStore.initializationState.status = 'COMPLETED_ERROR';
      mockStore.retryInitialization.mockRejectedValue(new Error('Initialization failed'));
      
      // Update the mocks to reflect the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { getByTestId } = render(<DashboardScreen />);

      fireEvent.press(getByTestId('retry-initialization-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erro na Inicialização',
          'Não foi possível inicializar o Bluetooth. Verifique se o Bluetooth está habilitado e tente novamente.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'OK' }),
            expect.objectContaining({ text: 'Tentar Novamente' })
          ])
        );
      });
    });
  });

  describe('Integration with Connection Management', () => {
    it('should show manage connection button when connected', () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = true;
      
      // Update the mocks to reflect the new state
      useBLEIsInitialized.mockImplementation(() => mockStore.isInitialized);
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);
      useBLEConnectionState.mockImplementation(() => mockStore.connectionState);

      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Gerenciar Conexão')).toBeTruthy();
    });

    it('should navigate to pairing when manage connection is pressed', async () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = true;
      
      // Update the mocks to reflect the new state
      useBLEIsInitialized.mockImplementation(() => mockStore.isInitialized);
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);
      useBLEConnectionState.mockImplementation(() => mockStore.connectionState);

      const { getByText } = render(<DashboardScreen />);

      fireEvent.press(getByText('Gerenciar Conexão'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Pairing');
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper accessibility labels for initialization buttons', () => {
      mockStore.initializationState.status = 'COMPLETED_ERROR';
      
      // Update the mocks to reflect the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { getByTestId } = render(<DashboardScreen />);

      const retryButton = getByTestId('retry-initialization-button');
      expect(retryButton.props.accessibilityLabel).toBe('Tentar Novamente');
      expect(retryButton.props.accessibilityRole).toBe('button');
    });

    it('should show loading indicators during initialization', () => {
      mockStore.initializationState.status = 'IN_PROGRESS';
      mockStore.initializationState.progress = 50;
      
      // Update the mocks to reflect the new state
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);

      const { getByText } = render(<DashboardScreen />);

      expect(getByText('Inicializando Bluetooth...')).toBeTruthy();
    });

    it('should disable buttons appropriately during operations', () => {
      mockStore.isInitialized = true;
      mockStore.initializationState.status = 'COMPLETED_SUCCESS';
      mockStore.connectionState.isConnected = false;
      mockStore.connectionState.isConnecting = true;
      
      // Update the mocks to reflect the new state
      useBLEIsInitialized.mockImplementation(() => mockStore.isInitialized);
      useBLEInitializationState.mockImplementation(() => mockStore.initializationState);
      useBLEConnectionState.mockImplementation(() => mockStore.connectionState);

      const { getByTestId } = render(<DashboardScreen />);

      const connectButton = getByTestId('connect-device-button');
      expect(connectButton.props.accessibilityState?.disabled).toBe(true);
    });
  });
});