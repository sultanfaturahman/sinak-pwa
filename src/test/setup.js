/**
 * Jest Test Setup - Prevents Firebase Internal Assertion Errors
 * This file runs before all tests to configure the testing environment
 */

// Mock Firebase before any imports
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: 'test-app',
    options: { projectId: 'test-project' }
  })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({
    name: 'test-app',
    options: { projectId: 'test-project' }
  }))
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    _delegate: {
      _databaseId: { projectId: 'test-project' }
    }
  })),
  doc: jest.fn((db, collection, id) => ({
    id,
    path: `${collection}/${id}`,
    _key: { path: { segments: [collection, id] } }
  })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve())
  })),
  serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
  arrayUnion: jest.fn((items) => ({ _methodName: 'arrayUnion', _elements: items })),
  arrayRemove: jest.fn((items) => ({ _methodName: 'arrayRemove', _elements: items })),
  increment: jest.fn((n) => ({ _methodName: 'increment', _operand: n })),
  enableNetwork: jest.fn(() => Promise.resolve()),
  disableNetwork: jest.fn(() => Promise.resolve()),
  clearIndexedDbPersistence: jest.fn(() => Promise.resolve()),
  terminate: jest.fn(() => Promise.resolve()),
  connectFirestoreEmulator: jest.fn(),
  onSnapshot: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn()
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn()
}));

jest.mock('firebase/ai', () => ({
  getAI: jest.fn(() => ({
    app: { name: 'test-app' }
  })),
  getGenerativeModel: jest.fn(() => ({
    generateContent: jest.fn(() => Promise.resolve({
      response: {
        text: () => 'Mock AI response'
      }
    }))
  }))
}));

// Mock IndexedDB to prevent persistence errors
const mockIndexedDB = {
  open: jest.fn(() => ({
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          put: jest.fn(),
          delete: jest.fn()
        }))
      }))
    },
    onsuccess: null,
    onerror: null
  })),
  deleteDatabase: jest.fn()
};

global.indexedDB = mockIndexedDB;
global.IDBKeyRange = {
  bound: jest.fn(),
  only: jest.fn(),
  lowerBound: jest.fn(),
  upperBound: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'id-ID',
    languages: ['id-ID', 'id', 'en-US', 'en'],
    onLine: true,
    serviceWorker: {
      register: jest.fn(() => Promise.resolve()),
      ready: Promise.resolve({
        unregister: jest.fn(() => Promise.resolve())
      })
    }
  },
  writable: true
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console for specific tests if needed
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.VITE_DISABLE_FIRESTORE = 'true';
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';

// Global test utilities
global.testUtils = {
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    uid: 'test-user-123',
    email: 'test@example.com',
    namaUsaha: 'Test Business',
    businessProfile: {
      businessName: 'Test Business',
      category: 'food_beverage',
      location: 'Jakarta',
      employeeCount: '1-5'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  // Helper to create mock recommendations
  createMockRecommendations: (count = 3) => 
    Array(count).fill(null).map((_, i) => ({
      id: `rec-${i + 1}`,
      title: `Recommendation ${i + 1}`,
      description: `Description for recommendation ${i + 1}`,
      category: 'marketing',
      priority: 'high',
      estimatedTime: '1-2 weeks',
      difficulty: 'medium'
    })),

  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to flush all promises
  flushPromises: () => new Promise(resolve => setImmediate(resolve))
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('🧪 Test setup completed - Firebase mocked successfully');
