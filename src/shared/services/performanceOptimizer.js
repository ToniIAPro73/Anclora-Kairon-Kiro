/**
 * Performance Optimizer for Error Handling
 * Minimizes overhead of error checking and optimizes retry logic
 * Provides efficient error state management and performance monitoring
 */

/**
 * Performance optimization constants
 */
export const PERFORMANCE_THRESHOLDS = {
  ERROR_HANDLING_MAX_MS: 50, // Max time for error handling operations
  RETRY_DELAY_MIN_MS: 100,   // Minimum retry delay
  RETRY_DELAY_MAX_MS: 30000, // Maximum retry delay
  CACHE_TTL_MS: 60000,       // Cache TTL for error patterns
  BATCH_SIZE: 10,            // Batch size for error processing
  MEMORY_THRESHOLD_MB: 50    // Memory usage threshold
};

/**
 * Error pattern cache for optimized classification
 */
class ErrorPatternCache {
  constructor(maxSize = 1000, ttlMs = PERFORMANCE_THRESHOLDS.CACHE_TTL_MS) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached error classification
   * @param {string} errorKey - Error signature key
   * @returns {Object|null} Cached classification or null
   */
  get(errorKey) {
    const entry = this.cache.get(errorKey);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(errorKey);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.classification;
  }

  /**
   * Set cached error classification
   * @param {string} errorKey - Error signature key
   * @param {Object} classification - Error classification result
   */
  set(errorKey, classification) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(errorKey, {
      classification,
      timestamp: Date.now()
    });
  }

  /**
   * Generate error signature key for caching
   * @param {Error} error - Error object
   * @returns {string} Error signature key
   */
  generateKey(error) {
    const message = error.message || '';
    const code = error.code || '';
    const status = error.status || 0;
    const name = error.name || '';
    
    // Create a hash-like key from error properties
    return `${name}:${code}:${status}:${message.substring(0, 100)}`;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache performance statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) : 0,
      ttlMs: this.ttlMs
    };
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Optimized retry delay calculator
 */
class OptimizedRetryCalculator {
  constructor() {
    this.baseDelay = PERFORMANCE_THRESHOLDS.RETRY_DELAY_MIN_MS;
    this.maxDelay = PERFORMANCE_THRESHOLDS.RETRY_DELAY_MAX_MS;
    this.jitterFactor = 0.1; // 10% jitter to prevent thundering herd
  }

  /**
   * Calculate optimized retry delay with exponential backoff and jitter
   * @param {number} attemptCount - Current attempt count
   * @param {string} errorType - Type of error for context-aware delays
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attemptCount, errorType = 'UNKNOWN') {
    // Base exponential backoff
    let delay = Math.min(
      this.baseDelay * Math.pow(2, attemptCount - 1),
      this.maxDelay
    );

    // Apply error-type specific adjustments
    delay = this.applyErrorTypeAdjustment(delay, errorType);

    // Add jitter to prevent thundering herd
    const jitter = delay * this.jitterFactor * (Math.random() - 0.5);
    delay = Math.max(this.baseDelay, delay + jitter);

    return Math.round(delay);
  }

  /**
   * Apply error-type specific delay adjustments
   * @param {number} baseDelay - Base calculated delay
   * @param {string} errorType - Error type
   * @returns {number} Adjusted delay
   */
  applyErrorTypeAdjustment(baseDelay, errorType) {
    // Use a Map for O(1) lookup performance instead of object property access
    if (!this.adjustmentMap) {
      this.adjustmentMap = new Map([
        ['NETWORK_ERROR', 1.0],           // Standard delay
        ['SUPABASE_UNAVAILABLE', 2.0],    // Longer delay for service issues
        ['SUPABASE_MAINTENANCE', 3.0],    // Much longer delay during maintenance
        ['AUTH_RATE_LIMITED', 1.5],       // Moderate delay for rate limiting
        ['SERVER_ERROR', 1.2],            // Slightly longer for server errors
        ['OAUTH_TIMEOUT', 0.8],           // Shorter delay for OAuth timeouts
        ['AUTH_INVALID_CREDENTIALS', 0.5], // Shorter delay for user errors
        ['UNKNOWN_ERROR', 1.0]            // Standard delay for unknown errors
      ]);
    }

    const multiplier = this.adjustmentMap.get(errorType) || 1.0;
    return baseDelay * multiplier;
  }

  /**
   * Check if retry should be attempted based on performance considerations
   * @param {number} attemptCount - Current attempt count
   * @param {string} errorType - Error type
   * @param {number} totalElapsedMs - Total time elapsed in retry attempts
   * @returns {boolean} Whether retry should be attempted
   */
  shouldRetry(attemptCount, errorType, totalElapsedMs = 0) {
    // Don't retry if we've exceeded reasonable time limits
    const maxTotalTime = this.getMaxTotalRetryTime(errorType);
    if (totalElapsedMs > maxTotalTime) {
      return false;
    }

    // Don't retry certain error types that won't benefit from retry
    const nonRetryableErrors = [
      'AUTH_INVALID_CREDENTIALS',
      'AUTH_USER_NOT_FOUND',
      'AUTH_USER_EXISTS',
      'AUTH_WEAK_PASSWORD',
      'OAUTH_ACCESS_DENIED',
      'AUTH_EMAIL_NOT_CONFIRMED'
    ];

    if (nonRetryableErrors.includes(errorType)) {
      return false;
    }

    return true;
  }

  /**
   * Get maximum total retry time for error type
   * @param {string} errorType - Error type
   * @returns {number} Maximum total retry time in milliseconds
   */
  getMaxTotalRetryTime(errorType) {
    // Use a Map for O(1) lookup performance
    if (!this.maxTimeMap) {
      this.maxTimeMap = new Map([
        ['NETWORK_ERROR', 30000],         // 30 seconds
        ['SUPABASE_UNAVAILABLE', 120000], // 2 minutes
        ['SUPABASE_MAINTENANCE', 300000], // 5 minutes
        ['AUTH_RATE_LIMITED', 60000],     // 1 minute
        ['SERVER_ERROR', 45000],          // 45 seconds
        ['OAUTH_TIMEOUT', 20000],         // 20 seconds
        ['UNKNOWN_ERROR', 30000]          // 30 seconds
      ]);
    }

    return this.maxTimeMap.get(errorType) || 30000;
  }
}

/**
 * Performance monitoring for error handling operations
 */
class ErrorHandlingPerformanceMonitor {
  constructor() {
    this.metrics = {
      errorClassificationTime: [],
      retryCalculationTime: [],
      errorHandlingTime: [],
      memoryUsage: [],
      cachePerformance: []
    };
    this.maxSamples = 1000; // Keep last 1000 samples
  }

  /**
   * Record performance metric
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(operation, duration, metadata = {}) {
    const metric = {
      duration,
      timestamp: Date.now(),
      metadata
    };

    if (this.metrics[operation]) {
      this.metrics[operation].push(metric);
      
      // Keep only recent samples
      if (this.metrics[operation].length > this.maxSamples) {
        this.metrics[operation].shift();
      }
    }
  }

  /**
   * Get performance statistics for an operation
   * @param {string} operation - Operation name
   * @returns {Object} Performance statistics
   */
  getStats(operation) {
    const samples = this.metrics[operation] || [];
    
    if (samples.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0
      };
    }

    const durations = samples.map(s => s.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count,
      average: sum / count,
      min: durations[0],
      max: durations[count - 1],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)],
      recent: samples.slice(-10).map(s => ({
        duration: s.duration,
        timestamp: s.timestamp
      }))
    };
  }

  /**
   * Get all performance statistics
   * @returns {Object} All performance statistics
   */
  getAllStats() {
    const stats = {};
    
    Object.keys(this.metrics).forEach(operation => {
      stats[operation] = this.getStats(operation);
    });

    return stats;
  }

  /**
   * Check if performance is within acceptable thresholds
   * @returns {Object} Performance health check result
   */
  checkPerformanceHealth() {
    const stats = this.getAllStats();
    const issues = [];
    const warnings = [];

    // Check error handling performance
    if (stats.errorHandlingTime && stats.errorHandlingTime.average > PERFORMANCE_THRESHOLDS.ERROR_HANDLING_MAX_MS) {
      issues.push({
        type: 'SLOW_ERROR_HANDLING',
        message: `Error handling average time (${stats.errorHandlingTime.average.toFixed(2)}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.ERROR_HANDLING_MAX_MS}ms)`,
        severity: 'HIGH'
      });
    }

    // Check for memory usage patterns
    if (stats.memoryUsage && stats.memoryUsage.count > 0) {
      const recentMemory = stats.memoryUsage.recent || [];
      const avgMemory = recentMemory.reduce((sum, m) => sum + (m.metadata?.heapUsed || 0), 0) / recentMemory.length;
      
      if (avgMemory > PERFORMANCE_THRESHOLDS.MEMORY_THRESHOLD_MB * 1024 * 1024) {
        warnings.push({
          type: 'HIGH_MEMORY_USAGE',
          message: `Average memory usage (${(avgMemory / 1024 / 1024).toFixed(2)}MB) is high`,
          severity: 'MEDIUM'
        });
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      warnings,
      stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = [];
    });
  }
}

/**
 * Lightweight error state manager for minimal overhead
 */
class LightweightErrorStateManager {
  constructor() {
    this.errorStates = new Map(); // Use Map for O(1) operations
    this.maxStates = 100; // Limit memory usage
    this.cleanupThreshold = 120; // Cleanup when exceeding this
  }

  /**
   * Set error state with minimal overhead
   * @param {string} key - State key
   * @param {Object} state - Error state
   */
  setState(key, state) {
    // Cleanup if needed (lazy cleanup for performance)
    if (this.errorStates.size > this.cleanupThreshold) {
      this.cleanup();
    }

    this.errorStates.set(key, {
      ...state,
      timestamp: Date.now()
    });
  }

  /**
   * Get error state with minimal overhead
   * @param {string} key - State key
   * @returns {Object|null} Error state or null
   */
  getState(key) {
    return this.errorStates.get(key) || null;
  }

  /**
   * Check if error state exists (fastest operation)
   * @param {string} key - State key
   * @returns {boolean} Whether state exists
   */
  hasState(key) {
    return this.errorStates.has(key);
  }

  /**
   * Remove error state
   * @param {string} key - State key
   */
  removeState(key) {
    this.errorStates.delete(key);
  }

  /**
   * Cleanup old states to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, state] of this.errorStates.entries()) {
      if (now - state.timestamp > maxAge) {
        this.errorStates.delete(key);
      }
      
      // Stop cleanup early if we're back under the limit
      if (this.errorStates.size <= this.maxStates) {
        break;
      }
    }
  }

  /**
   * Get state manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      stateCount: this.errorStates.size,
      maxStates: this.maxStates,
      cleanupThreshold: this.cleanupThreshold
    };
  }
}

/**
 * Main Performance Optimizer class
 */
export class PerformanceOptimizer {
  constructor() {
    this.errorPatternCache = new ErrorPatternCache();
    this.retryCalculator = new OptimizedRetryCalculator();
    this.performanceMonitor = new ErrorHandlingPerformanceMonitor();
    this.errorStateManager = new LightweightErrorStateManager();
    this.isEnabled = true;
    this.batchProcessor = null;
    this.batchQueue = [];
    
    // Performance optimization flags
    this.optimizationFlags = {
      enableCaching: true,
      enableBatching: true,
      enableLazyCleanup: true,
      enableFastPath: true
    };
  }

  /**
   * Fast path error classification for common patterns
   * @param {Error} error - Error to classify
   * @returns {string|null} Error type if recognized, null if needs full classification
   */
  fastPathClassification(error) {
    if (!error || !this.optimizationFlags.enableFastPath) {
      return null;
    }

    const message = error.message?.toLowerCase() || '';
    
    // Fast path for most common errors (avoid string operations when possible)
    if (message.includes('network')) return 'NETWORK_ERROR';
    if (message.includes('invalid login credentials')) return 'AUTH_INVALID_CREDENTIALS';
    if (message.includes('user not found')) return 'AUTH_USER_NOT_FOUND';
    if (message.includes('already registered')) return 'AUTH_USER_EXISTS';
    if (message.includes('rate limit')) return 'AUTH_RATE_LIMITED';
    
    // Check status codes for even faster classification
    if (error.status === 503) return 'SUPABASE_UNAVAILABLE';
    if (error.status === 401) return 'AUTH_INVALID_CREDENTIALS';
    if (error.status === 429) return 'AUTH_RATE_LIMITED';
    
    return null; // Needs full classification
  }

  /**
   * Optimize error classification with caching and fast path
   * @param {Error} error - Error to classify
   * @param {Function} classifyFunction - Original classification function
   * @returns {string} Error type classification
   */
  optimizeErrorClassification(error, classifyFunction) {
    const startTime = performance.now();
    
    try {
      if (!this.isEnabled) {
        return classifyFunction(error);
      }

      // Fast path for common errors (minimal overhead)
      const fastResult = this.fastPathClassification(error);
      if (fastResult) {
        const duration = performance.now() - startTime;
        this.performanceMonitor.recordMetric('errorClassificationTime', duration, {
          fastPath: true,
          errorType: fastResult
        });
        return fastResult;
      }

      // Try cache if fast path didn't match
      if (this.optimizationFlags.enableCaching) {
        const errorKey = this.errorPatternCache.generateKey(error);
        const cachedResult = this.errorPatternCache.get(errorKey);
        
        if (cachedResult) {
          const duration = performance.now() - startTime;
          this.performanceMonitor.recordMetric('errorClassificationTime', duration, {
            cached: true,
            errorType: cachedResult
          });
          return cachedResult;
        }

        // Perform classification and cache result
        const result = classifyFunction(error);
        this.errorPatternCache.set(errorKey, result);
        
        const duration = performance.now() - startTime;
        this.performanceMonitor.recordMetric('errorClassificationTime', duration, {
          cached: false,
          errorType: result
        });

        return result;
      } else {
        // Direct classification without caching
        const result = classifyFunction(error);
        const duration = performance.now() - startTime;
        this.performanceMonitor.recordMetric('errorClassificationTime', duration, {
          direct: true,
          errorType: result
        });
        return result;
      }
    } catch (classificationError) {
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('errorClassificationTime', duration, {
        error: true,
        errorMessage: classificationError.message
      });
      
      // Fallback to direct classification
      return classifyFunction(error);
    }
  }

  /**
   * Optimize retry delay calculation
   * @param {number} attemptCount - Current attempt count
   * @param {string} errorType - Error type
   * @param {number} totalElapsedMs - Total elapsed time
   * @returns {Object} Optimized retry information
   */
  optimizeRetryDelay(attemptCount, errorType, totalElapsedMs = 0) {
    const startTime = performance.now();
    
    try {
      const shouldRetry = this.retryCalculator.shouldRetry(attemptCount, errorType, totalElapsedMs);
      const delay = shouldRetry ? this.retryCalculator.calculateDelay(attemptCount, errorType) : 0;
      
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('retryCalculationTime', duration, {
        attemptCount,
        errorType,
        shouldRetry,
        delay
      });

      return {
        shouldRetry,
        delay,
        maxTotalTime: this.retryCalculator.getMaxTotalRetryTime(errorType),
        remainingTime: Math.max(0, this.retryCalculator.getMaxTotalRetryTime(errorType) - totalElapsedMs)
      };
    } catch (calculationError) {
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('retryCalculationTime', duration, {
        error: true,
        errorMessage: calculationError.message
      });
      
      // Fallback to simple calculation
      return {
        shouldRetry: attemptCount < 3,
        delay: Math.min(1000 * Math.pow(2, attemptCount - 1), 10000),
        maxTotalTime: 30000,
        remainingTime: 30000 - totalElapsedMs
      };
    }
  }

  /**
   * Optimize error handling with batching and efficient state management
   * @param {Function} errorHandlingFunction - Original error handling function
   * @param {Array} errors - Array of errors to process
   * @returns {Promise<Array>} Processed error results
   */
  async optimizeErrorHandling(errorHandlingFunction, errors) {
    const startTime = performance.now();
    
    try {
      if (!this.isEnabled || errors.length === 0) {
        return await Promise.all(errors.map(errorHandlingFunction));
      }

      // Process errors in batches for better performance
      const results = [];
      const batchSize = PERFORMANCE_THRESHOLDS.BATCH_SIZE;
      
      for (let i = 0; i < errors.length; i += batchSize) {
        const batch = errors.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(errorHandlingFunction));
        results.push(...batchResults);
        
        // Allow event loop to breathe between batches
        if (i + batchSize < errors.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('errorHandlingTime', duration, {
        errorCount: errors.length,
        batchCount: Math.ceil(errors.length / batchSize),
        batchSize
      });

      return results;
    } catch (handlingError) {
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('errorHandlingTime', duration, {
        error: true,
        errorMessage: handlingError.message,
        errorCount: errors.length
      });
      
      throw handlingError;
    }
  }

  /**
   * Monitor memory usage and optimize accordingly
   */
  monitorMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryInfo = {
        heapUsed: performance.memory.usedJSHeapSize,
        heapTotal: performance.memory.totalJSHeapSize,
        heapLimit: performance.memory.jsHeapSizeLimit
      };

      this.performanceMonitor.recordMetric('memoryUsage', memoryInfo.heapUsed, {
        ...memoryInfo,
        cacheSize: this.errorPatternCache.cache.size,
        timestamp: Date.now()
      });

      // Clear cache if memory usage is high
      const usagePercent = (memoryInfo.heapUsed / memoryInfo.heapLimit) * 100;
      if (usagePercent > 80) {
        this.errorPatternCache.clear();
        console.warn('High memory usage detected, cleared error pattern cache');
      }
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    return {
      monitor: this.performanceMonitor.getAllStats(),
      cache: this.errorPatternCache.getStats(),
      health: this.performanceMonitor.checkPerformanceHealth(),
      config: {
        isEnabled: this.isEnabled,
        thresholds: PERFORMANCE_THRESHOLDS
      }
    };
  }

  /**
   * Enable or disable performance optimizations
   * @param {boolean} enabled - Whether to enable optimizations
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.errorPatternCache.clear();
      this.performanceMonitor.clear();
    }
  }

  /**
   * Clear all caches and reset performance data
   */
  reset() {
    this.errorPatternCache.clear();
    this.performanceMonitor.clear();
  }

  /**
   * Start periodic memory monitoring
   * @param {number} intervalMs - Monitoring interval in milliseconds
   */
  startMemoryMonitoring(intervalMs = 30000) {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }

    this.memoryMonitorInterval = setInterval(() => {
      this.monitorMemoryUsage();
    }, intervalMs);
  }

  /**
   * Stop periodic memory monitoring
   */
  stopMemoryMonitoring() {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
  }

  /**
   * Efficiently manage error state with minimal overhead
   * @param {string} operationId - Unique operation identifier
   * @param {Object} errorState - Error state to store
   */
  setErrorState(operationId, errorState) {
    if (this.optimizationFlags.enableFastPath) {
      this.errorStateManager.setState(operationId, errorState);
    }
  }

  /**
   * Get error state with minimal overhead
   * @param {string} operationId - Operation identifier
   * @returns {Object|null} Error state or null
   */
  getErrorState(operationId) {
    if (this.optimizationFlags.enableFastPath) {
      return this.errorStateManager.getState(operationId);
    }
    return null;
  }

  /**
   * Remove error state to free memory
   * @param {string} operationId - Operation identifier
   */
  clearErrorState(operationId) {
    if (this.optimizationFlags.enableFastPath) {
      this.errorStateManager.removeState(operationId);
    }
  }

  /**
   * Check if operation has active error state (fastest check)
   * @param {string} operationId - Operation identifier
   * @returns {boolean} Whether error state exists
   */
  hasErrorState(operationId) {
    if (this.optimizationFlags.enableFastPath) {
      return this.errorStateManager.hasState(operationId);
    }
    return false;
  }

  /**
   * Optimize retry logic with intelligent delay calculation
   * @param {string} operationId - Operation identifier
   * @param {number} attemptCount - Current attempt count
   * @param {string} errorType - Error type
   * @param {number} totalElapsedMs - Total elapsed time
   * @returns {Object} Optimized retry decision
   */
  optimizeRetryLogic(operationId, attemptCount, errorType, totalElapsedMs = 0) {
    const startTime = performance.now();
    
    try {
      // Check if we have cached retry decision for this operation
      const existingState = this.getErrorState(operationId);
      if (existingState && existingState.lastAttempt === attemptCount - 1) {
        // Use cached calculation if available and recent
        const timeSinceLastCalculation = Date.now() - existingState.timestamp;
        if (timeSinceLastCalculation < 1000) { // 1 second cache
          return existingState.retryDecision;
        }
      }

      // Calculate optimized retry decision
      const retryDecision = this.optimizeRetryDelay(attemptCount, errorType, totalElapsedMs);
      
      // Cache the decision for potential reuse
      this.setErrorState(operationId, {
        lastAttempt: attemptCount,
        retryDecision,
        timestamp: Date.now()
      });

      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('retryOptimization', duration, {
        operationId,
        attemptCount,
        errorType,
        cached: false
      });

      return retryDecision;
    } catch (optimizationError) {
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('retryOptimization', duration, {
        error: true,
        errorMessage: optimizationError.message
      });
      
      // Fallback to basic retry logic
      return this.optimizeRetryDelay(attemptCount, errorType, totalElapsedMs);
    }
  }

  /**
   * Get comprehensive performance metrics for monitoring
   * @returns {Object} Performance metrics
   */
  getDetailedPerformanceMetrics() {
    const baseStats = this.getPerformanceStats();
    
    return {
      ...baseStats,
      errorStateManager: this.errorStateManager.getStats(),
      optimizationFlags: { ...this.optimizationFlags },
      performanceBreakdown: {
        fastPathHitRate: this.calculateFastPathHitRate(),
        cacheEfficiency: this.calculateCacheEfficiency(),
        averageProcessingTime: this.calculateAverageProcessingTime(),
        memoryEfficiency: this.calculateMemoryEfficiency()
      },
      recommendations: this.generatePerformanceRecommendations()
    };
  }

  /**
   * Calculate fast path hit rate for performance monitoring
   * @returns {number} Fast path hit rate percentage
   */
  calculateFastPathHitRate() {
    const classificationStats = this.performanceMonitor.getStats('errorClassificationTime');
    if (!classificationStats || classificationStats.count === 0) return 0;

    const fastPathCount = classificationStats.recent?.filter(m => 
      m.metadata?.fastPath === true
    ).length || 0;

    return (fastPathCount / Math.min(classificationStats.count, 10)) * 100;
  }

  /**
   * Calculate cache efficiency
   * @returns {number} Cache efficiency percentage
   */
  calculateCacheEfficiency() {
    const cacheStats = this.errorPatternCache.getStats();
    return parseFloat(cacheStats.hitRate) || 0;
  }

  /**
   * Calculate average processing time
   * @returns {number} Average processing time in milliseconds
   */
  calculateAverageProcessingTime() {
    const stats = this.performanceMonitor.getStats('errorHandlingTime');
    return stats?.average || 0;
  }

  /**
   * Calculate memory efficiency
   * @returns {Object} Memory efficiency metrics
   */
  calculateMemoryEfficiency() {
    const memoryStats = this.performanceMonitor.getStats('memoryUsage');
    const cacheSize = this.errorPatternCache.cache.size;
    const stateManagerSize = this.errorStateManager.errorStates.size;
    
    return {
      cacheMemoryUsage: cacheSize,
      stateManagerMemoryUsage: stateManagerSize,
      totalManagedObjects: cacheSize + stateManagerSize,
      averageMemoryUsage: memoryStats?.average || 0
    };
  }

  /**
   * Generate performance recommendations based on metrics
   * @returns {Array} Array of performance recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];
    const metrics = this.getPerformanceStats();
    
    // Check cache efficiency
    const cacheEfficiency = this.calculateCacheEfficiency();
    if (cacheEfficiency < 50) {
      recommendations.push({
        type: 'CACHE_EFFICIENCY',
        severity: 'medium',
        message: `Cache hit rate is low (${cacheEfficiency.toFixed(1)}%). Consider adjusting cache TTL or size.`,
        action: 'Increase cache size or adjust TTL settings'
      });
    }

    // Check processing time
    const avgProcessingTime = this.calculateAverageProcessingTime();
    if (avgProcessingTime > PERFORMANCE_THRESHOLDS.ERROR_HANDLING_MAX_MS) {
      recommendations.push({
        type: 'PROCESSING_TIME',
        severity: 'high',
        message: `Average error handling time (${avgProcessingTime.toFixed(2)}ms) exceeds threshold.`,
        action: 'Enable fast path optimization or reduce error handling complexity'
      });
    }

    // Check memory usage
    const memoryEfficiency = this.calculateMemoryEfficiency();
    if (memoryEfficiency.totalManagedObjects > 500) {
      recommendations.push({
        type: 'MEMORY_USAGE',
        severity: 'medium',
        message: `High number of managed objects (${memoryEfficiency.totalManagedObjects}).`,
        action: 'Enable lazy cleanup or reduce cache size'
      });
    }

    // Check fast path usage
    const fastPathHitRate = this.calculateFastPathHitRate();
    if (fastPathHitRate < 30 && this.optimizationFlags.enableFastPath) {
      recommendations.push({
        type: 'FAST_PATH',
        severity: 'low',
        message: `Fast path hit rate is low (${fastPathHitRate.toFixed(1)}%).`,
        action: 'Review fast path patterns or add more common error patterns'
      });
    }

    return recommendations;
  }

  /**
   * Apply performance optimizations based on current metrics
   */
  autoOptimize() {
    const recommendations = this.generatePerformanceRecommendations();
    
    recommendations.forEach(rec => {
      switch (rec.type) {
        case 'CACHE_EFFICIENCY':
          if (this.calculateCacheEfficiency() < 30) {
            // Increase cache size
            this.errorPatternCache.maxSize = Math.min(this.errorPatternCache.maxSize * 1.5, 2000);
          }
          break;
          
        case 'MEMORY_USAGE':
          if (this.calculateMemoryEfficiency().totalManagedObjects > 1000) {
            // Force cleanup
            this.errorPatternCache.clear();
            this.errorStateManager.cleanup();
          }
          break;
          
        case 'PROCESSING_TIME':
          if (this.calculateAverageProcessingTime() > PERFORMANCE_THRESHOLDS.ERROR_HANDLING_MAX_MS * 2) {
            // Disable some optimizations to reduce overhead
            this.optimizationFlags.enableBatching = false;
          }
          break;
      }
    });
  }

  /**
   * Configure optimization flags for different performance profiles
   * @param {string} profile - Performance profile ('minimal', 'balanced', 'maximum')
   */
  setPerformanceProfile(profile) {
    switch (profile) {
      case 'minimal':
        this.optimizationFlags = {
          enableCaching: false,
          enableBatching: false,
          enableLazyCleanup: true,
          enableFastPath: true
        };
        break;
        
      case 'balanced':
        this.optimizationFlags = {
          enableCaching: true,
          enableBatching: false,
          enableLazyCleanup: true,
          enableFastPath: true
        };
        break;
        
      case 'maximum':
        this.optimizationFlags = {
          enableCaching: true,
          enableBatching: true,
          enableLazyCleanup: true,
          enableFastPath: true
        };
        break;
        
      default:
        // Keep current settings
        break;
    }
  }
}

// Create singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;