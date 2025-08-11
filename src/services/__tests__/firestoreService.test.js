/**
 * Firestore Service Tests - Decoupled from Firebase
 * Prevents "FIRESTORE INTERNAL ASSERTION FAILED" errors during testing
 */

// Mock Firebase before importing the service
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
  enableNetwork: jest.fn(),
  disableNetwork: jest.fn(),
  clearIndexedDbPersistence: jest.fn(),
  terminate: jest.fn()
}));

jest.mock('../firebase', () => ({
  db: { _delegate: { _databaseId: { projectId: 'test-project' } } },
  isFirestoreHealthy: jest.fn(() => true),
  retryFirestoreConnection: jest.fn(() => Promise.resolve(true)),
  getFirestoreStatus: jest.fn(() => ({ healthy: true, connected: true }))
}));

import { 
  createUserDocument, 
  getUserDocument, 
  updateUserDocument,
  updateRecommendationData 
} from '../firestoreService';

import { 
  doc, 
  getDoc, 
  setDoc, 
  runTransaction 
} from 'firebase/firestore';

describe('FirestoreService - User Document Operations', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.VITE_DISABLE_FIRESTORE = 'false';
  });

  describe('createUserDocument', () => {
    it('should create user document successfully', async () => {
      // Mock successful transaction
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn(),
        update: jest.fn()
      };
      
      runTransaction.mockImplementation((db, transactionFn) => 
        transactionFn(mockTransaction)
      );

      const testUserId = 'test-user-123';
      const testUserData = {
        email: 'test@example.com',
        namaUsaha: 'Test Business',
        businessProfile: {
          businessName: 'Test Business',
          category: 'food_beverage'
        }
      };

      const result = await createUserDocument(testUserId, testUserData);

      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          uid: testUserId,
          email: testUserData.email,
          namaUsaha: testUserData.namaUsaha
        })
      );
    });

    it('should update existing user document', async () => {
      // Mock existing document
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({ 
          exists: () => true,
          data: () => ({
            uid: 'test-user-123',
            email: 'existing@example.com',
            businessProfile: { businessName: 'Existing Business' }
          })
        }),
        set: jest.fn(),
        update: jest.fn()
      };
      
      runTransaction.mockImplementation((db, transactionFn) => 
        transactionFn(mockTransaction)
      );

      const result = await createUserDocument('test-user-123', {
        namaUsaha: 'Updated Business'
      });

      expect(result).toBe(true);
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should handle Firestore disabled mode', async () => {
      process.env.VITE_DISABLE_FIRESTORE = 'true';

      const result = await createUserDocument('test-user-123', {});

      expect(result).toBe(true);
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should handle transaction failures with retry', async () => {
      // Mock transaction failure then success
      runTransaction
        .mockRejectedValueOnce(new Error('Transaction failed'))
        .mockResolvedValueOnce(true);

      const result = await createUserDocument('test-user-123', {
        email: 'test@example.com'
      });

      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalledTimes(2);
    });

    it('should handle internal assertion errors', async () => {
      // Mock internal assertion error
      const assertionError = new Error('INTERNAL ASSERTION FAILED: Unexpected state');
      runTransaction.mockRejectedValue(assertionError);

      const result = await createUserDocument('test-user-123', {});

      expect(result).toBe(false);
      expect(runTransaction).toHaveBeenCalledTimes(3); // Should retry 3 times
    });
  });

  describe('getUserDocument', () => {
    it('should retrieve user document successfully', async () => {
      const mockUserData = {
        uid: 'test-user-123',
        email: 'test@example.com',
        namaUsaha: 'Test Business'
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      const result = await getUserDocument('test-user-123');

      expect(result).toEqual(mockUserData);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent document', async () => {
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await getUserDocument('non-existent-user');

      expect(result).toBeNull();
    });

    it('should handle Firestore disabled mode', async () => {
      process.env.VITE_DISABLE_FIRESTORE = 'true';

      const result = await getUserDocument('test-user-123');

      expect(result).toBeNull();
      expect(getDoc).not.toHaveBeenCalled();
    });
  });

  describe('updateUserDocument', () => {
    it('should update user document with transaction', async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({ 
          exists: () => true,
          data: () => ({ uid: 'test-user-123', email: 'test@example.com' })
        }),
        update: jest.fn()
      };
      
      runTransaction.mockImplementation((db, transactionFn) => 
        transactionFn(mockTransaction)
      );

      const updateData = { namaUsaha: 'Updated Business' };
      const result = await updateUserDocument('test-user-123', updateData);

      expect(result).toBe(true);
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining(updateData)
      );
    });

    it('should create document if it does not exist', async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn()
      };
      
      runTransaction.mockImplementation((db, transactionFn) => 
        transactionFn(mockTransaction)
      );

      const result = await updateUserDocument('new-user-123', {
        email: 'new@example.com'
      });

      expect(result).toBe(true);
      expect(mockTransaction.set).toHaveBeenCalled();
    });
  });

  describe('updateRecommendationData', () => {
    it('should update recommendation data for small datasets', async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ uid: 'test-user-123' })
        }),
        update: jest.fn()
      };
      
      runTransaction.mockImplementation((db, transactionFn) => 
        transactionFn(mockTransaction)
      );

      const recommendations = [
        { id: 'rec-1', title: 'Test Recommendation' }
      ];

      const result = await updateRecommendationData('test-user-123', recommendations);

      expect(result).toBe(true);
    });

    it('should return false and avoid partial writes when transaction fails', async () => {
      const transactionFns = [];
      runTransaction.mockImplementation((db, transactionFn) => {
        transactionFns.push(jest.fn(transactionFn));
        return Promise.reject(new Error('Transaction failed'));
      });

      const recommendations = [
        { id: 'rec-1', title: 'Test Recommendation' }
      ];

      const result = await updateRecommendationData('test-user-123', { recommendations });

      expect(result).toBe(false);
      expect(runTransaction).toHaveBeenCalledTimes(3);
      transactionFns.forEach(fn => expect(fn).not.toHaveBeenCalled());
    });

    it('should handle large datasets with batch operations', async () => {
      // Mock large dataset (> 500KB)
      const largeRecommendations = Array(1000).fill(null).map((_, i) => ({
        id: `rec-${i}`,
        title: `Recommendation ${i}`,
        description: 'A'.repeat(1000) // Large description
      }));

      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(true)
      };

      // Mock writeBatch
      const { writeBatch } = require('firebase/firestore');
      writeBatch.mockReturnValue(mockBatch);

      const result = await updateRecommendationData('test-user-123', { recommendations: largeRecommendations });

      expect(result).toBe(true);
      expect(writeBatch).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});

describe('FirestoreService - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network request failed');
    networkError.code = 'unavailable';
    
    runTransaction.mockRejectedValue(networkError);

    const result = await createUserDocument('test-user-123', {});

    expect(result).toBe(false);
  });

  it('should handle permission errors', async () => {
    const permissionError = new Error('Permission denied');
    permissionError.code = 'permission-denied';
    
    runTransaction.mockRejectedValue(permissionError);

    const result = await createUserDocument('test-user-123', {});

    expect(result).toBe(false);
  });

  it('should handle quota exceeded errors', async () => {
    const quotaError = new Error('Quota exceeded');
    quotaError.code = 'resource-exhausted';
    
    runTransaction.mockRejectedValue(quotaError);

    const result = await createUserDocument('test-user-123', {});

    expect(result).toBe(false);
  });
});

// Integration test with mocked Firebase
describe('FirestoreService - Integration Tests', () => {
  it('should handle complete user lifecycle', async () => {
    // Mock successful operations
    const mockTransaction = {
      get: jest.fn()
        .mockResolvedValueOnce({ exists: () => false }) // Create
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ uid: 'test-user' }) }), // Update
      set: jest.fn(),
      update: jest.fn()
    };
    
    runTransaction.mockImplementation((db, transactionFn) => 
      transactionFn(mockTransaction)
    );

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: 'test-user', email: 'test@example.com' })
    });

    // 1. Create user
    const createResult = await createUserDocument('test-user', {
      email: 'test@example.com',
      namaUsaha: 'Test Business'
    });
    expect(createResult).toBe(true);

    // 2. Get user
    const userData = await getUserDocument('test-user');
    expect(userData).toBeTruthy();

    // 3. Update user
    const updateResult = await updateUserDocument('test-user', {
      namaUsaha: 'Updated Business'
    });
    expect(updateResult).toBe(true);
  });
});
