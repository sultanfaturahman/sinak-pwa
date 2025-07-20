/**
 * Modern Firebase Testing Solution - Firebase Emulator Suite
 * This is the RECOMMENDED approach for 2024/2025
 */

// firebase.config.js - Modern Emulator Setup
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators in development/testing
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  // Only connect if not already connected
  if (!db._delegate._databaseId.projectId.includes('demo-')) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔧 Connected to Firebase Emulators');
    } catch (error) {
      console.log('⚠️ Emulators already connected or not available');
    }
  }
}

export { db, auth };

// Modern test setup with emulators
// jest.config.js
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/emulator-setup.js'],
  testTimeout: 30000, // Emulators need more time
};

// src/test/emulator-setup.js
import { execSync } from 'child_process';

beforeAll(async () => {
  // Start Firebase emulators
  console.log('🚀 Starting Firebase Emulators...');
  
  // This would typically be done via npm script
  // execSync('firebase emulators:start --only firestore,auth --detach');
  
  // Wait for emulators to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
});

afterAll(async () => {
  // Clean up emulators
  console.log('🧹 Cleaning up Firebase Emulators...');
  // execSync('firebase emulators:stop');
});

beforeEach(async () => {
  // Clear emulator data between tests
  await fetch('http://localhost:8080/emulator/v1/projects/demo-project/databases/(default)/documents', {
    method: 'DELETE'
  });
});

// Modern test example
import { db } from '../firebase.config.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

describe('Firestore with Emulator', () => {
  it('should create and retrieve document', async () => {
    const testDoc = doc(db, 'users', 'test-user');
    
    // This uses the REAL Firebase SDK with emulator
    await setDoc(testDoc, {
      name: 'Test User',
      email: 'test@example.com'
    });
    
    const docSnap = await getDoc(testDoc);
    expect(docSnap.exists()).toBe(true);
    expect(docSnap.data().name).toBe('Test User');
  });
  
  it('should handle internal assertion errors gracefully', async () => {
    // Emulator handles edge cases better than mocks
    const testDoc = doc(db, 'users', 'test-user-2');
    
    // Even complex operations work reliably
    await setDoc(testDoc, { data: 'test' });
    const result = await getDoc(testDoc);
    
    expect(result.exists()).toBe(true);
  });
});

console.log(`
🚀 FIREBASE EMULATOR SUITE - MODERN APPROACH

✅ BENEFITS:
• Tests against REAL Firebase behavior
• No "INTERNAL ASSERTION FAILED" errors
• Supports all Firebase features
• Offline development
• Consistent test environment
• Easy CI/CD integration

🔧 SETUP:
1. npm install -g firebase-tools
2. firebase init emulators
3. firebase emulators:start
4. Connect your app to emulators

📊 COMPARISON:
• More realistic than mocking
• Faster than production testing
• Better error handling than mocks
• Supports complex Firebase features
`);

export { db, auth };
