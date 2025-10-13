# Development Scripts

Esta carpeta contiene scripts para automatizar el entorno de desarrollo de Anclora Kairon.

## 🚀 Inicio Rápido

### 1. Verificación Automática
```bash
# Desde el directorio raíz del proyecto
npm run setup
```

### 2. Desarrollo con Verificación Automática
```bash
# Landing page con verificación automática
npm run dev:landing

# Aplicación principal con verificación automática
npm run dev:app

# Ambos servicios con verificación automática
npm run dev
```

### 3. Inicio Limpio (Recomendado)
```bash
# Mata procesos antiguos y verifica entorno
npm run dev:clean       # Para landing page
npm run dev:landing:clean # Para aplicación principal
```

## 🔧 Scripts Disponibles

### Verificación y Setup
- **`npm run setup`** - Verifica entorno virtual y disponibilidad de puertos
- **`npm run check-ports`** - Verifica qué puertos están ocupados
- **`npm run kill-ports`** - Mata procesos en puertos del proyecto

### Desarrollo
- **`npm run dev:landing`** - Inicia landing page (puerto 5174)
- **`npm run dev:app`** - Inicia aplicación principal (puerto 5175)
- **`npm run dev`** - Inicia ambos servicios

### Desarrollo Limpio
- **`npm run dev:clean`** - Mata puertos + setup + dev (ambos)
- **`npm run dev:landing:clean`** - Mata puertos + setup + landing

## 📂 Archivos de Script

| Archivo | Descripción |
|---------|-------------|
| `dev-setup.js` | Script principal de verificación de entorno y puertos |
| `kill-ports.js` | Mata procesos específicos en puertos |
| `auto-setup.js` | Configuración automática (simplificada) |
| `init-terminal.ps1` | Inicialización automática para PowerShell |
| `init-terminal.bat` | Inicialización automática para CMD |
| `README.md` | Esta documentación |

## ⚙️ Configuración Automática

### PowerShell
Añade esto a tu perfil de PowerShell (`Microsoft.PowerShell_profile.ps1`):
```powershell
# Ejecutar cuando abras un terminal en el directorio del proyecto
& "src\scripts\init-terminal.ps1"
```

### CMD
Crea un acceso directo con el target:
```
cmd.exe /k "src\scripts\init-terminal.bat"
```

### VS Code
En configuración del terminal integrado:
```json
{
  "terminal.integrated.shellArgs.windows": [
    "-NoExit",
    "-Command",
    "& 'src\\scripts\\init-terminal.ps1'"
  ]
}
```

## 🔍 Funcionalidades

### Verificación de Entorno
- ✅ Estado de Node.js
- ✅ Entorno virtual (si aplica)
- ✅ Estructura del proyecto
- ✅ Disponibilidad de puertos

### Gestión de Puertos
- 🔍 Detección de procesos ocupando puertos
- 🛑 Terminación graceful de procesos
- 🔨 Force kill si es necesario
- ✅ Verificación post-limpieza

### Desarrollo Seguro
- 🚀 Inicio automático con verificación
- 🔄 Reinicio automático en cambios
- 📊 Logging detallado de acciones
- ❌ Manejo de errores con comandos alternativos

## 🚨 Solución de Problemas

### Puertos Ocupados
```bash
# Verificar qué hay corriendo
npm run check-ports

# Matar procesos específicos
npm run kill-ports

# Inicio limpio
npm run dev:clean
```

### Problemas de Entorno
```bash
# Verificación manual detallada
node src/scripts/dev-setup.js

# Solo matar puertos
node src/scripts/kill-ports.js --port 5174
```

### Logs y Debug
Los scripts proporcionan logging detallado:
- ✅ Operaciones exitosas
- ⚠️  Advertencias
- ❌ Errores con soluciones alternativas
- 🔍 Información de debugging

## 🎯 Flujo de Trabajo Recomendado

1. **Abrir terminal** → Auto-setup se ejecuta automáticamente
2. **Verificación** → Entorno y puertos verificados
3. **Desarrollo** → Usar `npm run dev:landing` o `npm run dev:app`
4. **Cambios** → Vite recarga automáticamente
5. **Problemas** → Usar `npm run dev:clean` para reinicio limpio

## 📞 Soporte

Si encuentras problemas:
1. Ejecuta `npm run check-ports` para diagnóstico
2. Usa `npm run kill-ports` para limpiar procesos
3. Intenta `npm run dev:clean` para inicio completamente limpio
4. Revisa los logs para identificar problemas específicos

---
*Estos scripts están diseñados para hacer el desarrollo más eficiente y evitar conflictos entre proyectos.*