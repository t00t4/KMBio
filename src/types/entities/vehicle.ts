export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  year: number;
  make: string;
  model: string;
  fuelType: FuelType;
  engineSize: number; // in liters
  supportedPIDs: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FuelType = 'gasoline' | 'ethanol' | 'diesel' | 'flex';

export interface VehicleSpecs {
  displacement: number; // engine displacement in liters
  cylinders: number;
  fuelTankCapacity: number; // in liters
  weight: number; // in kg
  aerodynamicCoefficient?: number;
}