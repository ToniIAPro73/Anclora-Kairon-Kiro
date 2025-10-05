/**
 * Real-Time Error Analytics Dashboard
 * Provides comprehensive real-time monitoring of error rates, performance metrics,
 * user experience analytics, and system health with interactive visualizations
 */

import errorAnalytics from '../services/errorAnalytics.js';
import alertingSystem from '../services/alertingSystem.js';

/**
 * Real-time dashboard with advanced analytics and monitoring
 */
export class RealTimeErrorDashboard {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.refreshInterval = null;
    this.refreshRate = 2000; // 2 seconds for real-time updates
    this.isVisible = false;
    this.charts = new Map();
    this.alertSubscription = null;
    
    // Data history for charts
    this.dataHistory = {
      errorRates: [],
      responseTime: [],
      memoryUsage: [],
      userExperience: []
    };
    
    this.maxDataPoints = 50; // Keep last 50 data points for charts
    
    this.init();
  }

  /**
   * Initialize the dashboard
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Dashboard container with id '${this.containerId}' not found`);
      return;
    }

    this.render();
    this.subscribeToAlerts();
    this.startRealTimeUpdates();
  }

  /**
   * Render the complete real-time dashboard
   */
  async render() {
    if (!this.container) return;

    const dashboardData = errorAnalytics.generateDashboard();
    const { performanceOptimizer } = await import('../services/performanceOptimizer.js');
    const performanceData = performanceOptimizer.getDetailedPerformanceMetrics();
    const alertStats = alertingSystem.getAlertStats();
    
    this.container.innerHTML = `
      <div class="realtime-error-dashboard">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
          <div class="header-left">
            <h1>Real-Time Error Analytics</h1>
            <div class="system-status ${performanceData.health.healthy ? 'healthy' : 'unhealthy'}">
              <span class="status-indicator"></span>
              <span class="status-text">${performanceData.health.healthy ? 'System Healthy' : 'Issues Detected'}</span>
            </div>
          </div>
          <div class="header-right">
            <div class="dashboard-controls">
              <button id="pause-updates" class="btn btn-outline">
                ${this.refreshInterval ? 'Pause Updates' : 'Resume Updates'}
              </button>
              <button id="test-alert" class="btn btn-warning">Test Alert</button>
              <button id="export-data" class="btn btn-secondary">Export Data</button>
              <div class="refresh-indicator ${this.refreshInterval ? 'active' : ''}">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Metrics Row -->
        <div class="metrics-row">
          <div class="metric-card error-rate">
            <div class="metric-header">
              <h3>Error Rate</h3>
              <span class="metric-trend ${this.getTrendClass(dashboardData.errorRates.lastHour.errorRate)}">
                ${this.getTrendIcon(dashboardData.errorRates.lastHour.errorRate)}
              </span>
            </div>
            <div class="metric-value ${this.getErrorRateClass(dashboardData.errorRates.lastHour.errorRate)}">
              ${dashboardData.errorRates.lastHour.errorRate.toFixed(1)}%
            </div>
            <div class="metric-details">
              ${dashboardData.errorRates.lastHour.errorEvents} errors / ${dashboardData.errorRates.lastHour.totalEvents} requests
            </div>
            <div class="metric-chart" id="error-rate-chart"></div>
          </div>

          <div class="metric-card response-time">
            <div class="metric-header">
              <h3>Avg Response Time</h3>
              <span class="metric-trend ${this.getResponseTimeTrendClass(performanceData.performanceBreakdown.averageProcessingTime)}">
                ${this.getResponseTimeTrendIcon(performanceData.performanceBreakdown.averageProcessingTime)}
              </span>
            </div>
            <div class="metric-value ${this.getResponseTimeClass(performanceData.performanceBreakdown.averageProcessingTime)}">
              ${performanceData.performanceBreakdown.averageProcessingTime.toFixed(1)}ms
            </div>
            <div class="metric-details">
              Cache Hit Rate: ${performanceData.performanceBreakdown.cacheEfficiency.toFixed(1)}%
            </div>
            <div class="metric-chart" id="response-time-chart"></div>
          </div>

          <div class="metric-card user-experience">
            <div class="metric-header">
              <h3>User Experience</h3>
              <span class="metric-trend positive">↗</span>
            </div>
            <div class="metric-value success">
              ${dashboardData.userExperience.completionRate.toFixed(1)}%
            </div>
            <div class="metric-details">
              Completion Rate (${dashboardData.userExperience.totalFlows} flows)
            </div>
            <div class="metric-chart" id="ux-chart"></div>
          </div>

          <div class="metric-card alerts">
            <div class="metric-header">
              <h3>Active Alerts</h3>
              <span class="metric-trend ${alertStats.recentAlerts > 0 ? 'negative' : 'neutral'}">
                ${alertStats.recentAlerts > 0 ? '⚠' : '✓'}
              </span>
            </div>
            <div class="metric-value ${alertStats.recentAlerts > 0 ? 'warning' : 'success'}">
              ${alertStats.recentAlerts}
            </div>
            <div class="metric-details">
              ${alertStats.activeEscalations} escalations active
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <div class="chart-container">
            <h3>Error Rate Trend (Last Hour)</h3>
            <div class="chart-wrapper">
              <canvas id="error-trend-chart" width="400" height="200"></canvas>
            </div>
          </div>
          
          <div class="chart-container">
            <h3>Performance Metrics</h3>
            <div class="chart-wrapper">
              <canvas id="performance-chart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>

        <!-- Detailed Analytics Row -->
        <div class="analytics-row">
          <!-- Live Error Stream -->
          <div class="analytics-card error-stream">
            <div class="card-header">
              <h3>Live Error Stream</h3>
              <div class="stream-controls">
                <button id="clear-stream" class="btn btn-sm">Clear</button>
                <button id="pause-stream" class="btn btn-sm">Pause</button>
              </div>
            </div>
            <div class="error-stream-container" id="error-stream">
              <!-- Live errors will be populated here -->
            </div>
          </div>

          <!-- Alert History -->
          <div class="analytics-card alert-history">
            <div class="card-header">
              <h3>Recent Alerts</h3>
              <div class="alert-summary">
                <span class="alert-count critical">${alertStats.priorityCounts.critical || 0} Critical</span>
                <span class="alert-count high">${alertStats.priorityCounts.high || 0} High</span>
                <span class="alert-count medium">${alertStats.priorityCounts.medium || 0} Medium</span>
              </div>
            </div>
            <div class="alert-list" id="alert-list">
              ${this.renderAlertHistory(alertingSystem.getRecentAlerts(10))}
            </div>
          </div>

          <!-- Performance Recommendations -->
          <div class="analytics-card recommendations">
            <div class="card-header">
              <h3>Performance Recommendations</h3>
              <div class="recommendations-count">
                ${performanceData.recommendations.length} recommendations
              </div>
            </div>
            <div class="recommendations-list">
              ${this.renderRecommendations(performanceData.recommendations)}
            </div>
          </div>
        </div>

        <!-- System Health Details -->
        <div class="health-row">
          <div class="health-card">
            <h3>System Health Details</h3>
            <div class="health-grid">
              <div class="health-metric">
                <span class="health-label">Memory Objects</span>
                <span class="health-value">${performanceData.performanceBreakdown.memoryEfficiency.totalManagedObjects}</span>
              </div>
              <div class="health-metric">
                <span class="health-label">Cache Size</span>
                <span class="health-value">${performanceData.cache.size}/${performanceData.cache.maxSize}</span>
              </div>
              <div class="health-metric">
                <span class="health-label">Fast Path Rate</span>
                <span class="health-value">${performanceData.performanceBreakdown.fastPathHitRate.toFixed(1)}%</span>
              </div>
              <div class="health-metric">
                <span class="health-label">Uptime</span>
                <span class="health-value">${this.formatUptime(dashboardData.overview.uptime)}</span>
              </div>
            </div>
            
            ${performanceData.health.issues.length > 0 ? `
              <div class="health-issues">
                <h4>Active Issues:</h4>
                ${performanceData.health.issues.map(issue => `
                  <div class="health-issue severity-${issue.severity.toLowerCase()}">
                    <span class="issue-type">${issue.type}</span>
                    <span class="issue-message">${issue.message}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.initializeCharts();
  }

  /**
   * Attach event listeners to dashboard controls
   */
  attachEventListeners() {
    const pauseBtn = document.getElementById('pause-updates');
    const testAlertBtn = document.getElementById('test-alert');
    const exportBtn = document.getElementById('export-data');
    const clearStreamBtn = document.getElementById('clear-stream');
    const pauseStreamBtn = document.getElementById('pause-stream');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.toggleUpdates());
    }

    if (testAlertBtn) {
      testAlertBtn.addEventListener('click', () => this.sendTestAlert());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportDashboardData());
    }

    if (clearStreamBtn) {
      clearStreamBtn.addEventListener('click', () => this.clearErrorStream());
    }

    if (pauseStreamBtn) {
      pauseStreamBtn.addEventListener('click', () => this.toggleErrorStream());
    }
  }

  /**
   * Initialize charts for real-time data visualization
   */
  initializeCharts() {
    // Initialize mini charts in metric cards
    this.initializeMiniChart('error-rate-chart', this.dataHistory.errorRates);
    this.initializeMiniChart('response-time-chart', this.dataHistory.responseTime);
    this.initializeMiniChart('ux-chart', this.dataHistory.userExperience);

    // Initialize main trend charts
    this.initializeTrendChart('error-trend-chart');
    this.initializePerformanceChart('performance-chart');
  }

  /**
   * Initialize mini chart for metric cards
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - Historical data
   */
  initializeMiniChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Simple line chart implementation
    ctx.clearRect(0, 0, width, height);
    
    if (data.length < 2) return;

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  /**
   * Initialize trend chart
   * @param {string} canvasId - Canvas element ID
   */
  initializeTrendChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Store canvas reference for updates
    this.charts.set(canvasId, canvas);
    this.updateTrendChart(canvasId);
  }

  /**
   * Initialize performance chart
   * @param {string} canvasId - Canvas element ID
   */
  initializePerformanceChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this.charts.set(canvasId, canvas);
    this.updatePerformanceChart(canvasId);
  }

  /**
   * Update trend chart with latest data
   * @param {string} canvasId - Canvas element ID
   */
  updateTrendChart(canvasId) {
    const canvas = this.charts.get(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw error rate line
    const errorRateData = this.dataHistory.errorRates;
    if (errorRateData.length > 1) {
      const maxRate = Math.max(...errorRateData, 10); // Minimum scale of 10%
      
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 3;
      ctx.beginPath();

      errorRateData.forEach((rate, index) => {
        const x = (index / (errorRateData.length - 1)) * width;
        const y = height - (rate / maxRate) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Add data points
      ctx.fillStyle = '#e74c3c';
      errorRateData.forEach((rate, index) => {
        const x = (index / (errorRateData.length - 1)) * width;
        const y = height - (rate / maxRate) * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }

  /**
   * Update performance chart
   * @param {string} canvasId - Canvas element ID
   */
  updatePerformanceChart(canvasId) {
    const canvas = this.charts.get(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw multiple performance metrics
    const responseTimeData = this.dataHistory.responseTime;
    const memoryData = this.dataHistory.memoryUsage;

    if (responseTimeData.length > 1) {
      // Response time line (normalized)
      const maxResponseTime = Math.max(...responseTimeData, 100);
      
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.beginPath();

      responseTimeData.forEach((time, index) => {
        const x = (index / (responseTimeData.length - 1)) * width;
        const y = height - (time / maxResponseTime) * height * 0.8; // Use 80% of height
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    if (memoryData.length > 1) {
      // Memory usage line (normalized)
      const maxMemory = Math.max(...memoryData, 100);
      
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 2;
      ctx.beginPath();

      memoryData.forEach((memory, index) => {
        const x = (index / (memoryData.length - 1)) * width;
        const y = height - (memory / maxMemory) * height * 0.8;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Add legend
    ctx.font = '12px Arial';
    ctx.fillStyle = '#3498db';
    ctx.fillText('Response Time', 10, 20);
    ctx.fillStyle = '#f39c12';
    ctx.fillText('Memory Usage', 10, 35);
  }

  /**
   * Subscribe to real-time alerts
   */
  subscribeToAlerts() {
    // Listen for new alerts (if alerting system supports events)
    if (typeof alertingSystem.on === 'function') {
      this.alertSubscription = alertingSystem.on('alert', (alert) => {
        this.addAlertToStream(alert);
      });
    }
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(() => {
      if (this.isVisible) {
        this.updateRealTimeData();
      }
    }, this.refreshRate);

    this.updateRefreshIndicator(true);
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    this.updateRefreshIndicator(false);
  }

  /**
   * Update real-time data
   */
  async updateRealTimeData() {
    try {
      const dashboardData = errorAnalytics.generateDashboard();
      const { performanceOptimizer } = await import('../services/performanceOptimizer.js');
      const performanceData = performanceOptimizer.getDetailedPerformanceMetrics();

      // Update data history
      this.updateDataHistory(dashboardData, performanceData);

      // Update metric values
      this.updateMetricValues(dashboardData, performanceData);

      // Update charts
      this.updateCharts();

      // Update alert list
      this.updateAlertList();

    } catch (error) {
      console.error('Error updating real-time data:', error);
    }
  }

  /**
   * Update data history for charts
   * @param {Object} dashboardData - Dashboard data
   * @param {Object} performanceData - Performance data
   */
  updateDataHistory(dashboardData, performanceData) {
    // Add new data points
    this.dataHistory.errorRates.push(dashboardData.errorRates.lastHour.errorRate);
    this.dataHistory.responseTime.push(performanceData.performanceBreakdown.averageProcessingTime);
    this.dataHistory.memoryUsage.push(performanceData.performanceBreakdown.memoryEfficiency.totalManagedObjects);
    this.dataHistory.userExperience.push(dashboardData.userExperience.completionRate);

    // Maintain max data points
    Object.keys(this.dataHistory).forEach(key => {
      if (this.dataHistory[key].length > this.maxDataPoints) {
        this.dataHistory[key].shift();
      }
    });
  }

  /**
   * Update metric values in the UI
   * @param {Object} dashboardData - Dashboard data
   * @param {Object} performanceData - Performance data
   */
  updateMetricValues(dashboardData, performanceData) {
    // Update error rate
    const errorRateElement = document.querySelector('.metric-card.error-rate .metric-value');
    if (errorRateElement) {
      errorRateElement.textContent = `${dashboardData.errorRates.lastHour.errorRate.toFixed(1)}%`;
      errorRateElement.className = `metric-value ${this.getErrorRateClass(dashboardData.errorRates.lastHour.errorRate)}`;
    }

    // Update response time
    const responseTimeElement = document.querySelector('.metric-card.response-time .metric-value');
    if (responseTimeElement) {
      responseTimeElement.textContent = `${performanceData.performanceBreakdown.averageProcessingTime.toFixed(1)}ms`;
      responseTimeElement.className = `metric-value ${this.getResponseTimeClass(performanceData.performanceBreakdown.averageProcessingTime)}`;
    }

    // Update user experience
    const uxElement = document.querySelector('.metric-card.user-experience .metric-value');
    if (uxElement) {
      uxElement.textContent = `${dashboardData.userExperience.completionRate.toFixed(1)}%`;
    }

    // Update system status
    const statusElement = document.querySelector('.system-status');
    if (statusElement) {
      statusElement.className = `system-status ${performanceData.health.healthy ? 'healthy' : 'unhealthy'}`;
      const statusText = statusElement.querySelector('.status-text');
      if (statusText) {
        statusText.textContent = performanceData.health.healthy ? 'System Healthy' : 'Issues Detected';
      }
    }
  }

  /**
   * Update all charts
   */
  updateCharts() {
    // Update mini charts
    this.initializeMiniChart('error-rate-chart', this.dataHistory.errorRates);
    this.initializeMiniChart('response-time-chart', this.dataHistory.responseTime);
    this.initializeMiniChart('ux-chart', this.dataHistory.userExperience);

    // Update main charts
    this.updateTrendChart('error-trend-chart');
    this.updatePerformanceChart('performance-chart');
  }

  /**
   * Update alert list
   */
  updateAlertList() {
    const alertList = document.getElementById('alert-list');
    if (alertList) {
      const recentAlerts = alertingSystem.getRecentAlerts(10);
      alertList.innerHTML = this.renderAlertHistory(recentAlerts);
    }
  }

  /**
   * Render alert history
   * @param {Array} alerts - Array of alerts
   * @returns {string} HTML string
   */
  renderAlertHistory(alerts) {
    if (!alerts || alerts.length === 0) {
      return '<div class="no-alerts">No recent alerts</div>';
    }

    return alerts.map(alert => `
      <div class="alert-item priority-${alert.priority}">
        <div class="alert-header">
          <span class="alert-type">${alert.type}</span>
          <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
        </div>
        <div class="alert-message">${alert.message}</div>
      </div>
    `).join('');
  }

  /**
   * Render performance recommendations
   * @param {Array} recommendations - Array of recommendations
   * @returns {string} HTML string
   */
  renderRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '<div class="no-recommendations">No recommendations at this time</div>';
    }

    return recommendations.slice(0, 5).map(rec => `
      <div class="recommendation-item severity-${rec.severity}">
        <div class="recommendation-header">
          <span class="recommendation-type">${rec.type}</span>
          <span class="recommendation-severity">${rec.severity}</span>
        </div>
        <div class="recommendation-message">${rec.message}</div>
        <div class="recommendation-action">${rec.action}</div>
      </div>
    `).join('');
  }

  /**
   * Toggle real-time updates
   */
  toggleUpdates() {
    if (this.refreshInterval) {
      this.stopRealTimeUpdates();
    } else {
      this.startRealTimeUpdates();
    }

    const btn = document.getElementById('pause-updates');
    if (btn) {
      btn.textContent = this.refreshInterval ? 'Pause Updates' : 'Resume Updates';
    }
  }

  /**
   * Send test alert
   */
  async sendTestAlert() {
    try {
      await alertingSystem.sendTestAlert('medium');
      
      // Show confirmation
      const btn = document.getElementById('test-alert');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Alert Sent!';
        btn.disabled = true;
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending test alert:', error);
      alert('Failed to send test alert. Check console for details.');
    }
  }

  /**
   * Export dashboard data
   */
  exportDashboardData() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        dashboard: errorAnalytics.generateDashboard(),
        alerts: alertingSystem.getRecentAlerts(100),
        dataHistory: this.dataHistory
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `realtime-dashboard-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      alert('Failed to export data. Check console for details.');
    }
  }

  /**
   * Clear error stream
   */
  clearErrorStream() {
    const stream = document.getElementById('error-stream');
    if (stream) {
      stream.innerHTML = '<div class="stream-empty">Error stream cleared</div>';
    }
  }

  /**
   * Toggle error stream
   */
  toggleErrorStream() {
    // Implementation for pausing/resuming error stream
    const btn = document.getElementById('pause-stream');
    if (btn) {
      const isPaused = btn.textContent === 'Resume';
      btn.textContent = isPaused ? 'Pause' : 'Resume';
    }
  }

  /**
   * Update refresh indicator
   * @param {boolean} active - Whether updates are active
   */
  updateRefreshIndicator(active) {
    const indicator = document.querySelector('.refresh-indicator');
    if (indicator) {
      indicator.className = `refresh-indicator ${active ? 'active' : ''}`;
    }
  }

  // Helper methods for styling and formatting
  getErrorRateClass(rate) {
    if (rate >= 15) return 'critical';
    if (rate >= 10) return 'high';
    if (rate >= 5) return 'medium';
    return 'low';
  }

  getResponseTimeClass(time) {
    if (time >= 5000) return 'critical';
    if (time >= 3000) return 'high';
    if (time >= 1000) return 'medium';
    return 'low';
  }

  getTrendClass(value) {
    // Simple trend calculation (would be more sophisticated in real implementation)
    return value > 10 ? 'negative' : value > 5 ? 'neutral' : 'positive';
  }

  getTrendIcon(value) {
    return value > 10 ? '↗' : value > 5 ? '→' : '↘';
  }

  getResponseTimeTrendClass(time) {
    return time > 3000 ? 'negative' : time > 1000 ? 'neutral' : 'positive';
  }

  getResponseTimeTrendIcon(time) {
    return time > 3000 ? '↗' : time > 1000 ? '→' : '↘';
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  /**
   * Set dashboard visibility
   * @param {boolean} visible - Whether dashboard is visible
   */
  setVisible(visible) {
    this.isVisible = visible;
    
    if (visible) {
      this.startRealTimeUpdates();
    } else {
      this.stopRealTimeUpdates();
    }
  }

  /**
   * Destroy dashboard and clean up resources
   */
  destroy() {
    this.stopRealTimeUpdates();
    
    if (this.alertSubscription && typeof this.alertSubscription.unsubscribe === 'function') {
      this.alertSubscription.unsubscribe();
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.charts.clear();
  }
}

export default RealTimeErrorDashboard;