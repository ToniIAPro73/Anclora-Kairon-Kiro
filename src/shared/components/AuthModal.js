import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm.js';
import RegisterForm from './RegisterForm.js';
import ForgotPasswordForm from './ForgotPasswordForm.js';

const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setActiveTab('login');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showForgotPassword ? (
          <ForgotPasswordForm onBack={handleBackToLogin} />
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'login'
                    ? 'text-[#2EAFC4] border-b-2 border-[#2EAFC4] bg-gradient-to-r from-[#2EAFC4]/5 to-transparent'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Iniciar Sesión
              </button>
              <button
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'register'
                    ? 'text-[#2EAFC4] border-b-2 border-[#2EAFC4] bg-gradient-to-l from-[#2EAFC4]/5 to-transparent'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('register')}
              >
                Registrarse
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'login' ? (
                <LoginForm onForgotPassword={handleForgotPassword} />
              ) : (
                <RegisterForm />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;