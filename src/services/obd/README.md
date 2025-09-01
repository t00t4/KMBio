# OBD-II Service Documentation

## Overview

The OBD-II service provides a complete implementation of ELM327 communication protocol for reading vehicle diagnostic data via Bluetooth Low Energy (BLE). This service handles initialization, PID discovery, data reading, and validation according to the OBD-II standard.

## Features

### Core Functionality
- ✅ **ELM327 Protocol Implementation**: Complete AT command set support
- ✅ **PID Discovery**: Automatic detection of supported PIDs (01-20, 21-40, 41-60)
- ✅ **Data Reading**: Individual and batch PID reading with validation
- ✅ **Fallback Support**: Automatic fallback to alternative PIDs (MAF ↔ MAP)
- ✅ **Response Validation**: Comprehensive validation of OBD responses
- ✅ **Error Handling**: Robust error handling with meaningful error messages

### Supported PIDs
- **Essential PIDs**: RPM, Speed, MAF, MAP
- **Important PIDs**: Engine Temperature, Throttle Position, Engine Load
- **Optional PIDs**: Fuel Level, Intake Air Temperature, Fuel Pressure

### Protocol Support
- Auto-detection of OBD protocol
- Support for ISO 9141-2, KWP2000, CAN 11/29-bit (250K/500K)
- Adaptive timing configuration

## Usage

### Basic Setup

```typescript
import { OBDService } from './services/obd/OBDService';
import { BLEManager } from './services/ble/BLEManager';

// Initialize services
const bleManager = new BLEManager();
const obdService = new OBDService(bleManager);

// Connect to ELM327 device
await bleManager.connectToDevice('device-id');
await obdService.initialize();
```

### Reading Individual PIDs

```typescript
import { OBD_PIDS } from './constants/pids';

// Read engine RPM
const rpmResponse = await obdService.readPID(OBD_PIDS.ENGINE_RPM);
console.log(`RPM: ${rpmResponse.processedValue} ${rpmResponse.unit}`);

// Read vehicle speed
const speedResponse = await obdService.readPID(OBD_PIDS.VEHICLE_SPEED);
console.log(`Speed: ${speedResponse.processedValue} ${speedResponse.unit}`);
```

### Reading Multiple PIDs

```typescript
// Read essential data for fuel consumption calculation
const essentialData = await obdService.readEssentialData();

// Read specific PIDs
const pids = [OBD_PIDS.ENGINE_RPM, OBD_PIDS.VEHICLE_SPEED, OBD_PIDS.MAF_SENSOR];
const responses = await obdService.readMultiplePIDs(pids);
```

### Data Processing

```typescript
import { parseVehicleData, calculateFuelConsumptionFromMAF } from './utils/obd-calculations';

// Parse responses to structured data
const vehicleData = parseVehicleData(responses);

// Calculate fuel consumption
if (vehicleData.maf) {
  const fuelConsumption = calculateFuelConsumptionFromMAF(vehicleData.maf, 'gasoline');
  console.log(`Fuel consumption: ${fuelConsumption} L/h`);
}
```

### Real-time Data Collection

```typescript
class DataCollector {
  private obdService: OBDService;
  private collectionInterval?: NodeJS.Timeout;

  async startCollection(frequencyHz: number = 1) {
    const intervalMs = 1000 / frequencyHz;
    
    this.collectionInterval = setInterval(async () => {
      try {
        const data = await this.obdService.readEssentialData();
        const vehicleData = parseVehicleData(data);
        
        // Process real-time data
        this.processRealTimeData(vehicleData);
      } catch (error) {
        console.error('Data collection error:', error);
      }
    }, intervalMs);
  }

  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
  }
}
```

## API Reference

### OBDService Class

#### Methods

##### `initialize(): Promise<void>`
Initializes the ELM327 adapter and discovers supported PIDs.

**Throws**: Error if BLE not connected or ELM327 not detected

##### `getSupportedPIDs(): Promise<string[]>`
Returns array of supported PID identifiers.

##### `readPID(pid: string): Promise<OBDResponse>`
Reads a single PID value.

**Parameters**:
- `pid`: PID identifier (e.g., '010C' for RPM)

**Returns**: OBDResponse with processed value and metadata

##### `readMultiplePIDs(pids: string[]): Promise<OBDResponse[]>`
Reads multiple PIDs in sequence.

**Parameters**:
- `pids`: Array of PID identifiers

**Returns**: Array of OBDResponse objects

##### `validateConnection(): Promise<boolean>`
Tests OBD-II communication with basic commands.

##### `validateOBDResponse(response: OBDResponse): boolean`
Validates an OBD response for correctness.

##### `getVehicleInfo(): Promise<Record<string, unknown>>`
Retrieves vehicle information (VIN, protocol, etc.).

#### Utility Methods

##### `isPIDSupported(pid: string): boolean`
Checks if a specific PID is supported.

##### `getEssentialPIDs(): string[]`
Returns supported essential PIDs for fuel calculation.

##### `readEssentialData(): Promise<OBDResponse[]>`
Reads all essential PIDs in one call.

### OBDResponse Interface

```typescript
interface OBDResponse {
  pid: string;              // PID identifier
  rawValue: string;         // Raw hex response
  processedValue?: number;  // Calculated value
  unit?: string;           // Unit of measurement
  timestamp: Date;         // Response timestamp
  isValid: boolean;        // Validation status
  error?: string;          // Error message if invalid
  description?: string;    // Human-readable description
}
```

## Error Handling

### Common Error Scenarios

#### Connection Errors
```typescript
try {
  await obdService.initialize();
} catch (error) {
  if (error.message.includes('BLE device not connected')) {
    // Handle BLE connection issue
  } else if (error.message.includes('not responding as ELM327')) {
    // Handle wrong device type
  }
}
```

#### PID Reading Errors
```typescript
try {
  const response = await obdService.readPID(OBD_PIDS.MAF_SENSOR);
} catch (error) {
  if (error.message.includes('not supported by vehicle')) {
    // Try fallback PID or estimation
    console.log('MAF not available, using MAP sensor');
  }
}
```

#### Response Validation
```typescript
const response = await obdService.readPID(pid);
if (!obdService.validateOBDResponse(response)) {
  console.warn('Invalid response detected, skipping data point');
  return;
}
```

## Configuration

### ELM327 Configuration
The service automatically configures ELM327 with optimal settings:

```typescript
const elm327Config = {
  echo: false,           // Disable command echo
  linefeed: false,       // Disable line feeds
  headers: true,         // Enable headers for validation
  spaces: false,         // Disable spaces in responses
  protocol: 'AUTO',      // Auto-detect protocol
  timeout: 5000,         // 5 second timeout
  adaptiveTiming: true,  // Enable adaptive timing
};
```

### PID Fallback Configuration
Automatic fallbacks are configured for critical PIDs:

```typescript
const PID_FALLBACKS = {
  [OBD_PIDS.MAF_SENSOR]: [OBD_PIDS.INTAKE_MAP],
  [OBD_PIDS.INTAKE_MAP]: [OBD_PIDS.MAF_SENSOR],
};
```

## Testing

### Unit Tests
```bash
npm test src/services/obd/__tests__/OBDService.test.ts
```

### Integration Tests
```bash
npm test src/services/obd/__tests__/OBDIntegration.test.ts
```

### Test Coverage
- ✅ Initialization and configuration
- ✅ PID discovery and support detection
- ✅ Individual and batch PID reading
- ✅ Response validation and error handling
- ✅ Fallback PID mechanisms
- ✅ Real-time data collection scenarios
- ✅ Protocol management and vehicle info

## Performance Considerations

### Command Timing
- Minimum 100ms interval between commands
- Configurable timeout (default 5 seconds)
- Adaptive timing based on vehicle response

### Data Collection Frequency
- **Foreground**: 1-2 Hz recommended
- **Background**: 0.5 Hz for battery optimization
- **Highway**: Can increase to 2 Hz for better resolution

### Memory Management
- Responses are processed immediately
- No persistent data storage in service
- Efficient string processing for hex data

## Troubleshooting

### Common Issues

#### "Device is not responding as ELM327"
- Verify correct ELM327 device connection
- Check device compatibility (v1.5+ recommended)
- Ensure proper BLE pairing

#### "PID not supported by vehicle"
- Normal for some PIDs on certain vehicles
- Service automatically tries fallback PIDs
- Check vehicle OBD-II compliance (2001+ required)

#### "NO DATA" responses
- Vehicle may not support specific PID
- Engine may need to be running for some PIDs
- Check OBD-II port connection

#### Slow response times
- Reduce data collection frequency
- Check BLE signal strength
- Verify ELM327 device quality

### Debug Logging
Enable detailed logging for troubleshooting:

```typescript
// Enable console logging in OBDService
console.log('OBD command:', command);
console.log('OBD response:', response);
```

## Requirements Compliance

This implementation satisfies the following requirements from the KMBio MVP specification:

- **Requirement 2.6**: ✅ ELM327 protocol communication
- **Requirement 2.7**: ✅ PID reading (RPM, speed, temperature)
- **Requirement 3.2**: ✅ Real-time data collection with validation
- **Requirement 12.2**: ✅ Comprehensive error handling and fallbacks

## Future Enhancements

- [ ] Support for Mode 02 (freeze frame data)
- [ ] Support for Mode 03 (diagnostic trouble codes)
- [ ] Advanced PID caching strategies
- [ ] Predictive PID availability detection
- [ ] Enhanced protocol-specific optimizations