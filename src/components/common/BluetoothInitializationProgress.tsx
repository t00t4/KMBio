import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { BluetoothInitializationStatus } from '../../types/ble';

interface BluetoothInitializationProgressProps {
  status: BluetoothInitializationStatus;
  message?: string;
  progress?: number; // 0-1 for progress bar
  showProgressBar?: boolean;
}

export const BluetoothInitializationProgress: React.FC<BluetoothInitializationProgressProps> = ({
  status,
  message,
  progress = 0,
  showProgressBar = false,
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showProgressBar && progress >= 0 && progress <= 1) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgressBar, progressAnim]);

  const getStatusMessage = (): string => {
    if (message) return message;
    
    switch (status) {
      case 'NOT_STARTED':
        return 'Preparando inicialização do Bluetooth...';
      case 'IN_PROGRESS':
        return 'Inicializando Bluetooth...';
      case 'RETRYING':
        return 'Tentando novamente...';
      case 'COMPLETED_SUCCESS':
        return 'Bluetooth inicializado com sucesso!';
      case 'COMPLETED_ERROR':
        return 'Falha na inicialização do Bluetooth';
      default:
        return 'Verificando Bluetooth...';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'COMPLETED_SUCCESS':
        return '#4ECDC4'; // Teal for success
      case 'COMPLETED_ERROR':
        return '#FF6B6B'; // Red for error
      case 'RETRYING':
        return '#FFE66D'; // Yellow for retry
      default:
        return '#2E7D32'; // Green for in progress
    }
  };

  const shouldShowSpinner = (): boolean => {
    return status === 'IN_PROGRESS' || status === 'RETRYING' || status === 'NOT_STARTED';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {shouldShowSpinner() && (
          <ActivityIndicator 
            size="large" 
            color={getStatusColor()} 
            style={styles.spinner}
            testID="activity-indicator"
          />
        )}
        
        <Text style={[styles.message, { color: getStatusColor() }]}>
          {getStatusMessage()}
        </Text>

        {showProgressBar && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: getStatusColor(),
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});