import i18n from '../utils/i18n.js';
import errorLogger from './errorLogger.js';

/**
 * User Feedback System for providing visual feedback to users during authentication operations
 * Handles loading states, error messages, success confirmations, and retry options
 */
export class UserFeedbackSystem {
  constructor() {
    this.currentState = {
      isLoading: false,
      loadingMessage: null,
      error: null,
      success: null
    };
    
    this.loadingElements = new Map();
    this.errorElements = new Map();
    this.successElements = new Map();
    
    // Error message translations
    this.errorMessages = {
      es: {
        NETWORK_ERROR: "No se pudo conectar al servidor. Verifica tu conexión a internet.",
        AUTH_INVALID_CREDENTIALS: "Email o contraseña incorrectos. Inténtalo de nuevo.",
        AUTH_USER_NOT_FOUND: "No encontramos una cuenta con este email. ¿Quizás quieres crear una cuenta nueva?",
        AUTH_USER_EXISTS: "Ya existe una cuenta con este email. ¿Quieres iniciar sesión?",
        AUTH_WEAK_PASSWORD: "La contraseña debe tener al menos 6 caracteres.",
        AUTH_RATE_LIMITED: "Demasiados intentos. Espera {waitTime} segundos antes de intentar de nuevo.",
        AUTH_EMAIL_NOT_CONFIRMED: "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
        SERVER_ERROR: "Error del servidor. Inténtalo de nuevo en unos momentos.",
        UNKNOWN_ERROR: "Ocurrió un error inesperado. Contacta al soporte si persiste.",
        EMAIL_NOT_CONFIRMED: "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
        INVALID_EMAIL_FORMAT: "Por favor ingresa un email válido."
      },
      en: {
        NETWORK_ERROR: "Could not connect to server. Check your internet connection.",
        AUTH_INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
        AUTH_USER_NOT_FOUND: "No account found with this email address. Would you like to create a new account?",
        AUTH_USER_EXISTS: "An account with this email already exists. Want to sign in?",
        AUTH_WEAK_PASSWORD: "Password must be at least 6 characters long.",
        AUTH_RATE_LIMITED: "Too many attempts. Wait {waitTime} seconds before trying again.",
        AUTH_EMAIL_NOT_CONFIRMED: "You must confirm your email before signing in. Check your inbox.",
        SERVER_ERROR: "Server error. Please try again in a few moments.",
        UNKNOWN_ERROR: "An unexpected error occurred. Contact support if it persists.",
        EMAIL_NOT_CONFIRMED: "You must confirm your email before signing in. Check your inbox.",
        INVALID_EMAIL_FORMAT: "Please enter a valid email address."
      }
    };
    
    // Loading message translations
    this.loadingMessages = {
      es: {
        login: "Iniciando sesión...",
        register: "Creando cuenta...",
        logout: "Cerrando sesión...",
        forgotPassword: "Enviando enlace de recuperación...",
        checkingConnectivity: "Verificando conexión...",
        retrying: "Reintentando...",
        default: "Procesando..."
      },
      en: {
        login: "Signing in...",
        register: "Creating account...",
        logout: "Signing out...",
        forgotPassword: "Sending recovery link...",
        checkingConnectivity: "Checking connection...",
        retrying: "Retrying...",
        default: "Processing..."
      }
    };
    
    // Success message translations
    this.successMessages = {
      es: {
        login: "¡Bienvenido de vuelta!",
        register: "¡Cuenta creada exitosamente!",
        forgotPassword: "Enlace de recuperación enviado a tu email.",
        passwordReset: "Contraseña actualizada exitosamente.",
        emailConfirmed: "Email confirmado exitosamente."
      },
      en: {
        login: "Welcome back!",
        register: "Account created successfully!",
        forgotPassword: "Recovery link sent to your email.",
        passwordReset: "Password updated successfully.",
        emailConfirmed: "Email confirmed successfully."
      }
    };
  }

  /**
   * Show loading state with operation-specific messages
   * @param {string} operation - The operation being performed (login, register, etc.)
   * @param {string} customMessage - Optional custom message to override default
   * @param {HTMLElement} targetElement - Optional target element to show loading in
   */
  showLoading(operation = 'default', customMessage = null, targetElement = null) {
    const language = i18n.getCurrentLanguage();
    const message = customMessage || this.loadingMessages[language][operation] || this.loadingMessages[language].default;
    
    this.currentState.isLoading = true;
    this.currentState.loadingMessage = message;
    
    // Clear any existing error or success states
    this.hideError();
    this.hideSuccess();
    
    if (targetElement) {
      this._showLoadingInElement(targetElement, message, operation);
    } else {
      this._showGlobalLoading(message, operation);
    }
    
    // Disable form buttons to prevent multiple submissions
    this._disableFormButtons(true);
  }

  /**
   * Hide loading state
   * @param {HTMLElement} targetElement - Optional target element to hide loading from
   */
  hideLoading(targetElement = null) {
    this.currentState.isLoading = false;
    this.currentState.loadingMessage = null;
    
    if (targetElement) {
      this._hideLoadingInElement(targetElement);
    } else {
      this._hideGlobalLoading();
    }
    
    // Re-enable form buttons
    this._disableFormButtons(false);
  }

  /**
   * Show error message with retry options
   * @param {Error|string} error - Error object or error type string
   * @param {Object} options - Configuration options
   * @param {boolean} options.canRetry - Whether retry option should be shown
   * @param {Function} options.retryCallback - Function to call when retry is clicked
   * @param {HTMLElement} options.targetElement - Element to show error in
   * @param {number} options.waitTime - Wait time for rate limiting
   */
  showError(error, options = {}) {
    const {
      canRetry = true,
      retryCallback = null,
      targetElement = null,
      waitTime = null
    } = options;
    
    // Hide loading state
    this.hideLoading(targetElement);
    
    const errorType = typeof error === 'string' ? error : this._classifyError(error);
    const language = i18n.getCurrentLanguage();
    let message = this.errorMessages[language][errorType] || this.errorMessages[language].UNKNOWN_ERROR;
    
    // Replace placeholders in message
    if (waitTime && message.includes('{waitTime}')) {
      message = message.replace('{waitTime}', waitTime);
    }
    
    this.currentState.error = {
      type: errorType,
      message: message,
      canRetry: canRetry,
      retryCount: 0
    };

    // Log user feedback error display
    const context = {
      operation: 'user_feedback_error',
      errorType: errorType,
      language: language,
      canRetry: canRetry,
      hasTargetElement: !!targetElement,
      hasRetryCallback: !!retryCallback,
      waitTime: waitTime
    };
    
    errorLogger.logError(
      typeof error === 'string' ? new Error(error) : error, 
      context, 
      errorLogger.SEVERITY_LEVELS.LOW
    );
    
    if (targetElement) {
      this._showErrorInElement(targetElement, message, canRetry, retryCallback);
    } else {
      this._showGlobalError(message, canRetry, retryCallback);
    }
  }

  /**
   * Hide error message
   * @param {HTMLElement} targetElement - Optional target element to hide error from
   */
  hideError(targetElement = null) {
    this.currentState.error = null;
    
    if (targetElement) {
      this._hideErrorInElement(targetElement);
    } else {
      this._hideGlobalError();
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message or message key
   * @param {HTMLElement} targetElement - Optional target element to show success in
   * @param {number} duration - Duration to show message (ms), 0 for permanent
   */
  showSuccess(message, targetElement = null, duration = 3000) {
    const language = i18n.getCurrentLanguage();
    const successMessage = this.successMessages[language][message] || message;
    
    // Hide loading and error states
    this.hideLoading(targetElement);
    this.hideError(targetElement);
    
    this.currentState.success = successMessage;
    
    if (targetElement) {
      this._showSuccessInElement(targetElement, successMessage, duration);
    } else {
      this._showGlobalSuccess(successMessage, duration);
    }
  }

  /**
   * Hide success message
   * @param {HTMLElement} targetElement - Optional target element to hide success from
   */
  hideSuccess(targetElement = null) {
    this.currentState.success = null;
    
    if (targetElement) {
      this._hideSuccessInElement(targetElement);
    } else {
      this._hideGlobalSuccess();
    }
  }

  /**
   * Show retry options with callback handling
   * @param {Error|string} error - Error that occurred
   * @param {Function} retryCallback - Function to call when retry is clicked
   * @param {HTMLElement} targetElement - Optional target element
   */
  showRetryOptions(error, retryCallback, targetElement = null) {
    this.showError(error, {
      canRetry: true,
      retryCallback: retryCallback,
      targetElement: targetElement
    });
  }

  /**
   * Get current feedback state
   * @returns {Object} Current state object
   */
  getCurrentState() {
    return { ...this.currentState };
  }

  /**
   * Clear all feedback states
   * @param {HTMLElement} targetElement - Optional target element to clear
   */
  clearAll(targetElement = null) {
    this.hideLoading(targetElement);
    this.hideError(targetElement);
    this.hideSuccess(targetElement);
  }

  // Private methods for UI manipulation

  _showLoadingInElement(element, message, operation) {
    const loadingId = this._generateId('loading');
    const loadingHtml = `
      <div id="${loadingId}" class="feedback-loading" data-operation="${operation}">
        <div class="loading-spinner"></div>
        <span class="loading-message">${message}</span>
      </div>
    `;
    
    this._insertFeedbackElement(element, loadingHtml, 'loading');
    this.loadingElements.set(element, loadingId);
  }

  _hideLoadingInElement(element) {
    const loadingId = this.loadingElements.get(element);
    if (loadingId) {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
      this.loadingElements.delete(element);
    }
  }

  _showGlobalLoading(message, operation) {
    // Create or update global loading overlay
    let overlay = document.getElementById('global-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-loading-overlay';
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-center">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-700 dark:text-gray-300">${message}</p>
      </div>
    `;
    
    overlay.style.display = 'flex';
  }

  _hideGlobalLoading() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  _showErrorInElement(element, message, canRetry, retryCallback) {
    const errorId = this._generateId('error');
    const retryButton = canRetry && retryCallback ? 
      `<button type="button" class="retry-button mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" onclick="this.closest('.feedback-error').dispatchEvent(new CustomEvent('retry'))">
        ${i18n.translate('authTryAgain')}
      </button>` : '';
    
    const errorHtml = `
      <div id="${errorId}" class="feedback-error bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm text-red-800">${message}</p>
            ${retryButton}
          </div>
        </div>
      </div>
    `;
    
    this._insertFeedbackElement(element, errorHtml, 'error');
    this.errorElements.set(element, errorId);
    
    // Add retry event listener if callback provided
    if (canRetry && retryCallback) {
      const errorElement = document.getElementById(errorId);
      errorElement.addEventListener('retry', retryCallback);
    }
  }

  _hideErrorInElement(element) {
    const errorId = this.errorElements.get(element);
    if (errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
      this.errorElements.delete(element);
    }
  }

  _showGlobalError(message, canRetry, retryCallback) {
    // Show error in a toast notification or modal
    this._showToast(message, 'error', canRetry ? retryCallback : null);
  }

  _hideGlobalError() {
    // Hide global error toast/modal
    this._hideToast('error');
  }

  _showSuccessInElement(element, message, duration) {
    const successId = this._generateId('success');
    const successHtml = `
      <div id="${successId}" class="feedback-success bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-800">${message}</p>
          </div>
        </div>
      </div>
    `;
    
    this._insertFeedbackElement(element, successHtml, 'success');
    this.successElements.set(element, successId);
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        this._hideSuccessInElement(element);
      }, duration);
    }
  }

  _hideSuccessInElement(element) {
    const successId = this.successElements.get(element);
    if (successId) {
      const successElement = document.getElementById(successId);
      if (successElement) {
        successElement.remove();
      }
      this.successElements.delete(element);
    }
  }

  _showGlobalSuccess(message, duration) {
    this._showToast(message, 'success', null, duration);
  }

  _hideGlobalSuccess() {
    this._hideToast('success');
  }

  _showToast(message, type, retryCallback = null, duration = 3000) {
    const toastId = `toast-${type}-${Date.now()}`;
    const retryButton = retryCallback ? 
      `<button type="button" class="ml-4 px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 transition-colors" onclick="document.getElementById('${toastId}').dispatchEvent(new CustomEvent('retry'))">
        ${i18n.translate('authTryAgain')}
      </button>` : '';
    
    const colorClasses = {
      error: 'bg-red-600 text-white',
      success: 'bg-green-600 text-white',
      info: 'bg-blue-600 text-white'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `fixed top-4 right-4 ${colorClasses[type]} px-6 py-4 rounded-lg shadow-lg z-50 max-w-md transform transition-transform duration-300 translate-x-full`;
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${message}</span>
        ${retryButton}
        <button type="button" class="ml-4 text-white hover:text-gray-200" onclick="this.closest('.fixed').remove()">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Add retry event listener if callback provided
    if (retryCallback) {
      toast.addEventListener('retry', retryCallback);
    }
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.style.transform = 'translateX(full)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, duration);
    }
  }

  _hideToast(type) {
    const toasts = document.querySelectorAll(`[id^="toast-${type}"]`);
    toasts.forEach(toast => {
      toast.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    });
  }

  _insertFeedbackElement(container, html, type) {
    // Remove existing feedback of the same type
    const existing = container.querySelector(`.feedback-${type}`);
    if (existing) {
      existing.remove();
    }
    
    // Insert new feedback at the beginning of the container
    container.insertAdjacentHTML('afterbegin', html);
  }

  _disableFormButtons(disabled) {
    const buttons = document.querySelectorAll('button[type="submit"], .auth-button');
    buttons.forEach(button => {
      button.disabled = disabled;
      if (disabled) {
        button.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        button.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
  }

  _classifyError(error) {
    if (!error) return 'UNKNOWN_ERROR';
    
    const message = error.message || error.toString().toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    
    // Authentication errors
    if (message.includes('invalid_credentials') || message.includes('invalid login')) {
      return 'AUTH_INVALID_CREDENTIALS';
    }
    
    if (message.includes('user_not_found') || message.includes('no user found')) {
      return 'AUTH_USER_NOT_FOUND';
    }
    
    if (message.includes('user_already_registered') || message.includes('already exists')) {
      return 'AUTH_USER_EXISTS';
    }
    
    if (message.includes('weak_password') || message.includes('password too weak')) {
      return 'AUTH_WEAK_PASSWORD';
    }
    
    if (message.includes('rate_limit') || message.includes('too many requests')) {
      return 'AUTH_RATE_LIMITED';
    }
    
    if (message.includes('email_not_confirmed') || message.includes('confirm your email')) {
      return 'EMAIL_NOT_CONFIRMED';
    }
    
    if (message.includes('invalid_email') || message.includes('email format')) {
      return 'INVALID_EMAIL_FORMAT';
    }
    
    // Server errors
    if (message.includes('server') || message.includes('5')) {
      return 'SERVER_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  _generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}