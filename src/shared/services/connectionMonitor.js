/**
 * Connection Monitor
 * Monitors connectivity with Supabase and provides connection status information
 * Supports health checks, latency monitoring, and connection status events
 */

import { supabase } from '../config/supabase.js';
import { authErrorHandler, AUTH_ERROR_TYPES } from './authErrorHandler.js';

/**
 * Connection status constants
 */
export const CONNECTION_STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CHECKING: 'CHECKING',
  UNKNOWN: 'UNKNOWN'
};

/**
 * ConnectionMonitor class for monitoring Supabase connectivity
 */
export class ConnectionMonitor {
  constructor() {
    this.status = CONNECTION_STATUS.UNKNOWN;
    this.latency = null;
    this.lastCheck = null;
    this.isSupabaseEnabled = !!supabase;
    this.eventListeners = new Map();
    this.checkInterval = null;
    this.isMonitoring = false;
    
    // Configuration
    this.config = {
      checkIntervalMs: 30000, // Check every 30 seconds
      timeoutMs: 10000, // 10 second timeout for health checks
      maxLatencyMs: 5000, // Consider connection slow if > 5 seconds
      retryAttempts: 3 // Number of retry attempts for health checks
    };
  }

  /**
   * Start monitoring connection status
   * @param {Object} options - Monitoring options
   */
  startMonitoring(options = {}) {
    if (this.isMonitoring) {
      console.warn('Connection monitoring is already active');
      return;
    }

    // Update configuration with provided options
    this.config = { ...this.config, ...options };
    
    this.isMonitoring = true;
    
    // Perform initial connectivity check
    this.checkConnectivity();
    
    // Set up periodic monitoring
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, this.config.checkIntervalMs);

    console.log('Connection monitoring started');
  }

  /**
   * Stop monitoring connection status
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('Connection monitoring stopped');
  }

  /**
   * Check if Supabase is available with health check
   * @param {Object} options - Check options
   * @returns {Promise<Object>} Health check result
   */
  async isSupabaseAvailable(options = {}) {
    const timeout = options.timeout || this.config.timeoutMs;
    const retryAttempts = options.retryAttempts || this.config.retryAttempts;
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const result = await this.performHealthCheck(timeout);
        
        if (result.available) {
          return {
            available: true,
            latency: result.latency,
            timestamp: new Date().toISOString(),
            attempt: attempt,
            supabaseEnabled: this.isSupabaseEnabled
          };
        }
        
        lastError = result.error;
        
        // Wait before retry (exponential backoff)
        if (attempt < retryAttempts) {
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
        
      } catch (error) {
        lastError = error;
        
        // Wait before retry
        if (attempt < retryAttempts) {
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    return {
      available: false,
      error: lastError,
      timestamp: new Date().toISOString(),
      attempts: retryAttempts,
      supabaseEnabled: this.isSupabaseEnabled
    };
  }

  /**
   * Perform a single health check
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Health check result
   */
  async performHealthCheck(timeout) {
    const startTime = Date.now();
    
    try {
      if (!this.isSupabaseEnabled) {
        // For mock mode, simulate a health check
        await this.delay(100); // Simulate network delay
        const latency = Date.now() - startTime;
        
        return {
          available: true,
          latency: latency,
          mockMode: true
        };
      }

      // Create a promise that will timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Health check timeout after ${timeout}ms`));
        }, timeout);
      });

      // Perform actual health check by trying to get session
      const healthCheckPromise = supabase.auth.getSession();

      // Race between health check and timeout
      const { data, error } = await Promise.race([
        healthCheckPromise,
        timeoutPromise
      ]);

      const latency = Date.now() - startTime;

      if (error) {
        return {
          available: false,
          latency: latency,
          error: error
        };
      }

      return {
        available: true,
        latency: latency,
        sessionExists: !!data.session
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        available: false,
        latency: latency,
        error: error
      };
    }
  }

  /**
   * Get connection latency to Supabase
   * @param {Object} options - Latency check options
   * @returns {Promise<Object>} Latency measurement result
   */
  async getConnectionLatency(options = {}) {
    const samples = options.samples || 3;
    const timeout = options.timeout || this.config.timeoutMs;
    const latencies = [];
    const errors = [];

    for (let i = 0; i < samples; i++) {
      try {
        const result = await this.measureLatency(timeout);
        
        if (result.success) {
          latencies.push(result.latency);
        } else {
          errors.push(result.error);
        }

        // Small delay between samples
        if (i < samples - 1) {
          await this.delay(100);
        }
        
      } catch (error) {
        errors.push(error);
      }
    }

    if (latencies.length === 0) {
      return {
        success: false,
        error: errors[0] || new Error('All latency measurements failed'),
        samples: samples,
        timestamp: new Date().toISOString()
      };
    }

    // Calculate statistics
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    return {
      success: true,
      latency: {
        average: Math.round(avgLatency),
        minimum: minLatency,
        maximum: maxLatency,
        samples: latencies
      },
      quality: this.assessConnectionQuality(avgLatency),
      timestamp: new Date().toISOString(),
      successfulSamples: latencies.length,
      totalSamples: samples,
      errors: errors
    };
  }

  /**
   * Measure single latency sample
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Single latency measurement
   */
  async measureLatency(timeout) {
    const startTime = Date.now();

    try {
      if (!this.isSupabaseEnabled) {
        // Mock latency measurement
        await this.delay(50 + Math.random() * 100); // 50-150ms random latency
        const latency = Date.now() - startTime;
        
        return {
          success: true,
          latency: latency,
          mockMode: true
        };
      }

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Latency measurement timeout after ${timeout}ms`));
        }, timeout);
      });

      // Use a lightweight operation for latency measurement
      const latencyPromise = supabase.auth.getSession();

      // Race between measurement and timeout
      await Promise.race([latencyPromise, timeoutPromise]);
      
      const latency = Date.now() - startTime;

      return {
        success: true,
        latency: latency
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        success: false,
        latency: latency,
        error: error
      };
    }
  }

  /**
   * Assess connection quality based on latency
   * @param {number} latency - Latency in milliseconds
   * @returns {string} Connection quality assessment
   */
  assessConnectionQuality(latency) {
    if (latency < 100) {
      return 'excellent';
    } else if (latency < 300) {
      return 'good';
    } else if (latency < 1000) {
      return 'fair';
    } else if (latency < this.config.maxLatencyMs) {
      return 'poor';
    } else {
      return 'very_poor';
    }
  }

  /**
   * Perform comprehensive connectivity check and update status
   * @returns {Promise<Object>} Connectivity check result
   */
  async checkConnectivity() {
    const previousStatus = this.status;
    this.status = CONNECTION_STATUS.CHECKING;
    
    // Emit status change event
    this.emitEvent('statusChange', {
      from: previousStatus,
      to: this.status,
      timestamp: new Date().toISOString()
    });

    try {
      const healthResult = await this.isSupabaseAvailable();
      const latencyResult = await this.getConnectionLatency({ samples: 1 });

      const newStatus = healthResult.available ? 
        CONNECTION_STATUS.CONNECTED : 
        CONNECTION_STATUS.DISCONNECTED;

      // Update internal state
      this.status = newStatus;
      this.latency = latencyResult.success ? latencyResult.latency.average : null;
      this.lastCheck = new Date().toISOString();

      const result = {
        status: newStatus,
        available: healthResult.available,
        latency: this.latency,
        quality: latencyResult.success ? latencyResult.quality : null,
        timestamp: this.lastCheck,
        healthCheck: healthResult,
        latencyCheck: latencyResult
      };

      // Emit status change event if status changed
      if (previousStatus !== newStatus) {
        this.emitEvent('statusChange', {
          from: previousStatus,
          to: newStatus,
          timestamp: this.lastCheck,
          result: result
        });
      }

      // Emit connectivity event
      this.emitEvent('connectivityCheck', result);

      return result;

    } catch (error) {
      this.status = CONNECTION_STATUS.DISCONNECTED;
      this.latency = null;
      this.lastCheck = new Date().toISOString();

      const result = {
        status: this.status,
        available: false,
        error: error,
        timestamp: this.lastCheck
      };

      // Emit status change event if status changed
      if (previousStatus !== this.status) {
        this.emitEvent('statusChange', {
          from: previousStatus,
          to: this.status,
          timestamp: this.lastCheck,
          error: error
        });
      }

      // Emit connectivity event
      this.emitEvent('connectivityCheck', result);

      return result;
    }
  }

  /**
   * Add event listener for connection status changes
   * @param {string} eventType - Event type ('statusChange', 'connectivityCheck')
   * @param {Function} callback - Event callback function
   * @returns {Function} Unsubscribe function
   */
  onConnectionChange(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType).add(callback);

    // Return unsubscribe function
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
          console.error(`Error in connection monitor event listener:`, error);
        }
      });
    }
  }

  /**
   * Get current connection status
   * @returns {Object} Current connection status information
   */
  getStatus() {
    return {
      status: this.status,
      latency: this.latency,
      quality: this.latency ? this.assessConnectionQuality(this.latency) : null,
      lastCheck: this.lastCheck,
      isMonitoring: this.isMonitoring,
      supabaseEnabled: this.isSupabaseEnabled
    };
  }

  /**
   * Update monitoring configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if it's active and interval changed
    if (this.isMonitoring && newConfig.checkIntervalMs) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Utility method to create a delay
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getStatistics() {
    return {
      status: this.status,
      latency: this.latency,
      quality: this.latency ? this.assessConnectionQuality(this.latency) : null,
      lastCheck: this.lastCheck,
      isMonitoring: this.isMonitoring,
      supabaseEnabled: this.isSupabaseEnabled,
      config: { ...this.config },
      eventListenerCount: Array.from(this.eventListeners.values())
        .reduce((total, listeners) => total + listeners.size, 0)
    };
  }
}

// Create singleton instance
export const connectionMonitor = new ConnectionMonitor();
export default connectionMonitor;