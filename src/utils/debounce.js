/**
 * Lightweight Debounce Utility for SiNaK PWA
 * Custom implementation to avoid lodash-es dependency
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout
 * @param {number} options.maxWait - The maximum time func is allowed to be delayed before it's invoked
 * @returns {Function} The debounced function
 */
export function debounce(func, wait, options = {}) {
  let lastArgs;
  let lastThis;
  let maxTimeoutId;
  let result;
  let timerId;
  let lastCallTime;
  let lastInvokeTime = 0;
  let leading = false;
  let maxing = false;
  let trailing = true;

  // Handle options
  if (typeof options === 'object') {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  const maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : 0;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timerId !== undefined;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout
 * @returns {Function} The throttled function
 */
export function throttle(func, wait, options = {}) {
  let leading = true;
  let trailing = true;

  if (typeof options === 'object') {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait
  });
}

/**
 * Simple debounce function for basic use cases
 * 
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The debounced function
 */
export function simpleDebounce(func, delay) {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Debounce function with immediate execution option
 * 
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {boolean} immediate - Whether to execute immediately on first call
 * @returns {Function} The debounced function
 */
export function debounceImmediate(func, delay, immediate = false) {
  let timeoutId;
  
  return function debounced(...args) {
    const callNow = immediate && !timeoutId;
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) func.apply(this, args);
    }, delay);
    
    if (callNow) func.apply(this, args);
  };
}

// Export default debounce function
export default debounce;

// Make debounce utilities available globally for console testing
if (typeof window !== 'undefined') {
  window.debounceUtils = {
    debounce,
    throttle,
    simpleDebounce,
    debounceImmediate
  };
  
  console.log('🔧 Debounce utilities available: window.debounceUtils');
}
