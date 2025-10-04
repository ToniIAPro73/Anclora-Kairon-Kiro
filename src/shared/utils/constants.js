// Application constants

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

export const LANGUAGES = {
  ES: 'es',
  EN: 'en'
}

export const STORAGE_KEYS = {
  THEME: 'anclora-theme',
  LANGUAGE: 'anclora-language',
  USER_PREFERENCES: 'anclora-user-preferences'
}

export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  AUTH: '/auth',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  USERS: '/users'
}

export const ANCLORA_COLORS = {
  AZUL_PROFUNDO: '#23436B',
  AZUL_CLARO: '#2EAFC4',
  TEAL_SECUNDARIO: '#37B5A4',
  AMBAR_SUAVE: '#FFC979',
  GRIS_CLARO: '#F6F7F9',
  NEGRO_AZULADO: '#162032',
  BLANCO: '#FFFFFF'
}