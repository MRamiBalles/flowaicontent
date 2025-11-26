# 🚀 Security Deployment Guide - Step by Step

## Pre-Requisitos
- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Acceso al proyecto Supabase (URL y keys)
- [ ] Cuenta Sentry (o crear una gratis en sentry.io)
- [ ] Acceso a Vercel/Railway para variables de entorno

---

## 📋 Paso 1: Aplicar Migration de RLS Policies

### 1.1 Conectar a tu proyecto Supabase
```bash
cd C:\Users\Manu\FlowAI\flowaicontent-6
supabase link --project-ref TU_PROJECT_REF
```

> **Nota**: Encuentra tu `project-ref` en Supabase Dashboard → Settings → General

### 1.2 Aplicar la migration
```bash
supabase db push
```

Esto aplicará el archivo:
- `supabase/migrations/20251126004500_fix_critical_rls_policies.sql`

### 1.3 Verificar en Supabase Dashboard
1. Ve a **Database** → **Policies**
2. Busca tabla `nft_shares` - deberías ver:
   - ✅ "Users can view their own NFT shares" (SELECT)
   - ✅ "Anyone can view NFT share data" (SELECT)
   - ❌ NO debe existir "System can manage NFT shares"

3. Busca tabla `nft_transactions`:
   - ✅ "Users can view NFT transactions" (SELECT)
   - ❌ NO debe existir "System can insert NFT transactions"

4. Busca tabla `creator_earnings`:
   - ✅ "Users can view their own earnings" (SELECT)
   - ✅ "Admins can view all earnings" (SELECT)
   - ❌ NO debe existir "System can insert creator earnings"

---

## 🔐 Paso 2: Configurar Sentry

### 2.1 Obtener DSN de Sentry
1. Ve a https://sentry.io (crea cuenta si no tienes)
2. Crea nuevo proyecto → **React**
3. Copia el DSN (formato: `https://xxxxx@o0.ingest.sentry.io/xxxxx`)

### 2.2 Configurar en Vercel/Railway

**Si usas Vercel:**
1. Ve a tu proyecto → **Settings** → **Environment Variables**
2. Agrega:
   - `VITE_SENTRY_DSN` = tu DSN
   - `VITE_SENTRY_ENVIRONMENT` = `production`
   - `VITE_SENTRY_TRACES_SAMPLE_RATE` = `0.1`
   - `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` = `0.1`
   - `VITE_SENTRY_REPLAYS_ERROR_SAMPLE_RATE` = `1.0`

**Si usas Railway:**
1. Ve a tu proyecto → **Variables** tab
2. Agrega las mismas variables arriba

### 2.3 Deployar
```bash
# Si usas Vercel
vercel --prod

# Si usas Railway (automático con git push)
git push railway main
```

### 2.4 Verificar Sentry
1. Abre tu app en producción
2. Abre DevTools Console
3. Ejecuta:
   ```javascript
   throw new Error("Sentry test error");
   ```
4. Ve a Sentry Dashboard → Issues
5. Deberías ver el error "Sentry test error" aparecer en ~30 segundos

---

## 🧪 Paso 3: Verificar Edge Function (mint-nft)

### 3.1 Test con wallet inválida
```bash
curl -X POST https://TU_PROYECTO.supabase.co/functions/v1/mint-nft \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test-123",
    "title": "Test NFT",
    "wallet_address": "0x123"
  }'
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

### 3.2 Test con wallet válida
```bash
curl -X POST https://TU_PROYECTO.supabase.co/functions/v1/mint-nft \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test-123",
    "title": "Test NFT",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "nft_id": "nft_...",
  "message": "NFT minted successfully!"
}
```

---

## ✅ Checklist Final

- [ ] RLS policies aplicadas y verificadas en Supabase
- [ ] Sentry DSN configurado en producción
- [ ] Aplicación desplegada con nuevas variables
- [ ] Sentry recibe errores de prueba
- [ ] mint-nft rechaza wallets inválidas
- [ ] mint-nft acepta wallets válidas

---

## 🆘 Troubleshooting

### Error: "supabase: command not found"
```bash
npm install -g supabase
```

### Error al aplicar migration
- Verifica que estás en el directorio correcto
- Asegúrate de haber corrido `supabase link` primero

### Sentry no recibe errores
- Verifica que el DSN esté correcto (sin comillas extras)
- Asegúrate de haber desplegado después de agregar las variables
- Revisa la consola del navegador para errores de Sentry

### Edge function no valida
- Asegúrate de haber desplegado las funciones: `supabase functions deploy mint-nft`
- Verifica los logs: Supabase Dashboard → Edge Functions → mint-nft → Logs

---

## 📊 Resultado Esperado

Después de completar todos los pasos:
- ✅ **Seguridad**: RLS policies protegen tablas críticas
- ✅ **Monitoring**: Sentry trackea errores en tiempo real
- ✅ **Validación**: Edge functions validan input correctamente
- ✅ **Producción**: App lista para usuarios reales

¡Excelente trabajo asegurando la plataforma! 🎉
