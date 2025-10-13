# 📚 Referencia de Códigos de Error - Sistema de Autenticación

## 📋 Índice

1. [Códigos de Error de Conectividad](#códigos-de-error-de-conectividad)
2. [Códigos de Error de Autenticación](#códigos-de-error-de-autenticación)
3. [Códigos de Error del Servidor](#códigos-de-error-del-servidor)
4. [Códigos de Error del Cliente](#códigos-de-error-del-cliente)
5. [Mensajes Localizados](#mensajes-localizados)
6. [Códigos de Respuesta HTTP](#códigos-de-respuesta-http)
7. [Guía de Implementación](#guía-de-implementación)

## 🌐 Códigos de Error de Conectividad

### NETWORK_ERROR
**Código**: `NETWORK_ERROR`  
**Severidad**: `ERROR`  
**Categoría**: Conectividad

**Descripción**: Error general de conectividad de red

**Causas Comunes**:
- Sin conexión a internet
- Problemas de DNS
- Firewall bloqueando conexiones
- Proxy mal configurado

**Mensajes**:
- **ES**: "No se pudo conectar al servidor. Verifica tu conexión a internet."
- **EN**: "Could not connect to server. Check your internet connection."

**Acciones de Recuperación**:
- Reintento automático con backoff exponencial
- Verificación de conectividad
- Mostrar indicador de estado offline

---

### SUPABASE_UNAVAILABLE
**Código**: `SUPABASE_UNAVAILABLE`  
**Severidad**: `ERROR`  
**Categoría**: Conectividad

**Descripción**: Servicio de Supabase no disponible

**Causas Comunes**:
- Mantenimiento de Supabase
- Sobrecarga del servidor
- Problemas en la región de Supabase
- Límites de uso excedidos

**Mensajes**:
- **ES**: "El servicio de autenticación no está disponible temporalmente. Inténtalo de nuevo en unos momentos."
- **EN**: "Authentication service is temporarily unavailable. Please try again in a few moments."

**Acciones de Recuperación**:
- Reintento automático después de 30 segundos
- Verificación de estado de Supabase
- Mostrar enlace a página de estado

---

### TIMEOUT_ERROR
**Código**: `TIMEOUT_ERROR`  
**Severidad**: `WARN`  
**Categoría**: Conectividad

**Descripción**: Timeout en la conexión con Supabase

**Causas Comunes**:
- Conexión lenta
- Sobrecarga del servidor
- Problemas de latencia de red

**Mensajes**:
- **ES**: "La conexión tardó demasiado tiempo. Inténtalo de nuevo."
- **EN**: "Connection timed out. Please try again."

**Acciones de Recuperación**:
- Reintento inmediato (1 vez)
- Mostrar indicador de conexión lenta
- Sugerir verificar conectividad

---

### CORS_ERROR
**Código**: `CORS_ERROR`  
**Severidad**: `ERROR`  
**Categoría**: Conectividad

**Descripción**: Error de política CORS

**Causas Comunes**:
- Dominio no configurado en Supabase
- Protocolo incorrecto (http vs https)
- Puerto no autorizado

**Mensajes**:
- **ES**: "Error de configuración de seguridad. Contacta al administrador."
- **EN**: "Security configuration error. Please contact administrator."

**Acciones de Recuperación**:
- No hay reintento automático
- Mostrar información de contacto
- Registrar error para administrador

## 🔐 Códigos de Error de Autenticación

### AUTH_INVALID_CREDENTIALS
**Código**: `AUTH_INVALID_CREDENTIALS`  
**Severidad**: `WARN`  
**Categoría**: Autenticación

**Descripción**: Credenciales de login incorrectas

**Causas Comunes**:
- Contraseña incorrecta
- Email incorrecto
- Cuenta desactivada

**Mensajes**:
- **ES**: "Email o contraseña incorrectos. Inténtalo de nuevo."
- **EN**: "Invalid email or password. Please try again."

**Acciones de Recuperación**:
- Permitir reintento inmediato
- Mostrar opción "¿Olvidaste tu contraseña?"
- Incrementar contador de intentos

---

### AUTH_USER_NOT_FOUND
**Código**: `AUTH_USER_NOT_FOUND`  
**Severidad**: `INFO`  
**Categoría**: Autenticación

**Descripción**: Usuario no existe en el sistema

**Causas Comunes**:
- Email no registrado
- Cuenta eliminada
- Error tipográfico en email

**Mensajes**:
- **ES**: "No encontramos una cuenta con este email. ¿Quieres registrarte?"
- **EN**: "No account found with this email. Would you like to sign up?"

**Acciones de Recuperación**:
- Mostrar botón "Registrarse"
- Sugerir verificar ortografía del email
- Permitir cambio a modo registro

---

### AUTH_USER_EXISTS
**Código**: `AUTH_USER_EXISTS`  
**Severidad**: `INFO`  
**Categoría**: Autenticación

**Descripción**: Usuario ya existe durante registro

**Causas Comunes**:
- Intento de registro con email existente
- Usuario olvidó que ya tiene cuenta

**Mensajes**:
- **ES**: "Ya existe una cuenta con este email. ¿Quieres iniciar sesión?"
- **EN**: "An account with this email already exists. Would you like to sign in?"

**Acciones de Recuperación**:
- Mostrar botón "Iniciar Sesión"
- Cambiar automáticamente a modo login
- Prellenar email en formulario de login

---

### AUTH_WEAK_PASSWORD
**Código**: `AUTH_WEAK_PASSWORD`  
**Severidad**: `WARN`  
**Categoría**: Autenticación

**Descripción**: Contraseña no cumple requisitos de seguridad

**Causas Comunes**:
- Contraseña muy corta (< 6 caracteres)
- Contraseña muy simple
- No cumple políticas de seguridad

**Mensajes**:
- **ES**: "La contraseña debe tener al menos 6 caracteres y ser segura."
- **EN**: "Password must be at least 6 characters long and secure."

**Acciones de Recuperación**:
- Mostrar requisitos de contraseña
- Indicador de fortaleza en tiempo real
- Sugerencias para mejorar contraseña

---

### AUTH_EMAIL_NOT_CONFIRMED
**Código**: `AUTH_EMAIL_NOT_CONFIRMED`  
**Severidad**: `WARN`  
**Categoría**: Autenticación

**Descripción**: Email no ha sido confirmado

**Causas Comunes**:
- Usuario no revisó su email
- Email de confirmación en spam
- Enlace de confirmación expirado

**Mensajes**:
- **ES**: "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada."
- **EN**: "You must confirm your email before signing in. Check your inbox."

**Acciones de Recuperación**:
- Botón "Reenviar confirmación"
- Instrucciones para revisar spam
- Opción de cambiar email

---

### AUTH_RATE_LIMITED
**Código**: `AUTH_RATE_LIMITED`  
**Severidad**: `WARN`  
**Categoría**: Autenticación

**Descripción**: Demasiados intentos de autenticación

**Causas Comunes**:
- Múltiples intentos fallidos
- Posible ataque de fuerza bruta
- Usuario olvidó credenciales

**Mensajes**:
- **ES**: "Demasiados intentos. Espera {tiempo} antes de intentar nuevamente."
- **EN**: "Too many attempts. Please wait {time} before trying again."

**Acciones de Recuperación**:
- Mostrar contador de tiempo restante
- Deshabilitar formulario temporalmente
- Sugerir recuperación de contraseña

---

### AUTH_SESSION_EXPIRED
**Código**: `AUTH_SESSION_EXPIRED`  
**Severidad**: `INFO`  
**Categoría**: Autenticación

**Descripción**: Sesión de usuario expirada

**Causas Comunes**:
- Token JWT expirado
- Inactividad prolongada
- Cambio de contraseña en otro dispositivo

**Mensajes**:
- **ES**: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
- **EN**: "Your session has expired. Please sign in again."

**Acciones de Recuperación**:
- Redirigir a página de login
- Mantener URL de destino original
- Limpiar datos de sesión local

## 🖥️ Códigos de Error del Servidor

### SERVER_ERROR
**Código**: `SERVER_ERROR`  
**Severidad**: `ERROR`  
**Categoría**: Servidor

**Descripción**: Error interno del servidor

**Causas Comunes**:
- Error 500 de Supabase
- Problemas de base de datos
- Sobrecarga del servidor

**Mensajes**:
- **ES**: "Error del servidor. Inténtalo de nuevo en unos momentos."
- **EN**: "Server error. Please try again in a few moments."

**Acciones de Recuperación**:
- Reintento automático después de 5 segundos
- Máximo 3 reintentos
- Registrar error para análisis

---

### DATABASE_ERROR
**Código**: `DATABASE_ERROR`  
**Severidad**: `ERROR`  
**Categoría**: Servidor

**Descripción**: Error en la base de datos

**Causas Comunes**:
- Problemas de conectividad con PostgreSQL
- Violación de restricciones
- Problemas de RLS (Row Level Security)

**Mensajes**:
- **ES**: "Error en la base de datos. El equipo técnico ha sido notificado."
- **EN**: "Database error. Technical team has been notified."

**Acciones de Recuperación**:
- No reintento automático
- Registrar error con alta prioridad
- Mostrar información de contacto

---

### SERVICE_UNAVAILABLE
**Código**: `SERVICE_UNAVAILABLE`  
**Severidad**: `ERROR`  
**Categoría**: Servidor

**Descripción**: Servicio temporalmente no disponible

**Causas Comunes**:
- Mantenimiento programado
- Sobrecarga del sistema
- Problemas de infraestructura

**Mensajes**:
- **ES**: "Servicio temporalmente no disponible. Inténtalo más tarde."
- **EN**: "Service temporarily unavailable. Please try again later."

**Acciones de Recuperación**:
- Reintento después de 1 minuto
- Mostrar página de estado del servicio
- Notificar tiempo estimado de recuperación

## 💻 Códigos de Error del Cliente

### VALIDATION_ERROR
**Código**: `VALIDATION_ERROR`  
**Severidad**: `WARN`  
**Categoría**: Cliente

**Descripción**: Error de validación en el cliente

**Causas Comunes**:
- Formato de email inválido
- Campos requeridos vacíos
- Datos fuera de rango

**Mensajes**:
- **ES**: "Por favor, corrige los errores en el formulario."
- **EN**: "Please correct the errors in the form."

**Acciones de Recuperación**:
- Resaltar campos con errores
- Mostrar mensajes específicos por campo
- Permitir corrección inmediata

---

### BROWSER_NOT_SUPPORTED
**Código**: `BROWSER_NOT_SUPPORTED`  
**Severidad**: `WARN`  
**Categoría**: Cliente

**Descripción**: Navegador no soportado

**Causas Comunes**:
- Navegador muy antiguo
- JavaScript deshabilitado
- Funcionalidades no disponibles

**Mensajes**:
- **ES**: "Tu navegador no es compatible. Actualiza a una versión más reciente."
- **EN**: "Your browser is not supported. Please update to a newer version."

**Acciones de Recuperación**:
- Mostrar lista de navegadores compatibles
- Proporcionar enlaces de descarga
- Funcionalidad limitada si es posible

---

### STORAGE_ERROR
**Código**: `STORAGE_ERROR`  
**Severidad**: `WARN`  
**Categoría**: Cliente

**Descripción**: Error de almacenamiento local

**Causas Comunes**:
- LocalStorage lleno
- Modo privado/incógnito
- Permisos de almacenamiento denegados

**Mensajes**:
- **ES**: "No se pueden guardar datos localmente. Algunas funciones pueden no funcionar."
- **EN**: "Cannot save data locally. Some features may not work properly."

**Acciones de Recuperación**:
- Funcionar sin almacenamiento local
- Advertir sobre limitaciones
- Sugerir salir del modo incógnito

## 🌍 Mensajes Localizados

### Estructura de Mensajes

```javascript
const errorMessages = {
  es: {
    NETWORK_ERROR: "No se pudo conectar al servidor. Verifica tu conexión a internet.",
    AUTH_INVALID_CREDENTIALS: "Email o contraseña incorrectos. Inténtalo de nuevo.",
    // ... más mensajes
  },
  en: {
    NETWORK_ERROR: "Could not connect to server. Check your internet connection.",
    AUTH_INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
    // ... más mensajes
  }
};
```

### Mensajes con Parámetros

```javascript
// Ejemplo con tiempo de espera
const message = errorMessages[lang].AUTH_RATE_LIMITED
  .replace('{tiempo}', formatTime(waitTime));

// Ejemplo con contador
const message = errorMessages[lang].RETRY_ATTEMPT
  .replace('{current}', currentAttempt)
  .replace('{max}', maxAttempts);
```

### Mensajes de Acción

```javascript
const actionMessages = {
  es: {
    RETRY: "Reintentar",
    CANCEL: "Cancelar",
    CONTACT_SUPPORT: "Contactar Soporte",
    TRY_AGAIN_LATER: "Intentar Más Tarde",
    FORGOT_PASSWORD: "¿Olvidaste tu contraseña?",
    SIGN_UP: "Registrarse",
    SIGN_IN: "Iniciar Sesión"
  },
  en: {
    RETRY: "Retry",
    CANCEL: "Cancel",
    CONTACT_SUPPORT: "Contact Support",
    TRY_AGAIN_LATER: "Try Again Later",
    FORGOT_PASSWORD: "Forgot Password?",
    SIGN_UP: "Sign Up",
    SIGN_IN: "Sign In"
  }
};
```

## 🔢 Códigos de Respuesta HTTP

### Mapeo de Códigos HTTP a Errores

| HTTP Code | Error Code | Descripción |
|-----------|------------|-------------|
| 400 | VALIDATION_ERROR | Solicitud malformada |
| 401 | AUTH_INVALID_CREDENTIALS | No autorizado |
| 403 | AUTH_FORBIDDEN | Acceso denegado |
| 404 | AUTH_USER_NOT_FOUND | Usuario no encontrado |
| 409 | AUTH_USER_EXISTS | Usuario ya existe |
| 422 | AUTH_WEAK_PASSWORD | Datos no procesables |
| 429 | AUTH_RATE_LIMITED | Demasiadas solicitudes |
| 500 | SERVER_ERROR | Error interno del servidor |
| 502 | SUPABASE_UNAVAILABLE | Bad Gateway |
| 503 | SERVICE_UNAVAILABLE | Servicio no disponible |
| 504 | TIMEOUT_ERROR | Gateway Timeout |

### Manejo de Códigos Específicos

```javascript
function mapHttpErrorToCode(httpStatus, response) {
  switch (httpStatus) {
    case 400:
      return response.message?.includes('password') 
        ? 'AUTH_WEAK_PASSWORD' 
        : 'VALIDATION_ERROR';
    
    case 401:
      return 'AUTH_INVALID_CREDENTIALS';
    
    case 404:
      return 'AUTH_USER_NOT_FOUND';
    
    case 409:
      return 'AUTH_USER_EXISTS';
    
    case 429:
      return 'AUTH_RATE_LIMITED';
    
    case 500:
    case 502:
    case 503:
      return 'SERVER_ERROR';
    
    case 504:
      return 'TIMEOUT_ERROR';
    
    default:
      return 'UNKNOWN_ERROR';
  }
}
```

## 🛠️ Guía de Implementación

### Uso en Componentes

```javascript
// Ejemplo de uso en AuthService
class AuthService {
  async login(email, password) {
    try {
      const result = await supabase.auth.signInWithPassword({
        email, password
      });
      
      if (result.error) {
        const errorCode = this.mapSupabaseError(result.error);
        throw new AuthError(errorCode, result.error.message);
      }
      
      return result;
    } catch (error) {
      const errorCode = this.classifyError(error);
      this.errorLogger.logError(error, { operation: 'login' });
      throw new AuthError(errorCode, error.message);
    }
  }
}
```

### Manejo en UI

```javascript
// Ejemplo de manejo en componente de UI
class AuthModal {
  async handleLogin(email, password) {
    try {
      this.showLoading('Iniciando sesión...');
      await this.authService.login(email, password);
      this.showSuccess('¡Bienvenido!');
    } catch (error) {
      this.hideLoading();
      
      const message = this.getLocalizedMessage(error.code);
      const canRetry = this.canRetryError(error.code);
      
      this.showError(message, { 
        canRetry,
        onRetry: () => this.handleLogin(email, password)
      });
    }
  }
}
```

### Logging de Errores

```javascript
// Estructura de log recomendada
const errorLog = {
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  code: errorCode,
  message: error.message,
  operation: 'login',
  context: {
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: user?.id || null,
    attemptCount: this.attemptCount
  },
  stack: error.stack
};
```

---

## 📝 Notas de Implementación

1. **Consistencia**: Todos los códigos de error deben seguir el formato `CATEGORY_SPECIFIC_ERROR`
2. **Localización**: Siempre proporcionar mensajes en español e inglés
3. **Logging**: Registrar todos los errores con contexto suficiente para diagnóstico
4. **Recuperación**: Cada error debe tener una estrategia de recuperación clara
5. **Testing**: Todos los códigos de error deben ser probados en el suite de pruebas

## 🔄 Versionado

- **Versión**: 1.0.0
- **Última actualización**: Enero 2024
- **Próxima revisión**: Marzo 2024

Para sugerencias de nuevos códigos de error o mejoras, contacta al equipo de desarrollo.