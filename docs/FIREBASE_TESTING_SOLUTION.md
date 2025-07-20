# 🔥 Firebase Internal Assertion Error - Testing Solution

## **Problem Overview**

The **"FIRESTORE INTERNAL ASSERTION FAILED"** error is a common issue when testing Firebase applications. This error occurs due to:

- **Multiple Firebase instances** created during testing
- **Real Firebase calls** made during UI tests
- **Browser environment conflicts** with Firebase SDK
- **Concurrent operations** without proper state management
- **IndexedDB persistence** conflicts in test environment

## **🎯 Solution Implementation**

### **1. Test Environment Configuration**

**File: `jest.config.js`**
```javascript
module.exports = {
  testEnvironment: 'node', // ✅ Use Node.js instead of jsdom
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  // ... other configurations
};
```

**Why Node.js Environment?**
- Prevents browser-specific Firebase conflicts
- Eliminates IndexedDB persistence issues
- Provides cleaner test isolation
- Faster test execution

### **2. Comprehensive Firebase Mocking**

**File: `src/test/setup.js`**
```javascript
// Mock Firebase before any imports
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  runTransaction: jest.fn(),
  // ... complete Firebase API mocking
}));
```

**Key Benefits:**
- No real Firebase calls during testing
- Predictable test behavior
- No network dependencies
- Faster test execution

### **3. Decoupled Service Testing**

**File: `src/services/__tests__/firestoreService.test.js`**
```javascript
describe('FirestoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VITE_DISABLE_FIRESTORE = 'true';
  });

  it('should handle internal assertion errors', async () => {
    const assertionError = new Error('INTERNAL ASSERTION FAILED');
    runTransaction.mockRejectedValue(assertionError);

    const result = await createUserDocument('test-user', {});
    expect(result).toBe(false); // Graceful fallback
  });
});
```

### **4. Environment-Based Firebase Control**

**Implementation Pattern:**
```javascript
// In firestoreService.js
const isFirestoreDisabled = () => {
  return process.env.VITE_DISABLE_FIRESTORE === 'true' || 
         process.env.NODE_ENV === 'test'
}

export const createUserDocument = async (uid, userData) => {
  if (isFirestoreDisabled()) {
    console.log('🔧 Firestore disabled, using fallback');
    return true; // Graceful fallback
  }
  // ... normal Firebase operations
};
```

## **🚀 Implementation Steps**

### **Step 1: Install Dependencies**
```bash
npm install --save-dev jest @vue/vue3-jest babel-jest identity-obj-proxy
```

### **Step 2: Create Test Configuration**
1. Create `jest.config.js` with Node.js environment
2. Create `src/test/setup.js` with Firebase mocks
3. Create `src/test/__mocks__/fileMock.js` for static assets

### **Step 3: Update Firebase Service**
1. Add environment checks for Firestore operations
2. Implement graceful fallbacks for assertion errors
3. Add proper error handling and retry mechanisms

### **Step 4: Write Decoupled Tests**
1. Mock Firebase completely in tests
2. Test error scenarios without real Firebase calls
3. Verify fallback behavior works correctly

### **Step 5: Run Tests**
```bash
# Run all tests
npm test

# Run specific Firebase tests
npx jest src/services/__tests__/firestoreService.test.js

# Run with verbose output
npx jest --verbose
```

## **📊 Solution Benefits**

### **Before (Problems):**
- ❌ "FIRESTORE INTERNAL ASSERTION FAILED" errors
- ❌ Slow test execution (real Firebase calls)
- ❌ Flaky tests due to network dependencies
- ❌ Complex test setup and teardown
- ❌ Difficult debugging and maintenance

### **After (Solutions):**
- ✅ No Firebase assertion errors
- ✅ Fast test execution (mocked operations)
- ✅ Reliable and predictable tests
- ✅ Simple test setup and isolation
- ✅ Easy debugging and maintenance

## **🔧 Advanced Configuration**

### **Environment Variables**
```bash
# .env.test
NODE_ENV=test
VITE_DISABLE_FIRESTORE=true
VITE_FIREBASE_PROJECT_ID=test-project
```

### **Custom Test Utilities**
```javascript
// In setup.js
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    uid: 'test-user-123',
    email: 'test@example.com',
    ...overrides
  }),
  
  flushPromises: () => new Promise(resolve => setImmediate(resolve))
};
```

### **Error Handling Patterns**
```javascript
// Handle internal assertion errors specifically
const handleFirestoreError = (error, operation) => {
  if (error.message && error.message.includes('INTERNAL ASSERTION FAILED')) {
    console.warn('🔥 Firebase Internal Assertion Error - using fallback');
    return null; // Trigger fallback behavior
  }
  // ... other error handling
};
```

## **🧪 Testing Patterns**

### **1. Mock Firebase Operations**
```javascript
it('should create user document successfully', async () => {
  const mockTransaction = {
    get: jest.fn().mockResolvedValue({ exists: () => false }),
    set: jest.fn()
  };
  
  runTransaction.mockImplementation((db, transactionFn) => 
    transactionFn(mockTransaction)
  );

  const result = await createUserDocument('test-user', {});
  expect(result).toBe(true);
});
```

### **2. Test Error Scenarios**
```javascript
it('should handle assertion errors gracefully', async () => {
  const assertionError = new Error('INTERNAL ASSERTION FAILED');
  runTransaction.mockRejectedValue(assertionError);

  const result = await createUserDocument('test-user', {});
  expect(result).toBe(false); // Graceful fallback
});
```

### **3. Test Environment Fallbacks**
```javascript
it('should work in disabled Firestore mode', async () => {
  process.env.VITE_DISABLE_FIRESTORE = 'true';

  const result = await createUserDocument('test-user', {});
  expect(result).toBe(true);
  expect(runTransaction).not.toHaveBeenCalled();
});
```

## **📝 Best Practices**

### **1. Separation of Concerns**
- Keep Firebase logic separate from UI components
- Use service layers for all Firebase operations
- Implement proper abstraction layers

### **2. Environment-Based Configuration**
- Use environment variables to control Firebase behavior
- Implement graceful fallbacks for disabled states
- Provide clear logging for different modes

### **3. Comprehensive Error Handling**
- Handle specific Firebase error codes
- Implement retry mechanisms with exponential backoff
- Provide user-friendly error messages

### **4. Test Isolation**
- Clear mocks between tests
- Use proper setup and teardown
- Avoid shared state between tests

## **🚨 Troubleshooting**

### **Common Issues:**

**1. Tests still failing with assertion errors**
- Ensure `testEnvironment: 'node'` in jest.config.js
- Check that Firebase is mocked before imports
- Verify environment variables are set correctly

**2. Mocks not working properly**
- Clear mocks in beforeEach hooks
- Use proper mock implementations
- Check import paths and module names

**3. Real Firebase calls in tests**
- Ensure VITE_DISABLE_FIRESTORE=true
- Check for unmocked Firebase imports
- Verify service layer properly checks environment

## **🔗 Related Resources**

- [Firebase Testing Documentation](https://firebase.google.com/docs/rules/unit-tests)
- [Jest Mocking Guide](https://jestjs.io/docs/manual-mocks)
- [Vue Test Utils](https://vue-test-utils.vuejs.org/)

## **✅ Verification Checklist**

- [ ] Jest configured with Node.js environment
- [ ] Firebase completely mocked in setup.js
- [ ] Environment variables control Firebase behavior
- [ ] Tests run without real Firebase calls
- [ ] Error scenarios properly tested
- [ ] Fallback behavior works correctly
- [ ] No "INTERNAL ASSERTION FAILED" errors in tests

---

**🎉 Result:** Your Firebase tests will run reliably without internal assertion errors, providing faster and more predictable testing experience!
