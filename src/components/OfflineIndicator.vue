<template>
  <div v-if="showIndicator" class="offline-indicator" :class="indicatorClass">
    <div class="offline-content">
      <Icon :name="statusIcon" class="status-icon" />
      <div class="status-text">
        <h4>{{ statusTitle }}</h4>
        <p>{{ statusMessage }}</p>
      </div>
      <button 
        v-if="canRetry" 
        @click="handleRetry" 
        class="retry-button"
        :disabled="isRetrying"
      >
        <Icon name="refresh" :class="{ 'spinning': isRetrying }" />
        {{ isRetrying ? 'Mencoba...' : 'Coba Lagi' }}
      </button>
    </div>
    
    <!-- Queue status -->
    <div v-if="queueSize > 0" class="queue-status">
      <Icon name="clock" />
      <span>{{ queueSize }} operasi menunggu koneksi</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  addOfflineListener, 
  removeOfflineListener, 
  getOfflineStatus,
  forceReconnection 
} from '../services/firebaseOfflineHandler.js';
import Icon from './Icon.vue';

// Reactive state
const isOffline = ref(false);
const browserOnline = ref(navigator.onLine);
const firebaseOnline = ref(true);
const reconnectAttempts = ref(0);
const queueSize = ref(0);
const isRetrying = ref(false);
const showIndicator = ref(false);

// Computed properties
const indicatorClass = computed(() => ({
  'offline': isOffline.value,
  'reconnecting': reconnectAttempts.value > 0 && !isOffline.value,
  'online': !isOffline.value && reconnectAttempts.value === 0
}));

const statusIcon = computed(() => {
  if (isOffline.value) return 'wifi-off';
  if (reconnectAttempts.value > 0) return 'wifi-strength-1';
  return 'wifi';
});

const statusTitle = computed(() => {
  if (isOffline.value) return 'Tidak Ada Koneksi';
  if (reconnectAttempts.value > 0) return 'Menghubungkan Kembali...';
  return 'Terhubung';
});

const statusMessage = computed(() => {
  if (isOffline.value) {
    if (!browserOnline.value) {
      return 'Periksa koneksi internet Anda';
    } else if (!firebaseOnline.value) {
      return 'Tidak dapat terhubung ke server Firebase';
    }
    return 'Aplikasi dalam mode offline';
  }
  
  if (reconnectAttempts.value > 0) {
    return `Percobaan ke-${reconnectAttempts.value} untuk menghubungkan kembali`;
  }
  
  return 'Semua layanan berfungsi normal';
});

const canRetry = computed(() => {
  return isOffline.value && !isRetrying.value;
});

// Methods
const updateStatus = (status, details) => {
  isOffline.value = details.isOffline || false;
  browserOnline.value = details.browserOnline;
  firebaseOnline.value = details.firebaseOnline;
  reconnectAttempts.value = details.reconnectAttempts || 0;
  queueSize.value = details.queueSize || 0;
  
  // Show indicator when offline or reconnecting
  showIndicator.value = isOffline.value || reconnectAttempts.value > 0;
  
  console.log('🔄 Offline status updated:', {
    status,
    isOffline: isOffline.value,
    browserOnline: browserOnline.value,
    firebaseOnline: firebaseOnline.value,
    reconnectAttempts: reconnectAttempts.value,
    queueSize: queueSize.value
  });
};

const handleRetry = async () => {
  if (isRetrying.value) return;
  
  isRetrying.value = true;
  try {
    console.log('🔄 Manual reconnection attempt triggered');
    await forceReconnection();
  } catch (error) {
    console.error('❌ Manual reconnection failed:', error);
  } finally {
    isRetrying.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Get initial status
  const initialStatus = getOfflineStatus();
  updateStatus('initial', initialStatus);
  
  // Add listener for status changes
  addOfflineListener(updateStatus);
  
  console.log('🔧 OfflineIndicator mounted with initial status:', initialStatus);
});

onUnmounted(() => {
  removeOfflineListener(updateStatus);
  console.log('🔧 OfflineIndicator unmounted');
});
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 12px 16px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.offline-indicator.offline {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.offline-indicator.reconnecting {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.offline-indicator.online {
  background: linear-gradient(135deg, #27ae60, #229954);
}

.offline-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.status-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.status-text {
  flex: 1;
  min-width: 0;
}

.status-text h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.status-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.retry-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.retry-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.queue-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 13px;
  opacity: 0.9;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .offline-indicator {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .offline-content {
    gap: 10px;
  }
  
  .status-text h4 {
    font-size: 14px;
  }
  
  .status-text p {
    font-size: 12px;
  }
  
  .retry-button {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .queue-status {
    font-size: 12px;
  }
}

/* Hide when not needed */
.offline-indicator:not(.offline):not(.reconnecting) {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}
</style>
