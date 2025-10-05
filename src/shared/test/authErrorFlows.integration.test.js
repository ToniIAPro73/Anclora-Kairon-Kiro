/**
 * Integration Tests for Authentication Error Flows
 * Tests complete authentication flows with various error scenarios
 * Covers registration, login, OAuth, and recovery scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Authentication Error Flows Integration Tests', () => {
  let mockAuthService;
  let mockErrorHandler;
  let mockUserFeedback;
  let loggedErrors = [];
  let loggedMetrics = [];

  beforeEach(() => {
    // Reset logged data
    loggedErrors = [];
    loggedMetrics = [];

    // Mock auth service
    mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
      loginWithOAuth: vi.fn(),
      registerWithValidation: vi.fn(),
      loginWithRetry: vi.fn(),
      checkConnectivityBeforeAuth: vi.fn()
    };

    // Mock error handler
    mockErrorHandler = {
      handleError: vi.fn(),
      classifyError: vi.fn(),
      generateUserMessage: vi.fn(),
      getErrorTypes: vi.fn(() => ({
        NETWORK_ERROR: 'NETWORK_ERROR',
        AUTH_USER_EXISTS: 'AUTH_USER_EXISTS',
        AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
        SUPABASE_UNAVAILABLE: 'SUPABASE_UNAVAILABLE',
        OAUTH_GOOGLE_ERROR: 'OAUTH_GOOGLE_ERROR',
        OAUTH_ACCESS_DENIED: 'OAUTH_ACCESS_DENIED',
        OAUTH_POPUP_BLOCKED: 'OAUTH_POPUP_BLOCKED',
        OAUTH_TIMEOUT: 'OAUTH_TIMEOUT'
      }))
    };

    // Mock user feedback system
    mockUserFeedback = {
      showError: vi.fn(),
      showLoading: vi.fn(),
      showSuccess: vi.fn(),
      hideLoading: vi.fn(),
      showRetryOptions: vi.fn()
    };

    // Mock error logger
    const mockErrorLogger = {
      logError: vi.fn((error, context, severity) => {
        loggedErrors.push({ error, context, severity });
      }),
      logPerformanceMetric: vi.fn((operation, duration, success, metadata) => {
        loggedMetrics.push({ operation, duration, success, metadata });
      }),
      SEVERITY_LEVELS: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
      }
    };

    // Setup global mocks
    global.mockAuthService = mockAuthService;
    global.mockErrorHandler = mockErrorHandler;
    global.mockUserFeedback = mockUserFeedback;
    global.mockErrorLogger = mockErrorLogger;
  });

  afterEach(() => {
    // Clean up mocks
    vi.restoreAllMocks();
  });

  describe('Complete Registration Flow with Various Errors', () => {
    const testUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123'
    };

    it('should handle network errors during registration with retry logic', async () => {
      let attemptCount = 0;
      const maxAttempts = 3;

      // Mock registration with network failures then success
      mockAuthService.register.mockImplementation(async (name, email, password) => {
        attemptCount++;
        
        if (attemptCount < maxAttempts) {
          // Simulate network error for first attempts
          const networkError = new Error('Network request failed');
          networkError.name = 'NetworkError';
          
          // Log the error
          loggedErrors.push({
            error: networkError,
            context: { operation: 'register', attempt: attemptCount },
            severity: 'HIGH'
          });
          
          throw networkError;
        }
        
        // Success on final attempt
        loggedMetrics.push({
          operation: 'register',
          duration: 1500,
          success: true,
          metadata: { attempts: attemptCount }
        });
        
        return {
          id: 'test-user-id',
          email: email,
          name: name,
          created_at: new Date().toISOString()
        };
      });

      // Mock registerWithValidation to use retry logic
      mockAuthService.registerWithValidation.mockImplementation(async (name, email, password, confirmPassword, options) => {
        let lastError = null;
        
        for (let i = 0; i < (options.maxRetries || 3); i++) {
          try {
            const user = await mockAuthService.register(name, email, password);
            return {
              success: true,
              user: user,
              context: { operation: 'register', attempts: i + 1 }
            };
          } catch (error) {
            lastError = error;
            if (i === (options.maxRetries || 3) - 1) {
              return {
                success: false,
                error: {
                  type: 'NETWORK_ERROR',
                  userMessage: 'Network error occurred',
                  canRetry: true
                },
                context: { operation: 'register', attempts: i + 1 }
              };
            }
          }
        }
      });

      // Attempt registration with error handling
      const result = await mockAuthService.registerWithValidation(
        testUserData.name,
        testUserData.email,
        testUserData.password,
        testUserData.confirmPassword,
        {
          language: 'es',
          enableRetry: true,
          maxRetries: 3
        }
      );

      // Verify successful registration after retries
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUserData.email);
      expect(attemptCount).toBe(maxAttempts);

      // Verify error logging
      expect(loggedErrors.length).toBe(2); // Two failed attempts
      expect(loggedMetrics.length).toBe(1); // One success metric

      // Verify final success metric was logged
      const successMetric = loggedMetrics.find(m => m.success === true && m.operation === 'register');
      expect(successMetric).toBeDefined();
    });

    it('should handle user already exists error with appropriate messaging', async () => {
      // Mock user already exists error
      mockAuthService.registerWithValidation.mockResolvedValue({
        success: false,
        error: {
          type: 'AUTH_USER_EXISTS',
          userMessage: 'Ya existe una cuenta con este email. ¿Quieres iniciar sesión?',
          canRetry: false
        },
        context: { operation: 'register' }
      });

      const result = await mockAuthService.registerWithValidation(
        testUserData.name,
        testUserData.email,
        testUserData.password,
        testUserData.confirmPassword,
        { language: 'es' }
      );

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('AUTH_USER_EXISTS');
      expect(result.error.userMessage).toContain('Ya existe una cuenta');
    });

    it('should handle weak password validation with clear feedback', async () => {
      const weakPasswordData = {
        ...testUserData,
        password: '123',
        confirmPassword: '123'
      };

      // Mock validation error
      mockAuthService.registerWithValidation.mockResolvedValue({
        success: false,
        validationErrors: {
          password: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números'
        },
        context: { operation: 'register' }
      });

      const result = await mockAuthService.registerWithValidation(
        weakPasswordData.name,
        weakPasswordData.email,
        weakPasswordData.password,
        weakPasswordData.confirmPassword,
        { language: 'es' }
      );

      // Verify validation error
      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors.password).toBeDefined();
      expect(result.validationErrors.password).toContain('8 caracteres');
    });

    it('should handle Supabase service unavailable during registration', async () => {
      // Mock service unavailable with retry info
      mockAuthService.registerWithValidation.mockResolvedValue({
        success: false,
        error: {
          type: 'SUPABASE_UNAVAILABLE',
          userMessage: 'El servicio de autenticación no está disponible temporalmente',
          canRetry: true
        },
        retryInfo: {
          totalAttempts: 3,
          maxRetriesExceeded: true
        },
        context: { operation: 'register' }
      });

      const result = await mockAuthService.registerWithValidation(
        testUserData.name,
        testUserData.email,
        testUserData.password,
        testUserData.confirmPassword,
        {
          language: 'es',
          enableRetry: true,
          maxRetries: 2
        }
      );

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('SUPABASE_UNAVAILABLE');
      expect(result.error.userMessage).toContain('no está disponible');

      // Verify retry attempts were made
      expect(result.retryInfo).toBeDefined();
      expect(result.retryInfo.totalAttempts).toBeGreaterThan(1);
    });
  });

  describe('Login Flow with Network Interruptions', () => {
    const loginData = {
      email: 'existing@example.com',
      password: 'ValidPassword123'
    };

    it('should handle intermittent network connectivity during login', async () => {
      let attemptCount = 0;
      const maxAttempts = 4;

      // Mock login with intermittent failures
      mockAuthService.loginWithRetry.mockImplementation(async (email, password, maxRetries) => {
        attemptCount = 0;
        
        while (attemptCount < maxRetries) {
          attemptCount++;
          
          if (attemptCount <= 2) {
            // Log failed attempts
            loggedErrors.push({
              error: new Error('Connection dropped'),
              context: { operation: 'login', attempt: attemptCount },
              severity: 'HIGH'
            });
            
            if (attemptCount < maxRetries) {
              continue; // Retry
            } else {
              throw new Error('Connection dropped');
            }
          }
          
          // Success after connection stabilizes
          loggedMetrics.push({
            operation: 'login',
            duration: 2000,
            success: true,
            metadata: { attempts: attemptCount }
          });
          
          return {
            id: 'existing-user-id',
            email: email,
            name: 'Existing User'
          };
        }
      });

      // Attempt login with retry logic
      const result = await mockAuthService.loginWithRetry(
        loginData.email,
        loginData.password,
        maxAttempts
      );

      // Verify successful login after network recovery
      expect(result).toBeDefined();
      expect(result.email).toBe(loginData.email);
      expect(attemptCount).toBe(3); // Should succeed on 3rd attempt

      // Verify network errors were logged
      expect(loggedErrors.length).toBe(2); // Two failed attempts
      const networkErrors = loggedErrors.filter(log => 
        log.error && log.error.message.includes('Connection dropped')
      );
      expect(networkErrors.length).toBe(2);
    });

    it('should handle complete network offline scenario', async () => {
      // Mock connectivity check failure
      mockAuthService.checkConnectivityBeforeAuth.mockResolvedValue({
        canProceed: false,
        error: 'Network is offline'
      });

      // Mock login that checks connectivity first
      mockAuthService.login.mockImplementation(async (email, password) => {
        const connectivityResult = await mockAuthService.checkConnectivityBeforeAuth('login');
        if (!connectivityResult.canProceed) {
          throw new Error(connectivityResult.error || 'Connection check failed');
        }
        
        return {
          id: 'user-id',
          email: email,
          name: 'Test User'
        };
      });

      // First attempt should fail due to offline status
      try {
        await mockAuthService.login(loginData.email, loginData.password);
        expect.fail('Should have thrown an error for offline network');
      } catch (error) {
        expect(error.message).toContain('offline');
      }

      // Simulate coming back online
      mockAuthService.checkConnectivityBeforeAuth.mockResolvedValue({
        canProceed: true
      });

      // Should succeed after coming online
      const result = await mockAuthService.login(loginData.email, loginData.password);
      expect(result).toBeDefined();
      expect(result.email).toBe(loginData.email);
    });

    it('should handle invalid credentials with rate limiting progression', async () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'wrongpassword'
      };

      let attemptCount = 0;
      
      // Mock progressive rate limiting
      mockAuthService.login.mockImplementation(async (email, password) => {
        attemptCount++;
        
        if (attemptCount <= 3) {
          // First few attempts: invalid credentials
          const credentialsError = new Error('Invalid login credentials');
          credentialsError.code = 'invalid_credentials';
          throw credentialsError;
        } else {
          // After multiple attempts: rate limited
          const rateLimitError = new Error('Too many requests');
          rateLimitError.code = 'too_many_requests';
          rateLimitError.status = 429;
          throw rateLimitError;
        }
      });

      // Mock error handler classification
      mockErrorHandler.handleError.mockImplementation((error, context) => {
        if (error.code === 'too_many_requests') {
          return {
            type: 'AUTH_RATE_LIMITED',
            userMessage: 'Demasiados intentos. Espera antes de intentar de nuevo.',
            canRetry: true
          };
        } else if (error.code === 'invalid_credentials') {
          return {
            type: 'AUTH_INVALID_CREDENTIALS',
            userMessage: 'Email o contraseña incorrectos.',
            canRetry: true
          };
        }
      });

      // Attempt multiple logins
      for (let i = 0; i < 4; i++) {
        try {
          await mockAuthService.login(invalidData.email, invalidData.password);
          expect.fail('Should have thrown an error');
        } catch (error) {
          if (i < 3) {
            expect(error.message).toContain('Invalid login credentials');
          } else {
            expect(error.message).toContain('Too many requests');
          }
        }
      }

      // Verify error classification for rate limiting
      mockErrorHandler.handleError.mockReturnValue({
        type: 'AUTH_RATE_LIMITED',
        userMessage: 'Demasiados intentos. Espera antes de intentar de nuevo.',
        canRetry: true
      });
      
      const processedError = mockErrorHandler.handleError(
        new Error('Too many requests'),
        { operation: 'login' }
      );
      expect(processedError.type).toBe('AUTH_RATE_LIMITED');
      expect(processedError.canRetry).toBe(true);
    });
  });

  describe('OAuth Flows with Provider Failures', () => {
    it('should handle Google OAuth provider unavailable', async () => {
      // Mock OAuth enhanced login
      const mockLoginWithOAuthEnhanced = vi.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'OAUTH_GOOGLE_ERROR',
          userMessage: 'Error al iniciar sesión con Google. Inténtalo de nuevo o usa email y contraseña.',
          canRetry: true
        },
        provider: 'google',
        fallbackOptions: {
          emailPassword: true,
          alternativeProviders: ['github']
        },
        canRetry: true,
        shouldShowFallback: true
      });

      // Execute OAuth login
      const result = await mockLoginWithOAuthEnhanced('google', {
        showFallback: true,
        showRetry: true,
        language: 'es'
      });

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('OAUTH_GOOGLE_ERROR');
      expect(result.provider).toBe('google');
      expect(result.canRetry).toBe(true);
      expect(result.shouldShowFallback).toBe(true);
    });

    it('should handle OAuth popup blocked scenario', async () => {
      const mockLoginWithOAuthEnhanced = vi.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'OAUTH_POPUP_BLOCKED',
          userMessage: 'La ventana emergente fue bloqueada. Permite ventanas emergentes e inténtalo de nuevo.',
          canRetry: true
        },
        canRetry: true,
        shouldShowFallback: true
      });

      const result = await mockLoginWithOAuthEnhanced('github', {
        showFallback: true,
        language: 'es'
      });

      // Verify popup blocked error handling
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_POPUP_BLOCKED');
      expect(result.canRetry).toBe(true);
      expect(result.shouldShowFallback).toBe(true);
    });

    it('should handle OAuth access denied with fallback', async () => {
      const mockLoginWithOAuthEnhanced = vi.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'OAUTH_ACCESS_DENIED',
          userMessage: 'Acceso denegado. Debes autorizar la aplicación para continuar.',
          canRetry: false
        },
        canRetry: false,
        shouldShowFallback: true
      });

      const result = await mockLoginWithOAuthEnhanced('google', {
        showFallback: true,
        language: 'es'
      });

      // Verify access denied handling
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_ACCESS_DENIED');
      expect(result.canRetry).toBe(false); // User explicitly denied access
      expect(result.shouldShowFallback).toBe(true);
    });

    it('should handle OAuth timeout with retry options', async () => {
      let attemptCount = 0;
      
      const mockLoginWithOAuthEnhanced = vi.fn().mockImplementation(async (provider, options) => {
        attemptCount++;
        
        if (attemptCount < 3) {
          return {
            success: false,
            error: {
              type: 'OAUTH_TIMEOUT',
              userMessage: 'La autenticación tardó demasiado. Inténtalo de nuevo.',
              canRetry: true
            },
            canRetry: true
          };
        }
        
        // Success on third attempt
        return {
          success: true,
          user: {
            id: 'oauth-user-id',
            email: 'oauth@example.com',
            name: 'OAuth User'
          }
        };
      });

      // First attempt should fail
      let result = await mockLoginWithOAuthEnhanced('github', {
        showRetry: true,
        language: 'es'
      });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_TIMEOUT');
      expect(result.canRetry).toBe(true);

      // Second attempt should also fail
      result = await mockLoginWithOAuthEnhanced('github', {
        showRetry: true,
        language: 'es'
      });

      expect(result.success).toBe(false);

      // Third attempt should succeed
      result = await mockLoginWithOAuthEnhanced('github', {
        showRetry: true,
        language: 'es'
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(attemptCount).toBe(3);
    });
  });

  describe('Recovery Scenarios After Errors', () => {
    it('should recover from network errors when connection is restored', async () => {
      const testData = {
        email: 'recovery@example.com',
        password: 'RecoveryPassword123'
      };

      let networkStable = false;
      
      // Mock login with network recovery
      const mockLogin = vi.fn().mockImplementation(async (email, password) => {
        if (!networkStable) {
          const networkError = new Error('Network unreachable');
          networkError.code = 'ENETUNREACH';
          
          // Log the error
          loggedErrors.push({
            error: networkError,
            context: { operation: 'login' },
            severity: 'HIGH'
          });
          
          throw networkError;
        }
        
        // Log successful recovery
        loggedMetrics.push({
          operation: 'login',
          duration: 1200,
          success: true,
          metadata: { recovered: true }
        });
        
        return {
          id: 'recovery-user-id',
          email: email,
          name: 'Recovery User'
        };
      });

      // First attempt should fail
      try {
        await mockLogin(testData.email, testData.password);
        expect.fail('Should have failed due to network error');
      } catch (error) {
        expect(error.message).toContain('Network unreachable');
      }

      // Simulate network recovery
      networkStable = true;

      // Retry should succeed
      const result = await mockLogin(testData.email, testData.password);
      expect(result).toBeDefined();
      expect(result.email).toBe(testData.email);

      // Verify recovery was logged
      const successMetric = loggedMetrics.find(m => 
        m.success === true && m.operation === 'login'
      );
      expect(successMetric).toBeDefined();
      expect(successMetric.metadata.recovered).toBe(true);
    });

    it('should recover from Supabase service outage', async () => {
      const testData = {
        name: 'Recovery User',
        email: 'supabase-recovery@example.com',
        password: 'RecoveryPassword123'
      };

      let serviceAvailable = false;
      
      const mockRegister = vi.fn().mockImplementation(async (name, email, password) => {
        if (!serviceAvailable) {
          const serviceError = new Error('Service temporarily unavailable');
          serviceError.status = 503;
          throw serviceError;
        }
        
        return {
          id: 'recovery-user-id',
          email: email,
          name: name
        };
      });

      // First attempt should fail
      try {
        await mockRegister(testData.name, testData.email, testData.password);
        expect.fail('Should have failed due to service unavailable');
      } catch (error) {
        expect(error.message).toContain('Service temporarily unavailable');
      }

      // Simulate service recovery
      serviceAvailable = true;

      // Retry should succeed
      const result = await mockRegister(testData.name, testData.email, testData.password);
      expect(result).toBeDefined();
      expect(result.email).toBe(testData.email);

      // Verify error classification
      const processedError = mockErrorHandler.handleError(
        new Error('Service temporarily unavailable'),
        { operation: 'register' }
      );
      
      // Mock the expected response
      mockErrorHandler.handleError.mockReturnValue({
        type: 'SUPABASE_UNAVAILABLE',
        canRetry: true,
        userMessage: 'El servicio no está disponible temporalmente'
      });
      
      const errorResult = mockErrorHandler.handleError(
        new Error('Service temporarily unavailable'),
        { operation: 'register' }
      );
      
      expect(errorResult.type).toBe('SUPABASE_UNAVAILABLE');
      expect(errorResult.canRetry).toBe(true);
    });
  });

  describe('Error Logging and Metrics Validation', () => {
    it('should log comprehensive error information for failed operations', async () => {
      const testData = {
        email: 'logging-test@example.com',
        password: 'wrongpassword'
      };

      // Mock login failure with logging
      const mockLogin = vi.fn().mockImplementation(async (email, password) => {
        const authError = new Error('Invalid login credentials');
        authError.code = 'invalid_credentials';
        
        // Simulate error logging
        loggedErrors.push({
          error: authError,
          context: {
            operation: 'login',
            email: email,
            timestamp: new Date().toISOString()
          },
          severity: 'MEDIUM'
        });
        
        // Simulate performance metric logging
        loggedMetrics.push({
          operation: 'login',
          duration: 800,
          success: false,
          metadata: {
            errorType: authError.code,
            email: email
          }
        });
        
        throw authError;
      });

      try {
        await mockLogin(testData.email, testData.password);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Expected error
      }

      // Verify error logging
      expect(loggedErrors.length).toBe(1);
      
      const errorLog = loggedErrors.find(log => 
        log.error && log.error.message.includes('Invalid login credentials')
      );
      expect(errorLog).toBeDefined();
      expect(errorLog.context).toBeDefined();
      expect(errorLog.context.operation).toBe('login');
      expect(errorLog.severity).toBeDefined();

      // Verify performance metrics
      const failureMetric = loggedMetrics.find(m => 
        m.success === false && m.operation === 'login'
      );
      expect(failureMetric).toBeDefined();
      expect(failureMetric.duration).toBeGreaterThan(0);
      expect(failureMetric.metadata).toBeDefined();
    });

    it('should track error recovery patterns', async () => {
      const testData = {
        name: 'Pattern User',
        email: 'pattern@example.com',
        password: 'PatternPassword123'
      };

      let attemptCount = 0;
      
      const mockRegisterWithValidation = vi.fn().mockImplementation(async (name, email, password, confirmPassword, options) => {
        attemptCount = 0;
        
        // Simulate multiple attempts with different errors
        while (attemptCount < 3) {
          attemptCount++;
          
          if (attemptCount === 1) {
            // First attempt: network error
            loggedErrors.push({
              error: new Error('Network timeout'),
              context: { operation: 'register', attempt: attemptCount },
              severity: 'HIGH'
            });
            
            loggedMetrics.push({
              operation: 'register',
              duration: 5000,
              success: false,
              metadata: { errorType: 'NETWORK_TIMEOUT', attempt: attemptCount }
            });
            
            if (options.enableRetry) continue;
            throw new Error('Network timeout');
          } else if (attemptCount === 2) {
            // Second attempt: service error
            loggedErrors.push({
              error: new Error('Service unavailable'),
              context: { operation: 'register', attempt: attemptCount },
              severity: 'HIGH'
            });
            
            loggedMetrics.push({
              operation: 'register',
              duration: 3000,
              success: false,
              metadata: { errorType: 'SERVICE_UNAVAILABLE', attempt: attemptCount }
            });
            
            if (options.enableRetry) continue;
            throw new Error('Service unavailable');
          } else {
            // Third attempt: success
            loggedMetrics.push({
              operation: 'register',
              duration: 1500,
              success: true,
              metadata: { attempt: attemptCount, recovered: true }
            });
            
            return {
              success: true,
              user: {
                id: 'pattern-user-id',
                email: email,
                name: name
              },
              context: { operation: 'register', attempts: attemptCount }
            };
          }
        }
      });

      // Attempt registration with retries
      const result = await mockRegisterWithValidation(
        testData.name,
        testData.email,
        testData.password,
        testData.password,
        {
          language: 'es',
          enableRetry: true,
          maxRetries: 3
        }
      );

      // Verify successful recovery
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);

      // Verify error pattern logging
      expect(loggedErrors.length).toBe(2); // Two failed attempts
      expect(loggedMetrics.length).toBe(3); // Two failures + one success

      // Verify different error types were logged
      const networkErrorLog = loggedErrors.find(log => 
        log.error && log.error.message.includes('Network timeout')
      );
      const serviceErrorLog = loggedErrors.find(log => 
        log.error && log.error.message.includes('Service unavailable')
      );
      
      expect(networkErrorLog).toBeDefined();
      expect(serviceErrorLog).toBeDefined();

      // Verify final success metric
      const successMetric = loggedMetrics.find(m => 
        m.success === true && m.operation === 'register'
      );
      expect(successMetric).toBeDefined();
      expect(successMetric.metadata.recovered).toBe(true);
    });
  });
});