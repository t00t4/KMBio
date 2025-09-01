import { Vehicle, FuelType } from '../entities';

export interface CreateVehicleRequest {
  name: string;
  year: number;
  make: string;
  model: string;
  fuelType: FuelType;
  engineSize: number;
}

export interface UpdateVehicleRequest {
  name?: string;
  year?: number;
  make?: string;
  model?: string;
  fuelType?: FuelType;
  engineSize?: number;
  supportedPIDs?: string[];
  isActive?: boolean;
}

export interface VehicleResponse extends Vehicle {}

export interface VehiclesListResponse {
  vehicles: Vehicle[];
  total: number;
}

export interface DeleteVehicleRequest {
  vehicleId: string;
}

export interface SetActiveVehicleRequest {
  vehicleId: string;
}