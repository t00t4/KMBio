import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BLEDevice, BLEConnectionState, BLEError } from '../types/ble';
import { BLEManager } from '../services/ble/BLEManager';
import { BluetoothInitializer } from '../services/ble/BluetoothInitializer';
import {
  BluetoothInitializationResult,
  BluetoothInitializationStatus,
  BluetoothCapabilities,
  BluetoothInitializationError
} from '../types/ble/bluetooth-initializer';

interface BLEInitializationState {
  status: BluetoothInitializationStatus;
  progress: number; // 0-100
  error?: BluetoothInitializationError;
  capabilities?: BluetoothCapabilities;
  recommendations: string[];
  isRetrying: boolean;
  retryCount: number;
  lastInitializationAttempt?: Date;
  lastSuccessfulInitialization?: Date;
}

interface BLEStore {
  // State
  connectionState: BLEConnectionState;
  initializationState: BLEInitializationState;
  bleManager: BLEManager | null;
  bluetoothInitializer: BluetoothInitializer | null;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<BluetoothInitializationResult>;
  retryInitialization: () => Promise<BluetoothInitializationResult>;
  scanForDevices: (timeoutMs?: number) => Promise<BLEDevice[]>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  startDataCollection: (frequency: number) => void;
  stopDataCollection: () => void;
  clearError: () => void;
  clearInitializationError: () => void;
  updateConnectionState: (state: Partial<BLEConnectionState>) => void;
  updateInitializationState: (state: Partial<BLEInitializationState>) => void;
  cleanup: () => void;
}

export const useBLEStore = create<BLEStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    connectionState: {
      isScanning: false,
      isConnecting: false,
      isConnected: false,
      availableDevices: [],
      connectionAttempts: 0
    },
    initializationState: {
      status: 'NOT_STARTED',
      progress: 0,
      recommendations: [],
      isRetrying: false,
      retryCount: 0
    },
    bleManager: null,
    bluetoothInitializer: null,
    isInitialized: false,

    // Actions
    initialize: async (): Promise<BluetoothInitializationResult> => {
      const { bluetoothInitializer, isInitialized } = get();
      
      // If already initialized successfully, return success
      if (isInitialized && bluetoothInitializer) {
        const capabilities = bluetoothInitializer.getInitializationStatus() === 'COMPLETED_SUCCESS' 
          ? get().initializationState.capabilities 
          : undefined;
        
        return {
          success: true,
          capabilities: capabilities || {
            bleSupported: true,
            permissionsGranted: true,
            bluetoothEnabled: true,
            canScan: true,
            canConnect: true
          },
          recommendations: ['Sistema Bluetooth já inicializado']
        };
      }

      try {
        // Update initialization state to in progress
        set((state) => ({
          initializationState: {
            ...state.initializationState,
            status: 'IN_PROGRESS',
            progress: 10,
            error: undefined,
            lastInitializationAttempt: new Date(),
            isRetrying: false
          }
        }));

        // Create new initializer if needed
        let initializer = bluetoothInitializer;
        if (!initializer) {
          initializer = new BluetoothInitializer();
          
          // Set up initialization completion callback
          initializer.onInitializationComplete((result) => {
            set((state) => ({
              initializationState: {
                ...state.initializationState,
                status: result.success ? 'COMPLETED_SUCCESS' : 'COMPLETED_ERROR',
                progress: result.success ? 100 : 0,
                error: result.error,
                capabilities: result.capabilities,
                recommendations: result.recommendations,
                isRetrying: false,
                lastSuccessfulInitialization: result.success ? new Date() : state.initializationState.lastSuccessfulInitialization
              }
            }));
          });

          set({ bluetoothInitializer: initializer });
        }

        // Update progress during initialization
        set((state) => ({
          initializationState: {
            ...state.initializationState,
            progress: 30
          }
        }));

        // Perform initialization
        const result = await initializer.initialize();

        // Update progress
        set((state) => ({
          initializationState: {
            ...state.initializationState,
            progress: 60
          }
        }));

        if (result.success) {
          // Create BLE Manager
          const newBLEManager = new BLEManager();
          
          // Set up event listeners
          newBLEManager.onConnectionStateChange((connectionState) => {
            set({ connectionState });
          });

          newBLEManager.onError((error) => {
            set((state) => ({
              connectionState: {
                ...state.connectionState,
                lastError: error
              }
            }));
          });

          // Final update
          set((state) => ({
            bleManager: newBLEManager,
            isInitialized: true,
            initializationState: {
              ...state.initializationState,
              status: 'COMPLETED_SUCCESS',
              progress: 100,
              capabilities: result.capabilities,
              recommendations: result.recommendations,
              lastSuccessfulInitialization: new Date()
            }
          }));
        } else {
          // Handle initialization failure
          set((state) => ({
            initializationState: {
              ...state.initializationState,
              status: 'COMPLETED_ERROR',
              progress: 0,
              error: result.error,
              capabilities: result.capabilities,
              recommendations: result.recommendations
            }
          }));
        }

        return result;

      } catch (error) {
        const initError: BluetoothInitializationError = {
          code: 'UNKNOWN_ERROR',
          message: `Falha na inicialização do Bluetooth: ${error}`,
          technicalDetails: `Unexpected error during initialization: ${error}`,
          timestamp: new Date(),
          recoverable: true,
          recoverySteps: ['Tente novamente', 'Reinicie o aplicativo se o problema persistir'],
          diagnosticInfo: {
            deviceModel: 'Unknown',
            osVersion: 'Unknown',
            appVersion: '1.0.0',
            bleLibraryVersion: '3.5.0',
            initializationAttempts: get().initializationState.retryCount + 1,
            stateHistory: [],
            permissionHistory: []
          }
        };

        const result: BluetoothInitializationResult = {
          success: false,
          error: initError,
          capabilities: {
            bleSupported: false,
            permissionsGranted: false,
            bluetoothEnabled: false,
            canScan: false,
            canConnect: false
          },
          recommendations: initError.recoverySteps
        };

        set((state) => ({
          initializationState: {
            ...state.initializationState,
            status: 'COMPLETED_ERROR',
            progress: 0,
            error: initError,
            capabilities: result.capabilities,
            recommendations: result.recommendations
          }
        }));
        
        return result;
      }
    },

    retryInitialization: async (): Promise<BluetoothInitializationResult> => {
      const { bluetoothInitializer } = get();
      
      if (!bluetoothInitializer) {
        // If no initializer, create new one and initialize
        return get().initialize();
      }

      try {
        // Update state to show retrying
        set((state) => ({
          initializationState: {
            ...state.initializationState,
            status: 'RETRYING',
            progress: 0,
            isRetrying: true,
            retryCount: state.initializationState.retryCount + 1,
            lastInitializationAttempt: new Date()
          }
        }));

        const result = await bluetoothInitializer.retry();

        // Update state based on result
        set((state) => ({
          initializationState: {
            ...state.initializationState,
            status: result.success ? 'COMPLETED_SUCCESS' : 'COMPLETED_ERROR',
            progress: result.success ? 100 : 0,
            error: result.error,
            capabilities: result.capabilities,
            recommendations: result.recommendations,
            isRetrying: false,
            lastSuccessfulInitialization: result.success ? new Date() : state.initializationState.lastSuccessfulInitialization
          }
        }));

        if (result.success) {
          // Create BLE Manager if initialization succeeded
          const newBLEManager = new BLEManager();
          
          newBLEManager.onConnectionStateChange((connectionState) => {
            set({ connectionState });
          });

          newBLEManager.onError((error) => {
            set((state) => ({
              connectionState: {
                ...state.connectionState,
                lastError: error
              }
            }));
          });

          set({ 
            bleManager: newBLEManager, 
            isInitialized: true 
          });
        }

        return result;
      } catch (error) {
        set((state) => ({
          initializationState: {
            ...state.initializationState,
            status: 'COMPLETED_ERROR',
            progress: 0,
            isRetrying: false
          }
        }));
        
        throw error;
      }
    },

    scanForDevices: async (timeoutMs?: number) => {
      const { bleManager, initializationState } = get();
      
      // Check if initialization is complete and successful
      if (initializationState.status !== 'COMPLETED_SUCCESS' || !bleManager) {
        throw new Error('Sistema Bluetooth não inicializado. Execute a inicialização primeiro.');
      }

      // Check if we have scanning capabilities
      if (!initializationState.capabilities?.canScan) {
        throw new Error('Não é possível escanear dispositivos. Verifique as permissões e o estado do Bluetooth.');
      }

      try {
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isScanning: true,
            lastError: undefined
          }
        }));

        const devices = await bleManager.scanForDevices(timeoutMs);
        
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isScanning: false,
            availableDevices: devices
          }
        }));

        return devices;
      } catch (error) {
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isScanning: false
          }
        }));
        throw error;
      }
    },

    connectToDevice: async (deviceId: string) => {
      const { bleManager, initializationState } = get();
      
      // Check if initialization is complete and successful
      if (initializationState.status !== 'COMPLETED_SUCCESS' || !bleManager) {
        throw new Error('Sistema Bluetooth não inicializado. Execute a inicialização primeiro.');
      }

      // Check if we have connection capabilities
      if (!initializationState.capabilities?.canConnect) {
        throw new Error('Não é possível conectar a dispositivos. Verifique as permissões e o estado do Bluetooth.');
      }

      try {
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isConnecting: true,
            lastError: undefined
          }
        }));

        await bleManager.connectToDevice(deviceId);
        
        // Connection state will be updated via the event listener
      } catch (error) {
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isConnecting: false,
            isConnected: false
          }
        }));
        throw error;
      }
    },

    disconnect: async () => {
      const { bleManager } = get();
      
      if (!bleManager) {
        return;
      }

      try {
        await bleManager.disconnect();
        
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            isConnected: false,
            isConnecting: false,
            connectedDevice: undefined
          }
        }));
      } catch (error) {
        console.error('Erro ao desconectar:', error);
      }
    },

    startDataCollection: (frequency: number) => {
      const { bleManager, initializationState, connectionState } = get();
      
      // Check if initialization is complete and successful
      if (initializationState.status !== 'COMPLETED_SUCCESS' || !bleManager) {
        throw new Error('Sistema Bluetooth não inicializado');
      }

      if (!connectionState.isConnected) {
        throw new Error('Dispositivo não conectado');
      }

      bleManager.startDataCollection(frequency);
    },

    stopDataCollection: () => {
      const { bleManager } = get();
      
      if (bleManager) {
        bleManager.stopDataCollection();
      }
    },

    clearError: () => {
      set((state) => ({
        connectionState: {
          ...state.connectionState,
          lastError: undefined
        }
      }));
    },

    clearInitializationError: () => {
      set((state) => ({
        initializationState: {
          ...state.initializationState,
          error: undefined
        }
      }));
    },

    updateConnectionState: (newState: Partial<BLEConnectionState>) => {
      set((state) => ({
        connectionState: {
          ...state.connectionState,
          ...newState
        }
      }));
    },

    updateInitializationState: (newState: Partial<BLEInitializationState>) => {
      set((state) => ({
        initializationState: {
          ...state.initializationState,
          ...newState
        }
      }));
    },

    cleanup: () => {
      const { bleManager, bluetoothInitializer } = get();
      
      if (bleManager) {
        bleManager.destroy();
      }

      if (bluetoothInitializer) {
        bluetoothInitializer.destroy();
      }

      set({
        bleManager: null,
        bluetoothInitializer: null,
        isInitialized: false,
        connectionState: {
          isScanning: false,
          isConnecting: false,
          isConnected: false,
          availableDevices: [],
          connectionAttempts: 0
        },
        initializationState: {
          status: 'NOT_STARTED',
          progress: 0,
          recommendations: [],
          isRetrying: false,
          retryCount: 0
        }
      });
    }
  }))
);

// Selectors for easier state access
export const useBLEConnectionState = () => useBLEStore(state => state.connectionState);
export const useBLEInitializationState = () => useBLEStore(state => state.initializationState);
export const useBLEIsConnected = () => useBLEStore(state => state.connectionState.isConnected);
export const useBLEIsScanning = () => useBLEStore(state => state.connectionState.isScanning);
export const useBLEAvailableDevices = () => useBLEStore(state => state.connectionState.availableDevices);
export const useBLEError = () => useBLEStore(state => state.connectionState.lastError);
export const useBLEInitializationError = () => useBLEStore(state => state.initializationState.error);
export const useBLEConnectedDevice = () => useBLEStore(state => state.connectionState.connectedDevice);
export const useBLEIsInitialized = () => useBLEStore(state => state.isInitialized);
export const useBLEInitializationStatus = () => useBLEStore(state => state.initializationState.status);
export const useBLEInitializationProgress = () => useBLEStore(state => state.initializationState.progress);
export const useBLECapabilities = () => useBLEStore(state => state.initializationState.capabilities);
export const useBLERecommendations = () => useBLEStore(state => state.initializationState.recommendations);