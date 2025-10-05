/**
 * Integration Tests for OAuth Error Flows
 * Tests OAuth provider failures, popup handling, and fallback scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../services/authService.js';
import { oauthErrorHandler } from '../services/oauthErrorHandler.js';
import { oauthErrorSimulator, OAuthErrorScenarios, OAuthProviders } from './oauthErrorSimulator.js';
import { userFeedbackSystem } from '../services/userFeedbackSystem.js';
import errorLogger from '../services/errorLogger.js';

describe('OAuth Error Flows Integration Tests', () => {
  let mockWindow;
  let loggedErrors = [];
  let loggedMetrics = [];
  let feedbackMessages = [];

  beforeEach(() => {
    // Mock window.open for OAuth popup testing
    mockWindow = {
      location: { href: '' },
      closed: false,
      close: vi.fn(),
      focus: vi.fn(),
      postMessage: vi.fn(),
      addEventListener: vi.fn()
    };

    global.window.open = vi.fn(() => mockWindow);

    // Reset logged data
    loggedErrors = [];
    loggedMetrics = [];
    feedbackMessages = [];

    // Mock error logger
    vi.spyOn(errorLogger, 'logError').mockImplementation((error, context, severity) => {
      loggedErrors.push({ error, context, severity });
    });

    vi.spyOn(errorLogger, 'logPerformanceMetric').mockImplementation((operation, duration, success, metadata) => {
      loggedMetrics.push({ operation, duration, success, metadata });
    });

    // Mock user feedback system
    vi.spyOn(userFeedbackSystem, 'showError').mockImplementation((error, options) => {
      feedbackMessages.push({ type: 'error', error, options });
    });

    vi.spyOn(userFeedbackSystem, 'showRetryOptions').mockImplementation((error, retryCallback) => {
      feedbackMessages.push({ type: 'retry', error, retryCallback });
    });

    vi.spyOn(userFeedbackSystem, 'showLoading').mockImplementation((operation, message) => {
      feedbackMessages.push({ type: 'loading', operation, message });
    });

    // Reset OAuth error simulator
    oauthErrorSimulator.reset();
  });

  afterEach(() => {
    // Stop OAuth error simulation
    oauthErrorSimulator.stopSimulation();

    // Restore mocks
    vi.restoreAllMocks();
  });

  describe('Google OAuth Error Scenarios', () => {
    it('should handle Google OAuth service unavailable', async () => {
      // Start OAuth error simulation
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setProviderError(
        OAuthProviders.GOOGLE,
        OAuthErrorScenarios.PROVIDER_UNAVAILABLE
      );

      // Mock Google OAuth failure
      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        if (provider === 'google') {
          const serviceError = new Error('Google OAuth service is temporarily unavailable');
          serviceError.code = 'service_unavailable';
          serviceError.status = 503;
          serviceError.provider = 'google';
          throw serviceError;
        }
      });

      // Attempt Google OAuth login
      const result = await authService.loginWithOAuthEnhanced('google', {
        showFallback: true,
        showRetry: true,
        language: 'es',
        fallbackCallback: vi.fn(),
        retryCallback: vi.fn()
      });

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('OAUTH_GOOGLE_ERROR');
      expect(result.provider).toBe('google');
      expect(result.canRetry).toBe(true);
      expect(result.shouldShowFallback).toBe(true);

      // Verify error was logged
      expect(loggedErrors.length).toBeGreaterThan(0);
      const googleErrorLog = loggedErrors.find(log => 
        log.error.provider === 'google'
      );
      expect(googleErrorLog).toBeDefined();

      // Verify performance metric was logged
      const failureMetric = loggedMetrics.find(m => 
        m.success === false && m.operation === 'oauth_login'
      );
      expect(failureMetric).toBeDefined();
      expect(failureMetric.metadata.provider).toBe('google');
    });

    it('should handle Google OAuth popup blocked scenario', async () => {
      // Simulate popup blocked
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setProviderError(
        OAuthProviders.GOOGLE,
        OAuthErrorScenarios.POPUP_BLOCKED
      );

      // Mock popup blocked error
      global.window.open = vi.fn(() => null); // Popup blocked returns null

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        // Simulate popup blocked detection
        const popup = window.open('https://accounts.google.com/oauth/authorize', 'oauth', 'popup');
        if (!popup) {
          const popupError = new Error('Popup was blocked by browser');
          popupError.code = 'popup_blocked';
          popupError.provider = provider;
          throw popupError;
        }
      });

      // Attempt Google OAuth login
      const result = await authService.loginWithOAuthEnhanced('google', {
        showFallback: true,
        language: 'es'
      });

      // Verify popup blocked error handling
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_POPUP_BLOCKED');
      expect(result.canRetry).toBe(true);
      expect(result.shouldShowFallback).toBe(true);

      // Verify user feedback was shown
      expect(feedbackMessages.length).toBeGreaterThan(0);
      const errorFeedback = feedbackMessages.find(m => m.type === 'error');
      expect(errorFeedback).toBeDefined();
      expect(errorFeedback.error.code).toBe('popup_blocked');
    });

    it('should handle Google OAuth access denied by user', async () => {
      // Simulate user denying access
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setProviderError(
        OAuthProviders.GOOGLE,
        OAuthErrorScenarios.ACCESS_DENIED
      );

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        // Simulate user denying access in popup
        const accessError = new Error('User denied access to the application');
        accessError.code = 'access_denied';
        accessError.provider = provider;
        throw accessError;
      });

      // Attempt Google OAuth login
      const result = await authService.loginWithOAuthEnhanced('google', {
        showFallback: true,
        language: 'es',
        alternativeProviderCallback: vi.fn()
      });

      // Verify access denied handling
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_ACCESS_DENIED');
      expect(result.canRetry).toBe(false); // User explicitly denied access
      expect(result.shouldShowFallback).toBe(true);

      // Verify appropriate error message
      expect(result.error.userMessage).toContain('denegado');
    });

    it('should handle Google OAuth timeout scenario', async () => {
      // Simulate OAuth timeout
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setProviderError(
        OAuthProviders.GOOGLE,
        OAuthErrorScenarios.OAUTH_TIMEOUT
      );

      let timeoutOccurred = false;

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        // Simulate OAuth timeout
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            timeoutOccurred = true;
            const timeoutError = new Error('Authentication took too long');
            timeoutError.code = 'oauth_timeout';
            timeoutError.provider = provider;
            reject(timeoutError);
          }, 1000);
        });
      });

      // Attempt Google OAuth login
      const result = await authService.loginWithOAuthEnhanced('google', {
        showRetry: true,
        language: 'es'
      });

      // Verify timeout handling
      expect(timeoutOccurred).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_TIMEOUT');
      expect(result.canRetry).toBe(true);

      // Verify retry options were shown
      const retryFeedback = feedbackMessages.find(m => m.type === 'retry');
      expect(retryFeedback).toBeDefined();
    });
  });

  describe('GitHub OAuth Error Scenarios', () => {
    it('should handle GitHub OAuth server error', async () => {
      // Simulate GitHub server error
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setProviderError(
        OAuthProviders.GITHUB,
        OAuthErrorScenarios.SERVER_ERROR
      );

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        if (provider === 'github') {
          const serverError = new Error('GitHub OAuth server encountered an internal error');
          serverError.code = 'server_error';
          serverError.status = 500;
          serverError.provider = 'github';
          throw serverError;
        }
      });

      // Attempt GitHub OAuth login
      const result = await authService.loginWithOAuthEnhanced('github', {
        showFallback: true,
        showRetry: true,
        language: 'es'
      });

      // Verify server error handling
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_GITHUB_ERROR');
      expect(result.provider).toBe('github');
      expect(result.canRetry).toBe(true);

      // Verify error classification
      const processedError = oauthErrorHandler.handleOAuthError(
        new Error('GitHub OAuth server encountered an internal error'),
        'github',
        { operation: 'oauth_login' }
      );
      expect(processedError.errorType).toBe('OAUTH_GITHUB_ERROR');
      expect(processedError.canRetry).toBe(true);
    });

    it('should handle GitHub OAuth invalid client configuration', async () => {
      // Simulate invalid client configuration
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setProviderError(
        OAuthProviders.GITHUB,
        OAuthErrorScenarios.INVALID_CLIENT
      );

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        if (provider === 'github') {
          const clientError = new Error('Invalid client ID or client secret');
          clientError.code = 'invalid_client';
          clientError.status = 401;
          clientError.provider = 'github';
          throw clientError;
        }
      });

      // Attempt GitHub OAuth login
      const result = await authService.loginWithOAuthEnhanced('github', {
        showFallback: true,
        language: 'es'
      });

      // Verify invalid client handling
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('OAUTH_GITHUB_ERROR');
      expect(result.canRetry).toBe(false); // Configuration errors shouldn't retry

      // Verify fallback is offered
      expect(result.shouldShowFallback).toBe(true);
    });
  });

  describe('OAuth Provider Fallback Scenarios', () => {
    it('should handle fallback from Google to GitHub when Google fails', async () => {
      // Start with Google failure
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setProviderError(
        OAuthProviders.GOOGLE,
        OAuthErrorScenarios.PROVIDER_UNAVAILABLE
      );

      let googleAttempted = false;
      let githubAttempted = false;

      // Mock Google failure and GitHub success
      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        if (provider === 'google') {
          googleAttempted = true;
          const googleError = new Error('Google OAuth service is temporarily unavailable');
          googleError.code = 'service_unavailable';
          googleError.provider = 'google';
          throw googleError;
        } else if (provider === 'github') {
          githubAttempted = true;
          return {
            id: 'github-fallback-user-id',
            email: 'fallback@example.com',
            name: 'Fallback User',
            provider: 'github'
          };
        }
      });

      // Attempt Google OAuth first
      let result = await authService.loginWithOAuthEnhanced('google', {
        showFallback: true,
        language: 'es',
        alternativeProviderCallback: async () => {
          // Fallback to GitHub
          return await authService.loginWithOAuthEnhanced('github', {
            language: 'es'
          });
        }
      });

      // Verify Google failed
      expect(googleAttempted).toBe(true);
      expect(result.success).toBe(false);
      expect(result.shouldShowFallback).toBe(true);

      // Execute fallback to GitHub
      if (result.shouldShowFallback && result.fallbackOptions) {
        result = await authService.loginWithOAuthEnhanced('github', {
          language: 'es'
        });
      }

      // Verify GitHub fallback succeeded
      expect(githubAttempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.user.provider).toBe('github');

      // Verify both attempts were logged
      expect(loggedErrors.length).toBe(1); // Only Google error
      expect(loggedMetrics.length).toBe(2); // Google failure + GitHub success
    });

    it('should handle fallback to email/password when all OAuth providers fail', async () => {
      // Simulate all OAuth providers failing
      oauthErrorSimulator.startSimulation();
      oauthErrorSimulator.setGlobalError(OAuthErrorScenarios.PROVIDER_UNAVAILABLE);

      let oauthAttempts = 0;
      let emailPasswordUsed = false;

      // Mock all OAuth providers failing
      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        oauthAttempts++;
        const providerError = new Error(`${provider} OAuth service is temporarily unavailable`);
        providerError.code = 'service_unavailable';
        providerError.provider = provider;
        throw providerError;
      });

      // Mock successful email/password fallback
      vi.spyOn(authService, 'login').mockImplementation(async (email, password) => {
        emailPasswordUsed = true;
        return {
          id: 'email-fallback-user-id',
          email: email,
          name: 'Email Fallback User',
          provider: 'email'
        };
      });

      // Try Google OAuth first
      let result = await authService.loginWithOAuthEnhanced('google', {
        showFallback: true,
        language: 'es'
      });

      expect(result.success).toBe(false);
      expect(oauthAttempts).toBe(1);

      // Try GitHub OAuth as alternative
      result = await authService.loginWithOAuthEnhanced('github', {
        showFallback: true,
        language: 'es'
      });

      expect(result.success).toBe(false);
      expect(oauthAttempts).toBe(2);

      // Fallback to email/password
      const emailResult = await authService.login('fallback@example.com', 'FallbackPassword123');

      // Verify email/password fallback succeeded
      expect(emailPasswordUsed).toBe(true);
      expect(emailResult).toBeDefined();
      expect(emailResult.provider).toBe('email');

      // Verify all attempts were logged
      expect(loggedErrors.length).toBe(2); // Two OAuth failures
      expect(loggedMetrics.length).toBe(3); // Two OAuth failures + one email success
    });
  });

  describe('OAuth Popup Management', () => {
    it('should handle popup window lifecycle correctly', async () => {
      const popupEvents = [];

      // Mock popup window with event tracking
      const mockPopup = {
        location: { href: 'https://accounts.google.com/oauth/authorize' },
        closed: false,
        close: vi.fn(() => {
          mockPopup.closed = true;
          popupEvents.push('closed');
        }),
        focus: vi.fn(() => {
          popupEvents.push('focused');
        }),
        addEventListener: vi.fn((event, callback) => {
          popupEvents.push(`addEventListener:${event}`);
        })
      };

      global.window.open = vi.fn(() => {
        popupEvents.push('opened');
        return mockPopup;
      });

      // Start OAuth error simulation
      oauthErrorSimulator.startSimulation();

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        // Simulate popup opening
        const popup = window.open('https://accounts.google.com/oauth/authorize', 'oauth', 'popup');
        popupEvents.push('popup-created');
        
        // Simulate user completing OAuth flow
        setTimeout(() => {
          popupEvents.push('oauth-completed');
          popup.close();
        }, 500);

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: 'popup-user-id',
              email: 'popup@example.com',
              name: 'Popup User'
            });
          }, 600);
        });
      });

      // Execute OAuth login
      const result = await authService.loginWithOAuth('google');

      // Verify popup lifecycle
      expect(popupEvents).toContain('opened');
      expect(popupEvents).toContain('popup-created');
      expect(popupEvents).toContain('oauth-completed');
      expect(popupEvents).toContain('closed');

      // Verify successful result
      expect(result).toBeDefined();
      expect(result.email).toBe('popup@example.com');

      // Verify popup was closed
      expect(mockPopup.closed).toBe(true);
    });

    it('should handle popup window communication errors', async () => {
      const communicationErrors = [];

      // Mock popup with communication issues
      const mockPopup = {
        location: { href: 'https://accounts.google.com/oauth/authorize' },
        closed: false,
        close: vi.fn(),
        postMessage: vi.fn((message, origin) => {
          // Simulate communication error
          communicationErrors.push({ message, origin, error: 'Communication failed' });
          throw new Error('Failed to communicate with popup');
        })
      };

      global.window.open = vi.fn(() => mockPopup);

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        const popup = window.open('https://accounts.google.com/oauth/authorize', 'oauth', 'popup');
        
        try {
          // Attempt to communicate with popup
          popup.postMessage({ type: 'oauth-request' }, '*');
        } catch (error) {
          const commError = new Error('Popup communication failed');
          commError.code = 'popup_communication_error';
          commError.originalError = error;
          throw commError;
        }
      });

      // Attempt OAuth login
      try {
        await authService.loginWithOAuth('google');
        expect.fail('Should have failed due to communication error');
      } catch (error) {
        expect(error.code).toBe('popup_communication_error');
      }

      // Verify communication was attempted
      expect(communicationErrors.length).toBe(1);
      expect(communicationErrors[0].error).toBe('Communication failed');

      // Verify error was logged
      expect(loggedErrors.length).toBeGreaterThan(0);
      const commErrorLog = loggedErrors.find(log => 
        log.error.code === 'popup_communication_error'
      );
      expect(commErrorLog).toBeDefined();
    });
  });

  describe('OAuth Error Recovery and Retry Logic', () => {
    it('should implement exponential backoff for OAuth retries', async () => {
      const retryAttempts = [];
      let attemptCount = 0;

      // Mock OAuth with retry logic
      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        attemptCount++;
        const startTime = Date.now();
        
        if (attemptCount < 3) {
          // Fail first two attempts
          const retryError = new Error(`OAuth attempt ${attemptCount} failed`);
          retryError.code = 'temporary_failure';
          retryError.provider = provider;
          
          retryAttempts.push({
            attempt: attemptCount,
            timestamp: startTime,
            error: retryError.message
          });
          
          throw retryError;
        }
        
        // Success on third attempt
        retryAttempts.push({
          attempt: attemptCount,
          timestamp: startTime,
          success: true
        });
        
        return {
          id: 'retry-user-id',
          email: 'retry@example.com',
          name: 'Retry User'
        };
      });

      // Execute OAuth with retry logic
      let result;
      let retryDelay = 1000; // Start with 1 second
      
      for (let i = 0; i < 3; i++) {
        try {
          result = await authService.loginWithOAuth('google');
          break;
        } catch (error) {
          if (i < 2) {
            // Wait with exponential backoff
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 2; // Double the delay
          } else {
            throw error;
          }
        }
      }

      // Verify successful completion after retries
      expect(result).toBeDefined();
      expect(result.email).toBe('retry@example.com');
      expect(attemptCount).toBe(3);

      // Verify retry pattern
      expect(retryAttempts.length).toBe(3);
      expect(retryAttempts[0].error).toContain('attempt 1 failed');
      expect(retryAttempts[1].error).toContain('attempt 2 failed');
      expect(retryAttempts[2].success).toBe(true);

      // Verify timing intervals (exponential backoff)
      if (retryAttempts.length >= 3) {
        const interval1 = retryAttempts[1].timestamp - retryAttempts[0].timestamp;
        const interval2 = retryAttempts[2].timestamp - retryAttempts[1].timestamp;
        
        // Second interval should be roughly double the first
        expect(interval2).toBeGreaterThan(interval1 * 1.5);
      }
    });

    it('should handle OAuth provider recovery after extended outage', async () => {
      let providerHealthy = false;
      let healthCheckCount = 0;
      const healthChecks = [];

      // Mock provider health checking
      const checkProviderHealth = async (provider) => {
        healthCheckCount++;
        const checkTime = Date.now();
        
        healthChecks.push({
          attempt: healthCheckCount,
          timestamp: checkTime,
          healthy: providerHealthy
        });
        
        return providerHealthy;
      };

      vi.spyOn(authService, 'loginWithOAuth').mockImplementation(async (provider) => {
        const isHealthy = await checkProviderHealth(provider);
        
        if (!isHealthy) {
          const outageError = new Error(`${provider} OAuth provider is experiencing an outage`);
          outageError.code = 'provider_outage';
          outageError.provider = provider;
          throw outageError;
        }
        
        return {
          id: 'recovery-user-id',
          email: 'recovery@example.com',
          name: 'Recovery User',
          provider: provider
        };
      });

      // First attempt during outage
      try {
        await authService.loginWithOAuth('google');
        expect.fail('Should have failed during outage');
      } catch (error) {
        expect(error.code).toBe('provider_outage');
      }

      // Second attempt still during outage
      try {
        await authService.loginWithOAuth('google');
        expect.fail('Should have failed during outage');
      } catch (error) {
        expect(error.code).toBe('provider_outage');
      }

      // Provider recovers
      providerHealthy = true;

      // Third attempt should succeed
      const result = await authService.loginWithOAuth('google');

      // Verify recovery
      expect(result).toBeDefined();
      expect(result.provider).toBe('google');
      expect(healthCheckCount).toBe(3);

      // Verify health check progression
      expect(healthChecks[0].healthy).toBe(false);
      expect(healthChecks[1].healthy).toBe(false);
      expect(healthChecks[2].healthy).toBe(true);

      // Verify error logging during outage
      expect(loggedErrors.length).toBe(2); // Two failed attempts
      const outageErrors = loggedErrors.filter(log => 
        log.error.code === 'provider_outage'
      );
      expect(outageErrors.length).toBe(2);

      // Verify successful recovery metric
      const recoveryMetric = loggedMetrics.find(m => 
        m.success === true && m.operation === 'oauth_login'
      );
      expect(recoveryMetric).toBeDefined();
    });
  });
});