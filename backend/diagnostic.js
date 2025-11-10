// backend/diagnostic.js
// Run this to check if rideController is set up correctly
// Usage: node diagnostic.js

console.log('🔍 HITCH Backend Diagnostic');
console.log('============================\n');

// Test 1: Check if rideController file exists
console.log('📁 Test 1: Check rideController file');
try {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'src', 'controllers', 'rideController.js');
  
  if (fs.existsSync(filePath)) {
    console.log('✅ File exists:', filePath);
    const stats = fs.statSync(filePath);
    console.log('   Size:', stats.size, 'bytes');
    
    // Check if file has content
    if (stats.size < 100) {
      console.log('❌ WARNING: File is too small, might be empty!');
    }
  } else {
    console.log('❌ File NOT found:', filePath);
  }
} catch (error) {
  console.log('❌ Error checking file:', error.message);
}
console.log('');

// Test 2: Try to require rideController
console.log('📦 Test 2: Try to load rideController');
try {
  const rideController = require('./src/controllers/rideController');
  console.log('✅ Module loaded successfully');
  console.log('   Exported functions:', Object.keys(rideController));
  
  // Check each required function
  const requiredFunctions = [
    'createRide',
    'getRideById',
    'acceptRide',
    'startRide',
    'endRide',
    'getUserRides'
  ];
  
  console.log('\n   Function checks:');
  requiredFunctions.forEach(fnName => {
    if (typeof rideController[fnName] === 'function') {
      console.log(`   ✅ ${fnName} - exists`);
    } else {
      console.log(`   ❌ ${fnName} - MISSING or not a function`);
    }
  });
} catch (error) {
  console.log('❌ Error loading module:', error.message);
  console.log('   Stack:', error.stack);
}
console.log('');

// Test 3: Check database connection
console.log('💾 Test 3: Check database config');
try {
  const dbConfig = require('./src/config/database');
  console.log('✅ Database config loaded');
} catch (error) {
  console.log('❌ Error loading database config:', error.message);
}
console.log('');

// Test 4: Check middleware
console.log('🔐 Test 4: Check authMiddleware');
try {
  const authMiddleware = require('./src/middleware/auth.js');
  console.log('✅ Auth middleware loaded');
  console.log('   Type:', typeof authMiddleware);
} catch (error) {
  console.log('❌ Error loading auth middleware:', error.message);
}
console.log('');

console.log('============================');
console.log('✅ Diagnostic complete!\n');
console.log('If you see any ❌ errors above, fix those files first.');
console.log('\nNext steps:');
console.log('1. Make sure rideController.js has all 6 functions');
console.log('2. Check that each function uses exports.functionName = ...');
console.log('3. Restart backend: npm run dev');
