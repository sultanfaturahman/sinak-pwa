<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="logo-section">
          <h1>SiNaik</h1>
          <span class="tagline">Dashboard UMKM</span>
        </div>
        <div class="user-section">
          <div class="user-info">
            <span class="welcome-text">Selamat datang,</span>
            <span class="business-name">{{ businessName }}</span>
          </div>
          <button @click="handleLogout" class="logout-btn" :disabled="loading">
            {{ loading ? 'Keluar...' : 'Keluar' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-content">
        <!-- Welcome Card -->
        <div class="welcome-card">
          <div class="welcome-header">
            <h1 class="welcome-title">Selamat Datang di SiNaik!</h1>
            <p class="welcome-subtitle">Sistem Intervensi Terpandu untuk membantu UMKM Anda berkembang</p>
          </div>
          
          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-number">{{ currentStage ? '1' : '0' }}</span>
              <span class="stat-label">Diagnosis Selesai</span>
              <div class="stat-description">{{ currentStage ? 'Tahap bisnis teridentifikasi' : 'Belum melakukan diagnosis' }}</div>
            </div>
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">Rekomendasi Aktif</span>
              <div class="stat-description">Saran untuk pengembangan bisnis</div>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userPoints }}</span>
              <span class="stat-label">Poin Pencapaian</span>
              <div class="stat-description">Dari menyelesaikan tantangan</div>
            </div>
          </div>
        </div>

        <!-- Current Stage Card (if diagnosed) -->
        <div v-if="currentStage" class="current-stage-card">
          <div class="stage-header">
            <h2 class="stage-title">🎯 Tahap Bisnis Anda Saat Ini</h2>
            <div class="stage-badge">{{ currentStageDetails?.name }}</div>
          </div>
          <div class="stage-content">
            <p class="stage-description">{{ currentStageDetails?.description }}</p>
            <div class="stage-actions">
              <router-link to="/diagnosis" class="btn btn-outline">
                📊 Lihat Detail Tahap
              </router-link>
            </div>
          </div>
        </div>

        <!-- Primary Action Section for New Users -->
        <div v-if="!currentStage" class="primary-action-section">
          <div class="primary-action-card">
            <div class="primary-icon">🚀</div>
            <h2>Mulai Perjalanan Bisnis Anda</h2>
            <p>Langkah pertama untuk mengembangkan UMKM adalah memahami tahap bisnis Anda saat ini. Diagnosis ini akan membantu memberikan rekomendasi yang tepat.</p>
            <router-link to="/diagnosis" class="btn btn-primary btn-large">
              📊 Mulai Diagnosis Bisnis
            </router-link>
          </div>
        </div>

        <!-- Action Cards -->
        <div class="action-cards">
          <div class="action-card" :class="{ 'card-primary': !currentStage }">
            <div class="card-header">
              <div class="card-icon">📊</div>
              <div class="card-status" v-if="currentStage">
                <span class="status-badge status-complete">Selesai</span>
              </div>
            </div>
            <div class="card-content">
              <h3>Diagnosis Bisnis</h3>
              <p>Tentukan tahap perkembangan bisnis Anda berdasarkan model Churchill & Lewis</p>
            </div>
            <div class="card-actions">
              <router-link 
                to="/diagnosis" 
                :class="['btn', currentStage ? 'btn-outline' : 'btn-primary']"
              >
                {{ currentStage ? '🔄 Perbarui Diagnosis' : '🚀 Mulai Diagnosis' }}
              </router-link>
            </div>
          </div>
          
          <div class="action-card" :class="{ 'card-disabled': !currentStage }">
            <div class="card-header">
              <div class="card-icon">💡</div>
              <div class="card-status" v-if="!currentStage">
                <span class="status-badge status-locked">Terkunci</span>
              </div>
            </div>
            <div class="card-content">
              <h3>Rekomendasi Bisnis</h3>
              <p>Dapatkan saran terpersonalisasi untuk mengembangkan bisnis Anda</p>
            </div>
            <div class="card-actions">
              <router-link
                v-if="currentStage"
                to="/recommendations?generate=true"
                class="btn btn-primary"
              >
                💡 Lihat Rekomendasi
              </router-link>
              <button
                v-else
                class="btn btn-disabled"
                disabled
              >
                🔒 Selesaikan Diagnosis Dulu
              </button>
          </div>
        </div>

          <div class="action-card">
            <div class="card-header">
              <div class="card-icon">📑</div>
            </div>
            <div class="card-content">
              <h3>Laporan Keuangan</h3>
              <p>Catat pemasukan dan pengeluaran harian Anda</p>
            </div>
            <div class="card-actions">
              <router-link to="/finance" class="btn btn-primary">
                📑 Input Laporan
              </router-link>
            </div>
          </div>

          <div class="action-card" :class="{ 'card-disabled': !currentStage }">
            <div class="card-header">
              <div class="card-icon">🎯</div>
              <div class="card-status" v-if="!currentStage">
                <span class="status-badge status-locked">Terkunci</span>
              </div>
            </div>
            <div class="card-content">
              <h3>Tantangan & Gamifikasi</h3>
              <p>Raih poin dan pencapaian dengan menyelesaikan tantangan bisnis</p>
            </div>
            <div class="card-actions">
              <button 
                class="btn" 
                :class="currentStage ? 'btn-primary' : 'btn-disabled'"
                :disabled="!currentStage"
              >
                {{ currentStage ? '🎯 Mulai Tantangan' : '🔒 Selesaikan Diagnosis Dulu' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { logoutUser } from '../services/authService';
import { getUserDocument } from '../services/firestoreService';
import { useAuthStore } from '../store/auth';
import { useDiagnosisStore } from '../store/diagnosis';
import { getStageById } from '../data/businessStages';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const diagnosisStore = useDiagnosisStore();
const router = useRouter();
const loading = ref(false);

const user = computed(() => authStore.user);
const businessName = computed(() => {
  return authStore.user?.namaUsaha || 'Pengguna';
});

const currentStage = computed(() => {
  return authStore.user?.businessStage || diagnosisStore.currentStage;
});

const currentStageDetails = computed(() => {
  return currentStage.value ? getStageById(currentStage.value) : null;
});

const userPoints = computed(() => {
  return authStore.user?.points || 0;
});

onMounted(async () => {
  // Load diagnosis data
  diagnosisStore.loadDiagnosisData();
  
  // Load additional user data from Firestore and create document if missing
  if (user.value && user.value.uid) {
    try {
      console.log('🔄 Loading user data from Firestore...');
      let userData = await getUserDocument(user.value.uid);

      if (userData) {
        // User document exists, merge with current user data
        authStore.setUser({ ...user.value, ...userData });
        console.log('✅ User data loaded successfully from Firestore');
      } else {
        console.log('📝 User document not found, creating default document...');

        // Create default user document for dashboard access
        const defaultUserData = {
          uid: user.value.uid,
          email: user.value.email,
          namaUsaha: user.value.namaUsaha || user.value.displayName || 'Bisnis Saya',

          // Business profile defaults
          businessProfile: {
            businessName: user.value.namaUsaha || user.value.displayName || 'Bisnis Saya',
            category: null,
            stage: null,
            location: null,
            employeeCount: null,
            monthlyRevenue: null,
            challenges: [],
            goals: [],
            description: null
          },

          // User preferences
          preferences: {
            language: 'id',
            notifications: true,
            theme: 'light'
          },

          // Analytics
          analytics: {
            totalRecommendations: 0,
            completedRecommendations: 0,
            lastLoginAt: new Date().toISOString(),
            dashboardAccessAt: new Date().toISOString()
          },

          // Status
          isActive: true,
          isEmailVerified: user.value.emailVerified || false,
          onboardingCompleted: false,

          // Dashboard creation flag
          createdFromDashboard: true,
          dashboardCreationDate: new Date().toISOString()
        };

        // Import createUserDocument dynamically to avoid circular imports
        const { createUserDocument } = await import('../services/firestoreService.js');
        const documentCreated = await createUserDocument(user.value.uid, defaultUserData);

        if (documentCreated) {
          console.log('✅ Default user document created from dashboard');
          authStore.setUser({ ...user.value, ...defaultUserData });
          userData = defaultUserData;
        } else {
          console.warn('⚠️ Failed to create user document from dashboard');
          // Continue with minimal user data
          authStore.setUser({
            ...user.value,
            namaUsaha: user.value.namaUsaha || 'Bisnis Saya',
            documentCreationFailed: true
          });
        }
      }

      // Update user analytics with dashboard access
      if (userData && userData.analytics) {
        try {
          const updatedAnalytics = {
            ...userData.analytics,
            lastDashboardAccess: new Date().toISOString(),
            dashboardAccessCount: (userData.analytics.dashboardAccessCount || 0) + 1
          };

          // Update analytics in background (non-blocking)
          const { createUserDocument } = await import('../services/firestoreService.js');
          createUserDocument(user.value.uid, {
            analytics: updatedAnalytics
          }).catch(error => {
            console.warn('⚠️ Failed to update dashboard access analytics:', error);
          });

        } catch (error) {
          console.warn('⚠️ Error updating dashboard analytics:', error);
        }
      }

    } catch (error) {
      console.warn('⚠️ Could not load/create user data from Firestore:', error);
      console.warn('⚠️ Error details:', error.message);

      // App continues to work without Firestore data
      // Ensure user has at least basic data for dashboard functionality
      if (!user.value.namaUsaha && !user.value.displayName) {
        authStore.setUser({
          ...user.value,
          namaUsaha: 'Bisnis Saya',
          firestoreError: true,
          errorMessage: error.message
        });
      }
    }
  }
});

const handleLogout = async () => {
  if (loading.value) return;
  
  loading.value = true;
  try {
    await logoutUser();
    authStore.setUser(null);
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
}

.tagline {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.welcome-text {
  font-size: 0.875rem;
  opacity: 0.9;
}

.business-name {
  font-weight: 600;
  font-size: 1.125rem;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  font-weight: 500;
}

.logout-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.logout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Welcome Card */
.welcome-card {
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.welcome-header {
  margin-bottom: 3rem;
}

.welcome-title {
  color: #1a202c;
  margin-bottom: 0.5rem;
  font-size: 2.25rem;
  font-weight: 700;
}

.welcome-subtitle {
  color: #4a5568;
  font-size: 1.125rem;
  max-width: 600px;
  margin: 0 auto;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  transition: transform 150ms ease-in-out;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.stat-label {
  color: #1a202c;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.stat-description {
  color: #718096;
  font-size: 0.875rem;
  text-align: center;
  line-height: 1.4;
}

/* Current Stage Card */
.current-stage-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 1rem;
  padding: 3rem;
  margin-bottom: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.stage-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.stage-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.stage-content {
  text-align: left;
}

.stage-description {
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  opacity: 0.95;
}

/* Primary Action Section */
.primary-action-section {
  margin-bottom: 2rem;
}

.primary-action-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.primary-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.primary-action-card h2 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: white;
}

.primary-action-card p {
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.95;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  color: white;
}

/* Action Cards */
.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.action-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 250ms ease-in-out;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.action-card.card-primary {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
}

.action-card.card-disabled {
  opacity: 0.6;
  background: #f8fafc;
}

.action-card.card-disabled:hover {
  transform: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.card-icon {
  font-size: 3rem;
  line-height: 1;
}

.card-status {
  margin-left: auto;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-complete {
  background: #10b981;
  color: white;
}

.status-locked {
  background: #718096;
  color: white;
}

.card-content {
  flex: 1;
  margin-bottom: 1.5rem;
}

.card-content h3 {
  color: #1a202c;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-content p {
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

.card-actions {
  margin-top: auto;
}

/* Button System */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  min-height: 44px;
  gap: 0.25rem;
}

.btn:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border-color: #667eea;
}

.btn-outline:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-disabled {
  background: #edf2f7;
  color: #718096;
  border-color: #edf2f7;
  cursor: not-allowed;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  min-height: 56px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    padding: 0 1.5rem;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .dashboard-main {
    padding: 1.5rem;
  }

  .action-cards {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stage-header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
    text-align: center;
  }

  .welcome-title {
    font-size: 1.875rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .welcome-card {
    padding: 2rem;
  }

  .current-stage-card,
  .primary-action-card {
    padding: 2rem;
  }

  .action-card {
    padding: 1.5rem;
  }

  .stat-number {
    font-size: 2.25rem;
  }
}
</style>
