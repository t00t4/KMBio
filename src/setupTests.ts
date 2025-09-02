// Jest setup file for React Native testing
// Add any global test setup here

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 30,
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openSettings: jest.fn(),
  },
  PermissionsAndroid: {
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
    request: jest.fn(),
    requestMultiple: jest.fn(),
    check: jest.fn(),
  },
  NativeModules: {},
}));

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    state: jest.fn(),
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    destroy: jest.fn(),
    onStateChange: jest.fn(),
  })),
  State: {
    PoweredOn: 'PoweredOn',
    PoweredOff: 'PoweredOff',
    Resetting: 'Resetting',
    Unauthorized: 'Unauthorized',
    Unsupported: 'Unsupported',
    Unknown: 'Unknown',
  },
}));