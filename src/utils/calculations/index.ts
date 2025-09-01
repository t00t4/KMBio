// Calculation utilities placeholder
export const calculateConsumption = (maf: number, speed: number): number => {
  // Placeholder calculation
  return (maf * 0.1) / Math.max(speed, 1);
};

export const calculateEfficiency = (distance: number, fuel: number): number => {
  return distance / Math.max(fuel, 0.1);
};
