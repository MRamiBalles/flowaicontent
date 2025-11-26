# 🚀 Deployment via Supabase Dashboard (Sin CLI)

Ya que no tienes npm/node instalado, puedes deployar directamente desde el Dashboard de Supabase.

## 📋 Paso 1: Aplicar RLS Migration

### 1.1 Abrir Supabase Dashboard
1. Ve a https://supabase.com/dashboard
2. Login con tu cuenta
3. Selecciona tu proyecto FlowAI

### 1.2 Abrir SQL Editor
1. En el menú lateral, click en **SQL Editor**
2. Click en **New query**

### 1.3 Copiar y Ejecutar la Migration
1. Abre el archivo: `C:\Users\Manu\FlowAI\flowaicontent-6\supabase\migrations\20251126004500_fix_critical_rls_policies.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor
4. Click en **Run** (o presiona `Ctrl+Enter`)

### 1.4 Verificar Resultado
Deberías ver mensaje de éxito. Si hay error, cópialo y compártelo conmigo.

---

## ✅ Paso 2: Verificar Políticas

En el mismo SQL Editor, ejecuta estos queries uno por uno:

### Query 1: Verificar nft_shares
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'nft_shares';
```

**Resultado esperado:**
```
policyname                          | cmd
------------------------------------+--------
Users can view their own NFT shares | SELECT
Anyone can view NFT share data      | SELECT
```

### Query 2: Verificar nft_transactions
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'nft_transactions';
```

**Resultado esperado:**
```
policyname                       | cmd
---------------------------------+--------
Users can view NFT transactions  | SELECT
```

### Query 3: Verificar creator_earnings
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'creator_earnings';
```

**Resultado esperado:**
```
policyname                      | cmd
--------------------------------+--------
Users can view their own earnings | SELECT
Admins can view all earnings      | SELECT
```

---

## 🔐 Paso 3: Configurar Sentry

### 3.1 Crear cuenta Sentry (si no tienes)
1. Ve a https://sentry.io/signup/
2. Crea cuenta gratuita
3. Crea nuevo proyecto → Selecciona **React**

### 3.2 Obtener DSN
1. Una vez creado el proyecto, verás una pantalla con código
2. Busca una línea que dice `dsn: "https://..."`
3. Copia el valor del DSN (ejemplo: `https://abc123@o123.ingest.sentry.io/456`)

### 3.3 Configurar en tu Hosting

**Si usas Vercel:**
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Click en **Settings** → **Environment Variables**
4. Agrega estas variables (click "Add" para cada una):

```
VITE_SENTRY_DSN = el-DSN-que-copiaste
VITE_SENTRY_ENVIRONMENT = production
VITE_SENTRY_TRACES_SAMPLE_RATE = 0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE = 0.1
VITE_SENTRY_REPLAYS_ERROR_SAMPLE_RATE = 1.0
```

5. Click **Save**
6. Vercel automáticamente re-desplegará tu app

**Si usas otro hosting (Railway, Netlify, etc):**
Agrega las mismas variables en la sección de Environment Variables de tu plataforma.

---

## 🧪 Paso 4: Verificar Deployment

### 4.1 Verificar Sentry
1. Espera 2-3 minutos a que se complete el despliegue
2. Abre tu aplicación en producción
3. Abre la consola del navegador (F12)
4. Ejecuta:
   ```javascript
   throw new Error("Sentry test - deployment verification");
   ```
5. Ve a tu Dashboard de Sentry (https://sentry.io)
6. Click en **Issues**
7. Deberías ver el error aparecer en ~30 segundos

### 4.2 Verificar Edge Function (mint-nft)

Abre tu navegador y ve a Supabase Dashboard:
1. **Edge Functions** → **mint-nft** → **Logs**
2. Deja esta pestaña abierta

En otra pestaña, abre la consola del navegador de tu app y ejecuta:

```javascript
// Test con wallet INVÁLIDA (debe fallar)
fetch('https://TU_PROYECTO_ID.supabase.co/functions/v1/mint-nft', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TU_ANON_KEY' // Cámbialo por tu key real
  },
  body: JSON.stringify({
    video_id: 'test-123',
    title: 'Test NFT',
    wallet_address: '0x123' // INVÁLIDA
  })
}).then(r => r.json()).then(console.log);
```

**Resultado esperado:**
```json
{
  "error": "Validation failed",
  "details": {
    "wallet_address": {
      "_errors": ["Invalid Ethereum wallet address format"]
    }
  }
}
```

---

## ✅ Checklist Final

Marca cada uno cuando lo completes:

- [ ] SQL migration ejecutada en Supabase Dashboard
- [ ] Verificado que las 3 políticas están correctas
- [ ] Sentry DSN configurado en variables de entorno
- [ ] App re-desplegada automáticamente
- [ ] Sentry recibe error de prueba
- [ ] mint-nft rechaza wallets inválidas

---

## 📝 Notas Importantes

- **RLS Policies**: Las tablas ahora son READ-ONLY para usuarios
- **Writes**: Solo edge functions con service role pueden escribir
- **Sentry**: Solo activo en producción (no en desarrollo)
- **Seguridad**: Nivel significativamente mejorado ✅

---

## 🆘 Si algo falla

Comparte conmigo:
1. Captura de pantalla del error
2. Query que ejecutaste
3. Te ayudaré a resolverlo

¿Listo para empezar? Ve al Paso 1 y avísame cuando completes la migration SQL.
