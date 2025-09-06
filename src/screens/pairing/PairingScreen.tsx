import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  useBLEStore, 
  useBLEInitializationState
} from '../../stores/ble';
import { BLEDevice } from '../../types/ble';
import { PermissionsManager } from '../../utils/permissions';
import ELM327HelpModal from '../../components/common/ELM327HelpModal';
import { BluetoothInitializationError } from '../../components/common/BluetoothInitializationError';

export default function PairingScreen(): React.JSX.Element {
  const {
    connectionState,
    initialize,
    retryInitialization,
    scanForDevices,
    connectToDevice,
    clearError,
    clearInitializationError,
    isInitialized
  } = useBLEStore();

  const initializationState = useBLEInitializationState();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    // Guard against calling initialize when already initialized or in progress
    if (!isInitialized && initializationState?.status !== 'IN_PROGRESS') {
      initializeBLE();
    }
  }, [isInitialized, initializationState?.status]);

  useEffect(() => {
    // Clear selection when scanning starts
    if (connectionState?.isScanning) {
      setSelectedDevice(null);
    }
  }, [connectionState?.isScanning]);

  const initializeBLE = async () => {
    if (isInitialized || initializationState?.status === 'IN_PROGRESS') {
      return;
    }

    try {
      setIsInitializing(true);
      await initialize();
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      Alert.alert(
        'Erro de Inicialização',
        'Falha ao inicializar Bluetooth. Verifique se o Bluetooth está habilitado.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRetryInitialization = async () => {
    try {
      setIsInitializing(true);
      clearInitializationError();
      const result = await retryInitialization();
      
      if (result.success) {
        Alert.alert(
          'Inicialização Bem-sucedida',
          'Bluetooth inicializado com sucesso! Agora você pode buscar dispositivos.',
          [
            { text: 'OK' },
            { text: 'Buscar Dispositivos', onPress: handleStartScan }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to retry initialization:', error);
      Alert.alert(
        'Erro na Inicialização',
        'Não foi possível inicializar o Bluetooth. Verifique se o Bluetooth está habilitado e as permissões foram concedidas.',
        [
          { text: 'OK' },
          { text: 'Tentar Novamente', onPress: () => setTimeout(handleRetryInitialization, 1000) }
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStartScan = async () => {
    // Check initialization status first
    if (!isInitialized || initializationState?.status !== 'COMPLETED_SUCCESS') {
      Alert.alert(
        'Bluetooth Não Inicializado',
        'O sistema Bluetooth precisa ser inicializado antes de buscar dispositivos.',
        [
          { text: 'Cancelar' },
          { 
            text: 'Inicializar', 
            onPress: async () => {
              await handleRetryInitialization();
              // After successful initialization, automatically start scanning
              if (isInitialized && initializationState?.status === 'COMPLETED_SUCCESS') {
                setTimeout(handleStartScan, 500);
              }
            }
          }
        ]
      );
      return;
    }

    try {
      // Clear any previous errors
      clearError();

      // Check and request permissions first
      const permissionResult = await PermissionsManager.checkBLEPermissions();
      if (!permissionResult.granted) {
        const shouldShow = await PermissionsManager.showPermissionRationale();
        if (shouldShow) {
          const requestResult = await PermissionsManager.requestBLEPermissions();
          if (!requestResult.granted) {
            if (requestResult.shouldShowRationale === false) {
              // Permissions permanently denied
              PermissionsManager.showSettingsDialog();
            }
            return;
          }
        } else {
          return;
        }
      }

      await scanForDevices(10000); // 10 second scan
      
      // Show success message if devices found
      if (connectionState.availableDevices.length > 0) {
        const elm327Count = connectionState.availableDevices.filter(isELM327Device).length;
        if (elm327Count > 0) {
          Alert.alert(
            'Dispositivos Encontrados',
            `Encontrados ${elm327Count} dispositivo(s) ELM327. Selecione um para conectar.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Scan failed:', error);
      Alert.alert(
        'Erro no Scan',
        'Falha ao buscar dispositivos. Verifique se o Bluetooth está ligado e tente novamente.',
        [
          { text: 'OK' },
          { text: 'Tentar Novamente', onPress: () => setTimeout(handleStartScan, 1000) }
        ]
      );
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleConnect = async () => {
    if (!selectedDevice) return;

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

    try {
      setIsTestingConnection(true);
      clearError();

      // Connect to the device
      await connectToDevice(selectedDevice);

      // Test basic communication
      await testBasicCommunication();

      Alert.alert(
        'Conexão Bem-sucedida',
        'Dispositivo conectado com sucesso! Comunicação OBD-II testada.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Navigate to dashboard or next screen
              // This would be handled by navigation in a real app
              console.log('Navigate to dashboard');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert(
        'Falha na Conexão',
        `Não foi possível conectar ao dispositivo: ${error}`,
        [
          { text: 'Tentar Novamente', onPress: () => handleConnect() },
          { text: 'Cancelar' }
        ]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testBasicCommunication = async (): Promise<void> => {
    if (!useBLEStore.getState().bleManager) {
      throw new Error('BLE Manager not available');
    }

    try {
      // Import OBD service dynamically to avoid circular dependencies
      const { OBDService } = await import('../../services/obd/OBDService');
      const obdService = new OBDService(useBLEStore.getState().bleManager!);

      // Test basic OBD-II communication
      await obdService.initialize();

      // Validate that we can communicate with the vehicle
      const isValid = await obdService.validateConnection();
      if (!isValid) {
        throw new Error('Não foi possível estabelecer comunicação OBD-II com o veículo');
      }

      // Try to get some basic vehicle info
      try {
        await obdService.getVehicleInfo();
      } catch (error) {
        console.warn('Could not get vehicle info, but basic communication works:', error);
      }

    } catch (error) {
      throw new Error(`Teste de comunicação falhou: ${error}`);
    }
  };

  const getSignalStrengthColor = (rssi: number): string => {
    if (rssi > -50) return '#4CAF50'; // Excellent
    if (rssi > -70) return '#FF9800'; // Good
    return '#F44336'; // Poor
  };

  const getSignalStrengthText = (rssi: number): string => {
    if (rssi > -50) return 'Excelente';
    if (rssi > -70) return 'Bom';
    return 'Fraco';
  };

  const isELM327Device = (device: BLEDevice): boolean => {
    const name = (device.name || device.localName || '').toLowerCase();
    return /elm327|obd|obdii|obd-ii|v\d+\.\d+/.test(name);
  };

  const renderDevice = ({ item }: { item: BLEDevice }) => {
    const isELM = isELM327Device(item);
    const signalColor = getSignalStrengthColor(item.rssi);
    const signalText = getSignalStrengthText(item.rssi);

    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          selectedDevice === item.id && styles.selectedDevice,
          isELM && styles.elm327Device
        ]}
        onPress={() => handleDeviceSelect(item.id)}
        disabled={connectionState.isConnecting}
      >
        <View style={styles.deviceInfo}>
          <View style={styles.deviceIcon}>
            <Icon
              name={isELM ? "directions-car" : "bluetooth"}
              size={24}
              color={isELM ? "#2E7D32" : "#666"}
            />
            {isELM && (
              <View style={styles.elm327Badge}>
                <Text style={styles.elm327BadgeText}>ELM327</Text>
              </View>
            )}
          </View>
          <View style={styles.deviceDetails}>
            <Text style={styles.deviceName}>
              {item.name || item.localName || 'Dispositivo Desconhecido'}
            </Text>
            <View style={styles.deviceMeta}>
              <Text style={[styles.deviceRssi, { color: signalColor }]}>
                Sinal: {signalText} ({item.rssi} dBm)
              </Text>
              {!item.isConnectable && (
                <Text style={styles.notConnectable}>Não conectável</Text>
              )}
            </View>
          </View>
        </View>
        {selectedDevice === item.id && (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  const renderError = () => {
    if (!connectionState.lastError) return null;

    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={24} color="#F44336" />
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Erro</Text>
          <Text style={styles.errorMessage}>{connectionState.lastError.message}</Text>
        </View>
        <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
          <Icon name="close" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    // Show initialization status
    if (!isInitialized || initializationState?.status === 'IN_PROGRESS' || isInitializing) {
      return (
        <View style={styles.initializingState}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.initializingText}>Inicializando Bluetooth...</Text>
          <Text style={styles.initializingSubtext}>
            Verificando permissões e configurando sistema
          </Text>
          {(initializationState?.progress || 0) > 0 && (
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
                {initializationState?.progress || 0}%
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (initializationState?.status === 'COMPLETED_ERROR') {
      return (
        <View style={styles.errorState}>
          <Icon name="error" size={64} color="#F44336" />
          <Text style={styles.errorText}>
            Falha na Inicialização do Bluetooth
          </Text>
          <Text style={styles.errorSubtext}>
            O sistema Bluetooth precisa ser inicializado para buscar dispositivos
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, isInitializing && styles.disabledButton]}
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
              <Text style={styles.retryButtonText}>
                {isInitializing ? 'Inicializando...' : 'Tentar Novamente'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    if (connectionState.isScanning) {
      return (
        <View style={styles.scanningState}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.scanningText}>Procurando dispositivos...</Text>
          <Text style={styles.scanningSubtext}>
            Certifique-se de que o ELM327 está conectado ao veículo
          </Text>
        </View>
      );
    }

    if (connectionState.availableDevices.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="bluetooth-searching" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Nenhum dispositivo encontrado
          </Text>
          <Text style={styles.emptySubtext}>
            Toque em "Buscar Dispositivos" para começar
          </Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowHelpModal(true)}
          >
            <Text style={styles.helpButtonText}>Como parear ELM327?</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Filter and sort devices - ELM327 devices first
    const sortedDevices = [...connectionState.availableDevices].sort((a, b) => {
      const aIsELM = isELM327Device(a);
      const bIsELM = isELM327Device(b);

      if (aIsELM && !bIsELM) return -1;
      if (!aIsELM && bIsELM) return 1;

      // Sort by signal strength
      return b.rssi - a.rssi;
    });

    return (
      <FlatList
        data={sortedDevices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        style={styles.deviceList}
        refreshControl={
          <RefreshControl
            refreshing={connectionState.isScanning}
            onRefresh={handleStartScan}
            colors={['#2E7D32']}
          />
        }
        ListHeaderComponent={() => (
          <Text style={styles.deviceListHeader}>
            {sortedDevices.filter(isELM327Device).length > 0
              ? 'Dispositivos ELM327 encontrados:'
              : 'Dispositivos Bluetooth encontrados:'}
          </Text>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conectar Dispositivo OBD-II</Text>
        <Text style={styles.subtitle}>
          Certifique-se de que seu dispositivo ELM327 está conectado ao veículo e o Bluetooth está ativado
        </Text>
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

      {renderError()}

      <View style={styles.content}>
        {renderContent()}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.secondaryButton,
            (!isInitialized || initializationState?.status !== 'COMPLETED_SUCCESS') && styles.disabledButton
          ]}
          onPress={handleStartScan}
          disabled={
            connectionState.isScanning || 
            connectionState.isConnecting || 
            !isInitialized || 
            initializationState?.status !== 'COMPLETED_SUCCESS'
          }
          testID="scan-devices-button"
          accessibilityRole="button"
          accessibilityLabel={connectionState.availableDevices.length > 0 ? 'Buscar Novamente' : 'Buscar Dispositivos'}
        >
          {connectionState.isScanning ? (
            <ActivityIndicator size="small" color="#333" />
          ) : (
            <Text style={[
              styles.secondaryButtonText,
              (!isInitialized || initializationState?.status !== 'COMPLETED_SUCCESS') && styles.disabledButtonText
            ]}>
              {connectionState.availableDevices.length > 0 ? 'Buscar Novamente' : 'Buscar Dispositivos'}
            </Text>
          )}
        </TouchableOpacity>

        {selectedDevice && isInitialized && initializationState?.status === 'COMPLETED_SUCCESS' && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              (connectionState.isConnecting || isTestingConnection) && styles.disabledButton
            ]}
            onPress={handleConnect}
            disabled={connectionState.isConnecting || isTestingConnection}
          >
            {connectionState.isConnecting || isTestingConnection ? (
              <View style={styles.connectingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.primaryButtonText}>
                  {connectionState.isConnecting ? 'Conectando...' : 'Testando...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Conectar</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ELM327HelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
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
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorContent: {
    flex: 1,
    marginLeft: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#D32F2F',
  },
  errorDismiss: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  helpButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  helpButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
  scanningState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanningText: {
    fontSize: 18,
    color: '#2E7D32',
    marginTop: 16,
    textAlign: 'center',
  },
  scanningSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  deviceList: {
    flex: 1,
  },
  deviceListHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
  elm327Device: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    position: 'relative',
  },
  elm327Badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  elm327BadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  deviceRssi: {
    fontSize: 14,
    fontWeight: '500',
  },
  notConnectable: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
    fontStyle: 'italic',
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
  disabledButton: {
    opacity: 0.6,
  },
  connectingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  initializingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  initializingText: {
    fontSize: 18,
    color: '#2E7D32',
    marginTop: 16,
    textAlign: 'center',
  },
  initializingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
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
  disabledButtonText: {
    color: '#999',
  },
});