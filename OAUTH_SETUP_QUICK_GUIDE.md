# 🚀 Guía Rápida OAuth Setup - Google & GitHub

## 🔍 **Google OAuth (5 minutos)**

### Paso 1: Google Cloud Console
1. Ve a: https://console.cloud.google.com
2. **Crear proyecto** → Nombre: `Anclora Kairon`
3. **APIs & Services** → **Credentials**

### Paso 2: OAuth Consent Screen
1. **OAuth consent screen** → **External**
2. **App name**: `Anclora Kairon MVP`
3. **User support email**: tu email
4. **Developer contact**: tu email
5. **Save and Continue** (deja el resto por defecto)

### Paso 3: Crear Credenciales
1. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. **Application type**: `Web application`
3. **Name**: `Anclora Kairon Web`
4. **Authorized redirect URIs**: 
   ```
   https://kfkubggvdbnrblfeukoz.supabase.co/auth/v1/callback
   ```
5. **Create** → **Copiar Client ID**

### Paso 4: Configurar en Supabase
1. Supabase → **Authentication** → **Providers** → **Google**
2. **Enable**: ON
3. **Client ID**: pegar el Client ID de Google
4. **Save**

---

## 🐙 **GitHub OAuth (3 minutos)**

### Paso 1: GitHub Settings
1. Ve a: https://github.com/settings/developers
2. **OAuth Apps** → **New OAuth App**

### Paso 2: Configurar App
1. **Application name**: `Anclora Kairon MVP`
2. **Homepage URL**: `http://localhost:5173`
3. **Authorization callback URL**: 
   ```
   https://kfkubggvdbnrblfeukoz.supabase.co/auth/v1/callback
   ```
4. **Register application** → **Copiar Client ID**

### Paso 3: Configurar en Supabase
1. Supabase → **Authentication** → **Providers** → **GitHub**
2. **Enable**: ON
3. **Client ID**: pegar el Client ID de GitHub
4. **Save**

---

## 📝 **Actualizar .env**

Una vez que tengas los Client IDs, actualiza tu archivo `.env`:

```bash
# Authentication
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```

---

## 🧪 **Probar OAuth**

1. **Reinicia el servidor**:
   ```bash
   npm run dev
   ```

2. **Abre el test**:
   ```
   http://localhost:5173/test-supabase-auth.html
   ```

3. **Prueba los botones**:
   - 🔍 Google → Debería redirigir a Google
   - 🐙 GitHub → Debería redirigir a GitHub

---

## ⚠️ **Notas Importantes**

### URLs de Callback
**IMPORTANTE**: Usa exactamente esta URL (con tu proyecto ID):
```
https://kfkubggvdbnrblfeukoz.supabase.co/auth/v1/callback
```

### Para Producción
Cuando despliegues, agrega también:
```
https://tu-dominio.com/auth/callback
```

### Testing
- OAuth funciona solo con servidor HTTP (no file://)
- Usa `npm run dev` para probar
- Los usuarios aparecerán en Supabase → Authentication → Users

---

## 🎯 **Verificación Rápida**

✅ **Google Cloud Console**: Proyecto creado, OAuth configurado
✅ **GitHub**: OAuth App creada
✅ **Supabase**: Providers habilitados
✅ **`.env`**: Client IDs actualizados
✅ **Test**: OAuth buttons funcionando

**¡Una vez configurado, el login social funcionará perfectamente!** 🚀