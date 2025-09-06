import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { BluetoothInitializationError } from '../../../components/common/BluetoothInitializationError';
import { BluetoothInitializationError as IBluetoothInitializationError } from '../../../types/ble';

// Get the mocked Alert
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;



describe('BluetoothInitializationError', () => {
  const createMockError = (
    code: IBluetoothInitializationError['code'],
    overrides?: Partial<IBluetoothInitializationError>
  ): IBluetoothInitializationError => ({
    code,
    message: 'Test error message',
    technicalDetails: 'Technical details for testing',
    timestamp: new Date(),
    recoverable: true,
    recoverySteps: ['Step 1', 'Step 2'],
    diagnosticInfo: {
      deviceModel: 'Test Device',
      osVersion: '10.0',
      appVersion: '1.0.0',
      bleLibraryVersion: '3.5.0',
      initializationAttempts: 1,
      stateHistory: [],
      permissionHistory: [],
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error with correct title and message', () => {
    const error = createMockError('BLUETOOTH_DISABLED');
    render(<BluetoothInitializationError error={error} />);

    expect(screen.getByLabelText('error-title')).toHaveTextContent('Bluetooth Desligado');
    expect(screen.getByLabelText('error-message')).toHaveTextContent('Test error message');
  });

  it('displays correct icons for different error types', () => {
    const testCases = [
      { code: 'BLUETOOTH_NOT_SUPPORTED' as const, icon: '⚠️' },
      { code: 'BLUETOOTH_DISABLED' as const, icon: '📱' },
      { code: 'PERMISSIONS_DENIED' as const, icon: '🔒' },
      { code: 'PERMISSIONS_NEVER_ASK_AGAIN' as const, icon: '🔒' },
      { code: 'TIMEOUT_ERROR' as const, icon: '⏱️' },
      { code: 'UNKNOWN_ERROR' as const, icon: '❌' },
    ];

    testCases.forEach(({ code, icon }) => {
      const { unmount } = render(
        <BluetoothInitializationError error={createMockError(code)} />
      );

      expect(screen.getByLabelText('error-icon')).toHaveTextContent(icon);
      unmount();
    });
  });

  it('displays recovery steps when provided', () => {
    const error = createMockError('BLUETOOTH_DISABLED', {
      recoverySteps: ['Turn on Bluetooth', 'Try again'],
    });

    render(<BluetoothInitializationError error={error} />);

    expect(screen.getByText(/Para resolver:/)).toBeTruthy();
    expect(screen.getByText('Turn on Bluetooth')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  it('calls onRetry when retry button is pressed', () => {
    const onRetry = jest.fn();
    const error = createMockError('BLE_MANAGER_INIT_FAILED');

    render(<BluetoothInitializationError error={error} onRetry={onRetry} />);

    const retryButton = screen.getByLabelText('Tentar Novamente');
    fireEvent.press(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSettings when settings button is pressed', () => {
    const onOpenSettings = jest.fn();
    const error = createMockError('BLUETOOTH_DISABLED');

    render(<BluetoothInitializationError error={error} onOpenSettings={onOpenSettings} />);

    const settingsButton = screen.getByLabelText('Abrir Configurações');
    fireEvent.press(settingsButton);

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is pressed', () => {
    const onDismiss = jest.fn();
    const error = createMockError('BLUETOOTH_DISABLED');

    render(<BluetoothInitializationError error={error} onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText('Fechar');
    fireEvent.press(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows technical details button when showTechnicalDetails is true', () => {
    const error = createMockError('BLUETOOTH_DISABLED');

    render(<BluetoothInitializationError error={error} showTechnicalDetails={true} />);

    expect(screen.getByLabelText('Detalhes Técnicos')).toBeTruthy();
  });

  it('does not show technical details button when showTechnicalDetails is false', () => {
    const error = createMockError('BLUETOOTH_DISABLED');

    render(<BluetoothInitializationError error={error} showTechnicalDetails={false} />);

    expect(screen.queryByLabelText('Detalhes Técnicos')).toBeNull();
  });

  it('shows technical details alert when technical details button is pressed', () => {
    const error = createMockError('BLUETOOTH_DISABLED');

    render(<BluetoothInitializationError error={error} showTechnicalDetails={true} />);

    const technicalButton = screen.getByLabelText('Detalhes Técnicos');
    fireEvent.press(technicalButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'Detalhes Técnicos',
      expect.stringContaining('Código: BLUETOOTH_DISABLED'),
      [{ text: 'OK' }]
    );
  });

  it('shows correct primary action for different error types', () => {
    // BLUETOOTH_DISABLED should show "Abrir Configurações"
    const { rerender } = render(
      <BluetoothInitializationError error={createMockError('BLUETOOTH_DISABLED')} />
    );
    expect(screen.getByLabelText('Abrir Configurações')).toBeTruthy();

    // PERMISSIONS_DENIED (recoverable) should show "Tentar Novamente"
    rerender(
      <BluetoothInitializationError
        error={createMockError('PERMISSIONS_DENIED', { recoverable: true })}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Tentar Novamente')).toBeTruthy();

    // PERMISSIONS_NEVER_ASK_AGAIN should show "Abrir Configurações"
    rerender(
      <BluetoothInitializationError error={createMockError('PERMISSIONS_NEVER_ASK_AGAIN')} />
    );
    expect(screen.getByLabelText('Abrir Configurações')).toBeTruthy();
  });

  it('does not show retry button for non-recoverable errors', () => {
    const error = createMockError('BLUETOOTH_NOT_SUPPORTED', { recoverable: false });

    render(<BluetoothInitializationError error={error} onRetry={jest.fn()} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows default alert when onOpenSettings is not provided', () => {
    const error = createMockError('BLUETOOTH_DISABLED');

    render(<BluetoothInitializationError error={error} />);

    const settingsButton = screen.getByLabelText('Abrir Configurações');
    fireEvent.press(settingsButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'Configurações',
      'Abra as configurações do dispositivo e ligue o Bluetooth'
    );
  });

  it('handles empty recovery steps gracefully', () => {
    const error = createMockError('BLUETOOTH_DISABLED', { recoverySteps: [] });

    render(<BluetoothInitializationError error={error} />);

    expect(screen.queryByText('Para resolver:')).toBeNull();
  });

  it('renders multiple recovery steps with correct numbering', () => {
    const error = createMockError('BLUETOOTH_DISABLED', {
      recoverySteps: ['First step', 'Second step', 'Third step'],
    });

    render(<BluetoothInitializationError error={error} />);

    expect(screen.getByText(/1\./)).toBeTruthy();
    expect(screen.getByText(/2\./)).toBeTruthy();
    expect(screen.getByText(/3\./)).toBeTruthy();
    expect(screen.getByText('First step')).toBeTruthy();
    expect(screen.getByText('Second step')).toBeTruthy();
    expect(screen.getByText('Third step')).toBeTruthy();
  });
});