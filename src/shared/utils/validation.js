/**
 * Validates email format using a comprehensive regex pattern
 * @param {string} email - Email to validate
 * @param {string} language - Language for error messages ('es' or 'en')
 * @returns {object} - Object with isValid boolean and message string
 */
export const validateEmail = (email, language = 'es') => {
  const messages = {
    es: {
      required: 'El email es requerido',
      invalid: 'Por favor ingresa un email válido',
      format: 'El formato del email no es válido (ejemplo: usuario@dominio.com)',
      valid: 'Email válido'
    },
    en: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address',
      format: 'Email format is invalid (example: user@domain.com)',
      valid: 'Email is valid'
    }
  };

  const msg = messages[language] || messages.es;

  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      message: msg.required
    };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      message: msg.required
    };
  }

  // Enhanced email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      message: msg.format
    };
  }

  return {
    isValid: true,
    message: msg.valid
  };
};

/**
 * Simple email validation that returns boolean (for backward compatibility)
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
  const result = validateEmail(email);
  return result.isValid;
};

/**
 * Validates password strength with enhanced requirements
 * @param {string} password - Password to validate
 * @param {string} language - Language for error messages ('es' or 'en')
 * @returns {object} - Object with isValid boolean, message string, and detailed requirements
 */
export const validatePassword = (password, language = 'es') => {
  const messages = {
    es: {
      required: 'La contraseña es requerida',
      minLength: 'La contraseña debe tener al menos 8 caracteres',
      lowercase: 'La contraseña debe incluir al menos una letra minúscula',
      uppercase: 'La contraseña debe incluir al menos una letra mayúscula',
      number: 'La contraseña debe incluir al menos un número',
      valid: 'Contraseña válida',
      comprehensive: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números'
    },
    en: {
      required: 'Password is required',
      minLength: 'Password must be at least 8 characters long',
      lowercase: 'Password must include at least one lowercase letter',
      uppercase: 'Password must include at least one uppercase letter',
      number: 'Password must include at least one number',
      valid: 'Password is valid',
      comprehensive: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers'
    }
  };

  const msg = messages[language] || messages.es;

  if (!password) {
    return {
      isValid: false,
      message: msg.required,
      requirements: {
        minLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false
      }
    };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password)
  };

  const isValid = Object.values(requirements).every(req => req);

  if (!isValid) {
    // Return comprehensive message for registration forms
    return {
      isValid: false,
      message: msg.comprehensive,
      requirements: requirements
    };
  }

  return {
    isValid: true,
    message: msg.valid,
    requirements: requirements
  };
};

/**
 * Validates name format
 * @param {string} name - Name to validate
 * @returns {boolean} - True if name is valid
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 50;
};

/**
 * Sanitizes input to prevent XSS attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates form data for registration with enhanced validation
 * @param {object} formData - Form data to validate
 * @param {string} language - Language for error messages ('es' or 'en')
 * @returns {object} - Object with isValid boolean and errors object
 */
export const validateRegistrationForm = (formData, language = 'es') => {
  const errors = {};
  const messages = {
    es: {
      nameLength: 'El nombre debe tener entre 2 y 50 caracteres',
      passwordMismatch: 'Las contraseñas no coinciden',
      confirmRequired: 'Debes confirmar tu contraseña'
    },
    en: {
      nameLength: 'Name must be between 2 and 50 characters',
      passwordMismatch: 'Passwords do not match',
      confirmRequired: 'You must confirm your password'
    }
  };

  const msg = messages[language] || messages.es;

  // Name validation
  if (!validateName(formData.name)) {
    errors.name = msg.nameLength;
  }

  // Email validation with enhanced messages
  const emailValidation = validateEmail(formData.email, language);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  // Password validation with enhanced requirements
  const passwordValidation = validatePassword(formData.password, language);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  // Confirm password validation
  if (!formData.confirmPassword || formData.confirmPassword.trim().length === 0) {
    errors.confirmPassword = msg.confirmRequired;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = msg.passwordMismatch;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    passwordRequirements: passwordValidation.requirements
  };
};

/**
 * Validates form data for login with enhanced validation
 * @param {object} formData - Form data to validate
 * @param {string} language - Language for error messages ('es' or 'en')
 * @returns {object} - Object with isValid boolean and errors object
 */
export const validateLoginForm = (formData, language = 'es') => {
  const errors = {};
  const messages = {
    es: {
      passwordRequired: 'La contraseña es requerida',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres'
    },
    en: {
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 6 characters long'
    }
  };

  const msg = messages[language] || messages.es;

  // Email validation with enhanced messages
  const emailValidation = validateEmail(formData.email, language);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  // Password validation for login (less strict than registration)
  if (!formData.password || typeof formData.password !== 'string') {
    errors.password = msg.passwordRequired;
  } else if (formData.password.length < 6) {
    errors.password = msg.passwordMinLength;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};