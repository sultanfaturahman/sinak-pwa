<template>
  <div class="diagnosis-container">
    <!-- Header -->
    <div class="diagnosis-header">
      <h1>🎯 Diagnosis Tahap Bisnis</h1>
      <p>Temukan tahap perkembangan bisnis Anda berdasarkan model Churchill & Lewis</p>
    </div>

    <!-- Progress Bar -->
    <div v-if="!diagnosisStore.isCompleted" class="progress-section">
      <div class="progress-info">
        <span>Pertanyaan {{ diagnosisStore.currentStep + 1 }} dari {{ diagnosisStore.totalQuestions }}</span>
        <span>{{ diagnosisStore.progress }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: diagnosisStore.progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Question Section -->
    <div v-if="!diagnosisStore.isCompleted && currentQuestion" class="question-section">
      <div class="question-card">
        <div class="question-header">
          <h2>{{ currentQuestion.question }}</h2>
          <p v-if="currentQuestion.subtitle" class="question-subtitle">
            {{ currentQuestion.subtitle }}
          </p>
        </div>

        <div class="question-content">
          <!-- Number Input -->
          <div v-if="currentQuestion.type === 'number'" class="input-group">
            <input
              type="number"
              :placeholder="currentQuestion.placeholder"
              :min="currentQuestion.validation?.min"
              :max="currentQuestion.validation?.max"
              v-model.number="currentAnswer"
              class="number-input"
            />
          </div>

          <!-- Select Input -->
          <div v-else-if="currentQuestion.type === 'select'" class="select-group">
            <select v-model="currentAnswer" class="select-input">
              <option value="">Pilih salah satu...</option>
              <option 
                v-for="option in currentQuestion.options" 
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Radio Input -->
          <div v-else-if="currentQuestion.type === 'radio'" class="radio-group">
            <label 
              v-for="option in currentQuestion.options" 
              :key="option.value"
              class="radio-option"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="currentAnswer"
                class="radio-input"
              />
              <span class="radio-label">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="question-navigation">
          <button 
            @click="previousQuestion"
            :disabled="diagnosisStore.currentStep === 0"
            class="nav-btn secondary"
          >
            ⬅️ Sebelumnya
          </button>
          
          <button 
            @click="nextQuestion"
            :disabled="!diagnosisStore.canProceed"
            class="nav-btn primary"
          >
            {{ isLastQuestion ? '🎯 Selesai' : 'Selanjutnya ➡️' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="diagnosisStore.isCompleted" class="results-section">
      <div class="results-card">
        <div class="results-header">
          <h2>🎉 Hasil Diagnosis Bisnis Anda</h2>
          <p>Berdasarkan jawaban Anda, berikut adalah tahap bisnis Anda saat ini:</p>
        </div>

        <div class="stage-result">
          <div class="stage-badge">
            <h3>{{ stageDetails?.name }}</h3>
            <div class="confidence-score">
              Tingkat Keyakinan: {{ diagnosisStore.confidence }}%
            </div>
          </div>
          
          <div class="stage-description">
            <p>{{ stageDetails?.description }}</p>
          </div>

          <div class="stage-characteristics">
            <h4>Karakteristik Tahap Ini:</h4>
            <ul>
              <li v-for="char in stageDetails?.characteristics" :key="char">
                {{ char }}
              </li>
            </ul>
          </div>

          <div class="stage-challenges">
            <h4>Tantangan Utama:</h4>
            <ul>
              <li v-for="challenge in stageDetails?.challenges" :key="challenge">
                {{ challenge }}
              </li>
            </ul>
          </div>
        </div>

        <div class="results-actions">
          <button @click="viewRecommendations" class="action-btn primary">
            💡 Lihat Rekomendasi
          </button>
          <button @click="retakeDiagnosis" class="action-btn secondary">
            🔄 Ulangi Diagnosis
          </button>
          <button @click="goToDashboard" class="action-btn secondary">
            🏠 Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="diagnosisStore.loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Memproses hasil diagnosis...</p>
    </div>

    <!-- Error State -->
    <div v-if="diagnosisStore.error" class="error-section">
      <div class="error-message">
        <h3>❌ Terjadi Kesalahan</h3>
        <p>{{ diagnosisStore.error }}</p>
        <button @click="diagnosisStore.clearError()" class="retry-btn">
          Coba Lagi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDiagnosisStore } from '../store/diagnosis';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const diagnosisStore = useDiagnosisStore();
const authStore = useAuthStore();

// Computed properties
const currentQuestion = computed(() => diagnosisStore.currentQuestion);
const stageDetails = computed(() => diagnosisStore.currentStageDetails);
const isLastQuestion = computed(() => 
  diagnosisStore.currentStep === diagnosisStore.totalQuestions - 1
);

// Current answer model
const currentAnswer = computed({
  get() {
    return diagnosisStore.currentAnswers[currentQuestion.value?.id] || '';
  },
  set(value) {
    if (currentQuestion.value) {
      diagnosisStore.setAnswer(currentQuestion.value.id, value);
    }
  }
});

// Methods
const nextQuestion = () => {
  diagnosisStore.nextQuestion();
};

const previousQuestion = () => {
  diagnosisStore.previousQuestion();
};

const retakeDiagnosis = () => {
  diagnosisStore.startDiagnosis();
};

const viewRecommendations = () => {
  // Update user's business stage in auth store
  if (diagnosisStore.currentStage) {
    authStore.updateUserProfile({
      businessStage: diagnosisStore.currentStage,
      lastDiagnosisDate: new Date().toISOString()
    });
  }

  // Navigate with query parameter to trigger recommendation generation
  router.push('/recommendations?generate=true');
};

const goToDashboard = () => {
  // Update user's business stage in auth store
  if (diagnosisStore.currentStage) {
    authStore.updateUserProfile({
      businessStage: diagnosisStore.currentStage,
      lastDiagnosisDate: new Date().toISOString()
    });
  }
  
  router.push('/');
};

// Lifecycle
onMounted(() => {
  // Load saved diagnosis data
  diagnosisStore.loadDiagnosisData();
  
  // Start diagnosis if not completed
  if (!diagnosisStore.isCompleted && diagnosisStore.currentStep === 0) {
    diagnosisStore.startDiagnosis();
  }
});

// Watch for completion to save data
watch(() => diagnosisStore.isCompleted, (completed) => {
  if (completed) {
    diagnosisStore.saveDiagnosisData();
  }
});
</script>

<style scoped>
.diagnosis-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2rem;
}

.diagnosis-header {
  text-align: center;
  margin-bottom: 2rem;
}

.diagnosis-header h1 {
  color: #1a202c;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.diagnosis-header p {
  color: #4a5568;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
}

.progress-section {
  max-width: 800px;
  margin: 0 auto 2rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #4a5568;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.question-section {
  max-width: 800px;
  margin: 0 auto;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.question-header h2 {
  color: #1a202c;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.question-subtitle {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.question-content {
  margin-bottom: 2rem;
}

.input-group, .select-group {
  margin-bottom: 1rem;
}

.number-input, .select-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.number-input:focus, .select-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.875rem; /* Slightly tighter spacing for better visual grouping */
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem; /* Increased gap for better spacing between radio and text */
  padding: 1.25rem; /* Slightly more padding for better touch targets */
  border: 2px solid #e2e8f0;
  border-radius: 12px; /* Slightly more rounded for modern look */
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); /* Smoother transition */
  position: relative;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Subtle shadow for depth */
}

.radio-option:hover {
  border-color: #cbd5e0;
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px); /* Subtle lift effect */
}

.radio-option:has(.radio-input:checked) {
  border-color: #667eea;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); /* Gradient for selected state */
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15); /* Colored shadow for selected state */
  transform: translateY(-1px);
}

/* Enhanced focus state for accessibility */
.radio-option:has(.radio-input:focus-visible) {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.radio-input {
  margin: 0;
  margin-top: 0.125rem; /* Fine-tune vertical alignment with text */
  accent-color: #667eea;
  width: 18px; /* Explicit size for consistency */
  height: 18px;
  flex-shrink: 0; /* Prevent radio button from shrinking */
  cursor: pointer;
}

/* Custom radio button styling for better visual consistency */
.radio-input {
  appearance: none;
  border: 2px solid #cbd5e0;
  border-radius: 50%;
  background: #ffffff;
  position: relative;
  transition: all 0.2s ease;
}

.radio-input:checked {
  border-color: #667eea;
  background: #667eea;
}

.radio-input:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
}

.radio-input:hover {
  border-color: #a0aec0;
}

.radio-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.radio-label {
  flex: 1;
  line-height: 1.6; /* Better line height for readability */
  color: #2d3748;
  font-size: 1rem;
  font-weight: 400;
  cursor: pointer;
  /* Ensure text aligns nicely with radio button */
  margin-top: -0.125rem; /* Fine-tune alignment */
}

/* Enhanced text color for selected state */
.radio-option:has(.radio-input:checked) .radio-label {
  color: #1a202c;
  font-weight: 500; /* Slightly bolder for selected state */
}

.question-navigation {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.nav-btn.secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.nav-btn.secondary:hover:not(:disabled) {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.results-section {
  max-width: 900px;
  margin: 0 auto;
}

.results-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.results-header h2 {
  color: #1a202c;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stage-result {
  margin-bottom: 2rem;
}

.stage-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1.5rem;
}

.stage-badge h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.confidence-score {
  font-size: 0.9rem;
  opacity: 0.9;
}

.stage-description {
  margin-bottom: 1.5rem;
}

.stage-description p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #4a5568;
}

.stage-characteristics, .stage-challenges {
  margin-bottom: 1.5rem;
}

.stage-characteristics h4, .stage-challenges h4 {
  color: #2d3748;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.stage-characteristics ul, .stage-challenges ul {
  list-style: none;
  padding: 0;
}

.stage-characteristics li, .stage-challenges li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #4a5568;
  line-height: 1.5;
}

.stage-characteristics li::before {
  content: "✅";
  position: absolute;
  left: 0;
}

.stage-challenges li::before {
  content: "⚠️";
  position: absolute;
  left: 0;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 160px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.action-btn.secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.action-btn.secondary:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.loading-section {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-section {
  max-width: 600px;
  margin: 0 auto;
}

.error-message {
  background: #fed7d7;
  color: #c53030;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.error-message h3 {
  margin-bottom: 0.5rem;
}

.retry-btn {
  background: #c53030;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .diagnosis-container {
    padding: 1rem;
  }

  .question-card, .results-card {
    padding: 1.5rem;
  }

  .question-navigation {
    flex-direction: column;
  }

  .results-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  /* Mobile-specific radio button improvements */
  .radio-group {
    gap: 0.75rem; /* Slightly tighter on mobile */
  }

  .radio-option {
    padding: 1rem; /* Reduce padding on mobile for better space usage */
    gap: 0.875rem; /* Slightly smaller gap on mobile */
  }

  .radio-input {
    width: 20px; /* Slightly larger for better touch targets on mobile */
    height: 20px;
  }

  .radio-label {
    font-size: 0.95rem; /* Slightly smaller text on mobile */
    line-height: 1.5;
  }
}

/* Additional responsive breakpoint for very small screens */
@media (max-width: 480px) {
  .radio-option {
    padding: 0.875rem;
    gap: 0.75rem;
  }

  .radio-input {
    width: 18px;
    height: 18px;
  }

  .radio-label {
    font-size: 0.9rem;
  }
}
</style>
