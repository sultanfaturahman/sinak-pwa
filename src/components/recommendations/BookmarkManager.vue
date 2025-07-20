<template>
  <div class="bookmark-manager">
    <!-- Bookmark Button -->
    <div class="bookmark-button-container">
      <button
        @click="showBookmarkMenu = !showBookmarkMenu"
        class="bookmark-btn"
        :class="{ 
          'bookmarked': recommendation.isBookmarked,
          'active': showBookmarkMenu 
        }"
      >
        <span class="bookmark-icon">
          {{ recommendation.isBookmarked ? '🔖' : '📌' }}
        </span>
        <span class="bookmark-text">
          {{ recommendation.isBookmarked ? 'Tersimpan' : 'Simpan' }}
        </span>
        <span class="dropdown-arrow">▼</span>
      </button>

      <!-- Bookmark Menu -->
      <div v-if="showBookmarkMenu" class="bookmark-menu" @click.stop>
        <div class="menu-header">
          <h4>{{ recommendation.isBookmarked ? 'Kelola Bookmark' : 'Simpan ke Koleksi' }}</h4>
          <button @click="showBookmarkMenu = false" class="close-btn">×</button>
        </div>

        <div class="menu-content">
          <!-- Quick Actions -->
          <div v-if="!recommendation.isBookmarked" class="quick-actions">
            <button
              @click="quickBookmark('default')"
              class="quick-action-btn primary"
            >
              <span class="action-icon">⭐</span>
              Simpan ke Favorit
            </button>
          </div>

          <!-- Collections List -->
          <div class="collections-section">
            <h5>Pilih Koleksi:</h5>
            <div class="collections-list">
              <button
                v-for="collection in collections"
                :key="collection.id"
                @click="toggleCollection(collection.id)"
                class="collection-item"
                :class="{ 
                  'active': recommendation.bookmarkCollection === collection.id,
                  'disabled': !recommendation.isBookmarked && collection.id !== selectedCollection
                }"
              >
                <div class="collection-info">
                  <span class="collection-icon" :style="{ color: collection.color }">
                    {{ collection.icon }}
                  </span>
                  <div class="collection-details">
                    <span class="collection-name">{{ collection.name }}</span>
                    <span class="collection-count">
                      {{ getCollectionCount(collection.id) }} item
                    </span>
                  </div>
                </div>
                <div class="collection-status">
                  <span v-if="recommendation.bookmarkCollection === collection.id" class="status-icon">✓</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Create New Collection -->
          <div class="create-collection-section">
            <button
              v-if="!showCreateForm"
              @click="showCreateForm = true"
              class="create-collection-btn"
            >
              <span class="action-icon">➕</span>
              Buat Koleksi Baru
            </button>

            <div v-else class="create-form">
              <input
                v-model="newCollectionName"
                placeholder="Nama koleksi..."
                class="collection-name-input"
                @keyup.enter="createCollection"
              />
              <div class="form-actions">
                <button @click="createCollection" class="btn-primary">Buat</button>
                <button @click="cancelCreate" class="btn-secondary">Batal</button>
              </div>
            </div>
          </div>

          <!-- Remove from Bookmarks -->
          <div v-if="recommendation.isBookmarked" class="remove-section">
            <button
              @click="removeBookmark"
              class="remove-btn"
            >
              <span class="action-icon">🗑️</span>
              Hapus dari Bookmark
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bookmark Info -->
    <div v-if="recommendation.isBookmarked" class="bookmark-info">
      <span class="bookmark-collection">
        {{ getCollectionName(recommendation.bookmarkCollection) }}
      </span>
      <span class="bookmark-date">
        {{ formatBookmarkDate(recommendation.bookmarkedAt) }}
      </span>
    </div>

    <!-- Click Outside Handler -->
    <div
      v-if="showBookmarkMenu"
      class="menu-overlay"
      @click="showBookmarkMenu = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRecommendationStore } from '../../store/recommendation.js';

const props = defineProps({
  recommendation: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  'bookmark-toggled',
  'collection-changed',
  'bookmark-removed'
]);

const recommendationStore = useRecommendationStore();

// Local state
const showBookmarkMenu = ref(false);
const showCreateForm = ref(false);
const newCollectionName = ref('');
const selectedCollection = ref('default');

// Computed properties
const collections = computed(() => recommendationStore.bookmarkCollections);
const bookmarkStats = computed(() => recommendationStore.bookmarkStats);

// Methods
const quickBookmark = async (collectionId) => {
  await recommendationStore.toggleBookmark(props.recommendation.id, collectionId);
  emit('bookmark-toggled', {
    recommendationId: props.recommendation.id,
    isBookmarked: true,
    collectionId
  });
  showBookmarkMenu.value = false;
};

const toggleCollection = async (collectionId) => {
  if (!props.recommendation.isBookmarked) {
    // Add to bookmarks with this collection
    await recommendationStore.toggleBookmark(props.recommendation.id, collectionId);
    emit('bookmark-toggled', {
      recommendationId: props.recommendation.id,
      isBookmarked: true,
      collectionId
    });
  } else if (props.recommendation.bookmarkCollection === collectionId) {
    // Remove from bookmarks
    await recommendationStore.removeFromBookmarks(props.recommendation.id);
    emit('bookmark-removed', {
      recommendationId: props.recommendation.id
    });
  } else {
    // Move to different collection
    await recommendationStore.addToBookmarkCollection(props.recommendation.id, collectionId);
    emit('collection-changed', {
      recommendationId: props.recommendation.id,
      newCollectionId: collectionId
    });
  }
  
  showBookmarkMenu.value = false;
};

const removeBookmark = async () => {
  await recommendationStore.removeFromBookmarks(props.recommendation.id);
  emit('bookmark-removed', {
    recommendationId: props.recommendation.id
  });
  showBookmarkMenu.value = false;
};

const createCollection = async () => {
  if (newCollectionName.value.trim()) {
    const newCollection = recommendationStore.createBookmarkCollection(
      newCollectionName.value.trim(),
      'Koleksi kustom'
    );
    
    // Add current recommendation to new collection
    if (!props.recommendation.isBookmarked) {
      await recommendationStore.toggleBookmark(props.recommendation.id, newCollection.id);
      emit('bookmark-toggled', {
        recommendationId: props.recommendation.id,
        isBookmarked: true,
        collectionId: newCollection.id
      });
    } else {
      await recommendationStore.addToBookmarkCollection(props.recommendation.id, newCollection.id);
      emit('collection-changed', {
        recommendationId: props.recommendation.id,
        newCollectionId: newCollection.id
      });
    }
    
    cancelCreate();
    showBookmarkMenu.value = false;
  }
};

const cancelCreate = () => {
  showCreateForm.value = false;
  newCollectionName.value = '';
};

const getCollectionCount = (collectionId) => {
  return bookmarkStats.value.byCollection[collectionId] || 0;
};

const getCollectionName = (collectionId) => {
  const collection = collections.value.find(col => col.id === collectionId);
  return collection ? collection.name : 'Favorit Saya';
};

const formatBookmarkDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Kemarin';
  } else if (diffDays < 7) {
    return `${diffDays} hari lalu`;
  } else {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }
};
</script>

<style scoped>
.bookmark-manager {
  position: relative;
}

/* Bookmark Button */
.bookmark-button-container {
  position: relative;
}

.bookmark-btn {
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
  min-width: 100px;
}

.bookmark-btn:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.bookmark-btn.bookmarked {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.bookmark-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.bookmark-icon {
  font-size: 14px;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.bookmark-btn.active .dropdown-arrow {
  transform: rotate(180deg);
}

/* Bookmark Menu */
.bookmark-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-width: 320px;
  margin-top: 4px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.menu-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
}

.menu-content {
  padding: 12px;
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 16px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action-btn.primary {
  background: #3b82f6;
  color: white;
}

.quick-action-btn.primary:hover {
  background: #2563eb;
}

/* Collections */
.collections-section h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid transparent;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collection-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.collection-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.collection-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collection-icon {
  font-size: 16px;
}

.collection-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.collection-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.collection-count {
  font-size: 11px;
  color: #6b7280;
}

.status-icon {
  color: #10b981;
  font-weight: bold;
}

/* Create Collection */
.create-collection-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 1px dashed #d1d5db;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.create-collection-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.create-form {
  margin-bottom: 12px;
}

.collection-name-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 8px;
}

.collection-name-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  flex: 1;
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  flex: 1;
  padding: 6px 12px;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f9fafb;
}

/* Remove Section */
.remove-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #fee2e2;
  border-color: #f87171;
}

/* Bookmark Info */
.bookmark-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 11px;
  color: #6b7280;
}

.bookmark-collection {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* Menu Overlay */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .bookmark-menu {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    right: auto;
    width: 90vw;
    max-width: 320px;
  }
  
  .bookmark-btn {
    min-width: 80px;
    padding: 6px 10px;
  }
  
  .bookmark-text {
    display: none;
  }
}
</style>
