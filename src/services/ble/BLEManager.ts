import { BleManager, State, BleError } from 'react-native-ble-plx';
import { 
  BLEDevice, 
  BLEConnectionState, 
  BLEError as AppBLEError, 
  BLEErrorCode,
  BLEConfiguration,
  BLEServiceInterface 
} from '../../types/ble';
import { PermissionsManager } from '../../utils/permissions';

export class BLEManager implements BLEServiceInterface {
  private bleManager: BleManager;
  private connectionState: BLEConnectionState;
  private config: BLEConfiguration;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private dataCollectionInterval?: ReturnType<typeof setInterval>;
  private connectionStateCallbacks: ((state: BLEConnectionState) => void)[] = [];
  private dataReceivedCallbacks: ((data: any) => void)[] = [];
  private errorCallbacks: ((error: AppBLEError) => void)[] = [];

  constructor(config?: Partial<BLEConfiguration>) {
    this.bleManager = new BleManager();
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
      connectionAttempts: 0
    };

    this.initializeBLE();
  }

  private async initializeBLE(): Promise<void> {
    try {
      // Check and request permissions
      const permissionResult = await PermissionsManager.checkBLEPermissions();
      if (!permissionResult.granted) {
        const requestResult = await PermissionsManager.requestBLEPermissions();
        if (!requestResult.granted) {
          this.emitError({
            code: 'PERMISSION_DENIED',
            message: 'BLE permissions not granted',
            timestamp: new Date()
          });
          return;
        }
      }

      // Monitor Bluetooth state changes
      this.bleManager.onStateChange((state) => {
        this.handleBluetoothStateChange(state);
      }, true);

      // Check initial Bluetooth state
      const state = await this.bleManager.state();
      this.handleBluetoothStateChange(state);

    } catch (error) {
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
        setTimeout(() => {
          this.bleManager.stopDeviceScan();
          this.connectionState.isScanning = false;
          this.emitConnectionStateChange();
          
          if (devices.length === 0) {
            reject(new Error('Nenhum dispositivo ELM327 encontrado'));
          } else {
            resolve(devices);
          }
        }, timeout);
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
      if (this.connectionState.connectedDevice) {
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

    try {
      // This is a simplified implementation
      // In a real implementation, you would write to the appropriate characteristic
      // and read the response from another characteristic
      
      // For now, return a mock response
      // TODO: Implement actual BLE characteristic communication
      return `Response to: ${command}`;
      
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

  onDataReceived(callback: (data: any) => void): void {
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

  // Cleanup method
  destroy(): void {
    this.stopDataCollection();
    this.clearReconnectTimer();
    this.disconnect();
    this.connectionStateCallbacks = [];
    this.dataReceivedCallbacks = [];
    this.errorCallbacks = [];
  }
}