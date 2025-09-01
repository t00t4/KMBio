import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useBLEStore } from '../../stores/ble';
import { BLEStatusIndicator } from './BLEStatusIndicator';

export const BLETestComponent: React.FC = () => {
  const {
    initialize,
    scanForDevices,
    connectToDevice,
    disconnect,
    connectionState,
    isInitialized
  } = useBLEStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((error) => {
        Alert.alert('Erro de Inicialização', `Falha ao inicializar BLE: ${error}`);
      });
    }
  }, [initialize, isInitialized]);

  const handleScan = async () => {
    try {
      const devices = await scanForDevices(10000);
      Alert.alert(
        'Dispositivos Encontrados',
        `Encontrados ${devices.length} dispositivos:\n${devices.map(d => d.name || d.id).join('\n')}`
      );
    } catch (error) {
      Alert.alert('Erro no Scan', `${error}`);
    }
  };

  const handleConnect = async () => {
    if (connectionState.availableDevices.length === 0) {
      Alert.alert('Nenhum Dispositivo', 'Execute um scan primeiro para encontrar dispositivos.');
      return;
    }

    try {
      const firstDevice = connectionState.availableDevices[0];
      await connectToDevice(firstDevice.id);
      Alert.alert('Conectado', `Conectado ao dispositivo: ${firstDevice.name || firstDevice.id}`);
    } catch (error) {
      Alert.alert('Erro de Conexão', `${error}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      Alert.alert('Desconectado', 'Dispositivo desconectado com sucesso.');
    } catch (error) {
      Alert.alert('Erro ao Desconectar', `${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste BLE</Text>
      
      <BLEStatusIndicator showDetails={true} />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.scanButton]} 
          onPress={handleScan}
          disabled={connectionState.isScanning}
        >
          <Text style={styles.buttonText}>
            {connectionState.isScanning ? 'Procurando...' : 'Escanear Dispositivos'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.connectButton]} 
          onPress={handleConnect}
          disabled={connectionState.isConnecting || connectionState.isConnected || connectionState.availableDevices.length === 0}
        >
          <Text style={styles.buttonText}>
            {connectionState.isConnecting ? 'Conectando...' : 'Conectar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.disconnectButton]} 
          onPress={handleDisconnect}
          disabled={!connectionState.isConnected}
        >
          <Text style={styles.buttonText}>Desconectar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Estado da Conexão:</Text>
        <Text style={styles.infoText}>Inicializado: {isInitialized ? 'Sim' : 'Não'}</Text>
        <Text style={styles.infoText}>Escaneando: {connectionState.isScanning ? 'Sim' : 'Não'}</Text>
        <Text style={styles.infoText}>Conectando: {connectionState.isConnecting ? 'Sim' : 'Não'}</Text>
        <Text style={styles.infoText}>Conectado: {connectionState.isConnected ? 'Sim' : 'Não'}</Text>
        <Text style={styles.infoText}>Dispositivos: {connectionState.availableDevices.length}</Text>
        {connectionState.connectedDevice && (
          <Text style={styles.infoText}>
            Dispositivo Conectado: {connectionState.connectedDevice.name || connectionState.connectedDevice.id}
          </Text>
        )}
        {connectionState.lastError && (
          <Text style={styles.errorText}>
            Último Erro: {connectionState.lastError.message}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#2196F3',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginVertical: 2,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    marginVertical: 2,
    color: '#F44336',
  },
});