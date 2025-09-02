import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { BluetoothInitializationStatus } from '../../../components/common/BluetoothInitializationStatus';
import { 
  BluetoothInitializationResult,
  BluetoothInitializationStatus as IBluetoothInitializationStatus,
  BluetoothInitializationError,
} from '../../../types/ble';

// Mock Linking
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Linking: {
    openSettings: jest.fn(),
    openURL: jest.fn(),
  },
  Platform: {
    OS: 'android',
  },
}));

const mockLinking = Linking as jest.Mocked<typeof Linking>;

describe('BluetoothInitializationStatus', () => {
  const createMockResult = (
    success: boolean,
    overrides?: Partial<BluetoothInitializationResult>
  ): BluetoothInitializationResult => ({
    success,
    capabilities: {
      bleSupported: true,
      permissionsGranted: true,
      bluetoothEnabled: true,
      canScan: true,
      canConnect: true,
    },
    recommendations: ['System ready for use'],
    ...overrides,
  });

  const createMockError = (): BluetoothInitializationError => ({
    code: 'BLUETOOTH_DISABLED',
    message: 'Bluetooth is disabled',
    technicalDetails: 'Technical details',
    timestamp: new Date(),
    recoverable: true,
    recoverySteps: ['Turn on Bluetooth'],
    diagnosticInfo: {
      deviceModel: 'Test Device',
      osVersion: '10.0',
      appVersion: '1.0.0',
      bleLibraryVersion: '3.5.0',
      initializationAttempts: 1,
      stateHistory: [],
      permissionHistory: [],
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders progress component for loading states', () => {
    const { rerender } = render(
      <BluetoothInitializationStatus status="NOT_STARTED" />
    );
    
    expect(screen.getByText('Preparando inicialização do Bluetooth...')).toBeTruthy();
    
    rerender(<BluetoothInitializationStatus status="IN_PROGRESS" />);
    expect(screen.getByText('Inicializando Bluetooth...')).toBeTruthy();
    
    rerender(<BluetoothInitializationStatus status="RETRYING" />);
    expect(screen.getByText('Tentando novamente...')).toBeTruthy();
  });

  it('renders error component when status is COMPLETED_ERROR', () => {
    const result = createMockResult(false, {
      error: createMockError(),
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_ERROR" 
        result={result}
      />
    );
    
    expect(screen.getByText('Bluetooth Desligado')).toBeTruthy();
    expect(screen.getByText('Bluetooth is disabled')).toBeTruthy();
  });

  it('renders compact success view when compact is true', () => {
    const result = createMockResult(true);
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_SUCCESS" 
        result={result}
        compact={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeTruthy();
    expect(screen.getByText('Bluetooth Pronto')).toBeTruthy();
  });

  it('renders full success view with capabilities when compact is false', () => {
    const result = createMockResult(true, {
      capabilities: {
        bleSupported: true,
        permissionsGranted: true,
        bluetoothEnabled: true,
        canScan: true,
        canConnect: true,
      },
      recommendations: ['System is ready', 'All features available'],
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_SUCCESS" 
        result={result}
        compact={false}
      />
    );
    
    expect(screen.getByText('Status do Sistema:')).toBeTruthy();
    expect(screen.getByText('Bluetooth Low Energy Suportado')).toBeTruthy();
    expect(screen.getByText('Permissões Concedidas')).toBeTruthy();
    expect(screen.getByText('Bluetooth Ligado')).toBeTruthy();
    expect(screen.getByText('Pronto para Conectar')).toBeTruthy();
    
    expect(screen.getByText('Recomendações:')).toBeTruthy();
    expect(screen.getByText('• System is ready')).toBeTruthy();
    expect(screen.getByText('• All features available')).toBeTruthy();
  });

  it('shows correct capability status icons', () => {
    const result = createMockResult(true, {
      capabilities: {
        bleSupported: false,
        permissionsGranted: false,
        bluetoothEnabled: false,
        canScan: false,
        canConnect: false,
      },
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_SUCCESS" 
        result={result}
        compact={false}
      />
    );
    
    expect(screen.getByText('Bluetooth Low Energy Não Suportado')).toBeTruthy();
    expect(screen.getByText('Permissões Negadas')).toBeTruthy();
    expect(screen.getByText('Bluetooth Desligado')).toBeTruthy();
    expect(screen.getByText('Não Pode Conectar')).toBeTruthy();
  });

  it('calls onRetry when retry is triggered from error component', () => {
    const onRetry = jest.fn();
    const result = createMockResult(false, {
      error: createMockError(),
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_ERROR" 
        result={result}
        onRetry={onRetry}
      />
    );
    
    const retryButton = screen.getByText('Tentar Novamente');
    fireEvent.press(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is pressed', () => {
    const onDismiss = jest.fn();
    const result = createMockResult(true);
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_SUCCESS" 
        result={result}
        onDismiss={onDismiss}
      />
    );
    
    const dismissButton = screen.getByText('OK');
    fireEvent.press(dismissButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('opens Bluetooth settings for BLUETOOTH_DISABLED error', async () => {
    const result = createMockResult(false, {
      error: createMockError(),
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_ERROR" 
        result={result}
      />
    );
    
    const settingsButton = screen.getByText('Abrir Configurações');
    fireEvent.press(settingsButton);
    
    await waitFor(() => {
      expect(mockLinking.openSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('opens app settings for permission errors', async () => {
    const result = createMockResult(false, {
      error: {
        ...createMockError(),
        code: 'PERMISSIONS_NEVER_ASK_AGAIN',
      },
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_ERROR" 
        result={result}
      />
    );
    
    const settingsButton = screen.getByText('Abrir Configurações');
    fireEvent.press(settingsButton);
    
    await waitFor(() => {
      expect(mockLinking.openSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('handles Linking errors gracefully', async () => {
    mockLinking.openSettings.mockRejectedValueOnce(new Error('Cannot open settings'));
    
    const result = createMockResult(false, {
      error: createMockError(),
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_ERROR" 
        result={result}
      />
    );
    
    const settingsButton = screen.getByText('Abrir Configurações');
    fireEvent.press(settingsButton);
    
    // Should not throw error
    await waitFor(() => {
      expect(mockLinking.openSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('does not show recommendations section when empty', () => {
    const result = createMockResult(true, {
      recommendations: [],
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_SUCCESS" 
        result={result}
        compact={false}
      />
    );
    
    expect(screen.queryByText('Recomendações:')).toBeNull();
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    const result = createMockResult(true);
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_SUCCESS" 
        result={result}
      />
    );
    
    expect(screen.queryByText('OK')).toBeNull();
  });

  it('passes showTechnicalDetails prop to error component', () => {
    const result = createMockResult(false, {
      error: createMockError(),
    });
    
    render(
      <BluetoothInitializationStatus 
        status="COMPLETED_ERROR" 
        result={result}
        showTechnicalDetails={true}
      />
    );
    
    expect(screen.getByText('Detalhes Técnicos')).toBeTruthy();
  });

  it('shows progress bar for IN_PROGRESS and RETRYING states', () => {
    const { rerender } = render(
      <BluetoothInitializationStatus status="IN_PROGRESS" />
    );
    
    // Should show progress percentage for IN_PROGRESS
    expect(screen.getByText(/\d+%/)).toBeTruthy();
    
    rerender(<BluetoothInitializationStatus status="RETRYING" />);
    
    // Should show progress percentage for RETRYING
    expect(screen.getByText(/\d+%/)).toBeTruthy();
  });

  it('does not show progress bar for non-loading states', () => {
    const { rerender } = render(
      <BluetoothInitializationStatus status="NOT_STARTED" />
    );
    
    expect(screen.queryByText(/\d+%/)).toBeNull();
    
    rerender(<BluetoothInitializationStatus status="COMPLETED_SUCCESS" />);
    expect(screen.queryByText(/\d+%/)).toBeNull();
  });
});