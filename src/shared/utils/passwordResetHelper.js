/**
 * Password Reset Helper Utilities
 * Provides user-friendly interfaces for password recovery
 */

/**
 * Show password reset result with detailed instructions
 * @param {Object} result - Result from resetPassword function
 * @param {string} email - Email address used
 * @param {HTMLElement} container - Container to show the message
 */
export function showPasswordResetResult(result, email, container) {
  if (!container) {
    console.error('Container element required for showPasswordResetResult');
    return;
  }

  container.innerHTML = '';

  if (result.success) {
    container.innerHTML = `
      <div class="password-reset-success">
        <div class="success-icon">✅</div>
        <h3>Email enviado exitosamente</h3>
        <p class="email-sent">Se envió un enlace de recuperación a: <strong>${email}</strong></p>
        
        <div class="instructions">
          <h4>📧 Instrucciones importantes:</h4>
          <ul>
            ${result.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
          </ul>
        </div>

        <div class="next-steps">
          <h4>🔍 ¿No ves el email?</h4>
          <div class="troubleshooting-quick">
            <button onclick="checkEmailFolders('${email}')" class="btn-secondary">
              Guía: Dónde buscar el email
            </button>
            <button onclick="resendPasswordReset('${email}')" class="btn-outline">
              Reenviar email
            </button>
          </div>
        </div>

        ${result.diagnostics ? `
          <details class="diagnostics">
            <summary>🔧 Información técnica</summary>
            <pre>${JSON.stringify(result.diagnostics, null, 2)}</pre>
          </details>
        ` : ''}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="password-reset-error">
        <div class="error-icon">❌</div>
        <h3>No se pudo enviar el email</h3>
        <p class="error-message">${result.error.message}</p>
        
        <div class="troubleshooting">
          <h4>💡 Soluciones recomendadas:</h4>
          <ul>
            ${result.troubleshooting.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>

        <div class="action-buttons">
          <button onclick="retryPasswordReset('${email}')" class="btn-primary">
            Intentar nuevamente
          </button>
          <button onclick="contactSupport('${email}', '${result.error.type}')" class="btn-secondary">
            Contactar soporte
          </button>
        </div>

        ${result.diagnostics ? `
          <details class="diagnostics">
            <summary>🔧 Información para soporte</summary>
            <pre>${JSON.stringify(result.diagnostics, null, 2)}</pre>
          </details>
        ` : ''}
      </div>
    `;
  }
}
/*
*
 * Show email folder checking guide
 * @param {string} email - Email address
 */
export function checkEmailFolders(email) {
  const modal = document.createElement('div');
  modal.className = 'email-guide-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔍 Dónde buscar tu email de recuperación</h3>
        <button onclick="this.closest('.email-guide-modal').remove()" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <p>Email enviado a: <strong>${email}</strong></p>
        
        <div class="email-locations">
          <div class="location-item">
            <h4>📥 1. Bandeja de entrada principal</h4>
            <p>Busca un email de <code>noreply@supabase.co</code></p>
          </div>
          
          <div class="location-item priority">
            <h4>🚨 2. Carpeta de SPAM (MUY IMPORTANTE)</h4>
            <p>Esta es la causa más común. Revisa:</p>
            <ul>
              <li>Spam / Correo no deseado</li>
              <li>Correo basura</li>
              <li>Quarantine</li>
            </ul>
          </div>
          
          <div class="location-item">
            <h4>📂 3. Otras carpetas (Gmail)</h4>
            <ul>
              <li>Promociones</li>
              <li>Actualizaciones</li>
              <li>Social</li>
            </ul>
          </div>
          
          <div class="location-item">
            <h4>🔍 4. Buscar directamente</h4>
            <p>Busca en tu email: <code>Anclora</code> o <code>recuperación</code></p>
          </div>
        </div>
        
        <div class="prevention-tips">
          <h4>💡 Para evitar esto en el futuro:</h4>
          <ul>
            <li>Agrega <code>noreply@supabase.co</code> a tus contactos</li>
            <li>Marca como "No es spam" si lo encuentras en spam</li>
            <li>Configura filtros para permitir emails de Supabase</li>
          </ul>
        </div>
      </div>
      
      <div class="modal-footer">
        <button onclick="this.closest('.email-guide-modal').remove()" class="btn-primary">
          Entendido
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * Retry password reset
 * @param {string} email - Email address
 */
export async function retryPasswordReset(email) {
  try {
    // Import authService dynamically to avoid circular dependencies
    const { authService } = await import('../services/authService.js');
    
    const result = await authService.resetPassword(email, {
      language: 'es',
      enableDiagnostics: true
    });
    
    const container = document.querySelector('.password-reset-container') || 
                     document.querySelector('.auth-modal-content') ||
                     document.body;
    
    showPasswordResetResult(result, email, container);
    
  } catch (error) {
    console.error('Error retrying password reset:', error);
    alert('Error al reintentar. Contacta al soporte.');
  }
}

/**
 * Contact support with error details
 * @param {string} email - Email address
 * @param {string} errorType - Type of error
 */
export function contactSupport(email, errorType) {
  const subject = encodeURIComponent('No llega email de recuperación de contraseña');
  const body = encodeURIComponent(`
Hola,

No me está llegando el email para recuperar mi contraseña.

Detalles:
- Email: ${email}
- Tipo de error: ${errorType}
- Hora del intento: ${new Date().toLocaleString()}
- Navegador: ${navigator.userAgent}

He revisado:
- Bandeja de entrada principal
- Carpeta de spam
- Otras carpetas del email

Por favor, ayúdenme a resolver este problema.

Gracias.
  `);
  
  window.open(`mailto:soporte@anclora.com?subject=${subject}&body=${body}`);
}

/**
 * Resend password reset email
 * @param {string} email - Email address
 */
export async function resendPasswordReset(email) {
  // Wait 30 seconds before allowing resend to avoid rate limiting
  const lastSent = localStorage.getItem('last_password_reset');
  const now = Date.now();
  
  if (lastSent && (now - parseInt(lastSent)) < 30000) {
    const remaining = Math.ceil((30000 - (now - parseInt(lastSent))) / 1000);
    alert(`Espera ${remaining} segundos antes de reenviar el email.`);
    return;
  }
  
  localStorage.setItem('last_password_reset', now.toString());
  
  try {
    const { authService } = await import('../services/authService.js');
    
    const result = await authService.resetPassword(email, {
      language: 'es',
      enableDiagnostics: true
    });
    
    if (result.success) {
      alert('Email reenviado. Revisa tu bandeja de entrada y spam.');
    } else {
      alert(`Error al reenviar: ${result.error.message}`);
    }
    
  } catch (error) {
    console.error('Error resending password reset:', error);
    alert('Error al reenviar. Intenta más tarde.');
  }
}

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
  window.checkEmailFolders = checkEmailFolders;
  window.retryPasswordReset = retryPasswordReset;
  window.contactSupport = contactSupport;
  window.resendPasswordReset = resendPasswordReset;
}