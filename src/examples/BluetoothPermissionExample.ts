/**
 * Example usage of BluetoothPermissionHandler
 * This demonstrates how to implement user-friendly permission request flows
 */

import { BluetoothPermissionHandler } from '../services/ble/BluetoothPermissionHandler';
import { Alert } from 'react-native';

export class BluetoothPermissionExample {
  private permissionHandler: BluetoothPermissionHandler;

  constructor() {
    // Initialize with user-friendly configuration
    this.permissionHandler = new BluetoothPermissionHandler({
      showRationaleBeforeRequest: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      autoOpenSettings: false,
      enableDetailedLogging: true
    });
  }

  /**
   * Example: Complete permission flow with user guidance
   */
  async requestBluetoothPermissions(): Promise<boolean> {
    try {
      console.log('🔍 Checking current Bluetooth permissions...');
      
      // First, check current permission status
      const currentStatus = await this.permissionHandler.checkPermissions();
      
      if (currentStatus.granted) {
        console.log('✅ All Bluetooth permissions are already granted');
        return true;
      }

      if (currentStatus.partiallyGranted) {
        console.log('⚠️ Some permissions are missing:', currentStatus.missingPermissions.map(p => p.name));
      } else {
        console.log('❌ No Bluetooth permissions granted');
      }

      // Request missing permissions
      console.log('📱 Requesting Bluetooth permissions...');
      const result = await this.permissionHandler.requestPermissions();

      if (result.success) {
        console.log('✅ All permissions granted successfully!');
        this.showSuccessMessage();
        return true;
      }

      // Handle different failure scenarios
      if (result.neverAskAgainPermissions.length > 0) {
        console.log('🚫 Some permissions were permanently denied');
        await this.handlePermanentlyDeniedPermissions(result.neverAskAgainPermissions);
        return false;
      }

      if (result.deniedPermissions.length > 0) {
        console.log('❌ Some permissions were denied');
        await this.handleDeniedPermissions(result.deniedPermissions);
        return false;
      }

      return false;
    } catch (error) {
      console.error('💥 Permission request failed:', error);
      this.showErrorMessage(error);
      return false;
    }
  }

  /**
   * Example: Handle permanently denied permissions
   */
  private async handlePermanentlyDeniedPermissions(permissions: any[]): Promise<void> {
    const permissionNames = permissions.map(p => p.name).join(', ');
    
    Alert.alert(
      'Permissões Necessárias',
      `As seguintes permissões foram negadas permanentemente: ${permissionNames}\n\n` +
      'Para usar o KMBio, você precisa habilitar essas permissões nas configurações do dispositivo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Abrir Configurações',
          onPress: () => {
            this.permissionHandler.openPermissionSettings();
          }
        }
      ]
    );
  }

  /**
   * Example: Handle temporarily denied permissions
   */
  private async handleDeniedPermissions(permissions: any[]): Promise<void> {
    const permissionNames = permissions.map(p => p.name).join(', ');
    
    Alert.alert(
      'Permissões Negadas',
      `As seguintes permissões são necessárias para o funcionamento do app: ${permissionNames}\n\n` +
      'Gostaria de tentar novamente?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Tentar Novamente',
          onPress: () => {
            // Retry permission request
            this.requestBluetoothPermissions();
          }
        },
        {
          text: 'Mais Informações',
          onPress: () => {
            this.showPermissionExplanation();
          }
        }
      ]
    );
  }

  /**
   * Example: Show detailed permission explanation
   */
  private showPermissionExplanation(): void {
    Alert.alert(
      'Por que precisamos dessas permissões?',
      '🔵 Bluetooth: Para conectar com seu dispositivo OBD-II\n' +
      '📍 Localização: Requerida pelo Android para escanear dispositivos Bluetooth\n\n' +
      'Essas permissões são essenciais para coletar dados do seu veículo.',
      [
        {
          text: 'Entendi',
          onPress: () => {
            this.requestBluetoothPermissions();
          }
        }
      ]
    );
  }

  /**
   * Example: Show success message
   */
  private showSuccessMessage(): void {
    Alert.alert(
      'Permissões Concedidas',
      '✅ Todas as permissões Bluetooth foram concedidas com sucesso!\n\n' +
      'Agora você pode conectar com dispositivos OBD-II.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Example: Show error message
   */
  private showErrorMessage(error: any): void {
    Alert.alert(
      'Erro nas Permissões',
      '❌ Ocorreu um erro ao solicitar permissões Bluetooth.\n\n' +
      'Tente novamente ou entre em contato com o suporte.',
      [
        {
          text: 'Tentar Novamente',
          onPress: () => {
            this.requestBluetoothPermissions();
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Example: Check permissions before critical operations
   */
  async ensurePermissionsForBluetooth(): Promise<boolean> {
    const status = await this.permissionHandler.checkPermissions();
    
    if (!status.granted) {
      console.log('⚠️ Bluetooth permissions not granted, requesting...');
      return await this.requestBluetoothPermissions();
    }
    
    return true;
  }

  /**
   * Example: Get detailed permission information
   */
  async getPermissionDetails(): Promise<void> {
    const requiredPermissions = this.permissionHandler.getRequiredPermissions();
    const currentStatus = await this.permissionHandler.checkPermissions();
    
    console.log('📋 Permission Details:');
    console.log('Required permissions:', requiredPermissions.length);
    console.log('Granted permissions:', currentStatus.grantedPermissions.length);
    console.log('Missing permissions:', currentStatus.missingPermissions.length);
    
    if (currentStatus.missingPermissions.length > 0) {
      console.log('Missing:', currentStatus.missingPermissions.map(p => ({
        name: p.name,
        description: p.description,
        rationale: p.rationale
      })));
    }
  }

  /**
   * Example: Handle permission recovery
   */
  async handlePermissionRecovery(permissionName: string): Promise<void> {
    const requiredPermissions = this.permissionHandler.getRequiredPermissions();
    const permission = requiredPermissions.find(p => p.name === permissionName);
    
    if (permission) {
      const recoveryAction = await this.permissionHandler.handlePermissionDenied(permission);
      
      Alert.alert(
        'Recuperar Permissão',
        `${recoveryAction.description}\n\nDeseja ${recoveryAction.title.toLowerCase()}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: recoveryAction.title,
            onPress: () => {
              if (typeof recoveryAction.action === 'function') {
                recoveryAction.action();
              }
            }
          }
        ]
      );
    }
  }
}

// Usage example:
// const permissionExample = new BluetoothPermissionExample();
// await permissionExample.requestBluetoothPermissions();