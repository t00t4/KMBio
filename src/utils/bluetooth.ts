import { Platform, NativeModules, Alert, Linking } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';

export interface BluetoothState {
  isEnabled: boolean;
  isSupported: boolean;
  state: State;
}

export class BluetoothUtils {
  private static bleManager: BleManager | null = null;

  /**
   * Get the current Bluetooth state
   */
  static async getBluetoothState(): Promise<BluetoothState> {
    try {
      if (!this.bleManager) {
        this.bleManager = new BleManager();
      }

      const state = await this.bleManager.state();
      
      return {
        isEnabled: state === 'PoweredOn',
        isSupported: state !== 'Unsupported',
        state
      };
    } catch {
      return {
        isEnabled: false,
        isSupported: false,
        state: 'Unknown' as State
      };
    }
  }

  /**
   * Check if Bluetooth is enabled
   */
  static async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.getBluetoothState();
    return state.isEnabled;
  }

  /**
   * Request user to enable Bluetooth
   */
  static async requestEnableBluetooth(): Promise<boolean> {
    const state = await this.getBluetoothState();
    
    if (state.isEnabled) {
      return true;
    }

    if (!state.isSupported) {
      Alert.alert(
        'Bluetooth Não Suportado',
        'Este dispositivo não suporta Bluetooth.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Bluetooth Desabilitado',
        'O KMBio precisa que o Bluetooth esteja ligado para conectar ao dongle OBD-II.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Abrir Configurações',
            onPress: () => {
              this.openBluetoothSettings();
              resolve(false); // User needs to manually enable and return
            }
          }
        ]
      );
    });
  }

  /**
   * Open Bluetooth settings
   */
  static openBluetoothSettings(): void {
    if (Platform.OS === 'android') {
      try {
        // Try to open Bluetooth settings directly
        const { BluetoothSettings } = NativeModules;
        if (BluetoothSettings) {
          BluetoothSettings.open();
        } else {
          // Fallback to general settings
          Linking.openSettings();
        }
      } catch (error) {
        // Fallback to general settings
        console.warn('Failed to open Bluetooth settings:', error);
        Linking.openSettings();
      }
    } else {
      // iOS - open general settings
      Linking.openSettings();
    }
  }

  /**
   * Monitor Bluetooth state changes
   */
  static monitorBluetoothState(
    callback: (state: BluetoothState) => void
  ): () => void {
    if (!this.bleManager) {
      this.bleManager = new BleManager();
    }

    const subscription = this.bleManager.onStateChange(async (state) => {
      const bluetoothState: BluetoothState = {
        isEnabled: state === 'PoweredOn',
        isSupported: state !== 'Unsupported',
        state
      };
      callback(bluetoothState);
    }, true);

    // Return cleanup function
    return () => {
      subscription.remove();
    };
  }

  /**
   * Get user-friendly Bluetooth state message
   */
  static getBluetoothStateMessage(state: State): string {
    switch (state) {
      case 'PoweredOn':
        return 'Bluetooth está ligado e pronto';
      case 'PoweredOff':
        return 'Bluetooth está desligado';
      case 'Resetting':
        return 'Bluetooth está reiniciando';
      case 'Unauthorized':
        return 'Permissões Bluetooth não concedidas';
      case 'Unsupported':
        return 'Bluetooth não é suportado neste dispositivo';
      case 'Unknown':
      default:
        return 'Estado do Bluetooth desconhecido';
    }
  }

  /**
   * Check if device supports BLE
   */
  static async supportsBLE(): Promise<boolean> {
    try {
      const state = await this.getBluetoothState();
      return state.isSupported;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  static cleanup(): void {
    if (this.bleManager) {
      this.bleManager.destroy();
      this.bleManager = null;
    }
  }
}