#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 KMBio Performance Diagnostic Tool\n');

// Check Node.js version
console.log('📋 System Information:');
console.log(`Node.js: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);

// Check package sizes
console.log('\n📦 Bundle Analysis:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  const devDeps = Object.keys(packageJson.devDependencies || {});
  
  console.log(`Dependencies: ${deps.length}`);
  console.log(`Dev Dependencies: ${devDeps.length}`);
  
  // Check for heavy packages
  const heavyPackages = [
    'react-native-vector-icons',
    '@react-navigation/native',
    'react-native-ble-plx',
    '@supabase/supabase-js'
  ];
  
  console.log('\n🏋️ Heavy Packages Found:');
  heavyPackages.forEach(pkg => {
    if (deps.includes(pkg)) {
      console.log(`  ✓ ${pkg}`);
    }
  });
} catch (error) {
  console.log('❌ Could not analyze package.json');
}

// Check Metro cache
console.log('\n🗂️ Cache Status:');
const cacheDir = '.metro-cache';
if (fs.existsSync(cacheDir)) {
  console.log('✓ Metro cache directory exists');
} else {
  console.log('❌ Metro cache directory not found');
}

// Check for common performance issues
console.log('\n⚠️ Performance Recommendations:');

// Check if using tunnel
console.log('1. Connection Type:');
console.log('   • Use --lan instead of --tunnel when possible');
console.log('   • Use --localhost for fastest development');
console.log('   • Only use --tunnel when necessary (firewall/network issues)');

console.log('\n2. Bundle Optimization:');
console.log('   • Clear Metro cache: npm run start:clear');
console.log('   • Use production build for testing: expo build');
console.log('   • Enable Hermes engine for better performance');

console.log('\n3. Network Optimization:');
console.log('   • Ensure stable WiFi connection');
console.log('   • Close unnecessary applications');
console.log('   • Use USB debugging when possible');

console.log('\n🚀 Quick Fixes for Expo Go:');
console.log('1. Reset everything: npm run reset');
console.log('2. Use optimized mode: npm run start:expo-go');
console.log('3. Fast mode (no dev tools): npm run start:tunnel:fast');
console.log('4. Clear cache only: npm run clean');

console.log('\n📱 Expo Go Specific Tips:');
console.log('• Keep Metro bundler running between changes');
console.log('• Use stable WiFi connection');
console.log('• Close other network-heavy applications');
console.log('• Make small, incremental changes');

console.log('\n⚡ Performance Commands:');
console.log('• npm run start:expo-go     - Optimized for Expo Go');
console.log('• npm run start:tunnel:fast - Fastest tunnel mode');
console.log('• npm run reset            - Complete reset');

console.log('\n✅ Diagnostic complete!');