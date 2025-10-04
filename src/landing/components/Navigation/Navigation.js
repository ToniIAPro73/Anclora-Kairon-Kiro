// Responsive Navigation Component
import ThemeToggle from '../../../shared/components/ThemeToggle/ThemeToggle.js'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector.js'
import { authModalVanilla } from '../../../shared/components/AuthModalVanilla.js'

import i18n from '../../../shared/utils/i18n.js'

export default class Navigation {
  constructor(container) {
    this.container = container
    this.isMenuOpen = false
    this.translations = i18n.getTranslations()
    this.init()
    this.setupLanguageListener()
  }

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen
    const mobileMenu = this.container.querySelector('.mobile-menu')
    const hamburger = this.container.querySelector('.hamburger')
    
    if (this.isMenuOpen) {
      mobileMenu.classList.remove('hidden')
      hamburger.classList.add('open')
    } else {
      mobileMenu.classList.add('hidden')
      hamburger.classList.remove('open')
    }
  }

  init() {
    this.container.innerHTML = `
      <nav class="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-azul-profundo/80 backdrop-blur-md border-b border-gray-200 dark:border-white/20 overflow-visible">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
          <div class="flex justify-between items-center h-16 overflow-visible">
            <!-- Logo -->
            <div class="flex-shrink-0">
              <a href="#" class="text-2xl font-bold text-negro-azulado dark:text-white font-baskerville">
                Anclora Kairon
              </a>
            </div>
            
            <!-- Desktop Navigation -->
            <div class="hidden md:block">
              <div class="ml-10 flex items-baseline space-x-8">
                <a href="#features" class="text-negro-azulado dark:text-white hover:text-ambar-suave transition-colors duration-300 font-inter">${this.translations.features}</a>
                <a href="#pricing" class="text-negro-azulado dark:text-white hover:text-ambar-suave transition-colors duration-300 font-inter">${this.translations.pricing}</a>
                <a href="#about" class="text-negro-azulado dark:text-white hover:text-ambar-suave transition-colors duration-300 font-inter">${this.translations.about}</a>
                <a href="#contact" class="text-negro-azulado dark:text-white hover:text-ambar-suave transition-colors duration-300 font-inter">${this.translations.contact}</a>
              </div>
            </div>
            
            <!-- Desktop Controls -->
            <div class="hidden md:flex items-center space-x-4 overflow-visible">
              <div id="nav-theme-toggle"></div>
              <div id="nav-language-selector"></div>
              <button id="desktop-login-btn" class="bg-gradient-action text-negro-azulado px-6 py-2 rounded-anclora-sm font-bold hover:transform hover:-translate-y-1 transition-all duration-300 shadow-anclora-button">
                ${this.translations.login}
              </button>
            </div>
            
            <!-- Mobile menu button -->
            <div class="md:hidden">
              <button class="hamburger inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-300"
                      aria-expanded="false">
                <span class="sr-only">Abrir menú principal</span>
                <svg class="hamburger-icon block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path class="hamburger-top" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16" />
                  <path class="hamburger-middle" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16" />
                  <path class="hamburger-bottom" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Mobile menu -->
        <div class="mobile-menu hidden md:hidden bg-azul-profundo/95 backdrop-blur-md">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" class="text-white hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium font-inter transition-colors duration-300">${this.translations.features}</a>
            <a href="#pricing" class="text-white hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium font-inter transition-colors duration-300">${this.translations.pricing}</a>
            <a href="#about" class="text-white hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium font-inter transition-colors duration-300">${this.translations.about}</a>
            <a href="#contact" class="text-white hover:bg-white/20 block px-3 py-2 rounded-md text-base font-medium font-inter transition-colors duration-300">${this.translations.contact}</a>
          </div>
          
          <!-- Mobile Controls -->
          <div class="pt-4 pb-3 border-t border-white/20">
            <div class="flex items-center justify-between px-5">
              <div class="flex items-center space-x-3">
                <div id="mobile-theme-toggle"></div>
                <div id="mobile-language-selector"></div>
              </div>
              <button id="mobile-login-btn" class="bg-gradient-action text-negro-azulado px-4 py-2 rounded-anclora-sm font-bold text-sm">
                ${this.translations.login}
              </button>
            </div>
          </div>
        </div>
      </nav>
    `
    
    // Add event listeners
    const hamburger = this.container.querySelector('.hamburger')
    hamburger.addEventListener('click', () => this.toggleMobileMenu())
    
    // Initialize theme toggle and language selector for desktop
    ThemeToggle.init('#nav-theme-toggle')
    LanguageSelector.init('#nav-language-selector')
    
    // Initialize theme toggle and language selector for mobile
    ThemeToggle.init('#mobile-theme-toggle')
    LanguageSelector.init('#mobile-language-selector')
    
    // Close mobile menu when clicking on links
    const mobileLinks = this.container.querySelectorAll('.mobile-menu a')
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.isMenuOpen = false
        this.container.querySelector('.mobile-menu').classList.add('hidden')
        this.container.querySelector('.hamburger').classList.remove('open')
      })
    })
    
    // Add smooth scrolling for anchor links
    const allLinks = this.container.querySelectorAll('a[href^="#"]')
    allLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const targetId = link.getAttribute('href').substring(1)
        const targetElement = document.getElementById(targetId)
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      })
    })
    
    // Add login button event listeners
    const desktopLoginBtn = this.container.querySelector('#desktop-login-btn')
    const mobileLoginBtn = this.container.querySelector('#mobile-login-btn')
    
    if (desktopLoginBtn) {
      desktopLoginBtn.addEventListener('click', () => authModalVanilla.open('login'))
    }
    
    if (mobileLoginBtn) {
      mobileLoginBtn.addEventListener('click', () => {
        authModalVanilla.open('login')
        // Close mobile menu
        this.isMenuOpen = false
        this.container.querySelector('.mobile-menu').classList.add('hidden')
        this.container.querySelector('.hamburger').classList.remove('open')
      })
    }
  }

  setupLanguageListener() {
    window.addEventListener('languageChanged', (e) => {
      console.log('Navigation: Language changed event received:', e.detail)
      this.translations = e.detail.translations || i18n.getTranslations(e.detail.language)
      this.render()
    })
  }

  render() {
    // Store current menu state
    const wasMenuOpen = this.isMenuOpen
    
    // Re-render the navigation
    this.init()
    
    // Restore menu state if it was open
    if (wasMenuOpen) {
      this.isMenuOpen = false // Reset first
      this.toggleMobileMenu() // Then toggle to open
    }
  }

  // Static method for easy initialization
  static init(selector) {
    const container = document.querySelector(selector)
    if (container) {
      return new Navigation(container)
    }
    console.warn(`Navigation: Container not found for selector "${selector}"`)
    return null
  }
}