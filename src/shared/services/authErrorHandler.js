/**
 * Authentication Error Handler
 * Provides centralized error handling for authentication operations
 * Supports error classification, user-friendly messaging, and retry logic
 */

// Error type constants
export const AUTH_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_USER_EXISTS: 'AUTH_USER_EXISTS',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages in Spanish
const ERROR_MESSAGES_ES = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: "No se pudo conectar al servidor. Verifica tu conexión a internet.",
  [AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: "Email o contraseña incorrectos. Inténtalo de nuevo.",
  [AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND]: "No encontramos una cuenta con este email.",
  [AUTH_ERROR_TYPES.AUTH_USER_EXISTS]: "Ya existe una cuenta con este email. ¿Quieres iniciar sesión?",
  [AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD]: "La contraseña debe tener al menos 6 caracteres.",
  [AUTH_ERROR_TYPES.AUTH_RATE_LIMITED]: "Demasiados intentos. Espera un momento antes de intentar de nuevo.",
  [AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED]: "Debes confirmar tu email antes de iniciar sesión.",
  [AUTH_ERROR_TYPES.SERVER_ERROR]: "Error del servidor. Inténtalo de nuevo en unos momentos.",
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: "Ocurrió un error inesperado. Contacta al soporte si persiste."
};

// Error messages in English
const ERROR_MESSAGES_EN = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: "Could not connect to server. Check your internet connection.",
  [AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: "Invalid email or password. Please try again.",
  [AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND]: "No account found with this email address.",
  [AUTH_ERROR_TYPES.AUTH_USER_EXISTS]: "An account with this email already exists. Want to sign in?",
  [AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD]: "Password must be at least 6 characters long.",
  [AUTH_ERROR_TYPES.AUTH_RATE_LIMITED]: "Too many attempts. Please wait a moment before trying again.",
  [AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED]: "You must confirm your email before signing in.",
  [AUTH_ERROR_TYPES.SERVER_ERROR]: "Server error. Please try again in a few moments.",
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: "An unexpected error occurred. Contact support if it persists."
};

// Retry configuration for different error types
const RETRY_CONFIG = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: { allowRetry: true, maxRetries: 3 },
  [AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: { allowRetry: true, maxRetries: 3 },
  [AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND]: { allowRetry: false, maxRetries: 0 },
  [AUTH_ERROR_TYPES.AUTH_USER_EXISTS]: { allowRetry: false, maxRetries: 0 },
  [AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD]: { allowRetry: true, maxRetries: 1 },
  [AUTH_ERROR_TYPES.AUTH_RATE_LIMITED]: { allowRetry: true, maxRetries: 1 },
  [AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED]: { allowRetry: false, maxRetries: 0 },
  [AUTH_ERROR_TYPES.SERVER_ERROR]: { allowRetry: true, maxRetries: 3 },
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: { allowRetry: true, maxRetries: 1 }
};

/**
 * AuthErrorHandler class for centralized error handling
 */
export class AuthErrorHandler {
  constructor() {
    this.defaultLanguage = 'es'; // Default to Spanish for Anclora
  }

  /**
   * Handle authentication errors and return processed error information
   * @param {Error} error - The original error
   * @param {Object} context - Additional context about the operation
   * @returns {Object} Processed error information
   */
  handleError(error, context = {}) {
    const errorType = this.classifyError(error);
    const language = context.language || this.defaultLanguage;
    const userMessage = this.generateUserMessage(errorType, language);
    const retryInfo = this.getRetryInfo(errorType, context.attemptCount || 0);

    return {
      type: errorType,
      originalError: error,
      userMessage,
      canRetry: retryInfo.canRetry,
      maxRetries: retryInfo.maxRetries,
      context: {
        operation: context.operation || 'unknown',
        timestamp: new Date().toISOString(),
        attemptCount: context.attemptCount || 0,
        ...context
      }
    };
  }

  /**
   * Classify error based on error message and properties
   * @param {Error} error - The error to classify
   * @returns {string} Error type constant
   */
  classifyError(error) {
    if (!error) {
      return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Network and connectivity errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorCode === 'NETWORK_ERROR' ||
      error.name === 'NetworkError'
    ) {
      return AUTH_ERROR_TYPES.NETWORK_ERROR;
    }

    // Supabase specific error codes
    if (errorCode === 'invalid_credentials' || errorMessage.includes('invalid login credentials')) {
      return AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS;
    }

    if (errorCode === 'user_not_found' || errorMessage.includes('user not found')) {
      return AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND;
    }

    if (errorCode === 'user_already_registered' || errorMessage.includes('user already registered')) {
      return AUTH_ERROR_TYPES.AUTH_USER_EXISTS;
    }

    if (errorCode === 'weak_password' || errorMessage.includes('password') && errorMessage.includes('weak')) {
      return AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD;
    }

    if (errorCode === 'too_many_requests' || errorMessage.includes('rate limit')) {
      return AUTH_ERROR_TYPES.AUTH_RATE_LIMITED;
    }

    if (errorCode === 'email_not_confirmed' || errorMessage.includes('email not confirmed')) {
      return AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED;
    }

    // Generic authentication errors
    if (
      errorMessage.includes('invalid') && (errorMessage.includes('email') || errorMessage.includes('password')) ||
      errorMessage.includes('credenciales inválidas') ||
      errorMessage.includes('invalid credentials')
    ) {
      return AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS;
    }

    if (
      errorMessage.includes('already exists') ||
      errorMessage.includes('ya está registrado') ||
      errorMessage.includes('user already exists')
    ) {
      return AUTH_ERROR_TYPES.AUTH_USER_EXISTS;
    }

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('no encontramos') ||
      errorMessage.includes('user not found')
    ) {
      return AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND;
    }

    // Server errors (5xx status codes)
    if (
      error.status >= 500 ||
      errorMessage.includes('server error') ||
      errorMessage.includes('internal server error') ||
      errorMessage.includes('service unavailable')
    ) {
      return AUTH_ERROR_TYPES.SERVER_ERROR;
    }

    // Default to unknown error
    return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * Generate user-friendly error message
   * @param {string} errorType - Error type constant
   * @param {string} language - Language code ('es' or 'en')
   * @returns {string} User-friendly error message
   */
  generateUserMessage(errorType, language = 'es') {
    const messages = language === 'en' ? ERROR_MESSAGES_EN : ERROR_MESSAGES_ES;
    return messages[errorType] || messages[AUTH_ERROR_TYPES.UNKNOWN_ERROR];
  }

  /**
   * Determine if retry should be allowed for this error type
   * @param {string} errorType - Error type constant
   * @param {number} attemptCount - Current attempt count
   * @returns {Object} Retry information
   */
  getRetryInfo(errorType, attemptCount = 0) {
    const config = RETRY_CONFIG[errorType] || RETRY_CONFIG[AUTH_ERROR_TYPES.UNKNOWN_ERROR];
    
    return {
      canRetry: config.allowRetry && attemptCount < config.maxRetries,
      maxRetries: config.maxRetries,
      remainingRetries: Math.max(0, config.maxRetries - attemptCount)
    };
  }

  /**
   * Check if an error should allow retry based on type and attempt count
   * @param {string} errorType - Error type constant
   * @param {number} attemptCount - Current attempt count
   * @returns {boolean} Whether retry should be allowed
   */
  shouldAllowRetry(errorType, attemptCount = 0) {
    const retryInfo = this.getRetryInfo(errorType, attemptCount);
    return retryInfo.canRetry;
  }

  /**
   * Get all available error types
   * @returns {Object} Error types constants
   */
  getErrorTypes() {
    return AUTH_ERROR_TYPES;
  }

  /**
   * Set default language for error messages
   * @param {string} language - Language code ('es' or 'en')
   */
  setDefaultLanguage(language) {
    if (language === 'es' || language === 'en') {
      this.defaultLanguage = language;
    }
  }

  /**
   * Get available languages
   * @returns {Array} Array of supported language codes
   */
  getSupportedLanguages() {
    return ['es', 'en'];
  }
}

// Create singleton instance
export const authErrorHandler = new AuthErrorHandler();
export default authErrorHandler;