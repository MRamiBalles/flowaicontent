# Security

Security practices and policies for FlowAI.

## Summary

| Area | Status |
|------|--------|
| Authentication | Supabase Auth (JWT) |
| Authorization | Row-level security (RLS) |
| Encryption | TLS 1.3, AES-256 at rest |
| Rate Limiting | Per-user request limits |

## Authentication

- JWT tokens via Supabase Auth
- Session refresh handled automatically
- Multi-factor authentication available

## Authorization

All database tables protected by RLS policies:

```sql
-- Users can only access their own data
CREATE POLICY "Users own data"
ON table_name FOR ALL
USING (auth.uid() = user_id);
```

Admin operations require role verification:

```typescript
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);

if (!roles?.some(r => r.role === 'admin')) {
  throw new Error('Admin access required');
}
```

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| AI generation | 10/hour (free), 100/hour (pro) |
| Voice cloning | 3/hour |
| Video render | 5/hour |

## Input Validation

### Prompt Injection Protection

File: `src/lib/ai-sanitization.ts`

1. Pattern detection for injection attempts
2. Control character removal
3. Boundary markers for user content

### SQL Injection Prevention

All queries use parameterized statements via Supabase client.

## Data Protection

| Data Type | Protection |
|-----------|------------|
| Passwords | Never stored (Supabase handles) |
| API keys | Environment variables only |
| User content | Encrypted at rest |
| Voice samples | AES-256, user-deletable |

## Incident Response

1. **Detection**: Sentry alerts, Supabase logs
2. **Containment**: Revoke affected tokens
3. **Investigation**: Audit trail review
4. **Recovery**: Restore from backups
5. **Post-mortem**: Document and improve

## Reporting Vulnerabilities

Email: security@flowai.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact

Response time: 48 hours

## Compliance Roadmap

| Standard | Status |
|----------|--------|
| GDPR | Compliant |
| SOC 2 | Planned Q2 2025 |
| PCI DSS | Planned Q3 2025 |

## Audit History

| Date | Type | Finding |
|------|------|---------|
| Dec 2025 | Internal | No critical issues |

See [Security Audit December 2025](SECURITY_AUDIT_2025-12.md) for details.
