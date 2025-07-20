<template>
  <transition
    :name="transitionName"
    :mode="mode"
    :appear="appear"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </transition>
</template>

<script setup>
import { computed, onMounted } from 'vue';

const props = defineProps({
  name: {
    type: String,
    default: 'fade'
  },
  mode: {
    type: String,
    default: 'out-in'
  },
  appear: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 300
  },
  delay: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits([
  'before-enter',
  'enter',
  'after-enter',
  'before-leave',
  'leave',
  'after-leave'
]);

const transitionName = computed(() => props.name);

// Transition event handlers
const onBeforeEnter = (el) => {
  if (props.delay > 0) {
    el.style.animationDelay = `${props.delay}ms`;
  }
  emit('before-enter', el);
};

const onEnter = (el, done) => {
  emit('enter', el, done);
  // Auto-complete if no custom handler
  setTimeout(done, props.duration);
};

const onAfterEnter = (el) => {
  el.style.animationDelay = '';
  emit('after-enter', el);
};

const onBeforeLeave = (el) => {
  emit('before-leave', el);
};

const onLeave = (el, done) => {
  emit('leave', el, done);
  // Auto-complete if no custom handler
  setTimeout(done, props.duration);
};

const onAfterLeave = (el) => {
  emit('after-leave', el);
};

onMounted(() => {
  console.log(`🎬 PageTransition initialized: ${props.name}`);
});
</script>

<style scoped>
/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Transitions */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(-100%);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(100%);
}

/* Scale Transitions */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Zoom Transitions */
.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* Bounce Transition */
.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-out 0.3s;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes bounce-out {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}

/* Flip Transition */
.flip-enter-active,
.flip-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.flip-enter-from {
  opacity: 0;
  transform: rotateY(-90deg);
}

.flip-leave-to {
  opacity: 0;
  transform: rotateY(90deg);
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition-duration: 0.3s;
  }
  
  .scale-enter-active,
  .scale-leave-active,
  .zoom-enter-active,
  .zoom-leave-active {
    transition-duration: 0.25s;
  }
  
  .flip-enter-active,
  .flip-leave-active {
    transition-duration: 0.3s;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .slide-down-enter-active,
  .slide-down-leave-active,
  .scale-enter-active,
  .scale-leave-active,
  .zoom-enter-active,
  .zoom-leave-active,
  .flip-enter-active,
  .flip-leave-active {
    transition-duration: 0.1s;
  }
  
  .bounce-enter-active {
    animation-duration: 0.1s;
  }
  
  .bounce-leave-active {
    animation-duration: 0.1s;
  }
}
</style>
