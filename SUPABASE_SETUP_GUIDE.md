# 🚀 Guía de Configuración de Supabase - Anclora Kairon

## 📋 Pasos para Configurar Supabase Auth

### **Paso 1: Crear Proyecto en Supabase**

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Crea una cuenta o inicia sesión
4. Haz clic en "New Project"
5. Completa los datos:
   - **Name**: `anclora-kairon-mvp`
   - **Database Password**: (genera una segura)
   - **Region**: Elige la más cercana
6. Haz clic en "Create new project"

### **Paso 2: Obtener Credenciales**

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`

### **Paso 3: Configurar Variables de Entorno**

1. Crea un archivo `.env` en la raíz del proyecto:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Otros valores (opcional por ahora)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### **Paso 4: Crear Tablas de Base de Datos**

1. En Supabase, ve a **SQL Editor**
2. Copia y pega el contenido completo de `database/schema.sql`
3. Haz clic en "Run" para ejecutar el script
4. Verifica que las tablas se crearon en **Table Editor**

### **Paso 5: Configurar Autenticación**

1. Ve a **Authentication** → **Settings**
2. En **Site URL**, agrega: `http://localhost:5173`
3. En **Redirect URLs**, agrega:
   ```
   http://localhost:5173/auth/callback
   http://localhost:8000/auth/callback
   http://127.0.0.1:5500/auth/callback
   ```

### **Paso 6: Configurar OAuth (Opcional)**

#### Para Google OAuth:
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Ve a **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configura:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     ```
     https://tu-proyecto.supabase.co/auth/v1/callback
     ```
6. Copia el **Client ID** y **Client Secret**
7. En Supabase, ve a **Authentication** → **Providers** → **Google**
8. Habilita Google y pega las credenciales

#### Para GitHub OAuth:
1. Ve a GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Haz clic en **New OAuth App**
3. Configura:
   - **Application name**: Anclora Kairon MVP
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: 
     ```
     https://tu-proyecto.supabase.co/auth/v1/callback
     ```
4. Copia el **Client ID** y **Client Secret**
5. En Supabase, ve a **Authentication** → **Providers** → **GitHub**
6. Habilita GitHub y pega las credenciales

### **Paso 7: Instalar Dependencias**

```bash
npm install @supabase/supabase-js
```

### **Paso 8: Probar la Configuración**

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Abre `test-auth-modal.html` en tu navegador
3. Prueba el registro y login
4. Verifica que los usuarios aparecen en Supabase → **Authentication** → **Users**

## 🔧 Verificación de Configuración

### Checklist de Configuración:
- [ ] Proyecto de Supabase creado
- [ ] Variables de entorno configuradas en `.env`
- [ ] Tablas creadas con `schema.sql`
- [ ] Site URL y Redirect URLs configuradas
- [ ] OAuth providers configurados (opcional)
- [ ] Dependencias instaladas
- [ ] Servidor de desarrollo funcionando

### Comandos de Verificación:

```bash
# Verificar variables de entorno
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verificar instalación
npm list @supabase/supabase-js

# Iniciar servidor
npm run dev
```

## 🐛 Solución de Problemas

### Error: "Invalid API key"
- Verifica que `VITE_SUPABASE_ANON_KEY` esté correcta
- Asegúrate de que no tenga espacios extra

### Error: "Invalid URL"
- Verifica que `VITE_SUPABASE_URL` tenga el formato correcto
- Debe incluir `https://` al inicio

### Error: "CORS policy"
- Verifica que la Site URL esté configurada correctamente
- Asegúrate de usar un servidor HTTP (no file://)

### OAuth no funciona:
- Verifica que las Redirect URLs estén configuradas
- Asegúrate de que los providers estén habilitados
- Revisa que las credenciales OAuth sean correctas

### Tablas no existen:
- Ejecuta el script `schema.sql` completo
- Verifica que no haya errores en la consola SQL
- Revisa que RLS esté habilitado

## 📚 Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuración de OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Próximos Pasos

Una vez configurado Supabase:

1. **Probar autenticación**: Registro, login, logout
2. **Probar OAuth**: Google y GitHub login
3. **Verificar onboarding**: Debe activarse para usuarios nuevos
4. **Probar persistencia**: Los datos deben guardarse en Supabase

¡Con esta configuración tendrás un sistema de autenticación completo y funcional! 🚀