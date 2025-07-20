<template>
  <div class="bookmark-view">
    <BookmarkDashboard />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import BookmarkDashboard from '../components/recommendations/BookmarkDashboard.vue';
import { useRecommendationStore } from '../store/recommendation.js';
import { useAuthStore } from '../store/auth.js';

const recommendationStore = useRecommendationStore();
const authStore = useAuthStore();

onMounted(async () => {
  console.log('📚 Bookmark View mounted');
  
  // Load recommendations if not already loaded
  if (authStore.user && recommendationStore.recommendations.length === 0) {
    await recommendationStore.loadRecommendations(authStore.user.uid);
  }
});
</script>

<style scoped>
.bookmark-view {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 20px;
}
</style>
