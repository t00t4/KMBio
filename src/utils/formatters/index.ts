// Formatter utilities placeholder
export const formatConsumption = (
  value: number,
  unit: 'L/100km' | 'km/L'
): string => {
  return `${value.toFixed(2)} ${unit}`;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(0)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};
