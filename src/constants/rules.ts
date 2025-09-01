// AI Rules constants - placeholder for future implementation
export const AI_RULES = {
  HIGH_RPM_THRESHOLD: 3000,
  HARSH_ACCELERATION_THRESHOLD: 2.5, // m/s²
  HARSH_BRAKING_THRESHOLD: -2.5, // m/s²
  IDLE_TIME_THRESHOLD: 0.1, // 10% of trip
  HIGH_TEMP_THRESHOLD: 100, // °C
} as const;
