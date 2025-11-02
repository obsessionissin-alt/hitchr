// backend/src/config/firebase-admin.js
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check multiple possible locations for service account
const possiblePaths = [
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  path.join(__dirname, '../../firebase-service-account.json'),
  path.join(__dirname, '../../../firebase-service-account.json'),
  './firebase-service-account.json',
];

let serviceAccount;
let serviceAccountPath;

// Try each path until we find the file
for (const testPath of possiblePaths.filter(Boolean)) {
  try {
    if (fs.existsSync(testPath)) {
      serviceAccount = require(testPath);
      serviceAccountPath = testPath;
      console.log('✅ Firebase service account found at:', testPath);
      break;
    }
  } catch (error) {
    // Try next path
  }
}

if (!serviceAccount) {
  console.error('❌ Firebase service account not found!');
  console.error('   Tried these locations:');
  possiblePaths.filter(Boolean).forEach(p => console.error('   -', p));
  console.error('');
  console.error('   Please:');
  console.error('   1. Download from Firebase Console > Project Settings > Service Accounts');
  console.error('   2. Save as: ~/Documents/hitchr/backend/firebase-service-account.json');
  console.error('   OR set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
  throw new Error('Firebase service account required for production');
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`,
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  throw error;
}

module.exports = admin;