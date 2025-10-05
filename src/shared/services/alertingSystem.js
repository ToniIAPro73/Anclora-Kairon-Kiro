/**
 * Advanced Alerting System for Error Monitoring
 * Provides real-time alerting, notifications, and escalation for error conditions
 * Supports multiple notification channels and intelligent alert management
 */

import errorAnalytics from './errorAnalytics.js';
import performanceOptimizer from './performanceOptimizer.js';

/**
 * Alert configuration constants
 */
export const ALERT_CONFIG = {
  // Notification channels
  CHANNELS: {
    CONSOLE: 'console',
    BROWSER_NOTIFICATION: 'browser_notification',
    EMAIL: 'email',
    WEBHOOK: 'webhook',
    CUSTOM: 'custom'
  },
  
  // Alert priorities
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  
  // Default thresholds
  THRESHOLDS: {
    ERROR_RATE_WARNING: 5,      // 5% error rate warning
    ERROR_RATE_CRITICAL: 15,    // 15% error rate critical
    RESPONSE_TIME_WARNING: 3000, // 3s response time warning
    RESPONSE_TIME_CRITICAL: 5000, // 5s response time critical
    MEMORY_WARNING: 50,         // 50MB memory warning
    MEMORY_CRITICAL: 100,       // 100MB memory critical
    CONSECUTIVE_FAILURES: 5,    // 5 consecutive failures
    NETWORK_ERROR_RATE: 10      // 10% network error rate
  },
  
  // Escalation settings
  ESCALATION: {
    RETRY_INTERVAL: 5 * 60 * 1000,    // 5 minutes
    MAX_ESCALATIONS: 3,               // Maximum escalation levels
    ESCALATION_MULTIPLIER: 2          // Time multiplier for each escalation
  }
};

/**
 * Notification channel interface
 */
class NotificationChannel {
  constructor(type, config = {}) {
    this.type = type;
    this.config = config;
    this.enabled = config.enabled !== false;
    this.rateLimitMs = config.rateLimitMs || 60000; // 1 minute default
    this.lastNotification = new Map();
  }

  /**
   * Send notification through this channel
   * @param {Object} alert - Alert object
   * @returns {Promise<boolean>} Success status
   */
  async send(alert) {
    if (!this.enabled) {
      return false;
    }

    // Check rate limiting
    const alertKey = `${alert.type}_${alert.priority}`;
    const lastSent = this.lastNotification.get(alertKey);
    const now = Date.now();
    
    if (lastSent && (now - lastSent) < this.rateLimitMs) {
      return false; // Rate limited
    }

    try {
      const success = await this.sendNotification(alert);
      if (success) {
        this.lastNotification.set(alertKey, now);
      }
      return success;
    } catch (error) {
      console.error(`Error sending notification via ${this.type}:`, error);
      return false;
    }
  }

  /**
   * Abstract method to be implemented by specific channels
   * @param {Object} alert - Alert object
   * @returns {Promise<boolean>} Success status
   */
  async sendNotification(alert) {
    throw new Error('sendNotification must be implemented by subclass');
  }
}

/**
 * Console notification channel
 */
class ConsoleNotificationChannel extends NotificationChannel {
  constructor(config = {}) {
    super(ALERT_CONFIG.CHANNELS.CONSOLE, config);
  }

  async sendNotification(alert) {
    const emoji = {
      [ALERT_CONFIG.PRIORITIES.LOW]: '🟡',
      [ALERT_CONFIG.PRIORITIES.MEDIUM]: '🟠',
      [ALERT_CONFIG.PRIORITIES.HIGH]: '🔴',
      [ALERT_CONFIG.PRIORITIES.CRITICAL]: '🚨'
    }[alert.priority] || '⚠️';

    const message = `${emoji} [ALERT] ${alert.type} (${alert.priority.toUpperCase()})`;
    
    switch (alert.priority) {
      case ALERT_CONFIG.PRIORITIES.CRITICAL:
        console.error(message, alert);
        break;
      case ALERT_CONFIG.PRIORITIES.HIGH:
        console.warn(message, alert);
        break;
      default:
        console.log(message, alert);
    }

    return true;
  }
}

/**
 * Browser notification channel
 */
class BrowserNotificationChannel extends NotificationChannel {
  constructor(config = {}) {
    super(ALERT_CONFIG.CHANNELS.BROWSER_NOTIFICATION, config);
    this.permissionRequested = false;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async sendNotification(alert) {
    if (!this.permissionRequested) {
      const hasPermission = await this.requestPermission();
      this.permissionRequested = true;
      
      if (!hasPermission) {
        return false;
      }
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const title = `Anclora Alert: ${alert.type}`;
    const body = this.formatAlertMessage(alert);
    const icon = this.getAlertIcon(alert.priority);

    const notification = new Notification(title, {
      body,
      icon,
      tag: alert.type, // Prevent duplicate notifications
      requireInteraction: alert.priority === ALERT_CONFIG.PRIORITIES.CRITICAL
    });

    // Auto-close after 10 seconds for non-critical alerts
    if (alert.priority !== ALERT_CONFIG.PRIORITIES.CRITICAL) {
      setTimeout(() => notification.close(), 10000);
    }

    return true;
  }

  formatAlertMessage(alert) {
    switch (alert.type) {
      case 'HIGH_ERROR_RATE':
        return `Error rate: ${alert.data.errorRate}% (${alert.data.errorCount} errors)`;
      case 'SLOW_RESPONSE_TIME':
        return `Response time: ${alert.data.averageTime}ms (threshold: ${alert.data.threshold}ms)`;
      case 'HIGH_MEMORY_USAGE':
        return `Memory usage: ${alert.data.memoryUsage}MB (threshold: ${alert.data.threshold}MB)`;
      case 'CONSECUTIVE_FAILURES':
        return `${alert.data.failureCount} consecutive failures in ${alert.data.operation}`;
      default:
        return alert.message || 'System alert triggered';
    }
  }

  getAlertIcon(priority) {
    // Return appropriate icon based on priority
    const icons = {
      [ALERT_CONFIG.PRIORITIES.LOW]: '/icons/alert-low.png',
      [ALERT_CONFIG.PRIORITIES.MEDIUM]: '/icons/alert-medium.png',
      [ALERT_CONFIG.PRIORITIES.HIGH]: '/icons/alert-high.png',
      [ALERT_CONFIG.PRIORITIES.CRITICAL]: '/icons/alert-critical.png'
    };
    
    return icons[priority] || '/icons/alert-default.png';
  }
}

/**
 * Webhook notification channel
 */
class WebhookNotificationChannel extends NotificationChannel {
  constructor(config = {}) {
    super(ALERT_CONFIG.CHANNELS.WEBHOOK, config);
    this.webhookUrl = config.webhookUrl;
    this.headers = config.headers || {};
    this.timeout = config.timeout || 5000;
  }

  async sendNotification(alert) {
    if (!this.webhookUrl) {
      console.error('Webhook URL not configured');
      return false;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      alert: {
        type: alert.type,
        priority: alert.priority,
        message: alert.message,
        data: alert.data
      },
      system: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: alert.timestamp
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Webhook notification failed:', error);
      return false;
    }
  }
}

/**
 * Custom notification channel for user-defined handlers
 */
class CustomNotificationChannel extends NotificationChannel {
  constructor(config = {}) {
    super(ALERT_CONFIG.CHANNELS.CUSTOM, config);
    this.handler = config.handler;
  }

  async sendNotification(alert) {
    if (typeof this.handler !== 'function') {
      console.error('Custom notification handler not provided or not a function');
      return false;
    }

    try {
      const result = await this.handler(alert);
      return result !== false; // Consider undefined/null as success
    } catch (error) {
      console.error('Custom notification handler error:', error);
      return false;
    }
  }
}

/**
 * Alert escalation manager
 */
class AlertEscalationManager {
  constructor() {
    this.escalations = new Map();
    this.escalationTimers = new Map();
  }

  /**
   * Start escalation for an alert
   * @param {Object} alert - Alert object
   * @param {Array} channels - Notification channels
   */
  startEscalation(alert, channels) {
    const escalationKey = `${alert.type}_${alert.priority}`;
    
    // Clear existing escalation if any
    this.clearEscalation(escalationKey);

    const escalationData = {
      alert,
      channels,
      level: 0,
      startTime: Date.now(),
      attempts: []
    };

    this.escalations.set(escalationKey, escalationData);
    this.scheduleNextEscalation(escalationKey);
  }

  /**
   * Schedule next escalation attempt
   * @param {string} escalationKey - Escalation identifier
   */
  scheduleNextEscalation(escalationKey) {
    const escalationData = this.escalations.get(escalationKey);
    if (!escalationData || escalationData.level >= ALERT_CONFIG.ESCALATION.MAX_ESCALATIONS) {
      return;
    }

    const delay = ALERT_CONFIG.ESCALATION.RETRY_INTERVAL * 
                  Math.pow(ALERT_CONFIG.ESCALATION.ESCALATION_MULTIPLIER, escalationData.level);

    const timerId = setTimeout(async () => {
      await this.executeEscalation(escalationKey);
    }, delay);

    this.escalationTimers.set(escalationKey, timerId);
  }

  /**
   * Execute escalation attempt
   * @param {string} escalationKey - Escalation identifier
   */
  async executeEscalation(escalationKey) {
    const escalationData = this.escalations.get(escalationKey);
    if (!escalationData) {
      return;
    }

    escalationData.level++;
    const attempt = {
      level: escalationData.level,
      timestamp: Date.now(),
      results: []
    };

    // Try to send through all channels
    for (const channel of escalationData.channels) {
      try {
        const success = await channel.send(escalationData.alert);
        attempt.results.push({
          channel: channel.type,
          success
        });
      } catch (error) {
        attempt.results.push({
          channel: channel.type,
          success: false,
          error: error.message
        });
      }
    }

    escalationData.attempts.push(attempt);

    // Check if any channel succeeded
    const anySuccess = attempt.results.some(result => result.success);
    
    if (!anySuccess && escalationData.level < ALERT_CONFIG.ESCALATION.MAX_ESCALATIONS) {
      // Schedule next escalation
      this.scheduleNextEscalation(escalationKey);
    } else {
      // Escalation complete (success or max attempts reached)
      this.clearEscalation(escalationKey);
    }
  }

  /**
   * Clear escalation
   * @param {string} escalationKey - Escalation identifier
   */
  clearEscalation(escalationKey) {
    const timerId = this.escalationTimers.get(escalationKey);
    if (timerId) {
      clearTimeout(timerId);
      this.escalationTimers.delete(escalationKey);
    }
    
    this.escalations.delete(escalationKey);
  }

  /**
   * Get escalation status
   * @param {string} escalationKey - Escalation identifier
   * @returns {Object|null} Escalation status
   */
  getEscalationStatus(escalationKey) {
    return this.escalations.get(escalationKey) || null;
  }

  /**
   * Get all active escalations
   * @returns {Array} Active escalations
   */
  getActiveEscalations() {
    return Array.from(this.escalations.entries()).map(([key, data]) => ({
      key,
      ...data
    }));
  }
}

/**
 * Main alerting system class
 */
export class AlertingSystem {
  constructor() {
    this.channels = new Map();
    this.rules = new Map();
    this.escalationManager = new AlertEscalationManager();
    this.isEnabled = true;
    this.alertHistory = [];
    this.maxHistorySize = 1000;
    
    // Initialize default channels
    this.initializeDefaultChannels();
    
    // Initialize default rules
    this.initializeDefaultRules();
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Initialize default notification channels
   */
  initializeDefaultChannels() {
    // Console channel (always enabled)
    this.addChannel(new ConsoleNotificationChannel({
      enabled: true,
      rateLimitMs: 30000 // 30 seconds
    }));

    // Browser notification channel
    this.addChannel(new BrowserNotificationChannel({
      enabled: true,
      rateLimitMs: 60000 // 1 minute
    }));
  }

  /**
   * Initialize default alerting rules
   */
  initializeDefaultRules() {
    // High error rate rule
    this.addRule('high_error_rate', {
      condition: (metrics) => {
        const errorRate = metrics.errorRates?.lastHour?.errorRate || 0;
        return errorRate > ALERT_CONFIG.THRESHOLDS.ERROR_RATE_CRITICAL;
      },
      priority: ALERT_CONFIG.PRIORITIES.HIGH,
      message: 'High error rate detected',
      channels: [ALERT_CONFIG.CHANNELS.CONSOLE, ALERT_CONFIG.CHANNELS.BROWSER_NOTIFICATION],
      escalate: true
    });

    // Performance degradation rule
    this.addRule('performance_degradation', {
      condition: (metrics) => {
        const avgTime = metrics.performance?.performanceBreakdown?.averageProcessingTime || 0;
        return avgTime > ALERT_CONFIG.THRESHOLDS.RESPONSE_TIME_CRITICAL;
      },
      priority: ALERT_CONFIG.PRIORITIES.MEDIUM,
      message: 'Performance degradation detected',
      channels: [ALERT_CONFIG.CHANNELS.CONSOLE],
      escalate: false
    });

    // Memory usage rule
    this.addRule('high_memory_usage', {
      condition: (metrics) => {
        const memoryUsage = metrics.performance?.performanceBreakdown?.memoryEfficiency?.totalManagedObjects || 0;
        return memoryUsage > 500; // High number of managed objects
      },
      priority: ALERT_CONFIG.PRIORITIES.MEDIUM,
      message: 'High memory usage detected',
      channels: [ALERT_CONFIG.CHANNELS.CONSOLE],
      escalate: false
    });

    // System health rule
    this.addRule('system_unhealthy', {
      condition: (metrics) => {
        return !metrics.performance?.health?.healthy;
      },
      priority: ALERT_CONFIG.PRIORITIES.HIGH,
      message: 'System health issues detected',
      channels: [ALERT_CONFIG.CHANNELS.CONSOLE, ALERT_CONFIG.CHANNELS.BROWSER_NOTIFICATION],
      escalate: true
    });
  }

  /**
   * Add notification channel
   * @param {NotificationChannel} channel - Notification channel
   */
  addChannel(channel) {
    this.channels.set(channel.type, channel);
  }

  /**
   * Remove notification channel
   * @param {string} channelType - Channel type
   */
  removeChannel(channelType) {
    this.channels.delete(channelType);
  }

  /**
   * Add alerting rule
   * @param {string} ruleId - Rule identifier
   * @param {Object} rule - Rule configuration
   */
  addRule(ruleId, rule) {
    this.rules.set(ruleId, {
      id: ruleId,
      condition: rule.condition,
      priority: rule.priority || ALERT_CONFIG.PRIORITIES.MEDIUM,
      message: rule.message || 'Alert triggered',
      channels: rule.channels || [ALERT_CONFIG.CHANNELS.CONSOLE],
      escalate: rule.escalate || false,
      cooldownMs: rule.cooldownMs || 300000, // 5 minutes default
      lastTriggered: 0
    });
  }

  /**
   * Remove alerting rule
   * @param {string} ruleId - Rule identifier
   */
  removeRule(ruleId) {
    this.rules.delete(ruleId);
  }

  /**
   * Start monitoring and checking alert conditions
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    this.monitoringInterval = setInterval(() => {
      this.checkAlertConditions();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check all alert conditions
   */
  async checkAlertConditions() {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Get current metrics
      const dashboardData = errorAnalytics.generateDashboard();
      const performanceData = performanceOptimizer.getDetailedPerformanceMetrics();
      
      const metrics = {
        ...dashboardData,
        performance: performanceData
      };

      // Check each rule
      for (const [ruleId, rule] of this.rules.entries()) {
        await this.checkRule(ruleId, rule, metrics);
      }
    } catch (error) {
      console.error('Error checking alert conditions:', error);
    }
  }

  /**
   * Check individual alert rule
   * @param {string} ruleId - Rule identifier
   * @param {Object} rule - Rule configuration
   * @param {Object} metrics - Current metrics
   */
  async checkRule(ruleId, rule, metrics) {
    try {
      // Check cooldown
      const now = Date.now();
      if (now - rule.lastTriggered < rule.cooldownMs) {
        return;
      }

      // Evaluate condition
      const shouldAlert = rule.condition(metrics);
      if (!shouldAlert) {
        return;
      }

      // Create alert
      const alert = {
        id: `${ruleId}_${now}`,
        type: ruleId.toUpperCase(),
        priority: rule.priority,
        message: rule.message,
        timestamp: now,
        data: this.extractRelevantData(ruleId, metrics),
        ruleId
      };

      // Update last triggered time
      rule.lastTriggered = now;

      // Send alert
      await this.sendAlert(alert, rule);

      // Add to history
      this.addToHistory(alert);

    } catch (error) {
      console.error(`Error checking rule ${ruleId}:`, error);
    }
  }

  /**
   * Extract relevant data for alert based on rule type
   * @param {string} ruleId - Rule identifier
   * @param {Object} metrics - Current metrics
   * @returns {Object} Relevant data
   */
  extractRelevantData(ruleId, metrics) {
    switch (ruleId) {
      case 'high_error_rate':
        return {
          errorRate: metrics.errorRates?.lastHour?.errorRate,
          errorCount: metrics.errorRates?.lastHour?.errorEvents,
          totalEvents: metrics.errorRates?.lastHour?.totalEvents,
          threshold: ALERT_CONFIG.THRESHOLDS.ERROR_RATE_CRITICAL
        };
        
      case 'performance_degradation':
        return {
          averageTime: metrics.performance?.performanceBreakdown?.averageProcessingTime,
          threshold: ALERT_CONFIG.THRESHOLDS.RESPONSE_TIME_CRITICAL,
          cacheEfficiency: metrics.performance?.performanceBreakdown?.cacheEfficiency
        };
        
      case 'high_memory_usage':
        return {
          memoryUsage: metrics.performance?.performanceBreakdown?.memoryEfficiency?.totalManagedObjects,
          threshold: 500,
          cacheSize: metrics.performance?.performanceBreakdown?.memoryEfficiency?.cacheMemoryUsage
        };
        
      case 'system_unhealthy':
        return {
          issues: metrics.performance?.health?.issues || [],
          warnings: metrics.performance?.health?.warnings || []
        };
        
      default:
        return {};
    }
  }

  /**
   * Send alert through configured channels
   * @param {Object} alert - Alert object
   * @param {Object} rule - Rule configuration
   */
  async sendAlert(alert, rule) {
    const targetChannels = rule.channels
      .map(channelType => this.channels.get(channelType))
      .filter(channel => channel && channel.enabled);

    if (targetChannels.length === 0) {
      console.warn(`No enabled channels found for alert ${alert.type}`);
      return;
    }

    // Send through channels
    const results = await Promise.allSettled(
      targetChannels.map(channel => channel.send(alert))
    );

    // Check if any channel failed and escalation is enabled
    const anyFailed = results.some(result => 
      result.status === 'rejected' || result.value === false
    );

    if (anyFailed && rule.escalate) {
      this.escalationManager.startEscalation(alert, targetChannels);
    }
  }

  /**
   * Add alert to history
   * @param {Object} alert - Alert object
   */
  addToHistory(alert) {
    this.alertHistory.unshift(alert);
    
    // Maintain history size limit
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Configure webhook channel
   * @param {string} webhookUrl - Webhook URL
   * @param {Object} config - Additional configuration
   */
  configureWebhook(webhookUrl, config = {}) {
    const webhookChannel = new WebhookNotificationChannel({
      webhookUrl,
      ...config
    });
    
    this.addChannel(webhookChannel);
  }

  /**
   * Configure custom notification handler
   * @param {Function} handler - Custom notification handler
   * @param {Object} config - Additional configuration
   */
  configureCustomHandler(handler, config = {}) {
    const customChannel = new CustomNotificationChannel({
      handler,
      ...config
    });
    
    this.addChannel(customChannel);
  }

  /**
   * Get alert statistics
   * @returns {Object} Alert statistics
   */
  getAlertStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const recentAlerts = this.alertHistory.filter(alert => 
      (now - alert.timestamp) < oneHour
    );
    
    const dailyAlerts = this.alertHistory.filter(alert => 
      (now - alert.timestamp) < oneDay
    );

    const priorityCounts = recentAlerts.reduce((counts, alert) => {
      counts[alert.priority] = (counts[alert.priority] || 0) + 1;
      return counts;
    }, {});

    return {
      totalAlerts: this.alertHistory.length,
      recentAlerts: recentAlerts.length,
      dailyAlerts: dailyAlerts.length,
      priorityCounts,
      activeEscalations: this.escalationManager.getActiveEscalations().length,
      enabledChannels: Array.from(this.channels.values())
        .filter(channel => channel.enabled).length,
      activeRules: this.rules.size
    };
  }

  /**
   * Get recent alerts
   * @param {number} limit - Maximum number of alerts to return
   * @returns {Array} Recent alerts
   */
  getRecentAlerts(limit = 50) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Enable or disable alerting system
   * @param {boolean} enabled - Whether to enable alerting
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
  }

  /**
   * Test alert system by sending a test alert
   * @param {string} priority - Alert priority
   */
  async sendTestAlert(priority = ALERT_CONFIG.PRIORITIES.LOW) {
    const testAlert = {
      id: `test_${Date.now()}`,
      type: 'TEST_ALERT',
      priority,
      message: 'This is a test alert to verify the alerting system is working',
      timestamp: Date.now(),
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const channels = Array.from(this.channels.values()).filter(channel => channel.enabled);
    
    for (const channel of channels) {
      try {
        await channel.send(testAlert);
      } catch (error) {
        console.error(`Test alert failed for channel ${channel.type}:`, error);
      }
    }

    this.addToHistory(testAlert);
    return testAlert;
  }
}

// Create singleton instance
export const alertingSystem = new AlertingSystem();
export default alertingSystem;