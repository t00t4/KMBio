import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

export default function PairingScreen(): React.JSX.Element {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    // TODO: Implement actual BLE scanning
    global.setTimeout(() => {
      setDevices([
        { id: '1', name: 'ELM327 OBD-II', rssi: -45 },
        { id: '2', name: 'OBDII Scanner', rssi: -67 },
      ]);
      setIsScanning(false);
    }, 3000);
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleConnect = () => {
    if (selectedDevice) {
      // TODO: Implement actual connection logic
      console.log('Connecting to device:', selectedDevice);
    }
  };

  const renderDevice = ({ item }: { item: BLEDevice }) => (
    <TouchableOpacity
      style={[
        styles.deviceItem,
        selectedDevice === item.id && styles.selectedDevice,
      ]}
      onPress={() => handleDeviceSelect(item.id)}
    >
      <View style={styles.deviceInfo}>
        <Icon name="bluetooth" size={24} color="#2E7D32" />
        <View style={styles.deviceDetails}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceRssi}>Sinal: {item.rssi} dBm</Text>
        </View>
      </View>
      {selectedDevice === item.id && (
        <Icon name="check-circle" size={24} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conectar Dispositivo OBD-II</Text>
        <Text style={styles.subtitle}>
          Certifique-se de que seu dispositivo ELM327 está conectado ao veículo e o Bluetooth está ativado
        </Text>
      </View>

      <View style={styles.content}>
        {!isScanning && devices.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="bluetooth-searching" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Nenhum dispositivo encontrado
            </Text>
            <Text style={styles.emptySubtext}>
              Toque em "Buscar Dispositivos" para começar
            </Text>
          </View>
        )}

        {isScanning && (
          <View style={styles.scanningState}>
            <Icon name="bluetooth-searching" size={64} color="#2E7D32" />
            <Text style={styles.scanningText}>Procurando dispositivos...</Text>
          </View>
        )}

        {devices.length > 0 && (
          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.id}
            style={styles.deviceList}
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleStartScan}
          disabled={isScanning}
        >
          <Text style={styles.secondaryButtonText}>
            {isScanning ? 'Buscando...' : 'Buscar Dispositivos'}
          </Text>
        </TouchableOpacity>

        {selectedDevice && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleConnect}
          >
            <Text style={styles.primaryButtonText}>Conectar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  scanningState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 18,
    color: '#2E7D32',
    marginTop: 16,
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDevice: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceDetails: {
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  deviceRssi: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '500',
  },
});