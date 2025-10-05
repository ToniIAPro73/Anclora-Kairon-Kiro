import { validateEmail, validatePassword, validateRegistrationForm, validateLoginForm } from '../utils/validation.js';
import { authService } from '../services/authService.js';
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
    this.setupLanguageListener();
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
   * Setup form submission handlers
   */
  setupFormHandlers() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(e.target);
      });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister(e.target);
      });
    }

    // Forgot password form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleForgotPassword(e.target);
      });
    }
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
   * Handle login form submission
   */
  async handleLogin(form) {
    const formData = new FormData(form);
    const data = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    const validation = validateLoginForm(data);
    if (!validation.isValid) {
      this.showFormErrors('login', validation.errors);
      return;
    }

    const submitBtn = document.getElementById('login-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = this.translations.authLoggingIn;

    try {
      await authService.login(data.email, data.password);
      this.close();
      // Redirect to app
      window.location.href = '/app';
    } catch (error) {
      this.showError('login', error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.translations.authLoginButton;
    }
  }

  /**
   * Handle register form submission
   */
  async handleRegister(form) {
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };

    const validation = validateRegistrationForm(data);
    if (!validation.isValid) {
      this.showFormErrors('register', validation.errors);
      return;
    }

    const submitBtn = document.getElementById('register-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = this.translations.authCreatingAccount;

    try {
      await authService.register(data.name, data.email, data.password);
      this.close();
      // Redirect to app
      window.location.href = '/app';
    } catch (error) {
      this.showError('register', error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.translations.authRegisterButton;
    }
  }

  /**
   * Handle forgot password form submission
   */
  async handleForgotPassword(form) {
    const formData = new FormData(form);
    const email = formData.get('email');

    if (!validateEmail(email)) {
      this.showError('forgot', 'Ingresa un email válido');
      return;
    }

    const submitBtn = document.getElementById('forgot-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = this.translations.authSending;

    try {
      await authService.resetPassword(email);
      // Show success message
      this.showForgotPasswordSuccess(email);
    } catch (error) {
      this.showError('forgot', error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.translations.authSendRecoveryLink;
    }
  }

  /**
   * Handle Google OAuth
   */
  async handleGoogleAuth() {
    const googleBtn = document.getElementById('google-login') || document.getElementById('google-register');
    if (!googleBtn) return;

    const originalText = googleBtn.innerHTML;
    googleBtn.disabled = true;
    googleBtn.innerHTML = `
      <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      ${this.translations.authConnecting}
    `;

    try {
      await authService.loginWithGoogle();
      this.close();
      window.location.href = '/app';
    } catch (error) {
      this.showError(this.activeTab, error.message);
      googleBtn.disabled = false;
      googleBtn.innerHTML = originalText;
    }
  }

  /**
   * Handle GitHub OAuth
   */
  async handleGitHubAuth() {
    const githubBtn = document.getElementById('github-login') || document.getElementById('github-register');
    if (!githubBtn) return;

    const originalText = githubBtn.innerHTML;
    githubBtn.disabled = true;
    githubBtn.innerHTML = `
      <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      ${this.translations.authConnecting}
    `;

    try {
      await authService.loginWithGitHub();
      this.close();
      window.location.href = '/app';
    } catch (error) {
      this.showError(this.activeTab, error.message);
      githubBtn.disabled = false;
      githubBtn.innerHTML = originalText;
    }
  }

  /**
   * Show form validation errors
   */
  showFormErrors(formType, errors) {
    Object.keys(errors).forEach(field => {
      const input = document.getElementById(`${formType}-${field}`);
      const errorDiv = input?.parentElement.querySelector('.error-message');
      
      if (input && errorDiv) {
        input.classList.add('border-red-300', 'bg-red-50');
        errorDiv.textContent = errors[field];
        errorDiv.classList.remove('hidden');
      }
    });
  }

  /**
   * Show general error message
   */
  showError(formType, message) {
    const errorDiv = document.getElementById(`${formType}-error`);
    if (errorDiv) {
      errorDiv.querySelector('p').textContent = message;
      errorDiv.classList.remove('hidden');
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
}

// Create singleton instance
export const authModalVanilla = new AuthModalVanilla();