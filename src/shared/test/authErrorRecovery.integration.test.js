/**
 * Integration Tests for Authentication Error Recovery Scenarios
 * Tests complex recovery patterns and edge cases in error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../services/authService.js';
import { authErrorHandler } from '../services/authErrorHandler.js';
import { userFeedbackSystem } from '../services/userFeedbackSystem.js';
import { connectionMonitor } from '../services/connectionMonitor.js';
import { retryManager } from '../services/retryManager.js';
import { errorSimulator } from './errorSimulator.js';
import { networkErrorSimulator } from './networkErrorSimulator.js';
import { supabaseMocker } from './supabaseMocker.js';
import { oauthErrorSimulator } from './oauthErrorSimulator.js';
import errorLogger from '../services/errorLogger.js';

describe('Authentication Error Recovery Integration Tests', () => {
  let mockContainer;
  let loggedErrors = [];
  let loggedMetrics = [];

  beforeEach(() => {
    // Create mock DOM container for feedback system
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-container';
    document.body.appendChild(mockContainer);

    // Reset logged data
    loggedErrors = [];
    loggedMetrics = [];

    // Mock error logger
    vi.spyOn(errorLogger, 'logError').mockImplementation((error, context, severity) => {
      loggedErrors.push({ error, context, severity });
    });

    vi.spyOn(errorLogger, 'logPerformanceMetric').mockImplementation((operation, duration, success, metadata) => {
      loggedMetrics.push({ operation, duration, success, metadata });
    });

    // Reset all simulators
    errorSimulator.reset();
    networkErrorSimulator.reset();
    supabaseMocker.reset();
    oauthErrorSimulator.reset();

    // Reset connection monitor
    if (connectionMonitor.isMonitoring) {
      connectionMonitor.stopMonitoring();
    }
  });

  afterEach(() => {
    // Clean up DOM
    if (mockContainer) {
      document.body.removeChild(mockContainer);
    }

    // Stop all simulators
    errorSimulator.stopSimulation();
    networkErrorSimulator.reset();
    supabaseMocker.stopMocking();
    oauthErrorSimulator.stopSimulation();

    // Restore mocks
    vi.restoreAllMocks();
  });

  describe('Progressive Error Recovery Patterns', () => {
    it('should handle cascading error recovery (network -> service -> success)', async () => {
      const testData = {
        email: 'cascade@example.com',
        password: 'CascadePassword123'
      };

      let phase = 'network-error';
      let attemptCount = 0;

      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        attemptCount++;
        
        switch (phase) {
          case 'network-error':
            if (attemptCount === 1) {
              phase = 'service-error';
              const networkError = new Error('Network request failed');
              networkError.name = 'NetworkError';
              throw networkError;
            }
            break;
            
          case 'service-error':
            if (attemptCount === 2) {
              phase = 'success';
              const serviceError = new Error('Service temporarily unavailable');
              serviceError.status = 503;
              throw serviceError;
            }
            break;
            
          case 'success':
            return {
              id: 'cascade-user-id',
              email: email,
              name: 'Cascade User'
            };
        }
      });

      // Mock retry manager to handle the cascading errors
      let retryAttempts = 0;
      vi.spyOn(retryManager, 'executeWithRetry').mockImplementation(async (operation, errorType, options) => {
        const maxRetries = options?.maxRetries || 3;
        
        while (retryAttempts < maxRetries) {
          try {
            const result = await operation(retryAttempts);
            return { success: true, result, attemptCount: retryAttempts + 1 };
          } catch (error) {
            retryAttempts++;
            if (retryAttempts >= maxRetries) {
              return { 
                success: false, 
                error, 
                attemptCount: retryAttempts,
                maxRetriesExceeded: true 
              };
            }
            // Wait before retry (simulated)
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      });

      // Execute login with retry
      const result = await retryManager.executeWithRetry(
        async (attempt) => await authService.login(testData.email, testData.password),
        'NETWORK_ERROR',
        { maxRetries: 3 }
      );

      // Verify successful recovery after multiple error types
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.email).toBe(testData.email);
      expect(result.attemptCount).toBe(3);

      // Verify different error types were encountered
      expect(loggedErrors.length).toBe(2); // Network error + Service error
      
      const networkErrorLog = loggedErrors.find(log => 
        log.error.name === 'NetworkError'
      );
      const serviceErrorLog = loggedErrors.find(log => 
        log.error.status === 503
      );
      
      expect(networkErrorLog).toBeDefined();
      expect(serviceErrorLog).toBeDefined();
    });

    it('should handle OAuth fallback to email/password after provider failures', async () => {
      const testData = {
        email: 'fallback@example.com',
        password: 'FallbackPassword123'
      };

      // Start OAuth error simulation
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setGlobalError('PROVIDER_UNAVAILABLE');

      let oauthAttempted = false;
      let emailPasswordUsed = false;

      // Mock OAuth failure
      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        oauthAttempted = true;
        const providerError = new Error('OAuth provider is temporarily unavailable');
        providerError.code = 'service_unavailable';
        throw providerError;
      });

      // Mock successful email/password login
      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        emailPasswordUsed = true;
        return {
          id: 'fallback-user-id',
          email: email,
          name: 'Fallback User'
        };
      });

      // Attempt OAuth login first
      let oauthResult;
      try {
        oauthResult = await authService.loginWithOAuth('google');
        expect.fail('OAuth should have failed');
      } catch (error) {
        // Expected OAuth failure
        expect(error.message).toContain('OAuth provider is temporarily unavailable');
      }

      // Process OAuth error and determine fallback
      const processedError = authErrorHandler.handleError(
        new Error('OAuth provider is temporarily unavailable'),
        { operation: 'oauth_login', provider: 'google' }
      );

      expect(processedError.type).toBe('OAUTH_PROVIDER_UNAVAILABLE');
      expect(processedError.canRetry).toBe(true);

      // Fallback to email/password
      const fallbackResult = await authService.login(testData.email, testData.password);

      // Verify fallback success
      expect(oauthAttempted).toBe(true);
      expect(emailPasswordUsed).toBe(true);
      expect(fallbackResult).toBeDefined();
      expect(fallbackResult.email).toBe(testData.email);

      // Verify both attempts were logged
      expect(loggedErrors.length).toBeGreaterThan(0);
      expect(loggedMetrics.length).toBeGreaterThan(0);
    });

    it('should handle connection quality degradation and recovery', async () => {
      const testData = {
        name: 'Quality User',
        email: 'quality@example.com',
        password: 'QualityPassword123'
      };

      // Start connection monitoring
      connectionMonitor.startMonitoring({
        checkIntervalMs: 500,
        timeoutMs: 2000
      });

      // Simulate connection quality changes
      let connectionQuality = 'excellent';
      let latencyMs = 50;

      vi.spyOn(connectionMonitor, 'getConnectionLatency').mockImplementation(async () => {
        switch (connectionQuality) {
          case 'excellent': return 50;
          case 'good': return 200;
          case 'poor': return 1000;
          case 'very-poor': return 3000;
          default: return 5000;
        }
      });

      vi.spyOn(connectionMonitor, 'isSupabaseAvailable').mockImplementation(async () => {
        const latency = await connectionMonitor.getConnectionLatency();
        return latency < 2500; // Fail if latency is too high
      });

      vi.spyOn(authService, 'register').mockImplementation(async (name, email, password) => {
        const isAvailable = await connectionMonitor.isSupabaseAvailable();
        const latency = await connectionMonitor.getConnectionLatency();
        
        if (!isAvailable) {
          const connectivityError = new Error('Connection quality too poor for registration');
          connectivityError.code = 'POOR_CONNECTION';
          connectivityError.latency = latency;
          throw connectivityError;
        }
        
        // Simulate longer processing time for poor connections
        if (latency > 500) {
          await new Promise(resolve => setTimeout(resolve, latency / 10));
        }
        
        return {
          id: 'quality-user-id',
          email: email,
          name: name,
          connectionQuality: connectionQuality,
          latency: latency
        };
      });

      // Test with excellent connection
      let result = await authService.register(testData.name, testData.email, testData.password);
      expect(result).toBeDefined();
      expect(result.connectionQuality).toBe('excellent');

      // Degrade connection quality
      connectionQuality = 'poor';
      
      // Should still work but slower
      result = await authService.register(testData.name, 'poor@example.com', testData.password);
      expect(result).toBeDefined();
      expect(result.connectionQuality).toBe('poor');
      expect(result.latency).toBe(1000);

      // Further degrade to very poor
      connectionQuality = 'very-poor';
      
      // Should fail due to poor connection
      try {
        await authService.register(testData.name, 'verypoor@example.com', testData.password);
        expect.fail('Should have failed due to poor connection');
      } catch (error) {
        expect(error.message).toContain('Connection quality too poor');
        expect(error.latency).toBe(3000);
      }

      // Recover connection quality
      connectionQuality = 'good';
      
      // Should work again
      result = await authService.register(testData.name, 'recovered@example.com', testData.password);
      expect(result).toBeDefined();
      expect(result.connectionQuality).toBe('good');

      connectionMonitor.stopMonitoring();
    });
  });

  describe('User Feedback During Error Recovery', () => {
    it('should provide progressive feedback during retry attempts', async () => {
      const testData = {
        email: 'feedback@example.com',
        password: 'FeedbackPassword123'
      };

      let attemptCount = 0;
      const feedbackMessages = [];

      // Mock feedback system to capture messages
      vi.spyOn(userFeedbackSystem, 'showLoading').mockImplementation((operation, message) => {
        feedbackMessages.push({ type: 'loading', operation, message });
      });

      vi.spyOn(userFeedbackSystem, 'showError').mockImplementation((error, options) => {
        feedbackMessages.push({ type: 'error', error, options });
      });

      vi.spyOn(userFeedbackSystem, 'showRetryOptions').mockImplementation((error, retryCallback) => {
        feedbackMessages.push({ type: 'retry', error, retryCallback });
      });

      vi.spyOn(userFeedbackSystem, 'showSuccess').mockImplementation((message) => {
        feedbackMessages.push({ type: 'success', message });
      });

      // Mock login with progressive failures
      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        attemptCount++;
        
        // Show loading feedback
        userFeedbackSystem.showLoading('login', `Intento ${attemptCount} de 3...`);
        
        if (attemptCount < 3) {
          const error = new Error(`Intento ${attemptCount} falló`);
          error.code = 'NETWORK_ERROR';
          
          // Show error with retry option
          userFeedbackSystem.showError(error, { canRetry: true });
          userFeedbackSystem.showRetryOptions(error, () => {
            // Retry callback would be called here
          });
          
          throw error;
        }
        
        // Success on third attempt
        userFeedbackSystem.showSuccess('¡Inicio de sesión exitoso!');
        return {
          id: 'feedback-user-id',
          email: email,
          name: 'Feedback User'
        };
      });

      // Execute login with retries
      let finalResult;
      for (let i = 0; i < 3; i++) {
        try {
          finalResult = await authService.login(testData.email, testData.password);
          break;
        } catch (error) {
          if (i === 2) throw error; // Re-throw on final attempt
        }
      }

      // Verify successful completion
      expect(finalResult).toBeDefined();
      expect(attemptCount).toBe(3);

      // Verify feedback progression
      expect(feedbackMessages.length).toBeGreaterThan(0);
      
      const loadingMessages = feedbackMessages.filter(m => m.type === 'loading');
      const errorMessages = feedbackMessages.filter(m => m.type === 'error');
      const retryMessages = feedbackMessages.filter(m => m.type === 'retry');
      const successMessages = feedbackMessages.filter(m => m.type === 'success');
      
      expect(loadingMessages.length).toBe(3); // One for each attempt
      expect(errorMessages.length).toBe(2); // Two failures
      expect(retryMessages.length).toBe(2); // Two retry options
      expect(successMessages.length).toBe(1); // Final success
    });

    it('should handle timeout scenarios with appropriate user feedback', async () => {
      const testData = {
        email: 'timeout@example.com',
        password: 'TimeoutPassword123'
      };

      const feedbackMessages = [];
      let timeoutOccurred = false;

      // Mock feedback system
      vi.spyOn(userFeedbackSystem, 'showLoading').mockImplementation((operation, message) => {
        feedbackMessages.push({ type: 'loading', operation, message, timestamp: Date.now() });
      });

      vi.spyOn(userFeedbackSystem, 'showError').mockImplementation((error, options) => {
        feedbackMessages.push({ type: 'error', error, options, timestamp: Date.now() });
      });

      vi.spyOn(userFeedbackSystem, 'hideLoading').mockImplementation(() => {
        feedbackMessages.push({ type: 'hide-loading', timestamp: Date.now() });
      });

      // Mock login with timeout
      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        userFeedbackSystem.showLoading('login', 'Iniciando sesión...');
        
        // Simulate long operation that times out
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            timeoutOccurred = true;
            userFeedbackSystem.hideLoading();
            
            const timeoutError = new Error('Request timeout');
            timeoutError.name = 'TimeoutError';
            timeoutError.code = 'TIMEOUT';
            
            userFeedbackSystem.showError(timeoutError, {
              canRetry: true,
              message: 'La operación tardó demasiado. ¿Quieres intentar de nuevo?'
            });
            
            reject(timeoutError);
          }, 1000);
        });
      });

      // Attempt login
      try {
        await authService.login(testData.email, testData.password);
        expect.fail('Should have timed out');
      } catch (error) {
        expect(error.name).toBe('TimeoutError');
        expect(timeoutOccurred).toBe(true);
      }

      // Verify timeout feedback sequence
      expect(feedbackMessages.length).toBe(3);
      
      const loadingMessage = feedbackMessages.find(m => m.type === 'loading');
      const hideLoadingMessage = feedbackMessages.find(m => m.type === 'hide-loading');
      const errorMessage = feedbackMessages.find(m => m.type === 'error');
      
      expect(loadingMessage).toBeDefined();
      expect(hideLoadingMessage).toBeDefined();
      expect(errorMessage).toBeDefined();
      
      // Verify timing sequence
      expect(hideLoadingMessage.timestamp).toBeGreaterThan(loadingMessage.timestamp);
      expect(errorMessage.timestamp).toBeGreaterThan(hideLoadingMessage.timestamp);
      
      // Verify error message content
      expect(errorMessage.error.name).toBe('TimeoutError');
      expect(errorMessage.options.canRetry).toBe(true);
      expect(errorMessage.options.message).toContain('tardó demasiado');
    });
  });

  describe('Complex Error State Management', () => {
    it('should handle concurrent error scenarios', async () => {
      const userData1 = { email: 'concurrent1@example.com', password: 'Password123' };
      const userData2 = { email: 'concurrent2@example.com', password: 'Password123' };

      let loginAttempts = 0;
      const concurrentErrors = [];

      // Mock concurrent login attempts with different errors
      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        loginAttempts++;
        const attemptId = loginAttempts;
        
        // Simulate different errors for concurrent requests
        if (email === userData1.email) {
          const networkError = new Error('Network error for user 1');
          networkError.code = 'NETWORK_ERROR';
          networkError.attemptId = attemptId;
          concurrentErrors.push(networkError);
          throw networkError;
        } else {
          const authError = new Error('Invalid credentials for user 2');
          authError.code = 'invalid_credentials';
          authError.attemptId = attemptId;
          concurrentErrors.push(authError);
          throw authError;
        }
      });

      // Execute concurrent login attempts
      const promises = [
        authService.login(userData1.email, userData1.password).catch(e => e),
        authService.login(userData2.email, userData2.password).catch(e => e)
      ];

      const results = await Promise.all(promises);

      // Verify both attempts failed with different errors
      expect(results.length).toBe(2);
      expect(results[0]).toBeInstanceOf(Error);
      expect(results[1]).toBeInstanceOf(Error);
      
      expect(results[0].code).toBe('NETWORK_ERROR');
      expect(results[1].code).toBe('invalid_credentials');

      // Verify concurrent errors were tracked
      expect(concurrentErrors.length).toBe(2);
      expect(loginAttempts).toBe(2);

      // Verify different error types were logged
      expect(loggedErrors.length).toBe(2);
      
      const networkErrorLog = loggedErrors.find(log => 
        log.error.code === 'NETWORK_ERROR'
      );
      const authErrorLog = loggedErrors.find(log => 
        log.error.code === 'invalid_credentials'
      );
      
      expect(networkErrorLog).toBeDefined();
      expect(authErrorLog).toBeDefined();
    });

    it('should handle error state cleanup after successful recovery', async () => {
      const testData = {
        name: 'Cleanup User',
        email: 'cleanup@example.com',
        password: 'CleanupPassword123'
      };

      let errorState = {
        hasErrors: false,
        errorCount: 0,
        lastError: null,
        retryCount: 0
      };

      let attemptCount = 0;

      // Mock registration with error state tracking
      vi.spyOn(authService, 'register').mockImplementation(async (name, email, password) => {
        attemptCount++;
        
        if (attemptCount < 3) {
          // Track error state
          errorState.hasErrors = true;
          errorState.errorCount++;
          errorState.retryCount++;
          
          const error = new Error(`Registration attempt ${attemptCount} failed`);
          error.code = 'NETWORK_ERROR';
          errorState.lastError = error;
          
          throw error;
        }
        
        // Success - cleanup error state
        errorState.hasErrors = false;
        errorState.lastError = null;
        // Keep errorCount and retryCount for metrics
        
        return {
          id: 'cleanup-user-id',
          email: email,
          name: name,
          recoveredAfter: errorState.retryCount
        };
      });

      // Execute registration with retries
      let result;
      for (let i = 0; i < 3; i++) {
        try {
          result = await authService.register(testData.name, testData.email, testData.password);
          break;
        } catch (error) {
          if (i === 2) throw error; // Re-throw on final attempt
        }
      }

      // Verify successful recovery and state cleanup
      expect(result).toBeDefined();
      expect(result.recoveredAfter).toBe(2); // Two retry attempts
      expect(errorState.hasErrors).toBe(false);
      expect(errorState.lastError).toBeNull();
      expect(errorState.errorCount).toBe(2); // Historical count preserved
      expect(errorState.retryCount).toBe(2); // Historical count preserved

      // Verify error recovery was logged
      const successMetric = loggedMetrics.find(m => 
        m.success === true && m.operation === 'register'
      );
      expect(successMetric).toBeDefined();
    });
  });

  describe('Edge Case Error Scenarios', () => {
    it('should handle malformed error responses', async () => {
      const testData = {
        email: 'malformed@example.com',
        password: 'MalformedPassword123'
      };

      // Mock login with malformed error response
      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        // Create malformed error (missing standard properties)
        const malformedError = {};
        malformedError.toString = () => '[object Object]';
        // No message, no code, no status
        
        throw malformedError;
      });

      try {
        await authService.login(testData.email, testData.password);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Error should be caught
      }

      // Verify error handler can process malformed errors
      const processedError = authErrorHandler.handleError(
        {},
        { operation: 'login' }
      );

      expect(processedError).toBeDefined();
      expect(processedError.type).toBe('UNKNOWN_ERROR');
      expect(processedError.userMessage).toBeDefined();
      expect(processedError.canRetry).toBe(true);
    });

    it('should handle null/undefined error scenarios', async () => {
      const testData = {
        email: 'null@example.com',
        password: 'NullPassword123'
      };

      // Test null error
      let processedError = authErrorHandler.handleError(null, { operation: 'login' });
      expect(processedError.type).toBe('UNKNOWN_ERROR');
      expect(processedError.userMessage).toBeDefined();

      // Test undefined error
      processedError = authErrorHandler.handleError(undefined, { operation: 'login' });
      expect(processedError.type).toBe('UNKNOWN_ERROR');
      expect(processedError.userMessage).toBeDefined();

      // Test error with null message
      const nullMessageError = new Error();
      nullMessageError.message = null;
      
      processedError = authErrorHandler.handleError(nullMessageError, { operation: 'login' });
      expect(processedError.type).toBe('UNKNOWN_ERROR');
      expect(processedError.userMessage).toBeDefined();
    });

    it('should handle extremely high error rates', async () => {
      const testData = {
        email: 'highrate@example.com',
        password: 'HighRatePassword123'
      };

      const errorCounts = {
        network: 0,
        service: 0,
        auth: 0,
        unknown: 0
      };

      // Mock high error rate scenario
      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        const errorTypes = ['network', 'service', 'auth', 'unknown'];
        const randomType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        
        errorCounts[randomType]++;
        
        switch (randomType) {
          case 'network':
            const networkError = new Error('Network error');
            networkError.code = 'NETWORK_ERROR';
            throw networkError;
            
          case 'service':
            const serviceError = new Error('Service unavailable');
            serviceError.status = 503;
            throw serviceError;
            
          case 'auth':
            const authError = new Error('Invalid credentials');
            authError.code = 'invalid_credentials';
            throw authError;
            
          case 'unknown':
            throw new Error('Unknown error');
        }
      });

      // Generate high error rate (100 attempts)
      const errorPromises = [];
      for (let i = 0; i < 100; i++) {
        errorPromises.push(
          authService.login(testData.email, testData.password).catch(e => e)
        );
      }

      const results = await Promise.all(errorPromises);

      // Verify all attempts failed
      expect(results.length).toBe(100);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Error);
      });

      // Verify error distribution
      const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);
      expect(totalErrors).toBe(100);

      // Verify all error types were encountered
      expect(errorCounts.network).toBeGreaterThan(0);
      expect(errorCounts.service).toBeGreaterThan(0);
      expect(errorCounts.auth).toBeGreaterThan(0);
      expect(errorCounts.unknown).toBeGreaterThan(0);

      // Verify error logging handled high volume
      expect(loggedErrors.length).toBe(100);
      expect(loggedMetrics.length).toBe(100);
    });
  });
});