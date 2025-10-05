# Guía de Integración del Onboarding - Anclora Kairon

## 📋 Resumen

El sistema de onboarding de Anclora Kairon está diseñado para activarse automáticamente después del registro exitoso de un nuevo usuario, guiándolo a través de un proceso de configuración de 60 segundos.

## 🚀 Cómo Acceder al Onboarding

### 1. Activación Automática (Recomendado)

El onboarding se activa automáticamente cuando:
- Un usuario se registra exitosamente
- Es marcado como "nuevo usuario" en el sistema
- Accede a la aplicación por primera vez

```javascript
// En tu aplicación principal (app.js o main.js)
import { authService } from './src/shared/services/authService.js';
import { onboardingWizard } from './src/shared/components/OnboardingWizard.js';

// Verificar si mostrar onboarding al cargar la app
document.addEventListener('DOMContentLoaded', () => {
    if (authService.isAuthenticated() && authService.isNewUser()) {
        // Pequeño delay para mejor UX
        setTimeout(() => {
            onboardingWizard.open();
        }, 500);
    }
});
```

### 2. Activación Manual

También puedes abrir el onboarding manualmente:

```javascript
import { onboardingWizard } from './src/shared/components/OnboardingWizard.js';

// Abrir onboarding manualmente
onboardingWizard.open();
```

### 3. Integración con Modal de Autenticación

```javascript
// En el evento de registro exitoso
authModal.addEventListener('registerSuccess', (event) => {
    const user = event.detail.user;
    
    // Cerrar modal de auth
    authModal.close();
    
    // Abrir onboarding para usuarios nuevos
    if (authService.isNewUser()) {
        setTimeout(() => {
            onboardingWizard.open();
        }, 300);
    }
});
```

## 🔧 Configuración del Sistema

### AuthService - Métodos Relacionados

```javascript
// Verificar si el usuario es nuevo
authService.isNewUser() // returns boolean

// Marcar onboarding como completado
authService.completeOnboarding()

// Verificar si está autenticado
authService.isAuthenticated() // returns boolean
```

### Estados en localStorage

El sistema utiliza las siguientes claves en localStorage:

```javascript
// Usuario nuevo (se establece en registro)
localStorage.getItem('is_new_user') // 'true' | null

// Onboarding completado
localStorage.getItem('onboarding_completed') // 'true' | null

// Datos del onboarding
localStorage.getItem('user_onboarding_data') // JSON con preferencias

// Datos de ejemplo generados
localStorage.getItem('onboarding_sample_data') // JSON con proyecto y tareas
```

## 📱 Flujo Completo del Usuario

### 1. Registro
```
Usuario → Formulario Registro → AuthService.register() → is_new_user = true
```

### 2. Detección de Usuario Nuevo
```
App Load → authService.isNewUser() → true → onboardingWizard.open()
```

### 3. Proceso de Onboarding
```
Paso 1: Información básica (nombre, rol)
Paso 2: Selección de template de proyecto
Paso 3: Invitación de equipo (opcional)
Paso 4: Confirmación y generación de datos
```

### 4. Finalización
```
onboardingWizard.complete() → 
  - Genera datos de ejemplo
  - Marca onboarding como completado
  - Redirige al dashboard
```

## 🎨 Personalización

### Modificar Templates de Proyecto

```javascript
// En OnboardingWizard.js - método renderTemplateStep()
const templates = [
    {
        id: 'custom',
        name: 'Mi Template Personalizado',
        description: 'Descripción del template',
        icon: '🎯',
        color: 'from-blue-500 to-purple-600'
    }
    // ... otros templates
];
```

### Personalizar Datos de Ejemplo

```javascript
// En OnboardingWizard.js - método generateSampleData()
const templates = {
    custom: {
        project: 'Mi Proyecto Personalizado',
        tasks: [
            { title: 'Tarea personalizada', status: 'todo', priority: 'high' }
            // ... más tareas
        ]
    }
};
```

## 🧪 Testing

### Archivo de Prueba

Usa `test-onboarding-integration.html` para probar:

1. Abre el archivo en tu navegador
2. Haz clic en "Simular Registro"
3. El onboarding debería abrirse automáticamente
4. Completa el proceso para probar el flujo completo

### Comandos de Prueba en Consola

```javascript
// Simular usuario nuevo
localStorage.setItem('is_new_user', 'true');
onboardingWizard.open();

// Limpiar datos
localStorage.clear();

// Verificar estado
console.log('Nuevo usuario:', authService.isNewUser());
console.log('Onboarding completado:', localStorage.getItem('onboarding_completed'));
```

## 🔄 Eventos Personalizados

El onboarding emite eventos que puedes escuchar:

```javascript
// Onboarding completado
window.addEventListener('onboardingCompleted', (event) => {
    console.log('Onboarding finalizado:', event.detail);
    // Realizar acciones adicionales
});

// Paso cambiado
window.addEventListener('onboardingStepChanged', (event) => {
    console.log('Paso actual:', event.detail.step);
});
```

## 🚨 Consideraciones Importantes

1. **Orden de Carga**: Asegúrate de que los módulos se carguen en el orden correcto
2. **Dependencias**: El onboarding requiere el sistema i18n para traducciones
3. **Responsive**: El onboarding está optimizado para móviles
4. **Accesibilidad**: Incluye navegación por teclado y lectores de pantalla
5. **Performance**: Usa lazy loading si es necesario

## 📚 Archivos Relacionados

- `src/shared/components/OnboardingWizard.js` - Componente principal
- `src/shared/services/authService.js` - Servicio de autenticación
- `src/shared/utils/i18n.js` - Sistema de traducciones
- `test-onboarding-integration.html` - Archivo de prueba

## 🎯 Próximos Pasos

Para integrar completamente en tu aplicación:

1. Importa los módulos necesarios en tu app principal
2. Agrega la verificación de usuario nuevo al cargar la app
3. Conecta los eventos de registro con el onboarding
4. Personaliza templates y datos según tus necesidades
5. Prueba el flujo completo con usuarios reales

¡El onboarding está listo para usar! 🚀