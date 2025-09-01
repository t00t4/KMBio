import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export interface PermissionResult {
  granted: boolean;
  shouldShowRationale?: boolean;
  error?: string;
}

export class PermissionsManager {
  /**
   * Request all BLE-related permissions required for the app
   */
  static async requestBLEPermissions(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      const androidVersion = Platform.Version;
      const permissions: string[] = [];

      // For Android 12+ (API 31+), use new Bluetooth permissions
      if (androidVersion >= 31) {
        permissions.push(
          'android.permission.BLUETOOTH_SCAN',
          'android.permission.BLUETOOTH_CONNECT',
          'android.permission.ACCESS_FINE_LOCATION'
        );
      } else {
        // For older Android versions
        permissions.push(
          'android.permission.BLUETOOTH',
          'android.permission.BLUETOOTH_ADMIN',
          'android.permission.ACCESS_FINE_LOCATION'
        );
      }

      const results = await PermissionsAndroid.requestMultiple(permissions as any);
      
      // Check if all permissions were granted
      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        const shouldShowRationale = await this.shouldShowPermissionRationale(permissions);
        return {
          granted: false,
          shouldShowRationale,
          error: 'BLE permissions not granted'
        };
      }

      return { granted: true };
    } catch (error) {
      return {
        granted: false,
        error: `Permission request failed: ${error}`
      };
    }
  }

  /**
   * Check if BLE permissions are currently granted
   */
  static async checkBLEPermissions(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      const androidVersion = Platform.Version;
      const permissions: string[] = [];

      if (androidVersion >= 31) {
        permissions.push(
          'android.permission.BLUETOOTH_SCAN',
          'android.permission.BLUETOOTH_CONNECT',
          'android.permission.ACCESS_FINE_LOCATION'
        );
      } else {
        permissions.push(
          'android.permission.BLUETOOTH',
          'android.permission.BLUETOOTH_ADMIN',
          'android.permission.ACCESS_FINE_LOCATION'
        );
      }

      const results = await Promise.all(
        permissions.map(permission => PermissionsAndroid.check(permission as any))
      );

      const allGranted = results.every(result => result === true);

      return { granted: allGranted };
    } catch (error) {
      return {
        granted: false,
        error: `Permission check failed: ${error}`
      };
    }
  }

  /**
   * Show permission rationale dialog
   */
  static showPermissionRationale(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Permissões Bluetooth Necessárias',
        'O KMBio precisa de acesso ao Bluetooth e localização para conectar ao seu dongle OBD-II e coletar dados do veículo.\n\n' +
        'Essas permissões são essenciais para o funcionamento do aplicativo.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Permitir',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  /**
   * Show settings dialog when permissions are permanently denied
   */
  static showSettingsDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Permissões Necessárias',
        'Para usar o KMBio, você precisa habilitar as permissões de Bluetooth e Localização nas configurações do dispositivo.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Abrir Configurações',
            onPress: () => {
              Linking.openSettings();
              resolve(true);
            }
          }
        ]
      );
    });
  }

  /**
   * Request foreground service permission for background execution
   */
  static async requestForegroundServicePermission(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true };
    }

    try {
      const result = await PermissionsAndroid.request(
        'android.permission.FOREGROUND_SERVICE' as any,
        {
          title: 'Execução em Segundo Plano',
          message: 'O KMBio precisa executar em segundo plano para coletar dados durante a viagem.',
          buttonNeutral: 'Perguntar Depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );

      return {
        granted: result === PermissionsAndroid.RESULTS.GRANTED
      };
    } catch (error) {
      return {
        granted: false,
        error: `Foreground service permission failed: ${error}`
      };
    }
  }

  /**
   * Check if we should show permission rationale
   */
  private static async shouldShowPermissionRationale(_permissions: string[]): Promise<boolean> {
    // Note: shouldShowRequestPermissionRationale is not available in current RN types
    // This is a simplified implementation
    return false;
  }
}