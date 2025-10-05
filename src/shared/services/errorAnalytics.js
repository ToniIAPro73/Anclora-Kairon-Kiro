/**
 * Error Analytics and Monitoring System
 * Provides comprehensive error tracking, analytics, and alerting capabilities
 * Monitors error rates, user experience metrics, and performance impact
 */

import performanceOptimizer from './performanceOptimizer.js';
import { AUTH_ERROR_TYPES } from './authErrorHandler.js';

/**
 * Analytics configuration constants
 */
export const ANALYTICS_CONFIG = {
  // Time windows for analysis (in milliseconds)
  TIME_WINDOWS: {
    MINUTE: 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
  },
  
  // Alert thresholds
  ALERT_THRESHOLDS: {
    ERROR_RATE_PERCENT: 10,        // Alert if error rate > 10%
    HIGH_ERROR_RATE_PERCENT: 25,   // High priority if error rate > 25%
    NETWORK_ERROR_RATE_PERCENT: 15, // Network errors > 15%
    RESPONSE_TIME_MS: 5000,        // Alert if avg response time > 5s
    MEMORY_USAGE_MB: 100,          // Alert if memory usage > 100MB
    CONSECUTIVE_FAILURES: 5        // Alert after 5 consecutive failures
  },
  
  // Data retention
  MAX_EVENTS: 10000,               // Maximum events to keep in memory
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Cleanup every 5 minutes
  
  // Sampling
  SAMPLE_RATE: 1.0                 // Sample 100% of events (adjust for high volume)
};

/**
 * Error event data structure
 */
class ErrorEvent {
  constructor(error, context = {}) {
    this.id = this.generateId();
    this.timestamp = Date.now();
    this.errorType = error.type || 'UNKNOWN_ERROR';
    this.operation = context.operation || 'unknown';
    this.message = error.message || '';
    this.userAgent = navigator.userAgent;
    this.url = window.location.href;
    this.userId = context.userId || null;
    this.sessionId = context.sessionId || this.getSessionId();
    this.severity = context.severity || 'medium';
    this.resolved = false;
    this.retryCount = context.attemptCount || 0;
    this.totalElapsedMs = context.totalElapsedMs || 0;
    this.metadata = {
      ...context,
      performanceEntry: this.capturePerformanceEntry()
    };
  }

  generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  capturePerformanceEntry() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        heapUsed: performance.memory.usedJSHeapSize,
        heapTotal: performance.memory.totalJSHeapSize,
        navigationTiming: performance.getEntriesByType ? 
          performance.getEntriesByType('navigation')[0] || null : null
      };
    }
    return null;
  }
}

/**
 * User experience metrics tracker
 */
class UserExperienceTracker {
  constructor() {
    this.metrics = {
      authFlowCompletions: 0,
      authFlowAbandons: 0,
      averageAuthTime: 0,
      errorRecoveryRate: 0,
      userRetryBehavior: new Map(),
      satisfactionScores: []
    };
    this.activeFlows = new Map();
  }

  /**
   * Start tracking an authentication flow
   * @param {string} flowId - Unique flow identifier
   * @param {string} flowType - Type of flow (login, register, oauth)
   * @param {Object} context - Additional context
   */
  startAuthFlow(flowId, flowType, context = {}) {
    this.activeFlows.set(flowId, {
      flowType,
      startTime: Date.now(),
      steps: [],
      errors: [],
      context
    });
  }

  /**
   * Record a step in the authentication flow
   * @param {string} flowId - Flow identifier
   * @param {string} step - Step name
   * @param {Object} data - Step data
   */
  recordFlowStep(flowId, step, data = {}) {
    const flow = this.activeFlows.get(flowId);
    if (flow) {
      flow.steps.push({
        step,
        timestamp: Date.now(),
        data
      });
    }
  }

  /**
   * Record an error in the authentication flow
   * @param {string} flowId - Flow identifier
   * @param {Object} error - Error information
   */
  recordFlowError(flowId, error) {
    const flow = this.activeFlows.get(flowId);
    if (flow) {
      flow.errors.push({
        ...error,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Complete an authentication flow
   * @param {string} flowId - Flow identifier
   * @param {boolean} success - Whether flow completed successfully
   * @param {Object} result - Flow result data
   */
  completeAuthFlow(flowId, success, result = {}) {
    const flow = this.activeFlows.get(flowId);
    if (!flow) return;

    const duration = Date.now() - flow.startTime;
    
    if (success) {
      this.metrics.authFlowCompletions++;
      
      // Update average auth time
      const totalCompletions = this.metrics.authFlowCompletions;
      this.metrics.averageAuthTime = (
        (this.metrics.averageAuthTime * (totalCompletions - 1)) + duration
      ) / totalCompletions;
    } else {
      this.metrics.authFlowAbandons++;
    }

    // Calculate error recovery rate
    const hadErrors = flow.errors.length > 0;
    if (hadErrors && success) {
      // User recovered from errors
      const totalRecoveries = this.getErrorRecoveryCount() + 1;
      const totalErrorFlows = this.getTotalErrorFlows();
      this.metrics.errorRecoveryRate = (totalRecoveries / totalErrorFlows) * 100;
    }

    // Track retry behavior
    if (flow.errors.length > 0) {
      const retryCount = flow.errors.reduce((sum, err) => sum + (err.retryCount || 0), 0);
      const errorType = flow.errors[0]?.errorType || 'UNKNOWN';
      
      if (!this.metrics.userRetryBehavior.has(errorType)) {
        this.metrics.userRetryBehavior.set(errorType, {
          totalRetries: 0,
          successfulRecoveries: 0,
          averageRetries: 0
        });
      }
      
      const retryData = this.metrics.userRetryBehavior.get(errorType);
      retryData.totalRetries += retryCount;
      if (success) {
        retryData.successfulRecoveries++;
      }
      retryData.averageRetries = retryData.totalRetries / (retryData.successfulRecoveries + 1);
    }

    this.activeFlows.delete(flowId);
  }

  /**
   * Record user satisfaction score
   * @param {number} score - Satisfaction score (1-5)
   * @param {Object} context - Context information
   */
  recordSatisfactionScore(score, context = {}) {
    this.metrics.satisfactionScores.push({
      score,
      timestamp: Date.now(),
      context
    });

    // Keep only recent scores (last 1000)
    if (this.metrics.satisfactionScores.length > 1000) {
      this.metrics.satisfactionScores.shift();
    }
  }

  /**
   * Get user experience metrics
   * @returns {Object} UX metrics
   */
  getMetrics() {
    const totalFlows = this.metrics.authFlowCompletions + this.metrics.authFlowAbandons;
    const completionRate = totalFlows > 0 ? (this.metrics.authFlowCompletions / totalFlows) * 100 : 0;
    
    const recentSatisfactionScores = this.metrics.satisfactionScores.slice(-100);
    const averageSatisfaction = recentSatisfactionScores.length > 0 
      ? recentSatisfactionScores.reduce((sum, s) => sum + s.score, 0) / recentSatisfactionScores.length
      : 0;

    return {
      completionRate,
      averageAuthTime: this.metrics.averageAuthTime,
      errorRecoveryRate: this.metrics.errorRecoveryRate,
      averageSatisfaction,
      totalFlows,
      activeFlows: this.activeFlows.size,
      retryBehavior: Object.fromEntries(this.metrics.userRetryBehavior)
    };
  }

  getErrorRecoveryCount() {
    return Array.from(this.metrics.userRetryBehavior.values())
      .reduce((sum, data) => sum + data.successfulRecoveries, 0);
  }

  getTotalErrorFlows() {
    return Array.from(this.metrics.userRetryBehavior.values())
      .reduce((sum, data) => sum + data.successfulRecoveries + 1, 0);
  }
}

/**
 * Alert system for monitoring error conditions
 */
class AlertSystem {
  constructor() {
    this.alerts = [];
    this.alertHandlers = new Map();
    this.suppressedAlerts = new Set();
    this.alertCooldowns = new Map();
  }

  /**
   * Register an alert handler
   * @param {string} alertType - Type of alert
   * @param {Function} handler - Alert handler function
   */
  registerHandler(alertType, handler) {
    if (!this.alertHandlers.has(alertType)) {
      this.alertHandlers.set(alertType, new Set());
    }
    this.alertHandlers.get(alertType).add(handler);
  }

  /**
   * Trigger an alert
   * @param {string} alertType - Type of alert
   * @param {Object} alertData - Alert data
   * @param {string} severity - Alert severity (low, medium, high, critical)
   */
  triggerAlert(alertType, alertData, severity = 'medium') {
    const alertId = `${alertType}_${Date.now()}`;
    
    // Check if alert is suppressed or in cooldown
    if (this.suppressedAlerts.has(alertType)) {
      return;
    }

    const cooldownKey = `${alertType}_${severity}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    const cooldownPeriod = this.getCooldownPeriod(severity);
    
    if (lastAlert && (Date.now() - lastAlert) < cooldownPeriod) {
      return; // Still in cooldown
    }

    const alert = {
      id: alertId,
      type: alertType,
      severity,
      timestamp: Date.now(),
      data: alertData,
      acknowledged: false
    };

    this.alerts.push(alert);
    this.alertCooldowns.set(cooldownKey, Date.now());

    // Trigger handlers
    const handlers = this.alertHandlers.get(alertType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(alert);
        } catch (error) {
          console.error('Error in alert handler:', error);
        }
      });
    }

    // Log the alert
    console.warn(`[ALERT] ${alertType} (${severity}):`, alertData);

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }
  }

  /**
   * Get cooldown period based on severity
   * @param {string} severity - Alert severity
   * @returns {number} Cooldown period in milliseconds
   */
  getCooldownPeriod(severity) {
    const cooldowns = {
      low: 5 * 60 * 1000,      // 5 minutes
      medium: 2 * 60 * 1000,   // 2 minutes
      high: 1 * 60 * 1000,     // 1 minute
      critical: 30 * 1000      // 30 seconds
    };
    return cooldowns[severity] || cooldowns.medium;
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert ID
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Suppress alerts of a specific type
   * @param {string} alertType - Alert type to suppress
   * @param {number} durationMs - Suppression duration in milliseconds
   */
  suppressAlert(alertType, durationMs = 60 * 60 * 1000) {
    this.suppressedAlerts.add(alertType);
    
    setTimeout(() => {
      this.suppressedAlerts.delete(alertType);
    }, durationMs);
  }

  /**
   * Get recent alerts
   * @param {number} limit - Maximum number of alerts to return
   * @returns {Array} Recent alerts
   */
  getRecentAlerts(limit = 50) {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get alert statistics
   * @returns {Object} Alert statistics
   */
  getAlertStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const recentAlerts = this.alerts.filter(a => (now - a.timestamp) < oneHour);
    const dailyAlerts = this.alerts.filter(a => (now - a.timestamp) < oneDay);

    const severityCounts = recentAlerts.reduce((counts, alert) => {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      return counts;
    }, {});

    return {
      totalAlerts: this.alerts.length,
      recentAlerts: recentAlerts.length,
      dailyAlerts: dailyAlerts.length,
      severityCounts,
      suppressedTypes: Array.from(this.suppressedAlerts),
      unacknowledgedCount: this.alerts.filter(a => !a.acknowledged).length
    };
  }
}

/**
 * Main Error Analytics class
 */
export class ErrorAnalytics {
  constructor() {
    this.events = [];
    this.uxTracker = new UserExperienceTracker();
    this.alertSystem = new AlertSystem();
    this.isEnabled = true;
    this.startTime = Date.now();
    
    // Initialize cleanup interval
    this.startCleanupInterval();
    
    // Setup default alert handlers
    this.setupDefaultAlertHandlers();
  }

  /**
   * Record an error event
   * @param {Object} error - Error information
   * @param {Object} context - Additional context
   */
  recordError(error, context = {}) {
    if (!this.isEnabled || Math.random() > ANALYTICS_CONFIG.SAMPLE_RATE) {
      return;
    }

    const errorEvent = new ErrorEvent(error, context);
    this.events.push(errorEvent);

    // Analyze for alerts
    this.analyzeForAlerts(errorEvent);

    // Keep events within limit
    if (this.events.length > ANALYTICS_CONFIG.MAX_EVENTS) {
      this.events.shift();
    }
  }

  /**
   * Analyze error event for alert conditions
   * @param {ErrorEvent} errorEvent - Error event to analyze
   */
  analyzeForAlerts(errorEvent) {
    const now = Date.now();
    
    // Check error rate in last 5 minutes
    const fiveMinutesAgo = now - ANALYTICS_CONFIG.TIME_WINDOWS.FIVE_MINUTES;
    const recentEvents = this.events.filter(e => e.timestamp > fiveMinutesAgo);
    const recentErrors = recentEvents.filter(e => e.errorType !== 'SUCCESS');
    
    if (recentEvents.length > 0) {
      const errorRate = (recentErrors.length / recentEvents.length) * 100;
      
      if (errorRate > ANALYTICS_CONFIG.ALERT_THRESHOLDS.HIGH_ERROR_RATE_PERCENT) {
        this.alertSystem.triggerAlert('HIGH_ERROR_RATE', {
          errorRate: errorRate.toFixed(2),
          totalEvents: recentEvents.length,
          errorCount: recentErrors.length,
          timeWindow: '5 minutes'
        }, 'high');
      } else if (errorRate > ANALYTICS_CONFIG.ALERT_THRESHOLDS.ERROR_RATE_PERCENT) {
        this.alertSystem.triggerAlert('ERROR_RATE_THRESHOLD', {
          errorRate: errorRate.toFixed(2),
          totalEvents: recentEvents.length,
          errorCount: recentErrors.length,
          timeWindow: '5 minutes'
        }, 'medium');
      }
    }

    // Check for consecutive failures
    const recentSameOperation = this.events
      .filter(e => e.operation === errorEvent.operation)
      .slice(-ANALYTICS_CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES);
    
    if (recentSameOperation.length >= ANALYTICS_CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES &&
        recentSameOperation.every(e => e.errorType !== 'SUCCESS')) {
      this.alertSystem.triggerAlert('CONSECUTIVE_FAILURES', {
        operation: errorEvent.operation,
        failureCount: recentSameOperation.length,
        errorTypes: [...new Set(recentSameOperation.map(e => e.errorType))]
      }, 'high');
    }

    // Check network error rate
    const networkErrors = recentErrors.filter(e => e.errorType === AUTH_ERROR_TYPES.NETWORK_ERROR);
    if (recentEvents.length > 0) {
      const networkErrorRate = (networkErrors.length / recentEvents.length) * 100;
      
      if (networkErrorRate > ANALYTICS_CONFIG.ALERT_THRESHOLDS.NETWORK_ERROR_RATE_PERCENT) {
        this.alertSystem.triggerAlert('HIGH_NETWORK_ERROR_RATE', {
          networkErrorRate: networkErrorRate.toFixed(2),
          networkErrorCount: networkErrors.length,
          totalEvents: recentEvents.length
        }, 'high');
      }
    }
  }

  /**
   * Get error rate statistics
   * @param {number} timeWindowMs - Time window in milliseconds
   * @returns {Object} Error rate statistics
   */
  getErrorRateStats(timeWindowMs = ANALYTICS_CONFIG.TIME_WINDOWS.HOUR) {
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    const eventsInWindow = this.events.filter(e => e.timestamp > windowStart);
    
    const totalEvents = eventsInWindow.length;
    const errorEvents = eventsInWindow.filter(e => e.errorType !== 'SUCCESS');
    const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;

    // Group by error type
    const errorsByType = errorEvents.reduce((acc, event) => {
      acc[event.errorType] = (acc[event.errorType] || 0) + 1;
      return acc;
    }, {});

    // Group by operation
    const errorsByOperation = errorEvents.reduce((acc, event) => {
      acc[event.operation] = (acc[event.operation] || 0) + 1;
      return acc;
    }, {});

    return {
      timeWindow: timeWindowMs,
      totalEvents,
      errorEvents: errorEvents.length,
      errorRate: parseFloat(errorRate.toFixed(2)),
      errorsByType,
      errorsByOperation,
      timestamp: now
    };
  }

  /**
   * Get performance impact metrics
   * @returns {Object} Performance impact metrics
   */
  getPerformanceImpact() {
    const performanceStats = performanceOptimizer.getPerformanceStats();
    const errorStats = this.getErrorRateStats();
    
    return {
      errorHandlingOverhead: performanceStats.monitor.errorHandlingTime || {},
      cacheEfficiency: performanceStats.cache || {},
      retryPerformance: performanceStats.monitor.retryExecution || {},
      memoryUsage: performanceStats.monitor.memoryUsage || {},
      errorRate: errorStats.errorRate,
      systemHealth: performanceStats.health || {},
      timestamp: Date.now()
    };
  }

  /**
   * Generate error analytics dashboard data
   * @returns {Object} Dashboard data
   */
  generateDashboard() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    return {
      overview: {
        uptime,
        totalEvents: this.events.length,
        isEnabled: this.isEnabled,
        sampleRate: ANALYTICS_CONFIG.SAMPLE_RATE
      },
      errorRates: {
        lastHour: this.getErrorRateStats(ANALYTICS_CONFIG.TIME_WINDOWS.HOUR),
        lastDay: this.getErrorRateStats(ANALYTICS_CONFIG.TIME_WINDOWS.DAY)
      },
      userExperience: this.uxTracker.getMetrics(),
      performance: this.getPerformanceImpact(),
      alerts: {
        recent: this.alertSystem.getRecentAlerts(10),
        stats: this.alertSystem.getAlertStats()
      },
      timestamp: now
    };
  }

  /**
   * Setup default alert handlers
   */
  setupDefaultAlertHandlers() {
    // Console logging handler
    this.alertSystem.registerHandler('*', (alert) => {
      const emoji = {
        low: '🟡',
        medium: '🟠', 
        high: '🔴',
        critical: '🚨'
      }[alert.severity] || '⚠️';
      
      console.warn(`${emoji} [${alert.type}] ${alert.severity.toUpperCase()}:`, alert.data);
    });

    // Performance degradation handler
    this.alertSystem.registerHandler('HIGH_ERROR_RATE', (alert) => {
      // Could trigger performance optimization measures
      performanceOptimizer.monitorMemoryUsage();
    });
  }

  /**
   * Start cleanup interval to manage memory usage
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, ANALYTICS_CONFIG.CLEANUP_INTERVAL_MS);
  }

  /**
   * Cleanup old events and optimize memory usage
   */
  cleanup() {
    const now = Date.now();
    const retentionPeriod = ANALYTICS_CONFIG.TIME_WINDOWS.DAY * 7; // Keep 7 days
    
    // Remove old events
    this.events = this.events.filter(event => 
      (now - event.timestamp) < retentionPeriod
    );

    // Cleanup alerts
    this.alertSystem.alerts = this.alertSystem.alerts.filter(alert =>
      (now - alert.timestamp) < retentionPeriod
    );

    // Monitor memory usage
    performanceOptimizer.monitorMemoryUsage();
  }

  /**
   * Enable or disable analytics
   * @param {boolean} enabled - Whether to enable analytics
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Export analytics data
   * @param {string} format - Export format ('json', 'csv')
   * @returns {string} Exported data
   */
  exportData(format = 'json') {
    const data = {
      events: this.events,
      dashboard: this.generateDashboard(),
      exportTimestamp: Date.now()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Simple CSV export for events
      const headers = ['timestamp', 'errorType', 'operation', 'message', 'severity'];
      const rows = this.events.map(event => [
        new Date(event.timestamp).toISOString(),
        event.errorType,
        event.operation,
        event.message.replace(/,/g, ';'), // Escape commas
        event.severity
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify(data);
  }

  /**
   * Get UX tracker for external use
   * @returns {UserExperienceTracker} UX tracker instance
   */
  getUXTracker() {
    return this.uxTracker;
  }

  /**
   * Get alert system for external use
   * @returns {AlertSystem} Alert system instance
   */
  getAlertSystem() {
    return this.alertSystem;
  }
}

// Create singleton instance
export const errorAnalytics = new ErrorAnalytics();
export default errorAnalytics;