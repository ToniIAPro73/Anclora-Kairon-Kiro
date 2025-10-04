import React, { useState } from 'react';
import { validateEmail } from '../utils/validation.js';
import { authService } from '../services/authService.js';

const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await authService.resetPassword(email);
      setIsSuccess(true);
    } catch (error) {
      setErrors({ general: error.message || 'Error al enviar el email de recuperación' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#162032] mb-2">¡Email enviado!</h2>
        <p className="text-gray-600 mb-6">
          Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
          Revisa tu bandeja de entrada y sigue las instrucciones.
        </p>
        <div className="space-y-3">
          <button
            onClick={onBack}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] text-[#162032] font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Volver al inicio de sesión
          </button>
          <p className="text-sm text-gray-500">
            ¿No recibiste el email?{' '}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-[#2EAFC4] hover:text-[#23436B] transition-colors"
            >
              Intentar de nuevo
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-[#162032] mb-2">Recuperar contraseña</h2>
        <p className="text-gray-600">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-transparent transition-colors ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] text-[#162032] font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-[#2EAFC4] hover:text-[#23436B] transition-colors"
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;