# FlowAI - Análisis de Propiedad Intelectual

> **Fecha**: Diciembre 2025  
> **Propósito**: Identificar activos de propiedad intelectual protegibles  
> **Disclaimer**: Este documento es un análisis técnico preliminar. Consultar con un abogado de patentes antes de tomar acción.

---

## Resumen Ejecutivo

FlowAI contiene varios elementos técnicos que podrían ser protegibles mediante diferentes mecanismos de propiedad intelectual:

| Tipo de Protección | Elementos Identificados | Viabilidad |
|--------------------|------------------------|------------|
| **Patente de Utilidad** | 2 candidatos | Media |
| **Trade Secrets** | 4 elementos | Alta |
| **Marca Registrada** | 3 nombres | Alta |
| **Copyright** | Código fuente | Automática |

---

## Sección 1: Candidatos a Patente

### 1.1 Sistema de Protección contra Prompt Injection

**Ubicación del código**:
- `src/lib/ai-sanitization.ts`
- `supabase/functions/generate-content/index.ts` (líneas 20-41)

**Descripción técnica**:
Un sistema multi-capa para proteger modelos de lenguaje (LLMs) contra ataques de inyección de prompts que comprende:

1. **Capa de Detección** (`detectPromptInjection()`)
   - Análisis de patrones regex específicos
   - Detección de tokens especiales (`<|...|>`)
   - Identificación de marcadores de rol (`SYSTEM:`, `USER:`)

2. **Capa de Sanitización** (`sanitizeForAI()`)
   - Eliminación de caracteres de control (0x00-0x1F, 0x7F)
   - Remoción de caracteres zero-width (U+200B-U+200D)
   - Neutralización de marcadores de template (`{}`, `[]`, `<>`)

3. **Capa de Aislamiento** (`buildSafePrompt()`)
   - Demarcación estructural con boundary markers (`---`)
   - Instrucción explícita de tratamiento como datos
   - Separación física de contenido sistema vs usuario

**Claim de patente potencial**:

> "Método implementado por computadora para proteger un modelo de lenguaje contra ataques de inyección de prompts, que comprende:
> 
> (a) recibir contenido de entrada de un usuario;
> 
> (b) analizar dicho contenido mediante una pluralidad de patrones de expresión regular diseñados para detectar intentos de manipulación del modelo de lenguaje, incluyendo pero no limitado a instrucciones de ignorar prompts previos, inyección de roles de sistema, y tokens especiales de delimitación;
> 
> (c) sanitizar dicho contenido mediante la eliminación de caracteres de control, caracteres de ancho cero, y marcadores de plantilla que podrían alterar la estructura del prompt;
> 
> (d) encapsular el contenido sanitizado dentro de marcadores de demarcación estructural que instruyen explícitamente al modelo de lenguaje a tratar dicho contenido exclusivamente como datos y no como instrucciones;
> 
> (e) generar una respuesta del modelo de lenguaje basada en el prompt protegido."

**Patrones de detección específicos** (Exhibit A):
```
Pattern 1: /ignore\s+(previous|above|all)\s+(instructions|prompts|rules)/i
Pattern 2: /disregard\s+(previous|above|all)\s+(instructions|prompts|rules)/i
Pattern 3: /forget\s+(previous|above|all)\s+(instructions|prompts|rules)/i
Pattern 4: /new\s+instructions?:/i
Pattern 5: /system\s*:\s*you\s+are/i
Pattern 6: /act\s+as\s+(a\s+)?(jailbreak|dan|evil)/i
Pattern 7: /<\|\.?.*?\|>/g
Pattern 8: /\n\n(SYSTEM|USER|ASSISTANT):/i
```

**Evaluación de patentabilidad**:

| Criterio | Evaluación | Notas |
|----------|------------|-------|
| Novedad | 🟡 Media | Técnicas individuales existen, combinación podría ser nueva |
| No obviedad | 🟡 Media | Combinación de 3 capas podría no ser obvia |
| Utilidad | 🟢 Alta | Problema real, solución funcional |
| Elegibilidad (101 US) | 🟡 Cuestionable | Software, requiere "mejora técnica" |

**Recomendación**: Documentar como trade secret, evaluar patente provisional en EEUU.

---

### 1.2 Sistema de Generación de Contenido Multi-Plataforma Asíncrono

**Ubicación del código**:
- `supabase/functions/generate-content/index.ts` (líneas 108-269)

**Descripción técnica**:
Un sistema de generación de contenido que:

1. Crea un job en estado "processing" inmediatamente
2. Retorna HTTP 202 (Accepted) al cliente
3. Procesa en background usando `EdgeRuntime.waitUntil()`
4. Genera contenido para múltiples plataformas (Twitter, LinkedIn, Instagram) en una sola llamada
5. Actualiza el job con resultados o errores

**Claim potencial**:

> "Sistema implementado por computadora para la generación asíncrona de contenido multi-plataforma, que comprende:
> 
> (a) un módulo de recepción configurado para recibir contenido de entrada y crear un registro de trabajo en estado de procesamiento;
> 
> (b) un módulo de respuesta inmediata configurado para retornar un identificador de trabajo al cliente antes de completar el procesamiento;
> 
> (c) un módulo de generación en segundo plano que utiliza un modelo de lenguaje para transformar el contenido en formatos optimizados para múltiples plataformas sociales;
> 
> (d) un módulo de actualización que persiste los resultados o errores en el registro de trabajo."

**Evaluación**:

| Criterio | Evaluación | Notas |
|----------|------------|-------|
| Novedad | ⚠️ Baja | Patrón de job queue es común |
| No obviedad | ⚠️ Baja | Combinación de técnicas conocidas |
| Utilidad | 🟢 Alta | Funcional |

**Recomendación**: NO patentar. Proteger como trade secret.

---

## Sección 2: Trade Secrets (Secretos Comerciales)

Los siguientes elementos deben protegerse mediante confidencialidad:

### 2.1 Prompts de Sistema Optimizados

**Ubicación**: `generate-content/index.ts` líneas 162-180

```typescript
const systemPrompt = `You are an expert social media content strategist...
Platform Guidelines:
- Twitter: Create an engaging thread (5-7 tweets)...
- LinkedIn: Write a professional post with insights...
- Instagram: Create a Reel script with timestamps...`
```

**Valor**: El prompt específico y las instrucciones de formato son resultado de experimentación y optimización.

**Protección recomendada**:
- Mantener en código servidor (Edge Functions)
- No exponer en cliente
- Incluir en acuerdos de confidencialidad con empleados

---

### 2.2 Algoritmo de Rate Limiting Contextual

**Ubicación**: 
- `supabase/migrations/20251209073000_rate_limiting.sql`
- `supabase/functions/_shared/rate-limiter.ts`

**Valor**: Lógica específica para balancear UX vs costes.

---

### 2.3 Modelo de Pricing y Unit Economics

**Ubicación**: `docs/CREDITS_SYSTEM.md`, `billing-engine/index.ts`

**Valor**: Estructura de precios y márgenes por servicio.

---

### 2.4 Arquitectura de Aislamiento Multi-Tenant

**Ubicación**: Migrations de enterprise + RLS policies

**Valor**: Patrones específicos de aislamiento de tenants.

---

## Sección 3: Marcas Registrables

| Marca | Clase NICE | Tipo | Prioridad |
|-------|-----------|------|-----------|
| **FlowAI** | 9 (software), 42 (SaaS) | Denominativa | 🟢 Alta |
| **FlowCredits** | 36 (finanzas), 42 (SaaS) | Denominativa | 🟡 Media |
| **Logo FlowAI** | 9, 42 | Figurativa | 🟡 Media |

**Jurisdicciones recomendadas**:
1. España (OEPM) - €150 primera clase
2. Unión Europea (EUIPO) - €850 primera clase
3. Estados Unidos (USPTO) - ~$350 por clase

---

## Sección 4: Derechos de Autor (Copyright)

El código fuente está automáticamente protegido por copyright. Para reforzar:

- [ ] Añadir header de copyright a todos los archivos fuente
- [ ] Registrar copyright en EEUU para demandas por daños ($35-55)

**Header recomendado**:
```
/**
 * Copyright (c) 2025 [Nombre de la empresa]
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, or distribution is prohibited.
 */
```

---

## Sección 5: Plan de Acción

### Corto Plazo (0-3 meses)

| Acción | Coste Est. | Prioridad |
|--------|-----------|-----------|
| Registrar marca "FlowAI" en OEPM | €150 | 🟢 Alta |
| Documentar trade secrets formalmente | €0 | 🟢 Alta |
| Añadir headers de copyright | €0 | 🟡 Media |

### Medio Plazo (3-6 meses)

| Acción | Coste Est. | Prioridad |
|--------|-----------|-----------|
| Consulta con abogado de patentes | €500-1000 | 🟡 Media |
| Registro marca EUIPO | €850 | 🟡 Media |
| Acuerdos de confidencialidad | €200 | 🟢 Alta |

### Largo Plazo (6-12 meses)

| Acción | Coste Est. | Prioridad |
|--------|-----------|-----------|
| Patente provisional USPTO (si aplica) | $1,500 | Condicional |
| Registro marca USPTO | $350 | Si expansión US |

---

## Apéndice: Recursos

- **OEPM (España)**: https://www.oepm.es
- **EUIPO (EU)**: https://euipo.europa.eu
- **USPTO (EEUU)**: https://www.uspto.gov

---

> **Próximos pasos**: Revisar este documento con un abogado especializado en propiedad intelectual tecnológica para validar viabilidad y prioridades.
