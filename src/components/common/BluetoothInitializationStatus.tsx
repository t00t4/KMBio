import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  BluetoothInitializationResult,
  BluetoothInitializationStatus as IBluetoothInitializationStatus,
} from '../../types/ble';
import { BluetoothInitializationProgress } from './BluetoothInitializationProgress';
import { BluetoothInitializationError } from './BluetoothInitializationError';

interface BluetoothInitializationStatusProps {
  status: IBluetoothInitializationStatus;
  result?: BluetoothInitializationResult | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  compact?: boolean;
}

export const BluetoothInitializationStatus: React.FC<BluetoothInitializationStatusProps> = ({
  status,
  result,
  onRetry,
  onDismiss,
  showTechnicalDetails = false,
  compact = false,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress based on status
    switch (status) {
      case 'NOT_STARTED':
        setProgress(0);
        break;
      case 'IN_PROGRESS':
        // Animate progress from 0 to 0.8 over time
        const interval = setInterval(() => {
          setProgress(prev => Math.min(prev + 0.1, 0.8));
        }, 200);
        return () => clearInterval(interval);
      case 'RETRYING':
        setProgress(0.3);
        break;
      case 'COMPLETED_SUCCESS':
        setProgress(1);
        break;
      case 'COMPLETED_ERROR':
        setProgress(0);
        break;
    }
  }, [status]);

  const openBluetoothSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else {
        // iOS doesn't allow direct Bluetooth settings access
        await Linking.openURL('App-Prefs:Bluetooth');
      }
    } catch (error) {
      console.warn('Could not open Bluetooth settings:', error);
      // Fallback to general settings
      await Linking.openSettings();
    }
  };

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.warn('Could not open app settings:', error);
    }
  };

  // Show error state
  if (status === 'COMPLETED_ERROR' && result?.error) {
    return (
      <BluetoothInitializationError
        error={result.error}
        onRetry={onRetry}
        onOpenSettings={
          result.error.code === 'BLUETOOTH_DISABLED' 
            ? openBluetoothSettings 
            : openAppSettings
        }
        onDismiss={onDismiss}
        showTechnicalDetails={showTechnicalDetails}
      />
    );
  }

  // Show success state (compact version)
  if (status === 'COMPLETED_SUCCESS' && compact) {
    return (
      <View style={styles.compactSuccess}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.compactSuccessText}>Bluetooth Pronto</Text>
      </View>
    );
  }

  // Show success state with capabilities
  if (status === 'COMPLETED_SUCCESS' && result) {
    return (
      <View style={styles.successContainer}>
        <BluetoothInitializationProgress
          status={status}
          progress={progress}
          showProgressBar={false}
        />
        
        <View style={styles.capabilitiesContainer}>
          <Text style={styles.capabilitiesTitle}>Status do Sistema:</Text>
          
          <View style={styles.capabilityItem}>
            <Text style={styles.capabilityIcon}>
              {result.capabilities.bleSupported ? '✅' : '❌'}
            </Text>
            <Text style={styles.capabilityText}>
              Bluetooth Low Energy {result.capabilities.bleSupported ? 'Suportado' : 'Não Suportado'}
            </Text>
          </View>
          
          <View style={styles.capabilityItem}>
            <Text style={styles.capabilityIcon}>
              {result.capabilities.permissionsGranted ? '✅' : '❌'}
            </Text>
            <Text style={styles.capabilityText}>
              Permissões {result.capabilities.permissionsGranted ? 'Concedidas' : 'Negadas'}
            </Text>
          </View>
          
          <View style={styles.capabilityItem}>
            <Text style={styles.capabilityIcon}>
              {result.capabilities.bluetoothEnabled ? '✅' : '❌'}
            </Text>
            <Text style={styles.capabilityText}>
              Bluetooth {result.capabilities.bluetoothEnabled ? 'Ligado' : 'Desligado'}
            </Text>
          </View>
          
          <View style={styles.capabilityItem}>
            <Text style={styles.capabilityIcon}>
              {result.capabilities.canConnect ? '✅' : '❌'}
            </Text>
            <Text style={styles.capabilityText}>
              {result.capabilities.canConnect ? 'Pronto para Conectar' : 'Não Pode Conectar'}
            </Text>
          </View>
        </View>

        {result.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Recomendações:</Text>
            {result.recommendations.map((recommendation, index) => (
              <Text key={index} style={styles.recommendationText}>
                • {recommendation}
              </Text>
            ))}
          </View>
        )}

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>OK</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show loading/progress state
  return (
    <BluetoothInitializationProgress
      status={status}
      progress={progress}
      showProgressBar={status === 'IN_PROGRESS' || status === 'RETRYING'}
    />
  );
};

const styles = StyleSheet.create({
  compactSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  successIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  compactSuccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
  },
  successContainer: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  capabilitiesContainer: {
    marginTop: 16,
  },
  capabilitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  capabilityIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  capabilityText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  recommendationsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E8',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  dismissButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  dismissButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});