import { Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import {
  BluetoothInitializer as IBluetoothInitializer,
  BluetoothInitializationResult,
  BluetoothInitializationStatus,
  BluetoothCapabilities,
  BluetoothInitializationError,
  BluetoothErrorCode,
  BluetoothDiagnosticInfo,
  BluetoothStateChange,
  PermissionChange
} from '../../types/ble/bluetooth-initializer';
import { PermissionsManager, PermissionResult } from '../../utils/permissions';
import { BluetoothUtils } from '../../utils/bluetooth';

export class BluetoothInitializer implements IBluetoothInitializer {
  private bleManager: BleManager | null = null;
  private initializationStatus: BluetoothInitializationStatus = 'NOT_STARTED';
  private initializationAttempts = 0;
  private lastSuccessfulInit?: Date;
  private stateHistory: BluetoothStateChange[] = [];
  private permissionHistory: PermissionChange[] = [];
  private initializationCallbacks: ((result: BluetoothInitializationResult) => void)[] = [];
  private readonly maxInitializationAttempts = 3;
  private readonly initializationTimeoutMs = 10000;

  constructor() {
    this.recordStateChange('UNKNOWN', 'NOT_STARTED', 'Constructor');
  }

  async initialize(): Promise<BluetoothInitializationResult> {
    this.initializationStatus = 'IN_PROGRESS';
    this.initializationAttempts++;
    
    const startTime = Date.now();
    
    try {
      // Step 1: Check BLE support
      const bleSupported = await this.checkBLESupport();
      if (!bleSupported) {
        return this.createErrorResult(
          'BLUETOOTH_NOT_SUPPORTED',
          'Bluetooth Low Energy não é suportado neste dispositivo',
          'Device does not support BLE functionality',
          false,
          ['Verifique se seu dispositivo suporta Bluetooth 4.0 ou superior']
        );
      }

      // Step 2: Check and request permissions
      const permissionResult = await this.handlePermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Step 3: Initialize BLE Manager with timeout
      const bleManagerResult = await this.initializeBLEManager();
      if (!bleManagerResult.success) {
        return bleManagerResult;
      }

      // Step 4: Validate Bluetooth state
      const stateValidationResult = await this.validateBluetoothState();
      if (!stateValidationResult.success) {
        return stateValidationResult;
      }

      // Step 5: Test basic functionality
      const functionalityResult = await this.testBasicFunctionality();
      if (!functionalityResult.success) {
        return functionalityResult;
      }

      // Success!
      const capabilities = await this.getCapabilities();
      const result: BluetoothInitializationResult = {
        success: true,
        capabilities,
        recommendations: this.generateRecommendations(capabilities)
      };

      this.initializationStatus = 'COMPLETED_SUCCESS';
      this.lastSuccessfulInit = new Date();
      this.initializationAttempts = 0; // Reset on success
      
      // Notify callbacks
      this.notifyInitializationComplete(result);
      
      return result;

    } catch (error) {
      return this.createErrorResult(
        'UNKNOWN_ERROR',
        'Erro inesperado durante a inicialização do Bluetooth',
        `Unexpected error: ${error}`,
        true,
        ['Tente reiniciar o aplicativo', 'Verifique se o Bluetooth está funcionando corretamente']
      );
    }
  }

  async retry(): Promise<BluetoothInitializationResult> {
    if (this.initializationAttempts >= this.maxInitializationAttempts) {
      return this.createErrorResult(
        'TIMEOUT_ERROR',
        'Número máximo de tentativas de inicialização excedido',
        `Max attempts (${this.maxInitializationAttempts}) reached`,
        false,
        [
          'Reinicie o aplicativo',
          'Verifique as configurações do Bluetooth',
          'Reinicie o dispositivo se necessário'
        ]
      );
    }

    this.initializationStatus = 'RETRYING';
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000 * this.initializationAttempts));
    
    return this.initialize();
  }

  getInitializationStatus(): BluetoothInitializationStatus {
    return this.initializationStatus;
  }

  onInitializationComplete(callback: (result: BluetoothInitializationResult) => void): void {
    this.initializationCallbacks.push(callback);
  }

  // Private helper methods

  private async checkBLESupport(): Promise<boolean> {
    return await BluetoothUtils.supportsBLE();
  }

  private async handlePermissions(): Promise<BluetoothInitializationResult> {
    try {
      // Check current permissions
      const currentPermissions = await PermissionsManager.checkBLEPermissions();
      this.recordPermissionChange('BLE_PERMISSIONS', 'UNKNOWN', currentPermissions.granted ? 'GRANTED' : 'DENIED');

      if (currentPermissions.granted) {
        return { success: true } as BluetoothInitializationResult;
      }

      // Request permissions
      const permissionRequest = await PermissionsManager.requestBLEPermissions();
      this.recordPermissionChange('BLE_PERMISSIONS', 'DENIED', permissionRequest.granted ? 'GRANTED' : 'DENIED');

      if (!permissionRequest.granted) {
        const errorCode: BluetoothErrorCode = permissionRequest.shouldShowRationale 
          ? 'PERMISSIONS_DENIED' 
          : 'PERMISSIONS_NEVER_ASK_AGAIN';
        
        const recoverable = permissionRequest.shouldShowRationale !== false;
        const recoverySteps = recoverable 
          ? ['Toque em "Permitir" quando solicitado', 'Tente novamente']
          : ['Abra as Configurações do dispositivo', 'Vá para Aplicativos > KMBio > Permissões', 'Habilite as permissões de Bluetooth e Localização'];

        return this.createErrorResult(
          errorCode,
          'Permissões Bluetooth necessárias para o funcionamento do aplicativo',
          `Permission request failed: ${permissionRequest.error}`,
          recoverable,
          recoverySteps
        );
      }

      return { success: true } as BluetoothInitializationResult;
    } catch (error) {
      return this.createErrorResult(
        'PERMISSIONS_DENIED',
        'Erro ao verificar permissões Bluetooth',
        `Permission check failed: ${error}`,
        true,
        ['Tente novamente', 'Verifique as configurações de permissão do aplicativo']
      );
    }
  }

  private async initializeBLEManager(): Promise<BluetoothInitializationResult> {
    try {
      // Create BLE Manager with timeout
      const initPromise = new Promise<BleManager>((resolve, reject) => {
        try {
          const manager = new BleManager();
          resolve(manager);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('BLE Manager initialization timeout')), this.initializationTimeoutMs);
      });

      this.bleManager = await Promise.race([initPromise, timeoutPromise]);
      
      return { success: true } as BluetoothInitializationResult;
    } catch (error) {
      return this.createErrorResult(
        'BLE_MANAGER_INIT_FAILED',
        'Falha na inicialização do gerenciador Bluetooth',
        `BLE Manager init failed: ${error}`,
        true,
        ['Tente novamente', 'Reinicie o aplicativo se o problema persistir']
      );
    }
  }

  private async validateBluetoothState(): Promise<BluetoothInitializationResult> {
    if (!this.bleManager) {
      return this.createErrorResult(
        'BLE_MANAGER_INIT_FAILED',
        'Gerenciador Bluetooth não inicializado',
        'BLE Manager is null',
        true,
        ['Tente reinicializar o Bluetooth']
      );
    }

    try {
      const state = await this.bleManager.state();
      this.recordStateChange('UNKNOWN', state, 'State validation');

      switch (state) {
        case 'PoweredOn':
          return { success: true } as BluetoothInitializationResult;
          
        case 'PoweredOff':
          return this.createErrorResult(
            'BLUETOOTH_DISABLED',
            'Bluetooth está desligado',
            'Bluetooth state is PoweredOff',
            true,
            ['Ligue o Bluetooth nas configurações do dispositivo', 'Tente novamente após ligar o Bluetooth']
          );
          
        case 'Unauthorized':
          return this.createErrorResult(
            'PERMISSIONS_DENIED',
            'Permissões Bluetooth não concedidas',
            'Bluetooth state is Unauthorized',
            true,
            ['Conceda as permissões Bluetooth necessárias', 'Verifique as configurações de permissão do aplicativo']
          );
          
        case 'Unsupported':
          return this.createErrorResult(
            'BLUETOOTH_NOT_SUPPORTED',
            'Bluetooth não é suportado neste dispositivo',
            'Bluetooth state is Unsupported',
            false,
            ['Use um dispositivo com suporte a Bluetooth']
          );
          
        case 'Resetting':
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.validateBluetoothState();
          
        default:
          return this.createErrorResult(
            'UNKNOWN_ERROR',
            'Estado do Bluetooth desconhecido',
            `Unknown Bluetooth state: ${state}`,
            true,
            ['Tente novamente', 'Reinicie o Bluetooth']
          );
      }
    } catch (error) {
      return this.createErrorResult(
        'STATE_MONITORING_FAILED',
        'Falha ao verificar o estado do Bluetooth',
        `State check failed: ${error}`,
        true,
        ['Tente novamente', 'Verifique se o Bluetooth está funcionando']
      );
    }
  }

  private async testBasicFunctionality(): Promise<BluetoothInitializationResult> {
    if (!this.bleManager) {
      return this.createErrorResult(
        'BLE_MANAGER_INIT_FAILED',
        'Gerenciador Bluetooth não disponível para teste',
        'BLE Manager is null during functionality test',
        true,
        ['Reinicialize o Bluetooth']
      );
    }

    try {
      // Test if we can start a scan (and immediately stop it)
      const scanPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.bleManager?.stopDeviceScan();
          resolve();
        }, 1000);

        this.bleManager?.startDeviceScan(null, null, (error) => {
          clearTimeout(timeout);
          this.bleManager?.stopDeviceScan();
          
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      await scanPromise;
      return { success: true } as BluetoothInitializationResult;
    } catch (error) {
      return this.createErrorResult(
        'BLE_MANAGER_INIT_FAILED',
        'Teste de funcionalidade Bluetooth falhou',
        `Functionality test failed: ${error}`,
        true,
        ['Verifique se o Bluetooth está funcionando corretamente', 'Tente reiniciar o Bluetooth']
      );
    }
  }

  private async getCapabilities(): Promise<BluetoothCapabilities> {
    const bleSupported = await this.checkBLESupport();
    const permissionResult = await PermissionsManager.checkBLEPermissions();
    const bluetoothState = await BluetoothUtils.getBluetoothState();

    return {
      bleSupported,
      permissionsGranted: permissionResult.granted,
      bluetoothEnabled: bluetoothState.isEnabled,
      canScan: bleSupported && permissionResult.granted && bluetoothState.isEnabled,
      canConnect: bleSupported && permissionResult.granted && bluetoothState.isEnabled
    };
  }

  private generateRecommendations(capabilities: BluetoothCapabilities): string[] {
    const recommendations: string[] = [];

    if (!capabilities.bleSupported) {
      recommendations.push('Este dispositivo não suporta Bluetooth Low Energy');
    }

    if (!capabilities.permissionsGranted) {
      recommendations.push('Conceda as permissões Bluetooth para usar o aplicativo');
    }

    if (!capabilities.bluetoothEnabled) {
      recommendations.push('Ligue o Bluetooth para conectar aos dispositivos OBD-II');
    }

    if (capabilities.canScan && capabilities.canConnect) {
      recommendations.push('Sistema Bluetooth pronto para uso');
    }

    return recommendations;
  }

  private createErrorResult(
    code: BluetoothErrorCode,
    message: string,
    technicalDetails: string,
    recoverable: boolean,
    recoverySteps: string[]
  ): BluetoothInitializationResult {
    const error: BluetoothInitializationError = {
      code,
      message,
      technicalDetails,
      timestamp: new Date(),
      recoverable,
      recoverySteps,
      diagnosticInfo: this.getDiagnosticInfo()
    };

    const result: BluetoothInitializationResult = {
      success: false,
      error,
      capabilities: {
        bleSupported: false,
        permissionsGranted: false,
        bluetoothEnabled: false,
        canScan: false,
        canConnect: false
      },
      recommendations: recoverySteps
    };

    // Set status and notify callbacks
    this.initializationStatus = 'COMPLETED_ERROR';
    this.notifyInitializationComplete(result);

    return result;
  }

  private getDiagnosticInfo(): BluetoothDiagnosticInfo {
    return {
      deviceModel: Platform.OS === 'android' ? 'Android Device' : 'iOS Device',
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0', // From package.json
      bleLibraryVersion: '3.5.0', // react-native-ble-plx version from package.json
      initializationAttempts: this.initializationAttempts,
      lastSuccessfulInit: this.lastSuccessfulInit,
      stateHistory: [...this.stateHistory],
      permissionHistory: [...this.permissionHistory]
    };
  }

  private recordStateChange(previousState: string, newState: string, trigger: string): void {
    const change: BluetoothStateChange = {
      timestamp: new Date(),
      previousState,
      newState,
      trigger
    };

    this.stateHistory.push(change);
    
    // Keep only last 10 state changes
    if (this.stateHistory.length > 10) {
      this.stateHistory = this.stateHistory.slice(-10);
    }
  }

  private recordPermissionChange(permission: string, previousStatus: string, newStatus: string): void {
    const change: PermissionChange = {
      timestamp: new Date(),
      permission,
      previousStatus,
      newStatus
    };

    this.permissionHistory.push(change);
    
    // Keep only last 10 permission changes
    if (this.permissionHistory.length > 10) {
      this.permissionHistory = this.permissionHistory.slice(-10);
    }
  }

  private notifyInitializationComplete(result: BluetoothInitializationResult): void {
    this.initializationCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.warn('Error in initialization callback:', error);
      }
    });
  }

  // Cleanup method
  destroy(): void {
    if (this.bleManager) {
      this.bleManager.destroy();
      this.bleManager = null;
    }
    
    this.initializationCallbacks = [];
    this.initializationStatus = 'NOT_STARTED';
  }
}