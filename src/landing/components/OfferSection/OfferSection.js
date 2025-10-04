// Irresistible Offer Section Component
import i18n from '../../../shared/utils/i18n.js'

export default class OfferSection {
  constructor(container) {
    this.container = container
    this.translations = i18n.getTranslations()
    this.init()
    this.setupLanguageListener()
  }

  init() {
    this.render()
  }

  render() {
    const t = this.translations
    
    this.container.innerHTML = `
      <section id="offer" class="py-20 bg-gradient-to-br from-negro-azulado to-azul-profundo text-white relative overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-ambar-suave/10 to-transparent"></div>
        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-ambar-suave/5"></div>
        
        <div class="relative z-10 max-w-6xl mx-auto px-6">
          <!-- Offer Title -->
          <div class="text-center mb-16">
            <div class="inline-block bg-ambar-suave/20 rounded-full px-6 py-2 mb-6">
              <span class="text-ambar-suave font-bold font-inter text-sm uppercase tracking-wide">
                🎁 Oferta Exclusiva
              </span>
            </div>
            <h2 class="text-4xl md:text-5xl font-bold mb-6 font-baskerville leading-tight">
              ${t.offerTitle}
            </h2>
            <p class="text-xl text-white/80 font-inter max-w-3xl mx-auto">
              ${t.offerSubtitle}
            </p>
          </div>
          
          <!-- The Package -->
          <div class="max-w-4xl mx-auto">
            <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-anclora-lg p-8 md:p-12 border border-ambar-suave/30 shadow-2xl">
              <!-- Package Items -->
              <div class="space-y-6">
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 w-8 h-8 bg-ambar-suave rounded-full flex items-center justify-center">
                    <span class="text-negro-azulado font-bold text-sm">🎫</span>
                  </div>
                  <div>
                    <p class="text-lg font-medium text-white font-inter">
                      ${t.offer1}
                    </p>
                    <p class="text-sm text-white/70 font-inter mt-1">
                      Valor: $99/mes (Gratis durante toda la beta)
                    </p>
                  </div>
                </div>
                
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 w-8 h-8 bg-ambar-suave rounded-full flex items-center justify-center">
                    <span class="text-negro-azulado font-bold text-sm">💰</span>
                  </div>
                  <div>
                    <p class="text-lg font-medium text-white font-inter">
                      ${t.offer2}
                    </p>
                    <p class="text-sm text-white/70 font-inter mt-1">
                      Valor: Ahorro de $594/año de por vida
                    </p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 w-8 h-8 bg-ambar-suave rounded-full flex items-center justify-center">
                    <span class="text-negro-azulado font-bold text-sm">💬</span>
                  </div>
                  <div>
                    <p class="text-lg font-medium text-white font-inter">
                      ${t.offer3}
                    </p>
                    <p class="text-sm text-white/70 font-inter mt-1">
                      Valor: Incalculable (Moldea el futuro del producto)
                    </p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0 w-8 h-8 bg-ambar-suave rounded-full flex items-center justify-center">
                    <span class="text-negro-azulado font-bold text-sm">👥</span>
                  </div>
                  <div>
                    <p class="text-lg font-medium text-white font-inter">
                      ${t.offer4}
                    </p>
                    <p class="text-sm text-white/70 font-inter mt-1">
                      Valor: Networking exclusivo con otros pioneros
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Total Value -->
              <div class="mt-8 pt-8 border-t border-white/20">
                <div class="text-center">
                  <p class="text-sm text-white/60 font-inter mb-2">Valor total del paquete:</p>
                  <div class="flex items-center justify-center space-x-4">
                    <span class="text-2xl text-white/50 line-through font-inter">$1,188+</span>
                    <span class="text-4xl font-bold text-ambar-suave font-baskerville">GRATIS</span>
                  </div>
                  <p class="text-sm text-ambar-suave font-inter mt-2">
                    Solo para los primeros 100 Founding Members
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Urgency -->
          <div class="text-center mt-12">
            <div class="inline-flex items-center space-x-2 bg-red-500/20 rounded-full px-6 py-3 border border-red-400/30">
              <span class="text-red-300 text-sm">⏰</span>
              <span class="text-red-200 font-inter text-sm font-medium">
                Plazas limitadas para asegurar una experiencia de alta calidad
              </span>
            </div>
          </div>
        </div>
      </section>
    `
  }

  setupLanguageListener() {
    window.addEventListener('languageChanged', (e) => {
      this.translations = e.detail.translations || i18n.getTranslations(e.detail.language)
      this.render()
    })
  }

  // Static method for easy initialization
  static init(selector) {
    const container = document.querySelector(selector)
    if (container) {
      return new OfferSection(container)
    }
    console.warn(`OfferSection: Container not found for selector "${selector}"`)
    return null
  }
}