/**
 * Error Monitoring Dashboard Component
 * Provides real-time visualization of error analytics and performance metrics
 * Displays error rates, alerts, user experience metrics, and system health
 */

import errorAnalytics from '../services/errorAnalytics.js';

/**
 * Error Monitoring Dashboard class
 */
export class ErrorMonitoringDashboard {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.refreshInterval = null;
    this.refreshRate = 5000; // 5 seconds
    this.isVisible = false;
    
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
    this.startAutoRefresh();
  }

  /**
   * Render the complete dashboard
   */
  async render() {
    if (!this.container) return;

    const dashboardData = errorAnalytics.generateDashboard();
    
    // Import performanceOptimizer dynamically to avoid circular dependencies
    const { performanceOptimizer } = await import('../services/performanceOptimizer.js');
    const performanceData = performanceOptimizer.getDetailedPerformanceMetrics();
    
    this.container.innerHTML = `
      <div class="error-monitoring-dashboard">
        <div class="dashboard-header">
          <h2>Error Monitoring Dashboard</h2>
          <div class="dashboard-controls">
            <button id="refresh-dashboard" class="btn btn-primary">Refresh</button>
            <button id="export-data" class="btn btn-secondary">Export Data</button>
            <button id="toggle-auto-refresh" class="btn btn-outline">
              ${this.refreshInterval ? 'Stop Auto-Refresh' : 'Start Auto-Refresh'}
            </button>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- System Overview -->
          <div class="dashboard-card overview-card">
            <h3>System Overview</h3>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">Uptime</span>
                <span class="metric-value">${this.formatUptime(dashboardData.overview.uptime)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Total Events</span>
                <span class="metric-value">${dashboardData.overview.totalEvents.toLocaleString()}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Status</span>
                <span class="metric-value status-${dashboardData.overview.isEnabled ? 'active' : 'inactive'}">
                  ${dashboardData.overview.isEnabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <!-- Error Rates -->
          <div class="dashboard-card error-rates-card">
            <h3>Error Rates</h3>
            <div class="error-rate-section">
              <h4>Last Hour</h4>
              <div class="error-rate-display">
                <span class="error-rate-value ${this.getErrorRateClass(dashboardData.errorRates.lastHour.errorRate)}">
                  ${dashboardData.errorRates.lastHour.errorRate}%
                </span>
                <span class="error-rate-details">
                  ${dashboardData.errorRates.lastHour.errorEvents} errors / ${dashboardData.errorRates.lastHour.totalEvents} events
                </span>
              </div>
            </div>
            <div class="error-rate-section">
              <h4>Last 24 Hours</h4>
              <div class="error-rate-display">
                <span class="error-rate-value ${this.getErrorRateClass(dashboardData.errorRates.lastDay.errorRate)}">
                  ${dashboardData.errorRates.lastDay.errorRate}%
                </span>
                <span class="error-rate-details">
                  ${dashboardData.errorRates.lastDay.errorEvents} errors / ${dashboardData.errorRates.lastDay.totalEvents} events
                </span>
              </div>
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="dashboard-card performance-card">
            <h3>Performance Metrics</h3>
            <div class="performance-metrics">
              <div class="metric">
                <span class="metric-label">Cache Hit Rate</span>
                <span class="metric-value">${performanceData.performanceBreakdown.cacheEfficiency.toFixed(1)}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Fast Path Rate</span>
                <span class="metric-value">${performanceData.performanceBreakdown.fastPathHitRate.toFixed(1)}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg Processing Time</span>
                <span class="metric-value">${performanceData.performanceBreakdown.averageProcessingTime.toFixed(2)}ms</span>
              </div>
              <div class="metric">
                <span class="metric-label">Memory Objects</span>
                <span class="metric-value">${performanceData.performanceBreakdown.memoryEfficiency.totalManagedObjects}</span>
              </div>
            </div>
          </div>

          <!-- User Experience -->
          <div class="dashboard-card ux-card">
            <h3>User Experience</h3>
            <div class="ux-metrics">
              <div class="metric">
                <span class="metric-label">Completion Rate</span>
                <span class="metric-value">${dashboardData.userExperience.completionRate.toFixed(1)}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg Auth Time</span>
                <span class="metric-value">${(dashboardData.userExperience.averageAuthTime / 1000).toFixed(1)}s</span>
              </div>
              <div class="metric">
                <span class="metric-label">Error Recovery Rate</span>
                <span class="metric-value">${dashboardData.userExperience.errorRecoveryRate.toFixed(1)}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Active Flows</span>
                <span class="metric-value">${dashboardData.userExperience.activeFlows}</span>
              </div>
            </div>
          </div>

          <!-- Recent Alerts -->
          <div class="dashboard-card alerts-card">
            <h3>Recent Alerts</h3>
            <div class="alerts-list">
              ${this.renderAlerts(dashboardData.alerts.recent)}
            </div>
            <div class="alert-stats">
              <span class="alert-stat">
                Unacknowledged: ${dashboardData.alerts.stats.unacknowledgedCount}
              </span>
              <span class="alert-stat">
                Last Hour: ${dashboardData.alerts.stats.recentAlerts}
              </span>
            </div>
          </div>

          <!-- Performance Recommendations -->
          <div class="dashboard-card recommendations-card">
            <h3>Performance Recommendations</h3>
            <div class="recommendations-list">
              ${this.renderRecommendations(performanceData.recommendations)}
            </div>
          </div>

          <!-- Error Types Breakdown -->
          <div class="dashboard-card error-types-card">
            <h3>Error Types (Last Hour)</h3>
            <div class="error-types-list">
              ${this.renderErrorTypes(dashboardData.errorRates.lastHour.errorsByType)}
            </div>
          </div>

          <!-- System Health -->
          <div class="dashboard-card health-card">
            <h3>System Health</h3>
            <div class="health-status">
              <div class="health-indicator ${performanceData.health.healthy ? 'healthy' : 'unhealthy'}">
                ${performanceData.health.healthy ? '✅ Healthy' : '⚠️ Issues Detected'}
              </div>
              ${performanceData.health.issues.length > 0 ? `
                <div class="health-issues">
                  <h4>Issues:</h4>
                  ${performanceData.health.issues.map(issue => `
                    <div class="health-issue severity-${issue.severity.toLowerCase()}">
                      ${issue.message}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners to dashboard controls
   */
  attachEventListeners() {
    const refreshBtn = document.getElementById('refresh-dashboard');
    const exportBtn = document.getElementById('export-data');
    const autoRefreshBtn = document.getElementById('toggle-auto-refresh');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.render());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportDashboardData());
    }

    if (autoRefreshBtn) {
      autoRefreshBtn.addEventListener('click', () => this.toggleAutoRefresh());
    }
  }

  /**
   * Format uptime duration
   * @param {number} uptimeMs - Uptime in milliseconds
   * @returns {string} Formatted uptime
   */
  formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Get CSS class for error rate display
   * @param {number} errorRate - Error rate percentage
   * @returns {string} CSS class name
   */
  getErrorRateClass(errorRate) {
    if (errorRate >= 25) return 'error-rate-critical';
    if (errorRate >= 10) return 'error-rate-high';
    if (errorRate >= 5) return 'error-rate-medium';
    return 'error-rate-low';
  }

  /**
   * Render alerts list
   * @param {Array} alerts - Array of alert objects
   * @returns {string} HTML string for alerts
   */
  renderAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
      return '<div class="no-alerts">No recent alerts</div>';
    }

    return alerts.map(alert => `
      <div class="alert-item severity-${alert.severity}">
        <div class="alert-header">
          <span class="alert-type">${alert.type}</span>
          <span class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="alert-message">${this.formatAlertMessage(alert)}</div>
      </div>
    `).join('');
  }

  /**
   * Format alert message for display
   * @param {Object} alert - Alert object
   * @returns {string} Formatted alert message
   */
  formatAlertMessage(alert) {
    switch (alert.type) {
      case 'HIGH_ERROR_RATE':
        return `Error rate: ${alert.data.errorRate}% (${alert.data.errorCount}/${alert.data.totalEvents})`;
      case 'CONSECUTIVE_FAILURES':
        return `${alert.data.failureCount} consecutive failures in ${alert.data.operation}`;
      case 'HIGH_NETWORK_ERROR_RATE':
        return `Network error rate: ${alert.data.networkErrorRate}%`;
      default:
        return JSON.stringify(alert.data);
    }
  }

  /**
   * Render performance recommendations
   * @param {Array} recommendations - Array of recommendation objects
   * @returns {string} HTML string for recommendations
   */
  renderRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '<div class="no-recommendations">No recommendations at this time</div>';
    }

    return recommendations.map(rec => `
      <div class="recommendation-item severity-${rec.severity}">
        <div class="recommendation-type">${rec.type}</div>
        <div class="recommendation-message">${rec.message}</div>
        <div class="recommendation-action">${rec.action}</div>
      </div>
    `).join('');
  }

  /**
   * Render error types breakdown
   * @param {Object} errorsByType - Error counts by type
   * @returns {string} HTML string for error types
   */
  renderErrorTypes(errorsByType) {
    if (!errorsByType || Object.keys(errorsByType).length === 0) {
      return '<div class="no-errors">No errors in the last hour</div>';
    }

    const sortedErrors = Object.entries(errorsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Show top 10

    return sortedErrors.map(([type, count]) => `
      <div class="error-type-item">
        <span class="error-type-name">${type}</span>
        <span class="error-type-count">${count}</span>
      </div>
    `).join('');
  }

  /**
   * Export dashboard data
   */
  exportDashboardData() {
    try {
      const data = errorAnalytics.exportData('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-analytics-${new Date().toISOString().split('T')[0]}.json`;
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
   * Toggle auto-refresh functionality
   */
  toggleAutoRefresh() {
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    } else {
      this.startAutoRefresh();
    }
    this.render(); // Re-render to update button text
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    if (this.refreshInterval) return;
    
    this.refreshInterval = setInterval(() => {
      if (this.isVisible) {
        this.render();
      }
    }, this.refreshRate);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Set dashboard visibility (for performance optimization)
   * @param {boolean} visible - Whether dashboard is visible
   */
  setVisible(visible) {
    this.isVisible = visible;
    
    if (visible && !this.refreshInterval) {
      this.render(); // Refresh when becoming visible
    }
  }

  /**
   * Update refresh rate
   * @param {number} rateMs - New refresh rate in milliseconds
   */
  setRefreshRate(rateMs) {
    this.refreshRate = Math.max(1000, rateMs); // Minimum 1 second
    
    if (this.refreshInterval) {
      this.stopAutoRefresh();
      this.startAutoRefresh();
    }
  }

  /**
   * Destroy the dashboard and clean up resources
   */
  destroy() {
    this.stopAutoRefresh();
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}