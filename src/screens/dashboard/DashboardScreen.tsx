import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/types';
import {
  useBLEConnectionState,
  useBLEConnectedDevice,
  useBLEInitializationState,
  useBLEIsInitialized,
  useBLEStore
} from '../../stores/ble';
import BLETestComponent from '../../components/common/BLETestComponent';
import { BluetoothInitializationError } from '../../components/common/BluetoothInitializationError';
import { handleNavigationError, debounceNavigation } from '../../utils/navigationErrorHandler';
import { logButtonPress, logNavigation, logNavigationError, logUserInteraction } from '../../utils/debugLogger';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function DashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const connectionState = useBLEConnectionState();
  const connectedDevice = useBLEConnectedDevice();
  const initializationState = useBLEInitializationState();
  const isInitialized = useBLEIsInitialized();
  const { initialize, retryInitialization, clearInitializationError } = useBLEStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  // Initialize Bluetooth on component mount
  useEffect(() => {
    // Guard against calling initialize when already initialized or in progress
    if (!isInitialized && initializationState?.status !== 'IN_PROGRESS') {
      initializeBluetooth();
    }
  }, [isInitialized, initializationState?.status]);

  const initializeBluetooth = async () => {
    if (isInitialized || initializationState?.status === 'IN_PROGRESS') {
      return;
    }

    try {
      setIsInitializing(true);
      await initialize();
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRetryInitialization = async () => {
    try {
      setIsInitializing(true);
      clearInitializationError();
      await retryInitialization();
    } catch (error) {
      console.error('Failed to retry initialization:', error);
      Alert.alert(
        'Erro na Inicialização',
        'Não foi possível inicializar o Bluetooth. Verifique se o Bluetooth está habilitado e tente novamente.',
        [
          { text: 'OK' },
          { text: 'Tentar Novamente', onPress: () => setTimeout(handleRetryInitialization, 1000) }
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStartTrip = () => {
    // Check initialization status first
    if (!isInitialized || initializationState?.status !== 'COMPLETED_SUCCESS') {
      Alert.alert(
        'Bluetooth Não Inicializado',
        'O sistema Bluetooth precisa ser inicializado antes de iniciar uma viagem.',
        [
          { text: 'Cancelar' },
          { 
            text: 'Inicializar', 
            onPress: async () => {
              await handleRetryInitialization();
              // After successful initialization, check connection again
              if (isInitialized && !connectionState?.isConnected) {
                Alert.alert(
                  'Conectar Dispositivo',
                  'Bluetooth inicializado com sucesso! Agora você precisa conectar um dispositivo OBD-II.',
                  [
                    { text: 'Mais Tarde' },
                    { text: 'Conectar Agora', onPress: () => navigation.navigate('Pairing') }
                  ]
                );
              }
            }
          }
        ]
      );
      return;
    }

    if (!connectionState?.isConnected) {
      // Navigate to pairing if not connected
      navigation.navigate('Pairing');
    } else {
      // TODO: Start trip functionality
      console.log('Start trip pressed');
    }
  };

  const handleConnectOBD = debounceNavigation(async () => {
    const context = { screen: 'Dashboard', component: 'ConnectOBDButton' };
    const startTime = Date.now();

    logButtonPress('Connect OBD Device', context, {
      connectionState: connectionState?.isConnected ? 'connected' : 'disconnected',
      isConnecting: connectionState?.isConnecting,
      connectedDevice: connectedDevice?.name || null,
      initializationStatus: initializationState?.status,
      isInitialized,
      timestamp: new Date().toISOString()
    });

    // Check initialization status first
    if (!isInitialized || initializationState?.status !== 'COMPLETED_SUCCESS') {
      Alert.alert(
        'Bluetooth Não Inicializado',
        'O sistema Bluetooth precisa ser inicializado antes de conectar dispositivos.',
        [
          { text: 'Cancelar' },
          { text: 'Inicializar', onPress: handleRetryInitialization }
        ]
      );
      return;
    }

    // Prevent multiple simultaneous navigation attempts
    if (isNavigating) {
      logUserInteraction('Duplicate navigation attempt blocked', context, {
        reason: 'Already navigating',
        currentState: 'navigating'
      });
      return;
    }

    // Additional validation checks
    if (connectionState?.isConnecting) {
      logUserInteraction('Navigation blocked - device connecting', context, {
        reason: 'Device is currently connecting',
        connectionState: 'connecting'
      });
      return;
    }

    try {
      setIsNavigating(true);
      logUserInteraction('Navigation state set to loading', context, {
        previousState: 'idle',
        newState: 'navigating'
      });

      // Enhanced navigation validation
      if (!navigation) {
        throw new Error('Navigation object not available - navigation context missing');
      }

      // Validate navigation state
      if (!navigation.navigate) {
        throw new Error('Navigation.navigate function not available');
      }

      // Check if we can navigate (navigation state is ready)
      const navigationState = navigation.getState?.();
      if (navigationState && navigationState.stale) {
        throw new Error('Navigation state is stale - please try again');
      }

      // Small delay to show loading state and ensure UI responsiveness
      await new Promise(resolve => setTimeout(resolve, 150));

      // Enhanced navigation with additional error context
      logNavigation('Dashboard', 'Pairing', context, {
        navigationMethod: 'navigate',
        targetScreen: 'Pairing',
        connectionState: connectionState?.isConnected ? 'connected' : 'disconnected',
        deviceName: connectedDevice?.name || null,
        initializationStatus: initializationState?.status
      });

      navigation.navigate('Pairing');

      // Log successful navigation with timing
      const navigationTime = Date.now() - startTime;
      logUserInteraction('Navigation completed successfully', context, {
        duration: navigationTime,
        targetScreen: 'Pairing',
        success: true
      });

    } catch (error) {
      const navigationError = error instanceof Error ? error : new Error(String(error));
      const errorTime = Date.now() - startTime;

      // Enhanced error logging with more context
      logNavigationError(navigationError, context, {
        targetScreen: 'Pairing',
        connectionState: connectionState?.isConnected ? 'connected' : 'disconnected',
        deviceName: connectedDevice?.name || null,
        duration: errorTime,
        errorType: navigationError.name || 'UnknownError',
        navigationState: navigation?.getState?.() || 'unavailable',
        initializationStatus: initializationState?.status,
        timestamp: new Date().toISOString()
      });

      // Enhanced error handling with more specific retry logic
      handleNavigationError(navigationError, {
        context: 'tela de pareamento',
        allowRetry: true,
        onRetry: () => {
          logUserInteraction('User requested navigation retry', context, {
            retryAttempt: true,
            originalError: navigationError.message,
            retryDelay: 500
          });
          // Slightly longer delay for retry to ensure state is clean
          setTimeout(() => handleConnectOBD(), 500);
        },
        fallback: () => {
          logUserInteraction('User chose fallback option', context, {
            fallbackAction: 'manual_refresh',
            originalError: navigationError.message
          });
          // Could implement a fallback like refreshing the screen or showing alternative options
        }
      });
    } finally {
      setIsNavigating(false);
      const totalTime = Date.now() - startTime;
      logUserInteraction('Navigation state cleared', context, {
        previousState: 'navigating',
        newState: 'idle',
        totalDuration: totalTime
      });
    }
  }, 300);

  // Get connection status info
  const getConnectionStatus = () => {
    // Check initialization status first
    if (!isInitialized || initializationState?.status === 'NOT_STARTED') {
      return {
        text: 'Bluetooth não inicializado',
        color: '#FF5722',
        icon: 'bluetooth-disabled'
      };
    }

    if (initializationState?.status === 'IN_PROGRESS' || isInitializing) {
      return {
        text: 'Inicializando Bluetooth...',
        color: '#FF9800',
        icon: 'bluetooth-searching'
      };
    }

    if (initializationState?.status === 'COMPLETED_ERROR') {
      return {
        text: 'Erro na inicialização do Bluetooth',
        color: '#F44336',
        icon: 'bluetooth-disabled'
      };
    }

    if (connectionState?.isConnecting) {
      return {
        text: 'Conectando...',
        color: '#FF9800',
        icon: 'bluetooth-searching'
      };
    } else if (connectionState?.isConnected && connectedDevice) {
      return {
        text: `Conectado: ${connectedDevice.name || 'Dispositivo OBD-II'}`,
        color: '#4CAF50',
        icon: 'bluetooth-connected'
      };
    } else {
      return {
        text: 'Dispositivo OBD-II não conectado',
        color: '#666',
        icon: 'bluetooth-disabled'
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Bem-vindo de volta!</Text>
      </View>

      {/* Bluetooth Initialization Error */}
      {initializationState?.error && (
        <BluetoothInitializationError
          error={initializationState.error}
          onRetry={handleRetryInitialization}
          onDismiss={clearInitializationError}
          showTechnicalDetails={true}
        />
      )}

      {/* Connection Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name={connectionStatus.icon} size={24} color={connectionStatus.color} />
          <Text style={styles.cardTitle}>Status da Conexão</Text>
        </View>
        <Text style={[styles.statusText, { color: connectionStatus.color }]}>
          {connectionStatus.text}
        </Text>

        {/* Initialization Progress */}
        {(initializationState?.status === 'IN_PROGRESS' || isInitializing) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${initializationState?.progress || 0}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Inicializando... {initializationState?.progress || 0}%
            </Text>
          </View>
        )}

        {/* Initialization Error Actions */}
        {initializationState?.status === 'COMPLETED_ERROR' && !initializationState?.error && (
          <TouchableOpacity
            style={[styles.errorButton, isInitializing && styles.disabledButton]}
            onPress={handleRetryInitialization}
            disabled={isInitializing}
            testID="retry-initialization-button"
            accessibilityRole="button"
            accessibilityLabel={isInitializing ? 'Inicializando...' : 'Tentar Novamente'}
          >
            <View style={styles.buttonContent}>
              {isInitializing && (
                <ActivityIndicator size="small" color="#fff" style={styles.buttonLoader} />
              )}
              <Text style={styles.errorButtonText}>
                {isInitializing ? 'Inicializando...' : 'Tentar Novamente'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Connection Actions */}
        {isInitialized && initializationState?.status === 'COMPLETED_SUCCESS' && !connectionState?.isConnected && (
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (connectionState.isConnecting || isNavigating) && styles.disabledButton
            ]}
            onPress={handleConnectOBD}
            disabled={connectionState?.isConnecting || isNavigating}
            activeOpacity={connectionState?.isConnecting || isNavigating ? 1 : 0.7}
            testID="connect-device-button"
            accessibilityRole="button"
            accessibilityLabel={connectionState?.isConnecting
              ? 'Conectando...'
              : isNavigating
                ? 'Abrindo...'
                : 'Conectar Dispositivo'}
          >
            <View style={styles.buttonContent}>
              {(connectionState?.isConnecting || isNavigating) && (
                <ActivityIndicator size="small" color="#333" style={styles.buttonLoader} />
              )}
              <Text style={[
                styles.secondaryButtonText,
                (connectionState?.isConnecting || isNavigating) && styles.disabledButtonText
              ]}>
                {connectionState?.isConnecting
                  ? 'Conectando...'
                  : isNavigating
                    ? 'Abrindo...'
                    : 'Conectar Dispositivo'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {connectionState?.isConnected && (
          <TouchableOpacity
            style={[styles.successButton, isNavigating && styles.disabledButton]}
            onPress={handleConnectOBD}
            disabled={isNavigating}
            activeOpacity={isNavigating ? 1 : 0.7}
          >
            <View style={styles.buttonContent}>
              {isNavigating && (
                <ActivityIndicator size="small" color="#2E7D32" style={styles.buttonLoader} />
              )}
              <Text style={[
                styles.successButtonText,
                isNavigating && styles.disabledSuccessButtonText
              ]}>
                {isNavigating ? 'Abrindo...' : 'Gerenciar Conexão'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Current Trip */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="directions-car" size={24} color="#666" />
          <Text style={styles.cardTitle}>Viagem Atual</Text>
        </View>
        <Text style={styles.statusText}>Nenhuma viagem ativa</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartTrip}>
          <Text style={styles.primaryButtonText}>Iniciar Viagem</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estatísticas Rápidas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Consumo Médio</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Viagens</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Economia</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Distância</Text>
          </View>
        </View>
      </View>

      {/* Recent Tips */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="lightbulb-outline" size={24} color="#666" />
          <Text style={styles.cardTitle}>Dicas Recentes</Text>
        </View>
        <Text style={styles.emptyText}>
          Conecte seu dispositivo OBD-II e faça algumas viagens para receber dicas personalizadas
        </Text>
      </View>

      {/* Debug Component - Remove in production */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>🔧 Debug - Teste de Botões</Text>

        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            console.log('DEBUG: Simple button pressed!');
            Alert.alert('Debug', 'Botão simples funcionou!');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.debugButtonText}>Teste Botão Simples</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            console.log('DEBUG: Navigation test button pressed!');
            try {
              navigation.navigate('Pairing');
              Alert.alert('Debug', 'Navegação iniciada!');
            } catch (error) {
              console.error('DEBUG Navigation error:', error);
              Alert.alert('Erro', `Navegação falhou: ${error}`);
            }
          }}
        >
          <Text style={styles.debugButtonText}>Teste Navegação</Text>
        </TouchableOpacity>
      </View>

      <BLETestComponent />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  successButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#999',
  },
  disabledSuccessButtonText: {
    color: '#81C784',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  debugContainer: {
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 15,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});