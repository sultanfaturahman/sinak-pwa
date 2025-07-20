<template>
  <div v-if="!isOnline" class="connection-status offline">
    <div class="status-content">
      <div class="status-icon">📡</div>
      <div class="status-text">
        <span class="status-title">Mode Offline</span>
        <span class="status-message">Tidak ada koneksi internet</span>
      </div>
    </div>
  </div>

  <div v-else-if="firestoreStatus === 'error'" class="connection-status firestore-error">
    <div class="status-content">
      <div class="status-icon">⚠️</div>
      <div class="status-text">
        <span class="status-title">Masalah Koneksi Database</span>
        <span class="status-message">Beberapa fitur mungkin tidak tersedia</span>
      </div>
    </div>
  </div>

  <div v-else-if="firestoreStatus === 'checking'" class="connection-status checking">
    <div class="status-content">
      <div class="status-icon">🔄</div>
      <div class="status-text">
        <span class="status-title">Memeriksa Koneksi</span>
        <span class="status-message">Menguji koneksi database...</span>
      </div>
    </div>
  </div>

  <div v-else-if="showOnlineMessage" class="connection-status online">
    <div class="status-content">
      <div class="status-icon">✅</div>
      <div class="status-text">
        <span class="status-title">Terhubung</span>
        <span class="status-message">Semua fitur tersedia</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Reactive state
const isOnline = ref(navigator.onLine);
const showOnlineMessage = ref(false);
const firestoreStatus = ref('checking'); // 'checking', 'connected', 'offline', 'error'
let onlineTimeout = null;

// Check Firestore connectivity
const checkFirestoreConnection = async () => {
  try {
    // Import Firestore functions
    const { db } = await import('../../services/firebase.js');
    const { doc, getDoc } = await import('firebase/firestore');

    // Test connection with a simple read
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);

    firestoreStatus.value = 'connected';
    console.log('✅ Firestore connection verified');
  } catch (error) {
    firestoreStatus.value = 'error';
    console.warn('⚠️ Firestore connection failed:', error.code || error.message);
  }
};

// Check connection on mount and when online status changes
const checkConnections = () => {
  if (navigator.onLine) {
    setTimeout(checkFirestoreConnection, 1000);
  } else {
    firestoreStatus.value = 'offline';
  }
};

// Event handlers
const handleOnline = () => {
  isOnline.value = true;
  showOnlineMessage.value = true;
  firestoreStatus.value = 'checking';

  // Check connections when coming back online
  checkConnections();

  // Hide online message after 3 seconds
  if (onlineTimeout) clearTimeout(onlineTimeout);
  onlineTimeout = setTimeout(() => {
    showOnlineMessage.value = false;
  }, 3000);
};

const handleOffline = () => {
  isOnline.value = false;
  showOnlineMessage.value = false;
  firestoreStatus.value = 'offline';
  if (onlineTimeout) clearTimeout(onlineTimeout);
};

// Lifecycle
onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial connection check
  checkConnections();
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  if (onlineTimeout) clearTimeout(onlineTimeout);
});
</script>

<style scoped>
.connection-status {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease-out;
}

.connection-status.offline {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  color: #92400e;
}

.connection-status.online {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1px solid #10b981;
  color: #065f46;
}

.connection-status.firestore-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #ef4444;
  color: #991b1b;
}

.connection-status.checking {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border: 1px solid #6366f1;
  color: #3730a3;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-title {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1;
}

.status-message {
  font-size: 0.75rem;
  opacity: 0.8;
  line-height: 1;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .connection-status {
    left: 10px;
    right: 10px;
    transform: none;
    width: auto;
  }
  
  .status-content {
    justify-content: center;
  }
}
</style>
