<template>
  <div class="loading-state" :class="{ 'fullscreen': fullscreen }">
    <!-- Loading with Progress -->
    <div v-if="type === 'progress'" class="loading-progress">
      <div class="loading-icon">
        <div class="spinner"></div>
      </div>
      <div class="loading-content">
        <h3 class="loading-title">{{ title }}</h3>
        <p class="loading-message">{{ message }}</p>
        <div class="progress-bar" v-if="showProgress">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="loading-steps" v-if="steps.length > 0">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="loading-step"
            :class="{ 
              'active': index === currentStep,
              'completed': index < currentStep 
            }"
          >
            <div class="step-icon">
              <span v-if="index < currentStep">✓</span>
              <div v-else-if="index === currentStep" class="step-spinner"></div>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="step-text">{{ step }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Simple Loading -->
    <div v-else-if="type === 'simple'" class="loading-simple">
      <div class="spinner"></div>
      <p class="loading-message">{{ message }}</p>
    </div>

    <!-- Dots Loading -->
    <div v-else-if="type === 'dots'" class="loading-dots">
      <div class="dots-container">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <p class="loading-message">{{ message }}</p>
    </div>

    <!-- Skeleton Loading -->
    <div v-else-if="type === 'skeleton'" class="loading-skeleton">
      <SkeletonLoader 
        v-for="n in skeletonCount" 
        :key="n" 
        :type="skeletonType" 
        :animate="true" 
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import SkeletonLoader from './SkeletonLoader.vue';

const props = defineProps({
  type: {
    type: String,
    default: 'progress',
    validator: (value) => ['progress', 'simple', 'dots', 'skeleton'].includes(value)
  },
  title: {
    type: String,
    default: 'Memuat...'
  },
  message: {
    type: String,
    default: 'Mohon tunggu sebentar'
  },
  progress: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  steps: {
    type: Array,
    default: () => []
  },
  currentStep: {
    type: Number,
    default: 0
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  skeletonCount: {
    type: Number,
    default: 3
  },
  skeletonType: {
    type: String,
    default: 'card'
  }
});

// Auto-rotating loading messages for better UX
const loadingMessages = [
  'Menganalisis profil bisnis Anda...',
  'Memproses data diagnosis...',
  'Menghasilkan rekomendasi terpersonalisasi...',
  'Menyiapkan saran pengembangan bisnis...',
  'Hampir selesai...'
];

const currentMessageIndex = ref(0);
const messageInterval = ref(null);

const rotatingMessage = computed(() => {
  return props.message || loadingMessages[currentMessageIndex.value];
});

onMounted(() => {
  if (props.type === 'progress' && !props.message) {
    messageInterval.value = setInterval(() => {
      currentMessageIndex.value = (currentMessageIndex.value + 1) % loadingMessages.length;
    }, 2000);
  }
});

onUnmounted(() => {
  if (messageInterval.value) {
    clearInterval(messageInterval.value);
  }
});
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-state.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

/* Progress Loading */
.loading-progress {
  max-width: 400px;
  width: 100%;
}

.loading-icon {
  margin-bottom: 24px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.loading-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.loading-message {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px 0;
  min-height: 20px;
  transition: opacity 0.3s ease;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 24px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.loading-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.loading-step.active {
  opacity: 1;
  color: #3b82f6;
}

.loading-step.completed {
  opacity: 0.8;
  color: #10b981;
}

.step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.loading-step.completed .step-icon {
  background-color: #10b981;
  color: white;
}

.loading-step.active .step-icon {
  background-color: #3b82f6;
  color: white;
}

.loading-step:not(.active):not(.completed) .step-icon {
  background-color: #e2e8f0;
  color: #64748b;
}

.step-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.step-text {
  font-size: 14px;
}

/* Simple Loading */
.loading-simple {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-simple .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

/* Dots Loading */
.loading-dots {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.dots-container {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: dot-bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

/* Skeleton Loading */
.loading-skeleton {
  width: 100%;
  max-width: 800px;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .loading-state {
    padding: 20px 16px;
  }
  
  .loading-title {
    font-size: 18px;
  }
  
  .loading-message {
    font-size: 13px;
  }
  
  .loading-steps {
    gap: 8px;
  }
  
  .step-text {
    font-size: 13px;
  }
}
</style>
