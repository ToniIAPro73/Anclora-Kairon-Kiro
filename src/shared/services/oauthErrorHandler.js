/**
 * OAuth Error Handler
 * Handles OAuth provider errors and provides fallback mechanisms
 * Supports Google and GitHub OAuth with fallback to email/password authentication
 */

import { authErrorHandler, AUTH_ERROR_TYPES } from './authErrorHandler.js';
import { UserFeedbackSystem } from './userFeedbackSystem.js';
import errorLogger from './errorLogger.js';

/**
 * OAuth provider constants
 */
export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github'
};

/**
 * OAuth error types
 */
export const OAUTH_ERROR_TYPES = {
  ACCESS_DENIED: 'access_denied',
  POPUP_BLOCKED: 'popup_blocked',
  TIMEOUT: 'timeout',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  NETWORK_ERROR: 'network_error',
  CONFIGURATION_ERROR: 'configuration_error',
  UNKNOWN: 'unknown'
};

/**
 * OAuthErrorHandler class for handling OAuth provider errors
 */
export class OAuthErrorHandler {
  constructor() {
    this.failedProviders = new Set();
    this.providerRetryCount = new Map();
    this.lastProviderError = new Map();
    this.fallbackEnabled = true;
    this.userFeedbackSystem = new UserFeedbackSystem();
    
    // Configuration
    this.config = {
      maxRetryAttempts: 2,
      retryDelayMs: 3000,
      popupTimeoutMs: 30000,
      fallbackToEmailPassword: true,
      showFallbackSuggestion: true,
      logOAuthErrors: true
    };
  }

  /**
   * Handle OAuth error and provide appropriate response
   * @param {Error} error - The OAuth error
   * @param {string} provider - OAuth provider (google, github)
   * @param {Object} context - Additional context
   * @returns {Object} Processed OAuth error information
   */
  handleOAuthError(error, provider, context = {}) {
    const errorType = this.classifyOAuthError(error, provider);
    const language = context.language || 'es';
    
    // Track failed provider
    this.failedProviders.add(provider);
    this.lastProviderError.set(provider, {
      error: error,
      errorType: errorType,
      timestamp: new Date().toISOString()
    });

    // Increment retry count
    const currentRetryCount = this.providerRetryCount.get(provider) || 0;
    this.providerRetryCount.set(provider, currentRetryCount + 1);

    // Process error with auth error handler
    const processedError = authErrorHandler.handleError(error, {
      operation: 'oauth_login',
      provider: provider,
      errorType: errorType,
      attemptCount: currentRetryCount,
      ...context
    });

    // Determine fallback options
    const fallbackOptions = this.getFallbackOptions(provider, errorType, currentRetryCount);

    const result = {
      success: false,
      provider: provider,
      errorType: errorType,
      processedError: processedError,
      canRetry: fallbackOptions.canRetry,
      shouldShowFallback: fallbackOptions.shouldShowFallback,
      fallbackOptions: fallbackOptions,
      retryCount: currentRetryCount,
      timestamp: new Date().toISOString()
    };

    // Log OAuth error if enabled
    if (this.config.logOAuthErrors) {
      errorLogger.logError(error, {
        operation: 'oauth_error',
        provider: provider,
        errorType: errorType,
        retryCount: currentRetryCount,
        fallbackAvailable: fallbackOptions.shouldShowFallback,
        ...context
      }, authErrorHandler.getSeverityForErrorType(processedError.type));
    }

    return result;
  }

  /**
   * Classify OAuth error to determine specific type
   * @param {Error} error - The error to classify
   * @param {string} provider - OAuth provider
   * @returns {string} OAuth error type
   */
  classifyOAuthError(error, provider) {
    if (!error) return OAUTH_ERROR_TYPES.UNKNOWN;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Access denied errors
    if (
      errorMessage.includes('access_denied') ||
      errorMessage.includes('user denied') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('denied') ||
      errorCode === 'access_denied'
    ) {
      return OAUTH_ERROR_TYPES.ACCESS_DENIED;
    }

    // Popup blocked errors
    if (
      errorMessage.includes('popup') && errorMessage.includes('blocked') ||
      errorMessage.includes('popup closed') ||
      errorMessage.includes('window closed') ||
      errorCode === 'popup_blocked'
    ) {
      return OAUTH_ERROR_TYPES.POPUP_BLOCKED;
    }

    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('took too long') ||
      errorCode === 'timeout'
    ) {
      return OAUTH_ERROR_TYPES.TIMEOUT;
    }

    // Provider unavailable errors
    if (
      errorMessage.includes('provider unavailable') ||
      errorMessage.includes('service unavailable') ||
      errorMessage.includes(`${provider} unavailable`) ||
      errorMessage.includes('temporarily unavailable') ||
      error.status === 503
    ) {
      return OAUTH_ERROR_TYPES.PROVIDER_UNAVAILABLE;
    }

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      error.name === 'NetworkError'
    ) {
      return OAUTH_ERROR_TYPES.NETWORK_ERROR;
    }

    // Configuration errors
    if (
      errorMessage.includes('configuration') ||
      errorMessage.includes('client_id') ||
      errorMessage.includes('invalid_client') ||
      errorMessage.includes('redirect_uri') ||
      errorCode === 'invalid_client'
    ) {
      return OAUTH_ERROR_TYPES.CONFIGURATION_ERROR;
    }

    return OAUTH_ERROR_TYPES.UNKNOWN;
  }

  /**
   * Get fallback options for OAuth error
   * @param {string} provider - OAuth provider
   * @param {string} errorType - OAuth error type
   * @param {number} retryCount - Current retry count
   * @returns {Object} Fallback options
   */
  getFallbackOptions(provider, errorType, retryCount) {
    const canRetry = retryCount < this.config.maxRetryAttempts && 
      this.shouldAllowRetry(errorType);
    
    const shouldShowFallback = this.config.fallbackToEmailPassword && 
      this.shouldShowFallback(errorType, retryCount);

    return {
      canRetry: canRetry,
      shouldShowFallback: shouldShowFallback,
      alternativeProviders: this.getAlternativeProviders(provider),
      fallbackMethods: this.getFallbackMethods(errorType),
      retryDelay: this.config.retryDelayMs,
      maxRetries: this.config.maxRetryAttempts
    };
  }

  /**
   * Determine if retry should be allowed for error type
   * @param {string} errorType - OAuth error type
   * @returns {boolean} Whether retry should be allowed
   */
  shouldAllowRetry(errorType) {
    const noRetryTypes = [
      OAUTH_ERROR_TYPES.ACCESS_DENIED,
      OAUTH_ERROR_TYPES.CONFIGURATION_ERROR
    ];
    
    return !noRetryTypes.includes(errorType);
  }

  /**
   * Determine if fallback should be shown
   * @param {string} errorType - OAuth error type
   * @param {number} retryCount - Current retry count
   * @returns {boolean} Whether fallback should be shown
   */
  shouldShowFallback(errorType, retryCount) {
    // Always show fallback for access denied
    if (errorType === OAUTH_ERROR_TYPES.ACCESS_DENIED) {
      return true;
    }

    // Show fallback after max retries for other errors
    if (retryCount >= this.config.maxRetryAttempts) {
      return true;
    }

    // Show fallback immediately for certain error types
    const immediateFallbackTypes = [
      OAUTH_ERROR_TYPES.POPUP_BLOCKED,
      OAUTH_ERROR_TYPES.CONFIGURATION_ERROR
    ];

    return immediateFallbackTypes.includes(errorType);
  }

  /**
   * Get alternative OAuth providers
   * @param {string} failedProvider - The provider that failed
   * @returns {Array} Array of alternative providers
   */
  getAlternativeProviders(failedProvider) {
    const allProviders = [OAUTH_PROVIDERS.GOOGLE, OAUTH_PROVIDERS.GITHUB];
    return allProviders.filter(provider => 
      provider !== failedProvider && !this.failedProviders.has(provider)
    );
  }

  /**
   * Get fallback authentication methods
   * @param {string} errorType - OAuth error type
   * @returns {Array} Array of fallback methods
   */
  getFallbackMethods(errorType) {
    const methods = ['email_password'];

    // Add specific suggestions based on error type
    if (errorType === OAUTH_ERROR_TYPES.POPUP_BLOCKED) {
      methods.unshift('enable_popups');
    }

    return methods;
  }

  /**
   * Show OAuth error with fallback options
   * @param {Object} errorResult - Result from handleOAuthError
   * @param {Object} options - Display options
   */
  showOAuthErrorWithFallback(errorResult, options = {}) {
    const { showFallback = true, showRetry = true } = options;
    
    const message = errorResult.processedError.userMessage;
    const errorOptions = {
      type: 'error',
      persistent: true,
      showRetry: showRetry && errorResult.canRetry,
      retryCallback: options.retryCallback
    };

    // Show the main error
    this.userFeedbackSystem.showError(message, errorOptions);

    // Show fallback suggestion if appropriate
    if (showFallback && errorResult.shouldShowFallback) {
      setTimeout(() => {
        this.showFallbackSuggestion(errorResult, options);
      }, 2000);
    }
  }

  /**
   * Show fallback suggestion to user
   * @param {Object} errorResult - Result from handleOAuthError
   * @param {Object} options - Display options
   */
  showFallbackSuggestion(errorResult, options = {}) {
    const language = options.language || 'es';
    const provider = errorResult.provider;
    
    const messages = {
      es: {
        fallback: `¿Problemas con ${this.getProviderDisplayName(provider)}? Puedes iniciar sesión con email y contraseña.`,
        alternativeProvider: `También puedes intentar con ${this.getAlternativeProviderNames(errorResult.fallbackOptions.alternativeProviders, language)}.`,
        popupBlocked: 'Parece que las ventanas emergentes están bloqueadas. Habilítalas en tu navegador e inténtalo de nuevo.'
      },
      en: {
        fallback: `Having trouble with ${this.getProviderDisplayName(provider)}? You can sign in with email and password.`,
        alternativeProvider: `You can also try ${this.getAlternativeProviderNames(errorResult.fallbackOptions.alternativeProviders, language)}.`,
        popupBlocked: 'It looks like popups are blocked. Please enable them in your browser and try again.'
      }
    };

    const langMessages = messages[language] || messages.es;
    let suggestionMessage = langMessages.fallback;

    // Add specific suggestions based on error type
    if (errorResult.errorType === OAUTH_ERROR_TYPES.POPUP_BLOCKED) {
      suggestionMessage = langMessages.popupBlocked + ' ' + suggestionMessage;
    }

    // Add alternative provider suggestion
    if (errorResult.fallbackOptions.alternativeProviders.length > 0) {
      suggestionMessage += ' ' + langMessages.alternativeProvider;
    }

    this.userFeedbackSystem.showInfo(suggestionMessage, {
      duration: 8000,
      actions: this.getFallbackActions(errorResult, options)
    });
  }

  /**
   * Get fallback action buttons
   * @param {Object} errorResult - Result from handleOAuthError
   * @param {Object} options - Display options
   * @returns {Array} Array of action objects
   */
  getFallbackActions(errorResult, options = {}) {
    const actions = [];
    const language = options.language || 'es';

    // Email/password fallback action
    if (errorResult.fallbackOptions.shouldShowFallback) {
      actions.push({
        text: language === 'en' ? 'Use Email/Password' : 'Usar Email/Contraseña',
        callback: options.emailPasswordCallback || (() => {
          console.log('Email/password fallback triggered');
        }),
        primary: true
      });
    }

    // Alternative provider actions
    errorResult.fallbackOptions.alternativeProviders.forEach(provider => {
      actions.push({
        text: `${language === 'en' ? 'Try' : 'Probar'} ${this.getProviderDisplayName(provider)}`,
        callback: options.alternativeProviderCallback ? 
          () => options.alternativeProviderCallback(provider) :
          () => console.log(`Alternative provider ${provider} triggered`),
        primary: false
      });
    });

    return actions;
  }

  /**
   * Get display name for OAuth provider
   * @param {string} provider - Provider identifier
   * @returns {string} Display name
   */
  getProviderDisplayName(provider) {
    const displayNames = {
      [OAUTH_PROVIDERS.GOOGLE]: 'Google',
      [OAUTH_PROVIDERS.GITHUB]: 'GitHub'
    };
    
    return displayNames[provider] || provider;
  }

  /**
   * Get alternative provider names as string
   * @param {Array} providers - Array of provider identifiers
   * @param {string} language - Language code
   * @returns {string} Formatted provider names
   */
  getAlternativeProviderNames(providers, language = 'es') {
    if (providers.length === 0) return '';
    
    const displayNames = providers.map(p => this.getProviderDisplayName(p));
    
    if (displayNames.length === 1) {
      return displayNames[0];
    }
    
    const connector = language === 'en' ? ' or ' : ' o ';
    return displayNames.slice(0, -1).join(', ') + connector + displayNames[displayNames.length - 1];
  }

  /**
   * Reset provider error state
   * @param {string} provider - Provider to reset (optional, resets all if not provided)
   */
  resetProviderErrors(provider = null) {
    if (provider) {
      this.failedProviders.delete(provider);
      this.providerRetryCount.delete(provider);
      this.lastProviderError.delete(provider);
    } else {
      this.failedProviders.clear();
      this.providerRetryCount.clear();
      this.lastProviderError.clear();
    }
  }

  /**
   * Check if provider has failed recently
   * @param {string} provider - Provider to check
   * @returns {boolean} Whether provider has failed
   */
  hasProviderFailed(provider) {
    return this.failedProviders.has(provider);
  }

  /**
   * Get provider error statistics
   * @returns {Object} Error statistics
   */
  getProviderErrorStats() {
    const stats = {};
    
    for (const [provider, retryCount] of this.providerRetryCount.entries()) {
      const lastError = this.lastProviderError.get(provider);
      stats[provider] = {
        retryCount: retryCount,
        hasFailed: this.failedProviders.has(provider),
        lastError: lastError ? {
          errorType: lastError.errorType,
          timestamp: lastError.timestamp,
          message: lastError.error.message
        } : null
      };
    }
    
    return stats;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}

// Create singleton instance
export const oauthErrorHandler = new OAuthErrorHandler();
export default oauthErrorHandler;