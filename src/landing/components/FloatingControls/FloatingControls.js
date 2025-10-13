// Floating Controls Component - Theme and Language selectors in bottom left corner
export default class FloatingControls {
  constructor(container) {
    this.container = container
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme()
    this.currentLanguage = this.getStoredLanguage() || 'es'
    this.init()
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  getStoredTheme() {
    return localStorage.getItem('ANCLORA_THEME')
  }

  getStoredLanguage() {
    return localStorage.getItem('ANCLORA_LANGUAGE')
  }

  init() {
    this.container.innerHTML = `
      <div class="floating-controls fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        <button class="theme-toggle-compact flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-azul-profundo/80 backdrop-blur-md border border-gray-200/50 dark:border-white/20 hover:bg-white/90 dark:hover:bg-azul-profundo/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                aria-label="Toggle theme">
          <span class="theme-icon text-lg" role="img"></span>
        </button>

        <button class="language-toggle-compact flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-azul-profundo/80 backdrop-blur-md border border-gray-200/50 dark:border-white/20 hover:bg-white/90 dark:hover:bg-azul-profundo/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                aria-label="Change language">
          <span class="language-icon text-lg" role="img"></span>
        </button>
      </div>
    `

    // Set initial icons
    this.updateThemeIcon()
    this.updateLanguageIcon()

    // Add event listeners
    const themeBtn = this.container.querySelector('.theme-toggle-compact')
    const languageBtn = this.container.querySelector('.language-toggle-compact')

    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleTheme()
    })

    languageBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleLanguage()
    })

    // Add scroll behavior - ensure controls don't overlap content
    this.setupScrollBehavior()

    // Listen for external theme and language changes
    this.setupExternalListeners()
  }

  updateThemeIcon() {
    const icon = this.container.querySelector('.theme-icon')

    if (!this.getStoredTheme()) {
      // System theme
      icon.textContent = '💻'
    } else if (this.currentTheme === 'dark') {
      icon.textContent = '🌙'
    } else {
      icon.textContent = '☀️'
    }
  }

  updateLanguageIcon() {
    const icon = this.container.querySelector('.language-icon')

    if (this.currentLanguage === 'en') {
      icon.textContent = '🇺🇸'
    } else {
      icon.textContent = '🇪🇸'
    }
  }

  toggleTheme() {
    let newTheme
    const storedTheme = this.getStoredTheme()

    if (!storedTheme) {
      // Currently using system, switch to opposite
      newTheme = this.getSystemTheme() === 'dark' ? 'light' : 'dark'
    } else if (this.currentTheme === 'dark') {
      newTheme = 'light'
    } else {
      newTheme = 'dark'
    }

    // Apply theme
    this.currentTheme = newTheme
    localStorage.setItem('ANCLORA_THEME', newTheme)
    const root = document.documentElement
    const body = document.body

    if (newTheme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
    }

    // Update icon
    this.updateThemeIcon()

    // Dispatch event
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }))
  }

  toggleLanguage() {
    const newLang = this.currentLanguage === 'en' ? 'es' : 'en'

    // Apply language
    this.currentLanguage = newLang
    localStorage.setItem('ANCLORA_LANGUAGE', newLang)

    // Update icon
    this.updateLanguageIcon()

    // Dispatch event with translations
    import('../../../shared/utils/i18n.js').then(({ default: i18n }) => {
      const translations = i18n.getTranslations(newLang)
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: newLang, translations }
      }))
    })
  }

  setupScrollBehavior() {
    // Ensure controls don't overlap with content at bottom
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // If near bottom of page, adjust position slightly
      if (scrolled + windowHeight > documentHeight - 100) {
        this.container.style.bottom = '100px'
      } else {
        this.container.style.bottom = '24px'
      }
    })
  }

  setupExternalListeners() {
    // Listen for external theme changes
    window.addEventListener('themeChanged', (e) => {
      this.currentTheme = e.detail.theme
      this.updateThemeIcon()
    })

    // Listen for external language changes
    window.addEventListener('languageChanged', (e) => {
      this.currentLanguage = e.detail.language
      this.updateLanguageIcon()
    })
  }

  // Static method for easy initialization
  static init(selector) {
    const container = document.querySelector(selector)
    if (container) {
      return new FloatingControls(container)
    }
    console.warn(`FloatingControls: Container not found for selector "${selector}"`)
    return null
  }
}