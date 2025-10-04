// Language Selector Component with localStorage persistence
import { LANGUAGES, STORAGE_KEYS } from '../../utils/constants.js'
import i18n from '../../utils/i18n.js'

export default class LanguageSelector {
  constructor(container) {
    this.container = container
    this.currentLanguage = this.getStoredLanguage() || LANGUAGES.ES
    this.translations = {
      [LANGUAGES.ES]: {
        spanish: 'Español',
        english: 'English',
        selectLanguage: 'Seleccionar idioma'
      },
      [LANGUAGES.EN]: {
        spanish: 'Español',
        english: 'English', 
        selectLanguage: 'Select language'
      }
    }
    this.init()
  }

  getStoredLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE)
  }

  setLanguage(language) {
    this.currentLanguage = language
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language)
    this.updateUI()
    
    // Get the correct translations for the selected language
    const translations = i18n.getTranslations(language)
    console.log('Setting language to:', language, 'with translations:', translations)
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language, translations } 
    }))
  }

  updateUI() {
    const currentFlag = this.container.querySelector('.current-flag')
    const currentLang = this.container.querySelector('.current-lang')
    
    if (this.currentLanguage === LANGUAGES.ES) {
      currentFlag.textContent = '🇪🇸'
      currentLang.textContent = 'ES'
    } else {
      currentFlag.textContent = '🇺🇸'
      currentLang.textContent = 'EN'
    }
  }

  toggleDropdown() {
    const dropdown = this.container.querySelector('.language-dropdown')
    dropdown.classList.toggle('hidden')
  }

  init() {
    const t = this.translations[this.currentLanguage]
    
    this.container.innerHTML = `
      <div class="language-selector relative">
        <button class="language-toggle-btn flex items-center gap-2 p-2 rounded-full bg-gray-200/50 dark:bg-white/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/30 hover:bg-gray-200/80 dark:hover:bg-white/30 transition-all duration-300"
                aria-label="${t.selectLanguage}">
          <span class="current-flag text-lg" role="img"></span>
          <span class="current-lang text-sm font-medium text-negro-azulado dark:text-white"></span>
          <svg class="w-4 h-4 text-negro-azulado dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <div class="language-dropdown hidden absolute top-full right-0 mt-2 bg-white rounded-anclora-sm shadow-lg border border-gray-200 overflow-hidden min-w-[120px]" style="z-index: 99999;">
          <button class="lang-option w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors" data-lang="${LANGUAGES.ES}">
            <span role="img">🇪🇸</span>
            <span class="text-sm">${t.spanish}</span>
          </button>
          <button class="lang-option w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors" data-lang="${LANGUAGES.EN}">
            <span role="img">🇺🇸</span>
            <span class="text-sm">${t.english}</span>
          </button>
        </div>
      </div>
    `
    
    // Update initial UI
    this.updateUI()
    
    // Add event listeners
    const toggleBtn = this.container.querySelector('.language-toggle-btn')
    const langOptions = this.container.querySelectorAll('.lang-option')
    
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleDropdown()
    })
    
    langOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const selectedLang = e.currentTarget.dataset.lang
        this.setLanguage(selectedLang)
        this.toggleDropdown()
      })
    })
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        const dropdown = this.container.querySelector('.language-dropdown')
        dropdown.classList.add('hidden')
      }
    })
  }

  // Static method for easy initialization
  static init(selector) {
    const container = document.querySelector(selector)
    if (container) {
      return new LanguageSelector(container)
    }
    console.warn(`LanguageSelector: Container not found for selector "${selector}"`)
    return null
  }
}