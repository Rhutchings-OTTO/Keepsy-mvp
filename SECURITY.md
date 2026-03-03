# Security Hardening

## Threat Model Summary

| Threat | Mitigation |
|--------|------------|
| Abuse / DoS | Rate limiting (IP + endpoint), body size limits |
| Injection | Zod schema validation, strict parsing, prompt sanitization |
| Auth bypass | Admin routes use `x-calibration-key` / `x-admin-key` |
| Payment tampering | Canonical product catalog (`lib/commerce/catalog.ts`), no client-controlled prices |
| Upload abuse | MIME + size validation (generate-image: 8MB source image limit) |
| SSRF | No URL-fetch from user input in current flows |
| Secret leakage | Env validation, no secrets in client bundles, `npm run secret-scan` |

## Implemented Protections

- **Headers**: HSTS, X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy, X-Frame-Options
- **Origin**: Allowlist for state-changing POST (keepsy.store, localhost, vercel.app)
- **Rate limits**: Per-endpoint (generate 5/min, checkout 10/min, etc.)
- **Validation**: Zod schemas, strict mode, body size limits
- **Stripe**: Webhook body size limit (512KB), signature verification, idempotency via `stripe_events`
- **Request correlation**: `x-request-id` in middleware, used in audit logs

## Key Rotation

1. **Stripe**: Dashboard → Developers → API keys → Roll key. Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel env. Redeploy.
2. **OpenAI**: Platform → API keys → Revoke and create new. Update `OPENAI_API_KEY`.
3. **Supabase**: Project Settings → API → Regenerate service role. Update `SUPABASE_SERVICE_ROLE_KEY`.
4. **Admin keys**: Regenerate `MOCKUP_CALIBRATION_KEY`, `PERF_DASHBOARD_KEY`; update Vercel env.

## Rate Limit Tuning

Defaults in `lib/security/rateLimit.ts`. Production should use Redis (Upstash). Add:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

and implement Redis-backed sliding window in `rateLimit.ts` for multi-instance consistency.

## Pre-commit Secret Scan

```bash
npm run secret-scan
```

Add to `.husky/pre-commit` or run manually before push.

## Incident Response

- Check Vercel logs for `[SEC]` audit events (rate limit hits, invalid origin, webhook sig fail).
- Rotate compromised keys immediately.
- If abuse detected: tighten rate limits or block IP at edge (Vercel firewall).
