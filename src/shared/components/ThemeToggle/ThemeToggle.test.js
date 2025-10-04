import { describe, it, expect, beforeEach, vi } from 'vitest'
import ThemeToggle from './ThemeToggle.js'
import { THEMES } from '../../utils/constants.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ThemeToggle Component', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  it('should initialize with system theme by default', () => {
    const themeToggle = new ThemeToggle(container)
    
    expect(container.querySelector('.theme-toggle-btn')).toBeTruthy()
    expect(container.querySelector('.theme-dropdown')).toBeTruthy()
  })

  it('should apply dark class when dark theme is set', () => {
    const themeToggle = new ThemeToggle(container)
    
    themeToggle.setTheme(THEMES.DARK)
    
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('dark')).toBe(true)
  })

  it('should remove dark class when light theme is set', () => {
    const themeToggle = new ThemeToggle(container)
    
    // First set dark
    themeToggle.setTheme(THEMES.DARK)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    
    // Then set light
    themeToggle.setTheme(THEMES.LIGHT)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.body.classList.contains('dark')).toBe(false)
  })
})