import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Trip, TripEvent, TripStatus, TripSummary } from '../types/entities/trip';
import { RealTimeData, ConnectionStatus } from '../types/entities/obd-data';
import { TelemetryService, TelemetryConfig } from '../services/telemetry';

interface TripState {
  // Current trip data
  currentTrip: Trip | null;
  isActive: boolean;
  
  // Real-time data
  realTimeData: RealTimeData | null;
  connectionStatus: ConnectionStatus;
  
  // Telemetry service
  telemetryService: TelemetryService | null;
  telemetryConfig: TelemetryConfig;
  
  // Trip events and statistics
  tripEvents: TripEvent[];
  tripStatistics: {
    totalDistance: number;
    totalDuration: number;
    averageSpeed: number;
    maxSpeed: number;
    averageRPM: number;
    maxRPM: number;
    fuelConsumed: number;
    averageConsumption: number;
    efficiencyScore: number;
  };
  
  // Data collection settings
  dataCollectionEnabled: boolean;
  backgroundMode: boolean;
  
  // Actions
  startTrip: (vehicleId: string, telemetryService: TelemetryService) => Promise<void>;
  stopTrip: () => Promise<void>;
  pauseTrip: () => void;
  resumeTrip: () => void;
  
  // Real-time data actions
  updateRealTimeData: (data: RealTimeData) => void;
  addTripEvent: (event: Omit<TripEvent, 'id' | 'tripId'>) => void;
  
  // Telemetry configuration
  updateTelemetryConfig: (config: Partial<TelemetryConfig>) => void;
  setBackgroundMode: (enabled: boolean) => void;
  
  // Data management
  clearTripData: () => void;
  getTripSummary: () => TripSummary;
  
  // Utility functions
  calculateCurrentEfficiency: () => number;
  getRecentEvents: (minutes: number) => TripEvent[];
}

const initialTripStatistics = {
  totalDistance: 0,
  totalDuration: 0,
  averageSpeed: 0,
  maxSpeed: 0,
  averageRPM: 0,
  maxRPM: 0,
  fuelConsumed: 0,
  averageConsumption: 0,
  efficiencyScore: 0,
};

const defaultTelemetryConfig: TelemetryConfig = {
  frequency: 1.5, // 1.5 Hz as per requirements
  enabledPIDs: [
    '010C', // RPM
    '010D', // Speed
    '0105', // Engine temp
    '0110', // MAF
    '010B', // MAP
    '0111', // Throttle position
  ],
  fallbackEnabled: true,
  qualityThreshold: 70,
};

export const useTripStore = create<TripState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentTrip: null,
    isActive: false,
    realTimeData: null,
    connectionStatus: 'disconnected',
    telemetryService: null,
    telemetryConfig: defaultTelemetryConfig,
    tripEvents: [],
    tripStatistics: initialTripStatistics,
    dataCollectionEnabled: true,
    backgroundMode: false,

    // Trip management actions
    startTrip: async (vehicleId: string, telemetryService: TelemetryService) => {
      const state = get();
      
      if (state.isActive) {
        console.warn('Trip is already active');
        return;
      }

      try {
        // Create new trip
        const newTrip: Trip = {
          id: `trip_${Date.now()}`,
          userId: '', // Will be set from auth store
          vehicleId,
          startTime: new Date(),
          distance: 0,
          duration: 0,
          averageConsumption: 0,
          maxSpeed: 0,
          averageSpeed: 0,
          averageRPM: 0,
          maxRPM: 0,
          events: [],
          summary: {
            totalFuelConsumed: 0,
            averageEfficiency: 0,
            co2Emissions: 0,
            costEstimate: 0,
            eventsCount: {
              harsh_acceleration: 0,
              harsh_braking: 0,
              high_rpm: 0,
              idle_time: 0,
              high_temp: 0,
              speeding: 0,
              engine_load_high: 0,
            },
            timeBreakdown: {
              driving: 0,
              idle: 0,
              stopped: 0,
            },
          },
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Set up telemetry service callback first
        const unsubscribe = telemetryService.onDataUpdate((data: RealTimeData) => {
          get().updateRealTimeData(data);
        });

        // Update state before starting telemetry
        set({
          currentTrip: newTrip,
          isActive: true,
          telemetryService,
          connectionStatus: 'connecting',
          tripEvents: [],
          tripStatistics: initialTripStatistics,
        });

        // Start telemetry collection
        await telemetryService.start(state.telemetryConfig);

        // Update connection status after successful start
        set({
          connectionStatus: 'connected',
        });

        console.log('Trip started successfully:', newTrip.id);
      } catch (error) {
        console.error('Failed to start trip:', error);
        
        // Reset state on failure
        set({
          currentTrip: null,
          isActive: false,
          telemetryService: null,
          connectionStatus: 'disconnected',
        });
        
        throw error;
      }
    },

    stopTrip: async () => {
      const state = get();
      
      if (!state.isActive || !state.currentTrip) {
        console.warn('No active trip to stop');
        return;
      }

      try {
        // Stop telemetry service
        if (state.telemetryService) {
          await state.telemetryService.stop();
        }

        // Update trip with final data
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - state.currentTrip.startTime.getTime()) / 1000);
        
        const finalTrip: Trip = {
          ...state.currentTrip,
          endTime,
          duration,
          distance: state.tripStatistics.totalDistance,
          averageConsumption: state.tripStatistics.averageConsumption,
          maxSpeed: state.tripStatistics.maxSpeed,
          averageSpeed: state.tripStatistics.averageSpeed,
          averageRPM: state.tripStatistics.averageRPM,
          maxRPM: state.tripStatistics.maxRPM,
          events: state.tripEvents,
          summary: get().getTripSummary(),
          status: 'completed',
          updatedAt: new Date(),
        };

        set({
          currentTrip: finalTrip,
          isActive: false,
          realTimeData: null,
          connectionStatus: 'disconnected',
        });

        console.log('Trip stopped successfully:', finalTrip.id);
        
        // TODO: Save trip to database
        // await saveTripToDatabase(finalTrip);
        
      } catch (error) {
        console.error('Failed to stop trip:', error);
        throw error;
      }
    },

    pauseTrip: () => {
      const state = get();
      
      if (!state.isActive || !state.telemetryService) {
        return;
      }

      // Pause telemetry collection
      state.telemetryService.stop();
      
      set({
        connectionStatus: 'disconnected',
      });

      console.log('Trip paused');
    },

    resumeTrip: () => {
      const state = get();
      
      if (!state.isActive || !state.telemetryService) {
        return;
      }

      // Resume telemetry collection
      state.telemetryService.start(state.telemetryConfig);
      
      set({
        connectionStatus: 'connected',
      });

      console.log('Trip resumed');
    },

    // Real-time data management
    updateRealTimeData: (data: RealTimeData) => {
      const state = get();
      
      if (!state.isActive || !state.currentTrip) {
        return;
      }

      // Update connection status
      set({
        realTimeData: data,
        connectionStatus: data.connectionStatus,
      });

      // Update trip statistics
      const newStats = { ...state.tripStatistics };
      
      // Update max values
      if (data.speed > newStats.maxSpeed) {
        newStats.maxSpeed = data.speed;
      }
      if (data.rpm > newStats.maxRPM) {
        newStats.maxRPM = data.rpm;
      }

      // Update averages (simplified - in practice you'd use proper moving averages)
      const dataCount = Math.max(1, newStats.totalDuration || 1);
      newStats.averageSpeed = ((newStats.averageSpeed * (dataCount - 1)) + data.speed) / dataCount;
      newStats.averageRPM = ((newStats.averageRPM * (dataCount - 1)) + data.rpm) / dataCount;
      newStats.averageConsumption = data.calculated.averageConsumption;
      newStats.efficiencyScore = data.calculated.efficiency;
      
      // Update fuel consumption (accumulate)
      const fuelFlowPerSecond = data.calculated.fuelFlow / 3600; // Convert L/h to L/s
      const timeIncrement = 1 / state.telemetryConfig.frequency; // Time between samples
      newStats.fuelConsumed += fuelFlowPerSecond * timeIncrement;

      // Update distance (simplified calculation)
      if (data.speed > 0) {
        const speedMs = data.speed / 3.6; // Convert km/h to m/s
        const distanceIncrement = speedMs * timeIncrement / 1000; // Convert to km
        newStats.totalDistance += distanceIncrement;
      }

      // Update duration
      newStats.totalDuration = Math.floor((Date.now() - state.currentTrip.startTime.getTime()) / 1000);

      set({ tripStatistics: newStats });

      // Check for events that should be generated
      get().checkForTripEvents(data);
    },

    addTripEvent: (event: Omit<TripEvent, 'id' | 'tripId'>) => {
      const state = get();
      
      if (!state.currentTrip) {
        return;
      }

      const newEvent: TripEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tripId: state.currentTrip.id,
      };

      set({
        tripEvents: [...state.tripEvents, newEvent],
      });

      console.log('Trip event added:', newEvent.type, newEvent.severity);
    },

    // Configuration management
    updateTelemetryConfig: (config: Partial<TelemetryConfig>) => {
      const state = get();
      const newConfig = { ...state.telemetryConfig, ...config };
      
      set({ telemetryConfig: newConfig });
      
      // Update running telemetry service if active
      if (state.telemetryService && state.isActive) {
        state.telemetryService.updateConfig(config);
      }
    },

    setBackgroundMode: (enabled: boolean) => {
      const state = get();
      
      set({ backgroundMode: enabled });
      
      // Adjust telemetry frequency for background mode
      if (enabled) {
        // Reduce frequency to 0.5 Hz for battery optimization
        get().updateTelemetryConfig({ frequency: 0.5 });
      } else {
        // Restore normal frequency
        get().updateTelemetryConfig({ frequency: 1.5 });
      }
    },

    // Data management
    clearTripData: () => {
      set({
        currentTrip: null,
        isActive: false,
        realTimeData: null,
        connectionStatus: 'disconnected',
        tripEvents: [],
        tripStatistics: initialTripStatistics,
      });
    },

    getTripSummary: (): TripSummary => {
      const state = get();
      
      // Count events by type
      const eventsCount = state.tripEvents.reduce((counts, event) => {
        counts[event.type] = (counts[event.type] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      // Calculate time breakdown (simplified)
      const totalDuration = state.tripStatistics.totalDuration;
      const drivingTime = totalDuration * 0.8; // Estimate
      const idleTime = totalDuration * 0.15; // Estimate
      const stoppedTime = totalDuration * 0.05; // Estimate

      return {
        totalFuelConsumed: state.tripStatistics.fuelConsumed,
        averageEfficiency: state.tripStatistics.efficiencyScore,
        co2Emissions: state.tripStatistics.fuelConsumed * 2.31, // kg CO2 per liter of gasoline
        costEstimate: state.tripStatistics.fuelConsumed * 5.5, // Estimate R$ 5.50 per liter
        eventsCount: {
          harsh_acceleration: eventsCount.harsh_acceleration || 0,
          harsh_braking: eventsCount.harsh_braking || 0,
          high_rpm: eventsCount.high_rpm || 0,
          idle_time: eventsCount.idle_time || 0,
          high_temp: eventsCount.high_temp || 0,
          speeding: eventsCount.speeding || 0,
          engine_load_high: eventsCount.engine_load_high || 0,
        },
        timeBreakdown: {
          driving: drivingTime,
          idle: idleTime,
          stopped: stoppedTime,
        },
      };
    },

    // Utility functions
    calculateCurrentEfficiency: (): number => {
      const state = get();
      return state.realTimeData?.calculated.efficiency || 0;
    },

    getRecentEvents: (minutes: number): TripEvent[] => {
      const state = get();
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      
      return state.tripEvents.filter(event => 
        event.timestamp >= cutoffTime
      );
    },

    // Private helper method (added to store for access to state)
    checkForTripEvents: (data: RealTimeData) => {
      const state = get();
      
      if (!state.isActive || !state.currentTrip) {
        return;
      }
      
      // Check for harsh acceleration (RPM increase > 1000 in short time)
      if (state.realTimeData) {
        const rpmDiff = data.rpm - state.realTimeData.rpm;
        const timeDiff = data.timestamp.getTime() - state.realTimeData.timestamp.getTime();
        
        if (rpmDiff > 1000 && timeDiff < 3000) { // 1000 RPM increase in < 3 seconds
          get().addTripEvent({
            timestamp: data.timestamp,
            type: 'harsh_acceleration',
            severity: rpmDiff > 1500 ? 'high' : 'medium',
            value: rpmDiff,
            context: `RPM increased by ${rpmDiff} in ${timeDiff}ms`,
          });
        }
      }

      // Check for high RPM
      if (data.rpm > 3000) {
        get().addTripEvent({
          timestamp: data.timestamp,
          type: 'high_rpm',
          severity: data.rpm > 4000 ? 'high' : 'medium',
          value: data.rpm,
          context: `RPM: ${data.rpm}`,
        });
      }

      // Check for high engine temperature
      if (data.engineTemp > 100) {
        get().addTripEvent({
          timestamp: data.timestamp,
          type: 'high_temp',
          severity: data.engineTemp > 110 ? 'high' : 'medium',
          value: data.engineTemp,
          context: `Engine temp: ${data.engineTemp}°C`,
        });
      }

      // Check for speeding (assuming speed limit of 60 km/h in city)
      if (data.speed > 60) {
        get().addTripEvent({
          timestamp: data.timestamp,
          type: 'speeding',
          severity: data.speed > 80 ? 'high' : 'medium',
          value: data.speed,
          context: `Speed: ${data.speed} km/h`,
        });
      }

      // Check for idle time (speed = 0, RPM > 600 for extended period)
      if (data.speed === 0 && data.rpm > 600) {
        // This would need more sophisticated logic to track duration
        // For now, just log the event
        get().addTripEvent({
          timestamp: data.timestamp,
          type: 'idle_time',
          severity: 'low',
          value: data.rpm,
          context: `Idling at ${data.rpm} RPM`,
        });
      }
    },
  }))
);

// Selectors for common data access patterns
export const selectCurrentTrip = (state: TripState) => state.currentTrip;
export const selectIsActive = (state: TripState) => state.isActive;
export const selectRealTimeData = (state: TripState) => state.realTimeData;
export const selectConnectionStatus = (state: TripState) => state.connectionStatus;
export const selectTripStatistics = (state: TripState) => state.tripStatistics;
export const selectRecentEvents = (state: TripState) => state.getRecentEvents(5); // Last 5 minutes