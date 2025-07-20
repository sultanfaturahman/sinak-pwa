# Firestore "Client is Offline" Troubleshooting Guide

## Overview

The "Failed to get document because the client is offline" error is a common Firestore connectivity issue that doesn't necessarily mean your internet connection is down. This guide helps diagnose and fix the root causes.

## Common Causes & Solutions

### 1. 🔑 API Key Issues

#### Problem
- Invalid or restricted API key
- API key doesn't have Firestore permissions

#### Solution
```bash
# Check your .env file
VITE_FIREBASE_API_KEY=your_actual_api_key_here

# Verify in Firebase Console:
# 1. Go to Project Settings > General
# 2. Check if API key matches
# 3. Go to Project Settings > Service Accounts
# 4. Verify Firestore permissions
```

### 2. 🌐 CORS Configuration

#### Problem
- Firebase project not configured for your domain
- Localhost not in authorized domains

#### Solution
1. **Firebase Console** → **Authentication** → **Settings** → **Authorized Domains**
2. Add these domains:
   ```
   localhost
   127.0.0.1
   your-production-domain.com
   ```

### 3. 🔒 Firestore Security Rules

#### Problem
- Security rules blocking read/write access
- Rules not configured for authenticated users

#### Solution
```javascript
// Firestore Rules (Firebase Console → Firestore → Rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow read access to public collections
    match /public/{document=**} {
      allow read: if true;
    }
  }
}
```

### 4. 🏗️ Project Configuration

#### Problem
- Firestore not enabled in Firebase project
- Wrong project ID in configuration

#### Solution
1. **Enable Firestore**:
   - Firebase Console → Firestore Database → Create Database
   - Choose production mode or test mode
   - Select region (preferably closest to users)

2. **Verify Project ID**:
   ```javascript
   // Check firebase.js configuration
   projectId: "sinaik-pwa" // Must match Firebase Console
   ```

### 5. 🌍 Network Configuration

#### Problem
- Corporate firewall blocking Firebase
- Proxy server interfering
- DNS resolution issues

#### Solution
```bash
# Test Firebase connectivity
curl -I https://firestore.googleapis.com

# Check DNS resolution
nslookup firestore.googleapis.com

# Test from different network if possible
```

## Diagnostic Steps

### Step 1: Check Browser Console

Look for these specific error patterns:

```javascript
// Good signs
✅ Firebase configuration validated
✅ Firestore network enabled successfully
✅ Firestore connection test successful

// Warning signs
⚠️ Firestore connection test failed
❌ Failed to get user document: FirebaseError: Failed to get document because the client is offline

// Error codes to watch for
- unavailable: Service temporarily unavailable
- permission-denied: Security rules or authentication issue
- unauthenticated: User not properly authenticated
```

### Step 2: Network Tab Analysis

1. **Open Developer Tools** → **Network Tab**
2. **Filter by "firestore"**
3. **Look for failed requests**:
   - Status 400: Bad request (usually configuration)
   - Status 403: Forbidden (security rules)
   - Status 404: Not found (wrong project ID)
   - Status 500: Server error

### Step 3: Test Authentication

```javascript
// Test in browser console
import { auth } from './src/services/firebase.js';
console.log('Current user:', auth.currentUser);
console.log('Auth state:', auth.currentUser ? 'authenticated' : 'not authenticated');
```

### Step 4: Manual Firestore Test

```javascript
// Test in browser console
import { db } from './src/services/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

const testDoc = doc(db, 'test', 'connection');
getDoc(testDoc)
  .then(() => console.log('✅ Firestore working'))
  .catch(error => console.error('❌ Firestore error:', error));
```

## Environment-Specific Solutions

### Development Environment

```env
# .env file for development
VITE_FIREBASE_API_KEY=your_dev_api_key
VITE_FIREBASE_PROJECT_ID=sinaik-pwa-dev
VITE_USE_FIREBASE_EMULATOR=true  # Optional: use local emulator
```

### Production Environment

```env
# .env.production file
VITE_FIREBASE_API_KEY=your_prod_api_key
VITE_FIREBASE_PROJECT_ID=sinaik-pwa
VITE_FIREBASE_AUTH_DOMAIN=sinaik-pwa.firebaseapp.com
```

## Quick Fixes

### Fix 1: Clear Browser Data
```bash
# Clear browser cache and cookies
# Chrome: Settings → Privacy → Clear browsing data
# Firefox: Settings → Privacy → Clear Data
```

### Fix 2: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Fix 3: Check Firebase Status
- Visit [Firebase Status Page](https://status.firebase.google.com/)
- Check for ongoing incidents

### Fix 4: Verify Project Settings
1. Firebase Console → Project Settings
2. Check project ID matches your code
3. Verify API keys are active
4. Ensure billing is enabled (if using paid features)

## Advanced Debugging

### Enable Firestore Debug Logging

```javascript
// Add to firebase.js for detailed logging
import { connectFirestoreEmulator } from 'firebase/firestore';

if (import.meta.env.DEV) {
  // Enable debug logging
  import('firebase/firestore').then(({ enableNetwork }) => {
    enableNetwork(db).then(() => {
      console.log('🔍 Firestore debug mode enabled');
    });
  });
}
```

### Monitor Connection State

```javascript
// Add connection monitoring
const monitorConnection = () => {
  const unsubscribe = onSnapshot(
    doc(db, 'test', 'connection'),
    (doc) => {
      console.log('✅ Firestore connected:', doc.exists());
    },
    (error) => {
      console.error('❌ Firestore connection error:', error);
    }
  );
  
  return unsubscribe;
};
```

## Prevention Strategies

### 1. Implement Offline Support
```javascript
// Enable offline persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .then(() => console.log('✅ Offline persistence enabled'))
  .catch(error => console.warn('⚠️ Offline persistence failed:', error));
```

### 2. Add Retry Logic
```javascript
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. Graceful Degradation
```javascript
// Always provide fallback functionality
const getUserData = async (userId) => {
  try {
    return await getFirestoreData(userId);
  } catch (error) {
    console.warn('Using local storage fallback');
    return getLocalStorageData(userId);
  }
};
```

## When to Contact Support

Contact Firebase Support if:
- ✅ All troubleshooting steps completed
- ✅ Error persists across different networks
- ✅ Other Firebase services work fine
- ✅ Error started suddenly without code changes
- ✅ Multiple users reporting same issue

## Useful Resources

- [Firebase Status](https://status.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)
- [Stack Overflow Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)

---

**Remember**: The "client is offline" error is usually a configuration or connectivity issue, not an actual offline state. Systematic debugging will identify the root cause.
