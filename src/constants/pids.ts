// OBD-II PIDs constants - placeholder for future implementation
export const OBD_PIDS = {
  RPM: '010C',
  SPEED: '010D',
  ENGINE_TEMP: '0105',
  MAF: '0110',
  MAP: '010B',
  THROTTLE_POSITION: '0111',
  FUEL_LEVEL: '012F',
} as const;

export type OBDPidType = keyof typeof OBD_PIDS;
