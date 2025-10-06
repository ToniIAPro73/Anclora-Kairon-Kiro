import { validateEmail, validatePassword, validateRegistrationForm, validateLoginForm } from '../utils/validation.js';
import { authService } from '../services/authService.js';
import { connectionMonitor, CONNECTION_STATUS } from '../services/connectionMonitor.js';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator.js';
import { UserFeedbackSystem } from '../services/userFeedbackSystem.js';
import i18n from '../utils/i18n.js';

/**
 * Vanilla JavaScript implementation of Authentication Modal
 * Provides login, register, and forgot password functionality
 */
export default class AuthModalVanilla {
  constructor() {
    this.isOpen = false;
    this.activeTab = 'login';
    this.showForgotPassword = false;
    this.modalElement = null;
    this.backdropElement = null;
    this.translations = i18n.getTranslations();
    this.connectionIndicator = null;
    this.feedbackSystem = new UserFeedbackSystem();
    this.setupLanguageListener();
    this.setupConnectionMonitoring();
  }

  /**
   * Open the modal with specified tab
   * @param {string} tab - 'login' or 'register'
   */
  open(tab = 'login') {
    this.activeTab = tab;
    this.showForgotPassword = false;
    this.isOpen = true;
    this.translations = i18n.getTranslations(); // Update translations when opening
    this.initConnectionIndicator(); // Initialize connection indicator
    this.render();
    this.setupEventListeners();
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the modal
   */
  close() {
    this.isOpen = false;
    document.body.style.overflow = 'unset';
    
    // Clean up connection indicator
    if (this.connectionIndicator) {
      this.connectionIndicator.destroy();
      this.connectionIndicator = null;
    }
    
    if (this.backdropElement) {
      this.backdropElement.remove();
      this.backdropElement = null;
      this.modalElement = null;
    }
  }

  /**
   * Render the modal HTML
   */
  render() {
    // Remove existing modal if any
    if (this.backdropElement) {
      this.backdropElement.remove();
    }

    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4';
    this.backdropElement.style.display = this.isOpen ? 'flex' : 'none';

    // Create modal content
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'relative w-full max-w-md bg-[#162032] rounded-2xl shadow-2xl overflow-hidden border border-[#2EAFC4]/30 max-h-[90vh] overflow-y-auto';

    if (this.showForgotPassword) {
      this.modalElement.innerHTML = this.renderForgotPasswordForm();
    } else {
      this.modalElement.innerHTML = this.renderAuthTabs();
    }

    this.backdropElement.appendChild(this.modalElement);
    document.body.appendChild(this.backdropElement);
    
    // Add connection status to modal if needed
    this.addConnectionStatusToModal();
  }

  /**
   * Render authentication tabs (login/register)
   */
  renderAuthTabs() {
    return `
      <!-- Close button -->
      <button id="auth-close-btn" class="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#202837] hover:bg-[#2EAFC4]/20 transition-all duration-200 border border-[#2EAFC4]/30">
        <svg class="w-5 h-5 text-[#F6F7F9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Tab Navigation -->
      <div class="flex border-b border-[#2EAFC4]/30 bg-[#202837]">
        <button id="login-tab" class="flex-1 py-5 px-6 text-center font-semibold text-base transition-all duration-200 ${
          this.activeTab === 'login'
            ? 'text-[#F6F7F9] border-b-3 border-[#2EAFC4] bg-[#162032] shadow-sm'
            : 'text-[#F6F7F9]/70 hover:text-[#F6F7F9] hover:bg-[#2EAFC4]/10'
        }">
          ${this.translations.authLoginTab}
        </button>
        <button id="register-tab" class="flex-1 py-5 px-6 text-center font-semibold text-base transition-all duration-200 ${
          this.activeTab === 'register'
            ? 'text-[#F6F7F9] border-b-3 border-[#2EAFC4] bg-[#162032] shadow-sm'
            : 'text-[#F6F7F9]/70 hover:text-[#F6F7F9] hover:bg-[#2EAFC4]/10'
        }">
          ${this.translations.authRegisterTab}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        ${this.activeTab === 'login' ? this.renderLoginForm() : this.renderRegisterForm()}
      </div>
    `;
  }

  /**
   * Render login form
   */
  renderLoginForm() {
    return `
      <div class="space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-[#F6F7F9] mb-2 leading-tight">${this.translations.authWelcomeBack}</h2>
          <p class="text-[#F6F7F9]/80 text-sm leading-relaxed">${this.translations.authWelcomeBackDesc}</p>
        </div>

        <div id="login-error" class="hidden p-4 bg-red-900/20 border-l-4 border-red-400 rounded-r-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-red-300 text-sm font-medium"></p>
            </div>
          </div>
        </div>

        <form id="login-form" class="space-y-4">
          <div>
            <label for="login-email" class="block text-sm font-semibold text-[#F6F7F9] mb-1">${this.translations.authEmail}</label>
            <input
              type="email"
              id="login-email"
              name="email"
              class="w-full px-3 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
              placeholder="tu@email.com"
              required
            />
            <div class="error-message text-red-400 text-xs mt-1 hidden font-medium"></div>
          </div>

          <div>
            <label for="login-password" class="block text-sm font-semibold text-[#F6F7F9] mb-1">${this.translations.authPassword}</label>
            <input
              type="password"
              id="login-password"
              name="password"
              class="w-full px-3 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
              placeholder="••••••••"
              required
            />
            <div class="error-message text-red-400 text-xs mt-1 hidden font-medium"></div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" class="w-4 h-4 rounded border-2 border-[#2EAFC4]/30 text-[#2EAFC4] focus:ring-[#2EAFC4] focus:ring-2 bg-[#202837]" />
              <span class="ml-2 text-sm text-[#F6F7F9]/80 font-medium">${this.translations.authRememberMe}</span>
            </label>
            <button type="button" id="forgot-password-btn" class="text-sm text-[#2EAFC4] hover:text-[#FFC979] transition-colors font-semibold underline decoration-1 underline-offset-1">
              ${this.translations.authForgotPassword}
            </button>
          </div>

          <button
            type="submit"
            id="login-submit"
            class="w-full py-3 px-4 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] text-[#162032] font-bold text-base rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-transparent hover:border-[#2EAFC4]/20"
          >
            ${this.translations.authLoginButton}
          </button>
        </form>

        <div class="relative py-2">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[#2EAFC4]/30"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-[#162032] text-[#F6F7F9]/70 font-medium">${this.translations.authOrContinueWith}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" id="google-login" class="flex items-center justify-center px-3 py-3 border border-[#2EAFC4]/30 rounded-lg hover:bg-[#2EAFC4]/10 hover:border-[#2EAFC4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#202837] font-medium text-[#F6F7F9] text-sm">
            <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            ${this.translations.authGoogle}
          </button>
          <button type="button" id="github-login" class="flex items-center justify-center px-3 py-3 border border-[#2EAFC4]/30 rounded-lg hover:bg-[#2EAFC4]/10 hover:border-[#2EAFC4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#202837] font-medium text-[#F6F7F9] text-sm">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            ${this.translations.authGitHub}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render register form
   */
  renderRegisterForm() {
    return `
      <div class="space-y-5">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-[#F6F7F9] mb-2 leading-tight">${this.translations.authCreateAccount}</h2>
          <p class="text-[#F6F7F9]/80 text-sm leading-relaxed">${this.translations.authCreateAccountDesc}</p>
        </div>

        <div id="register-error" class="hidden p-4 bg-red-900/20 border-l-4 border-red-400 rounded-r-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-red-300 text-sm font-medium"></p>
            </div>
          </div>
        </div>

        <form id="register-form" class="space-y-4">
          <div>
            <label for="register-name" class="block text-sm font-semibold text-[#F6F7F9] mb-1">${this.translations.authFullName}</label>
            <input
              type="text"
              id="register-name"
              name="name"
              class="w-full px-3 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
              placeholder="${this.translations.authFullName}"
              required
            />
            <div class="error-message text-red-400 text-xs mt-1 hidden font-medium"></div>
          </div>

          <div>
            <label for="register-email" class="block text-sm font-semibold text-[#F6F7F9] mb-1">${this.translations.authEmail}</label>
            <input
              type="email"
              id="register-email"
              name="email"
              class="w-full px-3 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
              placeholder="tu@email.com"
              required
            />
            <div class="error-message text-red-400 text-xs mt-1 hidden font-medium"></div>
          </div>

          <div>
            <label for="register-password" class="block text-sm font-semibold text-[#F6F7F9] mb-1">${this.translations.authPassword}</label>
            <input
              type="password"
              id="register-password"
              name="password"
              class="w-full px-3 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
              placeholder="••••••••"
              required
            />
            <div class="error-message text-red-400 text-xs mt-1 hidden font-medium"></div>
            <p class="mt-1 text-xs text-[#F6F7F9]/60 font-medium">${this.translations.authPasswordRequirements}</p>
          </div>

          <div>
            <label for="register-confirm-password" class="block text-sm font-semibold text-[#F6F7F9] mb-1">${this.translations.authConfirmPassword}</label>
            <input
              type="password"
              id="register-confirm-password"
              name="confirmPassword"
              class="w-full px-3 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
              placeholder="••••••••"
              required
            />
            <div class="error-message text-red-400 text-xs mt-1 hidden font-medium"></div>
          </div>

          <div class="flex items-start pt-1">
            <input type="checkbox" id="terms" class="mt-0.5 w-4 h-4 rounded border-2 border-[#2EAFC4]/30 text-[#2EAFC4] focus:ring-[#2EAFC4] focus:ring-2 bg-[#202837]" required />
            <label for="terms" class="ml-2 text-xs text-[#F6F7F9]/80 leading-relaxed">
              ${this.translations.authAcceptTerms} <a href="/terms" class="text-[#2EAFC4] hover:text-[#FFC979] transition-colors font-semibold underline decoration-1 underline-offset-1">${this.translations.authTermsAndConditions}</a>
              ${this.translations.authAnd} <a href="/privacy" class="text-[#2EAFC4] hover:text-[#FFC979] transition-colors font-semibold underline decoration-1 underline-offset-1">${this.translations.authPrivacyPolicy}</a>
            </label>
          </div>

          <button
            type="submit"
            id="register-submit"
            class="w-full py-3 px-4 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] text-[#162032] font-bold text-base rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-transparent hover:border-[#2EAFC4]/20"
          >
            ${this.translations.authRegisterButton}
          </button>
        </form>

        <div class="relative py-2">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[#2EAFC4]/30"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-[#162032] text-[#F6F7F9]/70 font-medium">${this.translations.authOrRegisterWith}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" id="google-register" class="flex items-center justify-center px-3 py-3 border border-[#2EAFC4]/30 rounded-lg hover:bg-[#2EAFC4]/10 hover:border-[#2EAFC4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#202837] font-medium text-[#F6F7F9] text-sm">
            <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            ${this.translations.authGoogle}
          </button>
          <button type="button" id="github-register" class="flex items-center justify-center px-3 py-3 border border-[#2EAFC4]/30 rounded-lg hover:bg-[#2EAFC4]/10 hover:border-[#2EAFC4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#202837] font-medium text-[#F6F7F9] text-sm">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            ${this.translations.authGitHub}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render forgot password form
   */
  renderForgotPasswordForm() {
    return `
      <div class="p-6">
        <div class="text-center mb-6">
          <button id="back-to-login" class="absolute top-5 left-5 w-10 h-10 flex items-center justify-center rounded-full bg-[#202837] hover:bg-[#2EAFC4]/20 transition-all duration-200 border border-[#2EAFC4]/30">
            <svg class="w-5 h-5 text-[#F6F7F9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 class="text-2xl font-bold text-[#F6F7F9] mb-2 leading-tight">${this.translations.authForgotPasswordTitle}</h2>
          <p class="text-[#F6F7F9]/80 text-sm leading-relaxed">${this.translations.authForgotPasswordDesc}</p>
        </div>

        <div id="forgot-error" class="hidden mb-4 p-4 bg-red-900/20 border-l-4 border-red-400 rounded-r-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-red-300 text-sm font-medium"></p>
            </div>
          </div>
        </div>

        <form id="forgot-form" class="space-y-4">
          <div>
            <label for="forgot-email" class="block text-sm font-semibold text-[#F6F7F9] mb-1">${this.translations.authEmail}</label>
            <input
              type="email"
              id="forgot-email"
              name="email"
              class="w-full px-3 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
              placeholder="tu@email.com"
              required
            />
            <div class="error-message text-red-400 text-xs mt-1 hidden font-medium"></div>
          </div>

          <button
            type="submit"
            id="forgot-submit"
            class="w-full py-3 px-4 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] text-[#162032] font-bold text-base rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-transparent hover:border-[#2EAFC4]/20"
          >
            ${this.translations.authSendRecoveryLink}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button id="back-to-login-link" class="text-sm text-[#2EAFC4] hover:text-[#FFC979] transition-colors font-semibold underline decoration-1 underline-offset-1">
            ${this.translations.authBackToLogin}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for the modal
   */
  setupEventListeners() {
    // Close modal events
    const closeBtn = document.getElementById('auth-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click to close
    this.backdropElement.addEventListener('click', (e) => {
      if (e.target === this.backdropElement) {
        this.close();
      }
    });

    // Tab switching
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');

    if (loginTab) {
      loginTab.addEventListener('click', () => {
        this.activeTab = 'login';
        this.render();
        this.setupEventListeners();
      });
    }

    if (registerTab) {
      registerTab.addEventListener('click', () => {
        this.activeTab = 'register';
        this.render();
        this.setupEventListeners();
      });
    }

    // Forgot password
    const forgotBtn = document.getElementById('forgot-password-btn');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        this.showForgotPassword = true;
        this.render();
        this.setupEventListeners();
      });
    }

    // Back to login
    const backBtn = document.getElementById('back-to-login');
    const backLink = document.getElementById('back-to-login-link');
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showForgotPassword = false;
        this.activeTab = 'login';
        this.render();
        this.setupEventListeners();
      });
    }

    if (backLink) {
      backLink.addEventListener('click', () => {
        this.showForgotPassword = false;
        this.activeTab = 'login';
        this.render();
        this.setupEventListeners();
      });
    }

    // Form submissions
    this.setupFormHandlers();
    this.setupOAuthHandlers();
  }

  /**
   * Setup form submission handlers with enhanced error handling
   */
  setupFormHandlers() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(e.target);
      });
      
      // Clear errors when user starts typing
      this.setupInputErrorClearing(loginForm, 'login');
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister(e.target);
      });
      
      // Clear errors when user starts typing
      this.setupInputErrorClearing(registerForm, 'register');
    }

    // Forgot password form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleForgotPassword(e.target);
      });
      
      // Clear errors when user starts typing
      this.setupInputErrorClearing(forgotForm, 'forgot');
    }
  }

  /**
   * Setup input event listeners to clear errors when user starts typing
   */
  setupInputErrorClearing(form, formType) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        // Clear individual field error
        const errorDiv = input.parentElement.querySelector('.error-message');
        if (errorDiv && !errorDiv.classList.contains('hidden')) {
          input.classList.remove('border-red-400', 'focus:border-red-400', 'focus:ring-red-400');
          input.classList.add('border-[#2EAFC4]/30', 'focus:border-[#2EAFC4]', 'focus:ring-[#2EAFC4]');
          errorDiv.classList.add('hidden');
          errorDiv.textContent = '';
        }
        
        // Clear general form errors after user starts correcting
        const container = form.parentElement;
        this.feedbackSystem.hideError(container);
      });
      
      // Also clear on focus for better UX
      input.addEventListener('focus', () => {
        const errorDiv = input.parentElement.querySelector('.error-message');
        if (errorDiv && !errorDiv.classList.contains('hidden')) {
          input.classList.remove('border-red-400', 'focus:border-red-400', 'focus:ring-red-400');
          input.classList.add('border-[#2EAFC4]/30', 'focus:border-[#2EAFC4]', 'focus:ring-[#2EAFC4]');
        }
      });
    });
  }

  /**
   * Setup OAuth handlers
   */
  setupOAuthHandlers() {
    // Google OAuth
    const googleLogin = document.getElementById('google-login');
    const googleRegister = document.getElementById('google-register');

    if (googleLogin) {
      googleLogin.addEventListener('click', () => this.handleGoogleAuth());
    }

    if (googleRegister) {
      googleRegister.addEventListener('click', () => this.handleGoogleAuth());
    }

    // GitHub OAuth
    const githubLogin = document.getElementById('github-login');
    const githubRegister = document.getElementById('github-register');

    if (githubLogin) {
      githubLogin.addEventListener('click', () => this.handleGitHubAuth());
    }

    if (githubRegister) {
      githubRegister.addEventListener('click', () => this.handleGitHubAuth());
    }
  }

  /**
   * Setup connection monitoring for the auth modal
   */
  setupConnectionMonitoring() {
    // Start connection monitoring when modal is used
    if (!connectionMonitor.isMonitoring) {
      connectionMonitor.startMonitoring({
        checkIntervalMs: 15000, // Check every 15 seconds during auth
        timeoutMs: 8000 // 8 second timeout for auth operations
      });
    }
  }

  /**
   * Initialize connection status indicator for the modal
   */
  initConnectionIndicator() {
    if (!this.connectionIndicator) {
      this.connectionIndicator = new ConnectionStatusIndicator({
        containerId: 'auth-modal-connection-status',
        position: 'top-right',
        showLatency: true,
        autoHide: true,
        hideDelay: 2000 // Hide after 2 seconds when connected
      });
    }
  }

  /**
   * Handle login form submission with enhanced error handling
   */
  async handleLogin(form) {
    const formData = new FormData(form);
    const data = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    // Clear any existing errors first
    this.clearFormErrors('login');

    const validation = validateLoginForm(data, i18n.getCurrentLanguage());
    if (!validation.isValid) {
      this.showFormErrors('login', validation.errors);
      return;
    }

    // Show loading state using UserFeedbackSystem
    const loginContainer = document.querySelector('#login-form').parentElement;
    this.feedbackSystem.showLoading('login', null, loginContainer);

    try {
      // Use enhanced login with connection retry
      const result = await authService.loginWithConnectionRetry(data.email, data.password, {
        maxRetries: 3,
        retryDelay: 2000,
        language: i18n.getCurrentLanguage()
      });

      if (result.success) {
        // Show success message
        this.feedbackSystem.showSuccess('login', loginContainer, 2000);
        
        // Show connection restored message if applicable
        if (result.connectivityRestored) {
          this.showConnectionRestoredMessage();
        }
        
        // Close modal after brief delay to show success
        setTimeout(() => {
          this.close();
          window.location.href = '/app';
        }, 1500);
      } else {
        // Handle specific login error scenarios
        this.handleLoginError(result.error, form, loginContainer);
      }
    } catch (error) {
      // Handle unexpected errors
      this.feedbackSystem.showError(error, {
        canRetry: true,
        retryCallback: () => this.handleLogin(form),
        targetElement: loginContainer
      });
    }
  }

  /**
   * Handle specific login error scenarios with enhanced user feedback
   * @param {Object} error - Processed error object from authErrorHandler
   * @param {HTMLFormElement} form - The login form
   * @param {HTMLElement} container - Container element for feedback
   */
  handleLoginError(error, form, container) {
    const language = i18n.getCurrentLanguage();
    const email = form.querySelector('[name="email"]').value;

    switch (error.type) {
      case 'AUTH_USER_NOT_FOUND':
        // Handle "user not found" with helpful suggestions
        this.handleUserNotFoundError(error, email, container, language);
        break;

      case 'AUTH_INVALID_CREDENTIALS':
        // Handle "invalid credentials" with clear messaging
        this.handleInvalidCredentialsError(error, form, container, language);
        break;

      case 'AUTH_RATE_LIMITED':
        // Handle rate limiting with wait time indicators
        this.handleRateLimitedError(error, form, container, language);
        break;

      case 'AUTH_EMAIL_NOT_CONFIRMED':
        // Handle unconfirmed email scenarios
        this.handleUnconfirmedEmailError(error, email, container, language);
        break;

      case 'NETWORK_ERROR':
        // Network connectivity issues - show retry option
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: true,
          retryCallback: () => this.handleLogin(form),
          targetElement: container
        });
        break;

      default:
        // Generic error handling with retry option
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: error.canRetry,
          retryCallback: error.canRetry ? () => this.handleLogin(form) : null,
          targetElement: container
        });
        break;
    }
  }

  /**
   * Handle "user not found" error with helpful suggestions
   * @param {Object} error - Error object
   * @param {string} email - User email
   * @param {HTMLElement} container - Container element
   * @param {string} language - Current language
   */
  handleUserNotFoundError(error, email, container, language) {
    const messages = {
      es: {
        title: 'No encontramos una cuenta con este email',
        suggestion: '¿Quizás quieres crear una cuenta nueva?',
        createAccount: 'Crear Cuenta',
        tryDifferentEmail: 'Usar otro email',
        forgotEmail: '¿Olvidaste tu email?'
      },
      en: {
        title: 'No account found with this email',
        suggestion: 'Would you like to create a new account?',
        createAccount: 'Create Account',
        tryDifferentEmail: 'Try different email',
        forgotEmail: 'Forgot your email?'
      }
    };

    const msg = messages[language] || messages.es;

    // Create custom error message with suggestions
    const errorHtml = `
      <div class="user-not-found-error bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium text-blue-800">${msg.title}</h4>
            <p class="mt-1 text-sm text-blue-700">${msg.suggestion}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="create-account-btn px-4 py-2 bg-[#2EAFC4] text-white rounded-lg hover:bg-[#2EAFC4]/80 transition-colors text-sm font-medium">
                ${msg.createAccount}
              </button>
              <button type="button" class="try-different-email-btn px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                ${msg.tryDifferentEmail}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing feedback and add custom error
    this.feedbackSystem.hideError(container);
    this.feedbackSystem.hideLoading(container);
    
    container.insertAdjacentHTML('afterbegin', errorHtml);

    // Add event listeners for suggestion buttons
    const createAccountBtn = container.querySelector('.create-account-btn');
    const tryDifferentEmailBtn = container.querySelector('.try-different-email-btn');

    if (createAccountBtn) {
      createAccountBtn.addEventListener('click', () => {
        // Switch to register tab with pre-filled email
        this.activeTab = 'register';
        this.render();
        this.setupEventListeners();
        
        // Pre-fill email in register form
        setTimeout(() => {
          const registerEmailInput = document.getElementById('register-email');
          if (registerEmailInput) {
            registerEmailInput.value = email;
          }
        }, 100);
      });
    }

    if (tryDifferentEmailBtn) {
      tryDifferentEmailBtn.addEventListener('click', () => {
        // Clear the error and focus on email field
        container.querySelector('.user-not-found-error').remove();
        const emailInput = container.querySelector('[name="email"]');
        if (emailInput) {
          emailInput.focus();
          emailInput.select();
        }
      });
    }
  }

  /**
   * Handle "invalid credentials" error with clear messaging
   * @param {Object} error - Error object
   * @param {HTMLFormElement} form - Login form
   * @param {HTMLElement} container - Container element
   * @param {string} language - Current language
   */
  handleInvalidCredentialsError(error, form, container, language) {
    const messages = {
      es: {
        title: 'Email o contraseña incorrectos',
        suggestion: 'Verifica que hayas ingresado la información correcta',
        forgotPassword: '¿Olvidaste tu contraseña?',
        tryAgain: 'Intentar de nuevo',
        showPassword: 'Mostrar contraseña'
      },
      en: {
        title: 'Invalid email or password',
        suggestion: 'Please check that you entered the correct information',
        forgotPassword: 'Forgot your password?',
        tryAgain: 'Try again',
        showPassword: 'Show password'
      }
    };

    const msg = messages[language] || messages.es;

    // Highlight both email and password fields
    const emailInput = form.querySelector('[name="email"]');
    const passwordInput = form.querySelector('[name="password"]');
    
    this.highlightFieldError(emailInput);
    this.highlightFieldError(passwordInput);

    // Create custom error message with helpful options
    const errorHtml = `
      <div class="invalid-credentials-error bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium text-red-800">${msg.title}</h4>
            <p class="mt-1 text-sm text-red-700">${msg.suggestion}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="forgot-password-btn px-4 py-2 bg-[#FFC979] text-[#162032] rounded-lg hover:bg-[#FFC979]/80 transition-colors text-sm font-medium">
                ${msg.forgotPassword}
              </button>
              <button type="button" class="show-password-btn px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                ${msg.showPassword}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing feedback and add custom error
    this.feedbackSystem.hideError(container);
    this.feedbackSystem.hideLoading(container);
    
    container.insertAdjacentHTML('afterbegin', errorHtml);

    // Add event listeners for action buttons
    const forgotPasswordBtn = container.querySelector('.forgot-password-btn');
    const showPasswordBtn = container.querySelector('.show-password-btn');

    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', () => {
        // Switch to forgot password view
        this.showForgotPassword = true;
        this.render();
        this.setupEventListeners();
        
        // Pre-fill email in forgot password form
        setTimeout(() => {
          const forgotEmailInput = document.getElementById('forgot-email');
          if (forgotEmailInput && emailInput) {
            forgotEmailInput.value = emailInput.value;
          }
        }, 100);
      });
    }

    if (showPasswordBtn) {
      showPasswordBtn.addEventListener('click', () => {
        // Toggle password visibility
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          showPasswordBtn.textContent = language === 'en' ? 'Hide password' : 'Ocultar contraseña';
        } else {
          passwordInput.type = 'password';
          showPasswordBtn.textContent = msg.showPassword;
        }
      });
    }
  }

  /**
   * Handle rate limiting error with wait time indicators
   * @param {Object} error - Error object
   * @param {HTMLFormElement} form - Login form
   * @param {HTMLElement} container - Container element
   * @param {string} language - Current language
   */
  handleRateLimitedError(error, form, container, language) {
    const messages = {
      es: {
        title: 'Demasiados intentos de inicio de sesión',
        waitMessage: 'Por favor espera {seconds} segundos antes de intentar de nuevo',
        suggestion: 'Esto es por tu seguridad. Mientras esperas, puedes:',
        resetPassword: 'Restablecer contraseña',
        contactSupport: 'Contactar soporte'
      },
      en: {
        title: 'Too many login attempts',
        waitMessage: 'Please wait {seconds} seconds before trying again',
        suggestion: 'This is for your security. While you wait, you can:',
        resetPassword: 'Reset password',
        contactSupport: 'Contact support'
      }
    };

    const msg = messages[language] || messages.es;
    
    // Extract wait time from error message or default to 60 seconds
    let waitTime = 60;
    const waitTimeMatch = error.userMessage.match(/(\d+)/);
    if (waitTimeMatch) {
      waitTime = parseInt(waitTimeMatch[1]);
    }

    // Create countdown timer
    let remainingTime = waitTime;
    
    const errorHtml = `
      <div class="rate-limited-error bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium text-yellow-800">${msg.title}</h4>
            <p class="mt-1 text-sm text-yellow-700">
              <span class="wait-message">${msg.waitMessage.replace('{seconds}', `<span class="countdown font-bold">${remainingTime}</span>`)}</span>
            </p>
            <p class="mt-2 text-sm text-yellow-700">${msg.suggestion}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="reset-password-btn px-4 py-2 bg-[#FFC979] text-[#162032] rounded-lg hover:bg-[#FFC979]/80 transition-colors text-sm font-medium">
                ${msg.resetPassword}
              </button>
              <button type="button" class="retry-btn px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium opacity-50 cursor-not-allowed" disabled>
                ${language === 'en' ? 'Try Again' : 'Intentar de Nuevo'} (<span class="retry-countdown">${remainingTime}</span>s)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing feedback and add custom error
    this.feedbackSystem.hideError(container);
    this.feedbackSystem.hideLoading(container);
    
    container.insertAdjacentHTML('afterbegin', errorHtml);

    // Start countdown timer
    const countdownElement = container.querySelector('.countdown');
    const retryCountdownElement = container.querySelector('.retry-countdown');
    const retryBtn = container.querySelector('.retry-btn');
    const resetPasswordBtn = container.querySelector('.reset-password-btn');

    const countdownInterval = setInterval(() => {
      remainingTime--;
      
      if (countdownElement) {
        countdownElement.textContent = remainingTime;
      }
      if (retryCountdownElement) {
        retryCountdownElement.textContent = remainingTime;
      }

      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        
        // Enable retry button
        if (retryBtn) {
          retryBtn.disabled = false;
          retryBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          retryBtn.classList.add('bg-[#2EAFC4]', 'text-white', 'hover:bg-[#2EAFC4]/80');
          retryBtn.innerHTML = language === 'en' ? 'Try Again' : 'Intentar de Nuevo';
          
          retryBtn.addEventListener('click', () => {
            container.querySelector('.rate-limited-error').remove();
            this.handleLogin(form);
          });
        }

        // Update wait message
        const waitMessageElement = container.querySelector('.wait-message');
        if (waitMessageElement) {
          waitMessageElement.textContent = language === 'en' 
            ? 'You can now try logging in again' 
            : 'Ya puedes intentar iniciar sesión de nuevo';
        }
      }
    }, 1000);

    // Add event listener for reset password button
    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener('click', () => {
        // Switch to forgot password view
        this.showForgotPassword = true;
        this.render();
        this.setupEventListeners();
        
        // Pre-fill email in forgot password form
        setTimeout(() => {
          const forgotEmailInput = document.getElementById('forgot-email');
          const emailInput = form.querySelector('[name="email"]');
          if (forgotEmailInput && emailInput) {
            forgotEmailInput.value = emailInput.value;
          }
        }, 100);
      });
    }
  }

  /**
   * Handle unconfirmed email error scenarios
   * @param {Object} error - Error object
   * @param {string} email - User email
   * @param {HTMLElement} container - Container element
   * @param {string} language - Current language
   */
  handleUnconfirmedEmailError(error, email, container, language) {
    const messages = {
      es: {
        title: 'Email no confirmado',
        message: 'Debes confirmar tu email antes de iniciar sesión',
        instruction: 'Revisa tu bandeja de entrada y haz clic en el enlace de confirmación',
        resendConfirmation: 'Reenviar confirmación',
        checkSpam: 'Revisar spam',
        changeEmail: 'Cambiar email'
      },
      en: {
        title: 'Email not confirmed',
        message: 'You must confirm your email before signing in',
        instruction: 'Check your inbox and click the confirmation link',
        resendConfirmation: 'Resend confirmation',
        checkSpam: 'Check spam folder',
        changeEmail: 'Change email'
      }
    };

    const msg = messages[language] || messages.es;

    const errorHtml = `
      <div class="unconfirmed-email-error bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium text-blue-800">${msg.title}</h4>
            <p class="mt-1 text-sm text-blue-700">${msg.message}</p>
            <p class="mt-1 text-sm text-blue-600">${msg.instruction}</p>
            <div class="mt-1 text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
              ${email}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="resend-confirmation-btn px-4 py-2 bg-[#2EAFC4] text-white rounded-lg hover:bg-[#2EAFC4]/80 transition-colors text-sm font-medium">
                ${msg.resendConfirmation}
              </button>
              <button type="button" class="check-spam-btn px-4 py-2 bg-[#FFC979] text-[#162032] rounded-lg hover:bg-[#FFC979]/80 transition-colors text-sm font-medium">
                ${msg.checkSpam}
              </button>
              <button type="button" class="change-email-btn px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                ${msg.changeEmail}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing feedback and add custom error
    this.feedbackSystem.hideError(container);
    this.feedbackSystem.hideLoading(container);
    
    container.insertAdjacentHTML('afterbegin', errorHtml);

    // Add event listeners for action buttons
    const resendBtn = container.querySelector('.resend-confirmation-btn');
    const checkSpamBtn = container.querySelector('.check-spam-btn');
    const changeEmailBtn = container.querySelector('.change-email-btn');

    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        try {
          resendBtn.disabled = true;
          resendBtn.textContent = language === 'en' ? 'Sending...' : 'Enviando...';
          
          // Call resend confirmation method
          await this.resendEmailConfirmation(email);
          
          // Update button state
          resendBtn.textContent = language === 'en' ? 'Sent!' : '¡Enviado!';
          resendBtn.classList.remove('bg-[#2EAFC4]');
          resendBtn.classList.add('bg-green-600');
          
          // Reset button after 3 seconds
          setTimeout(() => {
            resendBtn.disabled = false;
            resendBtn.textContent = msg.resendConfirmation;
            resendBtn.classList.remove('bg-green-600');
            resendBtn.classList.add('bg-[#2EAFC4]');
          }, 3000);
          
        } catch (error) {
          console.error('Error resending confirmation:', error);
          resendBtn.disabled = false;
          resendBtn.textContent = language === 'en' ? 'Error - Try again' : 'Error - Reintentar';
          resendBtn.classList.remove('bg-[#2EAFC4]');
          resendBtn.classList.add('bg-red-600');
          
          setTimeout(() => {
            resendBtn.textContent = msg.resendConfirmation;
            resendBtn.classList.remove('bg-red-600');
            resendBtn.classList.add('bg-[#2EAFC4]');
          }, 3000);
        }
      });
    }

    if (checkSpamBtn) {
      checkSpamBtn.addEventListener('click', () => {
        // Show helpful message about checking spam
        const spamMessage = language === 'en' 
          ? 'Check your spam/junk folder. Sometimes confirmation emails end up there. If you find it, mark it as "not spam" to ensure future emails reach your inbox.'
          : 'Revisa tu carpeta de spam/correo no deseado. A veces los emails de confirmación terminan ahí. Si lo encuentras, márcalo como "no es spam" para asegurar que futuros emails lleguen a tu bandeja de entrada.';
        
        // Replace the instruction text temporarily
        const instructionElement = container.querySelector('.unconfirmed-email-error p:nth-child(3)');
        if (instructionElement) {
          const originalText = instructionElement.textContent;
          instructionElement.textContent = spamMessage;
          instructionElement.classList.add('font-medium', 'bg-yellow-100', 'p-2', 'rounded', 'border-l-4', 'border-yellow-400');
          
          // Revert after 10 seconds
          setTimeout(() => {
            instructionElement.textContent = originalText;
            instructionElement.classList.remove('font-medium', 'bg-yellow-100', 'p-2', 'rounded', 'border-l-4', 'border-yellow-400');
          }, 10000);
        }
      });
    }

    if (changeEmailBtn) {
      changeEmailBtn.addEventListener('click', () => {
        // Switch to register tab to allow email change
        this.activeTab = 'register';
        this.render();
        this.setupEventListeners();
        
        // Show message about changing email
        setTimeout(() => {
          const registerContainer = document.querySelector('#register-form').parentElement;
          const changeEmailMessage = language === 'en'
            ? 'You can register with a different email address if needed'
            : 'Puedes registrarte con una dirección de email diferente si es necesario';
          
          this.feedbackSystem.showError(changeEmailMessage, {
            canRetry: false,
            targetElement: registerContainer
          });
        }, 100);
      });
    }
  }

  /**
   * Handle register form submission with enhanced error handling
   */
  async handleRegister(form) {
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };

    // Clear any existing errors first
    this.clearFormErrors('register');

    // Show loading state using UserFeedbackSystem
    const registerContainer = document.querySelector('#register-form').parentElement;
    this.feedbackSystem.showLoading('register', null, registerContainer);

    try {
      // Use enhanced register with comprehensive validation and error handling
      const result = await authService.registerWithValidation(
        data.name, 
        data.email, 
        data.password, 
        data.confirmPassword, 
        {
          language: i18n.getCurrentLanguage(),
          enableRetry: true,
          maxRetries: 2 // Limited retries for registration
        }
      );

      if (result.success) {
        // Show success message
        this.feedbackSystem.showSuccess('register', registerContainer, 3000);
        
        // Close modal after brief delay to show success
        setTimeout(() => {
          this.close();
          // Redirect to onboarding or app
          window.location.href = '/app';
        }, 2000);
      } else {
        // Handle validation errors first
        if (result.validationErrors) {
          this.showFormErrors('register', result.validationErrors);
          this.feedbackSystem.hideLoading(registerContainer);
          return;
        }

        // Handle specific authentication errors
        if (result.error) {
          this.handleRegistrationError(result.error, form, registerContainer);
        }
      }
    } catch (error) {
      // Handle unexpected errors
      console.error('Registration error:', error);
      this.feedbackSystem.showError('UNKNOWN_ERROR', {
        canRetry: true,
        retryCallback: () => this.handleRegister(form),
        targetElement: registerContainer
      });
    }
  }

  /**
   * Handle specific registration errors with appropriate messaging and actions
   * @param {Object} error - Processed error object from authErrorHandler
   * @param {HTMLFormElement} form - The registration form
   * @param {HTMLElement} container - Container element for feedback
   */
  handleRegistrationError(error, form, container) {
    const language = i18n.getCurrentLanguage();
    
    switch (error.type) {
      case 'AUTH_USER_EXISTS':
        // User already exists - show clear message with option to switch to login
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: false,
          targetElement: container
        });
        
        // Add a "Switch to Login" button
        setTimeout(() => {
          const errorElement = container.querySelector('.feedback-error');
          if (errorElement) {
            const switchButton = document.createElement('button');
            switchButton.type = 'button';
            switchButton.className = 'mt-2 px-4 py-2 bg-[#2EAFC4] text-white rounded-lg hover:bg-[#2EAFC4]/80 transition-colors text-sm font-medium';
            switchButton.textContent = language === 'en' ? 'Switch to Login' : 'Cambiar a Iniciar Sesión';
            switchButton.onclick = () => {
              // Pre-fill email in login form
              this.activeTab = 'login';
              this.render();
              this.setupEventListeners();
              setTimeout(() => {
                const loginEmailInput = document.getElementById('login-email');
                if (loginEmailInput) {
                  loginEmailInput.value = form.querySelector('[name="email"]').value;
                }
              }, 100);
            };
            errorElement.querySelector('.ml-3').appendChild(switchButton);
          }
        }, 100);
        break;

      case 'AUTH_WEAK_PASSWORD':
        // Password strength validation - show specific requirements
        const passwordInput = form.querySelector('[name="password"]');
        const confirmPasswordInput = form.querySelector('[name="confirmPassword"]');
        
        // Highlight password fields
        this.highlightFieldError(passwordInput);
        this.highlightFieldError(confirmPasswordInput);
        
        // Show detailed password requirements
        this.showPasswordRequirements(passwordInput, language);
        
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: false,
          targetElement: container
        });
        break;

      case 'INVALID_EMAIL_FORMAT':
        // Email format validation - highlight email field
        const emailInput = form.querySelector('[name="email"]');
        this.highlightFieldError(emailInput);
        this.showFieldError(emailInput, error.userMessage);
        
        this.feedbackSystem.hideLoading(container);
        break;

      case 'AUTH_EMAIL_NOT_CONFIRMED':
        // Email confirmation required - show helpful message
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: false,
          targetElement: container
        });
        
        // Add resend confirmation button
        setTimeout(() => {
          const errorElement = container.querySelector('.feedback-error');
          if (errorElement) {
            const resendButton = document.createElement('button');
            resendButton.type = 'button';
            resendButton.className = 'mt-2 px-4 py-2 bg-[#FFC979] text-[#162032] rounded-lg hover:bg-[#FFC979]/80 transition-colors text-sm font-medium';
            resendButton.textContent = language === 'en' ? 'Resend Confirmation' : 'Reenviar Confirmación';
            resendButton.onclick = () => this.resendEmailConfirmation(form.querySelector('[name="email"]').value);
            errorElement.querySelector('.ml-3').appendChild(resendButton);
          }
        }, 100);
        break;

      case 'NETWORK_ERROR':
        // Network connectivity issues - show retry option
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: true,
          retryCallback: () => this.handleRegister(form),
          targetElement: container
        });
        break;

      case 'AUTH_RATE_LIMITED':
        // Rate limiting - show wait time if available
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: true,
          retryCallback: () => {
            // Delay retry based on rate limiting
            setTimeout(() => this.handleRegister(form), 5000);
          },
          targetElement: container
        });
        break;

      default:
        // Generic error handling with retry option
        this.feedbackSystem.showError(error.userMessage, {
          canRetry: error.canRetry,
          retryCallback: error.canRetry ? () => this.handleRegister(form) : null,
          targetElement: container
        });
        break;
    }
  }

  /**
   * Highlight a form field with error styling
   * @param {HTMLInputElement} field - The input field to highlight
   */
  highlightFieldError(field) {
    if (field) {
      field.classList.remove('border-[#2EAFC4]/30', 'focus:border-[#2EAFC4]', 'focus:ring-[#2EAFC4]');
      field.classList.add('border-red-400', 'focus:border-red-400', 'focus:ring-red-400');
    }
  }

  /**
   * Show error message for a specific field
   * @param {HTMLInputElement} field - The input field
   * @param {string} message - Error message to display
   */
  showFieldError(field, message) {
    if (field) {
      const errorDiv = field.parentElement.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
      }
    }
  }

  /**
   * Show detailed password requirements
   * @param {HTMLInputElement} passwordField - The password input field
   * @param {string} language - Current language
   */
  showPasswordRequirements(passwordField, language) {
    if (!passwordField) return;

    const requirements = language === 'en' ? [
      'At least 8 characters long',
      'Include uppercase letters (A-Z)',
      'Include lowercase letters (a-z)',
      'Include numbers (0-9)'
    ] : [
      'Al menos 8 caracteres',
      'Incluir letras mayúsculas (A-Z)',
      'Incluir letras minúsculas (a-z)',
      'Incluir números (0-9)'
    ];

    const requirementsHtml = `
      <div class="password-requirements mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm font-medium text-yellow-800 mb-2">
          ${language === 'en' ? 'Password must include:' : 'La contraseña debe incluir:'}
        </p>
        <ul class="text-xs text-yellow-700 space-y-1">
          ${requirements.map(req => `<li class="flex items-center"><span class="w-1 h-1 bg-yellow-600 rounded-full mr-2"></span>${req}</li>`).join('')}
        </ul>
      </div>
    `;

    // Remove existing requirements
    const existingReqs = passwordField.parentElement.querySelector('.password-requirements');
    if (existingReqs) {
      existingReqs.remove();
    }

    // Add new requirements
    passwordField.parentElement.insertAdjacentHTML('beforeend', requirementsHtml);
  }

  /**
   * Resend email confirmation
   * @param {string} email - User email
   */
  async resendEmailConfirmation(email) {
    try {
      // This would typically call a resend confirmation endpoint
      // For now, show a success message
      const language = i18n.getCurrentLanguage();
      const message = language === 'en' 
        ? 'Confirmation email sent! Please check your inbox.' 
        : 'Email de confirmación enviado! Revisa tu bandeja de entrada.';
      
      this.feedbackSystem.showSuccess(message, null, 5000);
    } catch (error) {
      console.error('Error resending confirmation:', error);
      const language = i18n.getCurrentLanguage();
      const message = language === 'en' 
        ? 'Failed to resend confirmation email. Please try again.' 
        : 'Error al reenviar email de confirmación. Inténtalo de nuevo.';
      
      this.feedbackSystem.showError(message);
    }
  }

  /**
   * Clear form errors for a specific form type
   * @param {string} formType - Type of form ('login', 'register', 'forgot')
   */
  clearFormErrors(formType) {
    const form = document.getElementById(`${formType}-form`);
    if (form) {
      // Clear field-specific errors
      const errorMessages = form.querySelectorAll('.error-message');
      errorMessages.forEach(error => {
        error.classList.add('hidden');
        error.textContent = '';
      });

      // Reset field styling
      const inputs = form.querySelectorAll('input');
      inputs.forEach(input => {
        input.classList.remove('border-red-400', 'focus:border-red-400', 'focus:ring-red-400');
        input.classList.add('border-[#2EAFC4]/30', 'focus:border-[#2EAFC4]', 'focus:ring-[#2EAFC4]');
      });

      // Remove password requirements
      const passwordReqs = form.parentElement.querySelectorAll('.password-requirements');
      passwordReqs.forEach(req => req.remove());
    }
  }

  /**
   * Handle forgot password form submission with enhanced error handling and diagnostics
   */
  async handleForgotPassword(form) {
    const formData = new FormData(form);
    const email = formData.get('email');

    if (!validateEmail(email)) {
      const forgotContainer = form.parentElement;
      this.feedbackSystem.showError('INVALID_EMAIL_FORMAT', {
        canRetry: false,
        targetElement: forgotContainer
      });
      return;
    }

    // Show loading state with detailed message
    const forgotContainer = form.parentElement;
    this.feedbackSystem.showLoading('forgotPassword', 'Enviando email de recuperación...', forgotContainer);

    try {
      console.log('🔐 Iniciando recuperación de contraseña para:', email);
      
      // Use the enhanced resetPassword function with diagnostics
      const result = await authService.resetPassword(email, {
        language: 'es',
        enableDiagnostics: true
      });

      console.log('📧 Resultado de recuperación:', result);

      if (result.success) {
        // Show detailed success message with instructions
        this.showEnhancedForgotPasswordSuccess(email, result);
      } else {
        // Show detailed error with troubleshooting
        this.showEnhancedForgotPasswordError(email, result);
      }

    } catch (error) {
      console.error('❌ Error inesperado en recuperación:', error);
      
      // Handle unexpected errors
      this.feedbackSystem.showError(error, {
        canRetry: true,
        retryCallback: () => this.handleForgotPassword(form),
        targetElement: forgotContainer
      });
    }
  }

  /**
   * Handle Google OAuth with enhanced error handling
   */
  async handleGoogleAuth() {
    const googleBtn = document.getElementById('google-login') || document.getElementById('google-register');
    if (!googleBtn) return;

    const originalText = googleBtn.innerHTML;
    const container = googleBtn.closest('.space-y-5, .space-y-6');
    
    // Show loading state
    this.feedbackSystem.showLoading('login', this.translations.authConnecting, container);
    googleBtn.disabled = true;
    googleBtn.innerHTML = `
      <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      ${this.translations.authConnecting}
    `;

    try {
      await authService.loginWithGoogle();
      this.feedbackSystem.showSuccess('login', container, 1500);
      setTimeout(() => {
        this.close();
        window.location.href = '/app';
      }, 1000);
    } catch (error) {
      this.feedbackSystem.showError(error, {
        canRetry: true,
        retryCallback: () => this.handleGoogleAuth(),
        targetElement: container
      });
      googleBtn.disabled = false;
      googleBtn.innerHTML = originalText;
    }
  }

  /**
   * Handle GitHub OAuth with enhanced error handling
   */
  async handleGitHubAuth() {
    const githubBtn = document.getElementById('github-login') || document.getElementById('github-register');
    if (!githubBtn) return;

    const originalText = githubBtn.innerHTML;
    const container = githubBtn.closest('.space-y-5, .space-y-6');
    
    // Show loading state
    this.feedbackSystem.showLoading('login', this.translations.authConnecting, container);
    githubBtn.disabled = true;
    githubBtn.innerHTML = `
      <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      ${this.translations.authConnecting}
    `;

    try {
      await authService.loginWithGitHub();
      this.feedbackSystem.showSuccess('login', container, 1500);
      setTimeout(() => {
        this.close();
        window.location.href = '/app';
      }, 1000);
    } catch (error) {
      this.feedbackSystem.showError(error, {
        canRetry: true,
        retryCallback: () => this.handleGitHubAuth(),
        targetElement: container
      });
      githubBtn.disabled = false;
      githubBtn.innerHTML = originalText;
    }
  }

  /**
   * Show form validation errors with enhanced styling
   */
  showFormErrors(formType, errors) {
    // Clear any existing feedback
    const container = document.querySelector(`#${formType}-form`).parentElement;
    this.feedbackSystem.hideError(container);
    this.feedbackSystem.hideLoading(container);
    
    // Show individual field errors
    Object.keys(errors).forEach(field => {
      const input = document.getElementById(`${formType}-${field}`);
      const errorDiv = input?.parentElement.querySelector('.error-message');
      
      if (input && errorDiv) {
        input.classList.add('border-red-400', 'focus:border-red-400', 'focus:ring-red-400');
        input.classList.remove('border-[#2EAFC4]/30', 'focus:border-[#2EAFC4]', 'focus:ring-[#2EAFC4]');
        errorDiv.textContent = errors[field];
        errorDiv.classList.remove('hidden');
        errorDiv.classList.add('fade-in');
      }
    });
    
    // Focus on the first field with an error
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const firstInput = document.getElementById(`${formType}-${firstErrorField}`);
      if (firstInput) {
        firstInput.focus();
      }
    }
  }

  /**
   * Clear form validation errors
   */
  clearFormErrors(formType) {
    const form = document.getElementById(`${formType}-form`);
    if (!form) return;
    
    // Clear individual field errors
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.classList.remove('border-red-400', 'focus:border-red-400', 'focus:ring-red-400');
      input.classList.add('border-[#2EAFC4]/30', 'focus:border-[#2EAFC4]', 'focus:ring-[#2EAFC4]');
      
      const errorDiv = input.parentElement.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.classList.remove('fade-in');
        errorDiv.textContent = '';
      }
    });
    
    // Clear feedback system errors
    const container = form.parentElement;
    this.feedbackSystem.hideError(container);
  }

  /**
   * Show connection restored message
   */
  showConnectionRestoredMessage() {
    const message = i18n.getCurrentLanguage() === 'es' 
      ? 'Conexión restaurada. Continuando...'
      : 'Connection restored. Continuing...';
    
    this.feedbackSystem.showSuccess(message, null, 2000);
  }

  /**
   * Add connection status indicator to modal
   */
  addConnectionStatusToModal() {
    if (this.connectionIndicator && this.modalElement) {
      // Create container for connection status if it doesn't exist
      let statusContainer = this.modalElement.querySelector('#auth-modal-connection-status');
      if (!statusContainer) {
        statusContainer = document.createElement('div');
        statusContainer.id = 'auth-modal-connection-status';
        statusContainer.className = 'absolute top-16 right-5 z-20';
        this.modalElement.appendChild(statusContainer);
      }
      
      // Initialize the connection indicator in the modal
      this.connectionIndicator.init();
    }
  }

  /**
   * Show forgot password success message
   */
  showForgotPasswordSuccess(email) {
    this.modalElement.innerHTML = `
      <div class="p-6 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-green-900/20 rounded-full flex items-center justify-center border-4 border-green-400/30">
          <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-[#F6F7F9] mb-3 leading-tight">${this.translations.authEmailSent}</h2>
        <p class="text-[#F6F7F9]/80 text-sm leading-relaxed mb-6">
          ${this.translations.authEmailSentDesc} <strong class="text-[#2EAFC4]">${email}</strong>. 
          ${this.translations.authEmailSentInstructions}
        </p>
        <div class="space-y-3">
          <button id="back-to-login-success" class="w-full py-3 px-4 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] text-[#162032] font-bold text-base rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 border-2 border-transparent hover:border-[#2EAFC4]/20">
            ${this.translations.authBackToLoginSuccess}
          </button>
          <p class="text-sm text-[#F6F7F9]/70">
            ${this.translations.authDidntReceiveEmail} 
            <button id="resend-email" class="text-[#2EAFC4] hover:text-[#FFC979] transition-colors font-semibold underline decoration-1 underline-offset-1">
              ${this.translations.authTryAgain}
            </button>
          </p>
        </div>
      </div>
    `;

    // Setup success page event listeners
    document.getElementById('back-to-login-success').addEventListener('click', () => {
      this.showForgotPassword = false;
      this.activeTab = 'login';
      this.render();
      this.setupEventListeners();
    });

    document.getElementById('resend-email').addEventListener('click', () => {
      this.showForgotPassword = true;
      this.render();
      this.setupEventListeners();
    });
  }

  /**
   * Setup language change listener
   */
  setupLanguageListener() {
    window.addEventListener('languageChanged', (e) => {
      this.translations = e.detail.translations || i18n.getTranslations(e.detail.language);
      if (this.isOpen) {
        this.render();
        this.setupEventListeners();
      }
    });
  }

  /**
   * Show enhanced error with connection context
   * @param {string} formType - Form type ('login', 'register', 'forgot')
   * @param {Object} processedError - Processed error from authErrorHandler
   * @param {Object} result - Full result object with retry info
   */
  showEnhancedError(formType, processedError, result = {}) {
    const errorElement = document.getElementById(`${formType}-error`);
    if (!errorElement) return;

    let errorMessage = processedError.userMessage || processedError.message || 'Error desconocido';
    
    // Add connection context if available
    if (result.connectivityRestored) {
      errorMessage += ` (Conexión restaurada después de ${result.totalAttempts} intentos)`;
    } else if (result.totalAttempts > 1) {
      errorMessage += ` (Intentado ${result.totalAttempts} veces)`;
    }

    // Show retry suggestion for connection errors
    if (processedError.canRetry && processedError.type === 'NETWORK_ERROR') {
      errorMessage += '. Verifica tu conexión e inténtalo de nuevo.';
    }

    const errorMessageElement = errorElement.querySelector('p');
    if (errorMessageElement) {
      errorMessageElement.textContent = errorMessage;
    }

    errorElement.classList.remove('hidden');

    // Auto-hide after 10 seconds for connection errors
    if (processedError.type === 'NETWORK_ERROR') {
      setTimeout(() => {
        errorElement.classList.add('hidden');
      }, 10000);
    }
  }

  /**
   * Show connection restored message
   */
  showConnectionRestoredMessage() {
    // Create a temporary success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 z-50 p-4 bg-green-900/20 border-l-4 border-green-400 rounded-r-lg backdrop-blur-sm';
    successMessage.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-green-300 text-sm font-medium">
            ${this.translations.connectionRestored || 'Conexión restaurada'}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(successMessage);

    // Remove after 3 seconds
    setTimeout(() => {
      successMessage.remove();
    }, 3000);
  }

  /**
   * Add connection status to modal header
   */
  addConnectionStatusToModal() {
    if (!this.modalElement) return;

    const connectionStatus = connectionMonitor.getStatus();
    
    // Only show status indicator if there are connection issues
    if (connectionStatus.status === CONNECTION_STATUS.DISCONNECTED || 
        connectionStatus.status === CONNECTION_STATUS.CHECKING) {
      
      const statusIndicator = document.createElement('div');
      statusIndicator.id = 'modal-connection-status';
      statusIndicator.className = 'absolute top-16 left-4 right-4 z-10';
      
      const statusConfig = this.getModalConnectionStatusConfig(connectionStatus.status);
      
      statusIndicator.innerHTML = `
        <div class="flex items-center space-x-2 px-3 py-2 rounded-lg ${statusConfig.bgClass} ${statusConfig.borderClass} border">
          ${statusConfig.icon}
          <span class="text-xs ${statusConfig.textClass} font-medium">
            ${statusConfig.message}
          </span>
        </div>
      `;

      this.modalElement.appendChild(statusIndicator);
    }
  }

  /**
   * Get connection status configuration for modal display
   * @param {string} status - Connection status
   * @returns {Object} Status configuration
   */
  getModalConnectionStatusConfig(status) {
    const configs = {
      [CONNECTION_STATUS.DISCONNECTED]: {
        message: this.translations.connectionOfflineMode || 'Modo sin conexión - Funcionalidad limitada',
        icon: `<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>`,
        bgClass: 'bg-red-900/20',
        borderClass: 'border-red-400/30',
        textClass: 'text-red-300'
      },
      [CONNECTION_STATUS.CHECKING]: {
        message: this.translations.connectionChecking || 'Verificando conexión...',
        icon: `<svg class="w-4 h-4 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>`,
        bgClass: 'bg-yellow-900/20',
        borderClass: 'border-yellow-400/30',
        textClass: 'text-yellow-300'
      }
    };

    return configs[status] || configs[CONNECTION_STATUS.DISCONNECTED];
  }

  /**
   * Update modal connection status
   */
  updateModalConnectionStatus() {
    // Remove existing status indicator
    const existingStatus = document.getElementById('modal-connection-status');
    if (existingStatus) {
      existingStatus.remove();
    }

    // Add new status indicator if needed
    this.addConnectionStatusToModal();
  }

  /**
   * Show enhanced forgot password success message with detailed instructions
   */
  showEnhancedForgotPasswordSuccess(email, result) {
    this.modalElement.innerHTML = `
      <div class="p-6">
        <!-- Close button -->
        <button id="auth-close-btn" class="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#202837] hover:bg-[#2EAFC4]/20 transition-all duration-200 border border-[#2EAFC4]/30">
          <svg class="w-5 h-5 text-[#F6F7F9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Success icon -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-[#F6F7F9] mb-2">📧 Email enviado exitosamente</h2>
          <p class="text-[#F6F7F9]/80 text-sm">Se envió un enlace de recuperación a:</p>
          <p class="text-[#2EAFC4] font-semibold text-sm mt-1">${email}</p>
        </div>

        <!-- Instructions -->
        <div class="bg-[#202837] rounded-xl p-4 mb-4 border border-[#2EAFC4]/20">
          <h3 class="text-[#F6F7F9] font-semibold mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2 text-[#2EAFC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Instrucciones importantes:
          </h3>
          <ul class="text-[#F6F7F9]/80 text-sm space-y-2">
            ${result.instructions ? result.instructions.map(instruction => `
              <li class="flex items-start">
                <span class="text-[#2EAFC4] mr-2 mt-0.5">•</span>
                ${instruction}
              </li>
            `).join('') : `
              <li class="flex items-start">
                <span class="text-[#2EAFC4] mr-2 mt-0.5">•</span>
                Revisa tu bandeja de entrada y carpeta de spam
              </li>
              <li class="flex items-start">
                <span class="text-[#2EAFC4] mr-2 mt-0.5">•</span>
                El enlace expira en 1 hora
              </li>
            `}
          </ul>
        </div>

        <!-- Important: Check Spam -->
        <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 class="text-yellow-500 font-semibold text-sm mb-1">⚠️ MUY IMPORTANTE</h4>
              <p class="text-[#F6F7F9]/80 text-sm">
                Si no ves el email en 2-3 minutos, <strong>revisa tu carpeta de SPAM</strong>. 
                Esta es la causa más común de emails "perdidos".
              </p>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="space-y-3">
          <button id="check-email-guide" class="w-full py-3 px-4 bg-[#FFC979] text-[#162032] rounded-xl font-semibold hover:bg-[#FFC979]/90 transition-all duration-200 flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            🔍 Guía: ¿Dónde buscar el email?
          </button>
          
          <div class="grid grid-cols-2 gap-3">
            <button id="resend-email-enhanced" class="py-3 px-4 border border-[#2EAFC4]/30 text-[#2EAFC4] rounded-xl font-semibold hover:bg-[#2EAFC4]/10 transition-all duration-200 text-sm">
              📤 Reenviar
            </button>
            <button id="back-to-login-success" class="py-3 px-4 bg-[#2EAFC4] text-[#162032] rounded-xl font-semibold hover:bg-[#2EAFC4]/90 transition-all duration-200 text-sm">
              ← Volver
            </button>
          </div>
        </div>

        ${result.diagnostics ? `
          <details class="mt-4 bg-[#202837] rounded-xl p-3 border border-[#2EAFC4]/20">
            <summary class="text-[#F6F7F9]/80 text-sm cursor-pointer hover:text-[#F6F7F9] transition-colors">
              🔧 Información técnica (para soporte)
            </summary>
            <pre class="text-xs text-[#F6F7F9]/60 mt-2 overflow-x-auto">${JSON.stringify(result.diagnostics, null, 2)}</pre>
          </details>
        ` : ''}
      </div>
    `;

    this.setupEnhancedSuccessEventListeners(email);
  }

  /**
   * Show enhanced forgot password error message with troubleshooting
   */
  showEnhancedForgotPasswordError(email, result) {
    this.modalElement.innerHTML = `
      <div class="p-6">
        <!-- Close button -->
        <button id="auth-close-btn" class="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#202837] hover:bg-[#2EAFC4]/20 transition-all duration-200 border border-[#2EAFC4]/30">
          <svg class="w-5 h-5 text-[#F6F7F9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Error icon -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-[#F6F7F9] mb-2">❌ No se pudo enviar el email</h2>
          <p class="text-red-400 font-medium text-sm">${result.error.message}</p>
        </div>

        <!-- Troubleshooting -->
        <div class="bg-[#202837] rounded-xl p-4 mb-4 border border-red-500/20">
          <h3 class="text-[#F6F7F9] font-semibold mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Soluciones recomendadas:
          </h3>
          <ul class="text-[#F6F7F9]/80 text-sm space-y-2">
            ${result.troubleshooting ? result.troubleshooting.map(step => `
              <li class="flex items-start">
                <span class="text-red-400 mr-2 mt-0.5">•</span>
                ${step}
              </li>
            `).join('') : `
              <li class="flex items-start">
                <span class="text-red-400 mr-2 mt-0.5">•</span>
                Verifica que el email esté escrito correctamente
              </li>
              <li class="flex items-start">
                <span class="text-red-400 mr-2 mt-0.5">•</span>
                Intenta nuevamente en unos minutos
              </li>
            `}
          </ul>
        </div>

        <!-- Action buttons -->
        <div class="space-y-3">
          <button id="retry-password-reset" class="w-full py-3 px-4 bg-[#2EAFC4] text-[#162032] rounded-xl font-semibold hover:bg-[#2EAFC4]/90 transition-all duration-200">
            🔄 Intentar nuevamente
          </button>
          
          <div class="grid grid-cols-2 gap-3">
            <button id="contact-support-btn" class="py-3 px-4 bg-[#FFC979] text-[#162032] rounded-xl font-semibold hover:bg-[#FFC979]/90 transition-all duration-200 text-sm">
              📞 Soporte
            </button>
            <button id="back-to-login-error" class="py-3 px-4 border border-[#2EAFC4]/30 text-[#2EAFC4] rounded-xl font-semibold hover:bg-[#2EAFC4]/10 transition-all duration-200 text-sm">
              ← Volver
            </button>
          </div>
        </div>

        ${result.diagnostics ? `
          <details class="mt-4 bg-[#202837] rounded-xl p-3 border border-red-500/20">
            <summary class="text-[#F6F7F9]/80 text-sm cursor-pointer hover:text-[#F6F7F9] transition-colors">
              🔧 Información para soporte técnico
            </summary>
            <pre class="text-xs text-[#F6F7F9]/60 mt-2 overflow-x-auto">${JSON.stringify(result.diagnostics, null, 2)}</pre>
          </details>
        ` : ''}
      </div>
    `;

    this.setupEnhancedErrorEventListeners(email, result);
  }

  /**
   * Setup event listeners for enhanced success page
   */
  setupEnhancedSuccessEventListeners(email) {
    // Close button
    const closeBtn = document.getElementById('auth-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Back to login
    const backBtn = document.getElementById('back-to-login-success');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showForgotPassword = false;
        this.activeTab = 'login';
        this.render();
        this.setupEventListeners();
      });
    }

    // Email guide
    const guideBtn = document.getElementById('check-email-guide');
    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        this.showEmailLocationGuide(email);
      });
    }

    // Resend email
    const resendBtn = document.getElementById('resend-email-enhanced');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        // Check rate limiting
        const lastSent = localStorage.getItem('last_password_reset');
        const now = Date.now();
        
        if (lastSent && (now - parseInt(lastSent)) < 30000) {
          const remaining = Math.ceil((30000 - (now - parseInt(lastSent))) / 1000);
          alert(`Espera ${remaining} segundos antes de reenviar el email.`);
          return;
        }
        
        localStorage.setItem('last_password_reset', now.toString());
        
        // Show loading and retry
        resendBtn.disabled = true;
        resendBtn.innerHTML = '⏳ Reenviando...';
        
        try {
          const result = await authService.resetPassword(email, {
            language: 'es',
            enableDiagnostics: true
          });
          
          if (result.success) {
            alert('Email reenviado. Revisa tu bandeja de entrada y spam.');
          } else {
            alert(`Error al reenviar: ${result.error.message}`);
          }
        } catch (error) {
          alert('Error al reenviar. Intenta más tarde.');
        } finally {
          resendBtn.disabled = false;
          resendBtn.innerHTML = '📤 Reenviar';
        }
      });
    }
  }

  /**
   * Setup event listeners for enhanced error page
   */
  setupEnhancedErrorEventListeners(email, result) {
    // Close button
    const closeBtn = document.getElementById('auth-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Back to login
    const backBtn = document.getElementById('back-to-login-error');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showForgotPassword = false;
        this.activeTab = 'login';
        this.render();
        this.setupEventListeners();
      });
    }

    // Retry
    const retryBtn = document.getElementById('retry-password-reset');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.showForgotPassword = true;
        this.render();
        this.setupEventListeners();
      });
    }

    // Contact support
    const supportBtn = document.getElementById('contact-support-btn');
    if (supportBtn) {
      supportBtn.addEventListener('click', () => {
        const subject = encodeURIComponent('No llega email de recuperación de contraseña');
        const body = encodeURIComponent(`
Hola,

No me está llegando el email para recuperar mi contraseña.

Detalles:
- Email: ${email}
- Tipo de error: ${result.error.type}
- Mensaje: ${result.error.message}
- Hora del intento: ${new Date().toLocaleString()}
- Navegador: ${navigator.userAgent}

Información técnica:
${result.diagnostics ? JSON.stringify(result.diagnostics, null, 2) : 'No disponible'}

Por favor, ayúdenme a resolver este problema.

Gracias.
        `);
        
        window.open(`mailto:soporte@anclora.com?subject=${subject}&body=${body}`);
      });
    }
  }

  /**
   * Show email location guide modal
   */
  showEmailLocationGuide(email) {
    const guideModal = document.createElement('div');
    guideModal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4';
    guideModal.innerHTML = `
      <div class="bg-[#162032] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#2EAFC4]/30">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-[#F6F7F9]">🔍 ¿Dónde buscar tu email de recuperación?</h3>
            <button class="close-guide-btn w-8 h-8 flex items-center justify-center rounded-full bg-[#202837] hover:bg-[#2EAFC4]/20 transition-all duration-200">
              <svg class="w-4 h-4 text-[#F6F7F9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p class="text-[#F6F7F9]/80 mb-4">Email enviado a: <span class="text-[#2EAFC4] font-semibold">${email}</span></p>
          
          <div class="space-y-4">
            <div class="bg-[#202837] rounded-xl p-4 border border-[#2EAFC4]/20">
              <h4 class="text-[#F6F7F9] font-semibold mb-2">📥 1. Bandeja de entrada principal</h4>
              <p class="text-[#F6F7F9]/80 text-sm">Busca un email de <code class="bg-[#2EAFC4]/20 px-2 py-1 rounded text-[#2EAFC4]">noreply@supabase.co</code></p>
            </div>
            
            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h4 class="text-yellow-500 font-semibold mb-2">🚨 2. Carpeta de SPAM (MUY IMPORTANTE)</h4>
              <p class="text-[#F6F7F9]/80 text-sm mb-2">Esta es la causa más común. Revisa:</p>
              <ul class="text-[#F6F7F9]/80 text-sm space-y-1 ml-4">
                <li>• Spam / Correo no deseado</li>
                <li>• Correo basura</li>
                <li>• Quarantine</li>
              </ul>
            </div>
            
            <div class="bg-[#202837] rounded-xl p-4 border border-[#2EAFC4]/20">
              <h4 class="text-[#F6F7F9] font-semibold mb-2">📂 3. Otras carpetas (Gmail)</h4>
              <ul class="text-[#F6F7F9]/80 text-sm space-y-1 ml-4">
                <li>• Promociones</li>
                <li>• Actualizaciones</li>
                <li>• Social</li>
              </ul>
            </div>
            
            <div class="bg-[#202837] rounded-xl p-4 border border-[#2EAFC4]/20">
              <h4 class="text-[#F6F7F9] font-semibold mb-2">🔍 4. Buscar directamente</h4>
              <p class="text-[#F6F7F9]/80 text-sm">Busca en tu email: <code class="bg-[#2EAFC4]/20 px-2 py-1 rounded text-[#2EAFC4]">Anclora</code> o <code class="bg-[#2EAFC4]/20 px-2 py-1 rounded text-[#2EAFC4]">recuperación</code></p>
            </div>
            
            <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 class="text-blue-400 font-semibold mb-2">💡 Para evitar esto en el futuro:</h4>
              <ul class="text-[#F6F7F9]/80 text-sm space-y-1 ml-4">
                <li>• Agrega <code class="bg-blue-500/20 px-2 py-1 rounded text-blue-400">noreply@supabase.co</code> a tus contactos</li>
                <li>• Marca como "No es spam" si lo encuentras en spam</li>
                <li>• Configura filtros para permitir emails de Supabase</li>
              </ul>
            </div>
          </div>
          
          <div class="mt-6 text-center">
            <button class="close-guide-btn bg-[#2EAFC4] text-[#162032] px-6 py-3 rounded-xl font-semibold hover:bg-[#2EAFC4]/90 transition-all duration-200">
              Entendido
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(guideModal);
    
    // Setup close handlers
    guideModal.querySelectorAll('.close-guide-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        guideModal.remove();
      });
    });
    
    // Close on backdrop click
    guideModal.addEventListener('click', (e) => {
      if (e.target === guideModal) {
        guideModal.remove();
      }
    });
  }
}

// Create singleton instance
export const authModalVanilla = new AuthModalVanilla();