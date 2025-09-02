import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/types';
import { useBLEStore } from '../../stores/ble';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function BLETestComponent(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const { connectionState, initialize } = useBLEStore();

  const handleTestNavigation = () => {
    console.log('Testing navigation to Pairing screen...');
    try {
      navigation.navigate('Pairing');
      console.log('Navigation successful!');
    } catch (error) {
      console.error('Navigation failed:', error);
      Alert.alert('Erro', `Falha na navegação: ${error}`);
    }
  };

  const handleTestBLE = async () => {
    console.log('Testing BLE initialization...');
    try {
      await initialize();
      console.log('BLE initialization successful!');
      Alert.alert('Sucesso', 'BLE inicializado com sucesso!');
    } catch (error) {
      console.error('BLE initialization failed:', error);
      Alert.alert('Erro', `Falha na inicialização BLE: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste de Componentes</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleTestNavigation}>
        <Text style={styles.buttonText}>Testar Navegação para Pairing</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleTestBLE}>
        <Text style={styles.buttonText}>Testar Inicialização BLE</Text>
      </TouchableOpacity>

      <View style={styles.status}>
        <Text style={styles.statusTitle}>Status BLE:</Text>
        <Text style={styles.statusText}>
          Conectado: {connectionState.isConnected ? 'Sim' : 'Não'}
        </Text>
        <Text style={styles.statusText}>
          Escaneando: {connectionState.isScanning ? 'Sim' : 'Não'}
        </Text>
        <Text style={styles.statusText}>
          Conectando: {connectionState.isConnecting ? 'Sim' : 'Não'}
        </Text>
        <Text style={styles.statusText}>
          Dispositivos: {connectionState.availableDevices.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 2,
  },
});