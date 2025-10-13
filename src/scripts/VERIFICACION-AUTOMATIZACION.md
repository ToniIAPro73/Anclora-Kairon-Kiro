# 🚀 Verificación del Sistema de Automatización

## Problema Reportado
"He abierto un terminal pero no se ha ejecutado el script de automatización."

## ✅ Solución - Configuración Manual Requerida

Los scripts de auto-setup **NO se ejecutan automáticamente** al abrir un terminal. Requieren configuración manual en tu perfil de terminal.

---

## 🔧 Guía de Configuración Paso a Paso

### Para PowerShell (Recomendado)

1. **Abrir PowerShell como Administrador**
2. **Editar perfil de PowerShell**:
   ```powershell
   notepad $PROFILE
   ```

3. **Añadir esta línea al final del archivo**:
   ```powershell
   # Anclora Kairon Auto-Setup
   if (Test-Path "src\scripts\init-terminal.ps1") {
       & "src\scripts\init-terminal.ps1"
   }
   ```

4. **Guardar y cerrar**

### Para CMD

1. **Crear acceso directo al CMD**
2. **Propiedades del acceso directo**
3. **En "Destino" añadir**:
   ```
   C:\Windows\System32\cmd.exe /k "src\scripts\init-terminal.bat"
   ```

### Para VS Code Terminal

1. **Archivo > Preferencias > Configuración**
2. **Buscar**: "terminal integrated shell args"
3. **Añadir configuración**:
   ```json
   {
     "terminal.integrated.shellArgs.windows": [
       "-NoExit",
       "-Command",
       "& 'src\\scripts\\init-terminal.ps1'"
     ]
   }
   ```

---

## 🧪 Verificación del Funcionamiento

### Método 1: Probar Scripts Manualmente

```bash
# Desde el directorio raíz del proyecto
npm run setup          # ✅ Debe mostrar verificación
npm run check-ports    # ✅ Debe mostrar puertos
npm run kill-ports     # ✅ Debe matar procesos si los hay
```

### Método 2: Ejecutar Script Directamente

```bash
# PowerShell
& "src\scripts\init-terminal.ps1"

# CMD (desde el directorio del proyecto)
src\scripts\init-terminal.bat

# Node.js directo
node src/scripts/dev-setup.js
```

### Método 3: Verificación Visual

**Deberías ver algo como**:
```
🚀 Anclora Kairon Development Setup
=====================================

🔍 Checking virtual environment...
✅ Node.js version: v20.x.x
✅ Project structure verified

🔍 Checking port availability...
✅ Port 5174 (landing) is available
✅ Port 5175 (app) is available

🎯 Ready for development!
📖 Check PUERTOS.md for port configuration
```

---

## 🚨 Troubleshooting

### Si no ves salida:

1. **Verificar ubicación**:
   ```bash
   pwd  # Debes estar en el directorio raíz del proyecto
   ls src/scripts/  # Deben existir los archivos
   ```

2. **Probar permisos**:
   ```bash
   node --version  # ✅ Debe funcionar
   npm --version   # ✅ Debe funcionar
   ```

3. **Ejecutar diagnóstico**:
   ```bash
   node src/scripts/dev-setup.js
   ```

### Si hay errores:

1. **Puerto ocupado**:
   ```bash
   npm run kill-ports
   npm run dev:landing
   ```

2. **Node.js no encontrado**:
   - Instalar Node.js desde https://nodejs.org/
   - Reiniciar terminal después de instalación

---

## ✅ Verificación Final

### Después de configurar el perfil:

1. **Cerrar todas las terminales**
2. **Abrir nueva terminal** en el directorio del proyecto
3. **Deberías ver automáticamente**:
   - Verificación de Node.js
   - Chequeo de puertos
   - Mensaje de "Ready for development"

### Si funciona correctamente:

- ✅ **Auto-setup ejecutándose** al abrir terminal
- ✅ **Puertos verificados** automáticamente
- ✅ **Procesos antiguos eliminados** si es necesario
- ✅ **Comandos sugeridos** mostrados

---

## 🎯 Comandos Útiles para Desarrollo Diario

```bash
# Desarrollo normal (con verificación automática)
npm run dev:landing      # Puerto 5174

# Si hay problemas
npm run check-ports      # Diagnosticar
npm run kill-ports       # Limpiar procesos
npm run dev:clean        # Inicio completamente limpio

# Ver configuración
cat PUERTOS.md           # Ver configuración de puertos
cat src/scripts/README.md # Ver documentación de scripts
```

---

## 📞 Si el problema persiste:

1. **Ejecuta manualmente**:
   ```bash
   node src/scripts/dev-setup.js
   ```

2. **Verifica que estés en el directorio correcto**:
   ```bash
   dir  # Debe mostrar package.json, PUERTOS.md
   ```

3. **Comprueba que los archivos existen**:
   ```bash
   test -f src/scripts/dev-setup.js  # Debe retornar verdadero
   ```

**¿Puedes ejecutar `node src/scripts/dev-setup.js` y decirme qué muestra?**