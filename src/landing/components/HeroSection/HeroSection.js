// Hero Section Component with value proposition
import Button from '../../../shared/components/Button/Button.js'
import { authModalVanilla } from '../../../shared/components/AuthModalVanilla.js'

import i18n from '../../../shared/utils/i18n.js'

export default class HeroSection {
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
      <section id="hero" class="min-h-screen bg-gradient-hero flex items-center justify-center relative overflow-hidden pt-20 pb-8">
        <!-- Background decoration -->
        <div class="absolute inset-0 bg-gradient-to-br from-transparent via-azul-claro/10 to-transparent"></div>
        <div class="absolute top-20 left-10 w-72 h-72 bg-azul-claro/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-ambar-suave/20 rounded-full blur-3xl"></div>
        
        <!-- Hero Content -->
        <div class="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
          <!-- Main Headline -->
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-baskerville leading-tight">
            ${t.heroTitle}
            <span class="block text-ambar-suave">${t.heroTitleHighlight}</span>
          </h1>
          
          <!-- Value Proposition -->
          <p class="text-lg md:text-xl mb-6 max-w-4xl mx-auto font-inter leading-relaxed text-white/90">
            ${t.heroSubtitle} ${t.heroDescription}
          </p>
          
          <!-- Key Benefits -->
          <div class="grid md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            <div class="bg-white/10 backdrop-blur-sm rounded-anclora p-6 border border-white/20">
              <div class="text-3xl mb-3">🚀</div>
              <h3 class="text-lg font-bold mb-2 font-baskerville">${t.benefit1Title}</h3>
              <p class="text-sm text-white/80 font-inter">${t.benefit1Description}</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-anclora p-6 border border-white/20">
              <div class="text-3xl mb-3">🎯</div>
              <h3 class="text-lg font-bold mb-2 font-baskerville">${t.benefit2Title}</h3>
              <p class="text-sm text-white/80 font-inter">${t.benefit2Description}</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-anclora p-6 border border-white/20">
              <div class="text-3xl mb-3">⚡</div>
              <h3 class="text-lg font-bold mb-2 font-baskerville">${t.benefit3Title}</h3>
              <p class="text-sm text-white/80 font-inter">${t.benefit3Description}</p>
            </div>
          </div>
          
          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button id="cta-primary" class="bg-gradient-action text-negro-azulado px-8 py-4 rounded-anclora-sm font-bold text-lg hover:transform hover:-translate-y-1 transition-all duration-300 shadow-anclora-button hover:shadow-anclora-button-hover">
              ${t.ctaPrimary}
            </button>
            
            <button id="cta-secondary" class="bg-transparent text-white border-2 border-white px-8 py-4 rounded-anclora-sm font-bold text-lg hover:bg-white hover:text-azul-profundo transition-all duration-300">
              ${t.ctaSecondary}
            </button>
          </div>
          
          <!-- Pre-launch CTA -->
          <div class="mt-12 text-center">
            <p class="text-white/70 text-lg mb-4 font-inter font-medium">${t.socialProof}</p>
          </div>
        </div>
        
        <!-- Scroll indicator -->
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg class="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>
    `
    
    // Add event listeners for CTA buttons
    const primaryCTA = this.container.querySelector('#cta-primary')
    const secondaryCTA = this.container.querySelector('#cta-secondary')
    
    primaryCTA.addEventListener('click', () => {
      authModalVanilla.open('register')
    })
    
    secondaryCTA.addEventListener('click', () => {
      this.openDemoModal()
    })
    
    // Add parallax effect on scroll
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset
      const parallax = this.container.querySelector('.relative.z-10')
      const speed = 0.5
      
      if (parallax) {
        parallax.style.transform = `translateY(${scrolled * speed}px)`
      }
    })
  }

  openDemoModal() {
    // For now, show alert - later implement demo modal
    const currentLang = i18n.getCurrentLanguage()
    const message = currentLang === 'es'
      ? '🎬 Demo disponible próximamente!\n\nEstamos preparando una demostración interactiva. Por ahora puedes explorar las características más abajo.'
      : '🎬 Demo coming soon!\n\nWe\'re preparing an interactive demonstration. For now, you can explore the features below.'
    
    alert(message)
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  setupLanguageListener() {
    window.addEventListener('languageChanged', (e) => {
      console.log('Language changed event received:', e.detail)
      this.translations = e.detail.translations || i18n.getTranslations(e.detail.language)
      console.log('New translations:', this.translations)
      this.render()
      this.setupEventListeners()
    })
  }

  setupEventListeners() {
    // Re-add event listeners for CTA buttons after re-render
    const primaryCTA = this.container.querySelector('#cta-primary')
    const secondaryCTA = this.container.querySelector('#cta-secondary')
    
    if (primaryCTA) {
      primaryCTA.addEventListener('click', () => {
        authModalVanilla.open('register')
      })
    }
    
    if (secondaryCTA) {
      secondaryCTA.addEventListener('click', () => {
        this.openDemoModal()
      })
    }
  }

  // Static method for easy initialization
  static init(selector) {
    const container = document.querySelector(selector)
    if (container) {
      return new HeroSection(container)
    }
    console.warn(`HeroSection: Container not found for selector "${selector}"`)
    return null
  }
}