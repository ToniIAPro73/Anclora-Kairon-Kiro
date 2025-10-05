/**
 * Supabase Unavailable Handler
 * Handles scenarios when Supabase service is unavailable or in maintenance
 * Provides graceful degradation and automatic retry when service is restored
 */

import { connectionMonitor } from './connectionMonitor.js';
import { authErrorHandler, AUTH_ERROR_TYPES } from './authErrorHandler.js';
import { UserFeedbackSystem } from './userFeedbackSystem.js';
import errorLogger from './errorLogger.js';

/**
 * Service status constants
 */
export const SERVICE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  DEGRADED: 'DEGRADED',
  CHECKING: 'CHECKING'
};

/**
 * SupabaseUnavailableHandler class for handling service unavailability
 */
export class SupabaseUnavailableHandler {
  constructor() {
    this.serviceStatus = SERVICE_STATUS.AVAILABLE;
    this.lastStatusCheck = null;
    this.unavailabilityStartTime = null;
    this.queuedOperations = [];
    this.retryInterval = null;
    this.eventListeners = new Map();
    this.userFeedbackSystem = new UserFeedbackSystem();
    
    // Configuration
    this.config = {
      statusCheckIntervalMs: 60000, // Check every minute when unavailable
      maxQueuedOperations: 50, // Maximum operations to queue
      retryDelayMs: 30000, // Initial retry delay (30 seconds)
      maxRetryDelayMs: 300000, // Maximum retry delay (5 minutes)
      exponentialBackoffMultiplier: 1.5,
      gracefulDegradationEnabled: true
    };

    // Initialize connection monitoring
    this.initializeMonitoring();
  }

  /**
   * Initialize connection monitoring for service availability
   */
  initializeMonitoring() {
    // Listen for connection status changes
    connectionMonitor.onConnectionChange('connectivityCheck', (result) => {
      this.handleConnectivityResult(result);
    });

    connectionMonitor.onConnectionChange('statusChange', (statusChange) => {
      this.handleStatusChange(statusChange);
    });
  }

  /**
   * Handle connectivity check results
   * @param {Object} result - Connectivity check result
   */
  handleConnectivityResult(result) {
    const previousStatus = this.serviceStatus;
    
    if (result.available) {
      // Service is available
      if (this.serviceStatus !== SERVICE_STATUS.AVAILABLE) {
        this.handleServiceRestored();
      }
      this.serviceStatus = SERVICE_STATUS.AVAILABLE;
    } else {
      // Service is unavailable - determine the type
      const errorType = result.healthCheck?.errorType || 'UNKNOWN';
      
      if (errorType === 'SUPABASE_MAINTENANCE') {
        this.serviceStatus = SERVICE_STATUS.MAINTENANCE;
      } else if (errorType === 'SUPABASE_UNAVAILABLE') {
        this.serviceStatus = SERVICE_STATUS.UNAVAILABLE;
      } else {
        this.serviceStatus = SERVICE_STATUS.DEGRADED;
      }

      // Handle service unavailability
      if (previousStatus === SERVICE_STATUS.AVAILABLE) {
        this.handleServiceUnavailable(errorType, result.error);
      }
    }

    this.lastStatusCheck = new Date().toISOString();
    
    // Emit status change event
    this.emitEvent('serviceStatusChange', {
      from: previousStatus,
      to: this.serviceStatus,
      timestamp: this.lastStatusCheck,
      result: result
    });
  }

  /**
   * Handle connection status changes
   * @param {Object} statusChange - Status change event
   */
  handleStatusChange(statusChange) {
    // Additional handling for connection status changes if needed
    console.log('Connection status changed:', statusChange);
  }

  /**
   * Handle service becoming unavailable
   * @param {string} errorType - Type of unavailability
   * @param {Error} error - The error that caused unavailability
   */
  handleServiceUnavailable(errorType, error) {
    this.unavailabilityStartTime = new Date().toISOString();
    
    // Log the service unavailability
    const context = {
      operation: 'service_unavailable',
      errorType: errorType,
      timestamp: this.unavailabilityStartTime,
      serviceStatus: this.serviceStatus
    };

    errorLogger.logError(error || new Error('Supabase service unavailable'), context, errorLogger.SEVERITY_LEVELS.CRITICAL);

    // Show appropriate user feedback
    this.showUnavailabilityMessage(errorType);

    // Start retry monitoring
    this.startRetryMonitoring();

    // Emit service unavailable event
    this.emitEvent('serviceUnavailable', {
      errorType: errorType,
      error: error,
      timestamp: this.unavailabilityStartTime,
      serviceStatus: this.serviceStatus
    });
  }

  /**
   * Handle service being restored
   */
  handleServiceRestored() {
    const unavailabilityDuration = this.unavailabilityStartTime ? 
      Date.now() - new Date(this.unavailabilityStartTime).getTime() : 0;

    // Log service restoration
    const context = {
      operation: 'service_restored',
      unavailabilityDuration: unavailabilityDuration,
      queuedOperationsCount: this.queuedOperations.length,
      timestamp: new Date().toISOString()
    };

    errorLogger.logPerformanceMetric('service_restoration', unavailabilityDuration, true, context);

    // Show restoration message
    this.showRestorationMessage();

    // Process queued operations
    this.processQueuedOperations();

    // Stop retry monitoring
    this.stopRetryMonitoring();

    // Reset unavailability tracking
    this.unavailabilityStartTime = null;

    // Emit service restored event
    this.emitEvent('serviceRestored', {
      unavailabilityDuration: unavailabilityDuration,
      queuedOperationsCount: this.queuedOperations.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Show appropriate unavailability message to user
   * @param {string} errorType - Type of unavailability
   */
  showUnavailabilityMessage(errorType) {
    let message, options;

    if (errorType === 'SUPABASE_MAINTENANCE') {
      message = authErrorHandler.generateUserMessage(AUTH_ERROR_TYPES.SUPABASE_MAINTENANCE);
      options = {
        type: 'warning',
        persistent: true,
        showRetry: false,
        icon: 'maintenance'
      };
    } else {
      message = authErrorHandler.generateUserMessage(AUTH_ERROR_TYPES.SUPABASE_UNAVAILABLE);
      options = {
        type: 'error',
        persistent: true,
        showRetry: true,
        retryCallback: () => this.checkServiceAvailability(),
        icon: 'offline'
      };
    }

    this.userFeedbackSystem.showError(message, options);
  }

  /**
   * Show service restoration message
   */
  showRestorationMessage() {
    const messages = {
      es: "¡Servicio restaurado! Ya puedes continuar con normalidad.",
      en: "Service restored! You can now continue normally."
    };

    const language = authErrorHandler.defaultLanguage || 'es';
    const message = messages[language] || messages.es;

    this.userFeedbackSystem.showSuccess(message, {
      duration: 5000,
      icon: 'check-circle'
    });
  }

  /**
   * Start monitoring for service restoration
   */
  startRetryMonitoring() {
    if (this.retryInterval) {
      return; // Already monitoring
    }

    let retryDelay = this.config.retryDelayMs;

    const scheduleNextCheck = () => {
      this.retryInterval = setTimeout(async () => {
        await this.checkServiceAvailability();
        
        if (this.serviceStatus !== SERVICE_STATUS.AVAILABLE) {
          // Increase delay with exponential backoff
          retryDelay = Math.min(
            retryDelay * this.config.exponentialBackoffMultiplier,
            this.config.maxRetryDelayMs
          );
          scheduleNextCheck();
        }
      }, retryDelay);
    };

    scheduleNextCheck();
  }

  /**
   * Stop retry monitoring
   */
  stopRetryMonitoring() {
    if (this.retryInterval) {
      clearTimeout(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Check service availability manually
   * @returns {Promise<Object>} Service availability result
   */
  async checkServiceAvailability() {
    this.serviceStatus = SERVICE_STATUS.CHECKING;
    
    try {
      const result = await connectionMonitor.checkConnectivity();
      return result;
    } catch (error) {
      console.error('Error checking service availability:', error);
      return {
        available: false,
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Queue an authentication operation for retry when service is restored
   * @param {Function} operation - The operation to queue
   * @param {Object} context - Operation context
   * @returns {Promise} Promise that resolves when operation is executed or rejected
   */
  queueOperation(operation, context = {}) {
    return new Promise((resolve, reject) => {
      if (this.queuedOperations.length >= this.config.maxQueuedOperations) {
        reject(new Error('Operation queue is full. Please try again later.'));
        return;
      }

      const queuedOperation = {
        id: Date.now() + Math.random(),
        operation: operation,
        context: context,
        resolve: resolve,
        reject: reject,
        timestamp: new Date().toISOString()
      };

      this.queuedOperations.push(queuedOperation);

      // Log queued operation
      errorLogger.logError(new Error('Operation queued due to service unavailability'), {
        operation: 'queue_operation',
        operationContext: context,
        queueLength: this.queuedOperations.length,
        timestamp: queuedOperation.timestamp
      }, errorLogger.SEVERITY_LEVELS.MEDIUM);
    });
  }

  /**
   * Process all queued operations when service is restored
   */
  async processQueuedOperations() {
    if (this.queuedOperations.length === 0) {
      return;
    }

    console.log(`Processing ${this.queuedOperations.length} queued operations...`);

    const operations = [...this.queuedOperations];
    this.queuedOperations = [];

    for (const queuedOp of operations) {
      try {
        const result = await queuedOp.operation();
        queuedOp.resolve(result);
      } catch (error) {
        queuedOp.reject(error);
      }
    }

    console.log(`Processed ${operations.length} queued operations`);
  }

  /**
   * Check if service is currently available
   * @returns {boolean} Service availability status
   */
  isServiceAvailable() {
    return this.serviceStatus === SERVICE_STATUS.AVAILABLE;
  }

  /**
   * Check if graceful degradation is possible for an operation
   * @param {string} operationType - Type of operation
   * @returns {boolean} Whether graceful degradation is possible
   */
  canDegrade(operationType) {
    if (!this.config.gracefulDegradationEnabled) {
      return false;
    }

    // Define operations that can be degraded
    const degradableOperations = [
      'profile_update',
      'preferences_save',
      'non_critical_data_sync'
    ];

    return degradableOperations.includes(operationType);
  }

  /**
   * Get current service status information
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    return {
      status: this.serviceStatus,
      lastStatusCheck: this.lastStatusCheck,
      unavailabilityStartTime: this.unavailabilityStartTime,
      queuedOperationsCount: this.queuedOperations.length,
      isRetryMonitoring: !!this.retryInterval,
      config: { ...this.config }
    };
  }

  /**
   * Add event listener for service status events
   * @param {string} eventType - Event type
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType).add(callback);

    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Emit event to all registered listeners
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   */
  emitEvent(eventType, eventData) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Error in service status event listener:`, error);
        }
      });
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all queued operations
   */
  clearQueue() {
    const clearedCount = this.queuedOperations.length;
    
    // Reject all queued operations
    this.queuedOperations.forEach(queuedOp => {
      queuedOp.reject(new Error('Operation cancelled due to queue clear'));
    });
    
    this.queuedOperations = [];
    
    console.log(`Cleared ${clearedCount} queued operations`);
    return clearedCount;
  }
}

// Create singleton instance
export const supabaseUnavailableHandler = new SupabaseUnavailableHandler();
export default supabaseUnavailableHandler;