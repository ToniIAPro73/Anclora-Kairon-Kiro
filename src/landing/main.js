import './style.css'
import '../shared/styles/anclora-design-system.css'

// Import components
import Navigation from './components/Navigation/Navigation.js'
import HeroSection from './components/HeroSection/HeroSection.js'
import PainSection from './components/PainSection/PainSection.js'
import EpiphanySection from './components/EpiphanySection/EpiphanySection.js'
import HowItWorksSection from './components/HowItWorksSection/HowItWorksSection.js'
import OfferSection from './components/OfferSection/OfferSection.js'
import FinalCtaSection from './components/FinalCtaSection/FinalCtaSection.js'

// Import utilities
import themeUtil from '../shared/utils/theme.js'
import i18n from '../shared/utils/i18n.js'

// Landing page entry point
console.log('Anclora Kairon Landing Page loaded')

// Initialize landing page
document.addEventListener('DOMContentLoaded', () => {
  console.log('Landing page DOM loaded')
  
  // Initialize theme and i18n first
  themeUtil.init()
  i18n.init()
  console.log('✅ Theme and i18n systems initialized')
  
  // Initialize components
  try {
    // Initialize Navigation
    Navigation.init('#navigation')
    console.log('✅ Navigation initialized')
    
    // Initialize Hero Section
    HeroSection.init('#hero-section')
    console.log('✅ Hero Section initialized')
    
    // Initialize Pain Section
    PainSection.init('#pain-section')
    console.log('✅ Pain Section initialized')
    
    // Initialize Epiphany Section
    EpiphanySection.init('#epiphany-section')
    console.log('✅ Epiphany Section initialized')
    
    // Initialize How It Works Section
    HowItWorksSection.init('#how-it-works-section')
    console.log('✅ How It Works Section initialized')
    
    // Initialize Offer Section
    OfferSection.init('#offer-section')
    console.log('✅ Offer Section initialized')
    
    // Initialize Final CTA Section
    FinalCtaSection.init('#final-cta-section')
    console.log('✅ Final CTA Section initialized')
    
    console.log('🎉 Landing page completa: Embudo de ventas psicológicamente optimizado implementado')
    
  } catch (error) {
    console.error('Error initializing components:', error)
  }
  
  // Listen for theme and language changes
  window.addEventListener('themeChanged', (e) => {
    console.log('Theme changed to:', e.detail.theme)
    // Force a repaint to ensure styles are applied
    document.body.style.display = 'none'
    document.body.offsetHeight // Trigger reflow
    document.body.style.display = ''
  })
  
  window.addEventListener('languageChanged', (e) => {
    console.log('Language changed to:', e.detail.language)
    // Here you could update all text content based on the new language
  })
})