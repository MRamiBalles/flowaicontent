# Intellectual Property Analysis

Technical assessment of protectable IP assets.

## Summary

| Protection Type | Candidates | Viability |
|-----------------|------------|-----------|
| Utility patent | 1 | Medium |
| Trade secrets | 4 | High |
| Trademark | 2 | High |
| Copyright | Source code | Automatic |

## Patent Candidates

### Prompt Injection Protection System

**Files**: `src/lib/ai-sanitization.ts`, `generate-content/index.ts`

Three-layer defense against LLM manipulation:

1. **Detection** - Regex patterns for injection attempts
2. **Sanitization** - Remove control characters and template markers
3. **Isolation** - Boundary markers separating user content from instructions

**Detection Patterns**:
```regex
/ignore\s+(previous|above|all)\s+(instructions|prompts|rules)/i
/system\s*:\s*you\s+are/i
/act\s+as\s+(a\s+)?(jailbreak|dan|evil)/i
/<\|\..*?\|>/g
```

**Patentability Assessment**:

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Novelty | Medium | Individual techniques exist; combination may be new |
| Non-obviousness | Medium | Three-layer approach adds complexity |
| Utility | High | Real problem, working solution |

**Recommendation**: Document as trade secret. Evaluate provisional patent if expanding to US market.

## Trade Secrets

### 1. System Prompts
Location: `generate-content/index.ts`

Optimized prompts for multi-platform content generation. Keep in server-side code only.

### 2. Rate Limiting Logic
Location: `supabase/migrations/*rate_limiting*.sql`

Balance between UX and cost control.

### 3. Pricing Model
Location: `docs/CREDITS_SYSTEM.md`, `billing-engine/index.ts`

Credit costs and margin calculations.

### 4. Multi-Tenant Isolation
Location: Enterprise migrations, RLS policies

Tenant scoping patterns.

## Trademarks

| Name | NICE Class | Priority |
|------|------------|----------|
| FlowAI | 9, 42 | High |
| FlowCredits | 36, 42 | Medium |

**Registration Cost Estimates**:
- Spain (OEPM): €150
- EU (EUIPO): €850
- US (USPTO): $350

## Action Plan

### Immediate (0-3 months)
- Register "FlowAI" trademark in Spain
- Document trade secrets formally
- Add copyright headers to source files

### Short-term (3-6 months)
- Consult patent attorney
- EU trademark registration
- Employee NDAs

### Long-term (6-12 months)
- US provisional patent (if applicable)
- US trademark (if expanding)

## Resources

- [OEPM (Spain)](https://www.oepm.es)
- [EUIPO (EU)](https://euipo.europa.eu)
- [USPTO (US)](https://www.uspto.gov)

---

*This document is a technical analysis. Consult a qualified IP attorney before taking action.*
