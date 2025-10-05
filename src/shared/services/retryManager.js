/**
 * RetryManager class for handling retry attempts with exponential backoff
 * Provides configurable retry strategies for different error types
 */

import { AUTH_ERROR_TYPES } from './authErrorHandler.js';
import performanceOptimizer from './performanceOptimizer.js';

// Default retry configuration for different error types
const DEFAULT_RETRY_CONFIG = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    jitter: true
  },
  [AUTH_ERROR_TYPES.SERVER_ERROR]: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    jitter: true
  },
  [AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: false
  },
  [AUTH_ERROR_TYPES.AUTH_RATE_LIMITED]: {
    maxRetries: 1,
    baseDelay: 5000,
    maxDelay: 10000,
    backoffMultiplier: 1,
    jitter: false
  },
  [AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD]: {
    maxRetries: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  // Non-retryable errors
  [AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND]: {
    maxRetries: 0,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  [AUTH_ERROR_TYPES.AUTH_USER_EXISTS]: {
    maxRetries: 0,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  [AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED]: {
    maxRetries: 0,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  // Default for unknown errors
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: {
    maxRetries: 1,
    baseDelay: 1000,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: true
  }
};

/**
 * RetryManager class for handling retry logic with exponential backoff
 */
export class RetryManager {
  constructor(customConfig = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...customConfig };
  }

  /**
   * Execute a function with retry logic
   * @param {Function} fn - The async function to execute
   * @param {string} errorType - The error type for retry configuration
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Result of the function execution
   */
  async executeWithRetry(fn, errorType = AUTH_ERROR_TYPES.UNKNOWN_ERROR, options = {}) {
    const startTime = Date.now();
    const config = this.getRetryConfig(errorType);
    const maxRetries = options.maxRetries ?? config.maxRetries;
    let attemptCount = 0;
    let lastError = null;
    let totalElapsedMs = 0;

    while (attemptCount <= maxRetries) {
      const attemptStartTime = Date.now();
      
      try {
        const result = await fn(attemptCount);
        
        // Record successful retry performance
        const totalDuration = Date.now() - startTime;
        performanceOptimizer.performanceMonitor.recordMetric('retryExecution', totalDuration, {
          errorType,
          attemptCount,
          totalAttempts: attemptCount + 1,
          success: true,
          totalElapsedMs: totalElapsedMs
        });
        
        return {
          success: true,
          result: result,
          attemptCount: attemptCount,
          totalAttempts: attemptCount + 1,
          totalElapsedMs: totalElapsedMs
        };
      } catch (error) {
        lastError = error;
        attemptCount++;
        
        const attemptDuration = Date.now() - attemptStartTime;
        totalElapsedMs += attemptDuration;

        // If this was the last attempt, break
        if (attemptCount > maxRetries) {
          break;
        }

        // Use optimized retry calculation
        const optimizedRetryInfo = performanceOptimizer.optimizeRetryDelay(
          attemptCount,
          errorType,
          totalElapsedMs
        );

        // Check if we should continue retrying based on performance considerations
        if (!optimizedRetryInfo.shouldRetry || optimizedRetryInfo.remainingTime <= 0) {
          break;
        }

        // Use optimized delay (prefer performance optimizer over traditional calculation)
        const delay = optimizedRetryInfo.delay || this.calculateDelay(errorType, attemptCount);
        
        // Wait before retrying
        if (delay > 0) {
          await this.delay(delay);
          totalElapsedMs += delay;
        }
      }
    }

    // Record failed retry performance
    const totalDuration = Date.now() - startTime;
    performanceOptimizer.performanceMonitor.recordMetric('retryExecution', totalDuration, {
      errorType,
      attemptCount,
      totalAttempts: attemptCount,
      success: false,
      maxRetriesExceeded: true,
      totalElapsedMs: totalElapsedMs
    });

    // All retries exhausted, return failure
    return {
      success: false,
      error: lastError,
      attemptCount: attemptCount,
      totalAttempts: attemptCount,
      maxRetriesExceeded: true,
      totalElapsedMs: totalElapsedMs
    };
  }

  /**
   * Calculate delay for next retry attempt using exponential backoff
   * @param {string} errorType - The error type
   * @param {number} attemptCount - Current attempt count (1-based)
   * @returns {number} - Delay in milliseconds
   */
  calculateDelay(errorType, attemptCount) {
    const config = this.getRetryConfig(errorType);
    
    if (config.baseDelay === 0) {
      return 0;
    }

    // Calculate exponential backoff: baseDelay * (backoffMultiplier ^ (attemptCount - 1))
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attemptCount - 1);
    
    // Cap at maximum delay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter if enabled (random variation of ±25%)
    if (config.jitter) {
      const jitterRange = delay * 0.25;
      const jitterOffset = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay + jitterOffset);
    }
    
    return Math.round(delay);
  }

  /**
   * Get retry configuration for a specific error type
   * @param {string} errorType - The error type
   * @returns {Object} - Retry configuration
   */
  getRetryConfig(errorType) {
    return this.retryConfig[errorType] || this.retryConfig[AUTH_ERROR_TYPES.UNKNOWN_ERROR];
  }

  /**
   * Check if an error type should be retried
   * @param {string} errorType - The error type
   * @param {number} attemptCount - Current attempt count
   * @returns {boolean} - Whether retry should be attempted
   */
  shouldRetry(errorType, attemptCount = 0) {
    const config = this.getRetryConfig(errorType);
    return attemptCount < config.maxRetries;
  }

  /**
   * Get maximum retry count for an error type
   * @param {string} errorType - The error type
   * @returns {number} - Maximum retry count
   */
  getMaxRetries(errorType) {
    const config = this.getRetryConfig(errorType);
    return config.maxRetries;
  }

  /**
   * Get remaining retry attempts
   * @param {string} errorType - The error type
   * @param {number} attemptCount - Current attempt count
   * @returns {number} - Remaining retry attempts
   */
  getRemainingRetries(errorType, attemptCount = 0) {
    const maxRetries = this.getMaxRetries(errorType);
    return Math.max(0, maxRetries - attemptCount);
  }

  /**
   * Update retry configuration for a specific error type
   * @param {string} errorType - The error type
   * @param {Object} config - New configuration
   */
  updateRetryConfig(errorType, config) {
    this.retryConfig[errorType] = { ...this.retryConfig[errorType], ...config };
  }

  /**
   * Reset retry configuration to defaults
   */
  resetToDefaults() {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG };
  }

  /**
   * Get all retry configurations
   * @returns {Object} - All retry configurations
   */
  getAllConfigs() {
    return { ...this.retryConfig };
  }

  /**
   * Promise-based delay utility
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} - Promise that resolves after the delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry wrapper for a specific error type
   * @param {string} errorType - The error type
   * @param {Object} options - Additional options
   * @returns {Function} - Wrapper function that adds retry logic
   */
  createRetryWrapper(errorType, options = {}) {
    return (fn) => {
      return (...args) => {
        return this.executeWithRetry(
          (attemptCount) => fn(...args, { attemptCount }),
          errorType,
          options
        );
      };
    };
  }

  /**
   * Get retry statistics for monitoring
   * @returns {Object} - Retry statistics
   */
  getRetryStats() {
    const stats = {};
    
    Object.keys(this.retryConfig).forEach(errorType => {
      const config = this.retryConfig[errorType];
      stats[errorType] = {
        maxRetries: config.maxRetries,
        baseDelay: config.baseDelay,
        maxDelay: config.maxDelay,
        backoffMultiplier: config.backoffMultiplier,
        jitter: config.jitter,
        retryable: config.maxRetries > 0
      };
    });
    
    return stats;
  }
}

// Create singleton instance
export const retryManager = new RetryManager();
export default retryManager;