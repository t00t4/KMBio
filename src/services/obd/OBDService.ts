import { BLEServiceInterface, OBDServiceInterface } from '../../types/ble';
import { OBDResponse, OBDProtocol, ELM327Config, PIDSupport } from '../../types/ble/obd-protocol';
import { OBD_PIDS, PID_DEFINITIONS, ELM327_COMMANDS, PID_GROUPS, PID_FALLBACKS } from '../../constants/pids';

export class OBDService implements OBDServiceInterface {
  private bleService: BLEServiceInterface;
  private isInitialized: boolean = false;
  private supportedPIDs: Map<string, PIDSupport> = new Map();
  private currentProtocol?: OBDProtocol;
  private elm327Config: ELM327Config;
  private commandTimeout: number = 5000; // 5 seconds
  private lastCommandTime: number = 0;
  private minCommandInterval: number = 100; // 100ms between commands

  constructor(bleService: BLEServiceInterface) {
    this.bleService = bleService;
    this.elm327Config = {
      echo: false,
      linefeed: false,
      headers: true,
      spaces: false,
      protocol: 'AUTO',
      timeout: 5000,
      adaptiveTiming: true,
    };
  }

  async initialize(): Promise<void> {
    if (!this.bleService.isConnected()) {
      throw new Error('BLE device not connected');
    }

    try {
      console.log('Initializing ELM327 adapter...');
      
      // Reset the ELM327 adapter
      await this.resetAdapter();

      // Wait for adapter to be ready
      await this.delay(2000);

      // Test basic communication and verify ELM327
      const versionResponse = await this.sendATCommand(ELM327_COMMANDS.RESET);
      if (!versionResponse.includes('ELM327')) {
        throw new Error('Device is not responding as ELM327');
      }

      console.log('ELM327 detected:', versionResponse);

      // Configure ELM327 settings
      await this.configureELM327();

      // Detect and set optimal protocol
      await this.detectProtocol();

      // Test OBD-II communication
      const isValidConnection = await this.validateConnection();
      if (!isValidConnection) {
        throw new Error('OBD-II communication test failed');
      }

      // Discover supported PIDs
      await this.discoverSupportedPIDs();

      this.isInitialized = true;
      console.log('OBD service initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      throw new Error(`OBD initialization failed: ${error}`);
    }
  }

  async getSupportedPIDs(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return Array.from(this.supportedPIDs.keys()).filter(pid => 
      this.supportedPIDs.get(pid)?.isSupported === true
    );
  }

  async readPID(pid: string): Promise<OBDResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if PID is supported
    const pidSupport = this.supportedPIDs.get(pid);
    if (!pidSupport?.isSupported) {
      // Try fallback PID if available
      const fallbackPID = PID_FALLBACKS[pid as keyof typeof PID_FALLBACKS]?.[0];
      if (fallbackPID && this.supportedPIDs.get(fallbackPID)?.isSupported) {
        console.log(`Using fallback PID ${fallbackPID} for ${pid}`);
        const fallbackResponse = await this.readPID(fallbackPID);
        // Return response with original PID but fallback data
        return {
          ...fallbackResponse,
          pid: pid, // Keep original PID in response
          description: `${fallbackResponse.description} (fallback from ${fallbackPID})`,
        };
      }
      throw new Error(`PID ${pid} not supported by vehicle`);
    }

    try {
      // Ensure minimum interval between commands
      await this.enforceCommandInterval();

      const command = `01${pid.replace('01', '')}`;
      const rawResponse = await this.sendOBDCommand(command);

      if (this.isErrorResponse(rawResponse)) {
        throw new Error(`Error reading PID ${pid}: ${rawResponse}`);
      }

      return this.parseOBDResponse(pid, rawResponse);
    } catch (error) {
      console.error(`Failed to read PID ${pid}:`, error);
      throw error;
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
      console.log('Validating OBD-II connection...');
      
      // Test with supported PIDs query
      const response = await this.sendOBDCommand('0100');
      
      if (this.isErrorResponse(response)) {
        console.error('OBD validation failed:', response);
        return false;
      }

      // Try to read a basic PID (Engine RPM) to confirm communication
      try {
        const rpmResponse = await this.sendOBDCommand('010C');
        if (this.isErrorResponse(rpmResponse)) {
          console.warn('RPM PID not available, but basic OBD communication works');
        } else {
          console.log('OBD validation successful - RPM data available');
        }
      } catch (error) {
        console.warn('RPM test failed, but basic OBD communication works:', error);
      }

      return true;
    } catch (error) {
      console.error('OBD validation error:', error);
      return false;
    }
  }

  public validateOBDResponse(response: OBDResponse): boolean {
    if (!response.isValid) {
      return false;
    }

    // Check if we have a PID definition for validation
    const pidDef = PID_DEFINITIONS[response.pid];
    if (!pidDef) {
      return true; // Can't validate unknown PIDs, assume valid
    }

    // Validate processed value is within expected range
    if (response.processedValue !== undefined) {
      const value = response.processedValue;
      if (value < pidDef.minValue || value > pidDef.maxValue) {
        console.warn(`PID ${response.pid} value ${value} outside valid range [${pidDef.minValue}, ${pidDef.maxValue}]`);
        return false;
      }
    }

    // Validate raw value length matches expected bytes (allow some flexibility for different formats)
    const expectedLength = pidDef.bytes * 2; // 2 hex chars per byte
    const actualLength = response.rawValue.replace(/\s/g, '').length; // Remove spaces
    if (actualLength !== expectedLength && actualLength !== expectedLength + 4) { // Allow for mode+PID prefix
      console.warn(`PID ${response.pid} raw value length ${actualLength} doesn't match expected ${expectedLength}`);
      return false;
    }

    return true;
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
      await this.sendATCommand(ELM327_COMMANDS.RESET);
      // Wait for adapter to reset
      await this.delay(2000);
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
    // Determine if this is an AT command or OBD command
    if (command.startsWith('AT') || command.startsWith('at')) {
      return this.sendATCommand(command);
    } else {
      return this.sendOBDCommand(command);
    }
  }

  private async sendATCommand(command: string): Promise<string> {
    if (!this.bleService.isConnected()) {
      throw new Error('BLE device not connected');
    }

    try {
      console.log(`Sending AT command: ${command}`);
      const response = await this.bleService.sendCommand(command + '\r');
      const cleanResponse = response.replace(/\r|\n|>/g, '').trim();
      console.log(`AT response: ${cleanResponse}`);
      return cleanResponse;
    } catch (error) {
      throw new Error(`AT command failed: ${error}`);
    }
  }

  private async sendOBDCommand(command: string): Promise<string> {
    if (!this.bleService.isConnected()) {
      throw new Error('BLE device not connected');
    }

    try {
      console.log(`Sending OBD command: ${command}`);
      const response = await this.bleService.sendCommand(command + '\r');
      const cleanResponse = response.replace(/\r|\n|>/g, '').trim();
      console.log(`OBD response: ${cleanResponse}`);
      return cleanResponse;
    } catch (error) {
      throw new Error(`OBD command failed: ${error}`);
    }
  }

  private async configureELM327(): Promise<void> {
    console.log('Configuring ELM327 settings...');
    
    // Configure based on elm327Config
    if (!this.elm327Config.echo) {
      await this.sendATCommand(ELM327_COMMANDS.ECHO_OFF);
    }
    
    if (!this.elm327Config.linefeed) {
      await this.sendATCommand(ELM327_COMMANDS.LINEFEED_OFF);
    }
    
    if (!this.elm327Config.spaces) {
      await this.sendATCommand(ELM327_COMMANDS.SPACES_OFF);
    }
    
    if (!this.elm327Config.headers) {
      await this.sendATCommand(ELM327_COMMANDS.HEADERS_OFF);
    }
    
    // Set timeout
    const timeoutHex = Math.floor(this.elm327Config.timeout / 200).toString(16).padStart(2, '0');
    await this.sendATCommand(`${ELM327_COMMANDS.SET_TIMEOUT}${timeoutHex}`);
    
    // Configure adaptive timing
    if (this.elm327Config.adaptiveTiming) {
      await this.sendATCommand(ELM327_COMMANDS.ADAPTIVE_TIMING_ON);
    } else {
      await this.sendATCommand(ELM327_COMMANDS.ADAPTIVE_TIMING_OFF);
    }
  }

  private async detectProtocol(): Promise<void> {
    console.log('Detecting OBD protocol...');
    
    // Set to auto protocol detection
    await this.sendATCommand(ELM327_COMMANDS.PROTOCOL_AUTO);
    
    // Try a basic OBD command to trigger protocol detection
    try {
      await this.sendOBDCommand('0100');
      
      // Get the detected protocol
      const protocolResponse = await this.sendATCommand(ELM327_COMMANDS.GET_PROTOCOL);
      console.log('Detected protocol:', protocolResponse);
      
      // Parse protocol from response
      this.currentProtocol = this.parseProtocolResponse(protocolResponse);
    } catch (error) {
      console.warn('Protocol detection failed, using AUTO:', error);
      this.currentProtocol = 'AUTO';
    }
  }

  private async discoverSupportedPIDs(): Promise<void> {
    console.log('Discovering supported PIDs...');
    
    try {
      // Query supported PIDs in ranges
      const pidRanges = [
        { command: '0100', range: '01-20' },
        { command: '0120', range: '21-40' },
        { command: '0140', range: '41-60' },
      ];

      for (const range of pidRanges) {
        try {
          const response = await this.sendOBDCommand(range.command);
          if (!this.isErrorResponse(response)) {
            const supportedPIDs = this.parseSupportedPIDsFromHex(response, range.range);
            supportedPIDs.forEach(pid => {
              this.supportedPIDs.set(pid, {
                pid,
                isSupported: true,
                testedAt: new Date(),
              });
            });
          }
        } catch (error) {
          console.warn(`Failed to query PID range ${range.range}:`, error);
        }
      }

      // Test essential PIDs individually if not found in ranges
      await this.testEssentialPIDs();
      
      console.log('Supported PIDs discovered:', Array.from(this.supportedPIDs.keys()));
    } catch (error) {
      console.error('PID discovery failed:', error);
      // Fallback to common PIDs
      this.setFallbackPIDs();
    }
  }

  private async testEssentialPIDs(): Promise<void> {
    const essentialPIDs = PID_GROUPS.ESSENTIAL;
    
    for (const pid of essentialPIDs) {
      if (!this.supportedPIDs.has(pid)) {
        try {
          const command = `01${pid.replace('01', '')}`;
          const response = await this.sendOBDCommand(command);
          
          const isSupported = !this.isErrorResponse(response);
          this.supportedPIDs.set(pid, {
            pid,
            isSupported,
            testedAt: new Date(),
          });
          
          if (isSupported) {
            console.log(`Essential PID ${pid} is supported`);
          }
        } catch (error) {
          console.warn(`Failed to test essential PID ${pid}:`, error);
          this.supportedPIDs.set(pid, {
            pid,
            isSupported: false,
            testedAt: new Date(),
          });
        }
      }
    }
  }

  private setFallbackPIDs(): void {
    console.log('Setting fallback PIDs...');
    
    // Assume common PIDs are supported as fallback
    const commonPIDs = [
      OBD_PIDS.ENGINE_RPM,
      OBD_PIDS.VEHICLE_SPEED,
      OBD_PIDS.ENGINE_COOLANT_TEMP,
      OBD_PIDS.THROTTLE_POSITION,
    ];

    commonPIDs.forEach(pid => {
      this.supportedPIDs.set(pid, {
        pid,
        isSupported: true,
        testedAt: new Date(),
        estimationMethod: 'lookup',
      });
    });
  }

  private async enforceCommandInterval(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCommand = now - this.lastCommandTime;
    
    if (timeSinceLastCommand < this.minCommandInterval) {
      const waitTime = this.minCommandInterval - timeSinceLastCommand;
      await this.delay(waitTime);
    }
    
    this.lastCommandTime = Date.now();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isErrorResponse(response: string): boolean {
    const errorPatterns = [
      'NO DATA',
      'ERROR',
      'UNABLE TO CONNECT',
      'BUS INIT',
      'BUS ERROR',
      'CAN ERROR',
      'DATA ERROR',
      'STOPPED',
      '?',
    ];

    return errorPatterns.some(pattern => 
      response.toUpperCase().includes(pattern)
    );
  }

  private parseProtocolResponse(response: string): OBDProtocol {
    const protocolMap: Record<string, OBDProtocol> = {
      'ISO 9141-2': 'ISO9141-2',
      'KWP2000': 'KWP2000_FAST',
      'CAN 11/500': 'CAN_11BIT_500K',
      'CAN 29/500': 'CAN_29BIT_500K',
      'CAN 11/250': 'CAN_11BIT_250K',
      'CAN 29/250': 'CAN_29BIT_250K',
    };

    for (const [key, protocol] of Object.entries(protocolMap)) {
      if (response.includes(key)) {
        return protocol;
      }
    }

    return 'AUTO';
  }

  private parseSupportedPIDsFromHex(response: string, range: string): string[] {
    const supportedPIDs: string[] = [];
    
    try {
      // Remove spaces and extract hex data
      const cleanResponse = response.replace(/\s/g, '').toUpperCase();
      
      // Find the data part (after mode and PID)
      // Format: 41 00 XX XX XX XX (for PID 00 response)
      const dataMatch = cleanResponse.match(/41[0-9A-F]{2}([0-9A-F]{8})/);
      if (!dataMatch) {
        console.warn('Could not parse PID support response:', response);
        return supportedPIDs;
      }

      const hexData = dataMatch[1];
      
      // Convert hex to binary and check each bit
      const binaryData = this.hexToBinary(hexData);
      
      // Determine base PID number based on range
      let basePID = 1;
      if (range === '21-40') basePID = 33;
      else if (range === '41-60') basePID = 65;
      
      // Check each bit (32 bits total)
      for (let i = 0; i < 32; i++) {
        if (binaryData[i] === '1') {
          const pidNumber = basePID + i;
          const pidHex = `01${pidNumber.toString(16).padStart(2, '0').toUpperCase()}`;
          supportedPIDs.push(pidHex);
        }
      }
      
      console.log(`PIDs supported in range ${range}:`, supportedPIDs);
    } catch (error) {
      console.error('Error parsing supported PIDs:', error);
    }
    
    return supportedPIDs;
  }

  private hexToBinary(hex: string): string {
    let binary = '';
    for (let i = 0; i < hex.length; i++) {
      const digit = parseInt(hex[i], 16);
      binary += digit.toString(2).padStart(4, '0');
    }
    return binary;
  }

  private parseOBDResponse(pid: string, rawResponse: string): OBDResponse {
    const timestamp = new Date();
    
    try {
      // Remove spaces and convert to uppercase
      const cleanResponse = rawResponse.replace(/\s/g, '').toUpperCase();
      
      // Validate response format (should be 41XXYYY... where XX is PID and YYY is data)
      if (cleanResponse.length < 6) {
        throw new Error('Invalid response length');
      }

      if (!cleanResponse.startsWith('41')) {
        throw new Error('Invalid response mode');
      }

      // Extract PID from response and validate
      const responsePID = cleanResponse.substring(2, 4);
      const expectedPID = pid.replace('01', '').toUpperCase();
      
      if (responsePID !== expectedPID) {
        throw new Error(`PID mismatch: expected ${expectedPID}, got ${responsePID}`);
      }

      // Extract data bytes
      const dataBytes = cleanResponse.substring(4);
      
      // Get PID definition for processing
      const pidDef = PID_DEFINITIONS[pid];
      if (!pidDef) {
        // Return raw response for unknown PIDs
        return {
          pid,
          rawValue: dataBytes,
          timestamp,
          isValid: true,
          unit: '',
          description: `Unknown PID ${pid}`,
        };
      }

      // Parse and calculate processed value
      const processedValue = this.calculatePIDValue(dataBytes, pidDef.formula);
      
      return {
        pid,
        rawValue: dataBytes,
        processedValue,
        timestamp,
        isValid: true,
        unit: pidDef.unit,
        description: pidDef.description,
      };
    } catch (error) {
      console.error(`Error parsing OBD response for PID ${pid}:`, error);
      
      return {
        pid,
        rawValue: rawResponse,
        timestamp,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        unit: '',
        description: `Error parsing PID ${pid}`,
      };
    }
  }

  private calculatePIDValue(dataBytes: string, formula: string): number {
    try {
      // Convert hex bytes to decimal values
      const bytes: number[] = [];
      for (let i = 0; i < dataBytes.length; i += 2) {
        const hexByte = dataBytes.substring(i, i + 2);
        bytes.push(parseInt(hexByte, 16));
      }

      // Map bytes to variables A, B, C, D
      const A = bytes[0] || 0;
      const B = bytes[1] || 0;
      const C = bytes[2] || 0;
      const D = bytes[3] || 0;

      // Evaluate formula safely
      const result = this.evaluateFormula(formula, A, B, C, D);
      
      return Math.round(result * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating PID value:', error);
      throw new Error(`Formula calculation failed: ${error}`);
    }
  }

  private evaluateFormula(formula: string, A: number, B: number, C: number, D: number): number {
    // Replace variables in formula
    let expression = formula
      .replace(/A/g, A.toString())
      .replace(/B/g, B.toString())
      .replace(/C/g, C.toString())
      .replace(/D/g, D.toString());

    // Validate expression contains only safe characters
    if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
      throw new Error('Invalid formula expression');
    }

    try {
      // Use Function constructor for safe evaluation
      return new Function(`return ${expression}`)();
    } catch (error) {
      throw new Error(`Formula evaluation failed: ${error}`);
    }
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

  // Public methods for getting PID information
  
  public isPIDSupported(pid: string): boolean {
    return this.supportedPIDs.get(pid)?.isSupported === true;
  }

  public getPIDInfo(pid: string): PIDSupport | undefined {
    return this.supportedPIDs.get(pid);
  }

  public getEssentialPIDs(): string[] {
    return PID_GROUPS.ESSENTIAL.filter(pid => this.isPIDSupported(pid));
  }

  public getImportantPIDs(): string[] {
    return PID_GROUPS.IMPORTANT.filter(pid => this.isPIDSupported(pid));
  }

  public async readEssentialData(): Promise<OBDResponse[]> {
    const essentialPIDs = this.getEssentialPIDs();
    return this.readMultiplePIDs(essentialPIDs);
  }
}