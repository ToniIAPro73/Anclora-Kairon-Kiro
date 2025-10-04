import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import HeroSection from './HeroSection.js'

describe('HeroSection Component', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  it('should initialize and render hero section', () => {
    const heroSection = new HeroSection(container)
    
    expect(container.querySelector('#hero')).toBeTruthy()
    expect(container.querySelector('h1')).toBeTruthy()
    expect(container.querySelector('#cta-primary')).toBeTruthy()
    expect(container.querySelector('#cta-secondary')).toBeTruthy()
  })

  it('should contain value proposition text', () => {
    new HeroSection(container)
    
    const title = container.querySelector('h1')
    expect(title.textContent).toContain('Domina el momento decisivo')
    expect(title.textContent).toContain('en cada proyecto')
  })

  it('should have hero section with correct structure', () => {
    new HeroSection(container)
    
    const heroSection = container.querySelector('#hero')
    const primaryCTA = container.querySelector('#cta-primary')
    const secondaryCTA = container.querySelector('#cta-secondary')
    
    expect(heroSection).toBeTruthy()
    expect(primaryCTA).toBeTruthy()
    expect(secondaryCTA).toBeTruthy()
    expect(primaryCTA.textContent.trim()).toBe('Unirme a la Beta')
    expect(secondaryCTA.textContent.trim()).toBe('Ver Demo')
  })
})