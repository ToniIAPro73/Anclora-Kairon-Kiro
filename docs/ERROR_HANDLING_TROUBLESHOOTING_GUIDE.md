# 🔧 Guía de Solución de Problemas - Sistema de Manejo de Errores

## 📋 Índice

1. [Diagnóstico Rápido](#diagnóstico-rápido)
2. [Errores de Conectividad](#errores-de-conectividad)
3. [Errores de Autenticación](#errores-de-autenticación)
4. [Errores del Sistema](#errores-del-sistema)
5. [Herramientas de Diagnóstico](#herramientas-de-diagnóstico)
6. [Logs y Monitoreo](#logs-y-monitoreo)
7. [Contacto de Soporte](#contacto-de-soporte)

## 🚀 Diagnóstico Rápido

### Lista de Verificación Inicial

Antes de profundizar en problemas específicos, verifica:

- [ ] ¿Tienes conexión a internet?
- [ ] ¿Está funcionando [status.supabase.com](https://status.supabase.com)?
- [ ] ¿Estás usando HTTPS o un servidor local válido?
- [ ] ¿Las variables de entorno están configuradas correctamente?
- [ ] ¿Hay mensajes de error en la consola del navegador?

### Herramientas de Diagnóstico Rápido

```javascript
// Ejecuta en la consola del navegador para diagnóstico rápido
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Auth Service Status:', window.authService?.getSystemStatus());
console.log('Connection Status:', await window.connectionMonitor?.isSupabaseAvailable());
```

## 🌐 Errores de Conectividad

### NETWORK_ERROR - "No se pudo conectar al servidor"

**Síntomas:**
- Mensaje: "No se pudo conectar al servidor. Verifica tu conexión a internet."
- El botón de "Reintentar" aparece automáticamente
- Indicador de conectividad muestra "Desconectado"

**Soluciones:**

1. **Verificar Conexión a Internet**
   ```bash
   # Prueba de conectividad básica
   ping google.com
   ping supabase.com
   ```

2. **Verificar Estado de Supabase**
   - Visita [status.supabase.com](https://status.supabase.com)
   - Revisa si hay mantenimientos programados

3. **Verificar Configuración de Red**
   - Desactiva VPN temporalmente
   - Verifica configuración de proxy
   - Prueba desde otra red (datos móviles)

4. **Verificar CORS**
   ```javascript
   // En la consola del navegador
   fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/')
     .then(r => console.log('CORS OK:', r.status))
     .catch(e => console.log('CORS Error:', e));
   ```

### SUPABASE_UNAVAILABLE - "Servicio temporalmente no disponible"

**Síntomas:**
- Supabase responde con errores 5xx
- Timeouts frecuentes
- Servicios intermitentes

**Soluciones:**

1. **Verificar Estado del Proyecto**
   - Accede al dashboard de Supabase
   - Verifica que el proyecto esté activo
   - Revisa límites de uso

2. **Verificar Configuración**
   ```bash
   # Verifica variables de entorno
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

3. **Esperar y Reintentar**
   - El sistema reintenta automáticamente
   - Los intervalos aumentan: 1s, 2s, 4s
   - Máximo 3 reintentos automáticos

### TIMEOUT_ERROR - "La conexión tardó demasiado"

**Síntomas:**
- Operaciones que no completan
- Indicadores de carga que no desaparecen
- Timeouts después de 30 segundos

**Soluciones:**

1. **Verificar Latencia**
   ```javascript
   // Medir latencia a Supabase
   const latency = await window.connectionMonitor?.getConnectionLatency();
   console.log('Latencia:', latency, 'ms');
   ```

2. **Optimizar Conexión**
   - Cierra otras aplicaciones que usen internet
   - Usa conexión por cable en lugar de WiFi
   - Cambia de servidor DNS (8.8.8.8, 1.1.1.1)

## 🔐 Errores de Autenticación

### AUTH_INVALID_CREDENTIALS - "Email o contraseña incorrectos"

**Síntomas:**
- Mensaje claro sobre credenciales inválidas
- Formulario mantiene el email ingresado
- Opción de "¿Olvidaste tu contraseña?" disponible

**Soluciones:**

1. **Verificar Credenciales**
   - Revisa que el email esté escrito correctamente
   - Verifica que no haya espacios extra
   - Prueba escribir la contraseña en un editor de texto

2. **Resetear Contraseña**
   - Usa la opción "¿Olvidaste tu contraseña?"
   - Revisa tu bandeja de entrada y spam
   - Sigue el enlace de recuperación

3. **Verificar Estado de la Cuenta**
   ```javascript
   // Verificar si el usuario existe
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'usuario@ejemplo.com',
     password: 'contraseña_temporal'
   });
   ```

### AUTH_USER_NOT_FOUND - "No encontramos una cuenta con este email"

**Síntomas:**
- Mensaje específico sobre cuenta no encontrada
- Sugerencia de registrarse
- Botón para cambiar a modo registro

**Soluciones:**

1. **Verificar Email**
   - Revisa la ortografía del email
   - Verifica que sea el email correcto
   - Prueba con variaciones (gmail.com vs googlemail.com)

2. **Registrar Nueva Cuenta**
   - Usa el botón "Registrarse" 
   - Completa el proceso de registro
   - Confirma el email si es requerido

### AUTH_USER_EXISTS - "Ya existe una cuenta con este email"

**Síntomas:**
- Mensaje durante el registro
- Sugerencia de iniciar sesión
- Botón para cambiar a modo login

**Soluciones:**

1. **Cambiar a Login**
   - Usa el botón "Iniciar Sesión"
   - Ingresa tu contraseña
   - Usa "¿Olvidaste tu contraseña?" si es necesario

2. **Verificar Providers OAuth**
   - Prueba con Google OAuth si registraste con Google
   - Prueba con GitHub OAuth si registraste con GitHub

### AUTH_RATE_LIMITED - "Demasiados intentos"

**Síntomas:**
- Mensaje sobre límite de intentos
- Contador de tiempo de espera
- Botones deshabilitados temporalmente

**Soluciones:**

1. **Esperar el Tiempo Indicado**
   - El sistema muestra el tiempo restante
   - No cierres la página durante la espera
   - El contador se actualiza automáticamente

2. **Verificar Credenciales**
   - Mientras esperas, verifica tus credenciales
   - Prepara la información correcta
   - Considera usar recuperación de contraseña

## ⚙️ Errores del Sistema

### SERVER_ERROR - "Error del servidor"

**Síntomas:**
- Errores HTTP 500, 502, 503
- Mensaje genérico de error del servidor
- Reintentos automáticos activados

**Soluciones:**

1. **Esperar Reintentos Automáticos**
   - El sistema reintenta automáticamente
   - Intervalos: 1s, 2s, 4s
   - Máximo 3 intentos

2. **Verificar Estado de Supabase**
   - Revisa [status.supabase.com](https://status.supabase.com)
   - Verifica tu dashboard de Supabase
   - Revisa límites de uso del proyecto

3. **Reportar si Persiste**
   - Anota la hora exacta del error
   - Guarda el mensaje de error completo
   - Incluye pasos para reproducir

### DATABASE_ERROR - "Error en la base de datos"

**Síntomas:**
- Errores relacionados con consultas SQL
- Problemas de permisos (RLS)
- Datos no se guardan correctamente

**Soluciones:**

1. **Verificar Esquema de Base de Datos**
   ```sql
   -- Ejecutar en SQL Editor de Supabase
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Verificar Row Level Security**
   ```sql
   -- Verificar políticas RLS
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Re-ejecutar Schema**
   - Ejecuta `database/schema.sql` nuevamente
   - Verifica que no haya errores en la ejecución
   - Confirma que todas las tablas se crearon

## 🔍 Herramientas de Diagnóstico

### Dashboard de Monitoreo en Tiempo Real

Accede a `test-realtime-dashboard.html` para:

- **Métricas en Tiempo Real**: Errores, latencia, tasa de éxito
- **Gráficos de Tendencias**: Visualización de errores en el tiempo
- **Alertas Activas**: Notificaciones de problemas críticos
- **Estado de Conectividad**: Monitoreo continuo de Supabase

### Herramientas de Prueba

1. **test-performance-optimization.html**
   - Pruebas de rendimiento
   - Métricas de optimización
   - Análisis de carga

2. **test-error-simulation.html**
   - Simulación de errores de red
   - Pruebas de recuperación
   - Validación de manejo de errores

3. **test-connection-monitor.html**
   - Pruebas de conectividad
   - Monitoreo de latencia
   - Detección de problemas de red

### Comandos de Diagnóstico

```javascript
// Estado general del sistema
console.log(await window.authService.getSystemStatus());

// Estadísticas de errores
console.log(window.errorLogger.getErrorStats());

// Verificar conectividad
console.log(await window.connectionMonitor.isSupabaseAvailable());

// Métricas de rendimiento
console.log(window.performanceOptimizer.getMetrics());
```

## 📊 Logs y Monitoreo

### Acceso a Logs

1. **Consola del Navegador**
   ```javascript
   // Filtrar logs de autenticación
   console.log(window.errorLogger.getErrorStats());
   
   // Ver últimos errores
   console.log(window.errorLogger.getRecentErrors(10));
   ```

2. **Dashboard de Supabase**
   - Ve a tu proyecto → Logs
   - Filtra por "auth" para errores de autenticación
   - Revisa timestamps para correlacionar errores

### Interpretación de Logs

**Formato de Log Típico:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "operation": "login",
  "errorType": "AUTH_INVALID_CREDENTIALS",
  "message": "Invalid login credentials",
  "context": {
    "userAgent": "Mozilla/5.0...",
    "url": "https://app.anclora.com",
    "attemptCount": 2
  }
}
```

**Niveles de Severidad:**
- **ERROR**: Errores que impiden completar operaciones
- **WARN**: Advertencias que no bloquean funcionalidad
- **INFO**: Información general de operaciones
- **DEBUG**: Información detallada para desarrollo

### Métricas Importantes

1. **Tasa de Errores**
   - Normal: < 5%
   - Advertencia: 5-15%
   - Crítico: > 15%

2. **Latencia Promedio**
   - Excelente: < 500ms
   - Buena: 500ms - 2s
   - Lenta: > 2s

3. **Tasa de Recuperación**
   - Objetivo: > 90%
   - Mínimo aceptable: > 80%

## 📞 Contacto de Soporte

### Información a Incluir en Reportes

Cuando contactes soporte, incluye:

1. **Información del Error**
   - Mensaje de error exacto
   - Código de error (si aplica)
   - Hora exacta del incidente

2. **Información del Sistema**
   ```javascript
   // Ejecuta esto y incluye el resultado
   console.log({
     userAgent: navigator.userAgent,
     url: window.location.href,
     supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
     timestamp: new Date().toISOString(),
     systemStatus: await window.authService?.getSystemStatus()
   });
   ```

3. **Pasos para Reproducir**
   - Describe exactamente qué estabas haciendo
   - Incluye capturas de pantalla si es posible
   - Menciona si el error es consistente o intermitente

### Canales de Soporte

- **Email**: soporte@anclora.com
- **GitHub Issues**: Para reportes técnicos detallados
- **Dashboard de Monitoreo**: Para verificar estado del sistema

### Tiempos de Respuesta Esperados

- **Crítico** (sistema no funciona): 2-4 horas
- **Alto** (funcionalidad limitada): 4-8 horas  
- **Medio** (inconvenientes menores): 1-2 días
- **Bajo** (mejoras y sugerencias): 3-5 días

---

## 🔄 Actualizaciones de esta Guía

Esta guía se actualiza regularmente. Última actualización: Enero 2024

Para sugerencias de mejora a esta guía, contacta al equipo de desarrollo.