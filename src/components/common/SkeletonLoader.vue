<template>
  <div class="skeleton-loader" :class="{ 'animate': animate }">
    <!-- Skeleton Card -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-icon"></div>
        <div class="skeleton-title-group">
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
        </div>
        <div class="skeleton-badge"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-line long"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-button primary"></div>
        <div class="skeleton-button secondary"></div>
      </div>
    </div>

    <!-- Skeleton List Item -->
    <div v-else-if="type === 'list-item'" class="skeleton-list-item">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-content">
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
      </div>
      <div class="skeleton-action"></div>
    </div>

    <!-- Skeleton Text Lines -->
    <div v-else-if="type === 'text'" class="skeleton-text">
      <div v-for="n in lines" :key="n" class="skeleton-line" :class="getLineClass(n)"></div>
    </div>

    <!-- Skeleton Button -->
    <div v-else-if="type === 'button'" class="skeleton-button" :class="variant"></div>

    <!-- Skeleton Stats -->
    <div v-else-if="type === 'stats'" class="skeleton-stats">
      <div class="skeleton-stat-item">
        <div class="skeleton-stat-number"></div>
        <div class="skeleton-stat-label"></div>
      </div>
      <div class="skeleton-stat-item">
        <div class="skeleton-stat-number"></div>
        <div class="skeleton-stat-label"></div>
      </div>
      <div class="skeleton-stat-item">
        <div class="skeleton-stat-number"></div>
        <div class="skeleton-stat-label"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'list-item', 'text', 'button', 'stats'].includes(value)
  },
  animate: {
    type: Boolean,
    default: true
  },
  lines: {
    type: Number,
    default: 3
  },
  variant: {
    type: String,
    default: 'primary'
  }
});

const getLineClass = (lineNumber) => {
  const classes = ['long', 'medium', 'short'];
  return classes[(lineNumber - 1) % classes.length];
};
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

.skeleton-loader.animate .skeleton-line,
.skeleton-loader.animate .skeleton-icon,
.skeleton-loader.animate .skeleton-title,
.skeleton-loader.animate .skeleton-subtitle,
.skeleton-loader.animate .skeleton-badge,
.skeleton-loader.animate .skeleton-button,
.skeleton-loader.animate .skeleton-avatar,
.skeleton-loader.animate .skeleton-action,
.skeleton-loader.animate .skeleton-stat-number,
.skeleton-loader.animate .skeleton-stat-label {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% {
    background-color: #e2e8f0;
  }
  50% {
    background-color: #cbd5e0;
  }
  100% {
    background-color: #e2e8f0;
  }
}

/* Skeleton Card */
.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.skeleton-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #e2e8f0;
  flex-shrink: 0;
}

.skeleton-title-group {
  flex: 1;
}

.skeleton-title {
  height: 20px;
  background-color: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 8px;
  width: 70%;
}

.skeleton-subtitle {
  height: 14px;
  background-color: #e2e8f0;
  border-radius: 4px;
  width: 50%;
}

.skeleton-badge {
  width: 60px;
  height: 24px;
  background-color: #e2e8f0;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-content {
  margin-bottom: 20px;
}

.skeleton-line {
  height: 14px;
  background-color: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-line.long {
  width: 100%;
}

.skeleton-line.medium {
  width: 75%;
}

.skeleton-line.short {
  width: 50%;
}

.skeleton-actions {
  display: flex;
  gap: 12px;
}

.skeleton-button {
  height: 36px;
  background-color: #e2e8f0;
  border-radius: 6px;
  flex: 1;
}

.skeleton-button.primary {
  background-color: #e2e8f0;
}

.skeleton-button.secondary {
  background-color: #f1f5f9;
}

/* Skeleton List Item */
.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e2e8f0;
  flex-shrink: 0;
}

.skeleton-action {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: #e2e8f0;
  flex-shrink: 0;
}

/* Skeleton Text */
.skeleton-text {
  padding: 8px 0;
}

/* Skeleton Stats */
.skeleton-stats {
  display: flex;
  gap: 20px;
  padding: 16px 0;
}

.skeleton-stat-item {
  flex: 1;
  text-align: center;
}

.skeleton-stat-number {
  height: 24px;
  background-color: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 8px;
  width: 60%;
  margin: 0 auto 8px;
}

.skeleton-stat-label {
  height: 12px;
  background-color: #e2e8f0;
  border-radius: 4px;
  width: 80%;
  margin: 0 auto;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .skeleton-card {
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .skeleton-header {
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .skeleton-icon {
    width: 32px;
    height: 32px;
  }
  
  .skeleton-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .skeleton-stats {
    gap: 12px;
  }
}
</style>
