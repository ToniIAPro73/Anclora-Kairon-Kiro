import { supabase } from '../config/supabase.js';

/**
 * Authentication service for handling user authentication
 * Uses Supabase Auth with fallback to mock implementation
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
    try {
      if (this.isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw new Error(error.message);
        }

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
          return response.user;
        } else {
          throw new Error(response.message || 'Error al iniciar sesión');
        }
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
          return response.user;
        } else {
          throw new Error(response.message || 'Error al crear la cuenta');
        }
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
      if (this.isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        // OAuth redirect will handle the rest
        return data;
      } else {
        // Fallback to mock implementation
        const response = await this.mockApiCall('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ provider: 'google' })
        });

        if (response.success) {
          this.currentUser = response.user;
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(this.currentUser));
          return response.user;
        } else {
          throw new Error(response.message || 'Error en autenticación con Google');
        }
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
      if (this.isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        // OAuth redirect will handle the rest
        return data;
      } else {
        // Fallback to mock implementation
        const response = await this.mockApiCall('/auth/github', {
          method: 'POST',
          body: JSON.stringify({ provider: 'github' })
        });

        if (response.success) {
          this.currentUser = response.user;
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(this.currentUser));
          return response.user;
        } else {
          throw new Error(response.message || 'Error en autenticación con GitHub');
        }
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
      if (this.isSupabaseEnabled) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`
        });

        if (error) {
          throw new Error(error.message);
        }

        return true;
      } else {
        // Fallback to mock implementation
        const response = await this.mockApiCall('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        if (response.success) {
          return true;
        } else {
          throw new Error(response.message || 'Error al enviar email de recuperación');
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.isSupabaseEnabled) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout error:', error);
        }
      } else {
        // Mock implementation cleanup
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }

      this.currentUser = null;
      this.session = null;
      this.handleSignOut();
      
      window.location.href = '/';
    } catch (error) {
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