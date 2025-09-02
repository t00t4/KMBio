import { BleManager, State } from 'react-native-ble-plx';
import {
  BluetoothStateManager as IBluetoothStateManager,
  BluetoothSystemState,
  BluetoothValidationResult,
  BluetoothValidationIssue,
  BluetoothValidationIssueType,
  BluetoothStateChangeEvent,
  BluetoothStateMonitoringConfig,
  BluetoothPowerState
} from '../../types/ble/bluetooth-state-manager';
import { PermissionsManager } from '../../utils/permissions';
import { BluetoothUtils } from '../../utils/bluetooth';

export class BluetoothStateManager implements IBluetoothStateManager {
  private bleManager: BleManager | null = null;
  private currentState: BluetoothSystemState;
  private isMonitoring = false;
  private stateChangeCallbacks: ((state: BluetoothSystemState) => void)[] = [];
  private stateHistory: BluetoothStateChangeEvent[] = [];
  private stateSubscription: any = null;
  private stabilityCheckInterval: NodeJS.Timeout | null = null;
  private lastStableStateTime: Date | null = null;
  
  private readonly config: BluetoothStateMonitoringConfig = {
    stabilityCheckInterval: 1000, // Check stability every second
    stabilityRequiredDuration: 3000, // State must be stable for 3 seconds
    maxStateHistorySize: 50,
    enableDetailedLogging: true
  };

  constructor(bleManager?: BleManager, config?: Partial<BluetoothStateMonitoringConfig>) {
    this.bleManager = bleManager || null;
    
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Initialize with unknown state
    this.currentState = {
      isEnabled: false,
      isSupported: false,
      hasPermissions: false,
      powerState: 'Unknown',
      lastChecked: new Date(),
      isStable: false
    };

    this.log('BluetoothStateManager initialized');
  }

  getCurrentState(): BluetoothSystemState {
    return { ...this.currentState };
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      this.log('Monitoring already started');
      return;
    }

    this.log('Starting Bluetooth state monitoring');
    this.isMonitoring = true;

    // Initial state check
    this.updateCurrentState('startMonitoring');

    // Set up BLE state subscription if manager is available
    if (this.bleManager) {
      this.stateSubscription = this.bleManager.onStateChange((state) => {
        this.log(`BLE state changed to: ${state}`);
        this.updateCurrentState(`BLE state change: ${state}`);
      }, true); // true = emit current state immediately
    }

    // Start stability monitoring
    this.startStabilityMonitoring();
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      this.log('Monitoring already stopped');
      return;
    }

    this.log('Stopping Bluetooth state monitoring');
    this.isMonitoring = false;

    // Clean up BLE state subscription
    if (this.stateSubscription) {
      this.stateSubscription.remove();
      this.stateSubscription = null;
    }

    // Stop stability monitoring
    if (this.stabilityCheckInterval) {
      clearInterval(this.stabilityCheckInterval);
      this.stabilityCheckInterval = null;
    }

    this.lastStableStateTime = null;
  }

  onStateChange(callback: (state: BluetoothSystemState) => void): void {
    this.stateChangeCallbacks.push(callback);
    this.log(`Added state change callback. Total callbacks: ${this.stateChangeCallbacks.length}`);
  }

  async validateState(): Promise<BluetoothValidationResult> {
    this.log('Validating Bluetooth state');
    
    const issues: BluetoothValidationIssue[] = [];
    const recommendations: string[] = [];

    try {
      // Update current state before validation
      await this.updateCurrentState('validateState');

      // Check BLE support
      if (!this.currentState.isSupported) {
        issues.push({
          type: 'BLE_NOT_SUPPORTED',
          severity: 'CRITICAL',
          message: 'Bluetooth Low Energy não é suportado neste dispositivo',
          technicalDetails: 'Device does not support BLE functionality',
          recoverable: false,
          recoverySteps: ['Use um dispositivo com suporte a Bluetooth 4.0 ou superior']
        });
        recommendations.push('Este dispositivo não suporta Bluetooth Low Energy');
      }

      // Check permissions
      if (!this.currentState.hasPermissions) {
        issues.push({
          type: 'PERMISSIONS_MISSING',
          severity: 'HIGH',
          message: 'Permissões Bluetooth não concedidas',
          technicalDetails: 'Required Bluetooth permissions are not granted',
          recoverable: true,
          recoverySteps: [
            'Abra as configurações do aplicativo',
            'Conceda as permissões de Bluetooth e Localização',
            'Reinicie o aplicativo'
          ]
        });
        recommendations.push('Conceda as permissões Bluetooth necessárias');
      }

      // Check if Bluetooth is enabled
      if (!this.currentState.isEnabled) {
        issues.push({
          type: 'BLUETOOTH_DISABLED',
          severity: 'HIGH',
          message: 'Bluetooth está desligado',
          technicalDetails: `Bluetooth power state: ${this.currentState.powerState}`,
          recoverable: true,
          recoverySteps: [
            'Abra as configurações do dispositivo',
            'Ligue o Bluetooth',
            'Aguarde alguns segundos para estabilizar'
          ]
        });
        recommendations.push('Ligue o Bluetooth nas configurações do dispositivo');
      }

      // Check state stability
      if (!this.currentState.isStable) {
        issues.push({
          type: 'STATE_UNSTABLE',
          severity: 'MEDIUM',
          message: 'Estado do Bluetooth instável',
          technicalDetails: 'Bluetooth state is changing frequently',
          recoverable: true,
          recoverySteps: [
            'Aguarde alguns segundos para o Bluetooth estabilizar',
            'Evite ligar/desligar o Bluetooth rapidamente',
            'Reinicie o Bluetooth se necessário'
          ]
        });
        recommendations.push('Aguarde o Bluetooth estabilizar antes de tentar conectar');
      }

      // Check if BLE manager is available
      if (!this.bleManager) {
        issues.push({
          type: 'MANAGER_NOT_INITIALIZED',
          severity: 'HIGH',
          message: 'Gerenciador Bluetooth não inicializado',
          technicalDetails: 'BleManager instance is null',
          recoverable: true,
          recoverySteps: [
            'Reinicialize o sistema Bluetooth',
            'Reinicie o aplicativo se necessário'
          ]
        });
        recommendations.push('Reinicialize o sistema Bluetooth');
      }

      // Add success recommendations if no critical issues
      const criticalIssues = issues.filter(issue => issue.severity === 'CRITICAL');
      if (criticalIssues.length === 0 && issues.length === 0) {
        recommendations.push('Sistema Bluetooth funcionando corretamente');
      }

      const result: BluetoothValidationResult = {
        isValid: issues.length === 0,
        issues,
        recommendations,
        lastValidated: new Date()
      };

      this.log(`Validation completed. Valid: ${result.isValid}, Issues: ${issues.length}`);
      return result;

    } catch (error) {
      this.log(`Validation error: ${error}`);
      
      issues.push({
        type: 'UNKNOWN_STATE',
        severity: 'HIGH',
        message: 'Erro ao validar estado do Bluetooth',
        technicalDetails: `Validation error: ${error}`,
        recoverable: true,
        recoverySteps: [
          'Tente novamente',
          'Reinicie o aplicativo se o problema persistir'
        ]
      });

      return {
        isValid: false,
        issues,
        recommendations: ['Erro na validação - tente novamente'],
        lastValidated: new Date()
      };
    }
  }

  // Public method to set BLE manager (useful for dependency injection)
  setBleManager(bleManager: BleManager): void {
    this.bleManager = bleManager;
    this.log('BLE Manager set');
    
    // If monitoring is active, restart with new manager
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  // Public method to get state history for debugging
  getStateHistory(): BluetoothStateChangeEvent[] {
    return [...this.stateHistory];
  }

  // Public method to clear state history
  clearStateHistory(): void {
    this.stateHistory = [];
    this.log('State history cleared');
  }

  // Private helper methods

  private async updateCurrentState(trigger: string): Promise<void> {
    const previousState = { ...this.currentState };
    
    try {
      // Check BLE support
      const isSupported = await BluetoothUtils.supportsBLE();
      
      // Check permissions
      const permissionResult = await PermissionsManager.checkBLEPermissions();
      const hasPermissions = permissionResult.granted;
      
      // Check Bluetooth state
      let powerState: BluetoothPowerState = 'Unknown';
      let isEnabled = false;
      
      if (this.bleManager) {
        try {
          const state = await this.bleManager.state();
          powerState = state as BluetoothPowerState;
          isEnabled = state === 'PoweredOn';
        } catch (error) {
          this.log(`Error getting BLE state: ${error}`);
          powerState = 'Unknown';
          isEnabled = false;
        }
      } else {
        // Fallback to utility method if no BLE manager
        const bluetoothState = await BluetoothUtils.getBluetoothState();
        isEnabled = bluetoothState.isEnabled;
        powerState = isEnabled ? 'PoweredOn' : 'PoweredOff';
      }

      // Update current state
      this.currentState = {
        isEnabled,
        isSupported,
        hasPermissions,
        powerState,
        lastChecked: new Date(),
        isStable: this.currentState.isStable // Will be updated by stability monitoring
      };

      // Check if state actually changed
      const stateChanged = this.hasStateChanged(previousState, this.currentState);
      
      if (stateChanged) {
        this.recordStateChange(previousState, this.currentState, trigger);
        this.notifyStateChangeCallbacks();
        this.resetStabilityTimer();
      }

    } catch (error) {
      this.log(`Error updating state: ${error}`);
      
      // Update with error state
      this.currentState = {
        ...this.currentState,
        lastChecked: new Date(),
        isStable: false
      };
    }
  }

  private hasStateChanged(previous: BluetoothSystemState, current: BluetoothSystemState): boolean {
    return (
      previous.isEnabled !== current.isEnabled ||
      previous.isSupported !== current.isSupported ||
      previous.hasPermissions !== current.hasPermissions ||
      previous.powerState !== current.powerState
    );
  }

  private recordStateChange(
    previousState: BluetoothSystemState, 
    newState: BluetoothSystemState, 
    trigger: string
  ): void {
    const isStabilityChange = previousState.isStable !== newState.isStable;
    
    const event: BluetoothStateChangeEvent = {
      timestamp: new Date(),
      previousState: { ...previousState },
      newState: { ...newState },
      trigger,
      isStabilityChange
    };

    this.stateHistory.push(event);

    // Limit history size
    if (this.stateHistory.length > this.config.maxStateHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.config.maxStateHistorySize);
    }

    this.log(`State change recorded: ${trigger}`);
  }

  private notifyStateChangeCallbacks(): void {
    const currentState = this.getCurrentState();
    
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        this.log(`Error in state change callback: ${error}`);
      }
    });
  }

  private startStabilityMonitoring(): void {
    if (this.stabilityCheckInterval) {
      clearInterval(this.stabilityCheckInterval);
    }

    this.stabilityCheckInterval = setInterval(() => {
      this.checkStability();
    }, this.config.stabilityCheckInterval);

    this.resetStabilityTimer();
  }

  private resetStabilityTimer(): void {
    this.lastStableStateTime = new Date();
    
    // Mark as unstable immediately when state changes
    if (this.currentState.isStable) {
      const previousState = { ...this.currentState };
      this.currentState.isStable = false;
      this.recordStateChange(previousState, this.currentState, 'stability reset');
      this.notifyStateChangeCallbacks();
    }
  }

  private checkStability(): void {
    if (!this.lastStableStateTime) {
      return;
    }

    const now = new Date();
    const timeSinceLastChange = now.getTime() - this.lastStableStateTime.getTime();
    const isNowStable = timeSinceLastChange >= this.config.stabilityRequiredDuration;

    if (isNowStable !== this.currentState.isStable) {
      const previousState = { ...this.currentState };
      this.currentState.isStable = isNowStable;
      this.recordStateChange(previousState, this.currentState, 'stability check');
      this.notifyStateChangeCallbacks();
      
      this.log(`State stability changed to: ${isNowStable}`);
    }
  }

  private log(message: string): void {
    if (this.config.enableDetailedLogging) {
      console.log(`[BluetoothStateManager] ${message}`);
    }
  }

  // Cleanup method
  destroy(): void {
    this.log('Destroying BluetoothStateManager');
    
    this.stopMonitoring();
    this.stateChangeCallbacks = [];
    this.stateHistory = [];
    this.bleManager = null;
  }
}