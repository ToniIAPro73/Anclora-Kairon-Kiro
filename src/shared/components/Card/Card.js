/**
 * Anclora Card Component
 * Reusable card component following Anclora design system
 */

export default class Card {
  constructor(options = {}) {
    this.options = {
      title: '',
      content: '',
      footer: '',
      variant: 'default', // default, elevated, flat, glass, interactive
      className: '',
      onClick: null,
      ...options
    }
  }

  render() {
    const { title, content, footer, variant, className, onClick } = this.options
    
    const card = document.createElement('div')
    let cardClasses = 'card'
    
    // Apply variant classes
    switch (variant) {
      case 'elevated':
        cardClasses += ' card-elevated'
        break
      case 'flat':
        cardClasses += ' card-flat'
        break
      case 'glass':
        cardClasses += ' glass-card'
        break
      case 'interactive':
        cardClasses += ' card-interactive'
        break
    }
    
    card.className = `${cardClasses} ${className}`.trim()
    
    // Build card structure
    let cardHTML = ''
    
    if (title) {
      cardHTML += `<div class="card-header"><h3 class="text-h4">${title}</h3></div>`
    }
    
    if (content) {
      cardHTML += `<div class="card-body">${content}</div>`
    }
    
    if (footer) {
      cardHTML += `<div class="card-footer">${footer}</div>`
    }
    
    card.innerHTML = cardHTML
    
    if (onClick && typeof onClick === 'function') {
      card.style.cursor = 'pointer'
      card.addEventListener('click', onClick)
    }
    
    return card
  }

  static create(options) {
    return new Card(options).render()
  }
}

// Usage examples:
// const basicCard = Card.create({ 
//   title: 'Card Title', 
//   content: 'Card content goes here',
//   footer: 'Card footer'
// })
// 
// const glassCard = Card.create({ 
//   title: 'Glass Card', 
//   content: 'This card has glass morphism effect',
//   variant: 'glass'
// })
//
// const interactiveCard = Card.create({ 
//   title: 'Interactive Card', 
//   content: 'Click me!',
//   variant: 'interactive',
//   onClick: () => alert('Card clicked!')
// })