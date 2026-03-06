# High Availability Setup

## Implemented

### Connection Pooling

This app uses **Supabase** (PostgreSQL), not Prisma. The Supabase JS client uses HTTP/REST (PostgREST), so each serverless invocation does not hold a persistent database connection. Connection limits are managed by Supabase.

If you add direct SQL (e.g. Prisma, `pg`):

- Use Supabase **Connection Pooler** (Supavisor)
- **Session mode** (port 5432): For long-running connections
- **Transaction mode** (port 6543): For serverless — recommended
- Set `DIRECT_URL` = direct Postgres, `DATABASE_URL` = pooler URL

For Prisma Accelerate: Requires Prisma + PostgreSQL. This codebase does not use Prisma.

## Supabase Serverless Best Practices

- Use the Supabase JS client (already in use) — it goes through their API
- For migrations/direct SQL, use the pooler URL: `postgresql://...@db.xxx.supabase.co:6543/postgres`

### Optimistic UI (Checkout)
- On "Pay" click: immediately shows "Securing your Masterpiece" overlay and button text
- API call runs in background; no wait before visual feedback
- On redirect to Stripe, overlay stays until navigation

### Error Boundaries
- **3D Canvas** (GenerativeLoader, PremiumGateway): wrapped in `ErrorBoundary` — if WebGL/Three.js crashes on weak hardware, fallback UI shown
- **OpenAI Preview** (MockupStage/MockupRenderer): wrapped in `ErrorBoundary` — if perspective-transform or mockup render fails, "Preview unavailable" fallback

### CDN Strategy (Generated Images)
- Cloudinary upload URLs include `fl_immutable_cache` transformation
- Ensures `Cache-Control: public, max-age=31536000, immutable` at Cloudinary CDN edge
- Generated design assets cached globally for 1 year
