export interface Tip {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: TipCategory;
  priority: TipPriority;
  isRead: boolean;
  isApplied?: boolean;
  generatedAt: Date;
  expiresAt?: Date;
  relatedTripId?: string;
  metadata?: {
    triggerEvent?: string;
    expectedImpact?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

export type TipCategory = 
  | 'fuel_efficiency'
  | 'driving_behavior'
  | 'maintenance'
  | 'route_optimization'
  | 'vehicle_settings'
  | 'general';

export type TipPriority = 1 | 2 | 3 | 4 | 5; // 1 = highest priority

export interface TipTemplate {
  id: string;
  category: TipCategory;
  title: string;
  content: string;
  conditions: TipCondition[];
  priority: TipPriority;
  cooldownDays?: number; // minimum days between showing this tip
}

export interface TipCondition {
  type: 'event_frequency' | 'consumption_increase' | 'efficiency_drop' | 'custom';
  threshold: number;
  period: 'trip' | 'day' | 'week' | 'month';
  comparison: 'greater_than' | 'less_than' | 'equals';
}