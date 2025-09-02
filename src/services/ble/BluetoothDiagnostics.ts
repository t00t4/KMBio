import { Platform } from 'react-native';
import {
  BluetoothDiagnostics as IBluetoothDiagnostics,
  BluetoothDiagnosticInfo,
  BluetoothDiagnosticReport,
  BluetoothDiagnosticConfig,
  DiagnosticLogEntry,
  DiagnosticSummary,
  PermissionChange,
  SystemInfo,
  PerformanceMetrics
} from '../../types/ble/bluetooth-diagnostics';
import { BluetoothStateChangeEvent } from '../../types/ble/bluetooth-state-manager';

export class BluetoothDiagnostics implements IBluetoothDiagnostics {
  private logs: DiagnosticLogEntry[] = [];
  private permissionHistory: PermissionChange[] = [];
  private initializationAttempts = 0;
  private successfulInitializations = 0;
  private failedInitializations = 0;
  private lastSuccessfulInit?: Date;
  private initializationTimes: number[] = [];
  private stateHistory: BluetoothStateChangeEvent[] = [];
  
  private readonly config: BluetoothDiagnosticConfig = {
    maxLogEntries: 1000,
    maxStateHistorySize: 100,
    maxPermissionHistorySize: 50,
    enablePerformanceTracking: true,
    enableDetailedLogging: true,
    logRetentionDays: 7
  };

  constructor(config?: Partial<BluetoothDiagnosticConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.log('INFO', 'SYSTEM', 'BluetoothDiagnostics initialized');
    
    // Clean up old logs on initialization
    this.cleanupOldLogs();
  }

  async collectDiagnosticInfo(): Promise<BluetoothDiagnosticInfo> {
    this.log('DEBUG', 'SYSTEM', 'Collecting diagnostic information');

    try {
      const systemInfo = await this.getSystemInfo();
      const performanceMetrics = this.getPerformanceMetrics();

      const diagnosticInfo: BluetoothDiagnosticInfo = {
        deviceModel: this.getDeviceModel(),
        osVersion: this.getOSVersion(),
        appVersion: this.getAppVersion(),
        bleLibraryVersion: this.getBleLibraryVersion(),
        initializationAttempts: this.initializationAttempts,
        lastSuccessfulInit: this.lastSuccessfulInit,
        stateHistory: [...this.stateHistory],
        permissionHistory: [...this.permissionHistory],
        systemInfo,
        performanceMetrics
      };

      this.log('INFO', 'SYSTEM', 'Diagnostic information collected successfully');
      return diagnosticInfo;

    } catch (error) {
      this.log('ERROR', 'SYSTEM', 'Failed to collect diagnostic information', { error });
      throw new Error(`Failed to collect diagnostic info: ${error}`);
    }
  }

  logInitializationAttempt(success: boolean, error?: string): void {
    const startTime = Date.now();
    this.initializationAttempts++;

    if (success) {
      this.successfulInitializations++;
      this.lastSuccessfulInit = new Date();
      
      // Record initialization time if performance tracking is enabled
      if (this.config.enablePerformanceTracking) {
        const initTime = Date.now() - startTime;
        this.initializationTimes.push(initTime);
        
        // Keep only recent initialization times
        if (this.initializationTimes.length > 50) {
          this.initializationTimes = this.initializationTimes.slice(-50);
        }
      }

      this.log('INFO', 'INITIALIZATION', 'Bluetooth initialization successful', {
        attempt: this.initializationAttempts,
        successRate: this.getSuccessRate()
      });
    } else {
      this.failedInitializations++;
      this.log('ERROR', 'INITIALIZATION', 'Bluetooth initialization failed', {
        error,
        attempt: this.initializationAttempts,
        successRate: this.getSuccessRate()
      });
    }
  }

  logPermissionChange(granted: boolean, permissions: string[]): void {
    const previousPermission = this.permissionHistory[this.permissionHistory.length - 1];
    
    const permissionChange: PermissionChange = {
      timestamp: new Date(),
      granted,
      permissions: [...permissions],
      trigger: 'permission_request',
      previouslyGranted: previousPermission?.granted
    };

    this.permissionHistory.push(permissionChange);

    // Limit permission history size
    if (this.permissionHistory.length > this.config.maxPermissionHistorySize) {
      this.permissionHistory = this.permissionHistory.slice(-this.config.maxPermissionHistorySize);
    }

    this.log('INFO', 'PERMISSIONS', `Permissions ${granted ? 'granted' : 'denied'}`, {
      permissions,
      previouslyGranted: previousPermission?.granted,
      totalPermissionChanges: this.permissionHistory.length
    });
  }

  async generateDiagnosticReport(): Promise<BluetoothDiagnosticReport> {
    this.log('INFO', 'SYSTEM', 'Generating diagnostic report');

    try {
      const diagnosticInfo = await this.collectDiagnosticInfo();
      const summary = this.generateSummary();
      const { recommendations, criticalIssues, warnings } = this.analyzeIssues(diagnosticInfo);

      const report: BluetoothDiagnosticReport = {
        timestamp: new Date(),
        summary,
        diagnosticInfo,
        recommendations,
        criticalIssues,
        warnings,
        logs: this.getRecentLogs(100) // Include last 100 log entries
      };

      this.log('INFO', 'SYSTEM', 'Diagnostic report generated successfully', {
        criticalIssues: criticalIssues.length,
        warnings: warnings.length,
        recommendations: recommendations.length
      });

      return report;

    } catch (error) {
      this.log('ERROR', 'SYSTEM', 'Failed to generate diagnostic report', { error });
      throw new Error(`Failed to generate diagnostic report: ${error}`);
    }
  }

  clearDiagnosticHistory(): void {
    this.logs = [];
    this.permissionHistory = [];
    this.stateHistory = [];
    this.initializationAttempts = 0;
    this.successfulInitializations = 0;
    this.failedInitializations = 0;
    this.lastSuccessfulInit = undefined;
    this.initializationTimes = [];

    this.log('INFO', 'SYSTEM', 'Diagnostic history cleared');
  }

  async exportDiagnosticData(): Promise<string> {
    this.log('INFO', 'SYSTEM', 'Exporting diagnostic data');

    try {
      const report = await this.generateDiagnosticReport();
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        appInfo: {
          version: report.diagnosticInfo.appVersion,
          platform: report.diagnosticInfo.systemInfo.platform,
          device: report.diagnosticInfo.deviceModel
        },
        report
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      
      this.log('INFO', 'SYSTEM', 'Diagnostic data exported successfully', {
        dataSize: jsonData.length,
        logEntries: report.logs.length
      });

      return jsonData;

    } catch (error) {
      this.log('ERROR', 'SYSTEM', 'Failed to export diagnostic data', { error });
      throw new Error(`Failed to export diagnostic data: ${error}`);
    }
  }

  // Public method to add state history (called by BluetoothStateManager)
  addStateChange(stateChange: BluetoothStateChangeEvent): void {
    this.stateHistory.push(stateChange);

    // Limit state history size
    if (this.stateHistory.length > this.config.maxStateHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.config.maxStateHistorySize);
    }

    this.log('DEBUG', 'STATE_CHANGE', 'Bluetooth state change recorded', {
      trigger: stateChange.trigger,
      isStabilityChange: stateChange.isStabilityChange,
      totalStateChanges: this.stateHistory.length
    });
  }

  // Public method to get recent logs for debugging
  getRecentLogs(count: number = 50): DiagnosticLogEntry[] {
    return this.logs.slice(-count);
  }

  // Private helper methods

  private async getSystemInfo(): Promise<SystemInfo> {
    try {
      const systemInfo: SystemInfo = {
        platform: Platform.OS as 'ios' | 'android' | 'web',
        platformVersion: Platform.Version.toString(),
      };

      // Add basic device information
      try {
        // For now, we'll use basic platform information
        // In a real implementation, you might want to add react-native-device-info
        systemInfo.deviceBrand = Platform.OS === 'ios' ? 'Apple' : 'Android Device';
        systemInfo.deviceManufacturer = Platform.OS === 'ios' ? 'Apple' : 'Unknown';
        systemInfo.isEmulator = false; // Would need device-info library to detect this
        
        // Memory information would require additional libraries
        if (Platform.OS !== 'web') {
          // These would be available with react-native-device-info
          systemInfo.totalMemory = undefined;
          systemInfo.freeMemory = undefined;
          systemInfo.batteryLevel = undefined;
        }
      } catch (error) {
        this.log('WARN', 'SYSTEM', 'Some system info unavailable', { error });
      }

      return systemInfo;
    } catch (error) {
      this.log('ERROR', 'SYSTEM', 'Failed to get system info', { error });
      return {
        platform: Platform.OS as 'ios' | 'android' | 'web',
        platformVersion: Platform.Version.toString()
      };
    }
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const averageInitTime = this.initializationTimes.length > 0
      ? this.initializationTimes.reduce((sum, time) => sum + time, 0) / this.initializationTimes.length
      : 0;

    return {
      averageInitializationTime: averageInitTime,
      successfulInitializations: this.successfulInitializations,
      failedInitializations: this.failedInitializations,
      lastInitializationTime: this.initializationTimes[this.initializationTimes.length - 1]
    };
  }

  private getDeviceModel(): string {
    // Basic device model detection
    if (Platform.OS === 'ios') {
      return 'iOS Device';
    } else if (Platform.OS === 'android') {
      return 'Android Device';
    } else {
      return 'Web Browser';
    }
  }

  private getOSVersion(): string {
    return Platform.Version.toString();
  }

  private getAppVersion(): string {
    // This would typically come from app.json or package.json
    return '1.0.0'; // From package.json
  }

  private getBleLibraryVersion(): string {
    // This would typically come from package.json or the library itself
    return '3.5.0'; // react-native-ble-plx version from package.json
  }

  private getSuccessRate(): number {
    if (this.initializationAttempts === 0) return 0;
    return (this.successfulInitializations / this.initializationAttempts) * 100;
  }

  private generateSummary(): DiagnosticSummary {
    const successRate = this.getSuccessRate();
    const averageInitTime = this.getPerformanceMetrics().averageInitializationTime;
    
    // Determine overall health based on success rate and other factors
    let overallHealth: DiagnosticSummary['overallHealth'] = 'EXCELLENT';
    
    if (successRate < 50) {
      overallHealth = 'CRITICAL';
    } else if (successRate < 70) {
      overallHealth = 'POOR';
    } else if (successRate < 85) {
      overallHealth = 'FAIR';
    } else if (successRate < 95) {
      overallHealth = 'GOOD';
    }

    // Count issues from logs
    const errorLogs = this.logs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL');
    const criticalLogs = this.logs.filter(log => log.level === 'CRITICAL');

    return {
      overallHealth,
      initializationSuccessRate: successRate,
      averageInitTime,
      lastSuccessfulConnection: this.lastSuccessfulInit,
      totalIssuesFound: errorLogs.length,
      criticalIssuesCount: criticalLogs.length
    };
  }

  private analyzeIssues(diagnosticInfo: BluetoothDiagnosticInfo): {
    recommendations: string[];
    criticalIssues: string[];
    warnings: string[];
  } {
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    // Analyze success rate
    const successRate = this.getSuccessRate();
    if (successRate < 50) {
      criticalIssues.push('Taxa de sucesso de inicialização muito baixa (< 50%)');
      recommendations.push('Verifique as permissões Bluetooth e reinicie o aplicativo');
    } else if (successRate < 85) {
      warnings.push('Taxa de sucesso de inicialização abaixo do ideal');
      recommendations.push('Considere reinicializar o Bluetooth nas configurações');
    }

    // Analyze initialization attempts
    if (this.initializationAttempts > 10 && successRate < 70) {
      warnings.push('Muitas tentativas de inicialização com baixo sucesso');
      recommendations.push('Reinicie o dispositivo para limpar o estado do Bluetooth');
    }

    // Analyze permission history
    const recentPermissionDenials = this.permissionHistory
      .filter(p => !p.granted && this.isRecent(p.timestamp, 5 * 60 * 1000)) // Last 5 minutes
      .length;
    
    if (recentPermissionDenials > 0) {
      criticalIssues.push('Permissões Bluetooth negadas recentemente');
      recommendations.push('Conceda as permissões Bluetooth nas configurações do aplicativo');
    }

    // Analyze state changes
    const recentStateChanges = this.stateHistory
      .filter(s => this.isRecent(s.timestamp, 2 * 60 * 1000)) // Last 2 minutes
      .length;
    
    if (recentStateChanges > 5) {
      warnings.push('Estado do Bluetooth instável (muitas mudanças recentes)');
      recommendations.push('Aguarde alguns segundos para o Bluetooth estabilizar');
    }

    // Analyze system info
    if (diagnosticInfo.systemInfo.isEmulator) {
      warnings.push('Executando em emulador - funcionalidade Bluetooth limitada');
      recommendations.push('Teste em dispositivo físico para funcionalidade completa');
    }

    // Add general recommendations if no specific issues found
    if (criticalIssues.length === 0 && warnings.length === 0) {
      recommendations.push('Sistema Bluetooth funcionando normalmente');
    }

    return { recommendations, criticalIssues, warnings };
  }

  private isRecent(timestamp: Date, maxAgeMs: number): boolean {
    return Date.now() - timestamp.getTime() < maxAgeMs;
  }

  private log(
    level: DiagnosticLogEntry['level'],
    category: DiagnosticLogEntry['category'],
    message: string,
    details?: any,
    stackTrace?: string
  ): void {
    if (!this.config.enableDetailedLogging && level === 'DEBUG') {
      return;
    }

    const logEntry: DiagnosticLogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      stackTrace
    };

    this.logs.push(logEntry);

    // Limit log size
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }

    // Also log to console for development
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const logMessage = `[BluetoothDiagnostics][${level}][${category}] ${message}`;
      
      switch (level) {
        case 'DEBUG':
          console.debug(logMessage, details);
          break;
        case 'INFO':
          console.info(logMessage, details);
          break;
        case 'WARN':
          console.warn(logMessage, details);
          break;
        case 'ERROR':
        case 'CRITICAL':
          console.error(logMessage, details);
          break;
      }
    }
  }

  private cleanupOldLogs(): void {
    if (this.config.logRetentionDays <= 0) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);

    const initialLogCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);

    if (this.logs.length < initialLogCount) {
      this.log('INFO', 'SYSTEM', `Cleaned up ${initialLogCount - this.logs.length} old log entries`);
    }
  }

  // Cleanup method
  destroy(): void {
    this.log('INFO', 'SYSTEM', 'BluetoothDiagnostics destroyed');
    this.clearDiagnosticHistory();
  }
}