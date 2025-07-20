/**
 * Firebase Offline Handler Tests
 * Tests offline detection and handling capabilities
 */

import { 
  withOfflineHandling, 
  getOfflineStatus, 
  queueOfflineOperation,
  clearOfflineQueue,
  forceReconnection
} from '../firebaseOfflineHandler.js';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  enableNetwork: jest.fn(),
  disableNetwork: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn()
}));

// Mock fetch for emulator checks
global.fetch = jest.fn();

describe('Firebase Offline Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearOfflineQueue();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    // Mock environment variables
    process.env.VITE_USE_FIREBASE_EMULATOR = 'false';
    process.env.NODE_ENV = 'test';
  });

  describe('Offline Detection', () => {
    it('should detect initial online status', () => {
      const status = getOfflineStatus();
      expect(status).toHaveProperty('isOffline');
      expect(status).toHaveProperty('browserOnline');
      expect(status).toHaveProperty('firebaseOnline');
    });

    it('should handle browser offline events', () => {
      // Simulate browser going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false
      });
      
      // Trigger offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);
      
      const status = getOfflineStatus();
      expect(status.browserOnline).toBe(false);
    });

    it('should handle browser online events', () => {
      // Simulate browser coming online
      Object.defineProperty(navigator, 'onLine', {
        value: true
      });
      
      // Trigger online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);
      
      const status = getOfflineStatus();
      expect(status.browserOnline).toBe(true);
    });
  });

  describe('Operation Handling', () => {
    it('should execute operation when online', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await withOfflineHandling(mockOperation, 'test-operation');
      
      expect(mockOperation).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should handle unavailable errors gracefully', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        code: 'unavailable',
        message: 'Failed to get document because the client is offline.'
      });
      
      const result = await withOfflineHandling(mockOperation, 'test-operation');
      
      expect(mockOperation).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle offline errors gracefully', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        message: 'client is offline'
      });
      
      const result = await withOfflineHandling(mockOperation, 'test-operation');
      
      expect(mockOperation).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should re-throw non-offline errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        code: 'permission-denied',
        message: 'Permission denied'
      });
      
      await expect(
        withOfflineHandling(mockOperation, 'test-operation')
      ).rejects.toMatchObject({
        code: 'permission-denied'
      });
    });
  });

  describe('Operation Queuing', () => {
    it('should queue operations', () => {
      const mockOperation = jest.fn();
      
      queueOfflineOperation(mockOperation, 'test-queue-operation');
      
      const status = getOfflineStatus();
      expect(status.queueSize).toBe(1);
    });

    it('should clear queue', () => {
      const mockOperation = jest.fn();
      
      queueOfflineOperation(mockOperation, 'test-operation-1');
      queueOfflineOperation(mockOperation, 'test-operation-2');
      
      let status = getOfflineStatus();
      expect(status.queueSize).toBe(2);
      
      clearOfflineQueue();
      
      status = getOfflineStatus();
      expect(status.queueSize).toBe(0);
    });
  });

  describe('Emulator Support', () => {
    beforeEach(() => {
      process.env.VITE_USE_FIREBASE_EMULATOR = 'true';
      process.env.NODE_ENV = 'development';
    });

    it('should check emulator availability', async () => {
      // Mock successful emulator response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await withOfflineHandling(mockOperation, 'emulator-test');
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080');
      expect(result).toBe('success');
    });

    it('should handle emulator unavailability', async () => {
      // Mock emulator not accessible
      fetch.mockRejectedValueOnce(new Error('Connection refused'));
      
      const mockOperation = jest.fn();
      
      const result = await withOfflineHandling(mockOperation, 'emulator-test');
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080');
      expect(result).toBeNull();
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection', async () => {
      // Mock enableNetwork from firebase/firestore
      const { enableNetwork } = require('firebase/firestore');
      enableNetwork.mockResolvedValue();
      
      await forceReconnection();
      
      expect(enableNetwork).toHaveBeenCalled();
    });

    it('should handle reconnection failures', async () => {
      // Mock enableNetwork failure
      const { enableNetwork } = require('firebase/firestore');
      enableNetwork.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      await expect(forceReconnection()).resolves.not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle Firebase internal assertion errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        message: 'INTERNAL ASSERTION FAILED: Unexpected state'
      });
      
      const result = await withOfflineHandling(mockOperation, 'assertion-test');
      
      expect(result).toBeNull();
    });

    it('should handle timeout errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        message: 'Connection timeout'
      });
      
      const result = await withOfflineHandling(mockOperation, 'timeout-test');
      
      expect(result).toBeNull();
    });

    it('should handle network unavailable errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue({
        code: 'unavailable',
        message: 'Network unavailable'
      });
      
      const result = await withOfflineHandling(mockOperation, 'network-test');
      
      expect(result).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle write operations when offline', async () => {
      const mockWriteOperation = jest.fn().mockRejectedValue({
        code: 'unavailable',
        message: 'Client is offline'
      });
      
      const result = await withOfflineHandling(
        mockWriteOperation, 
        'create user document'
      );
      
      expect(result).toBeNull();
      
      // Check that operation was queued
      const status = getOfflineStatus();
      expect(status.queueSize).toBe(1);
    });

    it('should not queue read operations when offline', async () => {
      const mockReadOperation = jest.fn().mockRejectedValue({
        code: 'unavailable',
        message: 'Client is offline'
      });
      
      const result = await withOfflineHandling(
        mockReadOperation, 
        'get user document'
      );
      
      expect(result).toBeNull();
      
      // Check that operation was NOT queued (read operations)
      const status = getOfflineStatus();
      expect(status.queueSize).toBe(0);
    });
  });
});

console.log('🧪 Firebase Offline Handler tests configured');
