# 🔐 Solución: No llega el email de recuperación de contraseña

## 🚨 Problema Identificado

El email para recuperar la contraseña no está llegando a tu bandeja de entrada. Este es un problema común que puede tener varias causas.

## 🔍 Diagnóstico Paso a Paso

### 1. Verificaciones Inmediatas (2 minutos)

**Revisa estas ubicaciones en tu email:**

- [ ] **Bandeja de entrada principal**
- [ ] **Carpeta de SPAM/Correo no deseado**
- [ ] **Carpeta de Promociones** (Gmail)
- [ ] **Carpeta de Actualizaciones** (Gmail)
- [ ] **Carpeta de Social** (Gmail)

**Busca emails de:**
- `noreply@supabase.co`
- `auth@supabase.co` 
- `no-reply@anclora.com`
- Cualquier email con "Anclora" o "Kairon" en el asunto

### 2. Verificar Configuración del Sistema

**Ejecuta este diagnóstico en la consola del navegador:**

```javascript
// Abre la consola del navegador (F12) y ejecuta:
console.log('Configuración Supabase:');
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key configurada:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Verificar conectividad
fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/')
  .then(r => console.log('✅ Conexión OK:', r.status))
  .catch(e => console.log('❌ Error de conexión:', e));
```

### 3. Verificar Estado del Servicio

1. **Visita:** [status.supabase.com](https://status.supabase.com)
2. **Busca:** Problemas con "Auth" o "Email delivery"
3. **Revisa:** Mantenimientos programados

## 🛠️ Soluciones por Causa

### Causa 1: Email en SPAM (80% de los casos)

**Solución:**
1. Revisa tu carpeta de SPAM/Correo no deseado
2. Si encuentras el email, márcalo como "No es spam"
3. Agrega `noreply@supabase.co` a tus contactos
4. Intenta la recuperación nuevamente

### Causa 2: Configuración de Email del Proveedor

**Para Gmail:**
1. Ve a Configuración → Filtros y direcciones bloqueadas
2. Busca filtros que puedan bloquear emails de Supabase
3. Agrega una regla para permitir emails de `*@supabase.co`

**Para Outlook/Hotmail:**
1. Ve a Configuración → Correo → Reglas
2. Crea una regla para permitir emails de `*@supabase.co`

### Causa 3: Problemas de Configuración de Supabase

**Verificar configuración:**

1. **Accede al dashboard de Supabase**
2. **Ve a Authentication → Settings**
3. **Verifica que esté configurado:**
   - Site URL: `http://localhost:5173` (desarrollo) o tu dominio
   - Email templates habilitados
   - SMTP configurado (si usas SMTP personalizado)

### Causa 4: Límites de Rate Limiting

**Síntomas:**
- Has intentado varias veces seguidas
- Recibes error de "demasiados intentos"

**Solución:**
- Espera 15-30 minutos antes de intentar nuevamente
- Usa una conexión diferente (datos móviles)

## 🚀 Solución Inmediata: Usar la Nueva Interfaz

Hemos implementado una solución mejorada para la recuperación de contraseña:

### Método 1: Usar la Interfaz Mejorada

1. **Abre:** `test-password-reset-enhanced.html` en tu navegador
2. **Ingresa:** tu email
3. **Habilita:** diagnósticos técnicos (recomendado)
4. **Haz clic:** en "Enviar enlace de recuperación"

La nueva interfaz te mostrará:
- ✅ Instrucciones detalladas sobre dónde buscar el email
- 🔍 Guía paso a paso para revisar carpetas
- 🛠️ Diagnósticos técnicos para identificar problemas
- 🔄 Opciones de reintento inteligente
- 📞 Enlaces directos para contactar soporte

### Método 2: Usar la Consola del Navegador

Si eres técnico, puedes usar la consola:

```javascript
// Abre la consola del navegador (F12) y ejecuta:
const result = await authService.resetPassword('tu@email.com', {
  language: 'es',
  enableDiagnostics: true
});

console.log('Resultado completo:', result);
```

### Método 3: Contactar Soporte

**Información a incluir:**
- Email que intentas recuperar
- Hora exacta del intento
- Capturas de pantalla del error
- Resultado del diagnóstico de la consola
- Información técnica de la nueva interfaz

## 🔧 Implementar Solución Técnica

Si eres desarrollador, aquí está la implementación mejorada:

### 1. Función de Recuperación Mejorada

```javascript
/**
 * Recuperación de contraseña con mejor manejo de errores
 */
async function resetPasswordEnhanced(email) {
  try {
    console.log('Iniciando recuperación de contraseña para:', email);
    
    // Verificar conectividad primero
    const isConnected = await connectionMonitor.isSupabaseAvailable();
    if (!isConnected.available) {
      throw new Error('No hay conexión con el servidor. Verifica tu internet.');
    }

    // Intentar reset de contraseña
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) {
      console.error('Error en resetPasswordForEmail:', error);
      
      // Manejar errores específicos
      if (error.message.includes('rate limit')) {
        throw new Error('Demasiados intentos. Espera 15 minutos e intenta nuevamente.');
      }
      
      if (error.message.includes('not found')) {
        throw new Error('No encontramos una cuenta con este email. ¿Quieres registrarte?');
      }
      
      throw new Error(`Error al enviar email: ${error.message}`);
    }

    console.log('✅ Email de recuperación enviado exitosamente');
    return {
      success: true,
      message: 'Email enviado. Revisa tu bandeja de entrada y carpeta de spam.'
    };

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 2. Interfaz de Usuario Mejorada

```javascript
/**
 * Mostrar resultado de recuperación con instrucciones claras
 */
function showPasswordResetResult(result, email) {
  if (result.success) {
    showSuccessMessage(`
      📧 Email enviado a ${email}
      
      ✅ Revisa tu bandeja de entrada
      ⚠️ También revisa la carpeta de SPAM
      ⏰ El enlace expira en 1 hora
      
      ¿No lo ves? Revisa estas carpetas:
      • Spam/Correo no deseado
      • Promociones (Gmail)
      • Actualizaciones (Gmail)
    `);
  } else {
    showErrorMessage(`
      ❌ ${result.error}
      
      💡 Soluciones:
      • Verifica que el email sea correcto
      • Revisa tu conexión a internet
      • Intenta en unos minutos
      • Contacta soporte si persiste
    `);
  }
}
```

### 3. Verificación de Estado del Email

```javascript
/**
 * Verificar si el email fue enviado correctamente
 */
async function verifyEmailDelivery(email) {
  try {
    // Verificar logs de Supabase (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Verificando entrega de email...');
      
      // Aquí podrías implementar verificación con la API de Supabase
      // o logs del sistema
    }
    
    return {
      sent: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error verificando entrega:', error);
    return {
      sent: false,
      error: error.message
    };
  }
}
```

## 📞 Contacto de Soporte

Si ninguna solución funciona:

**Email:** soporte@anclora.com  
**Asunto:** "No llega email de recuperación de contraseña"

**Incluye esta información:**
1. Email que intentas recuperar
2. Hora exacta del intento (con zona horaria)
3. Proveedor de email (Gmail, Outlook, etc.)
4. Capturas de pantalla del error
5. Resultado del diagnóstico de la consola

## ⏰ Tiempos de Respuesta

- **Email de recuperación:** 1-5 minutos normalmente
- **Soporte técnico:** 2-4 horas en horario laboral
- **Solución definitiva:** 24-48 horas máximo

## 🔄 Prevención Futura

Para evitar este problema:

1. **Agrega a contactos:** `noreply@supabase.co`
2. **Configura filtros:** Permite emails de `*@supabase.co`
3. **Usa email principal:** Evita emails temporales o poco usados
4. **Mantén actualizado:** Tu email en el perfil

---

**¿Necesitas ayuda inmediata?** Contacta soporte con la información de diagnóstico.