import { BLEServiceInterface, OBDServiceInterface } from '../../types/ble';
import { OBDResponse, OBDProtocol } from '../../types/ble/obd-protocol';

export class OBDService implements OBDServiceInterface {
  private bleService: BLEServiceInterface;
  private isInitialized: boolean = false;
  private supportedPIDs: Set<string> = new Set();
  private currentProtocol?: OBDProtocol;

  constructor(bleService: BLEServiceInterface) {
    this.bleService = bleService;
  }

  async initialize(): Promise<void> {
    if (!this.bleService.isConnected()) {
      throw new Error('BLE device not connected');
    }

    try {
      // Reset the ELM327 adapter
      await this.resetAdapter();

      // Test basic communication
      const response = await this.sendCommand('ATZ');
      if (!response.includes('ELM327')) {
        throw new Error('Device is not responding as ELM327');
      }

      // Set up basic configuration
      await this.sendCommand('ATE0'); // Echo off
      await this.sendCommand('ATL0'); // Line feeds off
      await this.sendCommand('ATS0'); // Spaces off
      await this.sendCommand('ATH1'); // Headers on
      await this.sendCommand('ATSP0'); // Auto protocol detection

      // Test OBD-II communication
      await this.validateConnection();

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`OBD initialization failed: ${error}`);
    }
  }

  async getSupportedPIDs(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Query supported PIDs (Mode 01, PID 00)
      const response = await this.sendCommand('0100');
      
      if (response.includes('NO DATA') || response.includes('ERROR')) {
        throw new Error('Vehicle does not support OBD-II');
      }

      // Parse supported PIDs from response
      // This is a simplified implementation
      const supportedPIDs = this.parseSupportedPIDs(response);
      supportedPIDs.forEach(pid => this.supportedPIDs.add(pid));

      return Array.from(this.supportedPIDs);
    } catch (error) {
      throw new Error(`Failed to get supported PIDs: ${error}`);
    }
  }

  async readPID(pid: string): Promise<OBDResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const command = `01${pid}`;
      const rawResponse = await this.sendCommand(command);

      if (rawResponse.includes('NO DATA')) {
        throw new Error(`PID ${pid} not supported`);
      }

      if (rawResponse.includes('ERROR')) {
        throw new Error(`Error reading PID ${pid}`);
      }

      return this.parseOBDResponse(pid, rawResponse);
    } catch (error) {
      throw new Error(`Failed to read PID ${pid}: ${error}`);
    }
  }

  async readMultiplePIDs(pids: string[]): Promise<OBDResponse[]> {
    const responses: OBDResponse[] = [];
    
    for (const pid of pids) {
      try {
        const response = await this.readPID(pid);
        responses.push(response);
      } catch (error) {
        // Continue with other PIDs if one fails
        console.warn(`Failed to read PID ${pid}:`, error);
      }
    }

    return responses;
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Test with a basic PID that should be supported by most vehicles
      const response = await this.sendCommand('0100'); // Supported PIDs
      
      return !response.includes('NO DATA') && 
             !response.includes('ERROR') && 
             !response.includes('UNABLE TO CONNECT');
    } catch (error) {
      return false;
    }
  }

  async getVehicleInfo(): Promise<Record<string, unknown>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const info: Record<string, unknown> = {};

      // Try to get VIN (Vehicle Identification Number)
      try {
        const vinResponse = await this.sendCommand('0902');
        info.vin = this.parseVIN(vinResponse);
      } catch (error) {
        console.warn('Could not retrieve VIN:', error);
      }

      // Try to get protocol information
      try {
        const protocolResponse = await this.sendCommand('ATDPN');
        info.protocol = protocolResponse.trim();
      } catch (error) {
        console.warn('Could not retrieve protocol info:', error);
      }

      return info;
    } catch (error) {
      throw new Error(`Failed to get vehicle info: ${error}`);
    }
  }

  async resetAdapter(): Promise<void> {
    try {
      await this.sendCommand('ATZ');
      // Wait for adapter to reset
      await new Promise(resolve => {
        const timeoutId = setTimeout(resolve, 2000);
        return timeoutId;
      });
    } catch (error) {
      throw new Error(`Failed to reset adapter: ${error}`);
    }
  }

  async setProtocol(protocol: OBDProtocol): Promise<void> {
    try {
      const protocolCommand = this.getProtocolCommand(protocol);
      await this.sendCommand(protocolCommand);
      this.currentProtocol = protocol;
    } catch (error) {
      throw new Error(`Failed to set protocol: ${error}`);
    }
  }

  // Private helper methods

  private async sendCommand(command: string): Promise<string> {
    if (!this.bleService.isConnected()) {
      throw new Error('BLE device not connected');
    }

    try {
      const response = await this.bleService.sendCommand(command + '\r');
      return response.replace(/\r|\n|>/g, '').trim();
    } catch (error) {
      throw new Error(`Command failed: ${error}`);
    }
  }

  private parseSupportedPIDs(response: string): string[] {
    // This is a simplified implementation
    // In a real implementation, you would parse the hex response
    // and determine which PIDs are supported based on bit flags
    
    const commonPIDs = [
      '0C', // Engine RPM
      '0D', // Vehicle Speed
      '05', // Engine Coolant Temperature
      '0F', // Intake Air Temperature
      '10', // MAF Air Flow Rate
      '0B', // Intake Manifold Absolute Pressure
      '11', // Throttle Position
      '2F', // Fuel Tank Level Input
    ];

    return commonPIDs;
  }

  private parseOBDResponse(pid: string, rawResponse: string): OBDResponse {
    const timestamp = new Date();
    
    // Remove spaces and convert to uppercase
    const cleanResponse = rawResponse.replace(/\s/g, '').toUpperCase();
    
    // Basic response validation
    if (cleanResponse.length < 6) {
      throw new Error('Invalid response length');
    }

    // Extract data bytes (skip mode and PID)
    const dataBytes = cleanResponse.substring(4);
    
    return {
      pid,
      rawValue: dataBytes,
      timestamp,
      isValid: true,
      unit: this.getPIDUnit(pid),
      description: this.getPIDDescription(pid)
    };
  }

  private parseVIN(response: string): string {
    // Simplified VIN parsing
    // In a real implementation, you would properly parse the multi-line response
    const cleanResponse = response.replace(/[^A-Z0-9]/g, '');
    return cleanResponse.substring(0, 17);
  }

  private getProtocolCommand(protocol: OBDProtocol): string {
    const protocolMap: Record<OBDProtocol, string> = {
      'AUTO': 'ATSP0',
      'ISO9141-2': 'ATSP3',
      'KWP2000_5_BAUD': 'ATSP1',
      'KWP2000_FAST': 'ATSP2',
      'CAN_11BIT_500K': 'ATSP6',
      'CAN_29BIT_500K': 'ATSP7',
      'CAN_11BIT_250K': 'ATSP8',
      'CAN_29BIT_250K': 'ATSP9'
    };

    return protocolMap[protocol] || 'ATSP0';
  }

  private getPIDUnit(pid: string): string {
    const unitMap: Record<string, string> = {
      '0C': 'rpm',
      '0D': 'km/h',
      '05': '°C',
      '0F': '°C',
      '10': 'g/s',
      '0B': 'kPa',
      '11': '%',
      '2F': '%'
    };

    return unitMap[pid] || '';
  }

  private getPIDDescription(pid: string): string {
    const descriptionMap: Record<string, string> = {
      '0C': 'Engine RPM',
      '0D': 'Vehicle Speed',
      '05': 'Engine Coolant Temperature',
      '0F': 'Intake Air Temperature',
      '10': 'MAF Air Flow Rate',
      '0B': 'Intake Manifold Absolute Pressure',
      '11': 'Throttle Position',
      '2F': 'Fuel Tank Level Input'
    };

    return descriptionMap[pid] || `PID ${pid}`;
  }
}