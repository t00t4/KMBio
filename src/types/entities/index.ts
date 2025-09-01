// User related types
export * from './user';

// Vehicle related types
export * from './vehicle';

// Trip and journey related types
export * from './trip';

// OBD and real-time data types
export * from './obd-data';

// Tips and AI recommendations
export * from './tips';

// Common utility types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}