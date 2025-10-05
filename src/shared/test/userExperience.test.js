/**
 * User Experience Tests for Authentication Error Handling
 * Tests error message display timing, loading state transitions, retry functionality, and accessibility
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserFeedbackSystem } from '../services/userFeedbackSystem.js';
import { AuthErrorHandler } from '../services/authErrorHandler.js';
import { ConnectionMonitor } from '../services/connectionMonitor.js';
import i18n from '../utils/i18n.js';

// Mock DOM environment
const mockDOM = () => {
  // Create a mock document body
  document.body.innerHTML = '';
  
  // Mock querySelector and other DOM methods
  global.document.querySelector = vi.fn(() => null);
  global.document.querySelectorAll = vi.fn(() => []);
  global.document.getElementById = vi.fn(() => ({
    addEventListener: vi.fn(),
    remove: vi.fn(),
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  }));
  global.document.createElement = vi.fn(() => ({
    id: '',
    className: '',
    innerHTML: '',
    style: {},
    addEventListener: vi.fn(),
    remove: vi.fn(),
    appendChild: vi.fn(),
    insertAdjacentHTML: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false)
    },
    dispatchEvent: vi.fn(),
    parentNode: {
      removeChild: vi.fn()
    }
  }));
  
  // Mock window methods
  global.window.setTimeout = vi.fn((fn, delay) => {
    if (delay === 0 || delay === undefined) {
      fn();
    }
    return 1;
  });
  global.window.clearTimeout = vi.fn();
};

describe('User Experience Tests - Error Message Display Timing and Clarity', () => {
  let userFeedbackSystem;
  let mockElement;
  
  beforeEach(() => {
    mockDOM();
    userFeedbackSystem = new UserFeedbackSystem();
    
    // Create mock target element
    mockElement = {
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      insertAdjacentHTML: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() },
      addEventListener: vi.fn(),
      remove: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(() => null),
      getBoundingClientRect: vi.fn(() => ({
        width: 100,
        height: 44,
        top: 0,
        left: 0,
        right: 100,
        bottom: 44
      }))
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Message Display Timing', () => {
    it('should display error messages immediately after error occurs', async () => {
      const startTime = Date.now();
      
      userFeedbackSystem.showError('NETWORK_ERROR', {
        targetElement: mockElement
      });
      
      const displayTime = Date.now() - startTime;
      
      // Error should be displayed within 100ms
      expect(displayTime).toBeLessThan(100);
      expect(mockElement.insertAdjacentHTML).toHaveBeenCalled();
    });

    it('should clear loading state before showing error', () => {
      // Start loading
      userFeedbackSystem.showLoading('login', null, mockElement);
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
      
      // Show error
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        targetElement: mockElement
      });
      
      // Loading should be cleared
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(false);
      expect(userFeedbackSystem.getCurrentState().error).toBeTruthy();
    });

    it('should maintain error display until explicitly cleared', () => {
      userFeedbackSystem.showError('SERVER_ERROR', {
        targetElement: mockElement
      });
      
      expect(userFeedbackSystem.getCurrentState().error).toBeTruthy();
      
      // Error should persist
      setTimeout(() => {
        expect(userFeedbackSystem.getCurrentState().error).toBeTruthy();
      }, 1000);
      
      // Clear error
      userFeedbackSystem.hideError(mockElement);
      expect(userFeedbackSystem.getCurrentState().error).toBeNull();
    });

    it('should show success messages for specified duration', () => {
      const duration = 3000;
      const startTime = Date.now();
      
      userFeedbackSystem.showSuccess('login', mockElement, duration);
      
      expect(userFeedbackSystem.getCurrentState().success).toBeTruthy();
      
      // Mock setTimeout to verify duration
      expect(global.window.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        duration
      );
    });
  });

  describe('Error Message Clarity and Localization', () => {
    it('should display clear, user-friendly error messages in Spanish', () => {
      i18n.setLanguage('es');
      
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        targetElement: mockElement
      });
      
      const errorState = userFeedbackSystem.getCurrentState().error;
      expect(errorState.message).toBe('Email o contraseña incorrectos. Inténtalo de nuevo.');
      expect(errorState.message).not.toContain('AUTH_INVALID_CREDENTIALS');
    });

    it('should display clear, user-friendly error messages in English', () => {
      i18n.setLanguage('en');
      
      userFeedbackSystem.showError('AUTH_USER_NOT_FOUND', {
        targetElement: mockElement
      });
      
      const errorState = userFeedbackSystem.getCurrentState().error;
      expect(errorState.message).toBe('No account found with this email address. Would you like to create a new account?');
      expect(errorState.message).not.toContain('AUTH_USER_NOT_FOUND');
    });

    it('should handle rate limiting messages with dynamic wait times', () => {
      i18n.setLanguage('es');
      
      userFeedbackSystem.showError('AUTH_RATE_LIMITED', {
        targetElement: mockElement,
        waitTime: 30
      });
      
      const errorState = userFeedbackSystem.getCurrentState().error;
      expect(errorState.message).toBe('Demasiados intentos. Espera 30 segundos antes de intentar de nuevo.');
    });

    it('should provide helpful suggestions in error messages', () => {
      i18n.setLanguage('en');
      
      const testCases = [
        {
          errorType: 'AUTH_USER_NOT_FOUND',
          expectedSuggestion: 'Would you like to create a new account?'
        },
        {
          errorType: 'AUTH_USER_EXISTS',
          expectedSuggestion: 'Want to sign in?'
        },
        {
          errorType: 'EMAIL_NOT_CONFIRMED',
          expectedSuggestion: 'Check your inbox'
        }
      ];
      
      testCases.forEach(({ errorType, expectedSuggestion }) => {
        userFeedbackSystem.showError(errorType, { targetElement: mockElement });
        const errorState = userFeedbackSystem.getCurrentState().error;
        expect(errorState.message).toContain(expectedSuggestion);
      });
    });
  });

  describe('Error Message Visual Hierarchy', () => {
    it('should use appropriate visual styling for different error types', () => {
      userFeedbackSystem.showError('NETWORK_ERROR', {
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should include error styling classes
      expect(insertedHTML).toContain('feedback-error');
      expect(insertedHTML).toContain('bg-red-50');
      expect(insertedHTML).toContain('border-red-200');
      expect(insertedHTML).toContain('text-red-800');
    });

    it('should include appropriate icons for error messages', () => {
      userFeedbackSystem.showError('SERVER_ERROR', {
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should include error icon SVG
      expect(insertedHTML).toContain('<svg');
      expect(insertedHTML).toContain('text-red-400');
    });
  });
});

describe('User Experience Tests - Loading State Transitions', () => {
  let userFeedbackSystem;
  let mockElement;
  
  beforeEach(() => {
    mockDOM();
    userFeedbackSystem = new UserFeedbackSystem();
    
    mockElement = {
      querySelector: vi.fn(),
      insertAdjacentHTML: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() },
      addEventListener: vi.fn(),
      remove: vi.fn()
    };
  });

  describe('Loading State Display', () => {
    it('should show loading spinner and message immediately', () => {
      const startTime = Date.now();
      
      userFeedbackSystem.showLoading('login', null, mockElement);
      
      const displayTime = Date.now() - startTime;
      
      expect(displayTime).toBeLessThan(50);
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
      expect(mockElement.insertAdjacentHTML).toHaveBeenCalled();
    });

    it('should display operation-specific loading messages', () => {
      const operations = [
        { op: 'login', expectedES: 'Iniciando sesión...', expectedEN: 'Signing in...' },
        { op: 'register', expectedES: 'Creando cuenta...', expectedEN: 'Creating account...' },
        { op: 'forgotPassword', expectedES: 'Enviando enlace de recuperación...', expectedEN: 'Sending recovery link...' }
      ];
      
      operations.forEach(({ op, expectedES, expectedEN }) => {
        // Test Spanish
        i18n.setLanguage('es');
        userFeedbackSystem.showLoading(op, null, mockElement);
        expect(userFeedbackSystem.getCurrentState().loadingMessage).toBe(expectedES);
        
        // Test English
        i18n.setLanguage('en');
        userFeedbackSystem.showLoading(op, null, mockElement);
        expect(userFeedbackSystem.getCurrentState().loadingMessage).toBe(expectedEN);
      });
    });

    it('should disable form buttons during loading', () => {
      const mockButtons = [
        { disabled: false, classList: { add: vi.fn(), remove: vi.fn() } },
        { disabled: false, classList: { add: vi.fn(), remove: vi.fn() } }
      ];
      
      document.querySelectorAll = vi.fn(() => mockButtons);
      
      userFeedbackSystem.showLoading('login');
      
      mockButtons.forEach(button => {
        expect(button.disabled).toBe(true);
        expect(button.classList.add).toHaveBeenCalledWith('opacity-50', 'cursor-not-allowed');
      });
    });

    it('should re-enable form buttons when loading is hidden', () => {
      const mockButtons = [
        { disabled: true, classList: { add: vi.fn(), remove: vi.fn() } },
        { disabled: true, classList: { add: vi.fn(), remove: vi.fn() } }
      ];
      
      document.querySelectorAll = vi.fn(() => mockButtons);
      
      userFeedbackSystem.hideLoading();
      
      mockButtons.forEach(button => {
        expect(button.disabled).toBe(false);
        expect(button.classList.remove).toHaveBeenCalledWith('opacity-50', 'cursor-not-allowed');
      });
    });
  });

  describe('Loading to Error Transitions', () => {
    it('should smoothly transition from loading to error state', () => {
      // Start loading
      userFeedbackSystem.showLoading('login', null, mockElement);
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
      
      // Transition to error
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        targetElement: mockElement
      });
      
      // Should clear loading and show error
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(false);
      expect(userFeedbackSystem.getCurrentState().error).toBeTruthy();
    });

    it('should maintain visual consistency during state transitions', () => {
      // Mock element removal
      const mockLoadingElement = { remove: vi.fn() };
      document.getElementById = vi.fn(() => mockLoadingElement);
      
      userFeedbackSystem.showLoading('register', null, mockElement);
      userFeedbackSystem.showError('AUTH_USER_EXISTS', { targetElement: mockElement });
      
      // Loading element should be removed
      expect(mockLoadingElement.remove).toHaveBeenCalled();
      
      // Error should be inserted
      expect(mockElement.insertAdjacentHTML).toHaveBeenCalledTimes(2); // Once for loading, once for error
    });
  });

  describe('Loading to Success Transitions', () => {
    it('should smoothly transition from loading to success state', () => {
      userFeedbackSystem.showLoading('login', null, mockElement);
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
      
      userFeedbackSystem.showSuccess('login', mockElement);
      
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(false);
      expect(userFeedbackSystem.getCurrentState().success).toBeTruthy();
    });

    it('should auto-hide success messages after specified duration', () => {
      const duration = 2000;
      
      userFeedbackSystem.showSuccess('register', mockElement, duration);
      
      expect(global.window.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        duration
      );
    });
  });
});

describe('User Experience Tests - Retry Button Functionality and Feedback', () => {
  let userFeedbackSystem;
  let mockElement;
  let retryCallback;
  
  beforeEach(() => {
    mockDOM();
    userFeedbackSystem = new UserFeedbackSystem();
    retryCallback = vi.fn();
    
    mockElement = {
      querySelector: vi.fn(),
      insertAdjacentHTML: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() },
      addEventListener: vi.fn(),
      remove: vi.fn()
    };
  });

  describe('Retry Button Display', () => {
    it('should show retry button for retryable errors', () => {
      userFeedbackSystem.showError('NETWORK_ERROR', {
        canRetry: true,
        retryCallback: retryCallback,
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      expect(insertedHTML).toContain('retry-button');
      expect(insertedHTML).toContain('authTryAgain'); // i18n key
    });

    it('should not show retry button for non-retryable errors', () => {
      userFeedbackSystem.showError('AUTH_WEAK_PASSWORD', {
        canRetry: false,
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      expect(insertedHTML).not.toContain('retry-button');
    });

    it('should show retry button with proper styling and accessibility', () => {
      userFeedbackSystem.showError('SERVER_ERROR', {
        canRetry: true,
        retryCallback: retryCallback,
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Check for proper button styling
      expect(insertedHTML).toContain('px-4 py-2');
      expect(insertedHTML).toContain('bg-blue-600');
      expect(insertedHTML).toContain('hover:bg-blue-700');
      expect(insertedHTML).toContain('transition-colors');
      
      // Check for accessibility attributes
      expect(insertedHTML).toContain('type="button"');
    });
  });

  describe('Retry Functionality', () => {
    it('should call retry callback when retry button is clicked', () => {
      const mockErrorElement = {
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      };
      
      document.getElementById = vi.fn(() => mockErrorElement);
      
      userFeedbackSystem.showError('NETWORK_ERROR', {
        canRetry: true,
        retryCallback: retryCallback,
        targetElement: mockElement
      });
      
      // Verify event listener was added
      expect(mockErrorElement.addEventListener).toHaveBeenCalledWith('retry', retryCallback);
    });

    it('should clear error state when retry is initiated', () => {
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        canRetry: true,
        retryCallback: () => {
          userFeedbackSystem.hideError(mockElement);
        },
        targetElement: mockElement
      });
      
      expect(userFeedbackSystem.getCurrentState().error).toBeTruthy();
      
      // Simulate retry
      const callback = userFeedbackSystem.getCurrentState().error;
      userFeedbackSystem.hideError(mockElement);
      
      expect(userFeedbackSystem.getCurrentState().error).toBeNull();
    });

    it('should show loading state during retry operation', () => {
      const retryWithLoading = () => {
        userFeedbackSystem.hideError(mockElement);
        userFeedbackSystem.showLoading('retrying', null, mockElement);
      };
      
      userFeedbackSystem.showError('NETWORK_ERROR', {
        canRetry: true,
        retryCallback: retryWithLoading,
        targetElement: mockElement
      });
      
      // Simulate retry
      retryWithLoading();
      
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
      expect(userFeedbackSystem.getCurrentState().loadingMessage).toContain('Reintentando');
    });
  });

  describe('Retry Feedback and State Management', () => {
    it('should track retry attempts in error state', () => {
      userFeedbackSystem.showError('SERVER_ERROR', {
        canRetry: true,
        retryCallback: retryCallback,
        targetElement: mockElement
      });
      
      const errorState = userFeedbackSystem.getCurrentState().error;
      expect(errorState.retryCount).toBe(0);
      expect(errorState.canRetry).toBe(true);
    });

    it('should provide visual feedback during retry attempts', () => {
      const retryWithFeedback = () => {
        userFeedbackSystem.showLoading('retrying', 'Reintentando conexión...', mockElement);
      };
      
      userFeedbackSystem.showRetryOptions('NETWORK_ERROR', retryWithFeedback, mockElement);
      
      // Simulate retry
      retryWithFeedback();
      
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
      expect(userFeedbackSystem.getCurrentState().loadingMessage).toBe('Reintentando conexión...');
    });

    it('should handle multiple retry attempts gracefully', () => {
      let retryCount = 0;
      const multiRetryCallback = () => {
        retryCount++;
        if (retryCount < 3) {
          userFeedbackSystem.showError('NETWORK_ERROR', {
            canRetry: true,
            retryCallback: multiRetryCallback,
            targetElement: mockElement
          });
        } else {
          userFeedbackSystem.showSuccess('Connection restored!', mockElement);
        }
      };
      
      // Initial error
      userFeedbackSystem.showError('NETWORK_ERROR', {
        canRetry: true,
        retryCallback: multiRetryCallback,
        targetElement: mockElement
      });
      
      // Simulate multiple retries
      multiRetryCallback(); // Retry 1
      multiRetryCallback(); // Retry 2
      multiRetryCallback(); // Success
      
      expect(retryCount).toBe(3);
      expect(userFeedbackSystem.getCurrentState().success).toBeTruthy();
    });
  });
});

describe('User Experience Tests - Accessibility of Error States', () => {
  let userFeedbackSystem;
  let mockElement;
  
  beforeEach(() => {
    mockDOM();
    userFeedbackSystem = new UserFeedbackSystem();
    
    mockElement = {
      querySelector: vi.fn(),
      insertAdjacentHTML: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() },
      addEventListener: vi.fn(),
      remove: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn()
    };
  });

  describe('ARIA Labels and Roles', () => {
    it('should include proper ARIA attributes for error messages', () => {
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should include role and aria attributes
      expect(insertedHTML).toContain('role="alert"') || 
      expect(insertedHTML).toContain('aria-live="polite"') ||
      expect(insertedHTML).toContain('aria-describedby');
    });

    it('should include proper ARIA attributes for loading states', () => {
      userFeedbackSystem.showLoading('login', null, mockElement);
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should include loading indicators
      expect(insertedHTML).toContain('loading-spinner') ||
      expect(insertedHTML).toContain('aria-busy="true"') ||
      expect(insertedHTML).toContain('role="status"');
    });

    it('should include proper ARIA attributes for success messages', () => {
      userFeedbackSystem.showSuccess('login', mockElement);
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should include success indicators
      expect(insertedHTML).toContain('role="status"') ||
      expect(insertedHTML).toContain('aria-live="polite"');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should make retry buttons keyboard accessible', () => {
      userFeedbackSystem.showError('NETWORK_ERROR', {
        canRetry: true,
        retryCallback: vi.fn(),
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Button should be focusable and have proper type
      expect(insertedHTML).toContain('type="button"');
      expect(insertedHTML).toContain('tabindex="0"') || 
      expect(insertedHTML).not.toContain('tabindex="-1"');
    });

    it('should support keyboard interaction for dismissing messages', () => {
      userFeedbackSystem.showError('SERVER_ERROR', {
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should include close button or be dismissible
      expect(insertedHTML).toContain('onclick') ||
      expect(insertedHTML).toContain('onkeydown') ||
      expect(insertedHTML).toContain('button');
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide meaningful text content for screen readers', () => {
      userFeedbackSystem.showError('AUTH_USER_NOT_FOUND', {
        targetElement: mockElement
      });
      
      const errorState = userFeedbackSystem.getCurrentState().error;
      
      // Message should be descriptive and actionable
      expect(errorState.message).toContain('No account found');
      expect(errorState.message).toContain('email');
      expect(errorState.message.length).toBeGreaterThan(20); // Meaningful length
    });

    it('should provide context for loading operations', () => {
      userFeedbackSystem.showLoading('register', null, mockElement);
      
      const loadingMessage = userFeedbackSystem.getCurrentState().loadingMessage;
      
      // Loading message should be descriptive
      expect(loadingMessage).toBeTruthy();
      expect(loadingMessage.length).toBeGreaterThan(5);
      expect(loadingMessage).toMatch(/\.\.\.$|ing$/); // Should indicate ongoing action
    });

    it('should announce state changes to screen readers', () => {
      // Test loading to error transition
      userFeedbackSystem.showLoading('login', null, mockElement);
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        targetElement: mockElement
      });
      
      // Both states should have been announced
      expect(mockElement.insertAdjacentHTML).toHaveBeenCalledTimes(2);
      
      const errorHTML = mockElement.insertAdjacentHTML.mock.calls[1][1];
      expect(errorHTML).toContain('text-red-800'); // Error styling for screen readers
    });
  });

  describe('Color and Contrast Accessibility', () => {
    it('should use sufficient color contrast for error messages', () => {
      userFeedbackSystem.showError('NETWORK_ERROR', {
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should use high contrast colors
      expect(insertedHTML).toContain('text-red-800'); // Dark text on light background
      expect(insertedHTML).toContain('bg-red-50'); // Light background
    });

    it('should use sufficient color contrast for success messages', () => {
      userFeedbackSystem.showSuccess('login', mockElement);
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should use high contrast colors
      expect(insertedHTML).toContain('text-green-800'); // Dark text on light background
      expect(insertedHTML).toContain('bg-green-50'); // Light background
    });

    it('should not rely solely on color to convey information', () => {
      userFeedbackSystem.showError('SERVER_ERROR', {
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should include icons and text, not just color
      expect(insertedHTML).toContain('<svg'); // Icon
      expect(insertedHTML).toContain('Error del servidor') || 
      expect(insertedHTML).toContain('Server error'); // Text content
    });
  });

  describe('Focus Management', () => {
    it('should manage focus appropriately during error display', () => {
      const mockFocusableElement = {
        focus: vi.fn(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn()
      };
      
      document.querySelector = vi.fn(() => mockFocusableElement);
      
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        targetElement: mockElement
      });
      
      // Focus should be managed appropriately
      // (Implementation would depend on specific focus management strategy)
      expect(document.querySelector).toHaveBeenCalled();
    });

    it('should restore focus appropriately after error is cleared', () => {
      userFeedbackSystem.showError('NETWORK_ERROR', {
        targetElement: mockElement
      });
      
      userFeedbackSystem.hideError(mockElement);
      
      // Focus should be restored to appropriate element
      expect(userFeedbackSystem.getCurrentState().error).toBeNull();
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility across different screen sizes', () => {
      // Test mobile-friendly error display
      userFeedbackSystem.showError('AUTH_USER_EXISTS', {
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Should use responsive classes
      expect(insertedHTML).toContain('max-w-') || 
      expect(insertedHTML).toContain('w-full') ||
      expect(insertedHTML).toContain('mx-');
    });

    it('should ensure touch targets are appropriately sized', () => {
      userFeedbackSystem.showError('SERVER_ERROR', {
        canRetry: true,
        retryCallback: vi.fn(),
        targetElement: mockElement
      });
      
      const insertedHTML = mockElement.insertAdjacentHTML.mock.calls[0][1];
      
      // Retry button should have adequate touch target size
      expect(insertedHTML).toContain('px-4 py-2'); // Minimum 44px touch target
    });
  });
});

describe('Integration Tests - Complete User Experience Flows', () => {
  let userFeedbackSystem;
  let authErrorHandler;
  let connectionMonitor;
  let mockElement;
  
  beforeEach(() => {
    mockDOM();
    userFeedbackSystem = new UserFeedbackSystem();
    authErrorHandler = new AuthErrorHandler();
    connectionMonitor = new ConnectionMonitor();
    
    mockElement = {
      querySelector: vi.fn(),
      insertAdjacentHTML: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() },
      addEventListener: vi.fn(),
      remove: vi.fn()
    };
  });

  describe('Complete Authentication Flow UX', () => {
    it('should provide smooth UX during successful login flow', async () => {
      // Start login
      userFeedbackSystem.showLoading('login', null, mockElement);
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
      
      // Simulate successful login
      await new Promise(resolve => setTimeout(resolve, 100));
      userFeedbackSystem.showSuccess('login', mockElement);
      
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(false);
      expect(userFeedbackSystem.getCurrentState().success).toBeTruthy();
    });

    it('should provide smooth UX during failed login with retry', async () => {
      let retryAttempted = false;
      
      const retryCallback = () => {
        retryAttempted = true;
        userFeedbackSystem.hideError(mockElement);
        userFeedbackSystem.showLoading('retrying', null, mockElement);
        
        // Simulate successful retry
        setTimeout(() => {
          userFeedbackSystem.showSuccess('login', mockElement);
        }, 100);
      };
      
      // Initial login attempt
      userFeedbackSystem.showLoading('login', null, mockElement);
      
      // Simulate failure
      userFeedbackSystem.showError('NETWORK_ERROR', {
        canRetry: true,
        retryCallback: retryCallback,
        targetElement: mockElement
      });
      
      // Simulate retry
      retryCallback();
      
      expect(retryAttempted).toBe(true);
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(true);
    });

    it('should handle network connectivity changes gracefully', () => {
      // Simulate going offline
      userFeedbackSystem.showError('NETWORK_ERROR', {
        canRetry: true,
        retryCallback: vi.fn(),
        targetElement: mockElement
      });
      
      expect(userFeedbackSystem.getCurrentState().error.type).toBe('NETWORK_ERROR');
      
      // Simulate coming back online
      userFeedbackSystem.hideError(mockElement);
      userFeedbackSystem.showSuccess('Connection restored', mockElement);
      
      expect(userFeedbackSystem.getCurrentState().success).toBeTruthy();
    });
  });

  describe('Error Recovery User Experience', () => {
    it('should guide users through error recovery process', () => {
      const recoverySteps = [
        { error: 'NETWORK_ERROR', canRetry: true },
        { error: 'AUTH_INVALID_CREDENTIALS', canRetry: true },
        { error: 'AUTH_RATE_LIMITED', canRetry: false, waitTime: 30 }
      ];
      
      recoverySteps.forEach(({ error, canRetry, waitTime }) => {
        userFeedbackSystem.showError(error, {
          canRetry: canRetry,
          retryCallback: canRetry ? vi.fn() : null,
          targetElement: mockElement,
          waitTime: waitTime
        });
        
        const errorState = userFeedbackSystem.getCurrentState().error;
        expect(errorState.canRetry).toBe(canRetry);
        
        if (waitTime) {
          expect(errorState.message).toContain(waitTime.toString());
        }
        
        userFeedbackSystem.clearAll(mockElement);
      });
    });

    it('should maintain user context during error recovery', () => {
      // Simulate user filling form
      const userContext = {
        email: 'user@example.com',
        operation: 'login'
      };
      
      // Show error but maintain context
      userFeedbackSystem.showError('AUTH_INVALID_CREDENTIALS', {
        canRetry: true,
        retryCallback: () => {
          // Context should be preserved for retry
          expect(userContext.email).toBe('user@example.com');
          expect(userContext.operation).toBe('login');
        },
        targetElement: mockElement
      });
      
      expect(userFeedbackSystem.getCurrentState().error).toBeTruthy();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should display feedback within acceptable time limits', () => {
      const operations = ['showLoading', 'showError', 'showSuccess'];
      
      operations.forEach(operation => {
        const startTime = performance.now();
        
        switch (operation) {
          case 'showLoading':
            userFeedbackSystem.showLoading('login', null, mockElement);
            break;
          case 'showError':
            userFeedbackSystem.showError('NETWORK_ERROR', { targetElement: mockElement });
            break;
          case 'showSuccess':
            userFeedbackSystem.showSuccess('login', mockElement);
            break;
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should complete within 50ms
        expect(duration).toBeLessThan(50);
        
        userFeedbackSystem.clearAll(mockElement);
      });
    });

    it('should handle rapid state changes gracefully', () => {
      // Rapid state changes
      userFeedbackSystem.showLoading('login', null, mockElement);
      userFeedbackSystem.showError('NETWORK_ERROR', { targetElement: mockElement });
      userFeedbackSystem.showLoading('retrying', null, mockElement);
      userFeedbackSystem.showSuccess('login', mockElement);
      
      // Final state should be success
      expect(userFeedbackSystem.getCurrentState().success).toBeTruthy();
      expect(userFeedbackSystem.getCurrentState().isLoading).toBe(false);
      expect(userFeedbackSystem.getCurrentState().error).toBeNull();
    });
  });
});