/**
 * Example usage of AuthErrorHandler with AuthService
 * This demonstrates how to integrate the error handler with existing authentication flows
 */

import { authErrorHandler } from '../services/authErrorHandler.js';
import { authService } from '../services/authService.js';

/**
 * Example: Enhanced login with error handling
 */
export async function loginWithErrorHandling(email, password, language = 'es') {
  let attemptCount = 0;
  const maxAttempts = 3;

  while (attemptCount < maxAttempts) {
    try {
      // Attempt login
      const user = await authService.login(email, password);
      
      // Success - return user data
      return {
        success: true,
        user,
        message: language === 'en' ? 'Login successful!' : '¡Inicio de sesión exitoso!'
      };

    } catch (error) {
      attemptCount++;
      
      // Handle error with our error handler
      const handledError = authErrorHandler.handleError(error, {
        operation: 'login',
        attemptCount,
        language
      });

      // If we can't retry or reached max attempts, return error
      if (!handledError.canRetry || attemptCount >= maxAttempts) {
        return {
          success: false,
          error: handledError,
          message: handledError.userMessage,
          canRetry: false
        };
      }

      // If we can retry, continue the loop
      console.log(`Login attempt ${attemptCount} failed, retrying...`);
      
      // Optional: Add delay between retries
      await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
    }
  }

  // This shouldn't be reached, but just in case
  return {
    success: false,
    message: language === 'en' ? 'Maximum retry attempts reached' : 'Máximo número de intentos alcanzado',
    canRetry: false
  };
}

/**
 * Example: Enhanced registration with error handling
 */
export async function registerWithErrorHandling(name, email, password, language = 'es') {
  try {
    // Attempt registration
    const user = await authService.register(name, email, password);
    
    // Success - return user data
    return {
      success: true,
      user,
      message: language === 'en' ? 'Registration successful!' : '¡Registro exitoso!'
    };

  } catch (error) {
    // Handle error with our error handler
    const handledError = authErrorHandler.handleError(error, {
      operation: 'register',
      attemptCount: 1,
      language
    });

    return {
      success: false,
      error: handledError,
      message: handledError.userMessage,
      canRetry: handledError.canRetry
    };
  }
}

/**
 * Example: OAuth login with error handling
 */
export async function oauthLoginWithErrorHandling(provider, language = 'es') {
  try {
    let result;
    
    if (provider === 'google') {
      result = await authService.loginWithGoogle();
    } else if (provider === 'github') {
      result = await authService.loginWithGitHub();
    } else {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    
    return {
      success: true,
      result,
      message: language === 'en' ? `${provider} login initiated` : `Inicio de sesión con ${provider} iniciado`
    };

  } catch (error) {
    // Handle error with our error handler
    const handledError = authErrorHandler.handleError(error, {
      operation: `oauth_${provider}`,
      attemptCount: 1,
      language
    });

    return {
      success: false,
      error: handledError,
      message: handledError.userMessage,
      canRetry: handledError.canRetry
    };
  }
}

/**
 * Example: Display error to user with retry option
 */
export function displayErrorWithRetry(errorResult, retryCallback) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'auth-error-message';
  errorDiv.innerHTML = `
    <div class="error-content">
      <p class="error-text">${errorResult.message}</p>
      ${errorResult.canRetry ? `
        <button class="retry-button" onclick="handleRetry()">
          ${errorResult.error.context.language === 'en' ? 'Try Again' : 'Intentar de Nuevo'}
        </button>
      ` : ''}
    </div>
  `;

  // Add retry functionality
  if (errorResult.canRetry) {
    window.handleRetry = () => {
      errorDiv.remove();
      retryCallback();
    };
  }

  return errorDiv;
}

/**
 * Example: Complete authentication flow with error handling
 */
export class AuthFlowWithErrorHandling {
  constructor(language = 'es') {
    this.language = language;
    this.errorHandler = authErrorHandler;
  }

  async login(email, password) {
    return await loginWithErrorHandling(email, password, this.language);
  }

  async register(name, email, password) {
    return await registerWithErrorHandling(name, email, password, this.language);
  }

  async oauthLogin(provider) {
    return await oauthLoginWithErrorHandling(provider, this.language);
  }

  setLanguage(language) {
    this.language = language;
    this.errorHandler.setDefaultLanguage(language);
  }

  handleError(error, context = {}) {
    return this.errorHandler.handleError(error, {
      ...context,
      language: this.language
    });
  }
}

// Example usage:
/*
const authFlow = new AuthFlowWithErrorHandling('es');

// Login example
const loginResult = await authFlow.login('user@example.com', 'password123');
if (!loginResult.success) {
  console.error('Login failed:', loginResult.message);
  if (loginResult.canRetry) {
    console.log('User can retry this operation');
  }
}

// Register example
const registerResult = await authFlow.register('John Doe', 'john@example.com', 'password123');
if (!registerResult.success) {
  console.error('Registration failed:', registerResult.message);
}
*/