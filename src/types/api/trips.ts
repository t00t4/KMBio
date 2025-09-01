import { Trip, TripEvent, WeeklySummary } from '../entities';

export interface CreateTripRequest {
  vehicleId: string;
  startTime: Date;
}

export interface UpdateTripRequest {
  endTime?: Date;
  distance?: number;
  duration?: number;
  averageConsumption?: number;
  maxSpeed?: number;
  averageSpeed?: number;
  averageRPM?: number;
  maxRPM?: number;
  summary?: any;
}

export interface TripResponse extends Trip {}

export interface TripsListRequest {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  vehicleId?: string;
}

export interface TripsListResponse {
  trips: Trip[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateTripEventRequest {
  tripId: string;
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  context?: string;
}

export interface TripEventResponse extends TripEvent {}

export interface WeeklySummaryResponse extends WeeklySummary {}

export interface TripStatisticsRequest {
  startDate: Date;
  endDate: Date;
  vehicleId?: string;
}

export interface TripStatisticsResponse {
  totalTrips: number;
  totalDistance: number;
  totalDuration: number;
  averageConsumption: number;
  totalFuelConsumed: number;
  co2Emissions: number;
  efficiencyTrend: {
    date: Date;
    efficiency: number;
  }[];
  eventsSummary: {
    [eventType: string]: number;
  };
}