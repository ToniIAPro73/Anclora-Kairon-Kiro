/**
 * Authentication Error Handler
 * Provides centralized error handling for authentication operations
 * Supports error classification, user-friendly messaging, and retry logic
 */

import errorLogger from './errorLogger.js';
import performanceOptimizer from './performanceOptimizer.js';

// Error type constants
export const AUTH_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SUPABASE_UNAVAILABLE: 'SUPABASE_UNAVAILABLE',
  SUPABASE_MAINTENANCE: 'SUPABASE_MAINTENANCE',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_USER_EXISTS: 'AUTH_USER_EXISTS',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
  OAUTH_GOOGLE_ERROR: 'OAUTH_GOOGLE_ERROR',
  OAUTH_GITHUB_ERROR: 'OAUTH_GITHUB_ERROR',
  OAUTH_PROVIDER_UNAVAILABLE: 'OAUTH_PROVIDER_UNAVAILABLE',
  OAUTH_ACCESS_DENIED: 'OAUTH_ACCESS_DENIED',
  OAUTH_POPUP_BLOCKED: 'OAUTH_POPUP_BLOCKED',
  OAUTH_TIMEOUT: 'OAUTH_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages in Spanish
const ERROR_MESSAGES_ES = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: "No se pudo conectar al servidor. Verifica tu conexión a internet.",
  [AUTH_ERROR_TYPES.SUPABASE_UNAVAILABLE]: "El servicio de autenticación no está disponible temporalmente. Inténtalo de nuevo en unos minutos.",
  [AUTH_ERROR_TYPES.SUPABASE_MAINTENANCE]: "El servicio está en mantenimiento. Volveremos pronto. Disculpa las molestias.",
  [AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: "Email o contraseña incorrectos. Verifica que hayas ingresado la información correcta.",
  [AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND]: "No encontramos una cuenta con este email. ¿Quizás quieres crear una cuenta nueva?",
  [AUTH_ERROR_TYPES.AUTH_USER_EXISTS]: "Ya existe una cuenta con este email. ¿Quieres iniciar sesión?",
  [AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD]: "La contraseña debe tener al menos 6 caracteres.",
  [AUTH_ERROR_TYPES.AUTH_RATE_LIMITED]: "Demasiados intentos de inicio de sesión. Por favor espera antes de intentar de nuevo.",
  [AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED]: "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
  [AUTH_ERROR_TYPES.OAUTH_GOOGLE_ERROR]: "Error al iniciar sesión con Google. Inténtalo de nuevo o usa email y contraseña.",
  [AUTH_ERROR_TYPES.OAUTH_GITHUB_ERROR]: "Error al iniciar sesión con GitHub. Inténtalo de nuevo o usa email y contraseña.",
  [AUTH_ERROR_TYPES.OAUTH_PROVIDER_UNAVAILABLE]: "El proveedor de autenticación no está disponible. Inténtalo de nuevo más tarde.",
  [AUTH_ERROR_TYPES.OAUTH_ACCESS_DENIED]: "Acceso denegado. Debes autorizar la aplicación para continuar.",
  [AUTH_ERROR_TYPES.OAUTH_POPUP_BLOCKED]: "La ventana emergente fue bloqueada. Permite ventanas emergentes e inténtalo de nuevo.",
  [AUTH_ERROR_TYPES.OAUTH_TIMEOUT]: "La autenticación tardó demasiado. Inténtalo de nuevo.",
  [AUTH_ERROR_TYPES.SERVER_ERROR]: "Error del servidor. Inténtalo de nuevo en unos momentos.",
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: "Ocurrió un error inesperado. Contacta al soporte si persiste."
};

// Error messages in English
const ERROR_MESSAGES_EN = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: "Could not connect to server. Check your internet connection.",
  [AUTH_ERROR_TYPES.SUPABASE_UNAVAILABLE]: "Authentication service is temporarily unavailable. Please try again in a few minutes.",
  [AUTH_ERROR_TYPES.SUPABASE_MAINTENANCE]: "Service is under maintenance. We'll be back soon. Sorry for the inconvenience.",
  [AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: "Invalid email or password. Please check that you entered the correct information.",
  [AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND]: "No account found with this email address. Would you like to create a new account?",
  [AUTH_ERROR_TYPES.AUTH_USER_EXISTS]: "An account with this email already exists. Want to sign in?",
  [AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD]: "Password must be at least 6 characters long.",
  [AUTH_ERROR_TYPES.AUTH_RATE_LIMITED]: "Too many login attempts. Please wait before trying again.",
  [AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED]: "You must confirm your email before signing in. Check your inbox.",
  [AUTH_ERROR_TYPES.OAUTH_GOOGLE_ERROR]: "Error signing in with Google. Please try again or use email and password.",
  [AUTH_ERROR_TYPES.OAUTH_GITHUB_ERROR]: "Error signing in with GitHub. Please try again or use email and password.",
  [AUTH_ERROR_TYPES.OAUTH_PROVIDER_UNAVAILABLE]: "Authentication provider is unavailable. Please try again later.",
  [AUTH_ERROR_TYPES.OAUTH_ACCESS_DENIED]: "Access denied. You must authorize the application to continue.",
  [AUTH_ERROR_TYPES.OAUTH_POPUP_BLOCKED]: "Popup was blocked. Please allow popups and try again.",
  [AUTH_ERROR_TYPES.OAUTH_TIMEOUT]: "Authentication took too long. Please try again.",
  [AUTH_ERROR_TYPES.SERVER_ERROR]: "Server error. Please try again in a few moments.",
  [AUTH_ERROR_TYPES.UNKNOWN_ERROR]: "An unexpected error occurred. Contact support if it persists."
};

// Retry configuration for different error types
const RETRY_CONFIG = {
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: { allowRetry: true, maxRetries: 3 },
  [AUTH_ERROR_TYPES.SUPABASE_UNAVAILABLE]: { allowRetry: true, maxRetries: 5 }, // More retries for service outages
  [AUTH_ERROR_TYPES.SUPABASE_MAINTENANCE]: { allowRetry: true, maxRetries: 2 }, // Limited retries during maintenance
  [AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS]: { allowRetry: true, maxRetries: 2 }, // Allow limited retries for typos
  [AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND]: { allowRetry: false, maxRetries: 0 }, // No retry needed, user should create account
  [AUTH_ERROR_TYPES.AUTH_USER_EXISTS]: { allowRetry: false, maxRetries: 0 }, // No retry needed, user should login
  [AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD]: { allowRetry: true, maxRetries: 1 },
  [AUTH_ERROR_TYPES.AUTH_RATE_LIMITED]: { allowRetry: true, maxRetries: 0 }, // Special handling with wait time
  [AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED]: { allowRetry: false, maxRetries: 0 }, // User needs to confirm email first
  [AUTH_ERROR_TYPES.OAUTH_GOOGLE_ERROR]: { allowRetry: true, maxRetries: 2 }, // Allow retry for OAuth errors
  [AUTH_ERROR_TYPES.OAUTH_GITHUB_ERROR]: { allowRetry: true, maxRetries: 2 }, // Allow retry for OAuth errors
  [AUTH_ERROR_TYPES.OAUTH_PROVIDER_UNAVAILABLE]: { allowRetry: true, maxRetries: 3 }, // Provider might come back
  [AUTH_ERROR_TYPES.OAUTH_ACCESS_DENIED]: { allowRetry: false, maxRetries: 0 }, // User explicitly denied access
  [AUTH_ERROR_TYPES.OAUTH_POPUP_BLOCKED]: { allowRetry: true, maxRetries: 1 }, // User might enable popups
  [AUTH_ERROR_TYPES.OAUTH_TIMEOUT]: { allowRetry: true, maxRetries: 2 }, // Timeout might be temporary
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
    const startTime = performance.now();
    
    try {
      // Use optimized error classification
      const errorType = performanceOptimizer.optimizeErrorClassification(
        error, 
        (err) => this.classifyError(err)
      );
      
      const language = context.language || this.defaultLanguage;
      const userMessage = this.generateUserMessage(errorType, language);
      
      // Use optimized retry calculation
      const totalElapsedMs = context.totalElapsedMs || 0;
      const optimizedRetryInfo = performanceOptimizer.optimizeRetryDelay(
        context.attemptCount || 0,
        errorType,
        totalElapsedMs
      );
      
      const retryInfo = this.getRetryInfo(errorType, context.attemptCount || 0);

      const processedError = {
        type: errorType,
        originalError: error,
        userMessage,
        canRetry: retryInfo.canRetry && optimizedRetryInfo.shouldRetry,
        maxRetries: retryInfo.maxRetries,
        optimizedDelay: optimizedRetryInfo.delay,
        remainingTime: optimizedRetryInfo.remainingTime,
        context: {
          operation: context.operation || 'unknown',
          timestamp: new Date().toISOString(),
          attemptCount: context.attemptCount || 0,
          totalElapsedMs: totalElapsedMs,
          ...context
        }
      };

      // Log the error with appropriate severity based on error type
      const severity = this.getSeverityForErrorType(errorType);
      errorLogger.logError(error, processedError.context, severity);

      // Record performance metrics
      const duration = performance.now() - startTime;
      performanceOptimizer.performanceMonitor.recordMetric('errorHandlingTime', duration, {
        errorType,
        hasRetry: processedError.canRetry,
        operation: context.operation
      });

      return processedError;
    } catch (handlingError) {
      // Fallback to basic error handling if optimization fails
      const duration = performance.now() - startTime;
      performanceOptimizer.performanceMonitor.recordMetric('errorHandlingTime', duration, {
        error: true,
        fallback: true,
        errorMessage: handlingError.message
      });
      
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

    // Supabase service unavailable errors
    if (
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('supabase unavailable') ||
      errorMessage.includes('backend unavailable') ||
      errorMessage.includes('auth service down') ||
      errorCode === 'SERVICE_UNAVAILABLE' ||
      error.status === 503 ||
      (error.status >= 502 && error.status <= 504)
    ) {
      return AUTH_ERROR_TYPES.SUPABASE_UNAVAILABLE;
    }

    // Supabase maintenance errors
    if (
      errorMessage.includes('maintenance') ||
      errorMessage.includes('scheduled downtime') ||
      errorMessage.includes('temporarily unavailable') ||
      errorCode === 'MAINTENANCE_MODE' ||
      error.status === 503 && errorMessage.includes('maintenance')
    ) {
      return AUTH_ERROR_TYPES.SUPABASE_MAINTENANCE;
    }

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

    // OAuth-specific errors
    if (
      errorMessage.includes('oauth') ||
      errorMessage.includes('google') && errorMessage.includes('auth') ||
      errorMessage.includes('github') && errorMessage.includes('auth') ||
      errorCode.includes('oauth')
    ) {
      // Google OAuth errors
      if (errorMessage.includes('google') || errorCode.includes('google')) {
        if (errorMessage.includes('access_denied') || errorMessage.includes('denied')) {
          return AUTH_ERROR_TYPES.OAUTH_ACCESS_DENIED;
        }
        if (errorMessage.includes('popup') && errorMessage.includes('blocked')) {
          return AUTH_ERROR_TYPES.OAUTH_POPUP_BLOCKED;
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          return AUTH_ERROR_TYPES.OAUTH_TIMEOUT;
        }
        return AUTH_ERROR_TYPES.OAUTH_GOOGLE_ERROR;
      }
      
      // GitHub OAuth errors
      if (errorMessage.includes('github') || errorCode.includes('github')) {
        if (errorMessage.includes('access_denied') || errorMessage.includes('denied')) {
          return AUTH_ERROR_TYPES.OAUTH_ACCESS_DENIED;
        }
        if (errorMessage.includes('popup') && errorMessage.includes('blocked')) {
          return AUTH_ERROR_TYPES.OAUTH_POPUP_BLOCKED;
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          return AUTH_ERROR_TYPES.OAUTH_TIMEOUT;
        }
        return AUTH_ERROR_TYPES.OAUTH_GITHUB_ERROR;
      }
      
      // Generic OAuth errors
      if (errorMessage.includes('access_denied') || errorMessage.includes('denied')) {
        return AUTH_ERROR_TYPES.OAUTH_ACCESS_DENIED;
      }
      if (errorMessage.includes('popup') && errorMessage.includes('blocked')) {
        return AUTH_ERROR_TYPES.OAUTH_POPUP_BLOCKED;
      }
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return AUTH_ERROR_TYPES.OAUTH_TIMEOUT;
      }
      if (errorMessage.includes('provider') && errorMessage.includes('unavailable')) {
        return AUTH_ERROR_TYPES.OAUTH_PROVIDER_UNAVAILABLE;
      }
    }

    // Supabase specific error codes
    if (errorCode === 'invalid_credentials' || 
        errorMessage.includes('invalid login credentials') ||
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('authentication failed')) {
      return AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS;
    }

    if (errorCode === 'user_not_found' || 
        errorMessage.includes('user not found') ||
        errorMessage.includes('no user found') ||
        errorMessage.includes('user does not exist')) {
      return AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND;
    }

    if (errorCode === 'user_already_registered' || 
        errorMessage.includes('user already registered') ||
        errorMessage.includes('email already exists') ||
        errorMessage.includes('already in use')) {
      return AUTH_ERROR_TYPES.AUTH_USER_EXISTS;
    }

    if (errorCode === 'weak_password' || 
        (errorMessage.includes('password') && errorMessage.includes('weak')) ||
        errorMessage.includes('password too short') ||
        errorMessage.includes('password requirements')) {
      return AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD;
    }

    if (errorCode === 'too_many_requests' || 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many attempts') ||
        errorMessage.includes('temporarily blocked') ||
        errorMessage.includes('rate exceeded')) {
      return AUTH_ERROR_TYPES.AUTH_RATE_LIMITED;
    }

    if (errorCode === 'email_not_confirmed' || 
        errorMessage.includes('email not confirmed') ||
        errorMessage.includes('confirm your email') ||
        errorMessage.includes('email confirmation required') ||
        errorMessage.includes('unconfirmed email')) {
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

  /**
   * Get appropriate severity level for error type
   * @param {string} errorType - Error type constant
   * @returns {string} Severity level for logging
   */
  getSeverityForErrorType(errorType) {
    // Import severity levels from errorLogger
    const SEVERITY = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    switch (errorType) {
      case AUTH_ERROR_TYPES.NETWORK_ERROR:
        return SEVERITY.HIGH; // Network issues are serious
      case AUTH_ERROR_TYPES.SUPABASE_UNAVAILABLE:
        return SEVERITY.CRITICAL; // Service unavailable needs immediate attention
      case AUTH_ERROR_TYPES.SUPABASE_MAINTENANCE:
        return SEVERITY.MEDIUM; // Maintenance is expected, but should be logged
      case AUTH_ERROR_TYPES.SERVER_ERROR:
        return SEVERITY.CRITICAL; // Server errors need immediate attention
      case AUTH_ERROR_TYPES.AUTH_RATE_LIMITED:
        return SEVERITY.HIGH; // Rate limiting indicates potential abuse
      case AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS:
        return SEVERITY.MEDIUM; // Common user error
      case AUTH_ERROR_TYPES.AUTH_USER_NOT_FOUND:
        return SEVERITY.LOW; // User might be trying to login before registering
      case AUTH_ERROR_TYPES.AUTH_USER_EXISTS:
        return SEVERITY.LOW; // User might be trying to register when already exists
      case AUTH_ERROR_TYPES.AUTH_WEAK_PASSWORD:
        return SEVERITY.LOW; // User input validation error
      case AUTH_ERROR_TYPES.AUTH_EMAIL_NOT_CONFIRMED:
        return SEVERITY.MEDIUM; // User needs to take action
      case AUTH_ERROR_TYPES.OAUTH_GOOGLE_ERROR:
        return SEVERITY.HIGH; // OAuth provider issues need attention
      case AUTH_ERROR_TYPES.OAUTH_GITHUB_ERROR:
        return SEVERITY.HIGH; // OAuth provider issues need attention
      case AUTH_ERROR_TYPES.OAUTH_PROVIDER_UNAVAILABLE:
        return SEVERITY.HIGH; // Provider unavailability is serious
      case AUTH_ERROR_TYPES.OAUTH_ACCESS_DENIED:
        return SEVERITY.LOW; // User choice, not a system error
      case AUTH_ERROR_TYPES.OAUTH_POPUP_BLOCKED:
        return SEVERITY.MEDIUM; // Browser/user configuration issue
      case AUTH_ERROR_TYPES.OAUTH_TIMEOUT:
        return SEVERITY.MEDIUM; // Could be network or provider issue
      case AUTH_ERROR_TYPES.UNKNOWN_ERROR:
        return SEVERITY.HIGH; // Unknown errors need investigation
      default:
        return SEVERITY.MEDIUM; // Default to medium severity
    }
  }
}

// Create singleton instance
export const authErrorHandler = new AuthErrorHandler();
export default authErrorHandler;