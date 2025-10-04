/**
 * Authentication service for handling user authentication
 * This is a mock implementation for MVP - replace with real API calls
 */

class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.currentUser = null;
    this.token = localStorage.getItem('auth_token');
    
    // Initialize user from token if exists
    if (this.token) {
      this.getCurrentUser();
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} - User data
   */
  async login(email, password) {
    try {
      // Mock API call - replace with real implementation
      const response = await this.mockApiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        this.token = response.token;
        this.currentUser = response.user;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user_data', JSON.stringify(this.currentUser));
        return response.user;
      } else {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
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
    try {
      // Mock API call - replace with real implementation
      const response = await this.mockApiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (response.success) {
        this.token = response.token;
        this.currentUser = response.user;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user_data', JSON.stringify(this.currentUser));
        return response.user;
      } else {
        throw new Error(response.message || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login with Google OAuth
   * @returns {Promise<object>} - User data
   */
  async loginWithGoogle() {
    try {
      // Mock implementation for development
      const response = await this.mockApiCall('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google' })
      });

      if (response.success) {
        this.token = response.token;
        this.currentUser = response.user;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user_data', JSON.stringify(this.currentUser));
        return response.user;
      } else {
        throw new Error(response.message || 'Error en autenticación con Google');
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  /**
   * Login with GitHub OAuth
   * @returns {Promise<object>} - User data
   */
  async loginWithGitHub() {
    try {
      // Mock implementation for development
      const response = await this.mockApiCall('/auth/github', {
        method: 'POST',
        body: JSON.stringify({ provider: 'github' })
      });

      if (response.success) {
        this.token = response.token;
        this.currentUser = response.user;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user_data', JSON.stringify(this.currentUser));
        return response.user;
      } else {
        throw new Error(response.message || 'Error en autenticación con GitHub');
      }
    } catch (error) {
      console.error('GitHub login error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<boolean>} - Success status
   */
  async resetPassword(email) {
    try {
      const response = await this.mockApiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Error al enviar email de recuperación');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/';
  }

  /**
   * Get current user
   * @returns {object|null} - Current user data
   */
  getCurrentUser() {
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

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    return !!this.token && !!this.getCurrentUser();
  }

  /**
   * Get authentication token
   * @returns {string|null} - Auth token
   */
  getToken() {
    return this.token;
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
}

// Create singleton instance
export const authService = new AuthService();
export default authService;