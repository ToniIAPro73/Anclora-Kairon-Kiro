// Pain Agitation Section Component
import i18n from '../../../shared/utils/i18n.js'

export default class PainSection {
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
      <section id="pain" class="py-20 bg-gradient-to-b from-gris-claro to-white dark:from-azul-profundo dark:to-negro-azulado">
        <div class="max-w-6xl mx-auto px-6">
          <!-- Pain Title -->
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-negro-azulado dark:text-gris-claro mb-6 font-baskerville leading-tight">
              ${t.painTitle}
            </h2>
            <p class="text-xl text-azul-profundo dark:text-azul-claro font-inter max-w-3xl mx-auto">
              ${t.painSubtitle}
            </p>
          </div>
          
          <!-- Pain Points Grid -->
          <div class="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div class="flex items-start space-x-4 p-6 bg-white dark:bg-azul-profundo rounded-anclora border border-red-200 dark:border-red-800/30 shadow-lg">
              <div class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span class="text-2xl">🔥</span>
              </div>
              <div class="flex-1">
                <p class="text-negro-azulado dark:text-white font-inter font-medium text-base leading-relaxed">
                  ${t.pain1}
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-4 p-6 bg-white dark:bg-azul-profundo rounded-anclora border border-red-200 dark:border-red-800/30 shadow-lg">
              <div class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span class="text-2xl">⏰</span>
              </div>
              <div class="flex-1">
                <p class="text-negro-azulado dark:text-white font-inter font-medium text-base leading-relaxed">
                  ${t.pain2}
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-4 p-6 bg-white dark:bg-azul-profundo rounded-anclora border border-red-200 dark:border-red-800/30 shadow-lg">
              <div class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span class="text-2xl">💬</span>
              </div>
              <div class="flex-1">
                <p class="text-negro-azulado dark:text-white font-inter font-medium text-base leading-relaxed">
                  ${t.pain3}
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-4 p-6 bg-white dark:bg-azul-profundo rounded-anclora border border-red-200 dark:border-red-800/30 shadow-lg">
              <div class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span class="text-2xl">😰</span>
              </div>
              <div class="flex-1">
                <p class="text-negro-azulado dark:text-white font-inter font-medium text-base leading-relaxed">
                  ${t.pain4}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Transition -->
          <div class="text-center mt-16">
            <div class="max-w-2xl mx-auto">
              <p class="text-lg text-azul-profundo dark:text-azul-claro font-inter italic mb-4">
                Pero, ¿y si te dijéramos que hay una forma completamente diferente de trabajar?
              </p>
              <div class="w-24 h-1 bg-gradient-to-r from-azul-claro to-ambar-suave mx-auto rounded-full"></div>
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
      return new PainSection(container)
    }
    console.warn(`PainSection: Container not found for selector "${selector}"`)
    return null
  }
}