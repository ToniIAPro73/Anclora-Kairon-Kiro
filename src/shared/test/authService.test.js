/**
 * Unit tests for enhanced AuthService methods
 * Tests error classification accuracy, retry logic with mocked network failures,
 * and message generation for different locales
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase first
vi.mock('../config/supabase.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

// Now import the services
import { authService } from '../services/authService.js';
import { AUTH_ERROR_TYPES } from '../services/authErrorHandler.js';
import { retryManager } from '../services/retryManager.js';
import { supabase } from '../config/supabase.js';

describe('Enhanced AuthService Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.isSupabaseEnabled = true;
    localStorage.clear();
    
    // Mock the delay function to avoid actual waiting in tests
    vi.spyOn(retryManager, 'delay').mockResolvedValue();
  });

  it('should exist and have enhanced methods', () => {
    expect(authService).toBeDefined();
    expect(authService.registerWithErrorHandling).toBeDefined();
    expect(authService.loginWithRetry).toBeDefined();
    expect(authService.checkConnectivity).toBeDefined();
  });

  describe('Error Classification Accuracy', () => {
    it('should classify network errors correctly in registerWithErrorHandling', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      supabase.auth.signUp.mockRejectedValue(networkError);

      const result = await authService.registerWithErrorHandling('Test User', 'test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe(AUTH_ERROR_TYPES.NETWORK_ERROR);
      expect(result.error.userMessage).toContain('conectar al servidor');
    });

    it('should classify invalid credentials correctly in loginWithRetry', async () => {
      const invalidCredsError = new Error('Invalid login credentials');
      invalidCredsError.code = 'invalid_credentials';
      supabase.auth.signInWithPassword.mockRejectedValue(invalidCredsError);

      const result = await authService.loginWithRetry('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe(AUTH_ERROR_TYPES.AUTH_INVALID_CREDENTIALS);
      expect(result.error.userMessage).toContain('Email o contraseña incorrectos');
    });
  });

  describe('Message Generation for Different Locales', () => {
    it('should generate Spanish messages by default', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      supabase.auth.signUp.mockRejectedValue(networkError);

      const result = await authService.registerWithErrorHandling('Test User', 'test@example.com', 'password123');

      expect(result.error.userMessage).toBe('No se pudo conectar al servidor. Verifica tu conexión a internet.');
    });

    it('should generate English messages when specified', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      supabase.auth.signUp.mockRejectedValue(networkError);

      const result = await authService.registerWithErrorHandling('Test User', 'test@example.com', 'password123', {
        language: 'en'
      });

      expect(result.error.userMessage).toBe('Could not connect to server. Check your internet connection.');
    });
  });

  describe('Retry Logic with Mocked Network Failures', () => {
    it('should retry network errors automatically in loginWithRetry', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      supabase.auth.signInWithPassword.mockRejectedValue(networkError);

      const result = await authService.loginWithRetry('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(result.retryInfo).toBeDefined();
      expect(result.retryInfo.totalAttempts).toBe(4);
      expect(result.retryInfo.maxRetriesExceeded).toBe(true);
    });

    it('should succeed on retry if network error is resolved', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      // Fail first attempt, succeed on second
      supabase.auth.signInWithPassword
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: {
            user: { id: '123', email: 'test@example.com' }
          }
        });

      const result = await authService.loginWithRetry('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
    });

    it('should retry when enableRetry is true in registerWithErrorHandling', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      supabase.auth.signUp.mockRejectedValue(networkError);

      const result = await authService.registerWithErrorHandling('Test User', 'test@example.com', 'password123', {
        enableRetry: true
      });

      expect(result.success).toBe(false);
      expect(supabase.auth.signUp).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(result.retryInfo).toBeDefined();
      expect(result.retryInfo.totalAttempts).toBe(4);
      expect(result.retryInfo.maxRetriesExceeded).toBe(true);
    });
  });

  describe('OAuth redirect configuration', () => {
    it('uses callback HTML endpoint for Supabase OAuth flows', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

      await authService.loginWithGoogle()

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: `${window.location.origin}/auth/callback.html`
        })
      }))
    })
  })

  describe('Connectivity Testing', () => {
    it('should check connectivity successfully', async () => {
      supabase.auth.getSession.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: { session: null } });
          }, 10); // Small delay to ensure latency > 0
        });
      });

      const result = await authService.checkConnectivity();

      expect(result.success).toBe(true);
      expect(result.connected).toBe(true);
      expect(result.supabaseAvailable).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });
  });
});