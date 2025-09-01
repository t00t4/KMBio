import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useBLEStore, useBLEConnectionState, useBLEError } from '../../stores/ble';
import { BluetoothUtils, BluetoothState } from '../../utils/bluetooth';

interface BLEStatusIndicatorProps {
  onPress?: () => void;
  showDetails?: boolean;
}

export const BLEStatusIndicator: React.FC<BLEStatusIndicatorProps> = ({
  onPress,
  showDetails = false
}) => {
  const { initialize, isInitialized } = useBLEStore();
  const connectionState = useBLEConnectionState();
  const error = useBLEError();
  const [bluetoothState, setBluetoothState] = useState<BluetoothState | null>(null);

  useEffect(() => {
    // Initialize BLE store if not already initialized
    if (!isInitialized) {
      initialize().catch(console.error);
    }

    // Monitor Bluetooth state
    const cleanup = BluetoothUtils.monitorBluetoothState(setBluetoothState);
    
    // Get initial state
    BluetoothUtils.getBluetoothState().then(setBluetoothState);

    return cleanup;
  }, [initialize, isInitialized]);

  const getStatusColor = (): string => {
    if (error) return '#FF6B6B'; // Red for errors
    if (connectionState.isConnected) return '#4ECDC4'; // Teal for connected
    if (connectionState.isConnecting) return '#FFE66D'; // Yellow for connecting
    if (bluetoothState?.isEnabled) return '#95E1D3'; // Light green for BT enabled
    return '#FFA07A'; // Light red for BT disabled
  };

  const getStatusText = (): string => {
    if (error) return 'Erro BLE';
    if (connectionState.isConnected) return 'Conectado';
    if (connectionState.isConnecting) return 'Conectando...';
    if (connectionState.isScanning) return 'Procurando...';
    if (bluetoothState?.isEnabled) return 'BT Ligado';
    return 'BT Desligado';
  };

  const getDetailText = (): string => {
    if (error) return error.message;
    if (connectionState.connectedDevice) {
      return `Conectado: ${connectionState.connectedDevice.name || 'Dispositivo'}`;
    }
    if (bluetoothState) {
      return BluetoothUtils.getBluetoothStateMessage(bluetoothState.state);
    }
    return 'Verificando estado...';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: getStatusColor() }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.indicator} />
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {showDetails && (
          <Text style={styles.detailText}>{getDetailText()}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  detailText: {
    fontSize: 12,
    color: '#34495E',
    marginTop: 2,
  },
});