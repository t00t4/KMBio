export interface Trip {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: Date;
  endTime?: Date;
  distance: number; // in kilometers
  duration: number; // in seconds
  averageConsumption: number; // L/100km or km/L based on user preference
  maxSpeed: number; // km/h
  averageSpeed: number; // km/h
  averageRPM: number;
  maxRPM: number;
  events: TripEvent[];
  summary: TripSummary;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripEvent {
  id: string;
  tripId: string;
  timestamp: Date;
  type: TripEventType;
  severity: EventSeverity;
  value: number;
  context?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export type TripEventType = 
  | 'harsh_acceleration' 
  | 'harsh_braking' 
  | 'high_rpm' 
  | 'idle_time' 
  | 'high_temp'
  | 'speeding'
  | 'engine_load_high';

export type EventSeverity = 'low' | 'medium' | 'high';

export type TripStatus = 'active' | 'completed' | 'cancelled';

export interface TripSummary {
  totalFuelConsumed: number; // in liters
  averageEfficiency: number; // efficiency score 0-100
  co2Emissions: number; // in grams
  costEstimate: number; // in local currency
  eventsCount: {
    [K in TripEventType]: number;
  };
  timeBreakdown: {
    driving: number; // seconds
    idle: number; // seconds
    stopped: number; // seconds
  };
}

export interface WeeklySummary {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  totalDistance: number;
  totalDuration: number;
  averageConsumption: number;
  efficiencyScore: number;
  tripsCount: number;
  totalFuelConsumed: number;
  totalCost: number;
  co2Emissions: number;
  summaryData: {
    bestTrip?: {
      id: string;
      efficiency: number;
    };
    worstTrip?: {
      id: string;
      efficiency: number;
    };
    improvementAreas: string[];
    achievements: string[];
  };
  createdAt: Date;
}