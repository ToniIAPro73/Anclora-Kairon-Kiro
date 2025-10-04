// Theme Toggle Component with system preference detection
import { THEMES, STORAGE_KEYS } from '../../utils/constants.js'

export default class ThemeToggle {
  constructor(container) {
    this.container = container
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme()
    this.init()
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT
  }

  getStoredTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME)
  }

  setTheme(theme) {
    this.currentTheme = theme
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
    this.applyTheme(theme)
    this.updateToggleUI()
  }

  applyTheme(theme) {
    const root = document.documentElement
    const body = document.body
    
    if (theme === THEMES.DARK) {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
    }
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }))
    
    console.log(`Theme applied: ${theme}`)
  }

  updateToggleUI() {
    const icon = this.container.querySelector('.theme-icon')
    const isDark = this.currentTheme === THEMES.DARK
    const isStored = this.getStoredTheme()
    
    if (!isStored) {
      icon.textContent = '💻'
      icon.setAttribute('aria-label', 'Using system theme')
    } else {
      icon.textContent = isDark ? '🌙' : '☀️'
      icon.setAttribute('aria-label', isDark ? 'Dark mode active' : 'Light mode active')
    }
  }

  toggle() {
    const newTheme = this.currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    this.setTheme(newTheme)
  }

  init() {
    // Apply initial theme
    this.applyTheme(this.currentTheme)
    
    // Create toggle button with dropdown
    this.container.innerHTML = `
      <div class="theme-selector relative">
        <button class="theme-toggle-btn flex items-center gap-2 p-2 rounded-full bg-gray-200/50 dark:bg-white/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/30 hover:bg-gray-200/80 dark:hover:bg-white/30 transition-all duration-300" 
                aria-label="Toggle theme">
          <span class="theme-icon text-lg" role="img"></span>
          <svg class="w-4 h-4 text-negro-azulado dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div class="theme-dropdown hidden absolute top-full right-0 mt-2 bg-white rounded-anclora-sm shadow-lg border border-gray-200 overflow-hidden min-w-[120px]" style="z-index: 99999;">
          <button class="theme-option w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors" data-theme="${THEMES.LIGHT}">
            <span role="img">☀️</span>
            <span class="text-sm text-gray-700">Claro</span>
          </button>
          <button class="theme-option w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors" data-theme="${THEMES.DARK}">
            <span role="img">🌙</span>
            <span class="text-sm text-gray-700">Oscuro</span>
          </button>
          <button class="theme-option w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors" data-theme="${THEMES.SYSTEM}">
            <span role="img">💻</span>
            <span class="text-sm text-gray-700">Sistema</span>
          </button>
        </div>
      </div>
    `
    
    // Update UI
    this.updateToggleUI()
    
    // Add event listeners
    const toggleBtn = this.container.querySelector('.theme-toggle-btn')
    const themeOptions = this.container.querySelectorAll('.theme-option')
    
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleDropdown()
    })
    
    themeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const selectedTheme = e.currentTarget.dataset.theme
        if (selectedTheme === THEMES.SYSTEM) {
          localStorage.removeItem(STORAGE_KEYS.THEME)
          this.currentTheme = this.getSystemTheme()
          this.applyTheme(this.currentTheme)
        } else {
          this.setTheme(selectedTheme)
        }
        this.toggleDropdown()
      })
    })
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        const dropdown = this.container.querySelector('.theme-dropdown')
        dropdown.classList.add('hidden')
      }
    })
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getStoredTheme()) {
        this.setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT)
      }
    })
  }

  toggleDropdown() {
    const dropdown = this.container.querySelector('.theme-dropdown')
    dropdown.classList.toggle('hidden')
  }

  // Static method for easy initialization
  static init(selector) {
    const container = document.querySelector(selector)
    if (container) {
      return new ThemeToggle(container)
    }
    console.warn(`ThemeToggle: Container not found for selector "${selector}"`)
    return null
  }
}