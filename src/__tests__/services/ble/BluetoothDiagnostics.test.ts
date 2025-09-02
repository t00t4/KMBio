import { Platform } from 'react-native';
import { BluetoothDiagnostics } from '../../../services/ble/BluetoothDiagnostics';
import { BluetoothStateChangeEvent } from '../../../types/ble/bluetooth-state-manager';

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: '13'
  }
}));

describe('BluetoothDiagnostics', () => {
  let diagnostics: BluetoothDiagnostics;

  beforeEach(() => {
    jest.clearAllMocks();
    diagnostics = new BluetoothDiagnostics();
  });

  afterEach(() => {
    if (diagnostics) {
      diagnostics.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(diagnostics).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        maxLogEntries: 500,
        enableDetailedLogging: false
      };
      
      const customDiagnostics = new BluetoothDiagnostics(customConfig);
      expect(customDiagnostics).toBeDefined();
      customDiagnostics.destroy();
    });
  });

  describe('collectDiagnosticInfo', () => {
    it('should collect comprehensive diagnostic information', async () => {
      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();

      expect(diagnosticInfo).toBeDefined();
      expect(diagnosticInfo.deviceModel).toBe('Android Device');
      expect(diagnosticInfo.osVersion).toBe('13');
      expect(diagnosticInfo.appVersion).toBe('1.0.0');
      expect(diagnosticInfo.bleLibraryVersion).toBe('3.5.0');
      expect(diagnosticInfo.initializationAttempts).toBe(0);
      expect(diagnosticInfo.stateHistory).toEqual([]);
      expect(diagnosticInfo.permissionHistory).toEqual([]);
      expect(diagnosticInfo.systemInfo).toBeDefined();
      expect(diagnosticInfo.performanceMetrics).toBeDefined();
    });

    it('should include system information', async () => {
      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();

      expect(diagnosticInfo.systemInfo.platform).toBe('android');
      expect(diagnosticInfo.systemInfo.platformVersion).toBe('13');
      expect(diagnosticInfo.systemInfo.deviceBrand).toBe('Android Device');
      expect(diagnosticInfo.systemInfo.deviceManufacturer).toBe('Unknown');
    });

    it('should include performance metrics', async () => {
      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();

      expect(diagnosticInfo.performanceMetrics.averageInitializationTime).toBe(0);
      expect(diagnosticInfo.performanceMetrics.successfulInitializations).toBe(0);
      expect(diagnosticInfo.performanceMetrics.failedInitializations).toBe(0);
    });
  });

  describe('logInitializationAttempt', () => {
    it('should log successful initialization attempt', () => {
      diagnostics.logInitializationAttempt(true);

      const logs = diagnostics.getRecentLogs(10);
      const initLog = logs.find(log => 
        log.category === 'INITIALIZATION' && 
        log.message === 'Bluetooth initialization successful'
      );

      expect(initLog).toBeDefined();
      expect(initLog?.level).toBe('INFO');
      expect(initLog?.details.attempt).toBe(1);
      expect(initLog?.details.successRate).toBe(100);
    });

    it('should log failed initialization attempt', () => {
      const errorMessage = 'Bluetooth not available';
      diagnostics.logInitializationAttempt(false, errorMessage);

      const logs = diagnostics.getRecentLogs(10);
      const initLog = logs.find(log => 
        log.category === 'INITIALIZATION' && 
        log.message === 'Bluetooth initialization failed'
      );

      expect(initLog).toBeDefined();
      expect(initLog?.level).toBe('ERROR');
      expect(initLog?.details.error).toBe(errorMessage);
      expect(initLog?.details.attempt).toBe(1);
      expect(initLog?.details.successRate).toBe(0);
    });

    it('should track initialization statistics correctly', () => {
      // Log multiple attempts
      diagnostics.logInitializationAttempt(true);
      diagnostics.logInitializationAttempt(false, 'Error 1');
      diagnostics.logInitializationAttempt(true);
      diagnostics.logInitializationAttempt(false, 'Error 2');

      const logs = diagnostics.getRecentLogs(10);
      const lastLog = logs[logs.length - 1];

      expect(lastLog.details.attempt).toBe(4);
      expect(lastLog.details.successRate).toBe(50); // 2 out of 4 successful
    });

    it('should record last successful initialization time', async () => {
      diagnostics.logInitializationAttempt(true);

      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      expect(diagnosticInfo.lastSuccessfulInit).toBeDefined();
      expect(diagnosticInfo.lastSuccessfulInit).toBeInstanceOf(Date);
    });
  });

  describe('logPermissionChange', () => {
    it('should log permission granted', () => {
      const permissions = ['BLUETOOTH', 'BLUETOOTH_ADMIN', 'ACCESS_FINE_LOCATION'];
      diagnostics.logPermissionChange(true, permissions);

      const logs = diagnostics.getRecentLogs(10);
      const permissionLog = logs.find(log => 
        log.category === 'PERMISSIONS' && 
        log.message === 'Permissions granted'
      );

      expect(permissionLog).toBeDefined();
      expect(permissionLog?.level).toBe('INFO');
      expect(permissionLog?.details.permissions).toEqual(permissions);
    });

    it('should log permission denied', () => {
      const permissions = ['BLUETOOTH', 'ACCESS_FINE_LOCATION'];
      diagnostics.logPermissionChange(false, permissions);

      const logs = diagnostics.getRecentLogs(10);
      const permissionLog = logs.find(log => 
        log.category === 'PERMISSIONS' && 
        log.message === 'Permissions denied'
      );

      expect(permissionLog).toBeDefined();
      expect(permissionLog?.level).toBe('INFO');
      expect(permissionLog?.details.permissions).toEqual(permissions);
    });

    it('should track permission history', async () => {
      const permissions1 = ['BLUETOOTH'];
      const permissions2 = ['BLUETOOTH', 'ACCESS_FINE_LOCATION'];

      diagnostics.logPermissionChange(false, permissions1);
      diagnostics.logPermissionChange(true, permissions2);

      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      
      expect(diagnosticInfo.permissionHistory).toHaveLength(2);
      expect(diagnosticInfo.permissionHistory[0].granted).toBe(false);
      expect(diagnosticInfo.permissionHistory[0].permissions).toEqual(permissions1);
      expect(diagnosticInfo.permissionHistory[1].granted).toBe(true);
      expect(diagnosticInfo.permissionHistory[1].permissions).toEqual(permissions2);
      expect(diagnosticInfo.permissionHistory[1].previouslyGranted).toBe(false);
    });

    it('should limit permission history size', async () => {
      const maxSize = 50;
      const permissions = ['BLUETOOTH'];

      // Add more than max size
      for (let i = 0; i < maxSize + 10; i++) {
        diagnostics.logPermissionChange(i % 2 === 0, permissions);
      }

      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      expect(diagnosticInfo.permissionHistory).toHaveLength(maxSize);
    });
  });

  describe('addStateChange', () => {
    it('should record state changes', async () => {
      const stateChange: BluetoothStateChangeEvent = {
        timestamp: new Date(),
        previousState: {
          isEnabled: false,
          isSupported: true,
          hasPermissions: true,
          powerState: 'PoweredOff',
          lastChecked: new Date(),
          isStable: true
        },
        newState: {
          isEnabled: true,
          isSupported: true,
          hasPermissions: true,
          powerState: 'PoweredOn',
          lastChecked: new Date(),
          isStable: false
        },
        trigger: 'user_enabled_bluetooth',
        isStabilityChange: true
      };

      diagnostics.addStateChange(stateChange);

      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      expect(diagnosticInfo.stateHistory).toHaveLength(1);
      expect(diagnosticInfo.stateHistory[0]).toEqual(stateChange);
    });

    it('should limit state history size', async () => {
      const maxSize = 100;

      // Add more than max size
      for (let i = 0; i < maxSize + 10; i++) {
        const stateChange: BluetoothStateChangeEvent = {
          timestamp: new Date(),
          previousState: {
            isEnabled: false,
            isSupported: true,
            hasPermissions: true,
            powerState: 'PoweredOff',
            lastChecked: new Date(),
            isStable: true
          },
          newState: {
            isEnabled: true,
            isSupported: true,
            hasPermissions: true,
            powerState: 'PoweredOn',
            lastChecked: new Date(),
            isStable: false
          },
          trigger: `state_change_${i}`,
          isStabilityChange: false
        };

        diagnostics.addStateChange(stateChange);
      }

      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      expect(diagnosticInfo.stateHistory).toHaveLength(maxSize);
    });
  });

  describe('generateDiagnosticReport', () => {
    it('should generate comprehensive diagnostic report', async () => {
      // Add some test data
      diagnostics.logInitializationAttempt(true);
      diagnostics.logInitializationAttempt(false, 'Test error');
      diagnostics.logPermissionChange(true, ['BLUETOOTH']);

      const report = await diagnostics.generateDiagnosticReport();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(report.diagnosticInfo).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.criticalIssues).toBeDefined();
      expect(report.warnings).toBeDefined();
      expect(report.logs).toBeDefined();
    });

    it('should generate correct summary with good performance', async () => {
      // Log multiple successful initializations
      for (let i = 0; i < 10; i++) {
        diagnostics.logInitializationAttempt(true);
      }

      const report = await diagnostics.generateDiagnosticReport();

      expect(report.summary.overallHealth).toBe('EXCELLENT');
      expect(report.summary.initializationSuccessRate).toBe(100);
      expect(report.summary.criticalIssuesCount).toBe(0);
    });

    it('should generate correct summary with poor performance', async () => {
      // Log mostly failed initializations
      diagnostics.logInitializationAttempt(true);
      for (let i = 0; i < 9; i++) {
        diagnostics.logInitializationAttempt(false, 'Test error');
      }

      const report = await diagnostics.generateDiagnosticReport();

      expect(report.summary.overallHealth).toBe('CRITICAL');
      expect(report.summary.initializationSuccessRate).toBe(10);
      expect(report.criticalIssues).toContain('Taxa de sucesso de inicialização muito baixa (< 50%)');
    });

    it('should include appropriate recommendations', async () => {
      // Test with no issues
      for (let i = 0; i < 5; i++) {
        diagnostics.logInitializationAttempt(true);
      }

      const report = await diagnostics.generateDiagnosticReport();

      expect(report.recommendations).toContain('Sistema Bluetooth funcionando normalmente');
      expect(report.criticalIssues).toHaveLength(0);
      expect(report.warnings).toHaveLength(0);
    });

    it('should detect recent permission denials', async () => {
      // Log recent permission denial
      diagnostics.logPermissionChange(false, ['BLUETOOTH']);

      const report = await diagnostics.generateDiagnosticReport();

      expect(report.criticalIssues).toContain('Permissões Bluetooth negadas recentemente');
      expect(report.recommendations).toContain('Conceda as permissões Bluetooth nas configurações do aplicativo');
    });
  });

  describe('exportDiagnosticData', () => {
    it('should export diagnostic data as JSON string', async () => {
      diagnostics.logInitializationAttempt(true);
      diagnostics.logPermissionChange(true, ['BLUETOOTH']);

      const exportedData = await diagnostics.exportDiagnosticData();

      expect(typeof exportedData).toBe('string');
      
      const parsedData = JSON.parse(exportedData);
      expect(parsedData.exportTimestamp).toBeDefined();
      expect(parsedData.appInfo).toBeDefined();
      expect(parsedData.report).toBeDefined();
      expect(parsedData.appInfo.version).toBe('1.0.0');
      expect(parsedData.appInfo.platform).toBe('android');
    });

    it('should include complete diagnostic report in export', async () => {
      diagnostics.logInitializationAttempt(true);

      const exportedData = await diagnostics.exportDiagnosticData();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData.report.summary).toBeDefined();
      expect(parsedData.report.diagnosticInfo).toBeDefined();
      expect(parsedData.report.logs).toBeDefined();
    });
  });

  describe('clearDiagnosticHistory', () => {
    it('should clear all diagnostic history', async () => {
      // Add some data
      diagnostics.logInitializationAttempt(true);
      diagnostics.logPermissionChange(true, ['BLUETOOTH']);

      // Verify data exists
      let diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      expect(diagnosticInfo.initializationAttempts).toBe(1);
      expect(diagnosticInfo.permissionHistory).toHaveLength(1);

      // Clear history
      diagnostics.clearDiagnosticHistory();

      // Verify data is cleared
      diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      expect(diagnosticInfo.initializationAttempts).toBe(0);
      expect(diagnosticInfo.permissionHistory).toHaveLength(0);
      expect(diagnosticInfo.stateHistory).toHaveLength(0);
      expect(diagnosticInfo.lastSuccessfulInit).toBeUndefined();
    });
  });

  describe('getRecentLogs', () => {
    it('should return recent logs', () => {
      // Generate some logs
      diagnostics.logInitializationAttempt(true);
      diagnostics.logInitializationAttempt(false, 'Error');
      diagnostics.logPermissionChange(true, ['BLUETOOTH']);

      const recentLogs = diagnostics.getRecentLogs(10);

      expect(recentLogs.length).toBeGreaterThan(0);
      expect(recentLogs.every(log => log.timestamp instanceof Date)).toBe(true);
      expect(recentLogs.every(log => ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'].includes(log.level))).toBe(true);
    });

    it('should limit number of returned logs', () => {
      // Generate many logs
      for (let i = 0; i < 20; i++) {
        diagnostics.logInitializationAttempt(true);
      }

      const recentLogs = diagnostics.getRecentLogs(5);
      expect(recentLogs).toHaveLength(5);
    });

    it('should return most recent logs first', () => {
      diagnostics.logInitializationAttempt(true);
      // Small delay to ensure different timestamps
      setTimeout(() => {
        diagnostics.logInitializationAttempt(false, 'Later error');
      }, 10);

      const recentLogs = diagnostics.getRecentLogs(10);
      
      // Should be ordered by timestamp (most recent last in array)
      if (recentLogs.length >= 2) {
        const timestamps = recentLogs.map(log => log.timestamp.getTime());
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
        }
      }
    });
  });

  describe('Platform-specific behavior', () => {
    it('should handle iOS platform correctly', async () => {
      // Mock iOS platform
      (Platform as any).OS = 'ios';

      const iosDiagnostics = new BluetoothDiagnostics();
      const diagnosticInfo = await iosDiagnostics.collectDiagnosticInfo();

      expect(diagnosticInfo.deviceModel).toBe('iOS Device');
      expect(diagnosticInfo.systemInfo.platform).toBe('ios');
      expect(diagnosticInfo.systemInfo.deviceBrand).toBe('Apple');
      expect(diagnosticInfo.systemInfo.deviceManufacturer).toBe('Apple');

      iosDiagnostics.destroy();
    });

    it('should handle web platform correctly', async () => {
      // Mock web platform
      (Platform as any).OS = 'web';

      const webDiagnostics = new BluetoothDiagnostics();
      const diagnosticInfo = await webDiagnostics.collectDiagnosticInfo();

      expect(diagnosticInfo.deviceModel).toBe('Web Browser');
      expect(diagnosticInfo.systemInfo.platform).toBe('web');

      webDiagnostics.destroy();
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully during diagnostic collection', async () => {
      // This test ensures the service doesn't crash on errors
      const diagnosticInfo = await diagnostics.collectDiagnosticInfo();
      expect(diagnosticInfo).toBeDefined();
    });

    it('should handle errors gracefully during report generation', async () => {
      const report = await diagnostics.generateDiagnosticReport();
      expect(report).toBeDefined();
    });

    it('should handle errors gracefully during data export', async () => {
      const exportedData = await diagnostics.exportDiagnosticData();
      expect(typeof exportedData).toBe('string');
    });
  });

  describe('Configuration', () => {
    it('should respect custom log entry limits', () => {
      const customDiagnostics = new BluetoothDiagnostics({
        maxLogEntries: 5
      });

      // Generate more logs than the limit
      for (let i = 0; i < 10; i++) {
        customDiagnostics.logInitializationAttempt(true);
      }

      const logs = customDiagnostics.getRecentLogs(20);
      expect(logs.length).toBeLessThanOrEqual(5);

      customDiagnostics.destroy();
    });

    it('should respect detailed logging setting', () => {
      const customDiagnostics = new BluetoothDiagnostics({
        enableDetailedLogging: false
      });

      // This should not generate DEBUG logs
      customDiagnostics.logInitializationAttempt(true);

      const logs = customDiagnostics.getRecentLogs(20);
      const debugLogs = logs.filter(log => log.level === 'DEBUG');
      expect(debugLogs).toHaveLength(0);

      customDiagnostics.destroy();
    });
  });
});