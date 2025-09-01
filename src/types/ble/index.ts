// BLE types placeholder
export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

export interface OBDData {
  timestamp: Date;
  rpm: number;
  speed: number;
  engineTemp: number;
}
