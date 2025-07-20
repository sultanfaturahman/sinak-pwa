<template>
  <div class="recommendation-container">
    <!-- Header Section -->
    <div class="recommendation-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">🤖 Rekomendasi AI untuk Bisnis Anda</h1>
          <p class="page-subtitle">
            Rekomendasi yang dipersonalisasi berdasarkan analisis tahap bisnis dan profil UMKM Anda
          </p>
        </div>
        
        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-card hover-lift animate-bounce-in">
            <div class="stat-number">{{ progressStats.total }}</div>
            <div class="stat-label">Total Rekomendasi</div>
          </div>
          <div class="stat-card hover-lift animate-bounce-in">
            <div class="stat-number">{{ progressStats.completed }}</div>
            <div class="stat-label">Selesai</div>
          </div>
          <div class="stat-card hover-lift animate-bounce-in">
            <div class="stat-number">{{ progressStats.completionRate }}%</div>
            <div class="stat-label">Progress</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Loading State -->
    <div v-if="loadingState.isLoading || generatingRecommendations" class="loading-section">
      <LoadingState
        type="progress"
        :title="getLoadingTitle()"
        :message="loadingState.message || 'Mohon tunggu sebentar...'"
        :progress="loadingState.progress"
        :show-progress="true"
        :steps="loadingState.steps"
        :current-step="loadingState.currentStep"
      />
    </div>

    <!-- Skeleton Loading for Initial Load -->
    <div v-else-if="loading && !recommendations.length" class="skeleton-section">
      <div class="skeleton-header">
        <SkeletonLoader type="stats" />
      </div>
      <div class="skeleton-content">
        <SkeletonLoader
          v-for="n in 3"
          :key="n"
          type="card"
          :animate="true"
        />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-section">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>Terjadi Kesalahan</h3>
        <p>{{ error }}</p>
        <button @click="handleRetry" class="retry-btn">
          Coba Lagi
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="recommendation-main">
      <!-- Filters and Controls -->
      <div class="controls-section">
        <div class="filters">
          <div class="filter-group">
            <label for="category-filter">Kategori:</label>
            <select 
              id="category-filter"
              v-model="filters.category" 
              @change="setFilter('category', $event.target.value)"
              class="filter-select"
            >
              <option value="all">Semua Kategori</option>
              <option value="financial_management">Manajemen Keuangan</option>
              <option value="marketing_sales">Marketing & Penjualan</option>
              <option value="operations">Operasional</option>
              <option value="human_resources">SDM</option>
              <option value="technology">Teknologi</option>
              <option value="growth_strategy">Strategi Pertumbuhan</option>
              <option value="financial_literacy">Literasi Keuangan</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="priority-filter">Prioritas:</label>
            <select 
              id="priority-filter"
              v-model="filters.priority"
              @change="setFilter('priority', $event.target.value)"
              class="filter-select"
            >
              <option value="all">Semua Prioritas</option>
              <option value="critical">Kritis</option>
              <option value="high">Tinggi</option>
              <option value="medium">Sedang</option>
              <option value="low">Rendah</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select
              id="status-filter"
              v-model="filters.completed"
              @change="setFilter('completed', $event.target.value)"
              class="filter-select"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Selesai</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="bookmark-filter">Bookmark:</label>
            <select
              id="bookmark-filter"
              v-model="filters.bookmarked"
              @change="setFilter('bookmarked', $event.target.value)"
              class="filter-select"
            >
              <option value="all">Semua</option>
              <option value="bookmarked">Tersimpan</option>
              <option value="not_bookmarked">Belum Disimpan</option>
            </select>
          </div>
        </div>
        
        <div class="actions">
          <button @click="refreshRecommendations" class="refresh-btn" :disabled="loading">
            🔄 Perbarui Rekomendasi
          </button>
        </div>
      </div>

      <!-- Critical Recommendations Alert -->
      <div v-if="criticalRecommendations.length > 0" class="critical-alert animate-bounce-in animate-glow">
        <div class="alert-content">
          <div class="alert-icon animate-pulse">🚨</div>
          <div class="alert-text">
            <h4>Perhatian: {{ criticalRecommendations.length }} Rekomendasi Kritis</h4>
            <p>Ada rekomendasi dengan prioritas kritis yang memerlukan perhatian segera.</p>
          </div>
        </div>
      </div>

      <!-- Next Actions Section -->
      <div v-if="nextActions.length > 0" class="next-actions-section">
        <h3 class="section-title">🎯 Aksi Selanjutnya</h3>
        <div class="next-actions-grid">
          <div 
            v-for="action in nextActions" 
            :key="action.id"
            class="action-card"
            :class="`priority-${action.priority}`"
          >
            <div class="action-header">
              <h4 class="action-title">{{ action.title }}</h4>
              <span class="priority-badge" :class="`priority-${action.priority}`">
                {{ getPriorityLabel(action.priority) }}
              </span>
            </div>
            <p class="action-description">{{ action.description }}</p>
            <div class="action-meta">
              <span class="action-time">⏱️ {{ action.estimatedHours }}h</span>
              <span v-if="action.deadline" class="action-deadline">
                📅 {{ formatDate(action.deadline) }}
              </span>
            </div>
            <button 
              @click="completeActionItem(action.recommendationId, action.id)"
              class="complete-action-btn"
            >
              ✅ Tandai Selesai
            </button>
          </div>
        </div>
      </div>

      <!-- Recommendations Grid -->
      <div class="recommendations-section">
        <div class="section-header">
          <h3 class="section-title">📋 Semua Rekomendasi</h3>
          <div class="sort-controls">
            <label for="sort-select">Urutkan:</label>
            <select 
              id="sort-select"
              v-model="sortBy" 
              @change="setSortBy($event.target.value)"
              class="sort-select"
            >
              <option value="priority">Prioritas</option>
              <option value="date">Tanggal</option>
              <option value="category">Kategori</option>
            </select>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredRecommendations.length === 0" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">📝</div>
            <h3>Belum Ada Rekomendasi</h3>
            <p>Selesaikan diagnosis bisnis terlebih dahulu untuk mendapatkan rekomendasi yang dipersonalisasi.</p>
            <router-link to="/diagnosis" class="cta-btn">
              📊 Mulai Diagnosis
            </router-link>
          </div>
        </div>

        <!-- Recommendations Grid with Staggered Animation -->
        <StaggeredTransition
          v-else
          name="stagger-scale"
          tag="div"
          class="recommendations-grid"
          :delay="100"
          :appear="true"
        >
          <RecommendationCard
            v-for="(recommendation, index) in filteredRecommendations"
            :key="recommendation.id"
            :data-index="index"
            :recommendation="recommendation"
            class="recommendation-card-animated hover-lift"
            @complete="handleCompleteRecommendation"
            @toggle-bookmark="toggleBookmark"
            @complete-action="completeActionItem"
            @start-recommendation="handleStartRecommendation"
            @update-progress="handleUpdateProgress"
            @restart-recommendation="handleRestartRecommendation"
            @skip-recommendation="handleSkipRecommendation"
            @start-step="handleStartStep"
            @complete-step="handleCompleteStep"
            @skip-step="handleSkipStep"
            @toggle-checkpoint="handleToggleCheckpoint"
            @show-step-details="handleShowStepDetails"
          />
        </StaggeredTransition>
      </div>
    </div>

    <!-- Step Detail Modal -->
    <StepDetailModal
      v-if="selectedStep"
      :step="selectedStep"
      :is-visible="showStepModal"
      @close="handleStepModalClose"
      @start-step="handleStartStep"
      @complete-step="handleCompleteStep"
      @restart-step="handleStartStep"
      @skip-step="handleSkipStep"
      @toggle-checkpoint="handleToggleCheckpoint"
      @save-notes="handleSaveStepNotes"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRecommendationStore } from '../store/recommendation.js';
import { useAuthStore } from '../store/auth.js';
import { useDiagnosisStore } from '../store/diagnosis.js';
import { useRouter } from 'vue-router';
import RecommendationCard from '../components/common/RecommendationCard.vue';
import LoadingState from '../components/common/LoadingState.vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import StaggeredTransition from '../components/transitions/StaggeredTransition.vue';
import StepDetailModal from '../components/recommendations/StepDetailModal.vue';
import { getFirebaseErrorStats } from '../services/firestoreService.js';
import { storeToRefs } from 'pinia';
import { setupScrollAnimations, animateNumber, DURATION } from '../utils/animations.js';

// Stores
const recommendationStore = useRecommendationStore();
const authStore = useAuthStore();
const diagnosisStore = useDiagnosisStore();
const router = useRouter();

// Reactive data
const loading = ref(false);

// Computed properties from store - Fix reactivity issue
const {
  recommendations,
  filteredRecommendations,
  criticalRecommendations,
  nextActions,
  progressStats,
  generatingRecommendations,
  error,
  filters,
  sortBy,
  loadingState
} = storeToRefs(recommendationStore);

// Firebase status monitoring
const firebaseStatus = ref(null);

// Debug: Watch for changes in recommendations
watch(recommendations, (newRecs) => {
  console.log('🔍 DEBUG: Vue component - recommendations changed');
  console.log('🔍 DEBUG: New recommendations:', newRecs);
  console.log('🔍 DEBUG: New recommendations length:', newRecs?.length);

  // Update Firebase status
  firebaseStatus.value = getFirebaseErrorStats();
}, { deep: true, immediate: true });

watch(filteredRecommendations, (newFiltered) => {
  console.log('🔍 DEBUG: Vue component - filteredRecommendations changed');
  console.log('🔍 DEBUG: New filtered:', newFiltered);
  console.log('🔍 DEBUG: New filtered length:', newFiltered?.length);
}, { deep: true, immediate: true });

// Methods from store
const {
  loadRecommendations,
  completeRecommendation,
  toggleBookmark,
  completeActionItem,
  setFilter,
  setSortBy,
  refreshRecommendations,
  startRecommendation,
  updateRecommendationProgress,
  restartRecommendation,
  skipRecommendation,
  startProgressStep,
  completeProgressStep,
  skipProgressStep,
  toggleStepCheckpoint,
  saveStepNotes
} = recommendationStore;

// Computed properties
const user = computed(() => authStore.user);

// Methods - Enhanced retry with recommendation generation
const handleRetry = async () => {
  console.log('🔄 Retrying recommendation generation...');

  // Clear error state
  recommendationStore.error = null;

  if (user.value) {
    // First try to load existing recommendations
    await loadRecommendations(user.value.uid);

    // If no recommendations found, force generate new ones
    if (!recommendations.value || recommendations.value.length === 0) {
      await forceGenerateRecommendations();
    }
  }
};

// Completion tracking event handlers
const handleStartRecommendation = async (data) => {
  console.log('🚀 Starting recommendation from UI:', data);
  await startRecommendation(data.id, data);
};

const handleUpdateProgress = async (data) => {
  console.log('📊 Updating progress from UI:', data);
  await updateRecommendationProgress(data.id, data);
};

const handleCompleteRecommendation = async (data) => {
  console.log('✅ Completing recommendation from UI:', data);
  await completeRecommendation(data.id, data);
};

const handleRestartRecommendation = async (data) => {
  console.log('🔄 Restarting recommendation from UI:', data);
  await restartRecommendation(data.id, data);
};

const handleSkipRecommendation = async (data) => {
  console.log('⏭️ Skipping recommendation from UI:', data);
  await skipRecommendation(data.id, data);
};

// Step management event handlers
const selectedStep = ref(null);
const showStepModal = ref(false);

const handleStartStep = async (data) => {
  console.log('🚀 Starting step from UI:', data);
  await startProgressStep(data.recommendationId, data.stepId);
};

const handleCompleteStep = async (data) => {
  console.log('✅ Completing step from UI:', data);
  await completeProgressStep(data.recommendationId, data.stepId, data.notes);
};

const handleSkipStep = async (data) => {
  console.log('⏭️ Skipping step from UI:', data);
  await skipProgressStep(data.recommendationId, data.stepId);
};

const handleToggleCheckpoint = async (data) => {
  console.log('📋 Toggling checkpoint from UI:', data);
  await toggleStepCheckpoint(data.recommendationId, data.stepId, data.checkpointId);
};

const handleShowStepDetails = (data) => {
  console.log('👁️ Showing step details:', data);
  selectedStep.value = data.step;
  showStepModal.value = true;
};

const handleStepModalClose = () => {
  showStepModal.value = false;
  selectedStep.value = null;
};

const handleSaveStepNotes = async (data) => {
  console.log('📝 Saving step notes:', data);
  await saveStepNotes(selectedStep.value.recommendationId, data.stepId, data.notes);
};

const getPriorityLabel = (priority) => {
  const labels = {
    critical: 'Kritis',
    high: 'Tinggi',
    medium: 'Sedang',
    low: 'Rendah'
  };
  return labels[priority] || 'Sedang';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Force recommendation generation (can be called from other components)
const forceGenerateRecommendations = async () => {
  console.log('🔄 Force generating recommendations...');

  // Ensure diagnosis data is loaded
  diagnosisStore.loadDiagnosisData();

  // Create business profile
  const businessProfile = {
    userId: user.value.uid,
    businessName: user.value.namaUsaha || user.value.displayName || 'Bisnis Saya',
    businessCategory: user.value.businessCategory || 'services',
    businessStage: diagnosisStore.currentStage || user.value.businessStage || 'existence',
    employeeCount: user.value.employeeCount || 1,
    monthlyRevenue: user.value.monthlyRevenue || 0,
    businessAge: user.value.businessAge || 1,
    location: user.value.location || 'Indonesia',
    challenges: user.value.challenges || [],
    goals: user.value.goals || []
  };

  const diagnosisData = {
    currentStage: diagnosisStore.currentStage || 'existence',
    answers: diagnosisStore.currentAnswers || {},
    strengths: [],
    weaknesses: [],
    opportunities: []
  };

  try {
    await recommendationStore.generateRecommendations(businessProfile, diagnosisData);
    console.log('✅ Force generation completed');
  } catch (error) {
    console.error('❌ Force generation failed:', error);
  }
};

// Get loading title based on current phase
const getLoadingTitle = () => {
  const phaseTitles = {
    'loading': '📥 Memuat Data',
    'analyzing': '🔍 Menganalisis Bisnis',
    'generating': '🤖 Menghasilkan Rekomendasi AI',
    'saving': '💾 Menyimpan Hasil',
    'complete': '✅ Selesai!'
  };

  return phaseTitles[loadingState.value.phase] || '🔄 Memproses...';
};



// Animation setup
const scrollObserver = ref(null);

// Setup animations after component mount
const setupAnimations = () => {
  // Setup scroll animations
  scrollObserver.value = setupScrollAnimations();

  // Animate stats numbers
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach((el, index) => {
    const targetValue = parseInt(el.textContent) || 0;
    setTimeout(() => {
      animateNumber(el, 0, targetValue, DURATION.slow);
    }, index * 200);
  });

  // Add animation classes to elements
  const animatedElements = document.querySelectorAll('.stat-card, .section-header, .action-card');
  animatedElements.forEach((el, index) => {
    el.classList.add('animate-on-scroll');
    el.dataset.animation = 'slideUp';
    el.dataset.delay = (index * 100).toString();
  });
};

// Lifecycle
onMounted(async () => {
  try {
    console.log('🔍 DEBUG: onMounted started');

    // Check if user is authenticated
    if (!user.value) {
      console.log('🔍 DEBUG: User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('🔍 DEBUG: User authenticated:', user.value.uid);

    // CRITICAL FIX: Load diagnosis data first
    console.log('🔍 DEBUG: Loading diagnosis data...');
    diagnosisStore.loadDiagnosisData();
    console.log('🔍 DEBUG: After loading diagnosis, currentStage:', diagnosisStore.currentStage);
    console.log('🔍 DEBUG: After loading diagnosis, isCompleted:', diagnosisStore.isCompleted);

  // Load existing recommendations
  console.log('🔍 DEBUG: Loading recommendations for user:', user.value.uid);
  await loadRecommendations(user.value.uid);
  console.log('🔍 DEBUG: After loading, recommendations.value:', recommendations.value);
  console.log('🔍 DEBUG: After loading, recommendations.value.length:', recommendations.value?.length);

  // Check if we should generate recommendations
  console.log('🔍 DEBUG: Checking if should generate recommendations');
  console.log('🔍 DEBUG: recommendations.value:', recommendations.value);
  console.log('🔍 DEBUG: recommendations.value.length:', recommendations.value?.length);
  console.log('🔍 DEBUG: diagnosisStore.currentStage:', diagnosisStore.currentStage);
  console.log('🔍 DEBUG: diagnosisStore.isCompleted:', diagnosisStore.isCompleted);

  // Generate recommendations if:
  // 1. No existing recommendations AND
  // 2. User has completed diagnosis OR we're in bypass mode
  const shouldGenerate = (!recommendations.value || recommendations.value.length === 0) &&
                         (diagnosisStore.isCompleted || import.meta.env.VITE_BYPASS_JSON_PARSING === 'true');

  console.log('🔍 DEBUG: shouldGenerate:', shouldGenerate);

  if (shouldGenerate) {
    console.log('🔍 DEBUG: Generating new recommendations...');
    // Create business profile with enhanced fallbacks
    const businessProfile = {
      userId: user.value.uid,
      businessName: user.value.namaUsaha || user.value.displayName || 'Bisnis Saya',
      businessCategory: user.value.businessCategory || 'services',
      businessStage: diagnosisStore.currentStage || user.value.businessStage || 'existence',
      employeeCount: user.value.employeeCount || 1,
      monthlyRevenue: user.value.monthlyRevenue || 0,
      businessAge: user.value.businessAge || 1,
      location: user.value.location || 'Indonesia',
      challenges: user.value.challenges || [],
      goals: user.value.goals || []
    };

    console.log('🔍 DEBUG: Created business profile:', businessProfile);
    
    const diagnosisData = {
      currentStage: diagnosisStore.currentStage || 'growth', // Default stage for testing
      answers: diagnosisStore.answers || {},
      strengths: [],
      weaknesses: [],
      opportunities: []
    };
    
    try {
      console.log('🔍 DEBUG: Calling generateRecommendations with:', businessProfile);
      console.log('🔍 DEBUG: diagnosisData:', diagnosisData);

      const result = await recommendationStore.generateRecommendations(businessProfile, diagnosisData);

      console.log('🔍 DEBUG: generateRecommendations returned:', result);
      console.log('🔍 DEBUG: After generateRecommendations, recommendations.value:', recommendations.value);
      console.log('🔍 DEBUG: After generateRecommendations, recommendations.value.length:', recommendations.value?.length);
    } catch (error) {
      console.error('❌ Failed to generate recommendations:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
  } else {
    console.log('🔍 DEBUG: Not generating recommendations - already have:', recommendations.value?.length, 'recommendations');
  }

  // Check for route query parameters that might trigger recommendation generation
  if (router.currentRoute.value.query.generate === 'true') {
    console.log('🔍 DEBUG: Route query parameter detected, forcing generation...');
    await forceGenerateRecommendations();
  }

  // Setup animations after everything is loaded
  setTimeout(() => {
    setupAnimations();
  }, 100);

  } catch (error) {
    console.error('❌ Critical error in onMounted:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
  }
});

// Cleanup
onUnmounted(() => {
  if (scrollObserver.value) {
    scrollObserver.value.disconnect();
  }
});

// Expose methods for external use
defineExpose({
  forceGenerateRecommendations
});
</script>

<style scoped>
/* Recommendation Container */
.recommendation-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Header Section */
.recommendation-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

/* Quick Stats */
.quick-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  min-width: 120px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  display: block;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Enhanced Loading Section */
.loading-section {
  max-width: 1200px;
  margin: 20px auto;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  padding: 20px;
}

/* Skeleton Loading Section */
.skeleton-section {
  max-width: 1200px;
  margin: 20px auto;
}

.skeleton-header {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-content h3 {
  color: #374151;
  margin: 1rem 0 0.5rem 0;
  font-size: 1.5rem;
}

.loading-content p {
  color: #6b7280;
  font-size: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error Section */
.error-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
}

.error-content {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-content h3 {
  color: #374151;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.error-content p {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.retry-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
}

/* Main Content */
.recommendation-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Controls Section */
.controls-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.filters {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.filter-select,
.sort-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus,
.sort-select:focus {
  outline: none;
  border-color: #667eea;
}

.refresh-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Critical Alert */
.critical-alert {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #f87171;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.alert-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.alert-text h4 {
  color: #dc2626;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.alert-text p {
  color: #991b1b;
  margin: 0;
  font-size: 0.875rem;
}

/* Next Actions Section */
.next-actions-section {
  margin-bottom: 3rem;
}

.section-title {
  color: #374151;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
}

.next-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #e5e7eb;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.action-card.priority-critical {
  border-left-color: #ef4444;
}

.action-card.priority-high {
  border-left-color: #f59e0b;
}

.action-card.priority-medium {
  border-left-color: #3b82f6;
}

.action-card.priority-low {
  border-left-color: #10b981;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.action-title {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
}

.priority-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
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

.action-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.action-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.complete-action-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 100%;
}

.complete-action-btn:hover {
  transform: translateY(-1px);
}

/* Recommendations Section */
.recommendations-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-controls label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-content {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-content h3 {
  color: #374151;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.empty-content p {
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.cta-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  display: inline-block;
  transition: transform 0.2s ease;
}

.cta-btn:hover {
  transform: translateY(-2px);
}

/* Recommendations Grid */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }

  .quick-stats {
    justify-content: center;
  }

  .page-title {
    font-size: 2rem;
  }

  .recommendation-main {
    padding: 1rem;
  }

  .controls-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filters {
    justify-content: center;
  }

  .next-actions-grid {
    grid-template-columns: 1fr;
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .stat-card {
    min-width: 100px;
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .action-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .filters {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-group {
    width: 100%;
  }
}

/* ===== ANIMATION ENHANCEMENTS ===== */

/* Recommendation Card Animations */
.recommendation-card-animated {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, box-shadow;
}

/* Staggered Animation Delays */
.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }

.critical-alert {
  animation-delay: 0.4s;
}

.section-header {
  animation-delay: 0.2s;
}

/* Enhanced Grid Layout for Animations */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

/* Enhanced Hover Effects */
.hover-lift {
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, box-shadow;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

/* Mobile Animation Optimizations */
@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  /* Reduce animation intensity on mobile */
  .animate-bounce-in,
  .animate-slide-up,
  .animate-fade-in {
    animation-duration: 0.25s;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .recommendation-card-animated,
  .hover-lift {
    transition: none;
  }

  .animate-bounce-in,
  .animate-slide-up,
  .animate-fade-in,
  .animate-pulse,
  .animate-glow {
    animation: none;
  }
}
</style>
