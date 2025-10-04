// Final CTA Section Component
import i18n from '../../../shared/utils/i18n.js'

export default class FinalCtaSection {
  constructor(container) {
    this.container = container
    this.translations = i18n.getTranslations()
    this.init()
    this.setupLanguageListener()
  }

  init() {
    this.render()
    this.setupEventListeners()
  }

  render() {
    const t = this.translations
    
    this.container.innerHTML = `
      <section id="final-cta" class="py-20 bg-gradient-action relative overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute inset-0 bg-gradient-to-r from-azul-claro/20 via-transparent to-ambar-suave/20"></div>
        
        <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <!-- Final CTA Title -->
          <h2 class="text-4xl md:text-5xl font-bold text-negro-azulado mb-6 font-baskerville leading-tight">
            ${t.finalCtaTitle}
          </h2>
          
          <!-- Registration Form -->
          <div class="max-w-md mx-auto mb-8">
            <form id="beta-signup-form" class="space-y-4">
              <div class="relative">
                <input 
                  type="email" 
                  id="email-input"
                  placeholder="${t.emailPlaceholder}"
                  required
                  class="w-full px-6 py-4 text-lg rounded-anclora-sm border-2 border-white/30 bg-white/90 backdrop-blur-sm text-negro-azulado placeholder-negro-azulado/60 focus:outline-none focus:border-azul-profundo focus:bg-white transition-all duration-300"
                />
              </div>
              
              <button 
                type="submit"
                id="beta-signup-btn"
                class="w-full bg-negro-azulado text-white px-8 py-4 rounded-anclora-sm font-bold text-lg hover:bg-azul-profundo hover:transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ${t.finalCtaButton}
              </button>
            </form>
          </div>
          
          <!-- Scarcity Message -->
          <p class="text-negro-azulado/80 font-inter mb-8">
            ${t.finalCtaSubtitle}
          </p>
          
          <!-- Trust Indicators -->
          <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-negro-azulado/60 text-sm font-inter">
            <div class="flex items-center space-x-2">
              <span>🔒</span>
              <span>100% Seguro</span>
            </div>
            <div class="flex items-center space-x-2">
              <span>📧</span>
              <span>Sin spam, prometido</span>
            </div>
            <div class="flex items-center space-x-2">
              <span>⚡</span>
              <span>Aseguras tu plaza ahora</span>
            </div>
          </div>
          
          <!-- Success Message (Hidden by default) -->
          <div id="success-message" class="hidden mt-8 p-6 bg-green-100 border border-green-300 rounded-anclora">
            <div class="flex items-center justify-center space-x-2 text-green-800">
              <span class="text-2xl">🎉</span>
              <div>
                <p class="font-bold">¡Bienvenido a la revolución!</p>
                <p class="text-sm">Te contactaremos pronto con los detalles de acceso.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  }

  setupEventListeners() {
    const form = this.container.querySelector('#beta-signup-form')
    const emailInput = this.container.querySelector('#email-input')
    const submitBtn = this.container.querySelector('#beta-signup-btn')
    const successMessage = this.container.querySelector('#success-message')
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        
        const email = emailInput.value.trim()
        if (!email) return
        
        // Simulate form submission
        submitBtn.textContent = 'Procesando...'
        submitBtn.disabled = true
        
        setTimeout(() => {
          // Hide form and show success message
          form.style.display = 'none'
          successMessage.classList.remove('hidden')
          
          // Store email in localStorage for demo purposes
          localStorage.setItem('beta-signup-email', email)
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('betaSignup', { 
            detail: { email } 
          }))
          
          console.log('Beta signup:', email)
        }, 1500)
      })
    }
  }

  setupLanguageListener() {
    window.addEventListener('languageChanged', (e) => {
      this.translations = e.detail.translations || i18n.getTranslations(e.detail.language)
      this.render()
      this.setupEventListeners()
    })
  }

  // Static method for easy initialization
  static init(selector) {
    const container = document.querySelector(selector)
    if (container) {
      return new FinalCtaSection(container)
    }
    console.warn(`FinalCtaSection: Container not found for selector "${selector}"`)
    return null
  }
}