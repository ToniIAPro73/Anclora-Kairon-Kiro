import './style.css'
import '../shared/styles/anclora-design-system.css'
import { authService } from '../shared/services/authService.js'
import AuthModalVanilla from '../shared/components/AuthModalVanilla.js'

// App entry point
console.log('Anclora Kairon App loaded')

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('App DOM loaded')

  const appRoot = document.getElementById('app-root')

  // Wait for auth service to initialize before checking authentication
  await authService.waitForAuthInitialization()

  // Check if we should redirect to app (from OAuth callback)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('app') === 'true') {
    // Redirect to app if authenticated
    if (authService.isAuthenticated()) {
      window.location.href = '/src/app/';
      return;
    }
  }

  // Check authentication status
  const isAuthenticated = authService.isAuthenticated()
  
  if (!isAuthenticated) {
    // Show login interface if not authenticated
    appRoot.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 400px;
          width: 100%;
          margin: 1rem;
        ">
          <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">
            🔐 Acceso Requerido
          </h1>
          <p style="color: #6b7280; margin-bottom: 2rem;">
            Necesitas iniciar sesión para acceder a la aplicación
          </p>
          <button id="login-btn" style="
            background: #0ea5e9;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            margin-bottom: 1rem;
          ">
            🔑 Iniciar Sesión
          </button>
          <a href="../landing/index.html" style="
            color: #0ea5e9;
            text-decoration: none;
            font-size: 0.875rem;
          ">
            ← Volver al Landing
          </a>
        </div>
      </div>
    `
    
    // Setup login modal
    const authModal = new AuthModalVanilla()
    const loginBtn = document.getElementById('login-btn')
    
    loginBtn.addEventListener('click', () => {
      authModal.open('login')
    })
    
    // Listen for successful authentication
    window.addEventListener('storage', (e) => {
      if (e.key === 'supabase.auth.token') {
        setTimeout(() => {
          if (authService.isAuthenticated()) {
            location.reload() // Reload to show the app
          }
        }, 500)
      }
    })
    
  } else {
    // Show main app interface
    const currentUser = authService.getCurrentUser()
    appRoot.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          margin: 0 auto;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h1 style="font-size: 2rem; font-weight: bold; color: #1f2937;">
              🚀 Anclora Kairon Dashboard
            </h1>
            <button id="logout-btn" style="
              background: #ef4444;
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              border: none;
              font-size: 0.875rem;
              cursor: pointer;
            ">
              🚪 Cerrar Sesión
            </button>
          </div>
          
          <div style="
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
          ">
            <h2 style="color: #065f46; font-weight: 600; margin-bottom: 0.5rem;">
              ✅ Bienvenido, ${currentUser?.user_metadata?.name || currentUser?.email}!
            </h2>
            <p style="color: #047857; font-size: 0.875rem;">
              Has iniciado sesión correctamente. El dashboard principal estará disponible pronto.
            </p>
          </div>
          
          <div style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
          ">
            <h3 style="font-weight: 600; margin-bottom: 1rem; color: #1e293b;">
              📊 Información de Usuario
            </h3>
            <div style="font-size: 0.875rem; color: #475569; line-height: 1.6;">
              <p><strong>Email:</strong> ${currentUser?.email}</p>
              <p><strong>ID:</strong> ${currentUser?.id}</p>
              <p><strong>Última conexión:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Setup logout
    const logoutBtn = document.getElementById('logout-btn')
    logoutBtn.addEventListener('click', async () => {
      try {
        await authService.logout()
        // Logout redirects to landing automatically
      } catch (error) {
        console.error('Error logout:', error)
        alert('Error cerrando sesión')
      }
    })
  }
})