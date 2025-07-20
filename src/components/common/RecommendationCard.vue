<template>
  <div class="recommendation-card" :class="[`priority-${recommendation.priority}`, { 'completed': recommendation.isCompleted }]">
    <!-- Card Header -->
    <div class="card-header">
      <div class="header-left">
        <div class="category-icon">{{ getCategoryIcon(recommendation.category) }}</div>
        <div class="header-text">
          <h3 class="recommendation-title">{{ recommendation.title }}</h3>
          <span class="category-label">{{ getCategoryLabel(recommendation.category) }}</span>
        </div>
      </div>
      <div class="header-right">
        <span class="priority-badge" :class="`priority-${recommendation.priority}`">
          {{ getPriorityLabel(recommendation.priority) }}
        </span>
        <button 
          @click="$emit('toggle-bookmark', recommendation.id)"
          class="bookmark-btn"
          :class="{ 'bookmarked': recommendation.isBookmarked }"
          :aria-label="recommendation.isBookmarked ? 'Hapus bookmark' : 'Tambah bookmark'"
        >
          {{ recommendation.isBookmarked ? '🔖' : '📌' }}
        </button>
      </div>
    </div>

    <!-- Card Content -->
    <div class="card-content">
      <p class="recommendation-description">{{ recommendation.description }}</p>
      
      <!-- Reasoning -->
      <div v-if="recommendation.reasoning" class="reasoning-section">
        <h4 class="reasoning-title">💡 Mengapa ini penting?</h4>
        <p class="reasoning-text">{{ recommendation.reasoning }}</p>
      </div>

      <!-- Expected Impact -->
      <div v-if="recommendation.expectedImpact" class="impact-section">
        <h4 class="impact-title">🎯 Dampak yang Diharapkan</h4>
        <p class="impact-text">{{ recommendation.expectedImpact }}</p>
      </div>

      <!-- Action Items -->
      <div v-if="recommendation.actionItems && recommendation.actionItems.length > 0" class="action-items-section">
        <h4 class="action-items-title">📋 Langkah-langkah Aksi</h4>
        <div class="action-items-list">
          <div 
            v-for="actionItem in recommendation.actionItems" 
            :key="actionItem.id"
            class="action-item"
            :class="{ 'completed': actionItem.isCompleted }"
          >
            <div class="action-item-content">
              <div class="action-item-header">
                <h5 class="action-item-title">{{ actionItem.title }}</h5>
                <div class="action-item-meta">
                  <span v-if="actionItem.estimatedHours" class="estimated-time">
                    ⏱️ {{ actionItem.estimatedHours }}h
                  </span>
                  <span v-if="actionItem.deadline" class="deadline">
                    📅 {{ formatDate(actionItem.deadline) }}
                  </span>
                </div>
              </div>
              <p v-if="actionItem.description" class="action-item-description">
                {{ actionItem.description }}
              </p>
            </div>
            <button 
              v-if="!actionItem.isCompleted"
              @click="$emit('complete-action', recommendation.id, actionItem.id)"
              class="complete-action-btn"
            >
              ✅
            </button>
            <span v-else class="completed-indicator">✅</span>
          </div>
        </div>
      </div>

      <!-- Resources -->
      <div v-if="recommendation.resources && recommendation.resources.length > 0" class="resources-section">
        <h4 class="resources-title">📚 Sumber Daya</h4>
        <div class="resources-list">
          <a 
            v-for="resource in recommendation.resources" 
            :key="resource.id"
            :href="resource.url"
            :target="resource.isExternal ? '_blank' : '_self'"
            :rel="resource.isExternal ? 'noopener noreferrer' : ''"
            class="resource-item"
          >
            <div class="resource-icon">{{ getResourceIcon(resource.type) }}</div>
            <div class="resource-content">
              <h5 class="resource-title">{{ resource.title }}</h5>
              <p v-if="resource.description" class="resource-description">{{ resource.description }}</p>
              <span class="resource-type">{{ getResourceTypeLabel(resource.type) }}</span>
            </div>
            <div class="external-icon" v-if="resource.isExternal">🔗</div>
          </a>
        </div>
      </div>
    </div>

    <!-- Progress Indicator (if has steps) -->
    <ProgressIndicator
      v-if="recommendation.progressSteps && recommendation.progressSteps.length > 0"
      :progress-steps="recommendation.progressSteps"
      :milestones="recommendation.milestones || []"
      :current-step-index="recommendation.currentStep || 0"
      :compact="true"
      @start-step="handleStartStep"
      @complete-step="handleCompleteStep"
      @skip-step="handleSkipStep"
      @toggle-checkpoint="handleToggleCheckpoint"
      @show-step-details="handleShowStepDetails"
    />

    <!-- Completion Tracker (fallback for non-step recommendations) -->
    <CompletionTracker
      v-else
      :recommendation="recommendation"
      @start="handleStart"
      @update-progress="handleUpdateProgress"
      @complete="handleComplete"
      @restart="handleRestart"
      @skip="handleSkip"
    />

    <!-- Card Footer -->
    <div class="card-footer">
      <div class="footer-left">
        <span v-if="recommendation.estimatedTimeframe" class="timeframe">
          ⏰ {{ recommendation.estimatedTimeframe }}
        </span>
        <span class="created-date">
          📅 {{ formatDate(recommendation.createdAt) }}
        </span>
      </div>
      <div class="footer-right">
        <BookmarkManager
          :recommendation="recommendation"
          @bookmark-toggled="handleBookmarkToggled"
          @collection-changed="handleCollectionChanged"
          @bookmark-removed="handleBookmarkRemoved"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCategoryIcon } from '../../types/recommendation.js';
import CompletionTracker from '../recommendations/CompletionTracker.vue';
import BookmarkManager from '../recommendations/BookmarkManager.vue';
import ProgressIndicator from '../recommendations/ProgressIndicator.vue';

// Props
defineProps({
  recommendation: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits([
  'complete',
  'toggle-bookmark',
  'complete-action',
  'start-recommendation',
  'update-progress',
  'restart-recommendation',
  'skip-recommendation',
  'start-step',
  'complete-step',
  'skip-step',
  'toggle-checkpoint',
  'show-step-details',
  'save-step-notes'
]);

// Helper functions
const getPriorityLabel = (priority) => {
  const labels = {
    critical: 'Kritis',
    high: 'Tinggi',
    medium: 'Sedang',
    low: 'Rendah'
  };
  return labels[priority] || 'Sedang';
};

const getCategoryLabel = (category) => {
  const labels = {
    financial_management: 'Manajemen Keuangan',
    marketing_sales: 'Marketing & Penjualan',
    operations: 'Operasional',
    human_resources: 'Sumber Daya Manusia',
    technology: 'Teknologi',
    legal_compliance: 'Legal & Kepatuhan',
    growth_strategy: 'Strategi Pertumbuhan',
    financial_literacy: 'Literasi Keuangan'
  };
  return labels[category] || 'Umum';
};

const getResourceIcon = (type) => {
  const icons = {
    article: '📄',
    video: '🎥',
    tool: '🛠️',
    course: '🎓',
    template: '📋'
  };
  return icons[type] || '📄';
};

const getResourceTypeLabel = (type) => {
  const labels = {
    article: 'Artikel',
    video: 'Video',
    tool: 'Alat',
    course: 'Kursus',
    template: 'Template'
  };
  return labels[type] || 'Artikel';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Completion tracking event handlers
const handleStart = (data) => {
  emit('start-recommendation', data);
};

const handleUpdateProgress = (data) => {
  emit('update-progress', data);
};

const handleComplete = (data) => {
  emit('complete', data);
};

const handleRestart = (data) => {
  emit('restart-recommendation', data);
};

const handleSkip = (data) => {
  emit('skip-recommendation', data);
};

// Bookmark management event handlers
const handleBookmarkToggled = (event) => {
  emit('toggle-bookmark', event.recommendationId);
};

const handleCollectionChanged = (event) => {
  console.log('Collection changed:', event);
  // Could emit a specific event if needed
};

const handleBookmarkRemoved = (event) => {
  emit('toggle-bookmark', event.recommendationId);
};

// Step management event handlers
const handleStartStep = (stepId) => {
  emit('start-step', { recommendationId: props.recommendation.id, stepId });
};

const handleCompleteStep = (data) => {
  emit('complete-step', {
    recommendationId: props.recommendation.id,
    stepId: data.stepId || data,
    notes: data.notes || ''
  });
};

const handleSkipStep = (stepId) => {
  emit('skip-step', { recommendationId: props.recommendation.id, stepId });
};

const handleToggleCheckpoint = (data) => {
  emit('toggle-checkpoint', {
    recommendationId: props.recommendation.id,
    stepId: data.stepId,
    checkpointId: data.checkpointId
  });
};

const handleShowStepDetails = (step) => {
  emit('show-step-details', {
    recommendationId: props.recommendation.id,
    step
  });
};
</script>

<style scoped>
/* Recommendation Card */
.recommendation-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #e5e7eb;
  transition: all 0.3s ease;
  overflow: hidden;
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.recommendation-card.priority-critical {
  border-left-color: #ef4444;
}

.recommendation-card.priority-high {
  border-left-color: #f59e0b;
}

.recommendation-card.priority-medium {
  border-left-color: #3b82f6;
}

.recommendation-card.priority-low {
  border-left-color: #10b981;
}

.recommendation-card.completed {
  opacity: 0.8;
  background: #f9fafb;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 0 1.5rem;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.category-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.recommendation-title {
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.category-label {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-badge.priority-critical {
  background: #fee2e2;
  color: #dc2626;
}

.priority-badge.priority-high {
  background: #fef3c7;
  color: #d97706;
}

.priority-badge.priority-medium {
  background: #dbeafe;
  color: #2563eb;
}

.priority-badge.priority-low {
  background: #d1fae5;
  color: #059669;
}

.bookmark-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.bookmark-btn:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.bookmark-btn.bookmarked {
  background: #fef3c7;
}

/* Card Content */
.card-content {
  padding: 1.5rem;
}

.recommendation-description {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

/* Sections */
.reasoning-section,
.impact-section,
.action-items-section,
.resources-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
}

.reasoning-title,
.impact-title,
.action-items-title,
.resources-title {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.reasoning-text,
.impact-text {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

/* Action Items */
.action-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.action-item.completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.action-item-content {
  flex: 1;
}

.action-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  gap: 1rem;
}

.action-item-title {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
}

.action-item-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.action-item-description {
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
  margin: 0;
}

.complete-action-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.complete-action-btn:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.completed-indicator {
  font-size: 1.25rem;
  color: #10b981;
}

/* Resources */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  transition: all 0.2s ease;
}

.resource-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateX(4px);
}

.resource-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.resource-content {
  flex: 1;
}

.resource-title {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.resource-description {
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
  margin: 0 0 0.25rem 0;
}

.resource-type {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.external-icon {
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  gap: 1rem;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.complete-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.complete-btn:hover {
  transform: translateY(-1px);
}

.completed-badge {
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: #d1fae5;
  border-radius: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-right {
    align-self: stretch;
    justify-content: space-between;
  }
  
  .action-item-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .complete-btn {
    width: 100%;
  }
}
</style>
