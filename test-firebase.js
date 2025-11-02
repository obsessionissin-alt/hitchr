require('dotenv').config();
const admin = require('./src/config/firebase');

console.log('Testing Firebase Admin SDK...');
console.log('Admin object:', typeof admin);
console.log('Admin.auth:', typeof admin.auth);

if (typeof admin.auth === 'function') {
  console.log('✅ Firebase Admin SDK is working!');
} else {
  console.log('❌ Firebase Admin SDK is NOT working!');
  console.log('Available methods:', Object.keys(admin));
}
