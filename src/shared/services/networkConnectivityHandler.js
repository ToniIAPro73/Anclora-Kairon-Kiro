/**
 * Network Connectivity Handler
 * Handles network connectivity issues, offline detection, and operation queuing
 * Provides offline indicators and automatic retry when connection is restored
 */

import { authErrorHandler, AUTH_ERROR_TYPES } from './authErrorHandler.js';
import { UserFeedbackSystem } from './userFeedbackSystem.js';
import errorLogger from './errorLogger.js';

/**
 * Network status constants
 */
export const NETWORK_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  CHECKING: 'CHECKING',
  SLOW: 'SLOW',
  UNKNOWN: 'UNKNOWN'
};

/**
 * NetworkConnectivityHandler class for handling network connectivity issues
 */
export class NetworkConnectivityHandler {
  constructor() {
    this.networkStatus = NETWORK_STATUS.UNKNOWN;
    this.isOnline = navigator.onLine;
    this.lastConnectivityCheck = null;
    this.offlineStartTime = null;
    this.queuedOperations = [];
    this.connectivityCheckInterval = null;
    this.eventListeners = new Map();
    this.offlineIndicators = new Set();
    this.userFeedbackSystem = new UserFeedbackSystem();
    
    // Configuration
    this.config = {
      connectivityCheckIntervalMs: 10000, // Check every 10 seconds when offline
      maxQueuedOperations: 100, // Maximum operations to queue
      retryDelayMs: 5000, // Initial retry delay (5 seconds)
      maxRetryDelayMs: 60000, // Maximum retry delay (1 minute)
      exponentialBackoffMultiplier: 1.5,
      slowConnectionThresholdMs: 3000, // Consider connection slow if > 3 seconds
      connectivityTestUrl: 'https://httpbin.org/get', // Fallback connectivity test
      connectivityTestTimeout: 5000 // Timeout for connectivity tests
    };

    // Initialize network monitoring
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network connectivity monitoring
   */
  initializeNetworkMonitoring() {
    // Listen for browser online/offline events
    window.addEventListener('online', () => {
      this.handleNetworkOnline();
    });

    window.addEventListener('offline', () => {
      this.handleNetworkOffline();
    });

    // Initial status check
    this.checkNetworkConnectivity();

    // Set up periodic connectivity checks
    this.startConnectivityMonitoring();
  }

  /**
   * Handle network coming online
   */
  handleNetworkOnline() {
    const previousStatus = this.networkStatus;
    this.isOnline = true;
    
    // Verify actual connectivity with a test request
    this.verifyConnectivity().then(isActuallyOnline => {
      if (isActuallyOnline) {
        this.networkStatus = NETWORK_STATUS.ONLINE;
        
        if (previousStatus === NETWORK_STATUS.OFFLINE) {
          this.handleConnectivityRestored();
        }
        
        this.emitEvent('networkStatusChange', {
          from: previousStatus,
          to: this.networkStatus,
          timestamp: new Date().toISOString(),
          isOnline: true
        });
      }
    });
  }

  /**
   * Handle network going offline
   */
  handleNetworkOffline() {
    const previousStatus = this.networkStatus;
    this.isOnline = false;
    this.networkStatus = NETWORK_STATUS.OFFLINE;
    
    if (previousStatus !== NETWORK_STATUS.OFFLINE) {
      this.handleConnectivityLost();
    }
    
    this.emitEvent('networkStatusChange', {
      from: previousStatus,
      to: this.networkStatus,
      timestamp: new Date().toISOString(),
      isOnline: false
    });
  }

  /**
   * Handle connectivity being lost
   */
  handleConnectivityLost() {
    this.offlineStartTime = new Date().toISOString();
    
    // Log the connectivity loss
    const context = {
      operation: 'connectivity_lost',
      timestamp: this.offlineStartTime,
      networkStatus: this.networkStatus,
      queuedOperationsCount: this.queuedOperations.length
    };

    errorLogger.logError(new Error('Network connectivity lost'), context, errorLogger.SEVERITY_LEVELS.HIGH);

    // Show offline indicator
    this.showOfflineIndicator();

    // Start enhanced connectivity monitoring
    this.startOfflineMonitoring();

    // Emit connectivity lost event
    this.emitEvent('connectivityLost', {
      timestamp: this.offlineStartTime,
      queuedOperationsCount: this.queuedOperations.length
    });
  }

  /**
   * Handle connectivity being restored
   */
  handleConnectivityRestored() {
    const offlineDuration = this.offlineStartTime ? 
      Date.now() - new Date(this.offlineStartTime).getTime() : 0;

    // Log connectivity restoration
    const context = {
      operation: 'connectivity_restored',
      offlineDuration: offlineDuration,
      queuedOperationsCount: this.queuedOperations.length,
      timestamp: new Date().toISOString()
    };

    errorLogger.logPerformanceMetric('connectivity_restoration', offlineDuration, true, context);

    // Show restoration message
    this.showConnectivityRestoredMessage();

    // Hide offline indicators
    this.hideOfflineIndicators();

    // Process queued operations
    this.processQueuedOperations();

    // Stop offline monitoring
    this.stopOfflineMonitoring();

    // Reset offline tracking
    this.offlineStartTime = null;

    // Emit connectivity restored event
    this.emitEvent('connectivityRestored', {
      offlineDuration: offlineDuration,
      queuedOperationsCount: this.queuedOperations.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check network connectivity with actual network request
   * @returns {Promise<Object>} Connectivity check result
   */
  async checkNetworkConnectivity() {
    const startTime = Date.now();
    this.networkStatus = NETWORK_STATUS.CHECKING;
    
    try {
      const isConnected = await this.verifyConnectivity();
      const latency = Date.now() - startTime;
      
      if (isConnected) {
        this.networkStatus = latency > this.config.slowConnectionThresholdMs ? 
          NETWORK_STATUS.SLOW : NETWORK_STATUS.ONLINE;
        this.isOnline = true;
      } else {
        this.networkStatus = NETWORK_STATUS.OFFLINE;
        this.isOnline = false;
      }

      this.lastConnectivityCheck = new Date().toISOString();

      const result = {
        isOnline: isConnected,
        status: this.networkStatus,
        latency: latency,
        timestamp: this.lastConnectivityCheck,
        browserOnline: navigator.onLine
      };

      // Emit connectivity check event
      this.emitEvent('connectivityCheck', result);

      return result;

    } catch (error) {
      this.networkStatus = NETWORK_STATUS.OFFLINE;
      this.isOnline = false;
      this.lastConnectivityCheck = new Date().toISOString();

      const result = {
        isOnline: false,
        status: this.networkStatus,
        error: error,
        timestamp: this.lastConnectivityCheck,
        browserOnline: navigator.onLine
      };

      this.emitEvent('connectivityCheck', result);
      return result;
    }
  }

  /**
   * Verify actual connectivity with a network request
   * @returns {Promise<boolean>} True if connected, false otherwise
   */
  async verifyConnectivity() {
    try {
      // Use fetch with a timeout to test connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.connectivityTestTimeout);

      const response = await fetch(this.config.connectivityTestUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;

    } catch (error) {
      // If the main test fails, try a simpler test
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Try to fetch a small resource
        await fetch('data:text/plain,test', {
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return navigator.onLine; // Fall back to browser's online status

      } catch (fallbackError) {
        return false;
      }
    }
  }

  /**
   * Start connectivity monitoring when offline
   */
  startOfflineMonitoring() {
    if (this.connectivityCheckInterval) {
      return; // Already monitoring
    }

    let checkDelay = this.config.retryDelayMs;

    const scheduleNextCheck = () => {
      this.connectivityCheckInterval = setTimeout(async () => {
        const result = await this.checkNetworkConnectivity();
        
        if (result.isOnline) {
          // Connectivity restored
          this.handleConnectivityRestored();
        } else {
          // Still offline, increase delay with exponential backoff
          checkDelay = Math.min(
            checkDelay * this.config.exponentialBackoffMultiplier,
            this.config.maxRetryDelayMs
          );
          scheduleNextCheck();
        }
      }, checkDelay);
    };

    scheduleNextCheck();
  }

  /**
   * Stop offline monitoring
   */
  stopOfflineMonitoring() {
    if (this.connectivityCheckInterval) {
      clearTimeout(this.connectivityCheckInterval);
      this.connectivityCheckInterval = null;
    }
  }

  /**
   * Start regular connectivity monitoring
   */
  startConnectivityMonitoring() {
    // Check connectivity every 30 seconds when online
    setInterval(() => {
      if (this.networkStatus === NETWORK_STATUS.ONLINE || this.networkStatus === NETWORK_STATUS.SLOW) {
        this.checkNetworkConnectivity();
      }
    }, 30000);
  }

  /**
   * Queue an operation for retry when connectivity is restored
   * @param {Function} operation - The operation to queue
   * @param {Object} context - Operation context
   * @returns {Promise} Promise that resolves when operation is executed or rejected
   */
  queueOperation(operation, context = {}) {
    return new Promise((resolve, reject) => {
      if (this.queuedOperations.length >= this.config.maxQueuedOperations) {
        reject(new Error('Network operation queue is full. Please try again when connection is restored.'));
        return;
      }

      const queuedOperation = {
        id: Date.now() + Math.random(),
        operation: operation,
        context: context,
        resolve: resolve,
        reject: reject,
        timestamp: new Date().toISOString(),
        type: 'network_operation'
      };

      this.queuedOperations.push(queuedOperation);

      // Log queued operation
      errorLogger.logError(new Error('Operation queued due to network connectivity issues'), {
        operation: 'queue_network_operation',
        operationContext: context,
        queueLength: this.queuedOperations.length,
        timestamp: queuedOperation.timestamp
      }, errorLogger.SEVERITY_LEVELS.MEDIUM);

      // Show queued operation feedback
      this.showOperationQueuedMessage(context);
    });
  }

  /**
   * Process all queued operations when connectivity is restored
   */
  async processQueuedOperations() {
    if (this.queuedOperations.length === 0) {
      return;
    }

    console.log(`Processing ${this.queuedOperations.length} queued network operations...`);

    const operations = [...this.queuedOperations];
    this.queuedOperations = [];

    let successCount = 0;
    let failureCount = 0;

    for (const queuedOp of operations) {
      try {
        const result = await queuedOp.operation();
        queuedOp.resolve(result);
        successCount++;
      } catch (error) {
        queuedOp.reject(error);
        failureCount++;
      }
    }

    console.log(`Processed ${operations.length} queued operations: ${successCount} successful, ${failureCount} failed`);

    // Show processing result
    this.showQueueProcessingResult(successCount, failureCount);
  }

  /**
   * Show offline indicator in UI
   */
  showOfflineIndicator() {
    const message = authErrorHandler.generateUserMessage(AUTH_ERROR_TYPES.NETWORK_ERROR);
    
    this.userFeedbackSystem.showError(message, {
      type: 'warning',
      persistent: true,
      showRetry: true,
      retryCallback: () => this.checkNetworkConnectivity(),
      icon: 'wifi-off',
      className: 'offline-indicator'
    });

    // Add offline indicator to page elements
    this.addOfflineIndicatorToElements();
  }

  /**
   * Add offline indicators to page elements
   */
  addOfflineIndicatorToElements() {
    // Add offline class to body
    document.body.classList.add('network-offline');

    // Create offline banner if it doesn't exist
    let offlineBanner = document.getElementById('network-offline-banner');
    if (!offlineBanner) {
      offlineBanner = document.createElement('div');
      offlineBanner.id = 'network-offline-banner';
      offlineBanner.className = 'network-offline-banner';
      offlineBanner.innerHTML = `
        <div class="offline-banner-content">
          <span class="offline-icon">📶</span>
          <span class="offline-text">Sin conexión a internet</span>
          <button class="offline-retry-btn" onclick="window.networkConnectivityHandler?.checkNetworkConnectivity()">
            Reintentar
          </button>
        </div>
      `;
      
      document.body.insertBefore(offlineBanner, document.body.firstChild);
      this.offlineIndicators.add(offlineBanner);
    }

    // Add offline indicators to form elements
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (!form.querySelector('.offline-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'offline-overlay';
        overlay.innerHTML = `
          <div class="offline-overlay-content">
            <span>Sin conexión</span>
          </div>
        `;
        form.style.position = 'relative';
        form.appendChild(overlay);
        this.offlineIndicators.add(overlay);
      }
    });
  }

  /**
   * Hide all offline indicators
   */
  hideOfflineIndicators() {
    // Remove offline class from body
    document.body.classList.remove('network-offline');

    // Remove all offline indicators
    this.offlineIndicators.forEach(indicator => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    });
    this.offlineIndicators.clear();

    // Hide user feedback system offline messages
    this.userFeedbackSystem.hideError();
  }

  /**
   * Show connectivity restored message
   */
  showConnectivityRestoredMessage() {
    const messages = {
      es: "¡Conexión restaurada! Las operaciones pendientes se están procesando.",
      en: "Connection restored! Pending operations are being processed."
    };

    const language = authErrorHandler.defaultLanguage || 'es';
    const message = messages[language] || messages.es;

    this.userFeedbackSystem.showSuccess(message, {
      duration: 5000,
      icon: 'wifi'
    });
  }

  /**
   * Show operation queued message
   * @param {Object} context - Operation context
   */
  showOperationQueuedMessage(context) {
    const messages = {
      es: `Operación "${context.operation || 'desconocida'}" agregada a la cola. Se ejecutará cuando se restaure la conexión.`,
      en: `Operation "${context.operation || 'unknown'}" queued. Will execute when connection is restored.`
    };

    const language = context.language || authErrorHandler.defaultLanguage || 'es';
    const message = messages[language] || messages.es;

    this.userFeedbackSystem.showInfo(message, {
      duration: 3000,
      icon: 'clock'
    });
  }

  /**
   * Show queue processing result
   * @param {number} successCount - Number of successful operations
   * @param {number} failureCount - Number of failed operations
   */
  showQueueProcessingResult(successCount, failureCount) {
    const messages = {
      es: {
        success: `${successCount} operaciones completadas exitosamente.`,
        mixed: `${successCount} operaciones exitosas, ${failureCount} fallaron.`,
        failure: `${failureCount} operaciones fallaron. Inténtalo de nuevo.`
      },
      en: {
        success: `${successCount} operations completed successfully.`,
        mixed: `${successCount} operations successful, ${failureCount} failed.`,
        failure: `${failureCount} operations failed. Please try again.`
      }
    };

    const language = authErrorHandler.defaultLanguage || 'es';
    const langMessages = messages[language] || messages.es;

    let message, type;
    if (failureCount === 0) {
      message = langMessages.success;
      type = 'success';
    } else if (successCount > 0) {
      message = langMessages.mixed;
      type = 'warning';
    } else {
      message = langMessages.failure;
      type = 'error';
    }

    if (type === 'success') {
      this.userFeedbackSystem.showSuccess(message, { duration: 4000 });
    } else if (type === 'warning') {
      this.userFeedbackSystem.showWarning(message, { duration: 5000 });
    } else {
      this.userFeedbackSystem.showError(message, { duration: 5000 });
    }
  }

  /**
   * Check if network is currently available
   * @returns {boolean} Network availability status
   */
  isNetworkAvailable() {
    return this.networkStatus === NETWORK_STATUS.ONLINE || this.networkStatus === NETWORK_STATUS.SLOW;
  }

  /**
   * Get current network status information
   * @returns {Object} Network status information
   */
  getNetworkStatus() {
    return {
      status: this.networkStatus,
      isOnline: this.isOnline,
      browserOnline: navigator.onLine,
      lastConnectivityCheck: this.lastConnectivityCheck,
      offlineStartTime: this.offlineStartTime,
      queuedOperationsCount: this.queuedOperations.length,
      isMonitoring: !!this.connectivityCheckInterval,
      config: { ...this.config }
    };
  }

  /**
   * Add event listener for network status events
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
          console.error(`Error in network connectivity event listener:`, error);
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
      queuedOp.reject(new Error('Operation cancelled due to network queue clear'));
    });
    
    this.queuedOperations = [];
    
    console.log(`Cleared ${clearedCount} queued network operations`);
    return clearedCount;
  }

  /**
   * Force connectivity check
   * @returns {Promise<Object>} Connectivity check result
   */
  async forceConnectivityCheck() {
    return await this.checkNetworkConnectivity();
  }
}

// Create singleton instance
export const networkConnectivityHandler = new NetworkConnectivityHandler();
export default networkConnectivityHandler;