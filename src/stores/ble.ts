import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BLEDevice, BLEConnectionState, BLEError } from '../types/ble';
import { BLEManager } from '../services/ble/BLEManager';

interface BLEStore {
  // State
  connectionState: BLEConnectionState;
  bleManager: BLEManager | null;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  scanForDevices: (timeoutMs?: number) => Promise<BLEDevice[]>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  startDataCollection: (frequency: number) => void;
  stopDataCollection: () => void;
  clearError: () => void;
  updateConnectionState: (state: Partial<BLEConnectionState>) => void;
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
    bleManager: null,
    isInitialized: false,

    // Actions
    initialize: async () => {
      const { bleManager, isInitialized } = get();
      
      if (isInitialized && bleManager) {
        return;
      }

      try {
        const newBLEManager = new BLEManager();
        
        // Set up event listeners
        newBLEManager.onConnectionStateChange((state) => {
          set({ connectionState: state });
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

      } catch (error) {
        const bleError: BLEError = {
          code: 'UNKNOWN_ERROR',
          message: `Falha na inicialização do BLE: ${error}`,
          timestamp: new Date()
        };

        set((state) => ({
          connectionState: {
            ...state.connectionState,
            lastError: bleError
          }
        }));
        
        throw error;
      }
    },

    scanForDevices: async (timeoutMs?: number) => {
      const { bleManager } = get();
      
      if (!bleManager) {
        throw new Error('BLE Manager não inicializado');
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
      const { bleManager } = get();
      
      if (!bleManager) {
        throw new Error('BLE Manager não inicializado');
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
      const { bleManager } = get();
      
      if (!bleManager) {
        throw new Error('BLE Manager não inicializado');
      }

      if (!get().connectionState.isConnected) {
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

    updateConnectionState: (newState: Partial<BLEConnectionState>) => {
      set((state) => ({
        connectionState: {
          ...state.connectionState,
          ...newState
        }
      }));
    },

    cleanup: () => {
      const { bleManager } = get();
      
      if (bleManager) {
        bleManager.destroy();
      }

      set({
        bleManager: null,
        isInitialized: false,
        connectionState: {
          isScanning: false,
          isConnecting: false,
          isConnected: false,
          availableDevices: [],
          connectionAttempts: 0
        }
      });
    }
  }))
);

// Selectors for easier state access
export const useBLEConnectionState = () => useBLEStore(state => state.connectionState);
export const useBLEIsConnected = () => useBLEStore(state => state.connectionState.isConnected);
export const useBLEIsScanning = () => useBLEStore(state => state.connectionState.isScanning);
export const useBLEAvailableDevices = () => useBLEStore(state => state.connectionState.availableDevices);
export const useBLEError = () => useBLEStore(state => state.connectionState.lastError);
export const useBLEConnectedDevice = () => useBLEStore(state => state.connectionState.connectedDevice);