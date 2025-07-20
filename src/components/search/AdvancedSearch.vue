<template>
  <div class="advanced-search">
    <!-- Search Header -->
    <div class="search-header">
      <div class="search-title">
        <h3>🔍 Cari Rekomendasi</h3>
        <button
          @click="toggleAdvanced"
          class="toggle-advanced-btn"
          :class="{ active: showAdvanced }"
        >
          {{ showAdvanced ? 'Sederhana' : 'Lanjutan' }}
        </button>
      </div>
    </div>

    <!-- Main Search Bar -->
    <div class="main-search">
      <div class="search-input-container">
        <div class="search-icon">🔍</div>
        <input
          v-model="searchQuery"
          @input="handleSearch"
          @keyup.enter="performSearch"
          type="text"
          placeholder="Cari rekomendasi, kategori, atau kata kunci..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-btn"
        >
          ×
        </button>
        <button
          @click="startVoiceSearch"
          class="voice-btn"
          :class="{ active: isListening }"
          :disabled="!voiceSupported"
        >
          🎤
        </button>
      </div>

      <!-- Search Suggestions -->
      <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          @click="selectSuggestion(suggestion)"
          class="suggestion-item"
        >
          <div class="suggestion-icon">{{ suggestion.icon }}</div>
          <div class="suggestion-content">
            <span class="suggestion-text">{{ suggestion.text }}</span>
            <span class="suggestion-type">{{ suggestion.type }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Filters -->
    <div v-if="showAdvanced" class="advanced-filters">
      <div class="filters-grid">
        <!-- Category Filter -->
        <div class="filter-group">
          <label class="filter-label">📂 Kategori</label>
          <select v-model="filters.category" class="filter-select">
            <option value="">Semua Kategori</option>
            <option v-for="category in categories" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </div>

        <!-- Priority Filter -->
        <div class="filter-group">
          <label class="filter-label">⚡ Prioritas</label>
          <select v-model="filters.priority" class="filter-select">
            <option value="">Semua Prioritas</option>
            <option value="critical">Kritis</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label class="filter-label">📊 Status</label>
          <select v-model="filters.status" class="filter-select">
            <option value="">Semua Status</option>
            <option value="pending">Belum Dimulai</option>
            <option value="in_progress">Sedang Dikerjakan</option>
            <option value="completed">Selesai</option>
            <option value="skipped">Dilewati</option>
          </select>
        </div>

        <!-- Difficulty Filter -->
        <div class="filter-group">
          <label class="filter-label">🎯 Tingkat Kesulitan</label>
          <select v-model="filters.difficulty" class="filter-select">
            <option value="">Semua Tingkat</option>
            <option value="easy">Mudah</option>
            <option value="medium">Sedang</option>
            <option value="hard">Sulit</option>
          </select>
        </div>

        <!-- Timeframe Filter -->
        <div class="filter-group">
          <label class="filter-label">⏱️ Waktu Implementasi</label>
          <select v-model="filters.timeframe" class="filter-select">
            <option value="">Semua Waktu</option>
            <option value="immediate">Segera (< 1 hari)</option>
            <option value="short">Pendek (1-7 hari)</option>
            <option value="medium">Sedang (1-4 minggu)</option>
            <option value="long">Panjang (> 1 bulan)</option>
          </select>
        </div>

        <!-- Impact Filter -->
        <div class="filter-group">
          <label class="filter-label">📈 Dampak Bisnis</label>
          <select v-model="filters.impact" class="filter-select">
            <option value="">Semua Dampak</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>
        </div>
      </div>

      <!-- Tag Filter -->
      <div class="tag-filter-section">
        <label class="filter-label">🏷️ Tag</label>
        <div class="tag-input-container">
          <input
            v-model="tagInput"
            @keyup.enter="addTag"
            @input="showTagSuggestions"
            placeholder="Tambah tag..."
            class="tag-input"
          />
          <div v-if="tagSuggestions.length > 0" class="tag-suggestions">
            <button
              v-for="tag in tagSuggestions"
              :key="tag"
              @click="addTag(tag)"
              class="tag-suggestion"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        <div class="selected-tags">
          <span
            v-for="tag in filters.tags"
            :key="tag"
            class="selected-tag"
          >
            {{ tag }}
            <button @click="removeTag(tag)" class="remove-tag">×</button>
          </span>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div class="date-filter-section">
        <label class="filter-label">📅 Tanggal Dibuat</label>
        <div class="date-range">
          <input
            v-model="filters.dateFrom"
            type="date"
            class="date-input"
            placeholder="Dari"
          />
          <span class="date-separator">-</span>
          <input
            v-model="filters.dateTo"
            type="date"
            class="date-input"
            placeholder="Sampai"
          />
        </div>
      </div>
    </div>

    <!-- Search Actions -->
    <div class="search-actions">
      <button @click="performSearch" class="search-btn primary">
        🔍 Cari
      </button>
      <button @click="resetFilters" class="search-btn secondary">
        🔄 Reset
      </button>
      <button
        v-if="canSaveSearch"
        @click="saveCurrentSearch"
        class="search-btn secondary"
      >
        💾 Simpan Pencarian
      </button>
    </div>

    <!-- Saved Searches -->
    <div v-if="savedSearches.length > 0" class="saved-searches">
      <h4 class="saved-title">💾 Pencarian Tersimpan</h4>
      <div class="saved-list">
        <div
          v-for="search in savedSearches"
          :key="search.id"
          class="saved-item"
        >
          <button
            @click="loadSavedSearch(search)"
            class="saved-search-btn"
          >
            <span class="saved-name">{{ search.name }}</span>
            <span class="saved-count">{{ search.resultCount }} hasil</span>
          </button>
          <button
            @click="deleteSavedSearch(search.id)"
            class="delete-saved-btn"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Search Stats -->
    <div v-if="searchStats.totalResults > 0" class="search-stats">
      <div class="stats-content">
        <span class="results-count">
          {{ searchStats.totalResults }} hasil ditemukan
        </span>
        <span v-if="searchStats.searchTime" class="search-time">
          dalam {{ searchStats.searchTime }}ms
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRecommendationStore } from '../../store/recommendation.js';
import { debounce } from 'lodash-es';

const recommendationStore = useRecommendationStore();

// Props and emits
const emit = defineEmits(['search', 'filter-change']);

// Reactive state
const searchQuery = ref('');
const showAdvanced = ref(false);
const showSuggestions = ref(false);
const isListening = ref(false);
const voiceSupported = ref(false);
const tagInput = ref('');

// Filters
const filters = ref({
  category: '',
  priority: '',
  status: '',
  difficulty: '',
  timeframe: '',
  impact: '',
  tags: [],
  dateFrom: '',
  dateTo: ''
});

// Suggestions and searches
const suggestions = ref([]);
const tagSuggestions = ref([]);
const savedSearches = ref([]);
const searchStats = ref({
  totalResults: 0,
  searchTime: 0
});

// Categories for filter
const categories = [
  { value: 'marketing', label: '📢 Marketing' },
  { value: 'operations', label: '⚙️ Operasional' },
  { value: 'finance', label: '💰 Keuangan' },
  { value: 'technology', label: '💻 Teknologi' },
  { value: 'hr', label: '👥 SDM' },
  { value: 'strategy', label: '🎯 Strategi' }
];

// Available tags for suggestions
const availableTags = [
  'digital marketing', 'social media', 'e-commerce', 'automation',
  'customer service', 'inventory', 'accounting', 'analytics',
  'mobile app', 'website', 'seo', 'content marketing',
  'sales', 'branding', 'productivity', 'cost reduction'
];

// Computed properties
const canSaveSearch = computed(() => {
  return searchQuery.value.trim() || Object.values(filters.value).some(v => 
    Array.isArray(v) ? v.length > 0 : v !== ''
  );
});

// Methods
const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value;
};

const handleSearch = debounce(() => {
  if (searchQuery.value.length > 2) {
    generateSuggestions();
    showSuggestions.value = true;
  } else {
    showSuggestions.value = false;
  }
}, 300);

const generateSuggestions = () => {
  const query = searchQuery.value.toLowerCase();
  suggestions.value = [
    {
      id: 1,
      text: `Cari "${searchQuery.value}" di judul`,
      type: 'Judul',
      icon: '📝',
      searchType: 'title'
    },
    {
      id: 2,
      text: `Cari "${searchQuery.value}" di deskripsi`,
      type: 'Deskripsi',
      icon: '📄',
      searchType: 'description'
    },
    {
      id: 3,
      text: `Cari "${searchQuery.value}" di semua field`,
      type: 'Semua',
      icon: '🔍',
      searchType: 'all'
    }
  ];

  // Add category suggestions
  categories.forEach(cat => {
    if (cat.label.toLowerCase().includes(query)) {
      suggestions.value.push({
        id: `cat_${cat.value}`,
        text: cat.label,
        type: 'Kategori',
        icon: '📂',
        searchType: 'category',
        value: cat.value
      });
    }
  });
};

const selectSuggestion = (suggestion) => {
  if (suggestion.searchType === 'category') {
    filters.value.category = suggestion.value;
    searchQuery.value = '';
  } else {
    searchQuery.value = suggestion.text.replace(/^Cari "|" di.*$/g, '');
  }
  showSuggestions.value = false;
  performSearch();
};

const clearSearch = () => {
  searchQuery.value = '';
  showSuggestions.value = false;
  performSearch();
};

const performSearch = () => {
  const searchParams = {
    query: searchQuery.value,
    filters: { ...filters.value },
    timestamp: Date.now()
  };

  const startTime = performance.now();
  
  emit('search', searchParams);
  
  // Simulate search time calculation
  setTimeout(() => {
    const endTime = performance.now();
    searchStats.value.searchTime = Math.round(endTime - startTime);
  }, 100);

  showSuggestions.value = false;
};

const resetFilters = () => {
  searchQuery.value = '';
  filters.value = {
    category: '',
    priority: '',
    status: '',
    difficulty: '',
    timeframe: '',
    impact: '',
    tags: [],
    dateFrom: '',
    dateTo: ''
  };
  performSearch();
};

// Tag management
const showTagSuggestions = () => {
  const input = tagInput.value.toLowerCase();
  if (input.length > 1) {
    tagSuggestions.value = availableTags.filter(tag => 
      tag.includes(input) && !filters.value.tags.includes(tag)
    ).slice(0, 5);
  } else {
    tagSuggestions.value = [];
  }
};

const addTag = (tag) => {
  const tagToAdd = typeof tag === 'string' ? tag : tagInput.value.trim();
  if (tagToAdd && !filters.value.tags.includes(tagToAdd)) {
    filters.value.tags.push(tagToAdd);
    tagInput.value = '';
    tagSuggestions.value = [];
    performSearch();
  }
};

const removeTag = (tag) => {
  filters.value.tags = filters.value.tags.filter(t => t !== tag);
  performSearch();
};

// Voice search
const startVoiceSearch = () => {
  if (!voiceSupported.value) return;

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening.value = true;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    searchQuery.value = transcript;
    performSearch();
  };

  recognition.onend = () => {
    isListening.value = false;
  };

  recognition.onerror = () => {
    isListening.value = false;
  };

  recognition.start();
};

// Saved searches
const saveCurrentSearch = () => {
  const searchName = prompt('Nama pencarian:');
  if (searchName) {
    const savedSearch = {
      id: Date.now(),
      name: searchName,
      query: searchQuery.value,
      filters: { ...filters.value },
      resultCount: searchStats.value.totalResults,
      createdAt: new Date().toISOString()
    };
    
    savedSearches.value.push(savedSearch);
    localStorage.setItem('sinak_saved_searches', JSON.stringify(savedSearches.value));
  }
};

const loadSavedSearch = (search) => {
  searchQuery.value = search.query;
  filters.value = { ...search.filters };
  performSearch();
};

const deleteSavedSearch = (searchId) => {
  savedSearches.value = savedSearches.value.filter(s => s.id !== searchId);
  localStorage.setItem('sinak_saved_searches', JSON.stringify(savedSearches.value));
};

// Watch for filter changes
watch(filters, () => {
  performSearch();
}, { deep: true });

// Update search stats
watch(() => recommendationStore.filteredRecommendations, (newResults) => {
  searchStats.value.totalResults = newResults.length;
}, { immediate: true });

// Lifecycle
onMounted(() => {
  // Check voice search support
  voiceSupported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  
  // Load saved searches
  const saved = localStorage.getItem('sinak_saved_searches');
  if (saved) {
    savedSearches.value = JSON.parse(saved);
  }
});
</script>

<style scoped>
.advanced-search {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 24px;
}

/* Search Header */
.search-header {
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.search-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.toggle-advanced-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-advanced-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.toggle-advanced-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Main Search */
.main-search {
  padding: 20px;
  position: relative;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.search-input-container:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  padding: 0 12px;
  font-size: 18px;
  color: #6b7280;
}

.search-input {
  flex: 1;
  padding: 14px 0;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #1e293b;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-btn,
.voice-btn {
  padding: 8px;
  margin: 0 4px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.clear-btn {
  font-size: 20px;
  color: #6b7280;
}

.clear-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.voice-btn {
  font-size: 16px;
  color: #6b7280;
}

.voice-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #3b82f6;
}

.voice-btn.active {
  background: #ef4444;
  color: white;
  animation: pulse 1s infinite;
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Search Suggestions */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 20px;
  right: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #f8fafc;
}

.suggestion-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-text {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.suggestion-type {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Advanced Filters */
.advanced-filters {
  padding: 20px;
  border-top: 1px solid #f3f4f6;
  background: #fafbfc;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #1e293b;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Tag Filter */
.tag-filter-section {
  margin-bottom: 20px;
}

.tag-input-container {
  position: relative;
  margin-bottom: 12px;
}

.tag-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.tag-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.tag-suggestion {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.tag-suggestion:hover {
  background: #f8fafc;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.remove-tag {
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.remove-tag:hover {
  background: rgba(30, 64, 175, 0.2);
}

/* Date Filter */
.date-filter-section {
  margin-bottom: 20px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-separator {
  color: #6b7280;
  font-weight: 500;
}

/* Search Actions */
.search-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
}

.search-btn {
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

.search-btn.primary {
  background: #3b82f6;
  color: white;
}

.search-btn.primary:hover {
  background: #2563eb;
}

.search-btn.secondary {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.search-btn.secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Saved Searches */
.saved-searches {
  padding: 20px;
  border-top: 1px solid #f3f4f6;
}

.saved-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.saved-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.saved-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.saved-search-btn {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.saved-search-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.saved-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.saved-count {
  font-size: 11px;
  color: #6b7280;
}

.delete-saved-btn {
  padding: 6px;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.delete-saved-btn:hover {
  background: #fef2f2;
}

/* Search Stats */
.search-stats {
  padding: 12px 20px;
  border-top: 1px solid #f3f4f6;
  background: #f8fafc;
}

.stats-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
}

.results-count {
  font-weight: 500;
  color: #374151;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .search-header {
    padding: 16px;
  }

  .main-search {
    padding: 16px;
  }

  .search-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .advanced-filters {
    padding: 16px;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .search-actions {
    padding: 16px;
    flex-direction: column;
  }

  .search-btn {
    justify-content: center;
  }

  .saved-searches {
    padding: 16px;
  }

  .search-suggestions {
    left: 16px;
    right: 16px;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .search-input-container,
  .suggestion-item,
  .search-btn,
  .saved-search-btn {
    transition: none;
  }

  .voice-btn.active {
    animation: none;
  }
}
</style>
