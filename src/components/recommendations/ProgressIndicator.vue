<template>
  <div class="progress-indicator" :class="{ 'compact': compact }">
    <!-- Progress Header -->
    <div class="progress-header">
      <div class="progress-title">
        <h4>{{ title || 'Progress Implementasi' }}</h4>
        <span class="progress-percentage">{{ Math.round(overallProgress) }}%</span>
      </div>

      <!-- Overall Progress Bar -->
      <div class="overall-progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${overallProgress}%` }"
        ></div>
      </div>

      <!-- Progress Stats -->
      <div class="progress-stats">
        <span class="stat-item">
          <span class="stat-icon">✅</span>
          {{ completedSteps }}/{{ totalSteps }} Langkah
        </span>
        <span class="stat-item" v-if="estimatedTimeRemaining">
          <span class="stat-icon">⏱️</span>
          {{ estimatedTimeRemaining }}
        </span>
        <span class="stat-item" v-if="nextMilestone">
          <span class="stat-icon">🎯</span>
          {{ nextMilestone.title }}
        </span>
      </div>
    </div>

    <!-- Progress Steps -->
    <div v-if="!compact" class="progress-steps">
      <div
        v-for="(step, index) in progressSteps"
        :key="step.id"
        class="progress-step"
        :class="{
          'completed': step.status === 'completed',
          'in-progress': step.status === 'in_progress',
          'current': index === currentStepIndex,
          'skipped': step.status === 'skipped'
        }"
      >
        <!-- Step Connector Line -->
        <div v-if="index > 0" class="step-connector"></div>

        <!-- Step Icon -->
        <div class="step-icon">
          <span v-if="step.status === 'completed'" class="status-icon completed">✓</span>
          <span v-else-if="step.status === 'skipped'" class="status-icon skipped">⏭</span>
          <span v-else-if="step.status === 'in_progress'" class="status-icon in-progress">
            <div class="spinner"></div>
          </span>
          <span v-else class="status-icon pending">{{ index + 1 }}</span>
        </div>

        <!-- Step Content -->
        <div class="step-content">
          <div class="step-header">
            <h5 class="step-title">{{ step.title }}</h5>
            <div class="step-meta">
              <span v-if="step.estimatedDuration" class="duration">
                ⏱️ {{ step.estimatedDuration }}
              </span>
              <span v-if="step.isRequired" class="required-badge">Wajib</span>
            </div>
          </div>

          <p class="step-description">{{ step.description }}</p>

          <!-- Step Actions -->
          <div class="step-actions">
            <button
              v-if="step.status === 'pending' && index === currentStepIndex"
              @click="startStep(step.id)"
              class="step-btn start-btn"
            >
              🚀 Mulai Langkah
            </button>

            <button
              v-else-if="step.status === 'in_progress'"
              @click="completeStep(step.id)"
              class="step-btn complete-btn"
            >
              ✅ Tandai Selesai
            </button>

            <button
              v-if="step.status === 'in_progress' || (step.status === 'pending' && index === currentStepIndex)"
              @click="showStepDetails(step)"
              class="step-btn details-btn"
            >
              📋 Detail
            </button>

            <button
              v-if="step.status === 'pending' && !step.isRequired && index === currentStepIndex"
              @click="skipStep(step.id)"
              class="step-btn skip-btn"
            >
              ⏭️ Lewati
            </button>
          </div>

          <!-- Step Progress (for in-progress steps) -->
          <div v-if="step.status === 'in_progress' && step.checkpoints" class="step-progress">
            <div class="checkpoints">
              <div
                v-for="checkpoint in step.checkpoints"
                :key="checkpoint.id"
                class="checkpoint"
                :class="{ 'completed': checkpoint.isCompleted }"
              >
                <input
                  type="checkbox"
                  :checked="checkpoint.isCompleted"
                  @change="toggleCheckpoint(step.id, checkpoint.id)"
                  class="checkpoint-checkbox"
                />
                <label class="checkpoint-label">{{ checkpoint.title }}</label>
              </div>
            </div>
          </div>

          <!-- Completion Info -->
          <div v-if="step.status === 'completed'" class="completion-info">
            <span class="completion-date">
              ✅ Selesai: {{ formatDate(step.completedAt) }}
            </span>
            <p v-if="step.notes" class="completion-notes">{{ step.notes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Milestones -->
    <div v-if="milestones.length > 0 && !compact" class="milestones-section">
      <h5 class="section-title">🎯 Milestone</h5>
      <div class="milestones">
        <div
          v-for="milestone in milestones"
          :key="milestone.id"
          class="milestone"
          :class="{ 'completed': milestone.isCompleted }"
        >
          <div class="milestone-icon">{{ milestone.icon }}</div>
          <div class="milestone-content">
            <h6 class="milestone-title">{{ milestone.title }}</h6>
            <p class="milestone-description">{{ milestone.description }}</p>
            <div class="milestone-meta">
              <span v-if="milestone.targetDate" class="target-date">
                📅 Target: {{ formatDate(milestone.targetDate) }}
              </span>
              <span v-if="milestone.reward" class="reward">
                🏆 {{ milestone.reward }}
              </span>
            </div>
          </div>
          <div class="milestone-status">
            <span v-if="milestone.isCompleted" class="status-completed">✓</span>
            <span v-else class="status-pending">{{ getMilestoneProgress(milestone) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Compact View -->
    <div v-if="compact" class="compact-steps">
      <div class="step-indicators">
        <div
          v-for="(step, index) in progressSteps"
          :key="step.id"
          class="step-dot"
          :class="{
            'completed': step.status === 'completed',
            'current': index === currentStepIndex,
            'skipped': step.status === 'skipped'
          }"
          @click="showStepDetails(step)"
        ></div>
      </div>
      <div class="current-step-info">
        <span class="current-step-title">
          {{ currentStep ? currentStep.title : 'Semua langkah selesai' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  progressSteps: {
    type: Array,
    default: () => []
  },
  milestones: {
    type: Array,
    default: () => []
  },
  currentStepIndex: {
    type: Number,
    default: 0
  },
  title: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'start-step',
  'complete-step',
  'skip-step',
  'toggle-checkpoint',
  'show-step-details'
]);

// Computed properties
const totalSteps = computed(() => props.progressSteps.length);
const completedSteps = computed(() =>
  props.progressSteps.filter(step => step.status === 'completed').length
);

const overallProgress = computed(() => {
  if (totalSteps.value === 0) return 0;
  return (completedSteps.value / totalSteps.value) * 100;
});

const currentStep = computed(() => {
  return props.progressSteps[props.currentStepIndex] || null;
});

const nextMilestone = computed(() => {
  return props.milestones.find(milestone => !milestone.isCompleted) || null;
});

const estimatedTimeRemaining = computed(() => {
  const remainingSteps = props.progressSteps.slice(props.currentStepIndex);
  // Simple estimation - could be enhanced with actual duration parsing
  const totalHours = remainingSteps.length * 2; // Assume 2 hours per step

  if (totalHours < 24) {
    return `~${totalHours} jam`;
  } else {
    const days = Math.ceil(totalHours / 8); // 8 working hours per day
    return `~${days} hari`;
  }
});

// Methods
const startStep = (stepId) => {
  emit('start-step', stepId);
};

const completeStep = (stepId) => {
  emit('complete-step', stepId);
};

const skipStep = (stepId) => {
  emit('skip-step', stepId);
};

const toggleCheckpoint = (stepId, checkpointId) => {
  emit('toggle-checkpoint', { stepId, checkpointId });
};

const showStepDetails = (step) => {
  emit('show-step-details', step);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getMilestoneProgress = (milestone) => {
  if (!milestone.requiredSteps || milestone.requiredSteps.length === 0) return 0;

  const completedRequiredSteps = milestone.requiredSteps.filter(stepId => {
    const step = props.progressSteps.find(s => s.id === stepId);
    return step && step.status === 'completed';
  }).length;

  return Math.round((completedRequiredSteps / milestone.requiredSteps.length) * 100);
};
</script>

<style scoped>
.progress-indicator {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* Progress Header */
.progress-header {
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.progress-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

/* Overall Progress Bar */
.overall-progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Progress Stats */
.progress-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
}

.stat-icon {
  font-size: 16px;
}

/* Progress Steps */
.progress-steps {
  padding: 20px;
}

.progress-step {
  position: relative;
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.progress-step:last-child {
  margin-bottom: 0;
}

/* Step Connector */
.step-connector {
  position: absolute;
  left: 20px;
  top: -24px;
  width: 2px;
  height: 24px;
  background: #e5e7eb;
}

.progress-step.completed .step-connector {
  background: #10b981;
}

/* Step Icon */
.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.status-icon.pending {
  background: #f3f4f6;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.status-icon.in-progress {
  background: #dbeafe;
  color: #2563eb;
  border: 2px solid #3b82f6;
}

.status-icon.completed {
  background: #d1fae5;
  color: #059669;
  border: 2px solid #10b981;
}

.status-icon.skipped {
  background: #f9fafb;
  color: #9ca3af;
  border: 2px solid #d1d5db;
}

.progress-step.current .step-icon {
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

/* Spinner for in-progress steps */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(37, 99, 235, 0.2);
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Step Content */
.step-content {
  flex: 1;
  min-width: 0;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.step-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.step-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.duration {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.required-badge {
  font-size: 10px;
  font-weight: 600;
  color: #dc2626;
  background: #fecaca;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.step-description {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

/* Step Actions */
.step-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.step-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-btn {
  background: #10b981;
  color: white;
}

.start-btn:hover {
  background: #059669;
}

.complete-btn {
  background: #3b82f6;
  color: white;
}

.complete-btn:hover {
  background: #2563eb;
}

.details-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.details-btn:hover {
  background: #e5e7eb;
}

.skip-btn {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.skip-btn:hover {
  background: #fed7aa;
}

/* Step Progress (Checkpoints) */
.step-progress {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.checkpoints {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkpoint {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkpoint-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkpoint-label {
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  flex: 1;
}

.checkpoint.completed .checkpoint-label {
  text-decoration: line-through;
  color: #6b7280;
}

/* Completion Info */
.completion-info {
  margin-top: 12px;
  padding: 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.completion-date {
  font-size: 13px;
  color: #059669;
  font-weight: 500;
}

.completion-notes {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #374151;
  font-style: italic;
}

/* Milestones Section */
.milestones-section {
  padding: 20px;
  border-top: 1px solid #f3f4f6;
  background: #fafbfc;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.milestones {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.milestone:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.milestone.completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.milestone-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.milestone-content {
  flex: 1;
  min-width: 0;
}

.milestone-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.milestone-description {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.milestone-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.milestone-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 600;
}

.status-completed {
  background: #d1fae5;
  color: #059669;
}

.status-pending {
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
}

/* Compact View */
.progress-indicator.compact {
  padding: 12px 16px;
}

.compact-steps {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-indicators {
  display: flex;
  gap: 8px;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-dot.completed {
  background: #10b981;
}

.step-dot.current {
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.step-dot.skipped {
  background: #9ca3af;
}

.current-step-info {
  flex: 1;
  min-width: 0;
}

.current-step-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .progress-header {
    padding: 16px;
  }

  .progress-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .progress-percentage {
    font-size: 20px;
  }

  .progress-stats {
    gap: 12px;
  }

  .progress-steps {
    padding: 16px;
  }

  .progress-step {
    gap: 12px;
  }

  .step-icon {
    width: 32px;
    height: 32px;
  }

  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .step-actions {
    flex-direction: column;
  }

  .step-btn {
    justify-content: center;
  }

  .milestone {
    padding: 12px;
  }

  .milestone-meta {
    flex-direction: column;
    gap: 4px;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .step-icon,
  .milestone,
  .step-btn {
    transition: none;
  }

  .spinner {
    animation: none;
  }
}
</style>