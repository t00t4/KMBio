// Entity types placeholder
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  year: number;
  make: string;
  model: string;
}

export interface Trip {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: Date;
  endTime?: Date;
  distance: number;
  duration: number;
}
