/**
 * Connection Status Indicator Component
 * Displays connection status and provides visual feedback about connectivity
 */

import { connectionMonitor, CONNECTION_STATUS } from '../services/connectionMonitor.js';
import i18n from '../utils/i18n.js';

/**
 * ConnectionStatusIndicator class for displaying connection status
 */
export default class ConnectionStatusIndicator {
  constructor(options = {}) {
    this.containerId = options.containerId || 'connection-status-indicator';
    this.position = options.position || 'top-right'; // top-right, top-left, bottom-right, bottom-left
    this.showLatency = options.showLatency !== false; // Show latency by default
    this.autoHide = options.autoHide !== false; // Auto-hide when connected
    this.hideDelay = options.hideDelay || 3000; // Hide after 3 seconds when connected
    
    this.element = null;
    this.isVisible = false;
    this.hideTimeout = null;
    this.unsubscribeCallbacks = [];
    
    this.translations = i18n.getTranslations();
    this.setupLanguageListener();
    
    // Initialize the indicator
    this.init();
  }

  /**
   * Initialize the connection status indicator
   */
  init() {
    this.createIndicatorElement();
    this.setupEventListeners();
    this.updateStatus(connectionMonitor.getStatus());
  }

  /**
   * Create the indicator DOM element
   */
  createIndicatorElement() {
    // Remove existing element if any
    const existing = document.getElementById(this.containerId);
    if (existing) {
      existing.remove();
    }

    // Create container element
    this.element = document.createElement('div');
    this.element.id = this.containerId;
    this.element.className = this.getContainerClasses();
    
    // Add to document body
    document.body.appendChild(this.element);
  }

  /**
   * Get CSS classes for the container based on position
   */
  getContainerClasses() {
    const baseClasses = 'fixed z-50 transition-all duration-300 transform';
    const positionClasses = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    };

    return `${baseClasses} ${positionClasses[this.position] || positionClasses['top-right']}`;
  }

  /**
   * Setup event listeners for connection status changes
   */
  setupEventListeners() {
    // Listen for connection status changes
    const unsubscribeStatus = connectionMonitor.onConnectionChange('statusChange', (event) => {
      this.updateStatus({
        status: event.to,
        timestamp: event.timestamp,
        result: event.result
      });
    });

    // Listen for connectivity checks
    const unsubscribeCheck = connectionMonitor.onConnectionChange('connectivityCheck', (result) => {
      this.updateStatus({
        status: result.status,
        latency: result.latency,
        quality: result.quality,
        timestamp: result.timestamp
      });
    });

    this.unsubscribeCallbacks.push(unsubscribeStatus, unsubscribeCheck);
  }

  /**
   * Setup language change listener
   */
  setupLanguageListener() {
    // Listen for language changes
    document.addEventListener('languageChanged', () => {
      this.translations = i18n.getTranslations();
      this.updateStatus(connectionMonitor.getStatus());
    });
  }

  /**
   * Update the status indicator
   * @param {Object} statusInfo - Status information
   */
  updateStatus(statusInfo) {
    if (!this.element) return;

    const { status, latency, quality, timestamp } = statusInfo;
    
    // Clear any existing hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Determine if indicator should be visible
    const shouldShow = this.shouldShowIndicator(status);
    
    if (shouldShow) {
      this.show();
      this.renderStatus(status, latency, quality, timestamp);
      
      // Auto-hide for connected status
      if (status === CONNECTION_STATUS.CONNECTED && this.autoHide) {
        this.hideTimeout = setTimeout(() => {
          this.hide();
        }, this.hideDelay);
      }
    } else {
      this.hide();
    }
  }

  /**
   * Determine if indicator should be shown for given status
   * @param {string} status - Connection status
   * @returns {boolean} Whether to show indicator
   */
  shouldShowIndicator(status) {
    // Always show for disconnected, checking, or unknown states
    if (status === CONNECTION_STATUS.DISCONNECTED || 
        status === CONNECTION_STATUS.CHECKING || 
        status === CONNECTION_STATUS.UNKNOWN) {
      return true;
    }

    // For connected state, show briefly if auto-hide is enabled
    if (status === CONNECTION_STATUS.CONNECTED && this.autoHide) {
      return true;
    }

    // For connected state without auto-hide, don't show
    return false;
  }

  /**
   * Render the status indicator content
   * @param {string} status - Connection status
   * @param {number} latency - Connection latency
   * @param {string} quality - Connection quality
   * @param {string} timestamp - Last check timestamp
   */
  renderStatus(status, latency, quality, timestamp) {
    const statusConfig = this.getStatusConfig(status);
    const latencyText = this.getLatencyText(latency, quality);
    
    this.element.innerHTML = `
      <div class="flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border ${statusConfig.bgClass} ${statusConfig.borderClass}">
        <!-- Status Icon -->
        <div class="flex-shrink-0">
          ${statusConfig.icon}
        </div>
        
        <!-- Status Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <p class="text-sm font-semibold ${statusConfig.textClass}">
              ${statusConfig.title}
            </p>
            ${latencyText ? `<span class="text-xs ${statusConfig.textClass} opacity-75">${latencyText}</span>` : ''}
          </div>
          <p class="text-xs ${statusConfig.textClass} opacity-80 mt-1">
            ${statusConfig.message}
          </p>
        </div>
        
        <!-- Close Button (for persistent states) -->
        ${this.shouldShowCloseButton(status) ? `
          <button 
            onclick="document.getElementById('${this.containerId}').style.display='none'"
            class="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <svg class="w-4 h-4 ${statusConfig.textClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Get configuration for different status types
   * @param {string} status - Connection status
   * @returns {Object} Status configuration
   */
  getStatusConfig(status) {
    const configs = {
      [CONNECTION_STATUS.CONNECTED]: {
        title: this.translations.connectionConnected || 'Conectado',
        message: this.translations.connectionConnectedDesc || 'Conexión establecida correctamente',
        icon: `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`,
        bgClass: 'bg-green-900/20 backdrop-blur-sm',
        borderClass: 'border-green-400/30',
        textClass: 'text-green-300'
      },
      [CONNECTION_STATUS.DISCONNECTED]: {
        title: this.translations.connectionDisconnected || 'Sin conexión',
        message: this.translations.connectionDisconnectedDesc || 'Verifica tu conexión a internet',
        icon: `<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>`,
        bgClass: 'bg-red-900/20 backdrop-blur-sm',
        borderClass: 'border-red-400/30',
        textClass: 'text-red-300'
      },
      [CONNECTION_STATUS.CHECKING]: {
        title: this.translations.connectionChecking || 'Verificando conexión',
        message: this.translations.connectionCheckingDesc || 'Comprobando estado de la conexión...',
        icon: `<svg class="w-5 h-5 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>`,
        bgClass: 'bg-yellow-900/20 backdrop-blur-sm',
        borderClass: 'border-yellow-400/30',
        textClass: 'text-yellow-300'
      },
      [CONNECTION_STATUS.UNKNOWN]: {
        title: this.translations.connectionUnknown || 'Estado desconocido',
        message: this.translations.connectionUnknownDesc || 'No se pudo determinar el estado de la conexión',
        icon: `<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`,
        bgClass: 'bg-gray-900/20 backdrop-blur-sm',
        borderClass: 'border-gray-400/30',
        textClass: 'text-gray-300'
      }
    };

    return configs[status] || configs[CONNECTION_STATUS.UNKNOWN];
  }

  /**
   * Get latency text for display
   * @param {number} latency - Latency in milliseconds
   * @param {string} quality - Connection quality
   * @returns {string} Formatted latency text
   */
  getLatencyText(latency, quality) {
    if (!this.showLatency || !latency) return '';

    const qualityLabels = {
      'excellent': this.translations.connectionExcellent || 'Excelente',
      'good': this.translations.connectionGood || 'Buena',
      'fair': this.translations.connectionFair || 'Regular',
      'poor': this.translations.connectionPoor || 'Lenta',
      'very_poor': this.translations.connectionVeryPoor || 'Muy lenta'
    };

    const qualityLabel = qualityLabels[quality] || '';
    return `${latency}ms ${qualityLabel}`.trim();
  }

  /**
   * Determine if close button should be shown
   * @param {string} status - Connection status
   * @returns {boolean} Whether to show close button
   */
  shouldShowCloseButton(status) {
    // Show close button for persistent error states
    return status === CONNECTION_STATUS.DISCONNECTED || status === CONNECTION_STATUS.UNKNOWN;
  }

  /**
   * Show the indicator
   */
  show() {
    if (!this.element || this.isVisible) return;
    
    this.isVisible = true;
    this.element.style.display = 'block';
    
    // Trigger animation
    requestAnimationFrame(() => {
      this.element.style.opacity = '1';
      this.element.style.transform = 'translateY(0)';
    });
  }

  /**
   * Hide the indicator
   */
  hide() {
    if (!this.element || !this.isVisible) return;
    
    this.isVisible = false;
    this.element.style.opacity = '0';
    this.element.style.transform = 'translateY(-10px)';
    
    // Hide element after animation
    setTimeout(() => {
      if (this.element && !this.isVisible) {
        this.element.style.display = 'none';
      }
    }, 300);
  }

  /**
   * Force show the indicator (useful for testing)
   */
  forceShow() {
    this.show();
    this.renderStatus(
      connectionMonitor.getStatus().status,
      connectionMonitor.getStatus().latency,
      connectionMonitor.getStatus().quality,
      new Date().toISOString()
    );
  }

  /**
   * Update configuration
   * @param {Object} newOptions - New configuration options
   */
  updateConfig(newOptions) {
    Object.assign(this, newOptions);
    
    // Update element classes if position changed
    if (newOptions.position && this.element) {
      this.element.className = this.getContainerClasses();
    }
  }

  /**
   * Destroy the indicator and clean up
   */
  destroy() {
    // Clear timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Unsubscribe from events
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];

    // Remove element
    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.isVisible = false;
  }

  /**
   * Get current status information
   * @returns {Object} Current status information
   */
  getStatus() {
    return {
      isVisible: this.isVisible,
      position: this.position,
      showLatency: this.showLatency,
      autoHide: this.autoHide,
      connectionStatus: connectionMonitor.getStatus()
    };
  }
}

// Export for use in other components
export { ConnectionStatusIndicator };