<template>
  <div class="error-monitor" v-if="showMonitor">
    <div class="monitor-header">
      <h3>🔧 System Status Monitor</h3>
      <button @click="toggleMonitor" class="close-btn">×</button>
    </div>
    
    <div class="monitor-content">
      <!-- Firestore Status -->
      <div class="status-section">
        <h4>🔥 Firestore Status</h4>
        <div class="status-grid">
          <div class="status-item" :class="{ healthy: firestoreStatus.initialized, unhealthy: !firestoreStatus.initialized }">
            <span class="status-label">Connection:</span>
            <span class="status-value">{{ firestoreStatus.initialized ? 'Healthy' : 'Disconnected' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Retry Count:</span>
            <span class="status-value">{{ firestoreStatus.retryCount }}/{{ firestoreStatus.maxRetries }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Error Count:</span>
            <span class="status-value">{{ errorStats.errorCount }}</span>
          </div>
          <div class="status-item" v-if="errorStats.lastError">
            <span class="status-label">Last Error:</span>
            <span class="status-value error-text">{{ errorStats.lastError.message }}</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button @click="testFirestore" class="test-btn" :disabled="testing">
            {{ testing ? 'Testing...' : '🧪 Test Connection' }}
          </button>
          <button @click="resetErrors" class="reset-btn">
            🔄 Reset Errors
          </button>
        </div>
      </div>

      <!-- AI Status -->
      <div class="status-section">
        <h4>🤖 AI System Status</h4>
        <div class="status-grid">
          <div class="status-item" :class="{ healthy: aiStatus.enabled, unhealthy: !aiStatus.enabled }">
            <span class="status-label">AI Enabled:</span>
            <span class="status-value">{{ aiStatus.enabled ? 'Yes' : 'No' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Bypass Mode:</span>
            <span class="status-value">{{ aiStatus.bypassMode ? 'Active' : 'Disabled' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">API Key:</span>
            <span class="status-value">{{ aiStatus.hasApiKey ? 'Configured' : 'Missing' }}</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button @click="testAI" class="test-btn" :disabled="testingAI">
            {{ testingAI ? 'Testing...' : '🧪 Test AI' }}
          </button>
        </div>
      </div>

      <!-- Router Status -->
      <div class="status-section">
        <h4>🛣️ Router Status</h4>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Current Route:</span>
            <span class="status-value">{{ currentRoute.name || currentRoute.path }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Transition:</span>
            <span class="status-value">{{ transitionStatus }}</span>
          </div>
        </div>
      </div>

      <!-- Console Logs -->
      <div class="status-section">
        <h4>📝 Recent Logs</h4>
        <div class="logs-container">
          <div 
            v-for="(log, index) in recentLogs" 
            :key="index"
            class="log-entry"
            :class="log.level"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const showMonitor = ref(false);
const testing = ref(false);
const testingAI = ref(false);

// Status data
const firestoreStatus = reactive({
  initialized: false,
  retryCount: 0,
  maxRetries: 3
});

const errorStats = reactive({
  errorCount: 0,
  lastError: null
});

const aiStatus = reactive({
  enabled: false,
  bypassMode: false,
  hasApiKey: false
});

const recentLogs = ref([]);
const transitionStatus = ref('Ready');

// Computed
const currentRoute = computed(() => route);

// Methods
const toggleMonitor = () => {
  showMonitor.value = !showMonitor.value;
};

const updateFirestoreStatus = async () => {
  try {
    if (window.getFirebaseErrorStats) {
      const stats = window.getFirebaseErrorStats();
      Object.assign(errorStats, stats);
      Object.assign(firestoreStatus, stats.firestoreHealth);
    }
  } catch (error) {
    console.error('Error updating Firestore status:', error);
  }
};

const updateAIStatus = () => {
  aiStatus.enabled = import.meta.env.VITE_ENABLE_AI_RECOMMENDATIONS !== 'false';
  aiStatus.bypassMode = import.meta.env.VITE_BYPASS_AI === 'true';
  aiStatus.hasApiKey = !!(import.meta.env.VITE_GEMINI_API_KEY);
};

const testFirestore = async () => {
  testing.value = true;
  try {
    if (window.testFirestoreConnectivity) {
      const result = await window.testFirestoreConnectivity();
      addLog(result ? 'Firestore test passed' : 'Firestore test failed', result ? 'info' : 'error');
    } else {
      addLog('Firestore test function not available', 'warn');
    }
  } catch (error) {
    addLog(`Firestore test error: ${error.message}`, 'error');
  } finally {
    testing.value = false;
    await updateFirestoreStatus();
  }
};

const testAI = async () => {
  testingAI.value = true;
  try {
    if (window.quickAITest) {
      const result = await window.quickAITest();
      addLog(result.success ? 'AI test passed' : `AI test failed: ${result.error}`, result.success ? 'info' : 'error');
    } else {
      addLog('AI test function not available', 'warn');
    }
  } catch (error) {
    addLog(`AI test error: ${error.message}`, 'error');
  } finally {
    testingAI.value = false;
  }
};

const resetErrors = async () => {
  try {
    if (window.resetFirebaseErrorCount) {
      window.resetFirebaseErrorCount();
      addLog('Firebase error count reset', 'info');
      await updateFirestoreStatus();
    }
  } catch (error) {
    addLog(`Error resetting: ${error.message}`, 'error');
  }
};

const addLog = (message, level = 'info') => {
  recentLogs.value.unshift({
    message,
    level,
    timestamp: new Date()
  });
  
  // Keep only last 20 logs
  if (recentLogs.value.length > 20) {
    recentLogs.value = recentLogs.value.slice(0, 20);
  }
};

const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString();
};

// Lifecycle
onMounted(async () => {
  updateAIStatus();
  await updateFirestoreStatus();
  
  // Update status periodically
  setInterval(updateFirestoreStatus, 5000);
  
  // Listen for keyboard shortcut to toggle monitor
  const handleKeyPress = (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      toggleMonitor();
    }
  };
  
  document.addEventListener('keydown', handleKeyPress);
  
  // Cleanup
  return () => {
    document.removeEventListener('keydown', handleKeyPress);
  };
});

// Make toggle function available globally
if (typeof window !== 'undefined') {
  window.toggleErrorMonitor = toggleMonitor;
  console.log('🔧 Error Monitor available: Ctrl+Shift+D or window.toggleErrorMonitor()');
}
</script>

<style scoped>
.error-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.monitor-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.monitor-content {
  max-height: calc(80vh - 60px);
  overflow-y: auto;
  padding: 16px;
}

.status-section {
  margin-bottom: 20px;
}

.status-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.status-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 12px;
}

.status-item.healthy {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
}

.status-item.unhealthy {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.status-label {
  font-weight: 500;
  color: #6b7280;
}

.status-value {
  font-weight: 600;
  color: #1e293b;
}

.error-text {
  color: #dc2626;
  font-size: 11px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.test-btn,
.reset-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.test-btn:hover,
.reset-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logs-container {
  max-height: 150px;
  overflow-y: auto;
  background: #f9fafb;
  border-radius: 4px;
  padding: 8px;
}

.log-entry {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 11px;
  line-height: 1.4;
}

.log-time {
  color: #6b7280;
  font-weight: 500;
  min-width: 60px;
}

.log-message {
  color: #374151;
}

.log-entry.error .log-message {
  color: #dc2626;
}

.log-entry.warn .log-message {
  color: #d97706;
}

.log-entry.info .log-message {
  color: #059669;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .error-monitor {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
}
</style>
