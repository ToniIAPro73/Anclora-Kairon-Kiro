/**
 * Validates email format using a comprehensive regex pattern
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Object with isValid boolean and message string
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: 'La contraseña es requerida'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 8 caracteres'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe incluir al menos una letra minúscula'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe incluir al menos una letra mayúscula'
    };
  }

  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe incluir al menos un número'
    };
  }

  return {
    isValid: true,
    message: 'Contraseña válida'
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
 * Validates form data for registration
 * @param {object} formData - Form data to validate
 * @returns {object} - Object with isValid boolean and errors object
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};

  if (!validateName(formData.name)) {
    errors.name = 'El nombre debe tener entre 2 y 50 caracteres';
  }

  if (!validateEmail(formData.email)) {
    errors.email = 'Ingresa un email válido';
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates form data for login
 * @param {object} formData - Form data to validate
 * @returns {object} - Object with isValid boolean and errors object
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!validateEmail(formData.email)) {
    errors.email = 'Ingresa un email válido';
  }

  if (!formData.password || formData.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};