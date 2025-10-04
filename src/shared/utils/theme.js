// Theme utilities
import { THEMES, STORAGE_KEYS } from './constants.js'

export default {
  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT
  },

  getStoredTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME)
  },

  getCurrentTheme() {
    return this.getStoredTheme() || this.getSystemTheme()
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
    this.applyTheme(theme)
  },

  applyTheme(theme) {
    const root = document.documentElement
    
    if (theme === THEMES.DARK) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }))
  },

  toggle() {
    const currentTheme = this.getCurrentTheme()
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    this.setTheme(newTheme)
    return newTheme
  },

  init() {
    const theme = this.getCurrentTheme()
    this.applyTheme(theme)
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getStoredTheme()) {
        this.applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT)
      }
    })
    
    return theme
  }
}