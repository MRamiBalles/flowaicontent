# 🛡️ FlowAI Security Policy

> **Version**: 1.0
> **Last Updated**: 2024-11-25

## Security First

At FlowAI, security is not an afterthought—it is a core feature. We are committed to protecting our users, their data, and their assets. This policy outlines our approach to security, vulnerability disclosure, and our bug bounty program.

## Reporting Vulnerabilities

If you believe you have found a security vulnerability in FlowAI, we encourage you to let us know right away. We will investigate all legitimate reports and do our best to quickly fix the problem.

### How to Report
Please email us at **security@flowai.com**.

In your report, please include:
- A description of the vulnerability.
- Steps to reproduce the issue (POC).
- The potential impact of the vulnerability.
- Any relevant screenshots or code snippets.

### Disclosure Policy
- We ask that you do not disclose the issue publicly until we have had a reasonable amount of time to address it.
- We will acknowledge receipt of your report within 24 hours.
- We will provide an estimated timeframe for fixing the issue.
- We will notify you when the fix has been deployed.

## Bug Bounty Program

We appreciate the work of security researchers and want to reward them for helping us improve our security.

### Scope
- **Web Application**: `*.flowai.com`
- **Smart Contracts**: `0x...` (Polygon Mainnet)
- **API**: `api.flowai.com`

### Out of Scope
- DDoS attacks.
- Social engineering.
- Spam or phishing.
- Vulnerabilities in third-party libraries (unless they are critical and unpatched).

### Rewards
Rewards are based on the severity of the vulnerability (CVSS score):

| Severity | CVSS Score | Reward Range |
|----------|------------|--------------|
| **Critical** | 9.0 - 10.0 | $10,000 - $50,000 |
| **High** | 7.0 - 8.9 | $2,000 - $10,000 |
| **Medium** | 4.0 - 6.9 | $500 - $2,000 |
| **Low** | 0.1 - 3.9 | Swag / Hall of Fame |

## Security Measures

### Infrastructure
- **Cloud Security**: We use AWS and Railway with strict IAM policies and VPC isolation.
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all tables.
- **Encryption**: All data is encrypted at rest (AES-256) and in transit (TLS 1.3).

### Application
- **Authentication**: Secure JWT-based auth via Supabase.
- **Input Validation**: Strict validation using Zod and Pydantic.
- **Rate Limiting**: Redis-backed rate limiting to prevent abuse.

### Smart Contracts
- **Audits**: All smart contracts undergo external audits before mainnet deployment.
- **Multi-Sig**: Admin functions are controlled by a 3-of-5 Gnosis Safe multi-sig.
- **Timelock**: Critical upgrades have a 48-hour timelock.

## Incident Response

In the event of a security breach, we have a defined incident response plan:
1.  **Identify**: Detect and confirm the breach.
2.  **Contain**: Isolate affected systems to prevent further damage.
3.  **Eradicate**: Remove the root cause of the breach.
4.  **Recover**: Restore systems and data from backups.
5.  **Notify**: Inform affected users and relevant authorities within 72 hours.
6.  **Review**: Conduct a post-mortem to prevent recurrence.

## Contact

For any security-related questions, please contact **security@flowai.com**.
