/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    './index.html'
  ],
  theme: {
    extend: {
      colors: {
        // Anclora Kairon color palette
        'azul-profundo': '#23436B',
        'azul-claro': '#2EAFC4',
        'teal-secundario': '#37B5A4',
        'ambar-suave': '#FFC979',
        'gris-claro': '#F6F7F9',
        'negro-azulado': '#162032',
        'blanco': '#FFFFFF',
      },
      fontFamily: {
        'baskerville': ['Libre Baskerville', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(120deg, #23436B 0%, #2EAFC4 100%)',
        'gradient-action': 'linear-gradient(90deg, #2EAFC4 0%, #FFC979 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #F6F7F9 0%, #FFFFFF 100%)',
      },
      borderRadius: {
        'anclora': '20px',
        'anclora-sm': '12px',
        'anclora-lg': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      backdropBlur: {
        'anclora': '10px',
      },
      boxShadow: {
        'anclora': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'anclora-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'anclora-button': '0 4px 15px rgba(46, 175, 196, 0.3)',
        'anclora-button-hover': '0 6px 20px rgba(46, 175, 196, 0.4)',
      }
    },
  },
  plugins: [],
  darkMode: 'class', // Use class-based dark mode
}