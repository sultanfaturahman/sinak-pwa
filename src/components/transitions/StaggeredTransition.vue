<template>
  <transition-group
    :name="transitionName"
    :tag="tag"
    :appear="appear"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
    class="staggered-container"
  >
    <slot />
  </transition-group>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    default: 'stagger'
  },
  tag: {
    type: String,
    default: 'div'
  },
  appear: {
    type: Boolean,
    default: true
  },
  delay: {
    type: Number,
    default: 100
  },
  duration: {
    type: Number,
    default: 300
  },
  maxDelay: {
    type: Number,
    default: 1000
  }
});

const transitionName = computed(() => props.name);

const onBeforeEnter = (el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
};

const onEnter = (el, done) => {
  const delay = Math.min(el.dataset.index * props.delay, props.maxDelay);
  
  setTimeout(() => {
    el.style.transition = `all ${props.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    
    setTimeout(done, props.duration);
  }, delay);
};

const onLeave = (el, done) => {
  const delay = Math.min(el.dataset.index * (props.delay / 2), props.maxDelay / 2);
  
  setTimeout(() => {
    el.style.transition = `all ${props.duration / 2}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    el.style.opacity = '0';
    el.style.transform = 'translateY(-20px)';
    
    setTimeout(done, props.duration / 2);
  }, delay);
};
</script>

<style scoped>
.staggered-container {
  position: relative;
}

/* Stagger fade-up animation */
.stagger-enter-active,
.stagger-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.stagger-enter-from,
.stagger-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.stagger-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Stagger slide-left animation */
.stagger-slide-enter-active,
.stagger-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.stagger-slide-enter-from,
.stagger-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.stagger-slide-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Stagger scale animation */
.stagger-scale-enter-active,
.stagger-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.stagger-scale-enter-from,
.stagger-scale-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.stagger-scale-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .stagger-enter-active,
  .stagger-leave-active,
  .stagger-slide-enter-active,
  .stagger-slide-leave-active,
  .stagger-scale-enter-active,
  .stagger-scale-leave-active {
    transition-duration: 0.25s;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .stagger-enter-active,
  .stagger-leave-active,
  .stagger-slide-enter-active,
  .stagger-slide-leave-active,
  .stagger-scale-enter-active,
  .stagger-scale-leave-active {
    transition-duration: 0.1s;
  }
}
</style>
