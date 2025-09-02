import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import {
  BluetoothPermissionHandler as IBluetoothPermissionHandler,
  PermissionStatus,
  PermissionRequestResult,
  BluetoothPermission,
  PermissionError,
  PermissionRecoveryAction,
  PermissionRationaleConfig,
  PermissionFlowConfig,
  BLUETOOTH_PERMISSIONS
} from '../../types/ble/bluetooth-permission-handler';

export class BluetoothPermissionHandler implements IBluetoothPermissionHandler {
  private config: PermissionFlowConfig;
  private retryCount: number = 0;

  constructor(config?: Partial<PermissionFlowConfig>) {
    this.config = {
      showRationaleBeforeRequest: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      autoOpenSettings: false,
      enableDetailedLogging: true,
      ...config
    };
  }

  /**
   * Check current status of all required Bluetooth permissions
   */
  async checkPermissions(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        // iOS handles Bluetooth permissions automatically
        return {
          granted: true,
          denied: false,
          neverAskAgain: false,
          missingPermissions: [],
          grantedPermissions: this.getRequiredPermissions(),
          partiallyGranted: false
        };
      }

      const requiredPermissions = this.getRequiredPermissions();
      const grantedPermissions: BluetoothPermission[] = [];
      const missingPermissions: BluetoothPermission[] = [];

      for (const permission of requiredPermissions) {
        if (permission.androidPermission) {
          const isGranted = await PermissionsAndroid.check(
            permission.androidPermission as any
          );

          if (isGranted) {
            grantedPermissions.push(permission);
          } else {
            missingPermissions.push(permission);
          }
        }
      }

      const allGranted = missingPermissions.length === 0;
      const partiallyGranted = grantedPermissions.length > 0 && missingPermissions.length > 0;

      this.log('Permission check completed', {
        granted: grantedPermissions.length,
        missing: missingPermissions.length,
        total: requiredPermissions.length
      });

      return {
        granted: allGranted,
        denied: !allGranted,
        neverAskAgain: false, // Will be determined during request
        missingPermissions,
        grantedPermissions,
        partiallyGranted
      };
    } catch (error) {
      this.log('Permission check failed', error);

      return {
        granted: false,
        denied: true,
        neverAskAgain: false,
        missingPermissions: this.getRequiredPermissions(),
        grantedPermissions: [],
        partiallyGranted: false
      };
    }
  }

  /**
   * Request all required Bluetooth permissions
   */
  async requestPermissions(): Promise<PermissionRequestResult> {
    try {
      if (Platform.OS === 'ios') {
        return {
          success: true,
          granted: true,
          deniedPermissions: [],
          grantedPermissions: this.getRequiredPermissions(),
          neverAskAgainPermissions: [],
          shouldShowRationale: false
        };
      }

      // Check current status first
      const currentStatus = await this.checkPermissions();

      if (currentStatus.granted) {
        return {
          success: true,
          granted: true,
          deniedPermissions: [],
          grantedPermissions: currentStatus.grantedPermissions,
          neverAskAgainPermissions: [],
          shouldShowRationale: false
        };
      }

      // Show rationale if configured and needed
      if (this.config.showRationaleBeforeRequest && await this.shouldShowRationale()) {
        const rationaleAccepted = await this.showPermissionRationale();
        if (!rationaleAccepted) {
          return {
            success: false,
            granted: false,
            deniedPermissions: currentStatus.missingPermissions,
            grantedPermissions: currentStatus.grantedPermissions,
            neverAskAgainPermissions: [],
            shouldShowRationale: true
          };
        }
      }

      // Request missing permissions
      const permissionsToRequest = currentStatus.missingPermissions
        .map(p => p.androidPermission)
        .filter(Boolean) as string[];

      if (permissionsToRequest.length === 0) {
        return {
          success: true,
          granted: true,
          deniedPermissions: [],
          grantedPermissions: this.getRequiredPermissions(),
          neverAskAgainPermissions: [],
          shouldShowRationale: false
        };
      }

      this.log('Requesting permissions', permissionsToRequest);

      const results = await PermissionsAndroid.requestMultiple(
        permissionsToRequest as any
      );

      // Analyze results
      const grantedPermissions: BluetoothPermission[] = [...currentStatus.grantedPermissions];
      const deniedPermissions: BluetoothPermission[] = [];
      const neverAskAgainPermissions: BluetoothPermission[] = [];

      for (const permission of currentStatus.missingPermissions) {
        if (permission.androidPermission) {
          const result = (results as any)[permission.androidPermission];

          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            grantedPermissions.push(permission);
          } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            neverAskAgainPermissions.push(permission);
          } else {
            deniedPermissions.push(permission);
          }
        }
      }

      const allGranted = deniedPermissions.length === 0 && neverAskAgainPermissions.length === 0;

      this.log('Permission request completed', {
        granted: grantedPermissions.length,
        denied: deniedPermissions.length,
        neverAskAgain: neverAskAgainPermissions.length,
        success: allGranted
      });

      return {
        success: allGranted,
        granted: allGranted,
        deniedPermissions,
        grantedPermissions,
        neverAskAgainPermissions,
        shouldShowRationale: deniedPermissions.length > 0
      };
    } catch (error) {
      this.log('Permission request failed', error);
      const permissionError = this.createPermissionError('PERMISSION_REQUEST_FAILED', error);
      throw new Error(permissionError.message);
    }
  }

  /**
   * Open device settings for manual permission configuration
   */
  openPermissionSettings(): void {
    try {
      Linking.openSettings();
      this.log('Opened device settings');
    } catch (error) {
      this.log('Failed to open settings', error);
    }
  }

  /**
   * Get list of required Bluetooth permissions for current platform
   */
  getRequiredPermissions(): BluetoothPermission[] {
    if (Platform.OS === 'ios') {
      // iOS handles Bluetooth permissions automatically
      return [];
    }

    const androidVersion = Platform.Version as number;
    const permissions: BluetoothPermission[] = [];

    // Android 12+ (API 31+) uses new Bluetooth permissions
    if (androidVersion >= 31) {
      permissions.push(
        BLUETOOTH_PERMISSIONS.BLUETOOTH_SCAN,
        BLUETOOTH_PERMISSIONS.BLUETOOTH_CONNECT,
        BLUETOOTH_PERMISSIONS.ACCESS_FINE_LOCATION
      );
    } else {
      // Older Android versions use legacy permissions
      permissions.push(
        BLUETOOTH_PERMISSIONS.BLUETOOTH_LEGACY,
        BLUETOOTH_PERMISSIONS.BLUETOOTH_ADMIN_LEGACY,
        BLUETOOTH_PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }

    return permissions.filter(p => p.required);
  }

  /**
   * Check if we should show permission rationale
   */
  async shouldShowRationale(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return false;
    }

    try {
      const permissions = this.getRequiredPermissions();

      for (const permission of permissions) {
        if (permission.androidPermission) {
          // Note: shouldShowRequestPermissionRationale is not available in current RN types
          // This is a simplified implementation that always returns true for denied permissions
          const isGranted = await PermissionsAndroid.check(
            permission.androidPermission as any
          );

          if (!isGranted) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      this.log('Failed to check rationale status', error);
      return false;
    }
  }

  /**
   * Handle permission denied scenario with recovery options
   */
  async handlePermissionDenied(permission: BluetoothPermission): Promise<PermissionRecoveryAction> {
    const actions: PermissionRecoveryAction[] = [
      {
        type: 'RETRY_REQUEST',
        title: 'Tentar Novamente',
        description: 'Solicitar a permissão novamente',
        action: async () => { await this.requestPermissions(); },
        priority: 'HIGH'
      },
      {
        type: 'OPEN_SETTINGS',
        title: 'Abrir Configurações',
        description: 'Abrir configurações do dispositivo para habilitar manualmente',
        action: () => this.openPermissionSettings(),
        priority: 'MEDIUM'
      },
      {
        type: 'SHOW_RATIONALE',
        title: 'Mais Informações',
        description: 'Entender por que esta permissão é necessária',
        action: async () => { await this.showPermissionRationale(); },
        priority: 'LOW'
      }
    ];

    // Return the highest priority action
    return actions[0];
  }

  /**
   * Show permission rationale dialog
   */
  private showPermissionRationale(config?: PermissionRationaleConfig): Promise<boolean> {
    const defaultConfig: PermissionRationaleConfig = {
      title: 'Permissões Bluetooth Necessárias',
      message: 'O KMBio precisa de acesso ao Bluetooth e localização para conectar ao seu dispositivo OBD-II e coletar dados do veículo.\n\n' +
        'Essas permissões são essenciais para o funcionamento do aplicativo.',
      positiveButton: 'Permitir',
      negativeButton: 'Cancelar'
    };

    const finalConfig = { ...defaultConfig, ...config };

    return new Promise((resolve) => {
      Alert.alert(
        finalConfig.title,
        finalConfig.message,
        [
          {
            text: finalConfig.negativeButton,
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: finalConfig.positiveButton,
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  /**
   * Show settings dialog for permanently denied permissions
   */
  private showSettingsDialog(): Promise<boolean> {
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
              this.openPermissionSettings();
              resolve(true);
            }
          }
        ]
      );
    });
  }

  /**
   * Create a standardized permission error
   */
  private createPermissionError(code: string, originalError: any): PermissionError {
    return {
      code: code as any,
      message: `Permission operation failed: ${code}`,
      technicalDetails: originalError?.message || String(originalError),
      recoverable: true,
      recoveryActions: [
        {
          type: 'RETRY_REQUEST',
          title: 'Tentar Novamente',
          description: 'Tentar a operação novamente',
          action: async () => { await this.requestPermissions(); },
          priority: 'HIGH'
        }
      ]
    };
  }

  /**
   * Log messages if detailed logging is enabled
   */
  private log(message: string, data?: any): void {
    if (this.config.enableDetailedLogging) {
      console.log(`[BluetoothPermissionHandler] ${message}`, data || '');
    }
  }
}