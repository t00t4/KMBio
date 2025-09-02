import { Platform, Alert, Linking } from 'react-native';
import {
  BluetoothErrorHandler as IBluetoothErrorHandler,
  BluetoothError,
  BluetoothErrorResponse,
  RecoveryResult,
  RecoveryInstructions,
  ErrorHandlingStrategy,
  RecoveryOption,
  RecoveryAction,
  ErrorSeverity,
  ErrorCategory,
  RetryConfig,
  ErrorMetrics
} from '../../types/ble/bluetooth-error-handler';
import { BluetoothErrorCode } from '../../types/ble/bluetooth-initializer';
import { BLEErrorCode } from '../../types/ble/device';

export class BluetoothErrorHandler implements IBluetoothErrorHandler {
  private errorStrategies: Map<string, ErrorHandlingStrategy>;
  private retryConfig: RetryConfig;
  private errorMetrics: Map<string, ErrorMetrics>;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      ...retryConfig
    };

    this.errorMetrics = new Map();
    this.errorStrategies = this.initializeErrorStrategies();
  }

  handleError(error: BluetoothError): BluetoothErrorResponse {
    this.updateErrorMetrics(error);
    
    const strategy = this.getErrorStrategy(error.code);
    const recoveryOptions = this.buildRecoveryOptions(error, strategy);

    return {
      userMessage: this.getUserMessage(error, strategy),
      technicalMessage: this.getTechnicalMessage(error, strategy),
      recoveryOptions,
      shouldRetry: strategy.autoRetry && this.shouldRetry(error),
      retryDelay: this.calculateRetryDelay(error),
      severity: strategy.severity,
      category: strategy.category
    };
  }

  canRecover(error: BluetoothError): boolean {
    const strategy = this.getErrorStrategy(error.code);
    const maxRetries = strategy.maxRetries || this.retryConfig.maxAttempts;
    return strategy.category !== 'PERMANENT' && 
           strategy.autoRetry &&
           (error.retryCount || 0) < maxRetries;
  }

  async attemptRecovery(error: BluetoothError): Promise<RecoveryResult> {
    const strategy = this.getErrorStrategy(error.code);
    
    try {
      const result = await this.executeRecoveryAction(strategy.action, error);
      
      if (result.success) {
        this.updateRecoveryMetrics(error.code, true);
      } else {
        this.updateRecoveryMetrics(error.code, false);
      }
      
      return result;
    } catch (recoveryError) {
      this.updateRecoveryMetrics(error.code, false);
      
      return {
        success: false,
        error: {
          ...error,
          message: 'Falha na recuperação automática',
          technicalDetails: recoveryError instanceof Error ? recoveryError.message : 'Unknown recovery error'
        },
        message: 'Não foi possível recuperar automaticamente. Tente uma ação manual.',
        nextAction: 'MANUAL_INTERVENTION'
      };
    }
  }

  getRecoveryInstructions(error: BluetoothError): RecoveryInstructions {
    const strategy = this.getErrorStrategy(error.code);
    
    return {
      title: this.getInstructionTitle(error.code),
      description: strategy.userMessage,
      steps: this.getRecoverySteps(error.code),
      automaticRecovery: strategy.autoRetry,
      estimatedTime: this.getEstimatedRecoveryTime(error.code),
      successIndicators: this.getSuccessIndicators(error.code)
    };
  }

  getErrorStrategy(errorCode: BluetoothErrorCode | BLEErrorCode): ErrorHandlingStrategy {
    return this.errorStrategies.get(errorCode) || this.getDefaultStrategy();
  }

  private initializeErrorStrategies(): Map<string, ErrorHandlingStrategy> {
    const strategies = new Map<string, ErrorHandlingStrategy>();

    // Bluetooth Hardware Errors
    strategies.set('BLUETOOTH_NOT_SUPPORTED', {
      userMessage: 'Este dispositivo não suporta Bluetooth Low Energy (BLE)',
      technicalMessage: 'Device does not support BLE functionality',
      action: 'ENABLE_LIMITED_MODE',
      autoRetry: false,
      severity: 'CRITICAL',
      category: 'HARDWARE',
      showInstructions: true,
      recoveryOptions: [
        {
          id: 'limited_mode',
          label: 'Usar modo limitado',
          description: 'Continue usando o app com funcionalidades limitadas',
          action: 'ENABLE_LIMITED_MODE',
          isAutomatic: false,
          priority: 1
        },
        {
          id: 'contact_support',
          label: 'Contatar suporte',
          description: 'Entre em contato para verificar compatibilidade',
          action: 'CONTACT_SUPPORT',
          isAutomatic: false,
          priority: 2
        }
      ]
    });

    strategies.set('BLUETOOTH_DISABLED', {
      userMessage: 'Bluetooth está desligado. Por favor, habilite o Bluetooth para continuar.',
      technicalMessage: 'Bluetooth adapter is powered off',
      action: 'OPEN_BLUETOOTH_SETTINGS',
      autoRetry: true,
      retryInterval: 2000,
      maxRetries: 5,
      severity: 'HIGH',
      category: 'USER_ACTION_REQUIRED',
      showInstructions: true,
      recoveryOptions: [
        {
          id: 'open_settings',
          label: 'Abrir configurações',
          description: 'Abrir configurações do Bluetooth',
          action: 'OPEN_BLUETOOTH_SETTINGS',
          isAutomatic: false,
          priority: 1
        },
        {
          id: 'retry',
          label: 'Tentar novamente',
          description: 'Verificar novamente o status do Bluetooth',
          action: 'RETRY_INITIALIZATION',
          isAutomatic: true,
          priority: 2
        }
      ]
    });

    // Permission Errors
    strategies.set('PERMISSIONS_DENIED', {
      userMessage: 'Permissões Bluetooth são necessárias para conectar com dispositivos OBD-II',
      technicalMessage: 'Required Bluetooth permissions not granted',
      action: 'REQUEST_PERMISSIONS',
      autoRetry: false,
      severity: 'HIGH',
      category: 'PERMISSIONS',
      showInstructions: true,
      recoveryOptions: [
        {
          id: 'request_permissions',
          label: 'Solicitar permissões',
          description: 'Solicitar permissões Bluetooth novamente',
          action: 'REQUEST_PERMISSIONS',
          isAutomatic: false,
          priority: 1
        },
        {
          id: 'open_app_settings',
          label: 'Configurações do app',
          description: 'Abrir configurações do aplicativo',
          action: 'OPEN_APP_SETTINGS',
          isAutomatic: false,
          priority: 2
        }
      ]
    });

    strategies.set('PERMISSIONS_NEVER_ASK_AGAIN', {
      userMessage: 'Permissões Bluetooth foram negadas permanentemente. Habilite nas configurações do app.',
      technicalMessage: 'Bluetooth permissions permanently denied',
      action: 'OPEN_APP_SETTINGS',
      autoRetry: false,
      severity: 'CRITICAL',
      category: 'PERMISSIONS',
      showInstructions: true,
      recoveryOptions: [
        {
          id: 'open_app_settings',
          label: 'Configurações do app',
          description: 'Abrir configurações para habilitar permissões',
          action: 'OPEN_APP_SETTINGS',
          isAutomatic: false,
          priority: 1
        },
        {
          id: 'show_instructions',
          label: 'Ver instruções',
          description: 'Como habilitar permissões manualmente',
          action: 'SHOW_INSTRUCTIONS',
          isAutomatic: false,
          priority: 2
        }
      ]
    });

    // BLE Manager Errors
    strategies.set('BLE_MANAGER_INIT_FAILED', {
      userMessage: 'Falha na inicialização do Bluetooth. Tentando novamente...',
      technicalMessage: 'BLE Manager initialization failed',
      action: 'RESTART_BLE_MANAGER',
      autoRetry: true,
      retryInterval: 1500,
      maxRetries: 3,
      severity: 'MEDIUM',
      category: 'TEMPORARY',
      showInstructions: false,
      recoveryOptions: [
        {
          id: 'restart_ble',
          label: 'Reiniciar Bluetooth',
          description: 'Reinicializar o gerenciador Bluetooth',
          action: 'RESTART_BLE_MANAGER',
          isAutomatic: true,
          priority: 1
        },
        {
          id: 'retry_init',
          label: 'Tentar novamente',
          description: 'Tentar inicialização novamente',
          action: 'RETRY_INITIALIZATION',
          isAutomatic: false,
          priority: 2
        }
      ]
    });

    // Connection Errors
    strategies.set('CONNECTION_FAILED', {
      userMessage: 'Falha ao conectar com o dispositivo. Verifique se está próximo e ligado.',
      technicalMessage: 'Device connection attempt failed',
      action: 'WAIT_AND_RETRY',
      autoRetry: true,
      retryInterval: 3000,
      maxRetries: 3,
      severity: 'MEDIUM',
      category: 'TEMPORARY',
      showInstructions: true,
      recoveryOptions: [
        {
          id: 'retry_connection',
          label: 'Tentar conectar novamente',
          description: 'Tentar conectar com o dispositivo novamente',
          action: 'RETRY_INITIALIZATION',
          isAutomatic: true,
          priority: 1
        },
        {
          id: 'show_instructions',
          label: 'Ver dicas de conexão',
          description: 'Como melhorar a conexão Bluetooth',
          action: 'SHOW_INSTRUCTIONS',
          isAutomatic: false,
          priority: 2
        }
      ]
    });

    strategies.set('TIMEOUT_ERROR', {
      userMessage: 'Tempo limite excedido. Verifique sua conexão Bluetooth.',
      technicalMessage: 'Operation timed out',
      action: 'RETRY_INITIALIZATION',
      autoRetry: true,
      retryInterval: 2000,
      maxRetries: 2,
      severity: 'MEDIUM',
      category: 'TEMPORARY',
      showInstructions: false,
      recoveryOptions: [
        {
          id: 'retry',
          label: 'Tentar novamente',
          description: 'Tentar a operação novamente',
          action: 'RETRY_INITIALIZATION',
          isAutomatic: true,
          priority: 1
        }
      ]
    });

    return strategies;
  }

  private async executeRecoveryAction(action: RecoveryAction, error: BluetoothError): Promise<RecoveryResult> {
    switch (action) {
      case 'RETRY_INITIALIZATION':
        return {
          success: true,
          message: 'Tentando inicialização novamente...',
          nextAction: 'RETRY_INITIALIZATION',
          retryAfter: this.calculateRetryDelay(error)
        };

      case 'REQUEST_PERMISSIONS':
        return {
          success: true,
          message: 'Solicitando permissões Bluetooth...',
          nextAction: 'REQUEST_PERMISSIONS'
        };

      case 'OPEN_BLUETOOTH_SETTINGS':
        try {
          if (Platform.OS === 'android') {
            await Linking.openSettings();
          } else {
            await Linking.openURL('App-Prefs:Bluetooth');
          }
          return {
            success: true,
            message: 'Configurações abertas. Habilite o Bluetooth e volte ao app.',
            nextAction: 'WAIT_AND_RETRY',
            retryAfter: 5000
          };
        } catch (linkingError) {
          return {
            success: false,
            message: 'Não foi possível abrir as configurações automaticamente.',
            nextAction: 'MANUAL_INTERVENTION'
          };
        }

      case 'OPEN_APP_SETTINGS':
        try {
          await Linking.openSettings();
          return {
            success: true,
            message: 'Configurações do app abertas. Habilite as permissões Bluetooth.',
            nextAction: 'WAIT_AND_RETRY',
            retryAfter: 10000
          };
        } catch (linkingError) {
          return {
            success: false,
            message: 'Não foi possível abrir as configurações do app.',
            nextAction: 'MANUAL_INTERVENTION'
          };
        }

      case 'RESTART_BLE_MANAGER':
        return {
          success: true,
          message: 'Reiniciando gerenciador Bluetooth...',
          nextAction: 'RETRY_INITIALIZATION',
          retryAfter: 1000
        };

      case 'WAIT_AND_RETRY':
        return {
          success: true,
          message: 'Aguardando antes de tentar novamente...',
          nextAction: 'RETRY_INITIALIZATION',
          retryAfter: this.calculateRetryDelay(error)
        };

      case 'ENABLE_LIMITED_MODE':
        return {
          success: true,
          message: 'Modo limitado habilitado. Algumas funcionalidades não estarão disponíveis.'
        };

      case 'SHOW_INSTRUCTIONS':
        return {
          success: true,
          message: 'Instruções de recuperação disponíveis.'
        };

      case 'CONTACT_SUPPORT':
        return {
          success: true,
          message: 'Entre em contato com o suporte técnico para assistência.'
        };

      default:
        return {
          success: false,
          message: 'Ação de recuperação não implementada.',
          nextAction: 'MANUAL_INTERVENTION'
        };
    }
  }

  private shouldRetry(error: BluetoothError): boolean {
    const retryCount = error.retryCount || 0;
    const strategy = this.getErrorStrategy(error.code);
    const maxRetries = strategy.maxRetries || this.retryConfig.maxAttempts;
    
    return retryCount < maxRetries && strategy.autoRetry;
  }

  private calculateRetryDelay(error: BluetoothError): number {
    const retryCount = error.retryCount || 0;
    const strategy = this.getErrorStrategy(error.code);
    const baseDelay = strategy.retryInterval || this.retryConfig.baseDelay;
    
    let delay = baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
    
    if (this.retryConfig.jitter) {
      delay += Math.random() * 1000;
    }
    
    delay = Math.min(delay, this.retryConfig.maxDelay);
    
    return Math.floor(delay);
  }

  private getUserMessage(error: BluetoothError, strategy: ErrorHandlingStrategy): string {
    const retryCount = error.retryCount || 0;
    if (retryCount > 0 && strategy.autoRetry) {
      return `${strategy.userMessage} (Tentativa ${retryCount + 1}/${strategy.maxRetries || this.retryConfig.maxAttempts})`;
    }
    return strategy.userMessage;
  }

  private getTechnicalMessage(error: BluetoothError, strategy: ErrorHandlingStrategy): string {
    const details = error.technicalDetails ? ` - ${error.technicalDetails}` : '';
    return `${strategy.technicalMessage}${details}`;
  }

  private buildRecoveryOptions(error: BluetoothError, strategy: ErrorHandlingStrategy): RecoveryOption[] {
    return strategy.recoveryOptions.filter(option => {
      // Filter out retry options if max retries reached
      if (option.action === 'RETRY_INITIALIZATION' && !this.shouldRetry(error)) {
        return false;
      }
      return true;
    }).sort((a, b) => a.priority - b.priority);
  }

  private getDefaultStrategy(): ErrorHandlingStrategy {
    return {
      userMessage: 'Erro desconhecido no Bluetooth',
      technicalMessage: 'Unknown Bluetooth error occurred',
      action: 'RETRY_INITIALIZATION',
      autoRetry: true,
      retryInterval: 2000,
      maxRetries: 1,
      severity: 'MEDIUM',
      category: 'TEMPORARY',
      showInstructions: false,
      recoveryOptions: [
        {
          id: 'retry',
          label: 'Tentar novamente',
          description: 'Tentar a operação novamente',
          action: 'RETRY_INITIALIZATION',
          isAutomatic: true,
          priority: 1
        },
        {
          id: 'contact_support',
          label: 'Contatar suporte',
          description: 'Reportar o problema ao suporte técnico',
          action: 'CONTACT_SUPPORT',
          isAutomatic: false,
          priority: 2
        }
      ]
    };
  }

  private updateErrorMetrics(error: BluetoothError): void {
    const key = error.code;
    const existing = this.errorMetrics.get(key);
    
    if (existing) {
      existing.occurrenceCount++;
      existing.lastOccurrence = error.timestamp;
    } else {
      this.errorMetrics.set(key, {
        errorCode: error.code,
        occurrenceCount: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp,
        recoverySuccessRate: 0,
        averageRecoveryTime: 0,
        userActions: []
      });
    }
  }

  private updateRecoveryMetrics(errorCode: BluetoothErrorCode | BLEErrorCode, success: boolean): void {
    const metrics = this.errorMetrics.get(errorCode);
    if (metrics) {
      // Update recovery success rate (simplified calculation)
      const currentRate = metrics.recoverySuccessRate || 0;
      const totalAttempts = Math.max(metrics.occurrenceCount, 1);
      metrics.recoverySuccessRate = success 
        ? (currentRate * (totalAttempts - 1) + 1) / totalAttempts
        : (currentRate * (totalAttempts - 1)) / totalAttempts;
    }
  }

  private getInstructionTitle(errorCode: BluetoothErrorCode | BLEErrorCode): string {
    const titles: Record<string, string> = {
      'BLUETOOTH_DISABLED': 'Como habilitar o Bluetooth',
      'PERMISSIONS_DENIED': 'Como conceder permissões Bluetooth',
      'PERMISSIONS_NEVER_ASK_AGAIN': 'Como habilitar permissões nas configurações',
      'CONNECTION_FAILED': 'Dicas para melhorar a conexão',
      'BLUETOOTH_NOT_SUPPORTED': 'Dispositivo não compatível'
    };
    return titles[errorCode] || 'Instruções de recuperação';
  }

  private getRecoverySteps(errorCode: BluetoothErrorCode | BLEErrorCode): any[] {
    const steps: Record<string, any[]> = {
      'BLUETOOTH_DISABLED': [
        {
          id: 'step1',
          title: 'Abrir configurações',
          description: 'Vá para Configurações > Bluetooth',
          isAutomatic: false
        },
        {
          id: 'step2',
          title: 'Habilitar Bluetooth',
          description: 'Ative o interruptor do Bluetooth',
          isAutomatic: false
        },
        {
          id: 'step3',
          title: 'Voltar ao app',
          description: 'Retorne ao KMBio para continuar',
          isAutomatic: false
        }
      ],
      'PERMISSIONS_DENIED': [
        {
          id: 'step1',
          title: 'Conceder permissões',
          description: 'Toque em "Permitir" quando solicitado',
          isAutomatic: false
        },
        {
          id: 'step2',
          title: 'Verificar configurações',
          description: 'Se necessário, vá para Configurações do app',
          isAutomatic: false
        }
      ]
    };
    return steps[errorCode] || [];
  }

  private getEstimatedRecoveryTime(errorCode: BluetoothErrorCode | BLEErrorCode): string {
    const times: Record<string, string> = {
      'BLUETOOTH_DISABLED': '30 segundos',
      'PERMISSIONS_DENIED': '1 minuto',
      'PERMISSIONS_NEVER_ASK_AGAIN': '2 minutos',
      'CONNECTION_FAILED': '1-2 minutos'
    };
    return times[errorCode] || '1 minuto';
  }

  private getSuccessIndicators(errorCode: BluetoothErrorCode | BLEErrorCode): string[] {
    const indicators: Record<string, string[]> = {
      'BLUETOOTH_DISABLED': [
        'Ícone do Bluetooth aparece na barra de status',
        'App consegue detectar dispositivos próximos'
      ],
      'PERMISSIONS_DENIED': [
        'App não solicita mais permissões',
        'Funcionalidade de escaneamento disponível'
      ],
      'CONNECTION_FAILED': [
        'Dispositivo aparece na lista de disponíveis',
        'Conexão estabelecida com sucesso'
      ]
    };
    return indicators[errorCode] || ['Erro resolvido', 'Funcionalidade restaurada'];
  }

  // Public methods for metrics and debugging
  getErrorMetrics(): Map<string, ErrorMetrics> {
    return new Map(this.errorMetrics);
  }

  clearErrorMetrics(): void {
    this.errorMetrics.clear();
  }

  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }
}