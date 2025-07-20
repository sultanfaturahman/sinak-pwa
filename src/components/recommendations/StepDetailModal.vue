<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-content">
          <h3 class="modal-title">{{ step.title }}</h3>
          <div class="step-status-badge" :class="`status-${step.status}`">
            {{ getStatusText(step.status) }}
          </div>
        </div>
        <button @click="closeModal" class="close-btn">×</button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Step Description -->
        <div class="section">
          <h4 class="section-title">📋 Deskripsi</h4>
          <p class="step-description">{{ step.description }}</p>
        </div>

        <!-- Step Meta Information -->
        <div class="section">
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">⏱️ Estimasi Waktu:</span>
              <span class="meta-value">{{ step.estimatedDuration || 'Tidak ditentukan' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">📊 Status:</span>
              <span class="meta-value">{{ getStatusText(step.status) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">🎯 Wajib:</span>
              <span class="meta-value">{{ step.isRequired ? 'Ya' : 'Tidak' }}</span>
            </div>
            <div v-if="step.startedAt" class="meta-item">
              <span class="meta-label">🚀 Dimulai:</span>
              <span class="meta-value">{{ formatDate(step.startedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Checkpoints -->
        <div v-if="step.checkpoints && step.checkpoints.length > 0" class="section">
          <h4 class="section-title">✅ Checklist</h4>
          <div class="checkpoints-list">
            <div
              v-for="checkpoint in step.checkpoints"
              :key="checkpoint.id"
              class="checkpoint-item"
              :class="{ 'completed': checkpoint.isCompleted }"
            >
              <input
                type="checkbox"
                :checked="checkpoint.isCompleted"
                @change="toggleCheckpoint(checkpoint.id)"
                class="checkpoint-checkbox"
                :disabled="step.status === 'completed'"
              />
              <div class="checkpoint-content">
                <label class="checkpoint-title">{{ checkpoint.title }}</label>
                <p v-if="checkpoint.description" class="checkpoint-description">
                  {{ checkpoint.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div v-if="step.resources && step.resources.length > 0" class="section">
          <h4 class="section-title">📚 Sumber Daya</h4>
          <div class="resources-list">
            <div
              v-for="resource in step.resources"
              :key="resource.id"
              class="resource-item"
            >
              <div class="resource-icon">{{ getResourceIcon(resource.type) }}</div>
              <div class="resource-content">
                <h5 class="resource-title">{{ resource.title }}</h5>
                <p class="resource-description">{{ resource.description }}</p>
                <a
                  v-if="resource.url"
                  :href="resource.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="resource-link"
                >
                  🔗 Buka Resource
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div v-if="step.tips && step.tips.length > 0" class="section">
          <h4 class="section-title">💡 Tips & Saran</h4>
          <div class="tips-list">
            <div
              v-for="(tip, index) in step.tips"
              :key="index"
              class="tip-item"
            >
              <span class="tip-icon">💡</span>
              <p class="tip-text">{{ tip }}</p>
            </div>
          </div>
        </div>

        <!-- Progress Notes -->
        <div v-if="step.status === 'in_progress' || step.status === 'completed'" class="section">
          <h4 class="section-title">📝 Catatan Progress</h4>
          <textarea
            v-model="stepNotes"
            placeholder="Tambahkan catatan tentang progress atau hasil implementasi..."
            class="notes-textarea"
            :disabled="step.status === 'completed'"
          ></textarea>
          <button
            v-if="step.status === 'in_progress'"
            @click="saveNotes"
            class="save-notes-btn"
          >
            💾 Simpan Catatan
          </button>
        </div>

        <!-- Completion Summary -->
        <div v-if="step.status === 'completed'" class="section completion-summary">
          <h4 class="section-title">🎉 Ringkasan Penyelesaian</h4>
          <div class="completion-info">
            <div class="completion-date">
              <span class="info-icon">📅</span>
              <span>Diselesaikan pada: {{ formatDate(step.completedAt) }}</span>
            </div>
            <div v-if="step.notes" class="completion-notes">
              <span class="info-icon">📝</span>
              <div class="notes-content">{{ step.notes }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="footer-actions">
          <!-- Start Step -->
          <button
            v-if="step.status === 'pending'"
            @click="startStep"
            class="action-btn primary"
          >
            🚀 Mulai Langkah
          </button>

          <!-- Complete Step -->
          <button
            v-if="step.status === 'in_progress'"
            @click="completeStep"
            class="action-btn success"
            :disabled="!canCompleteStep"
          >
            ✅ Tandai Selesai
          </button>

          <!-- Restart Step -->
          <button
            v-if="step.status === 'completed'"
            @click="restartStep"
            class="action-btn warning"
          >
            🔄 Mulai Ulang
          </button>

          <!-- Skip Step -->
          <button
            v-if="step.status === 'pending' && !step.isRequired"
            @click="skipStep"
            class="action-btn secondary"
          >
            ⏭️ Lewati Langkah
          </button>

          <!-- Close -->
          <button @click="closeModal" class="action-btn secondary">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  step: {
    type: Object,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'close',
  'start-step',
  'complete-step',
  'restart-step',
  'skip-step',
  'toggle-checkpoint',
  'save-notes'
]);

// Local state
const stepNotes = ref(props.step.notes || '');

// Watch for step changes to update notes
watch(() => props.step.notes, (newNotes) => {
  stepNotes.value = newNotes || '';
});

// Computed properties
const canCompleteStep = computed(() => {
  if (!props.step.checkpoints || props.step.checkpoints.length === 0) {
    return true;
  }
  
  // Check if all required checkpoints are completed
  const requiredCheckpoints = props.step.checkpoints.filter(cp => cp.isRequired !== false);
  return requiredCheckpoints.every(cp => cp.isCompleted);
});

// Methods
const closeModal = () => {
  emit('close');
};

const startStep = () => {
  emit('start-step', props.step.id);
  closeModal();
};

const completeStep = () => {
  emit('complete-step', {
    stepId: props.step.id,
    notes: stepNotes.value
  });
  closeModal();
};

const restartStep = () => {
  emit('restart-step', props.step.id);
  closeModal();
};

const skipStep = () => {
  emit('skip-step', props.step.id);
  closeModal();
};

const toggleCheckpoint = (checkpointId) => {
  emit('toggle-checkpoint', {
    stepId: props.step.id,
    checkpointId
  });
};

const saveNotes = () => {
  emit('save-notes', {
    stepId: props.step.id,
    notes: stepNotes.value
  });
};

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Belum Dimulai',
    in_progress: 'Sedang Dikerjakan',
    completed: 'Selesai',
    skipped: 'Dilewati'
  };
  return statusMap[status] || 'Tidak Diketahui';
};

const getResourceIcon = (type) => {
  const iconMap = {
    article: '📄',
    video: '🎥',
    tool: '🔧',
    course: '🎓',
    template: '📋',
    website: '🌐',
    book: '📚',
    guide: '📖'
  };
  return iconMap[type] || '📄';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.header-content {
  flex: 1;
  margin-right: 16px;
}

.modal-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.step-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
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

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.section {
  margin-bottom: 32px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-description {
  color: #4b5563;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}

/* Meta Information */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.meta-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

/* Checkpoints */
.checkpoints-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkpoint-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.checkpoint-item.completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.checkpoint-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
}

.checkpoint-content {
  flex: 1;
}

.checkpoint-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  margin-bottom: 4px;
}

.checkpoint-item.completed .checkpoint-title {
  text-decoration: line-through;
  color: #6b7280;
}

.checkpoint-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* Resources */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.resource-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.resource-content {
  flex: 1;
}

.resource-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.resource-description {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.resource-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #3b82f6;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}

.resource-link:hover {
  text-decoration: underline;
}

/* Tips */
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fed7aa;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-text {
  margin: 0;
  font-size: 14px;
  color: #92400e;
  line-height: 1.5;
}

/* Notes */
.notes-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: 12px;
}

.notes-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.save-notes-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.save-notes-btn:hover {
  background: #2563eb;
}

/* Completion Summary */
.completion-summary {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 16px;
}

.completion-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.completion-date,
.completion-notes {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.info-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notes-content {
  flex: 1;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* Modal Footer */
.modal-footer {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  background: #10b981;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #059669;
}

.action-btn.success {
  background: #3b82f6;
  color: white;
}

.action-btn.success:hover:not(:disabled) {
  background: #2563eb;
}

.action-btn.warning {
  background: #f59e0b;
  color: white;
}

.action-btn.warning:hover:not(:disabled) {
  background: #d97706;
}

.action-btn.secondary {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.action-btn.secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .section {
    margin-bottom: 24px;
  }
  
  .meta-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .footer-actions {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
}
</style>
