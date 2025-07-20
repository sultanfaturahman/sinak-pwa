<template>
  <div class="completion-tracker">
    <!-- Status Badge -->
    <div class="status-section">
      <div class="status-badge" :class="`status-${recommendation.status}`">
        <span class="status-icon">{{ getStatusIcon(recommendation.status) }}</span>
        <span class="status-text">{{ getStatusText(recommendation.status) }}</span>
      </div>
      
      <!-- Progress Bar -->
      <div v-if="recommendation.status === 'in_progress'" class="progress-section">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${recommendation.progress}%` }"
          ></div>
        </div>
        <span class="progress-text">{{ recommendation.progress }}% selesai</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <!-- Start/Resume Button -->
      <button
        v-if="recommendation.status === 'pending'"
        @click="startRecommendation"
        class="action-btn start-btn hover-lift"
      >
        <span class="btn-icon">🚀</span>
        Mulai Implementasi
      </button>

      <!-- Progress Update Button -->
      <button
        v-else-if="recommendation.status === 'in_progress'"
        @click="showProgressModal = true"
        class="action-btn progress-btn hover-lift"
      >
        <span class="btn-icon">📊</span>
        Update Progress
      </button>

      <!-- Complete Button -->
      <button
        v-if="recommendation.status === 'in_progress'"
        @click="showCompletionModal = true"
        class="action-btn complete-btn hover-lift"
      >
        <span class="btn-icon">✅</span>
        Tandai Selesai
      </button>

      <!-- Restart Button -->
      <button
        v-else-if="recommendation.status === 'completed'"
        @click="restartRecommendation"
        class="action-btn restart-btn hover-lift"
      >
        <span class="btn-icon">🔄</span>
        Implementasi Ulang
      </button>

      <!-- Skip Button -->
      <button
        v-if="recommendation.status === 'pending' || recommendation.status === 'in_progress'"
        @click="skipRecommendation"
        class="action-btn skip-btn hover-lift"
      >
        <span class="btn-icon">⏭️</span>
        Lewati
      </button>
    </div>

    <!-- Completion Info -->
    <div v-if="recommendation.status === 'completed'" class="completion-info">
      <div class="completion-date">
        <span class="info-icon">📅</span>
        Selesai: {{ formatDate(recommendation.completedAt) }}
      </div>
      
      <div v-if="recommendation.userRating" class="user-rating">
        <span class="info-icon">⭐</span>
        Rating: {{ '★'.repeat(recommendation.userRating) }}{{ '☆'.repeat(5 - recommendation.userRating) }}
      </div>
      
      <div v-if="recommendation.completionNotes" class="completion-notes">
        <span class="info-icon">📝</span>
        <p>{{ recommendation.completionNotes }}</p>
      </div>
    </div>

    <!-- Progress Update Modal -->
    <div v-if="showProgressModal" class="modal-overlay" @click="showProgressModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Update Progress</h3>
          <button @click="showProgressModal = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="progress-input">
            <label for="progress-slider">Progress: {{ tempProgress }}%</label>
            <input
              id="progress-slider"
              v-model="tempProgress"
              type="range"
              min="0"
              max="100"
              step="5"
              class="progress-slider"
            />
          </div>
          
          <div class="notes-input">
            <label for="progress-notes">Catatan Progress (opsional):</label>
            <textarea
              id="progress-notes"
              v-model="tempNotes"
              placeholder="Apa yang sudah Anda lakukan?"
              class="notes-textarea"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showProgressModal = false" class="btn-secondary">Batal</button>
          <button @click="updateProgress" class="btn-primary">Simpan Progress</button>
        </div>
      </div>
    </div>

    <!-- Completion Modal -->
    <div v-if="showCompletionModal" class="modal-overlay" @click="showCompletionModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🎉 Selamat! Tandai Sebagai Selesai</h3>
          <button @click="showCompletionModal = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Rating -->
          <div class="rating-section">
            <label>Seberapa bermanfaat rekomendasi ini?</label>
            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                @click="tempRating = star"
                class="star-btn"
                :class="{ active: star <= tempRating }"
              >
                {{ star <= tempRating ? '★' : '☆' }}
              </button>
            </div>
          </div>
          
          <!-- Difficulty Feedback -->
          <div class="difficulty-section">
            <label>Seberapa sulit implementasinya?</label>
            <div class="difficulty-buttons">
              <button
                v-for="(label, value) in difficultyLabels"
                :key="value"
                @click="tempDifficulty = parseInt(value)"
                class="difficulty-btn"
                :class="{ active: tempDifficulty === parseInt(value) }"
              >
                {{ label }}
              </button>
            </div>
          </div>
          
          <!-- Completion Notes -->
          <div class="notes-input">
            <label for="completion-notes">Catatan dan Hasil (opsional):</label>
            <textarea
              id="completion-notes"
              v-model="tempCompletionNotes"
              placeholder="Bagaimana hasilnya? Apa yang Anda pelajari?"
              class="notes-textarea"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showCompletionModal = false" class="btn-secondary">Batal</button>
          <button @click="completeRecommendation" class="btn-primary">Tandai Selesai</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { RECOMMENDATION_STATUS, COMPLETION_DIFFICULTY } from '../../types/recommendation.js';

const props = defineProps({
  recommendation: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  'start',
  'update-progress', 
  'complete',
  'restart',
  'skip'
]);

// Modal states
const showProgressModal = ref(false);
const showCompletionModal = ref(false);

// Temporary form data
const tempProgress = ref(props.recommendation.progress || 0);
const tempNotes = ref('');
const tempRating = ref(0);
const tempDifficulty = ref(null);
const tempCompletionNotes = ref('');

// Difficulty labels
const difficultyLabels = {
  1: 'Sangat Mudah',
  2: 'Mudah', 
  3: 'Sedang',
  4: 'Sulit',
  5: 'Sangat Sulit'
};

// Status helpers
const getStatusIcon = (status) => {
  const icons = {
    [RECOMMENDATION_STATUS.PENDING]: '⏳',
    [RECOMMENDATION_STATUS.IN_PROGRESS]: '🔄',
    [RECOMMENDATION_STATUS.COMPLETED]: '✅',
    [RECOMMENDATION_STATUS.SKIPPED]: '⏭️'
  };
  return icons[status] || '⏳';
};

const getStatusText = (status) => {
  const texts = {
    [RECOMMENDATION_STATUS.PENDING]: 'Belum Dimulai',
    [RECOMMENDATION_STATUS.IN_PROGRESS]: 'Sedang Dikerjakan',
    [RECOMMENDATION_STATUS.COMPLETED]: 'Selesai',
    [RECOMMENDATION_STATUS.SKIPPED]: 'Dilewati'
  };
  return texts[status] || 'Belum Dimulai';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Actions
const startRecommendation = () => {
  emit('start', {
    id: props.recommendation.id,
    startedAt: new Date().toISOString(),
    status: RECOMMENDATION_STATUS.IN_PROGRESS
  });
};

const updateProgress = () => {
  emit('update-progress', {
    id: props.recommendation.id,
    progress: tempProgress.value,
    notes: tempNotes.value,
    updatedAt: new Date().toISOString()
  });
  
  showProgressModal.value = false;
  tempNotes.value = '';
};

const completeRecommendation = () => {
  emit('complete', {
    id: props.recommendation.id,
    status: RECOMMENDATION_STATUS.COMPLETED,
    progress: 100,
    completedAt: new Date().toISOString(),
    userRating: tempRating.value,
    implementationDifficulty: tempDifficulty.value,
    completionNotes: tempCompletionNotes.value,
    updatedAt: new Date().toISOString()
  });
  
  showCompletionModal.value = false;
  resetTempData();
};

const restartRecommendation = () => {
  emit('restart', {
    id: props.recommendation.id,
    status: RECOMMENDATION_STATUS.IN_PROGRESS,
    progress: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

const skipRecommendation = () => {
  emit('skip', {
    id: props.recommendation.id,
    status: RECOMMENDATION_STATUS.SKIPPED,
    updatedAt: new Date().toISOString()
  });
};

const resetTempData = () => {
  tempProgress.value = 0;
  tempNotes.value = '';
  tempRating.value = 0;
  tempDifficulty.value = null;
  tempCompletionNotes.value = '';
};
</script>

<style scoped>
.completion-tracker {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid #e2e8f0;
}

/* Status Section */
.status-section {
  margin-bottom: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-skipped {
  background: #f3f4f6;
  color: #6b7280;
}

/* Progress Section */
.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
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

.progress-btn {
  background: #3b82f6;
  color: white;
}

.progress-btn:hover {
  background: #2563eb;
}

.complete-btn {
  background: #059669;
  color: white;
}

.complete-btn:hover {
  background: #047857;
}

.restart-btn {
  background: #f59e0b;
  color: white;
}

.restart-btn:hover {
  background: #d97706;
}

.skip-btn {
  background: #6b7280;
  color: white;
}

.skip-btn:hover {
  background: #4b5563;
}

/* Completion Info */
.completion-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.completion-date,
.user-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.completion-notes {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.completion-notes p {
  margin: 0;
  line-height: 1.4;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Form Elements */
.progress-input,
.notes-input,
.rating-section,
.difficulty-section {
  margin-bottom: 20px;
}

.progress-input label,
.notes-input label,
.rating-section label,
.difficulty-section label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.progress-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.notes-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

.notes-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Star Rating */
.star-rating {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #d1d5db;
  transition: color 0.2s ease;
}

.star-btn.active,
.star-btn:hover {
  color: #fbbf24;
}

/* Difficulty Buttons */
.difficulty-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.difficulty-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-btn:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.difficulty-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Button Styles */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
  
  .difficulty-buttons {
    flex-direction: column;
  }
  
  .difficulty-btn {
    text-align: center;
  }
}
</style>
