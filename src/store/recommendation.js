/**
 * Recommendation Store - Pinia State Management
 * SiNaik PWA - Sistem Intervensi Terpadu UMKM
 */

import { defineStore } from 'pinia';
import { generateAIRecommendations } from '../services/recommendationService.js';
import { createBusinessProfile, RECOMMENDATION_PRIORITY } from '../types/recommendation.js';
import { createUserDocument, updateUserDocument, getUserDocument, updateRecommendationData } from '../services/firestoreService.js';
import { debounce } from '../utils/debounce.js';

export const useRecommendationStore = defineStore('recommendation', {
  state: () => ({
    // Recommendations data
    recommendations: [],
    businessProfile: null,

    // Save state management
    isSaving: false,
    lastSaveAttempt: null,
    saveQueue: new Set(), // Track pending saves to prevent duplicates

    // Debounced save function storage
    _debouncedSaveFunction: null,

    // Enhanced UI state with detailed loading phases
    loading: false,
    error: null,
    generatingRecommendations: false,

    // Detailed loading states
    loadingState: {
      isLoading: false,
      phase: 'idle', // idle, loading, analyzing, generating, saving, complete
      progress: 0,
      currentStep: 0,
      message: '',
      steps: [
        'Memuat data diagnosis',
        'Menganalisis profil bisnis',
        'Menghasilkan rekomendasi AI',
        'Menyimpan hasil'
      ]
    },
    
    // Filters and sorting
    filters: {
      category: 'all',
      priority: 'all',
      completed: 'all',
      bookmarked: 'all' // all, bookmarked, not_bookmarked
    },
    sortBy: 'priority', // priority, date, category

    // Bookmark management
    bookmarkCollections: [
      {
        id: 'default',
        name: 'Favorit Saya',
        description: 'Rekomendasi yang disimpan',
        icon: '⭐',
        color: '#fbbf24',
        createdAt: new Date().toISOString()
      },
      {
        id: 'priority',
        name: 'Prioritas Tinggi',
        description: 'Rekomendasi yang harus segera dilakukan',
        icon: '🚨',
        color: '#ef4444',
        createdAt: new Date().toISOString()
      },
      {
        id: 'later',
        name: 'Untuk Nanti',
        description: 'Rekomendasi untuk implementasi masa depan',
        icon: '📅',
        color: '#3b82f6',
        createdAt: new Date().toISOString()
      }
    ],
    
    // User preferences
    preferences: {
      autoGenerateRecommendations: true,
      notificationsEnabled: true,
      emailUpdates: false
    },
    
    // Analytics
    analytics: {
      totalRecommendations: 0,
      completedRecommendations: 0,
      bookmarkedRecommendations: 0,
      lastGeneratedAt: null,
      averageCompletionTime: 0
    }
  }),
  
  getters: {
    // Filtered recommendations
    filteredRecommendations: (state) => {
      console.log('🔍 DEBUG: filteredRecommendations getter called');
      console.log('🔍 DEBUG: state.recommendations:', state.recommendations);
      console.log('🔍 DEBUG: state.recommendations.length:', state.recommendations.length);
      console.log('🔍 DEBUG: Current filters:', state.filters);

      let filtered = [...state.recommendations];
      console.log('🔍 DEBUG: Initial filtered array:', filtered);

      // Filter by category
      if (state.filters.category !== 'all') {
        console.log('🔍 DEBUG: Filtering by category:', state.filters.category);
        filtered = filtered.filter(rec => rec.category === state.filters.category);
        console.log('🔍 DEBUG: After category filter:', filtered.length);
      }

      // Filter by priority
      if (state.filters.priority !== 'all') {
        console.log('🔍 DEBUG: Filtering by priority:', state.filters.priority);
        filtered = filtered.filter(rec => rec.priority === state.filters.priority);
        console.log('🔍 DEBUG: After priority filter:', filtered.length);
      }

      // Filter by completion status
      if (state.filters.completed !== 'all') {
        console.log('🔍 DEBUG: Filtering by completion:', state.filters.completed);
        const isCompleted = state.filters.completed === 'completed';
        filtered = filtered.filter(rec => rec.isCompleted === isCompleted);
        console.log('🔍 DEBUG: After completion filter:', filtered.length);
      }

      // Filter by bookmark status
      if (state.filters.bookmarked !== 'all') {
        console.log('🔍 DEBUG: Filtering by bookmark:', state.filters.bookmarked);
        if (state.filters.bookmarked === 'bookmarked') {
          filtered = filtered.filter(rec => rec.isBookmarked);
        } else if (state.filters.bookmarked === 'not_bookmarked') {
          filtered = filtered.filter(rec => !rec.isBookmarked);
        }
        console.log('🔍 DEBUG: After bookmark filter:', filtered.length);
      }

      // Sort recommendations
      filtered.sort((a, b) => {
        switch (state.sortBy) {
          case 'priority':
            const priorityOrder = {
              'critical': 4,
              'high': 3,
              'medium': 2,
              'low': 1
            };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          
          case 'date':
            return new Date(b.createdAt) - new Date(a.createdAt);
          
          case 'category':
            return a.category.localeCompare(b.category);
          
          default:
            return 0;
        }
      });

      console.log('🔍 DEBUG: Final filtered recommendations:', filtered);
      console.log('🔍 DEBUG: Final filtered length:', filtered.length);

      return filtered;
    },

    // Bookmarked recommendations
    bookmarkedRecommendations: (state) => {
      return state.recommendations.filter(rec => rec.isBookmarked);
    },

    // Recommendations by bookmark collection
    recommendationsByCollection: (state) => {
      const collections = {};

      state.bookmarkCollections.forEach(collection => {
        collections[collection.id] = {
          ...collection,
          recommendations: state.recommendations.filter(rec =>
            rec.isBookmarked && rec.bookmarkCollection === collection.id
          )
        };
      });

      return collections;
    },

    // Bookmark statistics
    bookmarkStats: (state) => {
      const bookmarked = state.recommendations.filter(rec => rec.isBookmarked);
      const byCollection = {};

      state.bookmarkCollections.forEach(collection => {
        byCollection[collection.id] = bookmarked.filter(rec =>
          rec.bookmarkCollection === collection.id
        ).length;
      });

      return {
        total: bookmarked.length,
        byCollection,
        recentlyBookmarked: bookmarked
          .filter(rec => rec.bookmarkedAt)
          .sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt))
          .slice(0, 5)
      };
    },
    
    // Recommendations by priority
    criticalRecommendations: (state) => {
      return state.recommendations.filter(rec => 
        rec.priority === RECOMMENDATION_PRIORITY.CRITICAL && !rec.isCompleted
      );
    },
    
    highPriorityRecommendations: (state) => {
      return state.recommendations.filter(rec => 
        rec.priority === RECOMMENDATION_PRIORITY.HIGH && !rec.isCompleted
      );
    },
    
    // Bookmarked recommendations
    bookmarkedRecommendations: (state) => {
      return state.recommendations.filter(rec => rec.isBookmarked);
    },
    
    // Completed recommendations
    completedRecommendations: (state) => {
      return state.recommendations.filter(rec => rec.isCompleted);
    },
    
    // Progress statistics
    progressStats: (state) => {
      const total = state.recommendations.length;
      const completed = state.recommendations.filter(rec => rec.isCompleted).length;
      const inProgress = state.recommendations.filter(rec => 
        !rec.isCompleted && rec.actionItems?.some(item => item.isCompleted)
      ).length;
      
      return {
        total,
        completed,
        inProgress,
        pending: total - completed - inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    },
    
    // Next recommended actions
    nextActions: (state) => {
      const actions = [];
      
      state.recommendations
        .filter(rec => !rec.isCompleted)
        .forEach(rec => {
          rec.actionItems?.forEach(item => {
            if (!item.isCompleted) {
              actions.push({
                ...item,
                recommendationId: rec.id,
                recommendationTitle: rec.title,
                priority: rec.priority
              });
            }
          });
        });
      
      // Sort by priority and deadline
      actions.sort((a, b) => {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by deadline
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline);
        }
        
        return 0;
      });
      
      return actions.slice(0, 5); // Return top 5 next actions
    }
  },
  
  actions: {
    // Loading state management
    setLoadingState(phase, progress = 0, message = '') {
      this.loadingState.isLoading = phase !== 'idle' && phase !== 'complete';
      this.loadingState.phase = phase;
      this.loadingState.progress = progress;
      this.loadingState.message = message;

      // Update current step based on phase
      const phaseStepMap = {
        'loading': 0,
        'analyzing': 1,
        'generating': 2,
        'saving': 3,
        'complete': 4
      };

      this.loadingState.currentStep = phaseStepMap[phase] || 0;

      console.log(`🔄 Loading state: ${phase} (${progress}%) - ${message}`);
    },

    // Generate recommendations based on business profile and diagnosis
    async generateRecommendations(businessProfile, diagnosisData) {
      console.log('🔍 DEBUG: Store generateRecommendations called');
      console.log('🔍 DEBUG: businessProfile:', businessProfile);
      console.log('🔍 DEBUG: diagnosisData:', diagnosisData);

      // Initialize loading state
      this.setLoadingState('loading', 0, 'Memulai proses generasi rekomendasi...');
      this.generatingRecommendations = true;
      this.error = null;

      try {
        console.log('🚀 Generating recommendations for user:', businessProfile.userId);

        // Phase 1: Loading and analyzing
        this.setLoadingState('loading', 10, 'Memuat data diagnosis...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading time

        // Store business profile
        this.businessProfile = businessProfile;

        // Phase 2: Analyzing business profile
        this.setLoadingState('analyzing', 30, 'Menganalisis profil bisnis Anda...');
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate analysis time

        // Phase 3: Generate AI-powered recommendations
        this.setLoadingState('generating', 50, 'Menghasilkan rekomendasi terpersonalisasi...');
        console.log('🔍 DEBUG: Calling generateAIRecommendations service...');
        const recommendations = await generateAIRecommendations(businessProfile, diagnosisData);
        console.log('🔍 DEBUG: Service returned recommendations:', recommendations);

        this.setLoadingState('generating', 80, 'Memproses hasil rekomendasi...');

        // Debug: Log the recommendations structure
        console.log('🔍 DEBUG: Recommendations received from service:', recommendations);
        console.log('🔍 DEBUG: First recommendation structure:', recommendations[0]);
        console.log('🔍 DEBUG: Recommendations length:', recommendations.length);

        // Store recommendations
        this.recommendations = recommendations;

        // Debug: Log the stored recommendations
        console.log('🔍 DEBUG: Recommendations stored in state:', this.recommendations);
        console.log('🔍 DEBUG: State recommendations length:', this.recommendations.length);

        // Phase 4: Saving results
        this.setLoadingState('saving', 90, 'Menyimpan rekomendasi...');

        // Update analytics
        this.analytics.totalRecommendations = recommendations.length;
        this.analytics.lastGeneratedAt = new Date().toISOString();

        // Save to Firestore with enhanced method
        await this.safeSaveRecommendations(businessProfile.userId);

        // Phase 5: Complete
        this.setLoadingState('complete', 100, 'Rekomendasi berhasil dibuat!');
        await new Promise(resolve => setTimeout(resolve, 500)); // Show completion briefly

        // Reset to idle
        this.setLoadingState('idle', 0, '');

        console.log(`✅ Generated ${recommendations.length} recommendations successfully`);

        return recommendations;
        
      } catch (error) {
        console.error('❌ Error generating recommendations:', error);
        this.error = 'Gagal menghasilkan rekomendasi. Silakan coba lagi.';
        this.setLoadingState('idle', 0, ''); // Reset loading state on error
        throw error;
      } finally {
        this.generatingRecommendations = false;
      }
    },
    
    // Load recommendations from Firestore
    async loadRecommendations(userId) {
      this.loading = true;
      this.error = null;
      
      try {
        console.log('📥 Loading recommendations for user:', userId);
        
        const userData = await getUserDocument(userId);
        
        if (userData?.recommendations) {
          this.recommendations = userData.recommendations;
          this.businessProfile = userData.businessProfile;
          this.analytics = userData.analytics || this.analytics;
          
          console.log(`✅ Loaded ${this.recommendations.length} recommendations`);
        } else {
          console.log('ℹ️ No recommendations found for user');
          this.recommendations = [];
        }
        
      } catch (error) {
        console.error('❌ Error loading recommendations:', error);
        this.error = 'Gagal memuat rekomendasi.';
      } finally {
        this.loading = false;
      }
    },
    
    // Enhanced save recommendations to Firestore with debouncing and conflict resolution
    async saveRecommendationsToFirestore(userId) {
      // Prevent duplicate saves
      if (this.saveQueue.has(userId)) {
        console.log('🔄 Save already queued for user:', userId);
        return;
      }

      this.saveQueue.add(userId);
      this.isSaving = true;
      this.lastSaveAttempt = new Date().toISOString();

      try {
        console.log('💾 Saving recommendations to Firestore with enhanced method...');

        const updateData = {
          recommendations: this.recommendations,
          businessProfile: this.businessProfile,
          analytics: this.analytics,
          recommendationsUpdatedAt: new Date().toISOString()
        };

        // Use the optimized recommendation data update function
        const success = await updateRecommendationData(userId, updateData);

        if (success) {
          console.log('✅ Recommendations saved to Firestore successfully');
        } else {
          console.warn('⚠️ Firestore save failed, recommendations saved locally only');

          // Try fallback to regular update if optimized method fails
          try {
            console.log('🔄 Attempting fallback save method...');
            const fallbackSuccess = await updateUserDocument(userId, {
              businessProfile: this.businessProfile,
              analytics: this.analytics,
              recommendationCount: this.recommendations.length,
              lastSaveAttempt: new Date().toISOString()
            });

            if (fallbackSuccess) {
              console.log('✅ Fallback save successful (without full recommendation data)');
            }
          } catch (fallbackError) {
            console.warn('⚠️ Fallback save also failed:', fallbackError.message);
          }
        }

      } catch (error) {
        console.warn('⚠️ Firestore save error:', error.message);

        // Handle specific error types
        if (error.message.includes('INTERNAL ASSERTION FAILED')) {
          console.log('🔧 Internal assertion error detected, implementing recovery...');

          // Wait a bit and try once more with minimal data
          setTimeout(async () => {
            try {
              await updateUserDocument(userId, {
                recommendationCount: this.recommendations.length,
                lastUpdateAttempt: new Date().toISOString(),
                errorRecoveryAttempt: true
              });
              console.log('✅ Recovery save attempt completed');
            } catch (recoveryError) {
              console.warn('⚠️ Recovery save failed:', recoveryError.message);
            }
          }, 2000);
        }

        // Don't throw error - recommendations still work locally
      } finally {
        this.saveQueue.delete(userId);
        this.isSaving = false;
      }
    },

    // Initialize debounced save function
    initializeDebouncedSave() {
      if (!this._debouncedSaveFunction) {
        console.log('🔧 Initializing debounced save function...');

        // Create debounced function with proper binding
        this._debouncedSaveFunction = debounce(async (userId) => {
          try {
            console.log('💾 Executing debounced save for user:', userId);
            await this.saveRecommendationsToFirestore(userId);
          } catch (error) {
            console.error('❌ Error in debounced save:', error);
          }
        }, 1000); // Wait 1 second after last call

        console.log('✅ Debounced save function initialized');
      }
    },

    // Safe save method that uses debouncing
    async safeSaveRecommendations(userId) {
      if (!userId) {
        console.log('ℹ️ No user ID provided, skipping Firestore save');
        return;
      }

      // Prevent duplicate saves
      if (this.saveQueue.has(userId)) {
        console.log('🔄 Save already queued for user:', userId);
        return;
      }

      try {
        console.log('🚀 Safe save recommendations called for user:', userId);

        // Initialize debounced save function if needed
        this.initializeDebouncedSave();

        // Verify the debounced function exists
        if (!this._debouncedSaveFunction) {
          console.error('❌ Debounced save function not initialized, falling back to direct save');
          await this.saveRecommendationsToFirestore(userId);
          return;
        }

        // Add to queue and call debounced function
        this.saveQueue.add(userId);
        this._debouncedSaveFunction(userId);

        // Remove from queue after a delay (cleanup)
        setTimeout(() => {
          this.saveQueue.delete(userId);
        }, 2000);

      } catch (error) {
        console.error('❌ Error in safeSaveRecommendations:', error);

        // Fallback to direct save if debouncing fails
        try {
          console.log('🔄 Attempting fallback direct save...');
          await this.saveRecommendationsToFirestore(userId);
        } catch (fallbackError) {
          console.error('❌ Fallback save also failed:', fallbackError);
        }
      }
    },

    // Reset debounced save function (for debugging/recovery)
    resetDebouncedSave() {
      console.log('🔄 Resetting debounced save function...');

      // Cancel any pending debounced calls
      if (this._debouncedSaveFunction && typeof this._debouncedSaveFunction.cancel === 'function') {
        this._debouncedSaveFunction.cancel();
      }

      // Clear the function
      this._debouncedSaveFunction = null;

      // Clear the save queue
      this.saveQueue.clear();

      console.log('✅ Debounced save function reset');
    },

    // Force immediate save (bypasses debouncing)
    async forceImmediateSave(userId) {
      if (!userId) {
        console.log('ℹ️ No user ID provided for immediate save');
        return;
      }

      console.log('⚡ Force immediate save for user:', userId);

      try {
        // Cancel any pending debounced saves
        if (this._debouncedSaveFunction && typeof this._debouncedSaveFunction.cancel === 'function') {
          this._debouncedSaveFunction.cancel();
        }

        // Remove from queue
        this.saveQueue.delete(userId);

        // Perform immediate save
        await this.saveRecommendationsToFirestore(userId);

        console.log('✅ Immediate save completed');

      } catch (error) {
        console.error('❌ Error in force immediate save:', error);
        throw error;
      }
    },

    // Mark recommendation as completed
    async completeRecommendation(recommendationId) {
      const recommendation = this.recommendations.find(rec => rec.id === recommendationId);
      
      if (recommendation) {
        recommendation.isCompleted = true;
        recommendation.completedAt = new Date().toISOString();
        
        // Update analytics
        this.analytics.completedRecommendations++;
        
        // Save to Firestore if user is logged in
        if (this.businessProfile?.userId) {
          await this.safeSaveRecommendations(this.businessProfile.userId);
        }
        
        console.log('✅ Recommendation marked as completed:', recommendation.title);
      }
    },

    // Enhanced completion tracking actions
    async startRecommendation(recommendationId, updateData) {
      console.log('🚀 Starting recommendation:', recommendationId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation) {
        console.error('❌ Recommendation not found:', recommendationId);
        return;
      }

      // Update recommendation
      Object.assign(recommendation, {
        ...updateData,
        status: 'in_progress',
        startedAt: updateData.startedAt || new Date().toISOString(),
        progress: 0,
        updatedAt: new Date().toISOString(),
        viewCount: (recommendation.viewCount || 0) + 1,
        lastViewedAt: new Date().toISOString()
      });

      // Add to completion history
      if (!recommendation.completionHistory) {
        recommendation.completionHistory = [];
      }

      recommendation.completionHistory.push({
        action: 'started',
        timestamp: new Date().toISOString(),
        notes: 'Implementasi dimulai'
      });

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.safeSaveRecommendations(this.businessProfile.userId);
      }

      console.log('✅ Recommendation started successfully');
    },

    async updateRecommendationProgress(recommendationId, updateData) {
      console.log('📊 Updating recommendation progress:', recommendationId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation) {
        console.error('❌ Recommendation not found:', recommendationId);
        return;
      }

      // Update progress
      Object.assign(recommendation, {
        progress: updateData.progress,
        updatedAt: new Date().toISOString()
      });

      // Add to completion history
      if (!recommendation.completionHistory) {
        recommendation.completionHistory = [];
      }

      recommendation.completionHistory.push({
        action: 'progress_updated',
        timestamp: new Date().toISOString(),
        progress: updateData.progress,
        notes: updateData.notes || `Progress diperbarui ke ${updateData.progress}%`
      });

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.safeSaveRecommendations(this.businessProfile.userId);
      }

      console.log('✅ Progress updated successfully');
    },

    async restartRecommendation(recommendationId, updateData) {
      console.log('🔄 Restarting recommendation:', recommendationId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation) {
        console.error('❌ Recommendation not found:', recommendationId);
        return;
      }

      // Reset recommendation
      Object.assign(recommendation, {
        ...updateData,
        status: 'in_progress',
        isCompleted: false,
        progress: 0,
        startedAt: updateData.startedAt || new Date().toISOString(),
        completedAt: null,
        updatedAt: new Date().toISOString()
      });

      // Add to completion history
      if (!recommendation.completionHistory) {
        recommendation.completionHistory = [];
      }

      recommendation.completionHistory.push({
        action: 'restarted',
        timestamp: new Date().toISOString(),
        notes: 'Implementasi dimulai ulang'
      });

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.safeSaveRecommendations(this.businessProfile.userId);
      }

      console.log('✅ Recommendation restarted successfully');
    },

    async skipRecommendation(recommendationId, updateData) {
      console.log('⏭️ Skipping recommendation:', recommendationId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation) {
        console.error('❌ Recommendation not found:', recommendationId);
        return;
      }

      // Update recommendation
      Object.assign(recommendation, {
        ...updateData,
        status: 'skipped',
        updatedAt: new Date().toISOString()
      });

      // Add to completion history
      if (!recommendation.completionHistory) {
        recommendation.completionHistory = [];
      }

      recommendation.completionHistory.push({
        action: 'skipped',
        timestamp: new Date().toISOString(),
        notes: 'Rekomendasi dilewati'
      });

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.safeSaveRecommendations(this.businessProfile.userId);
      }

      console.log('✅ Recommendation skipped successfully');
    },

    // Enhanced bookmark management
    async toggleBookmark(recommendationId, collectionId = 'default') {
      const recommendation = this.recommendations.find(rec => rec.id === recommendationId);

      if (recommendation) {
        const wasBookmarked = recommendation.isBookmarked;
        recommendation.isBookmarked = !recommendation.isBookmarked;

        // Update bookmark metadata
        if (recommendation.isBookmarked) {
          recommendation.bookmarkedAt = new Date().toISOString();
          recommendation.bookmarkCollection = collectionId;

          // Add to completion history
          if (!recommendation.completionHistory) {
            recommendation.completionHistory = [];
          }

          recommendation.completionHistory.push({
            action: 'bookmarked',
            timestamp: new Date().toISOString(),
            collectionId: collectionId,
            notes: `Disimpan ke koleksi: ${this.getCollectionName(collectionId)}`
          });
        } else {
          recommendation.bookmarkedAt = null;
          recommendation.bookmarkCollection = null;

          // Add to completion history
          if (!recommendation.completionHistory) {
            recommendation.completionHistory = [];
          }

          recommendation.completionHistory.push({
            action: 'unbookmarked',
            timestamp: new Date().toISOString(),
            notes: 'Dihapus dari bookmark'
          });
        }

        // Update analytics
        if (recommendation.isBookmarked) {
          this.analytics.bookmarkedRecommendations++;
        } else {
          this.analytics.bookmarkedRecommendations--;
        }

        recommendation.updatedAt = new Date().toISOString();

        // Save to Firestore if user is logged in
        if (this.businessProfile?.userId) {
          await this.safeSaveRecommendations(this.businessProfile.userId);
        }

        console.log(`✅ Bookmark ${recommendation.isBookmarked ? 'added' : 'removed'} for:`, recommendation.title);
      }
    },

    async addToBookmarkCollection(recommendationId, collectionId) {
      const recommendation = this.recommendations.find(rec => rec.id === recommendationId);

      if (recommendation) {
        if (!recommendation.isBookmarked) {
          recommendation.isBookmarked = true;
          recommendation.bookmarkedAt = new Date().toISOString();
          this.analytics.bookmarkedRecommendations++;
        }

        recommendation.bookmarkCollection = collectionId;
        recommendation.updatedAt = new Date().toISOString();

        // Add to completion history
        if (!recommendation.completionHistory) {
          recommendation.completionHistory = [];
        }

        recommendation.completionHistory.push({
          action: 'moved_to_collection',
          timestamp: new Date().toISOString(),
          collectionId: collectionId,
          notes: `Dipindah ke koleksi: ${this.getCollectionName(collectionId)}`
        });

        // Save to Firestore if user is logged in
        if (this.businessProfile?.userId) {
          await this.saveRecommendationsToFirestore(this.businessProfile.userId);
        }

        console.log('✅ Recommendation moved to collection:', collectionId);
      }
    },

    async removeFromBookmarks(recommendationId) {
      const recommendation = this.recommendations.find(rec => rec.id === recommendationId);

      if (recommendation && recommendation.isBookmarked) {
        recommendation.isBookmarked = false;
        recommendation.bookmarkedAt = null;
        recommendation.bookmarkCollection = null;
        recommendation.updatedAt = new Date().toISOString();
        this.analytics.bookmarkedRecommendations--;

        // Add to completion history
        if (!recommendation.completionHistory) {
          recommendation.completionHistory = [];
        }

        recommendation.completionHistory.push({
          action: 'removed_from_bookmarks',
          timestamp: new Date().toISOString(),
          notes: 'Dihapus dari semua bookmark'
        });

        // Save to Firestore if user is logged in
        if (this.businessProfile?.userId) {
          await this.saveRecommendationsToFirestore(this.businessProfile.userId);
        }

        console.log('✅ Recommendation removed from bookmarks:', recommendation.title);
      }
    },

    // Bookmark collection management
    createBookmarkCollection(name, description, icon = '📁', color = '#6b7280') {
      const newCollection = {
        id: `collection_${Date.now()}`,
        name,
        description,
        icon,
        color,
        createdAt: new Date().toISOString()
      };

      this.bookmarkCollections.push(newCollection);

      console.log('✅ New bookmark collection created:', name);
      return newCollection;
    },

    deleteBookmarkCollection(collectionId) {
      if (collectionId === 'default') {
        console.warn('⚠️ Cannot delete default collection');
        return;
      }

      // Move all bookmarks from this collection to default
      this.recommendations.forEach(rec => {
        if (rec.bookmarkCollection === collectionId) {
          rec.bookmarkCollection = 'default';
        }
      });

      // Remove collection
      this.bookmarkCollections = this.bookmarkCollections.filter(col => col.id !== collectionId);

      console.log('✅ Bookmark collection deleted:', collectionId);
    },

    getCollectionName(collectionId) {
      const collection = this.bookmarkCollections.find(col => col.id === collectionId);
      return collection ? collection.name : 'Favorit Saya';
    },

    // Step management actions
    async startProgressStep(recommendationId, stepId) {
      console.log('🚀 Starting progress step:', stepId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation || !recommendation.progressSteps) {
        console.error('❌ Recommendation or progress steps not found');
        return;
      }

      const step = recommendation.progressSteps.find(s => s.id === stepId);
      if (!step) {
        console.error('❌ Step not found:', stepId);
        return;
      }

      // Update step status
      step.status = 'in_progress';
      step.startedAt = new Date().toISOString();
      step.updatedAt = new Date().toISOString();

      // Update recommendation current step
      const stepIndex = recommendation.progressSteps.findIndex(s => s.id === stepId);
      recommendation.currentStep = stepIndex;

      // Add to completion history
      if (!recommendation.completionHistory) {
        recommendation.completionHistory = [];
      }

      recommendation.completionHistory.push({
        action: 'step_started',
        timestamp: new Date().toISOString(),
        stepId: stepId,
        stepTitle: step.title,
        notes: `Langkah "${step.title}" dimulai`
      });

      recommendation.updatedAt = new Date().toISOString();

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.safeSaveRecommendations(this.businessProfile.userId);
      }

      console.log('✅ Progress step started successfully');
    },

    async completeProgressStep(recommendationId, stepId, notes = '') {
      console.log('✅ Completing progress step:', stepId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation || !recommendation.progressSteps) {
        console.error('❌ Recommendation or progress steps not found');
        return;
      }

      const step = recommendation.progressSteps.find(s => s.id === stepId);
      if (!step) {
        console.error('❌ Step not found:', stepId);
        return;
      }

      // Update step status
      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      step.notes = notes;
      step.updatedAt = new Date().toISOString();

      // Update overall progress
      const completedSteps = recommendation.progressSteps.filter(s => s.status === 'completed').length;
      const totalSteps = recommendation.progressSteps.length;
      recommendation.progress = Math.round((completedSteps / totalSteps) * 100);

      // Move to next step if available
      const currentStepIndex = recommendation.progressSteps.findIndex(s => s.id === stepId);
      const nextStepIndex = currentStepIndex + 1;

      if (nextStepIndex < recommendation.progressSteps.length) {
        recommendation.currentStep = nextStepIndex;
      } else {
        // All steps completed
        if (recommendation.progress === 100) {
          recommendation.status = 'completed';
          recommendation.isCompleted = true;
          recommendation.completedAt = new Date().toISOString();
        }
      }

      // Check milestones
      await this.checkMilestones(recommendationId);

      // Add to completion history
      if (!recommendation.completionHistory) {
        recommendation.completionHistory = [];
      }

      recommendation.completionHistory.push({
        action: 'step_completed',
        timestamp: new Date().toISOString(),
        stepId: stepId,
        stepTitle: step.title,
        notes: notes || `Langkah "${step.title}" selesai`
      });

      recommendation.updatedAt = new Date().toISOString();

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.saveRecommendationsToFirestore(this.businessProfile.userId);
      }

      console.log('✅ Progress step completed successfully');
    },

    async skipProgressStep(recommendationId, stepId) {
      console.log('⏭️ Skipping progress step:', stepId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation || !recommendation.progressSteps) {
        console.error('❌ Recommendation or progress steps not found');
        return;
      }

      const step = recommendation.progressSteps.find(s => s.id === stepId);
      if (!step) {
        console.error('❌ Step not found:', stepId);
        return;
      }

      // Only allow skipping non-required steps
      if (step.isRequired) {
        console.warn('⚠️ Cannot skip required step');
        return;
      }

      // Update step status
      step.status = 'skipped';
      step.updatedAt = new Date().toISOString();

      // Move to next step
      const currentStepIndex = recommendation.progressSteps.findIndex(s => s.id === stepId);
      const nextStepIndex = currentStepIndex + 1;

      if (nextStepIndex < recommendation.progressSteps.length) {
        recommendation.currentStep = nextStepIndex;
      }

      // Update overall progress (skipped steps don't count towards completion)
      const completedSteps = recommendation.progressSteps.filter(s => s.status === 'completed').length;
      const totalRequiredSteps = recommendation.progressSteps.filter(s => s.isRequired).length;
      const completedRequiredSteps = recommendation.progressSteps.filter(s => s.status === 'completed' && s.isRequired).length;

      recommendation.progress = Math.round((completedRequiredSteps / totalRequiredSteps) * 100);

      // Add to completion history
      if (!recommendation.completionHistory) {
        recommendation.completionHistory = [];
      }

      recommendation.completionHistory.push({
        action: 'step_skipped',
        timestamp: new Date().toISOString(),
        stepId: stepId,
        stepTitle: step.title,
        notes: `Langkah "${step.title}" dilewati`
      });

      recommendation.updatedAt = new Date().toISOString();

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.saveRecommendationsToFirestore(this.businessProfile.userId);
      }

      console.log('✅ Progress step skipped successfully');
    },

    async toggleStepCheckpoint(recommendationId, stepId, checkpointId) {
      console.log('📋 Toggling step checkpoint:', checkpointId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation || !recommendation.progressSteps) {
        console.error('❌ Recommendation or progress steps not found');
        return;
      }

      const step = recommendation.progressSteps.find(s => s.id === stepId);
      if (!step || !step.checkpoints) {
        console.error('❌ Step or checkpoints not found');
        return;
      }

      const checkpoint = step.checkpoints.find(c => c.id === checkpointId);
      if (!checkpoint) {
        console.error('❌ Checkpoint not found:', checkpointId);
        return;
      }

      // Toggle checkpoint
      checkpoint.isCompleted = !checkpoint.isCompleted;
      checkpoint.completedAt = checkpoint.isCompleted ? new Date().toISOString() : null;

      // Update step progress based on checkpoints
      const completedCheckpoints = step.checkpoints.filter(c => c.isCompleted).length;
      const totalCheckpoints = step.checkpoints.length;
      step.checkpointProgress = Math.round((completedCheckpoints / totalCheckpoints) * 100);

      recommendation.updatedAt = new Date().toISOString();

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.saveRecommendationsToFirestore(this.businessProfile.userId);
      }

      console.log('✅ Checkpoint toggled successfully');
    },

    async saveStepNotes(recommendationId, stepId, notes) {
      console.log('📝 Saving step notes:', stepId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation || !recommendation.progressSteps) {
        console.error('❌ Recommendation or progress steps not found');
        return;
      }

      const step = recommendation.progressSteps.find(s => s.id === stepId);
      if (!step) {
        console.error('❌ Step not found:', stepId);
        return;
      }

      step.notes = notes;
      step.updatedAt = new Date().toISOString();
      recommendation.updatedAt = new Date().toISOString();

      // Save to storage
      if (this.businessProfile?.userId) {
        await this.saveRecommendationsToFirestore(this.businessProfile.userId);
      }

      console.log('✅ Step notes saved successfully');
    },

    async checkMilestones(recommendationId) {
      console.log('🎯 Checking milestones for:', recommendationId);

      const recommendation = this.recommendations.find(r => r.id === recommendationId);
      if (!recommendation || !recommendation.milestones) {
        return;
      }

      recommendation.milestones.forEach(milestone => {
        if (milestone.isCompleted) return;

        // Check if all required steps for this milestone are completed
        const allRequiredStepsCompleted = milestone.requiredSteps.every(stepId => {
          const step = recommendation.progressSteps.find(s => s.id === stepId);
          return step && step.status === 'completed';
        });

        if (allRequiredStepsCompleted) {
          milestone.isCompleted = true;
          milestone.completedAt = new Date().toISOString();

          // Add to completion history
          if (!recommendation.completionHistory) {
            recommendation.completionHistory = [];
          }

          recommendation.completionHistory.push({
            action: 'milestone_achieved',
            timestamp: new Date().toISOString(),
            milestoneId: milestone.id,
            milestoneTitle: milestone.title,
            notes: `Milestone "${milestone.title}" tercapai! ${milestone.reward}`
          });

          console.log('🎉 Milestone achieved:', milestone.title);
        }
      });
    },
    
    // Complete action item
    async completeActionItem(recommendationId, actionItemId) {
      const recommendation = this.recommendations.find(rec => rec.id === recommendationId);
      
      if (recommendation) {
        const actionItem = recommendation.actionItems?.find(item => item.id === actionItemId);
        
        if (actionItem) {
          actionItem.isCompleted = true;
          actionItem.completedAt = new Date().toISOString();
          
          // Check if all action items are completed
          const allCompleted = recommendation.actionItems.every(item => item.isCompleted);
          if (allCompleted && !recommendation.isCompleted) {
            await this.completeRecommendation(recommendationId);
          }
          
          // Save to Firestore if user is logged in
          if (this.businessProfile?.userId) {
            await this.saveRecommendationsToFirestore(this.businessProfile.userId);
          }
          
          console.log('✅ Action item completed:', actionItem.title);
        }
      }
    },
    
    // Update filters
    setFilter(filterType, value) {
      this.filters[filterType] = value;
    },
    
    // Update sorting
    setSortBy(sortBy) {
      this.sortBy = sortBy;
    },
    
    // Clear all data
    clearRecommendations() {
      this.recommendations = [];
      this.businessProfile = null;
      this.error = null;
      this.analytics = {
        totalRecommendations: 0,
        completedRecommendations: 0,
        bookmarkedRecommendations: 0,
        lastGeneratedAt: null,
        averageCompletionTime: 0
      };
    },
    
    // Request updated recommendations
    async refreshRecommendations() {
      if (this.businessProfile) {
        // Re-generate recommendations with current business profile
        // This would typically include updated diagnosis data
        await this.generateRecommendations(this.businessProfile, {
          currentStage: this.businessProfile.businessStage,
          answers: {}, // Would need to get latest diagnosis answers
          strengths: [],
          weaknesses: [],
          opportunities: []
        });
      }
    }
  }
});
