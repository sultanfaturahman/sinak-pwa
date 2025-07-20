<template>
  <Teleport to="body">
    <div v-if="visible" class="toast-container">
      <div 
        :class="['toast', `toast-${type}`, { 'toast-entering': entering, 'toast-leaving': leaving }]"
        role="alert"
        :aria-live="type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="toast-icon">
          {{ getIcon() }}
        </div>
        <div class="toast-content">
          <div v-if="title" class="toast-title">{{ title }}</div>
          <div class="toast-message">{{ message }}</div>
        </div>
        <button 
          v-if="dismissible"
          @click="dismiss"
          class="toast-close"
          aria-label="Tutup notifikasi"
        >
          ✕
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 4000
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['dismiss']);

const visible = ref(false);
const entering = ref(false);
const leaving = ref(false);
let timeoutId = null;

const getIcon = () => {
  switch (props.type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return 'ℹ️';
  }
};

const show = () => {
  visible.value = true;
  entering.value = true;
  
  // Remove entering class after animation
  setTimeout(() => {
    entering.value = false;
  }, 300);
  
  // Auto dismiss if not persistent
  if (!props.persistent && props.duration > 0) {
    timeoutId = setTimeout(() => {
      dismiss();
    }, props.duration);
  }
};

const dismiss = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  leaving.value = true;
  
  setTimeout(() => {
    visible.value = false;
    emit('dismiss');
  }, 300);
};

onMounted(() => {
  show();
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});

// Expose methods for parent components
defineExpose({
  dismiss
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 480px;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  pointer-events: auto;
  transform: translateX(100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-entering {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.toast-leaving {
  animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  line-height: 1.3;
}

.toast-message {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  line-height: 1;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast variants */
.toast-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.toast-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #fde68a;
}

.toast-info {
  background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
  color: #1e40af;
  border: 1px solid #93c5fd;
}

/* Responsive */
@media (max-width: 480px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>
