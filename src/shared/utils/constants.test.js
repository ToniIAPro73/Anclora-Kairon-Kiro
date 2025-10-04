import { describe, it, expect } from 'vitest'
import { THEMES, LANGUAGES, ANCLORA_COLORS } from './constants.js'

describe('Constants', () => {
  it('should have correct theme values', () => {
    expect(THEMES.LIGHT).toBe('light')
    expect(THEMES.DARK).toBe('dark')
    expect(THEMES.SYSTEM).toBe('system')
  })

  it('should have correct language values', () => {
    expect(LANGUAGES.ES).toBe('es')
    expect(LANGUAGES.EN).toBe('en')
  })

  it('should have Anclora color palette', () => {
    expect(ANCLORA_COLORS.AZUL_PROFUNDO).toBe('#23436B')
    expect(ANCLORA_COLORS.AZUL_CLARO).toBe('#2EAFC4')
    expect(ANCLORA_COLORS.TEAL_SECUNDARIO).toBe('#37B5A4')
    expect(ANCLORA_COLORS.AMBAR_SUAVE).toBe('#FFC979')
    expect(ANCLORA_COLORS.GRIS_CLARO).toBe('#F6F7F9')
    expect(ANCLORA_COLORS.NEGRO_AZULADO).toBe('#162032')
    expect(ANCLORA_COLORS.BLANCO).toBe('#FFFFFF')
  })
})