// How It Works Section Component
import i18n from '../../../shared/utils/i18n.js'

export default class HowItWorksSection {
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
      <section id="how-it-works" class="py-20 bg-gradient-subtle dark:bg-gradient-to-b dark:from-dark-bg-primary dark:to-dark-bg-secondary">
        <div class="max-w-6xl mx-auto px-6">
          <!-- Section Title -->
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-negro-azulado dark:text-dark-text-primary mb-6 font-baskerville leading-tight">
              ${t.howTitle}
            </h2>
          </div>
          
          <!-- Steps -->
          <div class="relative max-w-5xl mx-auto">
            <!-- Steps Grid -->
            <div class="grid md:grid-cols-3 gap-8 md:gap-12">
              <!-- Step 1 -->
              <div class="text-center relative">
                <div class="w-20 h-20 bg-gradient-to-br from-azul-claro to-azul-profundo rounded-full flex items-center justify-center mx-auto mb-6 shadow-anclora relative z-10">
                  <span class="text-3xl text-white">🔗</span>
                </div>
                <h3 class="text-2xl font-bold text-azul-profundo dark:text-azul-claro mb-4 font-baskerville">
                  ${t.howStep1Title}
                </h3>
                <p class="text-negro-azulado dark:text-white font-inter leading-relaxed">
                  ${t.howStep1Desc}
                </p>
                
                <!-- Connection Arrow (Desktop only) -->
                <div class="hidden md:block absolute top-10 -right-6 w-12 h-1 bg-gradient-to-r from-azul-claro to-teal-secundario"></div>
                <div class="hidden md:block absolute top-9 -right-2 w-0 h-0 border-l-4 border-l-teal-secundario border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
              </div>
              
              <!-- Step 2 -->
              <div class="text-center relative">
                <div class="w-20 h-20 bg-gradient-to-br from-teal-secundario to-azul-claro rounded-full flex items-center justify-center mx-auto mb-6 shadow-anclora relative z-10">
                  <span class="text-3xl text-white">🎯</span>
                </div>
                <h3 class="text-2xl font-bold text-azul-profundo dark:text-azul-claro mb-4 font-baskerville">
                  ${t.howStep2Title}
                </h3>
                <p class="text-negro-azulado dark:text-white font-inter leading-relaxed">
                  ${t.howStep2Desc}
                </p>
                
                <!-- Animated Arrow -->
                <div class="hidden md:block absolute top-10 -right-14 w-24 h-auto">
                    <svg viewBox="0 0 100 20" class="w-full h-full">
                        <defs>
                            <linearGradient id="gradient2">
                                <stop offset="0%" stop-color="#37B5A4" />
                                <stop offset="100%" stop-color="#FFC979" />
                            </linearGradient>
                            <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="url(#gradient2)" />
                            </marker>
                        </defs>
                        <path d="M0,10 C20,0 80,0 100,10" stroke-width="2" stroke="url(#gradient2)" fill="none" stroke-linecap="round" stroke-linejoin="round" class="animated-arrow-path" marker-end="url(#arrowhead2)" />
                    </svg>
                </div>
              </div>
              
              <!-- Step 3 -->
              <div class="text-center">
                <div class="w-20 h-20 bg-gradient-to-br from-ambar-suave to-teal-secundario rounded-full flex items-center justify-center mx-auto mb-6 shadow-anclora relative z-10">
                  <span class="text-3xl text-white">⚡</span>
                </div>
                <h3 class="text-2xl font-bold text-azul-profundo dark:text-azul-claro mb-4 font-baskerville">
                  ${t.howStep3Title}
                </h3>
                <p class="text-negro-azulado dark:text-white font-inter leading-relaxed">
                  ${t.howStep3Desc}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Bottom CTA -->
          <div class="text-center mt-16">
            <div class="bg-white dark:bg-azul-profundo rounded-anclora-lg p-8 max-w-3xl mx-auto shadow-lg border border-red-200 dark:border-red-800/30">
              <p class="text-lg text-azul-profundo dark:text-white font-inter mb-4">
                <strong>Simple, ¿verdad?</strong> Pero la simplicidad es el resultado de una complejidad resuelta.
              </p>
              <p class="text-negro-azulado dark:text-white font-inter">
                Detrás de estos 3 pasos hay años de investigación en gestión de proyectos, psicología del tiempo y inteligencia artificial.
              </p>
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
      return new HowItWorksSection(container)
    }
    console.warn(`HowItWorksSection: Container not found for selector "${selector}"`)
    return null
  }
}