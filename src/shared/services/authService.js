import { supabase } from '../config/supabase.js';
import { authErrorHandler } from './authErrorHandler.js';
import { retryManager } from './retryManager.js';
import { connectionMonitor } from './connectionMonitor.js';
import { supabaseUnavailableHandler } from './supabaseUnavailableHandler.js';
import { networkConnectivityHandler } from './networkConnectivityHandler.js';
import { oauthErrorHandler, OAUTH_PROVIDERS } from './oauthErrorHandler.js';
import errorLogger from './errorLogger.js';

/**
 * Authentication service for handling user authentication
 * Uses Supabase Auth with fallback to mock implementation
 * Enhanced with comprehensive error handling and retry logic
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.isSupabaseEnabled = !!supabase;
    
    // Initialize auth state
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   */
  async initializeAuth() {
    if (this.isSupabaseEnabled) {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      this.session = session;
      this.currentUser = session?.user || null;

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        this.session = session;
        this.currentUser = session?.user || null;
        
        // Handle auth events
        if (event === 'SIGNED_IN') {
          this.handleSignIn(session);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        }
      });
    } else {
      // Fallback to localStorage for mock implementation
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.getCurrentUser();
      }
    }
  }

  /**
   * Handle successful sign in
   */
  async handleSignIn(session) {
    if (!session?.user) return;

    // Check if user profile exists, create if not
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // User profile doesn't exist, create it
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
      }
    }

    // Mark as new user if first time
    if (!userProfile?.onboarding_completed) {
      localStorage.setItem('is_new_user', 'true');
    }
  }

  /**
   * Handle sign out
   */
  handleSignOut() {
    localStorage.removeItem('is_new_user');
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('user_onboarding_data');
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} - User data
   */
  async login(email, password) {
    const startTime = Date.now();
    const context = {
      operation: 'login',
      email: email,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      // Check connectivity before attempting login
      const connectivityResult = await this.checkConnectivityBeforeAuth('login');
      if (!connectivityResult.canProceed) {
        throw new Error(connectivityResult.error || 'Connection check failed');
      }

      if (this.isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw new Error(error.message);
        }

        // Log successful login performance
        const duration = Date.now() - startTime;
        errorLogger.logPerformanceMetric('login', duration, true, {
          provider: 'supabase',
          email: email,
          hasSession: !!data.session
        });

        return data.user;
      } else {
        // Fallback to mock implementation
        const response = await this.mockApiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (response.success) {
          this.currentUser = response.user;
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(this.currentUser));
          
          // Log successful mock login performance
          const duration = Date.now() - startTime;
          errorLogger.logPerformanceMetric('login', duration, true, {
            provider: 'mock',
            email: email
          });

          return response.user;
        } else {
          throw new Error(response.message || 'Error al iniciar sesión');
        }
      }
    } catch (error) {
      // Log login error with context
      errorLogger.logError(error, context, errorLogger.SEVERITY_LEVELS.MEDIUM);
      
      // Log failed login performance
      const duration = Date.now() - startTime;
      errorLogger.logPerformanceMetric('login', duration, false, {
        provider: this.isSupabaseEnabled ? 'supabase' : 'mock',
        email: email,
        errorType: error.message
      });

      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} - User data
   */
  async register(name, email, password) {
    const startTime = Date.now();
    const context = {
      operation: 'register',
      email: email,
      name: name,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      // Check connectivity before attempting registration
      const connectivityResult = await this.checkConnectivityBeforeAuth('register');
      if (!connectivityResult.canProceed) {
        throw new Error(connectivityResult.error || 'Connection check failed');
      }

      if (this.isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        // Mark user as new for onboarding
        localStorage.setItem('is_new_user', 'true');

        // Log successful registration performance
        const duration = Date.now() - startTime;
        errorLogger.logPerformanceMetric('register', duration, true, {
          provider: 'supabase',
          email: email,
          name: name,
          hasUser: !!data.user
        });

        return data.user;
      } else {
        // Fallback to mock implementation
        const response = await this.mockApiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });

        if (response.success) {
          this.currentUser = response.user;
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(this.currentUser));
          localStorage.setItem('is_new_user', 'true');
          
          // Log successful mock registration performance
          const duration = Date.now() - startTime;
          errorLogger.logPerformanceMetric('register', duration, true, {
            provider: 'mock',
            email: email,
            name: name
          });

          return response.user;
        } else {
          throw new Error(response.message || 'Error al crear la cuenta');
        }
      }
    } catch (error) {
      // Log registration error with context
      errorLogger.logError(error, context, errorLogger.SEVERITY_LEVELS.MEDIUM);
      
      // Log failed registration performance
      const duration = Date.now() - startTime;
      errorLogger.logPerformanceMetric('register', duration, false, {
        provider: this.isSupabaseEnabled ? 'supabase' : 'mock',
        email: email,
        name: name,
        errorType: error.message
      });

      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Enhanced register method with comprehensive validation and error handling
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} confirmPassword - Password confirmation
   * @param {Object} options - Additional options (language, enableRetry, etc.)
   * @returns {Promise<Object>} - Result object with user data or error info
   */
  async registerWithValidation(name, email, password, confirmPassword, options = {}) {
    const language = options.language || 'es';
    const enableRetry = options.enableRetry || false;

    // Create the register function with validation
    const registerFunction = async (attemptCount) => {
      const context = {
        operation: 'register',
        email: email,
        language: language,
        attemptCount: attemptCount
      };

      try {
        // Perform comprehensive validation
        const validationResult = this.validateRegistrationData(name, email, password, confirmPassword, language);
        if (!validationResult.isValid) {
          const validationError = new Error('Validation failed');
          validationError.type = 'VALIDATION_ERROR';
          validationError.validationErrors = validationResult.errors;
          throw validationError;
        }

        // Attempt registration
        const user = await this.register(name, email, password);
        return {
          success: true,
          user: user,
          context: context
        };
      } catch (error) {
        if (enableRetry && error.type !== 'VALIDATION_ERROR') {
          // Classify the error to determine retry strategy
          const processedError = authErrorHandler.handleError(error, context);
          
          // Throw with error type for RetryManager to handle
          const enhancedError = new Error(error.message);
          enhancedError.type = processedError.type;
          enhancedError.processedError = processedError;
          enhancedError.context = context;
          enhancedError.validationErrors = error.validationErrors;
          throw enhancedError;
        } else {
          // Direct error handling without retry
          const processedError = authErrorHandler.handleError(error, context);
          return {
            success: false,
            error: processedError,
            validationErrors: error.validationErrors,
            context: context
          };
        }
      }
    };

    if (enableRetry) {
      try {
        // Use RetryManager for retry logic
        const result = await retryManager.executeWithRetry(
          registerFunction,
          options.errorType || authErrorHandler.getErrorTypes().NETWORK_ERROR,
          { maxRetries: options.maxRetries }
        );

        if (result.success) {
          return result.result;
        } else {
          // Extract the processed error from the last attempt
          const lastError = result.error;
          const processedError = lastError.processedError || authErrorHandler.handleError(lastError, {
            operation: 'register',
            email: email,
            language: language,
            attemptCount: result.attemptCount
          });

          return {
            success: false,
            error: processedError,
            validationErrors: lastError.validationErrors,
            context: lastError.context || {
              operation: 'register',
              email: email,
              language: language,
              attemptCount: result.attemptCount
            },
            retryInfo: {
              totalAttempts: result.totalAttempts,
              maxRetriesExceeded: result.maxRetriesExceeded
            }
          };
        }
      } catch (error) {
        // Fallback error handling
        const processedError = authErrorHandler.handleError(error, {
          operation: 'register',
          email: email,
          language: language,
          attemptCount: 0
        });

        return {
          success: false,
          error: processedError,
          validationErrors: error.validationErrors,
          context: {
            operation: 'register',
            email: email,
            language: language,
            attemptCount: 0
          }
        };
      }
    } else {
      // Execute without retry
      return await registerFunction(0);
    }
  }

  /**
   * Validate registration data with comprehensive checks
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} confirmPassword - Password confirmation
   * @param {string} language - Language for error messages
   * @returns {Object} - Validation result with errors
   */
  validateRegistrationData(name, email, password, confirmPassword, language = 'es') {
    const errors = {};
    const messages = {
      es: {
        nameRequired: 'El nombre es requerido',
        nameLength: 'El nombre debe tener entre 2 y 50 caracteres',
        emailRequired: 'El email es requerido',
        emailInvalid: 'Por favor ingresa un email válido',
        passwordRequired: 'La contraseña es requerida',
        passwordWeak: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números',
        passwordMismatch: 'Las contraseñas no coinciden',
        confirmPasswordRequired: 'Debes confirmar tu contraseña'
      },
      en: {
        nameRequired: 'Name is required',
        nameLength: 'Name must be between 2 and 50 characters',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
        passwordRequired: 'Password is required',
        passwordWeak: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers',
        passwordMismatch: 'Passwords do not match',
        confirmPasswordRequired: 'You must confirm your password'
      }
    };

    const msg = messages[language] || messages.es;

    // Name validation
    if (!name || typeof name !== 'string') {
      errors.name = msg.nameRequired;
    } else {
      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        errors.name = msg.nameLength;
      }
    }

    // Email validation
    if (!email || typeof email !== 'string') {
      errors.email = msg.emailRequired;
    } else {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = msg.emailInvalid;
      }
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      errors.password = msg.passwordRequired;
    } else {
      // Enhanced password validation
      const hasMinLength = password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);

      if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumbers) {
        errors.password = msg.passwordWeak;
      }
    }

    // Confirm password validation
    if (!confirmPassword || typeof confirmPassword !== 'string') {
      errors.confirmPassword = msg.confirmPasswordRequired;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = msg.passwordMismatch;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Login with Google OAuth
   * @param {Object} options - OAuth options
   * @returns {Promise<object>} - User data
   */
  async loginWithGoogle(options = {}) {
    return await this.loginWithOAuth(OAUTH_PROVIDERS.GOOGLE, options);
  }

  /**
   * Login with GitHub OAuth
   * @param {Object} options - OAuth options
   * @returns {Promise<object>} - User data
   */
  async loginWithGitHub(options = {}) {
    return await this.loginWithOAuth(OAUTH_PROVIDERS.GITHUB, options);
  }

  /**
   * Generic OAuth login with comprehensive error handling
   * @param {string} provider - OAuth provider (google, github)
   * @param {Object} options - OAuth options
   * @returns {Promise<object>} - User data or error result
   */
  async loginWithOAuth(provider, options = {}) {
    const startTime = Date.now();
    const context = {
      operation: 'oauth_login',
      provider: provider,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      language: options.language || 'es'
    };

    try {
      // Check connectivity before OAuth attempt - DISABLED for OAuth to work
      // const connectivityResult = await this.checkConnectivityBeforeAuth('oauth_login');
      // if (!connectivityResult.canProceed) {
      //   throw new Error(connectivityResult.error || 'Connection check failed');
      // }

      if (this.isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            ...options.oauthOptions
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        // Log successful OAuth initiation
        const duration = Date.now() - startTime;
        errorLogger.logPerformanceMetric('oauth_login', duration, true, {
          provider: provider,
          supabaseProvider: 'supabase',
          redirectTo: `${window.location.origin}/auth/callback`
        });

        // OAuth redirect will handle the rest
        return data;
      } else {
        // Fallback to mock implementation
        const response = await this.mockApiCall(`/auth/${provider}`, {
          method: 'POST',
          body: JSON.stringify({ provider: provider })
        });

        if (response.success) {
          this.currentUser = response.user;
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(this.currentUser));
          
          // Log successful mock OAuth
          const duration = Date.now() - startTime;
          errorLogger.logPerformanceMetric('oauth_login', duration, true, {
            provider: provider,
            supabaseProvider: 'mock'
          });

          return response.user;
        } else {
          throw new Error(response.message || `Error en autenticación con ${provider}`);
        }
      }
    } catch (error) {
      // Handle OAuth error with specialized handler
      const oauthErrorResult = oauthErrorHandler.handleOAuthError(error, provider, context);
      
      // Log failed OAuth performance
      const duration = Date.now() - startTime;
      errorLogger.logPerformanceMetric('oauth_login', duration, false, {
        provider: provider,
        supabaseProvider: this.isSupabaseEnabled ? 'supabase' : 'mock',
        errorType: oauthErrorResult.errorType,
        retryCount: oauthErrorResult.retryCount
      });

      console.error(`${provider} login error:`, error);
      
      // Return structured error result instead of throwing
      if (options.returnErrorResult) {
        return oauthErrorResult;
      }
      
      throw error;
    }
  }

  /**
   * Enhanced OAuth login with error handling and fallback options
   * @param {string} provider - OAuth provider (google, github)
   * @param {Object} options - Enhanced options
   * @returns {Promise<Object>} - Enhanced result with fallback options
   */
  async loginWithOAuthEnhanced(provider, options = {}) {
    const {
      showFallback = true,
      showRetry = true,
      language = 'es',
      fallbackCallback = null,
      retryCallback = null,
      alternativeProviderCallback = null
    } = options;

    try {
      const result = await this.loginWithOAuth(provider, {
        ...options,
        returnErrorResult: true
      });

      // If successful, return the result
      if (result && !result.success === false) {
        return {
          success: true,
          user: result,
          provider: provider
        };
      }

      // Handle OAuth error result
      if (result.success === false) {
        // Show error with fallback options
        oauthErrorHandler.showOAuthErrorWithFallback(result, {
          showFallback: showFallback,
          showRetry: showRetry,
          language: language,
          retryCallback: retryCallback ? () => retryCallback(provider) : null,
          emailPasswordCallback: fallbackCallback,
          alternativeProviderCallback: alternativeProviderCallback
        });

        return {
          success: false,
          error: result.processedError,
          provider: provider,
          fallbackOptions: result.fallbackOptions,
          canRetry: result.canRetry,
          shouldShowFallback: result.shouldShowFallback
        };
      }

      return result;

    } catch (error) {
      // Handle unexpected errors
      const oauthErrorResult = oauthErrorHandler.handleOAuthError(error, provider, {
        language: language,
        operation: 'oauth_login_enhanced'
      });

      if (showFallback) {
        oauthErrorHandler.showOAuthErrorWithFallback(oauthErrorResult, {
          showFallback: showFallback,
          showRetry: showRetry,
          language: language,
          retryCallback: retryCallback ? () => retryCallback(provider) : null,
          emailPasswordCallback: fallbackCallback,
          alternativeProviderCallback: alternativeProviderCallback
        });
      }

      return {
        success: false,
        error: oauthErrorResult.processedError,
        provider: provider,
        fallbackOptions: oauthErrorResult.fallbackOptions,
        canRetry: oauthErrorResult.canRetry,
        shouldShowFallback: oauthErrorResult.shouldShowFallback
      };
    }
  }

  /**
   * Login with Google OAuth with enhanced error handling
   * @param {Object} options - Enhanced options
   * @returns {Promise<Object>} - Enhanced result
   */
  async loginWithGoogleEnhanced(options = {}) {
    return await this.loginWithOAuthEnhanced(OAUTH_PROVIDERS.GOOGLE, options);
  }

  /**
   * Login with GitHub OAuth with enhanced error handling
   * @param {Object} options - Enhanced options
   * @returns {Promise<Object>} - Enhanced result
   */
  async loginWithGitHubEnhanced(options = {}) {
    return await this.loginWithOAuthEnhanced(OAUTH_PROVIDERS.GITHUB, options);
  }

  /**
   * Reset password with enhanced error handling and diagnostics
   * @param {string} email - User email
   * @param {Object} options - Additional options (language, diagnostics, etc.)
   * @returns {Promise<Object>} - Detailed result with success status and diagnostics
   */
  async resetPassword(email, options = {}) {
    const startTime = Date.now();
    const language = options.language || 'es';
    const enableDiagnostics = options.enableDiagnostics !== false;
    
    const context = {
      operation: 'reset_password',
      email: email,
      language: language,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const messages = {
      es: {
        success: 'Email de recuperación enviado. Revisa tu bandeja de entrada y carpeta de spam.',
        rateLimited: 'Demasiados intentos. Espera 15 minutos e intenta nuevamente.',
        userNotFound: 'No encontramos una cuenta con este email. ¿Quieres registrarte?',
        networkError: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
        configError: 'Error de configuración del sistema. Contacta al soporte.',
        unknownError: 'Error inesperado. Contacta al soporte si persiste.',
        checkSpam: 'Si no ves el email, revisa tu carpeta de spam y promociones.',
        emailInstructions: 'El enlace de recuperación expira en 1 hora.'
      },
      en: {
        success: 'Recovery email sent. Check your inbox and spam folder.',
        rateLimited: 'Too many attempts. Please wait 15 minutes and try again.',
        userNotFound: 'No account found with this email. Would you like to sign up?',
        networkError: 'Connection error. Check your internet and try again.',
        configError: 'System configuration error. Please contact support.',
        unknownError: 'Unexpected error. Contact support if it persists.',
        checkSpam: 'If you don\'t see the email, check your spam and promotions folder.',
        emailInstructions: 'The recovery link expires in 1 hour.'
      }
    };

    const msg = messages[language] || messages.es;

    try {
      // Step 1: Validate email format
      if (!email || typeof email !== 'string') {
        throw new Error('Email is required');
      }

      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Invalid email format');
      }

      // Step 2: Check connectivity before attempting reset
      if (enableDiagnostics) {
        const connectivityResult = await this.checkConnectivityBeforeAuth('reset_password');
        if (!connectivityResult.canProceed) {
          const error = new Error(connectivityResult.error || 'Connection check failed');
          error.type = 'NETWORK_ERROR';
          throw error;
        }
      }

      // Step 3: Attempt password reset
      if (this.isSupabaseEnabled) {
        console.log('Sending password reset email to:', email);
        
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password.html`
        });

        if (error) {
          console.error('Supabase resetPasswordForEmail error:', error);
          
          // Classify Supabase errors
          let errorType = 'UNKNOWN_ERROR';
          let userMessage = msg.unknownError;

          if (error.message.includes('rate limit') || error.message.includes('too many')) {
            errorType = 'RATE_LIMITED';
            userMessage = msg.rateLimited;
          } else if (error.message.includes('not found') || error.message.includes('user not found')) {
            errorType = 'USER_NOT_FOUND';
            userMessage = msg.userNotFound;
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorType = 'NETWORK_ERROR';
            userMessage = msg.networkError;
          } else if (error.message.includes('config') || error.message.includes('smtp')) {
            errorType = 'CONFIG_ERROR';
            userMessage = msg.configError;
          }

          const enhancedError = new Error(userMessage);
          enhancedError.type = errorType;
          enhancedError.originalError = error;
          throw enhancedError;
        }

        // Log successful reset request
        const duration = Date.now() - startTime;
        errorLogger.logPerformanceMetric('reset_password', duration, true, {
          provider: 'supabase',
          email: email,
          hasRedirectTo: true
        });

        console.log('✅ Password reset email sent successfully');

        return {
          success: true,
          message: msg.success,
          instructions: [
            msg.checkSpam,
            msg.emailInstructions,
            'Busca emails de: noreply@supabase.co',
            'Si no llega en 5 minutos, revisa la carpeta de spam'
          ],
          diagnostics: enableDiagnostics ? {
            emailSent: true,
            provider: 'supabase',
            timestamp: new Date().toISOString(),
            redirectUrl: `${window.location.origin}/auth/reset-password`,
            duration: Date.now() - startTime
          } : null
        };

      } else {
        // Fallback to mock implementation
        console.log('Using mock implementation for password reset');
        
        const response = await this.mockApiCall('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() })
        });

        if (response.success) {
          // Log successful mock reset
          const duration = Date.now() - startTime;
          errorLogger.logPerformanceMetric('reset_password', duration, true, {
            provider: 'mock',
            email: email
          });

          return {
            success: true,
            message: msg.success,
            instructions: [
              'Modo de desarrollo: Email simulado',
              'En producción recibirías un email real',
              msg.emailInstructions
            ],
            diagnostics: enableDiagnostics ? {
              emailSent: true,
              provider: 'mock',
              timestamp: new Date().toISOString(),
              duration: Date.now() - startTime
            } : null
          };
        } else {
          throw new Error(response.message || 'Error al enviar email de recuperación');
        }
      }

    } catch (error) {
      // Log reset password error with context
      errorLogger.logError(error, context, errorLogger.SEVERITY_LEVELS.MEDIUM);
      
      // Log failed reset performance
      const duration = Date.now() - startTime;
      errorLogger.logPerformanceMetric('reset_password', duration, false, {
        provider: this.isSupabaseEnabled ? 'supabase' : 'mock',
        email: email,
        errorType: error.type || 'UNKNOWN_ERROR',
        errorMessage: error.message
      });

      console.error('Reset password error:', error);

      // Return structured error result
      return {
        success: false,
        error: {
          type: error.type || 'UNKNOWN_ERROR',
          message: error.message || msg.unknownError,
          originalError: error.originalError || error
        },
        troubleshooting: this.generatePasswordResetTroubleshooting(error, email, language),
        diagnostics: enableDiagnostics ? {
          emailSent: false,
          provider: this.isSupabaseEnabled ? 'supabase' : 'mock',
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          errorDetails: {
            type: error.type,
            message: error.message,
            stack: error.stack
          }
        } : null
      };
    }
  }

  /**
   * Generate troubleshooting steps for password reset issues
   * @param {Error} error - The error that occurred
   * @param {string} email - Email address used
   * @param {string} language - Language for messages
   * @returns {Array} - Array of troubleshooting steps
   */
  generatePasswordResetTroubleshooting(error, email, language = 'es') {
    const troubleshooting = {
      es: {
        RATE_LIMITED: [
          'Espera 15-30 minutos antes de intentar nuevamente',
          'Usa una conexión de internet diferente si es urgente',
          'Verifica que estés usando el email correcto'
        ],
        USER_NOT_FOUND: [
          'Verifica que el email esté escrito correctamente',
          'Prueba con variaciones del email (gmail.com vs googlemail.com)',
          'Considera registrar una nueva cuenta si no tienes una'
        ],
        NETWORK_ERROR: [
          'Verifica tu conexión a internet',
          'Intenta desde otra red (datos móviles)',
          'Desactiva VPN temporalmente',
          'Revisa el estado de Supabase en status.supabase.com'
        ],
        CONFIG_ERROR: [
          'Este es un problema del sistema, no tuyo',
          'Contacta al soporte técnico',
          'Incluye la hora exacta del error'
        ],
        UNKNOWN_ERROR: [
          'Revisa tu carpeta de spam en el email',
          'Espera 5-10 minutos por si hay retraso',
          'Intenta con otro navegador',
          'Contacta soporte si persiste'
        ]
      },
      en: {
        RATE_LIMITED: [
          'Wait 15-30 minutes before trying again',
          'Use a different internet connection if urgent',
          'Verify you\'re using the correct email'
        ],
        USER_NOT_FOUND: [
          'Verify the email is spelled correctly',
          'Try email variations (gmail.com vs googlemail.com)',
          'Consider registering a new account if you don\'t have one'
        ],
        NETWORK_ERROR: [
          'Check your internet connection',
          'Try from another network (mobile data)',
          'Temporarily disable VPN',
          'Check Supabase status at status.supabase.com'
        ],
        CONFIG_ERROR: [
          'This is a system issue, not yours',
          'Contact technical support',
          'Include the exact time of the error'
        ],
        UNKNOWN_ERROR: [
          'Check your email spam folder',
          'Wait 5-10 minutes in case of delay',
          'Try with another browser',
          'Contact support if it persists'
        ]
      }
    };

    const steps = troubleshooting[language] || troubleshooting.es;
    const errorType = error.type || 'UNKNOWN_ERROR';
    
    return steps[errorType] || steps.UNKNOWN_ERROR;
  }

  /**
   * Logout user
   */
  async logout() {
    const startTime = Date.now();
    const context = {
      operation: 'logout',
      userId: this.currentUser?.id,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      if (this.isSupabaseEnabled) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout error:', error);
          // Log logout error but don't throw - we still want to clean up locally
          errorLogger.logError(error, context, errorLogger.SEVERITY_LEVELS.MEDIUM);
        }
      } else {
        // Mock implementation cleanup
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }

      this.currentUser = null;
      this.session = null;
      this.handleSignOut();
      
      // Log successful logout performance
      const duration = Date.now() - startTime;
      errorLogger.logPerformanceMetric('logout', duration, true, {
        provider: this.isSupabaseEnabled ? 'supabase' : 'mock',
        userId: context.userId
      });
      
      window.location.href = '/';
    } catch (error) {
      // Log logout error with context
      errorLogger.logError(error, context, errorLogger.SEVERITY_LEVELS.HIGH);
      
      // Log failed logout performance
      const duration = Date.now() - startTime;
      errorLogger.logPerformanceMetric('logout', duration, false, {
        provider: this.isSupabaseEnabled ? 'supabase' : 'mock',
        userId: context.userId,
        errorType: error.message
      });

      console.error('Logout error:', error);
    }
  }

  /**
   * Get current user
   * @returns {object|null} - Current user data
   */
  getCurrentUser() {
    if (this.isSupabaseEnabled) {
      return this.currentUser;
    } else {
      // Fallback to localStorage for mock implementation
      if (this.currentUser) {
        return this.currentUser;
      }

      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          this.currentUser = JSON.parse(userData);
          return this.currentUser;
        } catch (error) {
          console.error('Error parsing user data:', error);
          this.logout();
        }
      }

      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    if (this.isSupabaseEnabled) {
      return !!this.session && !!this.currentUser;
    } else {
      return !!localStorage.getItem('auth_token') && !!this.getCurrentUser();
    }
  }

  /**
   * Check if user is new and needs onboarding
   * @returns {boolean} - New user status
   */
  isNewUser() {
    return localStorage.getItem('is_new_user') === 'true';
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding() {
    localStorage.removeItem('is_new_user');
    localStorage.setItem('onboarding_completed', 'true');

    // Update user profile in Supabase
    if (this.isSupabaseEnabled && this.currentUser) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', this.currentUser.id);

        if (error) {
          console.error('Error updating onboarding status:', error);
        }
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
  }

  /**
   * Get authentication token
   * @returns {string|null} - Auth token
   */
  getToken() {
    if (this.isSupabaseEnabled) {
      return this.session?.access_token || null;
    } else {
      return localStorage.getItem('auth_token');
    }
  }

  /**
   * Enhanced register method with comprehensive error handling and optional retry
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options (language, enableRetry, etc.)
   * @returns {Promise<Object>} - Result object with user data or error info
   */
  async registerWithErrorHandling(name, email, password, options = {}) {
    const language = options.language || 'es';
    const enableRetry = options.enableRetry || false;

    // Create the register function
    const registerFunction = async (attemptCount) => {
      const context = {
        operation: 'register',
        email: email,
        language: language,
        attemptCount: attemptCount
      };

      try {
        const user = await this.register(name, email, password);
        return {
          success: true,
          user: user,
          context: context
        };
      } catch (error) {
        if (enableRetry) {
          // Classify the error to determine retry strategy
          const processedError = authErrorHandler.handleError(error, context);
          
          // Throw with error type for RetryManager to handle
          const enhancedError = new Error(error.message);
          enhancedError.type = processedError.type;
          enhancedError.processedError = processedError;
          enhancedError.context = context;
          throw enhancedError;
        } else {
          // Direct error handling without retry
          const processedError = authErrorHandler.handleError(error, context);
          return {
            success: false,
            error: processedError,
            context: context
          };
        }
      }
    };

    if (enableRetry) {
      try {
        // Use RetryManager for retry logic
        const result = await retryManager.executeWithRetry(
          registerFunction,
          options.errorType || authErrorHandler.getErrorTypes().NETWORK_ERROR,
          { maxRetries: options.maxRetries }
        );

        if (result.success) {
          return result.result;
        } else {
          // Extract the processed error from the last attempt
          const lastError = result.error;
          const processedError = lastError.processedError || authErrorHandler.handleError(lastError, {
            operation: 'register',
            email: email,
            language: language,
            attemptCount: result.attemptCount
          });

          return {
            success: false,
            error: processedError,
            context: lastError.context || {
              operation: 'register',
              email: email,
              language: language,
              attemptCount: result.attemptCount
            },
            retryInfo: {
              totalAttempts: result.totalAttempts,
              maxRetriesExceeded: result.maxRetriesExceeded
            }
          };
        }
      } catch (error) {
        // Fallback error handling
        const processedError = authErrorHandler.handleError(error, {
          operation: 'register',
          email: email,
          language: language,
          attemptCount: 0
        });

        return {
          success: false,
          error: processedError,
          context: {
            operation: 'register',
            email: email,
            language: language,
            attemptCount: 0
          }
        };
      }
    } else {
      // Execute without retry
      return await registerFunction(0);
    }
  }

  /**
   * Enhanced login method with automatic retry logic using RetryManager
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options (maxRetries, language, etc.)
   * @returns {Promise<Object>} - Result object with user data or error info
   */
  async loginWithRetry(email, password, options = {}) {
    const language = options.language || 'es';
    
    // Create the login function that will be retried
    const loginFunction = async (attemptCount) => {
      const context = {
        operation: 'login',
        email: email,
        language: language,
        attemptCount: attemptCount
      };

      try {
        const user = await this.login(email, password);
        return {
          success: true,
          user: user,
          context: context
        };
      } catch (error) {
        // Classify the error to determine retry strategy
        const processedError = authErrorHandler.handleError(error, context);
        
        // Throw with error type for RetryManager to handle
        const enhancedError = new Error(error.message);
        enhancedError.type = processedError.type;
        enhancedError.processedError = processedError;
        enhancedError.context = context;
        throw enhancedError;
      }
    };

    try {
      // Use RetryManager to execute with appropriate retry strategy
      // Default to NETWORK_ERROR type if not specified, RetryManager will handle classification
      const result = await retryManager.executeWithRetry(
        loginFunction,
        options.errorType || authErrorHandler.getErrorTypes().NETWORK_ERROR,
        { maxRetries: options.maxRetries }
      );

      if (result.success) {
        return result.result;
      } else {
        // Extract the processed error from the last attempt
        const lastError = result.error;
        const processedError = lastError.processedError || authErrorHandler.handleError(lastError, {
          operation: 'login',
          email: email,
          language: language,
          attemptCount: result.attemptCount
        });

        return {
          success: false,
          error: processedError,
          context: lastError.context || {
            operation: 'login',
            email: email,
            language: language,
            attemptCount: result.attemptCount
          },
          retryInfo: {
            totalAttempts: result.totalAttempts,
            maxRetriesExceeded: result.maxRetriesExceeded
          }
        };
      }
    } catch (error) {
      // Fallback error handling if RetryManager fails
      const processedError = authErrorHandler.handleError(error, {
        operation: 'login',
        email: email,
        language: language,
        attemptCount: 0
      });

      return {
        success: false,
        error: processedError,
        context: {
          operation: 'login',
          email: email,
          language: language,
          attemptCount: 0
        }
      };
    }
  }

  /**
   * Check connectivity with Supabase
   * @returns {Promise<Object>} - Connectivity status and details
   */
  async checkConnectivity() {
    const context = {
      operation: 'connectivity_check',
      timestamp: new Date().toISOString()
    };

    try {
      if (this.isSupabaseEnabled) {
        // Try to get the current session as a connectivity test
        const startTime = Date.now();
        const { data, error } = await supabase.auth.getSession();
        const latency = Date.now() - startTime;

        if (error) {
          throw error;
        }

        return {
          success: true,
          connected: true,
          latency: latency,
          supabaseAvailable: true,
          context: context
        };
      } else {
        // For mock implementation, simulate connectivity check
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
        const latency = Date.now() - startTime;

        return {
          success: true,
          connected: true,
          latency: latency,
          supabaseAvailable: false,
          mockMode: true,
          context: context
        };
      }
    } catch (error) {
      const processedError = authErrorHandler.handleError(error, context);
      return {
        success: false,
        connected: false,
        supabaseAvailable: false,
        error: processedError,
        context: context
      };
    }
  }

  /**
   * Check connectivity before performing auth operations
   * @param {string} operation - The operation being performed
   * @returns {Promise<Object>} - Connectivity check result with recommendation
   */
  async checkConnectivityBeforeAuth(operation) {
    try {
      // First check network connectivity
      const networkStatus = networkConnectivityHandler.getNetworkStatus();
      if (!networkStatus.isOnline) {
        return {
          canProceed: false,
          status: 'network_offline',
          error: 'No network connection available',
          errorType: 'NETWORK_ERROR',
          shouldRetry: true,
          canQueue: true,
          networkStatus: networkStatus,
          timestamp: new Date().toISOString(),
          operation: operation
        };
      }

      // Check if service is known to be unavailable
      if (!supabaseUnavailableHandler.isServiceAvailable()) {
        const serviceStatus = supabaseUnavailableHandler.getServiceStatus();
        
        return {
          canProceed: false,
          status: 'service_unavailable',
          error: `Service is currently ${serviceStatus.status.toLowerCase()}`,
          errorType: serviceStatus.status === 'MAINTENANCE' ? 'SUPABASE_MAINTENANCE' : 'SUPABASE_UNAVAILABLE',
          shouldRetry: true,
          canQueue: true,
          serviceStatus: serviceStatus,
          timestamp: new Date().toISOString(),
          operation: operation
        };
      }

      // Use ConnectionMonitor for comprehensive connectivity check
      const healthResult = await connectionMonitor.isSupabaseAvailable({
        timeout: 5000, // 5 second timeout for auth operations
        retryAttempts: 1 // Single attempt for pre-auth check
      });

      if (healthResult.available) {
        return {
          canProceed: true,
          status: 'connected',
          latency: healthResult.latency,
          timestamp: healthResult.timestamp,
          networkStatus: networkStatus
        };
      } else {
        // Connection not available, determine if we should retry or fail
        const errorType = authErrorHandler.classifyError(healthResult.error);
        const shouldRetry = authErrorHandler.shouldAllowRetry(errorType, 0);

        // Check if this is a service unavailable scenario
        const isServiceUnavailable = healthResult.isServiceUnavailable || 
          errorType === 'SUPABASE_UNAVAILABLE' || 
          errorType === 'SUPABASE_MAINTENANCE';

        // Check if this is a network connectivity issue
        const isNetworkIssue = errorType === 'NETWORK_ERROR' || 
          healthResult.error?.name === 'NetworkError' ||
          healthResult.error?.message?.includes('fetch');

        return {
          canProceed: false,
          status: isServiceUnavailable ? 'service_unavailable' : 
                  isNetworkIssue ? 'network_error' : 'disconnected',
          error: healthResult.error?.message || 'Connection not available',
          errorType: errorType,
          shouldRetry: shouldRetry,
          canQueue: isServiceUnavailable || isNetworkIssue,
          isServiceUnavailable: isServiceUnavailable,
          isNetworkIssue: isNetworkIssue,
          timestamp: healthResult.timestamp,
          operation: operation,
          networkStatus: networkStatus
        };
      }
    } catch (error) {
      console.error('Connectivity check failed:', error);
      return {
        canProceed: false,
        status: 'error',
        error: error.message || 'Connectivity check failed',
        timestamp: new Date().toISOString(),
        operation: operation
      };
    }
  }

  /**
   * Enhanced login with automatic retry when connection is restored
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Enhanced login result
   */
  async loginWithConnectionRetry(email, password, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 2000; // 2 seconds
    const language = options.language || 'es';

    let lastError = null;
    let connectivityRestored = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connectivity before each attempt
        const connectivityResult = await this.checkConnectivityBeforeAuth('login');
        
        if (!connectivityResult.canProceed) {
          lastError = new Error(connectivityResult.error);
          
          // If this is not the last attempt, wait for connection to be restored
          if (attempt < maxRetries) {
            console.log(`Login attempt ${attempt} failed due to connectivity. Waiting for connection...`);
            
            // Wait for connection to be restored or timeout
            const connectionRestored = await this.waitForConnectionRestore(retryDelay);
            if (connectionRestored) {
              connectivityRestored = true;
              continue; // Retry the login
            } else {
              // Connection not restored within timeout, continue to next attempt
              continue;
            }
          } else {
            // Last attempt failed
            break;
          }
        }

        // Connection is available, attempt login
        const user = await this.login(email, password);
        
        return {
          success: true,
          user: user,
          attempt: attempt,
          connectivityRestored: connectivityRestored
        };

      } catch (error) {
        lastError = error;
        console.error(`Login attempt ${attempt} failed:`, error);

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All attempts failed
    const processedError = authErrorHandler.handleError(lastError, {
      operation: 'login',
      email: email,
      language: language,
      attemptCount: maxRetries
    });

    return {
      success: false,
      error: processedError,
      totalAttempts: maxRetries,
      connectivityRestored: connectivityRestored
    };
  }

  /**
   * Enhanced register with automatic retry when connection is restored
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Enhanced register result
   */
  async registerWithConnectionRetry(name, email, password, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 2000; // 2 seconds
    const language = options.language || 'es';

    let lastError = null;
    let connectivityRestored = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connectivity before each attempt
        const connectivityResult = await this.checkConnectivityBeforeAuth('register');
        
        if (!connectivityResult.canProceed) {
          lastError = new Error(connectivityResult.error);
          
          // If this is not the last attempt, wait for connection to be restored
          if (attempt < maxRetries) {
            console.log(`Register attempt ${attempt} failed due to connectivity. Waiting for connection...`);
            
            // Wait for connection to be restored or timeout
            const connectionRestored = await this.waitForConnectionRestore(retryDelay);
            if (connectionRestored) {
              connectivityRestored = true;
              continue; // Retry the registration
            } else {
              // Connection not restored within timeout, continue to next attempt
              continue;
            }
          } else {
            // Last attempt failed
            break;
          }
        }

        // Connection is available, attempt registration
        const user = await this.register(name, email, password);
        
        return {
          success: true,
          user: user,
          attempt: attempt,
          connectivityRestored: connectivityRestored
        };

      } catch (error) {
        lastError = error;
        console.error(`Register attempt ${attempt} failed:`, error);

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All attempts failed
    const processedError = authErrorHandler.handleError(lastError, {
      operation: 'register',
      email: email,
      language: language,
      attemptCount: maxRetries
    });

    return {
      success: false,
      error: processedError,
      totalAttempts: maxRetries,
      connectivityRestored: connectivityRestored
    };
  }

  /**
   * Wait for connection to be restored
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<boolean>} - Whether connection was restored
   */
  async waitForConnectionRestore(timeoutMs) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = 1000; // Check every second

      const checkConnection = async () => {
        try {
          const healthResult = await connectionMonitor.isSupabaseAvailable({
            timeout: 3000,
            retryAttempts: 1
          });

          if (healthResult.available) {
            resolve(true);
            return;
          }

          // Check if timeout exceeded
          if (Date.now() - startTime >= timeoutMs) {
            resolve(false);
            return;
          }

          // Schedule next check
          setTimeout(checkConnection, checkInterval);
        } catch (error) {
          // Check if timeout exceeded
          if (Date.now() - startTime >= timeoutMs) {
            resolve(false);
            return;
          }

          // Schedule next check
          setTimeout(checkConnection, checkInterval);
        }
      };

      // Start checking
      checkConnection();
    });
  }

  /**
   * Mock API call for development
   * Replace this with real API implementation
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   * @returns {Promise<object>} - API response
   */
  async mockApiCall(endpoint, options = {}) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { method = 'GET', body } = options;
    const data = body ? JSON.parse(body) : {};

    // Mock responses based on endpoint
    switch (endpoint) {
      case '/auth/login':
        if (data.email === 'demo@anclora.com' && data.password === 'demo123') {
          return {
            success: true,
            token: 'mock_token_' + Date.now(),
            user: {
              id: '1',
              name: 'Usuario Demo',
              email: data.email,
              avatar: null,
              provider: 'email'
            }
          };
        } else {
          return {
            success: false,
            message: 'Credenciales inválidas'
          };
        }

      case '/auth/register':
        // Simulate email already exists check
        if (data.email === 'existing@example.com') {
          return {
            success: false,
            message: 'Este email ya está registrado'
          };
        }
        
        return {
          success: true,
          token: 'mock_token_' + Date.now(),
          user: {
            id: Date.now().toString(),
            name: data.name,
            email: data.email,
            avatar: null,
            provider: 'email'
          }
        };

      case '/auth/reset-password':
        return {
          success: true,
          message: 'Email de recuperación enviado'
        };

      case '/auth/google':
        return {
          success: true,
          token: 'mock_google_token_' + Date.now(),
          user: {
            id: 'google_' + Date.now(),
            name: 'Usuario Google',
            email: 'usuario@gmail.com',
            avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
            provider: 'google'
          }
        };

      case '/auth/github':
        return {
          success: true,
          token: 'mock_github_token_' + Date.now(),
          user: {
            id: 'github_' + Date.now(),
            name: 'Usuario GitHub',
            email: 'usuario@github.com',
            avatar: 'https://github.com/identicons/sample.png',
            provider: 'github'
          }
        };

      default:
        return {
          success: false,
          message: 'Endpoint no encontrado'
        };
    }
  }
  /**
   * Handle authentication operation with connectivity issues (network and service)
   * @param {Function} operation - The auth operation to execute
   * @param {Object} context - Operation context
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Operation result
   */
  async handleAuthWithConnectivityIssues(operation, context, options = {}) {
    const { allowQueue = true, showFeedback = true } = options;

    try {
      // Check connectivity first
      const connectivityResult = await this.checkConnectivityBeforeAuth(context.operation);

      if (connectivityResult.canProceed) {
        // Service is available, execute operation normally
        return await operation();
      }

      // Handle different types of connectivity issues
      if (connectivityResult.canQueue && allowQueue) {
        let queueHandler, queueMessage;

        if (connectivityResult.status === 'network_offline' || connectivityResult.isNetworkIssue) {
          // Network connectivity issue - use network handler
          queueHandler = networkConnectivityHandler;
          queueMessage = context.language === 'en' ? 
            'Operation queued. We\'ll retry automatically when network connection is restored.' :
            'Operación en cola. Reintentaremos automáticamente cuando se restaure la conexión de red.';
        } else if (connectivityResult.isServiceUnavailable) {
          // Service unavailable - use service handler
          queueHandler = supabaseUnavailableHandler;
          queueMessage = context.language === 'en' ? 
            'Operation queued. We\'ll retry automatically when service is restored.' :
            'Operación en cola. Reintentaremos automáticamente cuando el servicio se restaure.';
        }

        if (queueHandler) {
          // Show feedback if requested
          if (showFeedback) {
            const errorMessage = authErrorHandler.generateUserMessage(
              connectivityResult.errorType,
              context.language || 'es'
            );
            console.log(`${errorMessage} ${queueMessage}`);
          }

          // Queue the operation with appropriate handler
          return await queueHandler.queueOperation(operation, context);
        }
      }

      // Cannot queue or queueing not allowed, return error
      const processedError = authErrorHandler.handleError(
        new Error(connectivityResult.error),
        context
      );

      return {
        success: false,
        error: processedError,
        canRetry: connectivityResult.shouldRetry,
        isServiceUnavailable: connectivityResult.isServiceUnavailable,
        isNetworkIssue: connectivityResult.isNetworkIssue,
        connectivityStatus: connectivityResult.status
      };

    } catch (error) {
      // Handle unexpected errors
      const processedError = authErrorHandler.handleError(error, context);
      return {
        success: false,
        error: processedError,
        canRetry: false,
        isServiceUnavailable: false,
        isNetworkIssue: false
      };
    }
  }

  /**
   * Handle authentication operation with Supabase unavailable scenarios (legacy method)
   * @param {Function} operation - The auth operation to execute
   * @param {Object} context - Operation context
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Operation result
   */
  async handleAuthWithUnavailableService(operation, context, options = {}) {
    // Delegate to the enhanced connectivity handler
    return await this.handleAuthWithConnectivityIssues(operation, context, options);
  }

  /**
   * Enhanced login with connectivity issues handling (network and service)
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Login result
   */
  async loginWithConnectivityHandling(email, password, options = {}) {
    const context = {
      operation: 'login',
      email: email,
      language: options.language || 'es',
      timestamp: new Date().toISOString()
    };

    const loginOperation = async () => {
      return await this.login(email, password);
    };

    return await this.handleAuthWithConnectivityIssues(loginOperation, context, options);
  }

  /**
   * Enhanced register with connectivity issues handling (network and service)
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Registration result
   */
  async registerWithConnectivityHandling(name, email, password, options = {}) {
    const context = {
      operation: 'register',
      name: name,
      email: email,
      language: options.language || 'es',
      timestamp: new Date().toISOString()
    };

    const registerOperation = async () => {
      return await this.register(name, email, password);
    };

    return await this.handleAuthWithConnectivityIssues(registerOperation, context, options);
  }

  /**
   * Enhanced login with Supabase unavailable handling (legacy method)
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Login result
   */
  async loginWithUnavailableHandling(email, password, options = {}) {
    return await this.loginWithConnectivityHandling(email, password, options);
  }

  /**
   * Enhanced register with Supabase unavailable handling (legacy method)
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Registration result
   */
  async registerWithUnavailableHandling(name, email, password, options = {}) {
    return await this.registerWithConnectivityHandling(name, email, password, options);
  }

  /**
   * Check if network is currently available
   * @returns {boolean} Network availability status
   */
  isNetworkAvailable() {
    return networkConnectivityHandler.isNetworkAvailable();
  }

  /**
   * Check if Supabase service is currently available
   * @returns {boolean} Service availability status
   */
  isSupabaseServiceAvailable() {
    return supabaseUnavailableHandler.isServiceAvailable();
  }

  /**
   * Get current network status information
   * @returns {Object} Network status information
   */
  getNetworkStatus() {
    return networkConnectivityHandler.getNetworkStatus();
  }

  /**
   * Get current service status information
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    return supabaseUnavailableHandler.getServiceStatus();
  }

  /**
   * Get comprehensive connectivity status (network + service)
   * @returns {Object} Complete connectivity status
   */
  getConnectivityStatus() {
    return {
      network: this.getNetworkStatus(),
      service: this.getServiceStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Manually trigger network connectivity check
   * @returns {Promise<Object>} Network check result
   */
  async checkNetworkConnectivity() {
    return await networkConnectivityHandler.forceConnectivityCheck();
  }

  /**
   * Manually trigger service availability check
   * @returns {Promise<Object>} Service check result
   */
  async checkServiceAvailability() {
    return await supabaseUnavailableHandler.checkServiceAvailability();
  }

  /**
   * Add listener for network status changes
   * @param {string} eventType - Event type
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  onNetworkStatusChange(eventType, callback) {
    return networkConnectivityHandler.addEventListener(eventType, callback);
  }

  /**
   * Add listener for service status changes
   * @param {string} eventType - Event type
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  onServiceStatusChange(eventType, callback) {
    return supabaseUnavailableHandler.addEventListener(eventType, callback);
  }

  /**
   * Get OAuth provider error statistics
   * @returns {Object} OAuth error statistics
   */
  getOAuthErrorStats() {
    return oauthErrorHandler.getProviderErrorStats();
  }

  /**
   * Reset OAuth provider errors
   * @param {string} provider - Provider to reset (optional)
   */
  resetOAuthErrors(provider = null) {
    oauthErrorHandler.resetProviderErrors(provider);
  }

  /**
   * Check if OAuth provider has failed recently
   * @param {string} provider - Provider to check
   * @returns {boolean} Whether provider has failed
   */
  hasOAuthProviderFailed(provider) {
    return oauthErrorHandler.hasProviderFailed(provider);
  }

  /**
   * Get available OAuth providers (excluding failed ones)
   * @returns {Array} Array of available providers
   */
  getAvailableOAuthProviders() {
    const allProviders = [OAUTH_PROVIDERS.GOOGLE, OAUTH_PROVIDERS.GITHUB];
    return allProviders.filter(provider => !this.hasOAuthProviderFailed(provider));
  }

  /**
   * Get OAuth provider display name
   * @param {string} provider - Provider identifier
   * @returns {string} Display name
   */
  getOAuthProviderDisplayName(provider) {
    return oauthErrorHandler.getProviderDisplayName(provider);
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;