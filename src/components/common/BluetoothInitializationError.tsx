import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { BluetoothInitializationError as IBluetoothInitializationError } from '../../types/ble';

interface BluetoothInitializationErrorProps {
  error: IBluetoothInitializationError;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
}

export const BluetoothInitializationError: React.FC<BluetoothInitializationErrorProps> = ({
  error,
  onRetry,
  onOpenSettings,
  onDismiss,
  showTechnicalDetails = false,
}) => {
  const getErrorIcon = (): string => {
    switch (error.code) {
      case 'BLUETOOTH_NOT_SUPPORTED':
        return '⚠️';
      case 'BLUETOOTH_DISABLED':
        return '📱';
      case 'PERMISSIONS_DENIED':
      case 'PERMISSIONS_NEVER_ASK_AGAIN':
        return '🔒';
      case 'TIMEOUT_ERROR':
        return '⏱️';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (): string => {
    switch (error.code) {
      case 'BLUETOOTH_NOT_SUPPORTED':
        return 'Bluetooth Não Suportado';
      case 'BLUETOOTH_DISABLED':
        return 'Bluetooth Desligado';
      case 'PERMISSIONS_DENIED':
        return 'Permissões Necessárias';
      case 'PERMISSIONS_NEVER_ASK_AGAIN':
        return 'Permissões Bloqueadas';
      case 'BLE_MANAGER_INIT_FAILED':
        return 'Falha na Inicialização';
      case 'TIMEOUT_ERROR':
        return 'Tempo Esgotado';
      default:
        return 'Erro do Bluetooth';
    }
  };

  const getPrimaryAction = (): { label: string; action: () => void } | null => {
    switch (error.code) {
      case 'BLUETOOTH_DISABLED':
        return {
          label: 'Abrir Configurações',
          action: onOpenSettings || (() => Alert.alert('Configurações', 'Abra as configurações do dispositivo e ligue o Bluetooth')),
        };
      case 'PERMISSIONS_DENIED':
        return error.recoverable && onRetry ? {
          label: 'Tentar Novamente',
          action: onRetry,
        } : null;
      case 'PERMISSIONS_NEVER_ASK_AGAIN':
        return {
          label: 'Abrir Configurações',
          action: onOpenSettings || (() => Alert.alert('Configurações', 'Abra as configurações do aplicativo e habilite as permissões de Bluetooth')),
        };
      case 'BLE_MANAGER_INIT_FAILED':
      case 'TIMEOUT_ERROR':
        return error.recoverable && onRetry ? {
          label: 'Tentar Novamente',
          action: onRetry,
        } : null;
      default:
        return error.recoverable && onRetry ? {
          label: 'Tentar Novamente',
          action: onRetry,
        } : null;
    }
  };

  const showTechnicalInfo = () => {
    Alert.alert(
      'Detalhes Técnicos',
      `Código: ${error.code}\n\nDetalhes: ${error.technicalDetails}\n\nTentativas: ${error.diagnosticInfo.initializationAttempts}\n\nDispositivo: ${error.diagnosticInfo.deviceModel}\n\nVersão OS: ${error.diagnosticInfo.osVersion}`,
      [{ text: 'OK' }]
    );
  };

  const primaryAction = getPrimaryAction();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon} testID="error-icon" accessibilityLabel="error-icon">{getErrorIcon()}</Text>
        <Text style={styles.title} testID="error-title" accessibilityLabel="error-title">{getErrorTitle()}</Text>
      </View>

      <Text style={styles.message} testID="error-message" accessibilityLabel="error-message">{error.message}</Text>

      {error.recoverySteps.length > 0 && (
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle} testID="steps-title">Para resolver:</Text>
          <ScrollView style={styles.stepsScroll} showsVerticalScrollIndicator={false}>
            {error.recoverySteps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <Text style={styles.stepNumber} testID={`step-number-${index + 1}`}>{index + 1}.</Text>
                <Text style={styles.stepText} testID={`step-text-${index + 1}`}>{step}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.actions}>
        {primaryAction && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={primaryAction.action}
            testID="primary-action-button"
            accessibilityRole="button"
            accessibilityLabel={primaryAction.label}
          >
            <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
          </TouchableOpacity>
        )}

        {showTechnicalDetails && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={showTechnicalInfo}
            testID="technical-details-button"
            accessibilityRole="button"
            accessibilityLabel="Detalhes Técnicos"
          >
            <Text style={styles.secondaryButtonText}>Detalhes Técnicos</Text>
          </TouchableOpacity>
        )}

        {onDismiss && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onDismiss}
            testID="dismiss-button"
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Text style={styles.secondaryButtonText}>Fechar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D32F2F',
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  stepsScroll: {
    maxHeight: 120,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#D32F2F',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
});