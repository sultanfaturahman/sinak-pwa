<script setup>
import { RouterView, useRoute } from 'vue-router'
import { computed, watch, ref } from 'vue'
import ConnectionStatus from './components/common/ConnectionStatus.vue'
import PageTransition from './components/transitions/PageTransition.vue'
import ErrorMonitor from './components/debug/ErrorMonitor.vue'

const route = useRoute()
const transitionName = ref('fade')

// Determine transition based on route navigation
const getTransitionName = (to, from) => {
  if (!from.name) return 'fade'

  // Define route hierarchy for smart transitions
  const routeHierarchy = {
    'Login': 0,
    'Register': 0,
    'Dashboard': 1,
    'Diagnosis': 2,
    'Recommendations': 3
  }

  const toLevel = routeHierarchy[to.name] || 1
  const fromLevel = routeHierarchy[from.name] || 1

  if (toLevel > fromLevel) {
    return 'slide-left' // Moving forward
  } else if (toLevel < fromLevel) {
    return 'slide-right' // Moving backward
  } else {
    return 'fade' // Same level
  }
}

// Watch route changes to update transition
watch(route, (to, from) => {
  transitionName.value = getTransitionName(to, from)
}, { flush: 'pre' })

// Development mode check
const isDevelopment = computed(() => {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_AI_TESTING === 'true'
})
</script>

<template>
  <div id="app">
    <ConnectionStatus />

    <!-- Modern Vue Router with Transition (Fixed Deprecation) -->
    <RouterView v-slot="{ Component, route: currentRoute }">
      <PageTransition
        :name="transitionName"
        mode="out-in"
        :duration="300"
      >
        <component
          :is="Component"
          :key="currentRoute.path"
          v-if="Component"
        />
      </PageTransition>
    </RouterView>

    <!-- Debug Error Monitor (Development Only) -->
    <ErrorMonitor v-if="isDevelopment" />
  </div>
</template>

<style scoped>
</style>
