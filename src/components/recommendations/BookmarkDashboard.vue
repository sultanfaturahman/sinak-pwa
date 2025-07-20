<template>
  <div class="bookmark-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">📚 Rekomendasi Tersimpan</h2>
        <p class="dashboard-subtitle">
          Kelola dan akses rekomendasi favorit Anda
        </p>
      </div>
      
      <!-- Bookmark Stats -->
      <div class="bookmark-stats">
        <div class="stat-item">
          <span class="stat-number">{{ bookmarkStats.total }}</span>
          <span class="stat-label">Total Tersimpan</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ collections.length }}</span>
          <span class="stat-label">Koleksi</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ recentlyBookmarked.length }}</span>
          <span class="stat-label">Baru Ditambah</span>
        </div>
      </div>
    </div>

    <!-- Collection Tabs -->
    <div class="collection-tabs">
      <button
        v-for="collection in collections"
        :key="collection.id"
        @click="activeCollection = collection.id"
        class="collection-tab"
        :class="{ active: activeCollection === collection.id }"
      >
        <span class="tab-icon" :style="{ color: collection.color }">
          {{ collection.icon }}
        </span>
        <span class="tab-name">{{ collection.name }}</span>
        <span class="tab-count">{{ getCollectionCount(collection.id) }}</span>
      </button>
      
      <!-- All Bookmarks Tab -->
      <button
        @click="activeCollection = 'all'"
        class="collection-tab"
        :class="{ active: activeCollection === 'all' }"
      >
        <span class="tab-icon">📋</span>
        <span class="tab-name">Semua</span>
        <span class="tab-count">{{ bookmarkStats.total }}</span>
      </button>
    </div>

    <!-- Collection Management -->
    <div class="collection-management">
      <button
        @click="showCreateCollection = true"
        class="create-collection-btn hover-lift"
      >
        <span class="btn-icon">➕</span>
        Buat Koleksi Baru
      </button>
      
      <button
        v-if="activeCollection !== 'all' && activeCollection !== 'default'"
        @click="showDeleteConfirm = true"
        class="delete-collection-btn hover-lift"
      >
        <span class="btn-icon">🗑️</span>
        Hapus Koleksi
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="currentRecommendations.length === 0" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">📌</div>
        <h3>Belum Ada Rekomendasi Tersimpan</h3>
        <p v-if="activeCollection === 'all'">
          Mulai simpan rekomendasi yang berguna untuk bisnis Anda
        </p>
        <p v-else>
          Koleksi "{{ getCollectionName(activeCollection) }}" masih kosong
        </p>
        <router-link to="/recommendations" class="cta-btn">
          📋 Lihat Semua Rekomendasi
        </router-link>
      </div>
    </div>

    <!-- Bookmarked Recommendations -->
    <div v-else class="bookmarked-recommendations">
      <StaggeredTransition
        name="stagger-scale"
        tag="div"
        class="recommendations-grid"
        :delay="100"
        :appear="true"
      >
        <div
          v-for="(recommendation, index) in currentRecommendations"
          :key="recommendation.id"
          :data-index="index"
          class="bookmark-card hover-lift"
        >
          <!-- Bookmark Header -->
          <div class="bookmark-header">
            <div class="bookmark-meta">
              <span class="collection-badge" :style="{ backgroundColor: getCollectionColor(recommendation.bookmarkCollection) }">
                {{ getCollectionIcon(recommendation.bookmarkCollection) }}
                {{ getCollectionName(recommendation.bookmarkCollection) }}
              </span>
              <span class="bookmark-date">
                {{ formatBookmarkDate(recommendation.bookmarkedAt) }}
              </span>
            </div>
            
            <BookmarkManager
              :recommendation="recommendation"
              @bookmark-toggled="handleBookmarkToggled"
              @collection-changed="handleCollectionChanged"
              @bookmark-removed="handleBookmarkRemoved"
            />
          </div>

          <!-- Recommendation Content -->
          <div class="recommendation-content">
            <div class="content-header">
              <h3 class="recommendation-title">{{ recommendation.title }}</h3>
              <span class="priority-badge" :class="`priority-${recommendation.priority}`">
                {{ getPriorityLabel(recommendation.priority) }}
              </span>
            </div>
            
            <p class="recommendation-description">{{ recommendation.description }}</p>
            
            <!-- Status and Progress -->
            <div class="recommendation-status">
              <div class="status-badge" :class="`status-${recommendation.status || 'pending'}`">
                {{ getStatusText(recommendation.status || 'pending') }}
              </div>
              
              <div v-if="recommendation.progress > 0" class="progress-info">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${recommendation.progress}%` }"></div>
                </div>
                <span class="progress-text">{{ recommendation.progress }}%</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bookmark-actions">
            <router-link
              :to="`/recommendations?highlight=${recommendation.id}`"
              class="action-btn primary"
            >
              <span class="btn-icon">👁️</span>
              Lihat Detail
            </router-link>
            
            <button
              v-if="!recommendation.isCompleted"
              @click="startImplementation(recommendation)"
              class="action-btn secondary"
            >
              <span class="btn-icon">🚀</span>
              Mulai
            </button>
          </div>
        </div>
      </StaggeredTransition>
    </div>

    <!-- Create Collection Modal -->
    <div v-if="showCreateCollection" class="modal-overlay" @click="showCreateCollection = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Buat Koleksi Baru</h3>
          <button @click="showCreateCollection = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="collection-name">Nama Koleksi:</label>
            <input
              id="collection-name"
              v-model="newCollectionName"
              placeholder="Masukkan nama koleksi..."
              class="form-input"
              @keyup.enter="createCollection"
            />
          </div>
          
          <div class="form-group">
            <label for="collection-description">Deskripsi (opsional):</label>
            <textarea
              id="collection-description"
              v-model="newCollectionDescription"
              placeholder="Deskripsi koleksi..."
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Icon:</label>
            <div class="icon-selector">
              <button
                v-for="icon in availableIcons"
                :key="icon"
                @click="newCollectionIcon = icon"
                class="icon-btn"
                :class="{ active: newCollectionIcon === icon }"
              >
                {{ icon }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showCreateCollection = false" class="btn-secondary">Batal</button>
          <button @click="createCollection" class="btn-primary">Buat Koleksi</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Hapus Koleksi</h3>
          <button @click="showDeleteConfirm = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <p>Yakin ingin menghapus koleksi "{{ getCollectionName(activeCollection) }}"?</p>
          <p class="warning-text">
            Semua rekomendasi dalam koleksi ini akan dipindah ke "Favorit Saya".
          </p>
        </div>
        
        <div class="modal-footer">
          <button @click="showDeleteConfirm = false" class="btn-secondary">Batal</button>
          <button @click="deleteCollection" class="btn-danger">Hapus Koleksi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRecommendationStore } from '../../store/recommendation.js';
import { useRouter } from 'vue-router';
import StaggeredTransition from '../transitions/StaggeredTransition.vue';
import BookmarkManager from './BookmarkManager.vue';
import { RECOMMENDATION_STATUS } from '../../types/recommendation.js';

const recommendationStore = useRecommendationStore();
const router = useRouter();

// Local state
const activeCollection = ref('all');
const showCreateCollection = ref(false);
const showDeleteConfirm = ref(false);
const newCollectionName = ref('');
const newCollectionDescription = ref('');
const newCollectionIcon = ref('📁');

// Available icons for collections
const availableIcons = ['📁', '⭐', '🚨', '📅', '💡', '🎯', '📈', '💰', '🔧', '📊'];

// Computed properties
const collections = computed(() => recommendationStore.bookmarkCollections);
const bookmarkStats = computed(() => recommendationStore.bookmarkStats);
const recommendationsByCollection = computed(() => recommendationStore.recommendationsByCollection);
const recentlyBookmarked = computed(() => bookmarkStats.value.recentlyBookmarked);

const currentRecommendations = computed(() => {
  if (activeCollection.value === 'all') {
    return recommendationStore.bookmarkedRecommendations;
  }
  
  const collectionData = recommendationsByCollection.value[activeCollection.value];
  return collectionData ? collectionData.recommendations : [];
});

// Methods
const getCollectionCount = (collectionId) => {
  return bookmarkStats.value.byCollection[collectionId] || 0;
};

const getCollectionName = (collectionId) => {
  const collection = collections.value.find(col => col.id === collectionId);
  return collection ? collection.name : 'Favorit Saya';
};

const getCollectionIcon = (collectionId) => {
  const collection = collections.value.find(col => col.id === collectionId);
  return collection ? collection.icon : '⭐';
};

const getCollectionColor = (collectionId) => {
  const collection = collections.value.find(col => col.id === collectionId);
  return collection ? collection.color : '#fbbf24';
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

const getStatusText = (status) => {
  const texts = {
    [RECOMMENDATION_STATUS.PENDING]: 'Belum Dimulai',
    [RECOMMENDATION_STATUS.IN_PROGRESS]: 'Sedang Dikerjakan',
    [RECOMMENDATION_STATUS.COMPLETED]: 'Selesai',
    [RECOMMENDATION_STATUS.SKIPPED]: 'Dilewati'
  };
  return texts[status] || 'Belum Dimulai';
};

const formatBookmarkDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const createCollection = () => {
  if (newCollectionName.value.trim()) {
    recommendationStore.createBookmarkCollection(
      newCollectionName.value.trim(),
      newCollectionDescription.value.trim() || 'Koleksi kustom',
      newCollectionIcon.value
    );
    
    // Reset form
    newCollectionName.value = '';
    newCollectionDescription.value = '';
    newCollectionIcon.value = '📁';
    showCreateCollection.value = false;
  }
};

const deleteCollection = () => {
  recommendationStore.deleteBookmarkCollection(activeCollection.value);
  activeCollection.value = 'all';
  showDeleteConfirm.value = false;
};

const startImplementation = async (recommendation) => {
  await recommendationStore.startRecommendation(recommendation.id, {
    startedAt: new Date().toISOString()
  });
  
  // Navigate to recommendations page with highlight
  router.push(`/recommendations?highlight=${recommendation.id}`);
};

// Event handlers
const handleBookmarkToggled = (event) => {
  console.log('Bookmark toggled:', event);
};

const handleCollectionChanged = (event) => {
  console.log('Collection changed:', event);
};

const handleBookmarkRemoved = (event) => {
  console.log('Bookmark removed:', event);
};

onMounted(() => {
  console.log('📚 Bookmark Dashboard mounted');
});
</script>

<style scoped>
.bookmark-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Dashboard Header */
.dashboard-header {
  margin-bottom: 32px;
}

.header-content {
  text-align: center;
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.dashboard-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

/* Bookmark Stats */
.bookmark-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

/* Collection Tabs */
.collection-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.collection-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: fit-content;
}

.collection-tab:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.collection-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.tab-icon {
  font-size: 16px;
}

.tab-name {
  font-weight: 500;
}

.tab-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.collection-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
}

/* Collection Management */
.collection-management {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.create-collection-btn,
.delete-collection-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-collection-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.delete-collection-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-content p {
  color: #6b7280;
  margin: 0 0 24px 0;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.cta-btn:hover {
  background: #2563eb;
}

/* Bookmarked Recommendations */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.bookmark-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s ease;
}

.bookmark-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Bookmark Header */
.bookmark-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 0 16px;
}

.bookmark-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collection-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.bookmark-date {
  font-size: 11px;
  color: #6b7280;
}

/* Recommendation Content */
.recommendation-content {
  padding: 16px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.recommendation-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
  margin-right: 12px;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-critical {
  background: #fecaca;
  color: #dc2626;
}

.priority-high {
  background: #fed7aa;
  color: #ea580c;
}

.priority-medium {
  background: #dbeafe;
  color: #2563eb;
}

.priority-low {
  background: #d1fae5;
  color: #059669;
}

.recommendation-description {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Status and Progress */
.recommendation-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
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

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}

/* Bookmark Actions */
.bookmark-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px 16px;
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
  text-decoration: none;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background: #2563eb;
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
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
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Icon Selector */
.icon-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.icon-btn.active {
  background: #3b82f6;
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

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-danger:hover {
  background: #dc2626;
}

.warning-text {
  color: #f59e0b;
  font-size: 14px;
  font-style: italic;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .bookmark-dashboard {
    padding: 16px;
  }
  
  .dashboard-title {
    font-size: 24px;
  }
  
  .bookmark-stats {
    gap: 20px;
  }
  
  .collection-tabs {
    gap: 4px;
  }
  
  .collection-tab {
    padding: 8px 12px;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .bookmark-actions {
    flex-direction: column;
  }
  
  .modal-overlay {
    padding: 10px;
  }
}
</style>
