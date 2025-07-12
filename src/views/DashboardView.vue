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
          <button @click="handleLogout" class="logout-btn">
            Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-content">
        <!-- Welcome Card -->
        <div class="welcome-card">
          <h2>Selamat Datang di SiNaik!</h2>
          <p>Sistem Intervensi Terpandu untuk membantu UMKM Anda berkembang</p>
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">Tahap Bisnis</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">Rekomendasi</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">Poin</span>
            </div>
          </div>
        </div>

        <!-- Action Cards -->
        <div class="action-cards">
          <div class="action-card">
            <div class="card-icon">📊</div>
            <h3>Diagnosis Bisnis</h3>
            <p>Tentukan tahap perkembangan bisnis Anda berdasarkan model Churchill & Lewis</p>
            <button class="action-btn">Mulai Diagnosis</button>
          </div>

          <div class="action-card">
            <div class="card-icon">💡</div>
            <h3>Rekomendasi</h3>
            <p>Dapatkan saran terpersonalisasi untuk mengembangkan bisnis Anda</p>
            <button class="action-btn">Lihat Rekomendasi</button>
          </div>

          <div class="action-card">
            <div class="card-icon">🎯</div>
            <h3>Gamifikasi</h3>
            <p>Raih poin dan pencapaian dengan menyelesaikan tantangan bisnis</p>
            <button class="action-btn">Mulai Tantangan</button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
          <h3>Aktivitas Terbaru</h3>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">🎉</div>
              <div class="activity-content">
                <p><strong>Selamat datang!</strong></p>
                <p>Anda telah bergabung dengan SiNaik</p>
                <span class="activity-time">Baru saja</span>
              </div>
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
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);

const user = computed(() => authStore.user);
const businessName = computed(() => {
  return authStore.user?.namaUsaha || 'Pengguna';
});

onMounted(async () => {
  // Load additional user data from Firestore if needed
  if (user.value && user.value.uid) {
    try {
      console.log('🔄 Loading user data from Firestore...');
      const userData = await getUserDocument(user.value.uid);
      if (userData) {
        authStore.setUser({ ...user.value, ...userData });
        console.log('✅ User data loaded successfully');
      } else {
        console.log('ℹ️ No additional user data found in Firestore');
      }
    } catch (error) {
      console.warn('⚠️ Could not load user data from Firestore:', error);
      // App continues to work without Firestore data
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
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.tagline {
  font-size: 0.9rem;
  opacity: 0.9;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.welcome-text {
  font-size: 0.9rem;
  opacity: 0.9;
}

.business-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.welcome-card h2 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.welcome-card p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: transform 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.action-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.action-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.recent-activity {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.recent-activity h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-content {
  flex: 1;
}

.activity-content p {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.activity-time {
  font-size: 0.8rem;
  color: #999;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .dashboard-main {
    padding: 1rem;
  }

  .action-cards {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}
</style>
