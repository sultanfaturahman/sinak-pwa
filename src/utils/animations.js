/**
 * Animation utilities for SiNaK PWA
 * Provides reusable animation functions and configurations
 */

// Animation timing functions
export const EASING = {
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Animation durations
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800
};

// Animation delays for staggered effects
export const STAGGER_DELAY = {
  fast: 50,
  normal: 100,
  slow: 150
};

/**
 * Create a smooth fade-in animation
 */
export const fadeIn = (element, duration = DURATION.normal, delay = 0) => {
  return new Promise((resolve) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ${EASING.smooth}`;
    
    setTimeout(() => {
      element.style.opacity = '1';
      setTimeout(resolve, duration);
    }, delay);
  });
};

/**
 * Create a smooth fade-out animation
 */
export const fadeOut = (element, duration = DURATION.normal, delay = 0) => {
  return new Promise((resolve) => {
    element.style.transition = `opacity ${duration}ms ${EASING.smooth}`;
    
    setTimeout(() => {
      element.style.opacity = '0';
      setTimeout(resolve, duration);
    }, delay);
  });
};

/**
 * Create a slide-up animation
 */
export const slideUp = (element, duration = DURATION.normal, delay = 0) => {
  return new Promise((resolve) => {
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ${EASING.smooth}`;
    
    setTimeout(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
      setTimeout(resolve, duration);
    }, delay);
  });
};

/**
 * Create a scale animation
 */
export const scaleIn = (element, duration = DURATION.normal, delay = 0) => {
  return new Promise((resolve) => {
    element.style.transform = 'scale(0.9)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ${EASING.bounce}`;
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
      setTimeout(resolve, duration);
    }, delay);
  });
};

/**
 * Create a staggered animation for multiple elements
 */
export const staggerAnimation = (elements, animationFn, staggerDelay = STAGGER_DELAY.normal) => {
  const promises = [];
  
  elements.forEach((element, index) => {
    const delay = index * staggerDelay;
    promises.push(animationFn(element, DURATION.normal, delay));
  });
  
  return Promise.all(promises);
};

/**
 * Animate number counting
 */
export const animateNumber = (element, start, end, duration = DURATION.slow) => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const difference = end - start;
    
    const updateNumber = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOut for smooth number animation
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(start + (difference * easeOutProgress));
      
      element.textContent = currentValue;
      
      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        element.textContent = end;
        resolve();
      }
    };
    
    requestAnimationFrame(updateNumber);
  });
};

/**
 * Create a pulse animation
 */
export const pulse = (element, duration = DURATION.normal) => {
  return new Promise((resolve) => {
    element.style.animation = `pulse ${duration}ms ${EASING.smooth}`;
    
    setTimeout(() => {
      element.style.animation = '';
      resolve();
    }, duration);
  });
};

/**
 * Create a shake animation for error states
 */
export const shake = (element, duration = DURATION.fast) => {
  return new Promise((resolve) => {
    element.style.animation = `shake ${duration}ms ${EASING.smooth}`;
    
    setTimeout(() => {
      element.style.animation = '';
      resolve();
    }, duration);
  });
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate duration based on user preferences
 */
export const getAnimationDuration = (duration) => {
  return prefersReducedMotion() ? Math.min(duration, 100) : duration;
};

/**
 * Create a smooth height transition
 */
export const animateHeight = (element, targetHeight, duration = DURATION.normal) => {
  return new Promise((resolve) => {
    const startHeight = element.offsetHeight;
    element.style.height = `${startHeight}px`;
    element.style.transition = `height ${duration}ms ${EASING.smooth}`;
    element.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      element.style.height = targetHeight === 'auto' ? `${element.scrollHeight}px` : `${targetHeight}px`;
      
      setTimeout(() => {
        if (targetHeight === 'auto') {
          element.style.height = 'auto';
        }
        element.style.overflow = '';
        element.style.transition = '';
        resolve();
      }, duration);
    });
  });
};

/**
 * Create intersection observer for scroll animations
 */
export const createScrollAnimationObserver = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  };
  
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
      }
    });
  }, defaultOptions);
};

/**
 * Auto-animate elements when they come into view
 */
export const setupScrollAnimations = () => {
  const observer = createScrollAnimationObserver((element) => {
    if (element.classList.contains('animate-on-scroll')) {
      const animationType = element.dataset.animation || 'slideUp';
      const delay = parseInt(element.dataset.delay) || 0;
      
      switch (animationType) {
        case 'fadeIn':
          fadeIn(element, getAnimationDuration(DURATION.normal), delay);
          break;
        case 'slideUp':
          slideUp(element, getAnimationDuration(DURATION.normal), delay);
          break;
        case 'scaleIn':
          scaleIn(element, getAnimationDuration(DURATION.normal), delay);
          break;
        default:
          slideUp(element, getAnimationDuration(DURATION.normal), delay);
      }
      
      // Remove the class to prevent re-animation
      element.classList.remove('animate-on-scroll');
    }
  });
  
  // Observe all elements with animate-on-scroll class
  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    observer.observe(el);
  });
  
  return observer;
};

// CSS keyframes for animations (to be added to global styles)
export const CSS_ANIMATIONS = `
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slide-in-up {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
`;
