// Simple test file to verify vehicle validation functions
// Note: This is a basic test without a testing framework
// In a real project, you would use Jest or another testing framework

import { 
  validateVehicleForm, 
  hasValidationErrors, 
  formatEngineSize, 
  formatYear,
  VehicleFormData 
} from '../vehicleValidators';
import { FuelType } from '../../../types/entities/vehicle';

// Test data
const validVehicleData: VehicleFormData = {
  name: 'Honda Civic 2020',
  make: 'Honda',
  model: 'Civic',
  year: '2020',
  fuelType: 'flex',
  engineSize: '1.6',
};

const invalidVehicleData: VehicleFormData = {
  name: '',
  make: '',
  model: '',
  year: 'invalid',
  fuelType: '',
  engineSize: 'invalid',
};

// Simple test runner
function runTests() {
  console.log('Running Vehicle Validator Tests...\n');

  // Test 1: Valid data should pass validation
  console.log('Test 1: Valid vehicle data');
  const validErrors = validateVehicleForm(validVehicleData);
  const hasErrors = hasValidationErrors(validErrors);
  console.log('Has errors:', hasErrors);
  console.log('Errors:', validErrors);
  console.log('✅ Expected: false, Got:', hasErrors, hasErrors === false ? 'PASS' : 'FAIL');
  console.log('');

  // Test 2: Invalid data should fail validation
  console.log('Test 2: Invalid vehicle data');
  const invalidErrors = validateVehicleForm(invalidVehicleData);
  const hasInvalidErrors = hasValidationErrors(invalidErrors);
  console.log('Has errors:', hasInvalidErrors);
  console.log('Errors:', invalidErrors);
  console.log('✅ Expected: true, Got:', hasInvalidErrors, hasInvalidErrors === true ? 'PASS' : 'FAIL');
  console.log('');

  // Test 3: Engine size formatting
  console.log('Test 3: Engine size formatting');
  const testCases = [
    { input: '1,6', expected: '1.6' },
    { input: '2.0L', expected: '2.0' },
    { input: 'abc1.5def', expected: '1.5' },
    { input: '3.14159', expected: '3.1' },
  ];

  testCases.forEach((testCase, index) => {
    const result = formatEngineSize(testCase.input);
    console.log(`  ${index + 1}. Input: "${testCase.input}" -> Output: "${result}"`);
    console.log(`     Expected: "${testCase.expected}", Got: "${result}"`, 
      result === testCase.expected ? 'PASS' : 'FAIL');
  });
  console.log('');

  // Test 4: Year formatting
  console.log('Test 4: Year formatting');
  const yearTestCases = [
    { input: '2020abc', expected: '2020' },
    { input: 'abc2021', expected: '2021' },
    { input: '20222023', expected: '2022' },
    { input: 'no-numbers', expected: '' },
  ];

  yearTestCases.forEach((testCase, index) => {
    const result = formatYear(testCase.input);
    console.log(`  ${index + 1}. Input: "${testCase.input}" -> Output: "${result}"`);
    console.log(`     Expected: "${testCase.expected}", Got: "${result}"`, 
      result === testCase.expected ? 'PASS' : 'FAIL');
  });
  console.log('');

  // Test 5: Specific validation rules
  console.log('Test 5: Specific validation rules');
  
  // Test name validation
  const shortNameData = { ...validVehicleData, name: 'A' };
  const shortNameErrors = validateVehicleForm(shortNameData);
  console.log('Short name error:', shortNameErrors.name);
  console.log('✅ Expected error for short name:', shortNameErrors.name ? 'PASS' : 'FAIL');

  // Test year validation
  const oldYearData = { ...validVehicleData, year: '1989' };
  const oldYearErrors = validateVehicleForm(oldYearData);
  console.log('Old year error:', oldYearErrors.year);
  console.log('✅ Expected error for old year:', oldYearErrors.year ? 'PASS' : 'FAIL');

  // Test fuel type validation
  const invalidFuelData = { ...validVehicleData, fuelType: 'invalid' as FuelType };
  const invalidFuelErrors = validateVehicleForm(invalidFuelData);
  console.log('Invalid fuel type error:', invalidFuelErrors.fuelType);
  console.log('✅ Expected error for invalid fuel type:', invalidFuelErrors.fuelType ? 'PASS' : 'FAIL');

  console.log('\nAll tests completed!');
}

// Export for potential use in other files
export { runTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // This is likely Node.js environment, run tests
  runTests();
}