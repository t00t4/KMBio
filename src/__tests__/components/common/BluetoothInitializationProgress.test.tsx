import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BluetoothInitializationProgress } from '../../../components/common/BluetoothInitializationProgress';
import { BluetoothInitializationStatus } from '../../../types/ble';

describe('BluetoothInitializationProgress', () => {
  it('renders with default message for NOT_STARTED status', () => {
    render(<BluetoothInitializationProgress status="NOT_STARTED" />);
    
    expect(screen.getByText('Preparando inicialização do Bluetooth...')).toBeTruthy();
  });

  it('renders with default message for IN_PROGRESS status', () => {
    render(<BluetoothInitializationProgress status="IN_PROGRESS" />);
    
    expect(screen.getByText('Inicializando Bluetooth...')).toBeTruthy();
  });

  it('renders with default message for RETRYING status', () => {
    render(<BluetoothInitializationProgress status="RETRYING" />);
    
    expect(screen.getByText('Tentando novamente...')).toBeTruthy();
  });

  it('renders with default message for COMPLETED_SUCCESS status', () => {
    render(<BluetoothInitializationProgress status="COMPLETED_SUCCESS" />);
    
    expect(screen.getByText('Bluetooth inicializado com sucesso!')).toBeTruthy();
  });

  it('renders with default message for COMPLETED_ERROR status', () => {
    render(<BluetoothInitializationProgress status="COMPLETED_ERROR" />);
    
    expect(screen.getByText('Falha na inicialização do Bluetooth')).toBeTruthy();
  });

  it('renders with custom message when provided', () => {
    const customMessage = 'Custom initialization message';
    render(
      <BluetoothInitializationProgress 
        status="IN_PROGRESS" 
        message={customMessage} 
      />
    );
    
    expect(screen.getByText(customMessage)).toBeTruthy();
  });

  it('shows spinner for loading states', () => {
    const { rerender } = render(<BluetoothInitializationProgress status="NOT_STARTED" />);
    
    // Should show spinner for NOT_STARTED
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    
    // Should show spinner for IN_PROGRESS
    rerender(<BluetoothInitializationProgress status="IN_PROGRESS" />);
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    
    // Should show spinner for RETRYING
    rerender(<BluetoothInitializationProgress status="RETRYING" />);
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    
    // Should NOT show spinner for COMPLETED_SUCCESS
    rerender(<BluetoothInitializationProgress status="COMPLETED_SUCCESS" />);
    expect(screen.queryByTestId('activity-indicator')).toBeNull();
    
    // Should NOT show spinner for COMPLETED_ERROR
    rerender(<BluetoothInitializationProgress status="COMPLETED_ERROR" />);
    expect(screen.queryByTestId('activity-indicator')).toBeNull();
  });

  it('shows progress bar when showProgressBar is true', () => {
    render(
      <BluetoothInitializationProgress 
        status="IN_PROGRESS" 
        showProgressBar={true}
        progress={0.5}
      />
    );
    
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('does not show progress bar when showProgressBar is false', () => {
    render(
      <BluetoothInitializationProgress 
        status="IN_PROGRESS" 
        showProgressBar={false}
        progress={0.5}
      />
    );
    
    expect(screen.queryByText('50%')).toBeNull();
  });

  it('handles progress values correctly', () => {
    const { rerender } = render(
      <BluetoothInitializationProgress 
        status="IN_PROGRESS" 
        showProgressBar={true}
        progress={0}
      />
    );
    
    expect(screen.getByText('0%')).toBeTruthy();
    
    rerender(
      <BluetoothInitializationProgress 
        status="IN_PROGRESS" 
        showProgressBar={true}
        progress={0.75}
      />
    );
    
    expect(screen.getByText('75%')).toBeTruthy();
    
    rerender(
      <BluetoothInitializationProgress 
        status="IN_PROGRESS" 
        showProgressBar={true}
        progress={1}
      />
    );
    
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('applies correct colors for different statuses', () => {
    const testCases: Array<{
      status: BluetoothInitializationStatus;
      expectedColor: string;
    }> = [
      { status: 'COMPLETED_SUCCESS', expectedColor: '#4ECDC4' },
      { status: 'COMPLETED_ERROR', expectedColor: '#FF6B6B' },
      { status: 'RETRYING', expectedColor: '#FFE66D' },
      { status: 'IN_PROGRESS', expectedColor: '#2E7D32' },
      { status: 'NOT_STARTED', expectedColor: '#2E7D32' },
    ];

    testCases.forEach(({ status, expectedColor }) => {
      const { unmount } = render(<BluetoothInitializationProgress status={status} />);
      
      const messageElement = screen.getByText(
        status === 'COMPLETED_SUCCESS' ? 'Bluetooth inicializado com sucesso!' :
        status === 'COMPLETED_ERROR' ? 'Falha na inicialização do Bluetooth' :
        status === 'RETRYING' ? 'Tentando novamente...' :
        status === 'IN_PROGRESS' ? 'Inicializando Bluetooth...' :
        'Preparando inicialização do Bluetooth...'
      );
      
      expect(messageElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: expectedColor })
        ])
      );
      
      unmount();
    });
  });
});