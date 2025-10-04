// Local Storage utilities
export default {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error reading from localStorage for key "${key}":`, error)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Error writing to localStorage for key "${key}":`, error)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Error removing from localStorage for key "${key}":`, error)
      return false
    }
  },

  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
      return false
    }
  }
}