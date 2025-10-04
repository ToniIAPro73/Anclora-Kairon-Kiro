// Epiphany Section Component
import i18n from '../../../shared/utils/i18n.js'

export default class EpiphanySection {
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
      <section id="epiphany" class="py-20 bg-gradient-to-br from-azul-profundo to-azul-claro text-white relative overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div class="absolute top-10 right-10 w-64 h-64 bg-ambar-suave/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 left-10 w-80 h-80 bg-teal-secundario/20 rounded-full blur-3xl"></div>
        
        <div class="relative z-10 max-w-6xl mx-auto px-6">
          <!-- Epiphany Content -->
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold mb-6 font-baskerville leading-tight">
              ${t.epiphanyTitle}
            </h2>
            <p class="text-xl text-ambar-suave font-inter mb-8 max-w-2xl mx-auto">
              ${t.epiphanySubtitle}
            </p>
          </div>
          
          <!-- The Story -->
          <div class="max-w-4xl mx-auto">
            <div class="bg-white/10 backdrop-blur-sm rounded-anclora-lg p-8 md:p-12 border border-white/20">
              <div class="flex items-start space-x-6">
                <div class="flex-shrink-0 w-16 h-16 bg-ambar-suave/20 rounded-full flex items-center justify-center">
                  <span class="text-3xl">💡</span>
                </div>
                <div>
                  <p class="text-lg md:text-xl leading-relaxed font-inter text-white/90 mb-6">
                    ${t.epiphanyText}
                  </p>
                  
                  <!-- Chronos vs Kairos -->
                  <div class="grid md:grid-cols-2 gap-8 mt-8">
                    <div class="text-center p-6 bg-white/5 rounded-anclora border border-white/10">
                      <div class="text-4xl mb-4">⏱️</div>
                      <h3 class="text-xl font-bold mb-2 font-baskerville text-red-300">Chronos</h3>
                      <p class="text-sm text-white/70 font-inter">Tiempo cuantitativo<br>Medición lineal<br>Reacción</p>
                    </div>
                    
                    <div class="text-center p-6 bg-ambar-suave/20 rounded-anclora border border-ambar-suave/30">
                      <div class="text-4xl mb-4">⚡</div>
                      <h3 class="text-xl font-bold mb-2 font-baskerville text-ambar-suave">Kairos</h3>
                      <p class="text-sm text-white/90 font-inter">Momento oportuno<br>Calidad temporal<br>Anticipación</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Transition to solution -->
          <div class="text-center mt-16">
            <p class="text-lg text-white/80 font-inter italic">
              Esta revelación cambió todo. Y ahora puede cambiar tu forma de trabajar.
            </p>
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
      return new EpiphanySection(container)
    }
    console.warn(`EpiphanySection: Container not found for selector "${selector}"`)
    return null
  }
}