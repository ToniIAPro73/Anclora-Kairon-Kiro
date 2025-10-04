// Button component with Anclora design system
export default class Button {
  constructor(options = {}) {
    this.text = options.text || 'Button'
    this.variant = options.variant || 'primary' // primary, secondary, ghost
    this.size = options.size || 'medium' // small, medium, large
    this.onClick = options.onClick || (() => {})
    this.className = options.className || ''
    this.disabled = options.disabled || false
  }

  getClasses() {
    const baseClasses = 'font-bold transition-all duration-300 cursor-pointer inline-block text-center border-0 outline-none'
    
    const variantClasses = {
      primary: 'bg-gradient-action text-negro-azulado hover:transform hover:-translate-y-1 shadow-anclora-button hover:shadow-anclora-button-hover',
      secondary: 'bg-transparent text-azul-claro border-2 border-azul-claro hover:bg-azul-claro hover:text-white',
      ghost: 'bg-transparent text-azul-claro hover:bg-azul-claro/10'
    }
    
    const sizeClasses = {
      small: 'px-4 py-2 text-sm rounded-anclora-sm',
      medium: 'px-8 py-3 text-base rounded-anclora-sm',
      large: 'px-10 py-4 text-lg rounded-anclora'
    }
    
    const disabledClasses = this.disabled ? 'opacity-50 cursor-not-allowed' : ''
    
    return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${disabledClasses} ${this.className}`.trim()
  }

  render() {
    const button = document.createElement('button')
    button.textContent = this.text
    button.className = this.getClasses()
    button.disabled = this.disabled
    
    if (!this.disabled) {
      button.addEventListener('click', this.onClick)
    }
    
    return button
  }

  // Static method for quick button creation
  static create(text, onClick, variant = 'primary') {
    return new Button({ text, onClick, variant }).render()
  }
}