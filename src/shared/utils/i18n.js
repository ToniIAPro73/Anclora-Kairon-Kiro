// Internationalization utilities
import { LANGUAGES, STORAGE_KEYS } from './constants.js'

const translations = {
  [LANGUAGES.ES]: {
    // Navigation
    features: 'Características',
    pricing: 'Precios',
    about: 'Acerca de',
    contact: 'Contacto',
    login: 'Iniciar Sesión',
    
    // Hero Section
    heroTitle: 'Domina el momento decisivo',
    heroTitleHighlight: 'en cada proyecto',
    heroSubtitle: 'Anclora Kairon, del griego Kairos, es la plataforma inteligente que te ayuda a actuar en el instante preciso.',
    heroDescription: 'Simplifica la colaboración y transforma tus datos en la decisión correcta, en el momento oportuno.',
    ctaPrimary: 'Unirme a la Beta',
    ctaSecondary: 'Ver Demo',
    
    // Benefits
    benefit1Title: 'Setup en 2 minutos',
    benefit1Description: 'Sin configuraciones complejas. Empieza a trabajar inmediatamente.',
    benefit2Title: 'IA que decide',
    benefit2Description: 'Sugerencias proactivas para que siempre des el siguiente paso correcto.',
    benefit3Title: 'Métricas con propósito',
    benefit3Description: 'Insights claros para tomar la mejor decisión, justo a tiempo.',
    
    // Pre-launch CTA
    socialProof: 'Sé uno de los primeros equipos en dominar el momento decisivo. Únete a nuestra beta privada.',
    
    // Pain Agitation Section
    painTitle: '¿Cansado de reaccionar? Es hora de anticiparse.',
    painSubtitle: 'Si te sientes identificado con esto, no estás solo:',
    pain1: 'Siempre "apagando fuegos" en lugar de prevenir problemas',
    pain2: 'Plazos que se escapan entre los dedos sin saber por qué',
    pain3: 'Reuniones interminables solo para saber en qué punto está todo',
    pain4: 'El estrés de que un pequeño retraso provoque un efecto dominó',
    
    // Epiphany Section
    epiphanyTitle: 'Descubrimos que el problema no era la gestión, sino el momento.',
    epiphanySubtitle: 'La gran revelación que cambió todo',
    epiphanyText: 'Las herramientas actuales solo miden el tiempo cronológico (Chronos), pero los proyectos exitosos requieren dominar el momento oportuno (Kairos). No necesitas más datos, necesitas saber cuándo actuar.',
    
    // How It Works Section
    howTitle: 'Domina tus proyectos en 3 simples pasos.',
    howStep1Title: '1. Conecta',
    howStep1Desc: 'Integra tus flujos de trabajo actuales sin cambiar nada',
    howStep2Title: '2. Decide', 
    howStep2Desc: 'Kairon analiza los datos y te ofrece sugerencias proactivas',
    howStep3Title: '3. Domina',
    howStep3Desc: 'Actúa en el momento preciso con la información correcta',
    
    // Irresistible Offer Section
    offerTitle: 'Conviértete en "Founding Member" y obtén beneficios exclusivos para siempre.',
    offerSubtitle: 'El Paquete Fundador incluye:',
    offer1: 'Acceso Prioritario y Gratuito a la beta de Anclora Kairon',
    offer2: 'Descuento Vitalicio del 50% cuando lancemos oficialmente',
    offer3: 'Acceso Directo a los Fundadores para dar feedback',
    offer4: 'Pertenencia a la Comunidad Privada de "Founding Members"',
    
    // Final CTA Section
    finalCtaTitle: 'Únete ahora y sé parte de la revolución',
    finalCtaSubtitle: 'Plazas limitadas para asegurar una experiencia de alta calidad.',
    emailPlaceholder: 'Tu email profesional',
    finalCtaButton: 'Unirme a la Beta',
    
    // Language Selector
    selectLanguage: 'Seleccionar idioma',
    spanish: 'Español',
    english: 'English',
    
    // Authentication Modal
    authWelcomeBack: '¡Bienvenido de vuelta!',
    authWelcomeBackDesc: 'Inicia sesión para continuar con tus proyectos',
    authCreateAccount: 'Crea tu cuenta',
    authCreateAccountDesc: 'Únete a Anclora Kairon y organiza tus proyectos',
    authLoginTab: 'Iniciar Sesión',
    authRegisterTab: 'Registrarse',
    authEmail: 'Correo electrónico',
    authPassword: 'Contraseña',
    authConfirmPassword: 'Confirmar contraseña',
    authFullName: 'Nombre completo',
    authRememberMe: 'Recordarme',
    authForgotPassword: '¿Olvidaste tu contraseña?',
    authLoginButton: 'Iniciar Sesión',
    authRegisterButton: 'Crear Cuenta',
    authOrContinueWith: 'O continúa con',
    authOrRegisterWith: 'O regístrate con',
    authGoogle: 'Google',
    authGitHub: 'GitHub',
    authAcceptTerms: 'Acepto los',
    authTermsAndConditions: 'términos y condiciones',
    authAnd: 'y la',
    authPrivacyPolicy: 'política de privacidad',
    authPasswordRequirements: 'Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números',
    authForgotPasswordTitle: 'Recuperar contraseña',
    authForgotPasswordDesc: 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña',
    authSendRecoveryLink: 'Enviar enlace de recuperación',
    authBackToLogin: '← Volver al inicio de sesión',
    authEmailSent: '¡Email enviado!',
    authEmailSentDesc: 'Hemos enviado un enlace de recuperación a',
    authEmailSentInstructions: 'Revisa tu bandeja de entrada y sigue las instrucciones.',
    authBackToLoginSuccess: 'Volver al inicio de sesión',
    authDidntReceiveEmail: '¿No recibiste el email?',
    authTryAgain: 'Intentar de nuevo',
    authConnecting: 'Conectando...',
    authLoggingIn: 'Iniciando sesión...',
    authCreatingAccount: 'Creando cuenta...',
    authSending: 'Enviando...'
  },
  
  [LANGUAGES.EN]: {
    // Navigation
    features: 'Features',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    login: 'Sign In',
    
    // Hero Section
    heroTitle: 'Master the decisive moment',
    heroTitleHighlight: 'in every project',
    heroSubtitle: 'Anclora Kairon, from the Greek Kairos, is the intelligent platform that helps you act at the precise moment.',
    heroDescription: 'Simplify collaboration and transform your data into the right decision, at the right time.',
    ctaPrimary: 'Join Beta',
    ctaSecondary: 'Watch Demo',
    
    // Benefits
    benefit1Title: '2-minute setup',
    benefit1Description: 'No complex configurations. Start working immediately.',
    benefit2Title: 'AI that decides',
    benefit2Description: 'Proactive suggestions so you always take the right next step.',
    benefit3Title: 'Purposeful metrics',
    benefit3Description: 'Clear insights to make the best decision, just in time.',
    
    // Pre-launch CTA
    socialProof: 'Be one of the first teams to master the decisive moment. Join our private beta.',
    
    // Pain Agitation Section
    painTitle: 'Tired of reacting? It\'s time to anticipate.',
    painSubtitle: 'If this sounds familiar, you\'re not alone:',
    pain1: 'Always "putting out fires" instead of preventing problems',
    pain2: 'Deadlines slipping through your fingers without knowing why',
    pain3: 'Endless meetings just to know where everything stands',
    pain4: 'The stress that one small delay causes a domino effect',
    
    // Epiphany Section
    epiphanyTitle: 'We discovered the problem wasn\'t management, but timing.',
    epiphanySubtitle: 'The breakthrough that changed everything',
    epiphanyText: 'Current tools only measure chronological time (Chronos), but successful projects require mastering the opportune moment (Kairos). You don\'t need more data, you need to know when to act.',
    
    // How It Works Section
    howTitle: 'Master your projects in 3 simple steps.',
    howStep1Title: '1. Connect',
    howStep1Desc: 'Integrate your current workflows without changing anything',
    howStep2Title: '2. Decide',
    howStep2Desc: 'Kairon analyzes data and offers proactive suggestions',
    howStep3Title: '3. Master',
    howStep3Desc: 'Act at the precise moment with the right information',
    
    // Irresistible Offer Section
    offerTitle: 'Become a "Founding Member" and get exclusive benefits forever.',
    offerSubtitle: 'The Founder Package includes:',
    offer1: 'Priority and Free Access to Anclora Kairon beta',
    offer2: 'Lifetime 50% Discount when we officially launch',
    offer3: 'Direct Access to Founders for feedback',
    offer4: 'Membership in the Private "Founding Members" Community',
    
    // Final CTA Section
    finalCtaTitle: 'Join now and be part of the revolution',
    finalCtaSubtitle: 'Limited spots to ensure a high-quality experience.',
    emailPlaceholder: 'Your professional email',
    finalCtaButton: 'Join Beta',
    
    // Language Selector
    selectLanguage: 'Select language',
    spanish: 'Español',
    english: 'English',
    
    // Authentication Modal
    authWelcomeBack: 'Welcome back!',
    authWelcomeBackDesc: 'Sign in to continue with your projects',
    authCreateAccount: 'Create your account',
    authCreateAccountDesc: 'Join Anclora Kairon and organize your projects',
    authLoginTab: 'Sign In',
    authRegisterTab: 'Sign Up',
    authEmail: 'Email address',
    authPassword: 'Password',
    authConfirmPassword: 'Confirm password',
    authFullName: 'Full name',
    authRememberMe: 'Remember me',
    authForgotPassword: 'Forgot your password?',
    authLoginButton: 'Sign In',
    authRegisterButton: 'Create Account',
    authOrContinueWith: 'Or continue with',
    authOrRegisterWith: 'Or sign up with',
    authGoogle: 'Google',
    authGitHub: 'GitHub',
    authAcceptTerms: 'I accept the',
    authTermsAndConditions: 'terms and conditions',
    authAnd: 'and the',
    authPrivacyPolicy: 'privacy policy',
    authPasswordRequirements: 'Minimum 8 characters, includes uppercase, lowercase and numbers',
    authForgotPasswordTitle: 'Reset password',
    authForgotPasswordDesc: 'Enter your email and we\'ll send you a link to reset your password',
    authSendRecoveryLink: 'Send recovery link',
    authBackToLogin: '← Back to sign in',
    authEmailSent: 'Email sent!',
    authEmailSentDesc: 'We\'ve sent a recovery link to',
    authEmailSentInstructions: 'Check your inbox and follow the instructions.',
    authBackToLoginSuccess: 'Back to sign in',
    authDidntReceiveEmail: 'Didn\'t receive the email?',
    authTryAgain: 'Try again',
    authConnecting: 'Connecting...',
    authLoggingIn: 'Signing in...',
    authCreatingAccount: 'Creating account...',
    authSending: 'Sending...'
  }
}

export default {
  getCurrentLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || LANGUAGES.ES
  },

  setLanguage(language) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language)
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language, translations: translations[language] } 
    }))
  },

  getTranslations(language = null) {
    const lang = language || this.getCurrentLanguage()
    return translations[lang] || translations[LANGUAGES.ES]
  },

  translate(key, language = null) {
    const t = this.getTranslations(language)
    return t[key] || key
  },

  init() {
    const language = this.getCurrentLanguage()
    // Dispatch initial language event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language, translations: translations[language] } 
    }))
    return language
  }
}