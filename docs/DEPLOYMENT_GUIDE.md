# 🚀 FlowAI Production Deployment Guide

> **Status**: Ready for Production  
> **Date**: 2025-12-09

---

## Pre-Requisitos

Antes de desplegar, asegúrate de tener:

- [ ] Node.js 18+ instalado (`node -v`)
- [ ] Supabase CLI instalado (`npx supabase --version`)
- [ ] Acceso al Supabase Dashboard

---

## Paso 1: Aplicar Migraciones

Abre una terminal (CMD o PowerShell como Admin) en la carpeta del proyecto:

```bash
cd C:\Users\Manu\FlowAI\flowaicontent-10
npx supabase db push
```

### Migraciones Pendientes

Las siguientes migraciones se aplicarán:

| Archivo | Descripción |
|---------|-------------|
| `20251209073000_rate_limiting.sql` | Rate limiting infrastructure |
| `20251209080000_seed_governance.sql` | Demo data for governance |
| `20251209090000_unified_credits.sql` | FlowCredits billing system |

---

## Paso 2: Desplegar Edge Functions

```bash
npx supabase functions deploy --all
```

O individualmente las críticas:

```bash
npx supabase functions deploy billing-engine
npx supabase functions deploy enterprise-admin
npx supabase functions deploy video-dubbing
npx supabase functions deploy generate-thumbnail
```

---

## Paso 3: Configurar Variables de Entorno

En **Supabase Dashboard → Settings → Edge Functions**, verifica:

| Variable | Valor |
|----------|-------|
| `OPENAI_API_KEY` | Tu clave de OpenAI |
| `ELEVENLABS_API_KEY` | Tu clave de ElevenLabs |
| `STRIPE_SECRET_KEY` | Tu clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret de Stripe |

---

## Paso 4: Verificación Final

### Test de Billing Engine

```bash
curl -X POST https://TU_PROJECT.supabase.co/functions/v1/billing-engine \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_balance"}'
```

Respuesta esperada:
```json
{"success": true, "balance": 50}
```

---

## Paso 5: Frontend Build (Producción)

```bash
npm run build
```

El output en `dist/` está listo para deploy en Vercel, Netlify, o Cloudflare Pages.

---

## Checklist Final

- [ ] Migraciones aplicadas
- [ ] Edge Functions desplegadas
- [ ] Variables de entorno configuradas
- [ ] Test de billing exitoso
- [ ] Frontend build sin errores
- [ ] DNS/SSL configurado (si aplica)

---

## Troubleshooting

### "npx not found"
```bash
# Verificar instalación de Node
node -v
npm -v

# Si no funciona, reinstalar Node.js desde https://nodejs.org
```

### "Supabase CLI not found"
```bash
npm install -g supabase
```

### Error de autenticación
```bash
npx supabase login
```
