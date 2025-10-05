/**
 * Unit tests for ErrorLogger
 * Tests error logging with different severity levels, performance metric collection,
 * and log sanitization to prevent sensitive data leaks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import errorLogger from '../services/errorLogger.js';

describe('ErrorLogger', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;
  let consoleDebugSpy;

  beforeEach(() => {
    // Clear existing logs for each test
    errorLogger.errors = [];
    errorLogger.performanceMetrics = [];
    
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
    
    // Mock fetch for remote logging tests
    global.fetch = vi.fn();
    
    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Test Browser)',
      writable: true,
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://test.example.com' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('Error Logging with Different Severity Levels', () => {
    it('should log error with LOW severity level', () => {
      const testError = new Error('Test low severity error');
      const context = { operation: 'test' };
      
      const errorId = errorLogger.logError(testError, context, errorLogger.SEVERITY_LEVELS.LOW);
      
      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LOW] Test low severity error'),
        expect.objectContaining({ operation: 'test' })
      );
      
      // Check that error was stored
      const stats = errorLogger.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsBySeverity.low).toHaveLength(1);
    });

    it('should log error with MEDIUM severity level', () => {
      const testError = new Error('Test medium severity error');
      const context = { operation: 'auth', userId: 'user123' };
      
      const errorId = errorLogger.logError(testError, context, errorLogger.SEVERITY_LEVELS.MEDIUM);
      
      expect(errorId).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MEDIUM] Test medium severity error'),
        expect.objectContaining({ operation: 'auth', userId: 'user123' })
      );
      
      const stats = errorLogger.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsBySeverity.medium).toHaveLength(1);
    });

    it('should log error with HIGH severity level', () => {
      const testError = new Error('Test high severity error');
      const context = { operation: 'critical_auth' };
      
      const errorId = errorLogger.logError(testError, context, errorLogger.SEVERITY_LEVELS.HIGH);
      
      expect(errorId).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HIGH] Test high severity error'),
        expect.objectContaining({ operation: 'critical_auth' })
      );
      
      const stats = errorLogger.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsBySeverity.high).toHaveLength(1);
    });

    it('should log error with CRITICAL severity level', () => {
      const testError = new Error('Test critical severity error');
      const context = { operation: 'system_failure' };
      
      const errorId = errorLogger.logError(testError, context, errorLogger.SEVERITY_LEVELS.CRITICAL);
      
      expect(errorId).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL] Test critical severity error'),
        expect.objectContaining({
          id: errorId,
          message: 'Test critical severity error',
          severity: 'critical',
          context: expect.objectContaining({ operation: 'system_failure' })
        })
      );
      
      const stats = errorLogger.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsBySeverity.critical).toHaveLength(1);
    });

    it('should default to MEDIUM severity when no severity is provided', () => {
      const testError = new Error('Test default severity error');
      
      errorLogger.logError(testError);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MEDIUM] Test default severity error'),
        expect.any(Object)
      );
      
      const stats = errorLogger.getErrorStats();
      expect(stats.errorsBySeverity.medium).toHaveLength(1);
    });

    it('should handle string errors as well as Error objects', () => {
      const stringError = 'This is a string error';
      
      const errorId = errorLogger.logError(stringError, {}, errorLogger.SEVERITY_LEVELS.LOW);
      
      expect(errorId).toBeDefined();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LOW] This is a string error'),
        expect.any(Object)
      );
    });

    it('should include proper error metadata', () => {
      const testError = new Error('Test metadata error');
      testError.stack = 'Error: Test metadata error\n    at test.js:1:1';
      
      errorLogger.logError(testError, { operation: 'test' });
      
      const stats = errorLogger.getErrorStats();
      const loggedError = errorLogger.errors[0];
      
      expect(loggedError).toMatchObject({
        id: expect.any(String),
        timestamp: expect.any(String),
        message: 'Test metadata error',
        stack: expect.stringContaining('Error: Test metadata error'),
        severity: 'medium',
        context: expect.objectContaining({ operation: 'test' }),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'https://test.example.com',
        sessionId: expect.any(String)
      });
    });
  });

  describe('Performance Metric Collection', () => {
    it('should log performance metrics correctly', () => {
      const operation = 'user_login';
      const duration = 1500;
      const success = true;
      const additionalData = { userId: 'user123', method: 'email' };
      
      const metricId = errorLogger.logPerformanceMetric(operation, duration, success, additionalData);
      
      expect(metricId).toBeDefined();
      expect(typeof metricId).toBe('string');
      
      const stats = errorLogger.getErrorStats();
      expect(stats.performanceStats.totalOperations).toBe(1);
      expect(stats.performanceStats.successRate).toBe(100);
      expect(stats.performanceStats.averageDuration).toBe(1500);
    });

    it('should log failed operations correctly', () => {
      const operation = 'user_registration';
      const duration = 800;
      const success = false;
      
      errorLogger.logPerformanceMetric(operation, duration, success);
      
      const stats = errorLogger.getErrorStats();
      expect(stats.performanceStats.totalOperations).toBe(1);
      expect(stats.performanceStats.successRate).toBe(0);
      expect(stats.performanceStats.averageDuration).toBe(800);
    });

    it('should calculate correct success rate with mixed results', () => {
      // Log successful operations
      errorLogger.logPerformanceMetric('login', 1000, true);
      errorLogger.logPerformanceMetric('login', 1200, true);
      errorLogger.logPerformanceMetric('login', 900, true);
      
      // Log failed operations
      errorLogger.logPerformanceMetric('login', 2000, false);
      errorLogger.logPerformanceMetric('login', 1800, false);
      
      const stats = errorLogger.getErrorStats();
      expect(stats.performanceStats.totalOperations).toBe(5);
      expect(stats.performanceStats.successRate).toBe(60); // 3 out of 5 successful
      expect(stats.performanceStats.averageDuration).toBe(1380); // (1000+1200+900+2000+1800)/5
    });

    it('should group performance metrics by operation', () => {
      errorLogger.logPerformanceMetric('login', 1000, true);
      errorLogger.logPerformanceMetric('login', 1200, true);
      errorLogger.logPerformanceMetric('register', 2000, false);
      errorLogger.logPerformanceMetric('logout', 300, true);
      
      const stats = errorLogger.getErrorStats();
      expect(stats.performanceStats.operationStats.login).toHaveLength(2);
      expect(stats.performanceStats.operationStats.register).toHaveLength(1);
      expect(stats.performanceStats.operationStats.logout).toHaveLength(1);
    });

    it('should include proper metric metadata', () => {
      const operation = 'test_operation';
      const duration = 1500;
      const success = true;
      const additionalData = { testData: 'value' };
      
      errorLogger.logPerformanceMetric(operation, duration, success, additionalData);
      
      const metric = errorLogger.performanceMetrics[0];
      expect(metric).toMatchObject({
        id: expect.any(String),
        timestamp: expect.any(String),
        operation: 'test_operation',
        duration: 1500,
        success: true,
        additionalData: expect.objectContaining({ testData: 'value' }),
        sessionId: expect.any(String)
      });
    });

    it('should log to console in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      errorLogger.logPerformanceMetric('test_op', 1000, true);
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Performance: test_op - 1000ms - SUCCESS'
      );
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Log Sanitization to Prevent Sensitive Data Leaks', () => {
    it('should sanitize password fields', () => {
      const testError = new Error('Authentication failed');
      const context = {
        operation: 'login',
        password: 'secretPassword123',
        email: 'user@example.com'
      };
      
      errorLogger.logError(testError, context);
      
      const loggedError = errorLogger.errors[0];
      expect(loggedError.context.password).toBe('[REDACTED]');
      expect(loggedError.context.email).toBe('user@example.com'); // Email should not be redacted
    });

    it('should sanitize token fields', () => {
      const testError = new Error('API call failed');
      const context = {
        operation: 'api_call',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        userId: 'user123'
      };
      
      errorLogger.logError(testError, context);
      
      const loggedError = errorLogger.errors[0];
      expect(loggedError.context.token).toBe('[REDACTED]');
      expect(loggedError.context.userId).toBe('user123');
    });

    it('should sanitize apiKey fields', () => {
      const testError = new Error('External service error');
      const context = {
        operation: 'external_api',
        apiKey: 'sk-1234567890abcdef',
        service: 'external_service'
      };
      
      errorLogger.logError(testError, context);
      
      const loggedError = errorLogger.errors[0];
      expect(loggedError.context.apiKey).toBe('[REDACTED]');
      expect(loggedError.context.service).toBe('external_service');
    });

    it('should sanitize secret fields', () => {
      const testError = new Error('Configuration error');
      const context = {
        operation: 'config',
        secret: 'my-secret-key',
        configName: 'database'
      };
      
      errorLogger.logError(testError, context);
      
      const loggedError = errorLogger.errors[0];
      expect(loggedError.context.secret).toBe('[REDACTED]');
      expect(loggedError.context.configName).toBe('database');
    });

    it('should sanitize authorization fields', () => {
      const testError = new Error('Authorization failed');
      const context = {
        operation: 'auth_check',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        endpoint: '/api/protected'
      };
      
      errorLogger.logError(testError, context);
      
      const loggedError = errorLogger.errors[0];
      expect(loggedError.context.authorization).toBe('[REDACTED]');
      expect(loggedError.context.endpoint).toBe('/api/protected');
    });

    it('should sanitize multiple sensitive fields in the same context', () => {
      const testError = new Error('Multiple sensitive data error');
      const context = {
        operation: 'sensitive_operation',
        password: 'userPassword',
        token: 'jwt-token',
        apiKey: 'api-key-123',
        secret: 'secret-value',
        authorization: 'Bearer token',
        normalField: 'normal-value'
      };
      
      errorLogger.logError(testError, context);
      
      const loggedError = errorLogger.errors[0];
      expect(loggedError.context.password).toBe('[REDACTED]');
      expect(loggedError.context.token).toBe('[REDACTED]');
      expect(loggedError.context.apiKey).toBe('[REDACTED]');
      expect(loggedError.context.secret).toBe('[REDACTED]');
      expect(loggedError.context.authorization).toBe('[REDACTED]');
      expect(loggedError.context.normalField).toBe('normal-value');
    });

    it('should sanitize sensitive fields in performance metrics', () => {
      const additionalData = {
        password: 'userPassword',
        token: 'jwt-token',
        userId: 'user123',
        operation: 'login'
      };
      
      errorLogger.logPerformanceMetric('login', 1000, true, additionalData);
      
      const metric = errorLogger.performanceMetrics[0];
      expect(metric.additionalData.password).toBe('[REDACTED]');
      expect(metric.additionalData.token).toBe('[REDACTED]');
      expect(metric.additionalData.userId).toBe('user123');
      expect(metric.additionalData.operation).toBe('login');
    });

    it('should truncate large context objects', () => {
      const testError = new Error('Large context error');
      const largeContext = {
        operation: 'large_data',
        largeData: 'x'.repeat(6000) // Create a string larger than 5000 characters
      };
      
      errorLogger.logError(testError, largeContext);
      
      const loggedError = errorLogger.errors[0];
      expect(loggedError.context._truncated).toBe(true);
      expect(loggedError.context._originalSize).toBeGreaterThan(5000);
    });

    it('should not modify original context object', () => {
      const testError = new Error('Context modification test');
      const originalContext = {
        operation: 'test',
        password: 'secretPassword',
        normalField: 'normalValue'
      };
      
      // Keep a reference to compare
      const contextCopy = { ...originalContext };
      
      errorLogger.logError(testError, originalContext);
      
      // Original context should remain unchanged
      expect(originalContext).toEqual(contextCopy);
      expect(originalContext.password).toBe('secretPassword');
    });

    it('should handle null and undefined context gracefully', () => {
      const testError = new Error('Null context test');
      
      expect(() => {
        errorLogger.logError(testError, null);
      }).not.toThrow();
      
      expect(() => {
        errorLogger.logError(testError, undefined);
      }).not.toThrow();
      
      const stats = errorLogger.getErrorStats();
      expect(stats.totalErrors).toBe(2);
    });

    it('should handle context with nested objects', () => {
      const testError = new Error('Nested context test');
      const context = {
        operation: 'nested_test',
        user: {
          id: 'user123',
          password: 'nestedPassword'
        },
        config: {
          apiKey: 'nested-api-key',
          endpoint: 'https://api.example.com'
        }
      };
      
      errorLogger.logError(testError, context);
      
      const loggedError = errorLogger.errors[0];
      // Note: Current implementation only sanitizes top-level fields
      // This test documents current behavior
      expect(loggedError.context.user.password).toBe('nestedPassword');
      expect(loggedError.context.config.apiKey).toBe('nested-api-key');
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle logging errors gracefully', () => {
      // Mock localStorage to throw an error
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const testError = new Error('Test error during logging');
      
      expect(() => {
        errorLogger.logError(testError);
      }).not.toThrow();
      
      // The localStorage error should be logged as a warning, not an error
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to persist to localStorage:',
        expect.any(Error)
      );
    });

    it('should handle performance metric logging errors gracefully', () => {
      // Mock localStorage to throw an error
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => {
        errorLogger.logPerformanceMetric('test', 1000, true);
      }).not.toThrow();
      
      // The localStorage error should be logged as a warning, not an error
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to persist to localStorage:',
        expect.any(Error)
      );
    });

    it('should maintain log limits to prevent memory leaks', () => {
      // Set a small limit for testing
      errorLogger.maxLocalLogs = 3;
      
      // Log more errors than the limit
      for (let i = 0; i < 5; i++) {
        errorLogger.logError(new Error(`Test error ${i}`));
      }
      
      // Should only keep the last 3 errors
      expect(errorLogger.errors).toHaveLength(3);
      expect(errorLogger.errors[0].message).toBe('Test error 2');
      expect(errorLogger.errors[2].message).toBe('Test error 4');
    });

    it('should maintain performance metric limits', () => {
      // Set a small limit for testing
      errorLogger.maxLocalLogs = 2;
      
      // Log more metrics than the limit
      for (let i = 0; i < 4; i++) {
        errorLogger.logPerformanceMetric(`operation_${i}`, 1000, true);
      }
      
      // Should only keep the last 2 metrics
      expect(errorLogger.performanceMetrics).toHaveLength(2);
      expect(errorLogger.performanceMetrics[0].operation).toBe('operation_2');
      expect(errorLogger.performanceMetrics[1].operation).toBe('operation_3');
    });
  });
});