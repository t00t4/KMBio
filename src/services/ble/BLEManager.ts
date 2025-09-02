import { BleManager, State, BleError } from 'react-native-ble-plx';
import { 
  BLEDevice, 
  BLEConnectionState, 
  BLEError as AppBLEError, 
  BLEErrorCode,
  BLEConfiguration,
  BLEServiceInterface,
  BluetoothInitializationResult,
  BluetoothInitializationStatus
} from '../../types/ble';
import { PermissionsManager } from '../../utils/permissions';
import { BluetoothInitializer } from './BluetoothInitializer';

// For development mode detection
declare const __DEV__: boolean;

export class BLEManager implements BLEServiceInterface {
  private bleManager: BleManager | null = null;
  private bluetoothInitializer: BluetoothInitializer;
  private connectionState: BLEConnectionState;
  private config: BLEConfiguration;
  private reconnectTimer?: NodeJS.Timeout;
  private dataCollectionInterval?: NodeJS.Timeout;
  private connectionStateCallbacks: ((state: BLEConnectionState) => void)[] = [];
  private dataReceivedCallbacks: ((data: any) => void)[] = [];
  private errorCallbacks: ((error: AppBLEError) => void)[] = [];
  private initializationResult: BluetoothInitializationResult | null = null;

  constructor(config?: Partial<BLEConfiguration>) {
    this.bluetoothInitializer = new BluetoothInitializer();
    this.config = {
      scanTimeoutMs: 10000,
      connectionTimeoutMs: 5000,
      maxReconnectAttempts: 3,
      reconnectDelayMs: [1000, 3000, 10000],
      enableAutoReconnect: true,
      ...config
    };

    this.connectionState = {
      isScanning: false,
      isConnecting: false,
      isConnected: false,
      availableDevices: [],
      connectionAttempts: 0,
      initializationStatus: 'NOT_STARTED'
    };

    // Set up initialization callback
    this.bluetoothInitializer.onInitializationComplete((result) => {
      this.handleInitializationComplete(result);
    });

    // Start initialization automatically
    this.initializeBLE();
  }

  private async initializeBLE(): Promise<void> {
    try {
      this.connectionState.initializationStatus = 'IN_PROGRESS';
      this.emitConnectionStateChange();

      // Use BluetoothInitializer for robust initialization
      const result = await this.bluetoothInitializer.initialize();
      
      if (!result.success) {
        // Handle initialization failure
        this.connectionState.initializationStatus = 'COMPLETED_ERROR';
        this.emitConnectionStateChange();
        
        if (result.error) {
          this.emitError({
            code: this.mapInitializationErrorCode(result.error.code),
            message: result.error.message,
            timestamp: new Date(),
            context: result.error
          });
        }
        return;
      }

      // Initialization successful - create BLE Manager
      this.bleManager = new BleManager();
      
      // Monitor Bluetooth state changes
      this.bleManager.onStateChange((state) => {
        this.handleBluetoothStateChange(state);
      }, true);

      // Check initial Bluetooth state
      const state = await this.bleManager.state();
      this.handleBluetoothStateChange(state);

      this.connectionState.initializationStatus = 'COMPLETED_SUCCESS';
      this.emitConnectionStateChange();

    } catch (error) {
      this.connectionState.initializationStatus = 'COMPLETED_ERROR';
      this.emitConnectionStateChange();
      
      this.emitError({
        code: 'UNKNOWN_ERROR',
        message: `BLE initialization failed: ${error}`,
        timestamp: new Date()
      });
    }
  }

  private handleBluetoothStateChange(state: State): void {
    switch (state) {
      case 'PoweredOn':
        // Bluetooth is ready
        break;
      case 'PoweredOff':
        this.emitError({
          code: 'BLUETOOTH_DISABLED',
          message: 'Bluetooth está desligado. Por favor, ligue o Bluetooth.',
          timestamp: new Date()
        });
        break;
      case 'Unauthorized':
        this.emitError({
          code: 'PERMISSION_DENIED',
          message: 'Permissões Bluetooth não concedidas.',
          timestamp: new Date()
        });
        break;
      case 'Unsupported':
        this.emitError({
          code: 'UNKNOWN_ERROR',
          message: 'Bluetooth não é suportado neste dispositivo.',
          timestamp: new Date()
        });
        break;
    }
  }

  async scanForDevices(timeoutMs?: number): Promise<BLEDevice[]> {
    const timeout = timeoutMs || this.config.scanTimeoutMs;
    
    try {
      // Ensure Bluetooth is initialized
      await this.ensureInitialized();
      
      if (!this.bleManager) {
        throw new Error('BLE Manager não inicializado');
      }

      // Check Bluetooth state
      const state = await this.bleManager.state();
      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth não está ligado');
      }

      this.connectionState.isScanning = true;
      this.connectionState.availableDevices = [];
      this.emitConnectionStateChange();

      const devices: BLEDevice[] = [];
      const deviceIds = new Set<string>();

      // Start scanning
      this.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          this.handleScanError(error);
          return;
        }

        if (device && !deviceIds.has(device.id)) {
          deviceIds.add(device.id);
          
          // Filter for ELM327 devices or devices with relevant names
          const deviceName = device.name || device.localName || '';
          const isELM327 = this.isELM327Device(deviceName);
          
          if (isELM327 || deviceName.length > 0) {
            const bleDevice: BLEDevice = {
              id: device.id,
              name: device.name,
              rssi: device.rssi || -100,
              isConnectable: device.isConnectable || false,
              serviceUUIDs: device.serviceUUIDs || [],
              manufacturerData: device.manufacturerData || undefined,
              localName: device.localName || undefined
            };

            devices.push(bleDevice);
            this.connectionState.availableDevices = [...devices];
            this.emitConnectionStateChange();
          }
        }
      });

      // Stop scanning after timeout
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.bleManager?.stopDeviceScan();
          this.connectionState.isScanning = false;
          this.emitConnectionStateChange();
          
          if (devices.length === 0) {
            reject(new Error('Nenhum dispositivo ELM327 encontrado'));
          } else {
            resolve(devices);
          }
        }, timeout);
        
        // Store timeout ID for potential cleanup
        this.reconnectTimer = timeoutId;
      });

    } catch (error) {
      this.connectionState.isScanning = false;
      this.emitConnectionStateChange();
      
      this.emitError({
        code: 'UNKNOWN_ERROR',
        message: `Erro ao escanear dispositivos: ${error}`,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  async connectToDevice(deviceId: string): Promise<void> {
    try {
      // Ensure Bluetooth is initialized
      await this.ensureInitialized();
      
      if (!this.bleManager) {
        throw new Error('BLE Manager não inicializado');
      }

      this.connectionState.isConnecting = true;
      this.connectionState.connectionAttempts++;
      this.emitConnectionStateChange();

      // Connect to device with timeout
      const device = await this.bleManager.connectToDevice(deviceId, {
        timeout: this.config.connectionTimeoutMs
      });

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();

      // Update connection state
      this.connectionState.isConnecting = false;
      this.connectionState.isConnected = true;
      this.connectionState.connectedDevice = {
        id: device.id,
        name: device.name,
        rssi: device.rssi || -100,
        isConnectable: true
      };
      this.connectionState.lastConnectionTime = new Date();
      this.connectionState.connectionAttempts = 0;

      // Monitor disconnection
      device.onDisconnected((error) => {
        this.handleDisconnection(error || undefined);
      });

      this.emitConnectionStateChange();

    } catch (error) {
      this.connectionState.isConnecting = false;
      this.connectionState.isConnected = false;
      this.emitConnectionStateChange();

      const bleError: AppBLEError = {
        code: 'CONNECTION_FAILED',
        message: `Falha ao conectar: ${error}`,
        timestamp: new Date(),
        deviceId
      };

      this.emitError(bleError);

      // Try auto-reconnect if enabled
      if (this.config.enableAutoReconnect && 
          this.connectionState.connectionAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect(deviceId);
      }

      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connectionState.connectedDevice && this.bleManager) {
        await this.bleManager.cancelDeviceConnection(this.connectionState.connectedDevice.id);
      }
      
      this.stopDataCollection();
      this.clearReconnectTimer();
      
      this.connectionState.isConnected = false;
      this.connectionState.connectedDevice = undefined;
      this.emitConnectionStateChange();

    } catch (error) {
      this.emitError({
        code: 'UNKNOWN_ERROR',
        message: `Erro ao desconectar: ${error}`,
        timestamp: new Date()
      });
    }
  }

  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  getConnectionState(): BLEConnectionState {
    return { ...this.connectionState };
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connectionState.isConnected || !this.connectionState.connectedDevice) {
      throw new Error('Dispositivo não conectado');
    }

    if (!this.bleManager) {
      throw new Error('BLE Manager não inicializado');
    }

    try {
      // ELM327 typically uses Serial Port Profile (SPP) over BLE
      // Common service UUID for ELM327 devices
      const serviceUUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
      const characteristicUUID = '0000FFE1-0000-1000-8000-00805F9B34FB';

      // Get the connected device
      const device = await this.bleManager.connectToDevice(this.connectionState.connectedDevice.id);
      
      // Find the service and characteristic
      const services = await device.services();
      let targetService = services.find(s => s.uuid.toUpperCase() === serviceUUID.toUpperCase());
      
      if (!targetService) {
        // Try alternative common UUIDs
        const alternativeUUIDs = [
          '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', // Nordic UART Service
          '0000180F-0000-1000-8000-00805F9B34FB'  // Battery Service (sometimes used)
        ];
        
        for (const uuid of alternativeUUIDs) {
          targetService = services.find(s => s.uuid.toUpperCase() === uuid.toUpperCase());
          if (targetService) break;
        }
      }

      if (!targetService) {
        // For development/testing, return a mock response
        if (__DEV__) {
          return this.getMockOBDResponse(command);
        }
        throw new Error('Serviço de comunicação não encontrado no dispositivo');
      }

      const characteristics = await targetService.characteristics();
      let writeCharacteristic = characteristics.find(c => 
        c.uuid.toUpperCase() === characteristicUUID.toUpperCase() ||
        c.isWritableWithoutResponse || 
        c.isWritableWithResponse
      );

      if (!writeCharacteristic) {
        if (__DEV__) {
          return this.getMockOBDResponse(command);
        }
        throw new Error('Característica de escrita não encontrada');
      }

      // Convert command to base64
      const commandBuffer = Buffer.from(command, 'utf8');
      const base64Command = commandBuffer.toString('base64');

      // Write command
      await writeCharacteristic.writeWithResponse(base64Command);

      // Read response (simplified - in real implementation you'd set up notifications)
      // For now, return a mock response in development
      if (__DEV__) {
        return this.getMockOBDResponse(command);
      }

      // In production, you would set up notifications to receive the response
      return 'OK'; // Placeholder
      
    } catch (error) {
      this.emitError({
        code: 'WRITE_FAILED',
        message: `Falha ao enviar comando: ${error}`,
        timestamp: new Date(),
        deviceId: this.connectionState.connectedDevice.id
      });
      throw error;
    }
  }

  private getMockOBDResponse(command: string): string {
    // Mock responses for development and testing
    const mockResponses: Record<string, string> = {
      'ATZ\r': 'ELM327 v1.5',
      'ATE0\r': 'OK',
      'ATL0\r': 'OK',
      'ATS0\r': 'OK',
      'ATH1\r': 'OK',
      'ATSP0\r': 'OK',
      '0100\r': '41 00 BE 3E B8 11',
      '010C\r': '41 0C 1A F8', // RPM: 1726
      '010D\r': '41 0D 4B',    // Speed: 75 km/h
      '0105\r': '41 05 5F',    // Coolant temp: 55°C
      'ATDPN\r': 'A6'
    };

    return mockResponses[command] || 'NO DATA';
  }

  startDataCollection(frequency: number): void {
    if (this.dataCollectionInterval) {
      this.stopDataCollection();
    }

    const intervalMs = 1000 / frequency; // Convert Hz to milliseconds

    this.dataCollectionInterval = setInterval(async () => {
      if (this.connectionState.isConnected) {
        try {
          // TODO: Implement actual data collection
          // This would involve reading from BLE characteristics
          const mockData = {
            timestamp: new Date(),
            rpm: Math.random() * 3000 + 800,
            speed: Math.random() * 120
          };
          
          this.dataReceivedCallbacks.forEach(callback => callback(mockData));
        } catch (error) {
          this.emitError({
            code: 'READ_FAILED',
            message: `Erro na coleta de dados: ${error}`,
            timestamp: new Date()
          });
        }
      }
    }, intervalMs);
  }

  stopDataCollection(): void {
    if (this.dataCollectionInterval) {
      clearInterval(this.dataCollectionInterval);
      this.dataCollectionInterval = undefined;
    }
  }

  onConnectionStateChange(callback: (state: BLEConnectionState) => void): void {
    this.connectionStateCallbacks.push(callback);
  }

  onDataReceived(callback: (data: unknown) => void): void {
    this.dataReceivedCallbacks.push(callback);
  }

  onError(callback: (error: AppBLEError) => void): void {
    this.errorCallbacks.push(callback);
  }

  // Private helper methods

  private isELM327Device(deviceName: string): boolean {
    const elm327Patterns = [
      /elm327/i,
      /obd/i,
      /obdii/i,
      /obd-ii/i,
      /v\d+\.\d+/i, // Version patterns like v1.5, v2.1
      /bluetooth.*obd/i
    ];

    return elm327Patterns.some(pattern => pattern.test(deviceName));
  }

  private handleScanError(error: BleError): void {
    this.connectionState.isScanning = false;
    this.emitConnectionStateChange();

    let errorCode: BLEErrorCode = 'UNKNOWN_ERROR';
    
    if (error.errorCode === 102) { // BleErrorCode.BluetoothPoweredOff
      errorCode = 'BLUETOOTH_DISABLED';
    } else if (error.errorCode === 600) { // BleErrorCode.BluetoothUnauthorized
      errorCode = 'PERMISSION_DENIED';
    }

    this.emitError({
      code: errorCode,
      message: `Erro no scan: ${error.message}`,
      timestamp: new Date()
    });
  }

  private handleDisconnection(error?: BleError): void {
    this.connectionState.isConnected = false;
    this.connectionState.connectedDevice = undefined;
    this.stopDataCollection();
    this.emitConnectionStateChange();

    if (error) {
      this.emitError({
        code: 'CONNECTION_LOST',
        message: `Conexão perdida: ${error.message}`,
        timestamp: new Date()
      });

      // Try auto-reconnect if enabled
      if (this.config.enableAutoReconnect && 
          this.connectionState.connectionAttempts < this.config.maxReconnectAttempts) {
        // Get the device ID from the available devices or last connected device
        const lastConnectedDevice = this.connectionState.availableDevices.find(
          device => device.id === this.connectionState.connectedDevice?.id
        );
        if (lastConnectedDevice) {
          this.scheduleReconnect(lastConnectedDevice.id);
        }
      }
    }
  }

  private scheduleReconnect(deviceId: string): void {
    const attempt = this.connectionState.connectionAttempts;
    const delay = this.config.reconnectDelayMs[Math.min(attempt, this.config.reconnectDelayMs.length - 1)];

    this.reconnectTimer = setTimeout(() => {
      this.connectToDevice(deviceId).catch(() => {
        // Reconnection failed, will be handled by connectToDevice
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private emitConnectionStateChange(): void {
    this.connectionStateCallbacks.forEach(callback => {
      callback({ ...this.connectionState });
    });
  }

  private emitError(error: AppBLEError): void {
    this.connectionState.lastError = error;
    this.errorCallbacks.forEach(callback => callback(error));
  }

  // New methods for initialization handling

  private async ensureInitialized(): Promise<void> {
    const status = this.bluetoothInitializer.getInitializationStatus();
    
    if (status === 'NOT_STARTED' || status === 'COMPLETED_ERROR') {
      await this.initializeBLE();
    } else if (status === 'IN_PROGRESS' || status === 'RETRYING') {
      // Wait for initialization to complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Initialization timeout'));
        }, 15000);

        const checkStatus = () => {
          const currentStatus = this.bluetoothInitializer.getInitializationStatus();
          if (currentStatus === 'COMPLETED_SUCCESS') {
            clearTimeout(timeout);
            resolve();
          } else if (currentStatus === 'COMPLETED_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Initialization failed'));
          } else {
            setTimeout(checkStatus, 500);
          }
        };

        checkStatus();
      });
    }
  }

  private handleInitializationComplete(result: BluetoothInitializationResult): void {
    this.initializationResult = result;
    
    if (result.success) {
      this.connectionState.initializationStatus = 'COMPLETED_SUCCESS';
    } else {
      this.connectionState.initializationStatus = 'COMPLETED_ERROR';
      
      if (result.error) {
        this.emitError({
          code: this.mapInitializationErrorCode(result.error.code),
          message: result.error.message,
          timestamp: new Date(),
          context: result.error
        });
      }
    }
    
    this.emitConnectionStateChange();
  }

  private mapInitializationErrorCode(initCode: string): BLEErrorCode {
    switch (initCode) {
      case 'BLUETOOTH_DISABLED':
        return 'BLUETOOTH_DISABLED';
      case 'PERMISSIONS_DENIED':
      case 'PERMISSIONS_NEVER_ASK_AGAIN':
        return 'PERMISSION_DENIED';
      case 'BLUETOOTH_NOT_SUPPORTED':
      case 'BLE_MANAGER_INIT_FAILED':
      case 'STATE_MONITORING_FAILED':
      case 'TIMEOUT_ERROR':
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  // Public methods for initialization control

  async retryInitialization(): Promise<BluetoothInitializationResult> {
    this.connectionState.initializationStatus = 'RETRYING';
    this.emitConnectionStateChange();
    
    const result = await this.bluetoothInitializer.retry();
    this.handleInitializationComplete(result);
    
    return result;
  }

  getInitializationStatus(): BluetoothInitializationStatus {
    return this.bluetoothInitializer.getInitializationStatus();
  }

  getInitializationResult(): BluetoothInitializationResult | null {
    return this.initializationResult;
  }

  // Cleanup method
  destroy(): void {
    this.stopDataCollection();
    this.clearReconnectTimer();
    this.disconnect();
    
    // Cleanup initializer
    this.bluetoothInitializer.destroy();
    
    // Clear callbacks
    this.connectionStateCallbacks = [];
    this.dataReceivedCallbacks = [];
    this.errorCallbacks = [];
    
    // Reset state
    this.bleManager = null;
    this.initializationResult = null;
  }
}