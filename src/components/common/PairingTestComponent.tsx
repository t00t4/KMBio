import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useBLEStore } from '../../stores/ble';
import { BLEDevice } from '../../types/ble';

interface PairingTestComponentProps {
  onClose: () => void;
}

export default function PairingTestComponent({ onClose }: PairingTestComponentProps): React.JSX.Element {
  const {
    connectionState,
    initialize,
    scanForDevices,
    connectToDevice,
    disconnect,
    clearError,
    isInitialized
  } = useBLEStore();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runFullTest = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    try {
      addTestResult('🔄 Iniciando testes de pareamento...');

      // Test 1: Initialize BLE
      addTestResult('📱 Teste 1: Inicializando BLE Manager...');
      if (!isInitialized) {
        await initialize();
        addTestResult('✅ BLE Manager inicializado com sucesso');
      } else {
        addTestResult('✅ BLE Manager já estava inicializado');
      }

      // Test 2: Scan for devices
      addTestResult('🔍 Teste 2: Escaneando dispositivos BLE...');
      const devices = await scanForDevices(5000); // 5 second scan
      addTestResult(`✅ Encontrados ${devices.length} dispositivos`);
      
      if (devices.length === 0) {
        addTestResult('⚠️ Nenhum dispositivo encontrado - teste limitado');
        return;
      }

      // Test 3: Filter ELM327 devices
      const elm327Devices = devices.filter(device => {
        const name = (device.name || device.localName || '').toLowerCase();
        return /elm327|obd|obdii|obd-ii/.test(name);
      });
      
      addTestResult(`🚗 Teste 3: Encontrados ${elm327Devices.length} dispositivos ELM327`);

      if (elm327Devices.length === 0) {
        addTestResult('⚠️ Nenhum dispositivo ELM327 encontrado - usando primeiro dispositivo disponível');
      }

      // Test 4: Connection test (with first available device)
      const testDevice = elm327Devices.length > 0 ? elm327Devices[0] : devices[0];
      addTestResult(`🔗 Teste 4: Tentando conectar a ${testDevice.name || 'Dispositivo Desconhecido'}...`);
      
      try {
        await connectToDevice(testDevice.id);
        addTestResult('✅ Conexão estabelecida com sucesso');
        
        // Test 5: Basic communication test
        addTestResult('💬 Teste 5: Testando comunicação básica...');
        
        // Import OBD service for testing
        const { OBDService } = await import('../../services/obd/OBDService');
        const obdService = new OBDService(useBLEStore.getState().bleManager!);
        
        try {
          await obdService.validateConnection();
          addTestResult('✅ Comunicação OBD-II validada');
        } catch (error) {
          addTestResult(`⚠️ Comunicação OBD-II falhou: ${error}`);
        }
        
        // Test 6: Disconnect
        addTestResult('🔌 Teste 6: Desconectando...');
        await disconnect();
        addTestResult('✅ Desconexão realizada com sucesso');
        
      } catch (error) {
        addTestResult(`❌ Falha na conexão: ${error}`);
      }

      addTestResult('🎉 Testes de pareamento concluídos!');
      
    } catch (error) {
      addTestResult(`❌ Erro durante os testes: ${error}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const testScanOnly = async () => {
    try {
      addTestResult('🔍 Iniciando scan rápido...');
      
      if (!isInitialized) {
        await initialize();
      }
      
      const devices = await scanForDevices(3000);
      addTestResult(`✅ Scan concluído: ${devices.length} dispositivos encontrados`);
      
      devices.forEach((device, index) => {
        const isELM = /elm327|obd|obdii|obd-ii/i.test(device.name || device.localName || '');
        const icon = isELM ? '🚗' : '📱';
        addTestResult(`${icon} ${index + 1}. ${device.name || 'Sem nome'} (${device.rssi} dBm)`);
      });
      
    } catch (error) {
      addTestResult(`❌ Erro no scan: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    clearError();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teste de Pareamento BLE</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runFullTest}
          disabled={isRunningTests || connectionState.isScanning}
        >
          <Text style={styles.primaryButtonText}>
            {isRunningTests ? 'Executando...' : 'Teste Completo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testScanOnly}
          disabled={isRunningTests || connectionState.isScanning}
        >
          <Text style={styles.secondaryButtonText}>Scan Rápido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.clearButtonText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {connectionState.lastError && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={20} color="#F44336" />
          <Text style={styles.errorText}>{connectionState.lastError.message}</Text>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsTitle}>Resultados dos Testes:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>Nenhum teste executado ainda</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultItem}>
              {result}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: '#d32f2f',
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noResults: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
});