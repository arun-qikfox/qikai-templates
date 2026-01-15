# Usage

## Overview
Full-stack React + Hono template with a seeded datastore abstraction. Defaults to Google Cloud Firestore (REST) but can swap to any HTTPS-accessible provider through environment variables.
- Frontend: React Router 6 + TypeScript + ShadCN UI
- Backend: Hono APIs using `createDataStore` helpers (Firestore by default, HTTP fallback)
- Shared: Types in `shared/types.ts`
- Deployment: Works on Google App Engine, Cloudflare Workers, or any hosting platform that can supply the env vars

## ⚠️ IMPORTANT: Demo Content
**All demo pages, mock data, and API endpoints exist purely for reference. Replace them with real application logic.**
- Replace `HomePage.tsx` / `DemoPage.tsx` with production UI
- Swap out mock data in `shared/mock-data.ts`
- Update demo API routes in `worker/userRoutes.ts` and `worker/entities.ts`

## Tech Stack
- React Router 6, ShadCN UI, Tailwind, Lucide, Hono, TypeScript

## Development Guidelines
- **Tailwind Colors**: Extend `tailwind.config.js`; avoid hardcoding in CSS
- **Components**: Prefer existing ShadCN components
- **Icons**: Import from `lucide-react`
- **Error Handling**: Error boundaries are pre-implemented
- **Backend Patterns**: Follow `worker/index.ts` + `worker/userRoutes.ts` and rely on datastore helpers
- **Platform Config**: Keep deployment descriptors (e.g., `wrangler.jsonc`, `app.yaml`) intact unless explicitly required
- **Protected configs**: Do not modify template-owned config files like `vite.config.ts` or `tsconfig*.json`. Request changes instead of editing them.

## Code Organization

### Frontend
- `src/pages/HomePage.tsx` – placeholder landing page
- `src/pages/DemoPage.tsx` – demo UI for seed data + counters
- `src/components/ThemeToggle.tsx` – theme switcher
- `src/hooks/useTheme.ts` – theme management hook

### Backend
- `worker/index.ts` – backend entrypoint (middleware + router)
- `worker/userRoutes.ts` – API routes (seed, CRUD, counter)
- `worker/entities.ts` – datastore helpers (seed logic, CRUD, counters)
- `worker/core-utils.ts` – datastore factory + response utilities
- `worker/datastore/*` – Firestore + HTTP provider implementations

### Shared
- `shared/types.ts` – shared DTOs for API responses
- `shared/mock-data.ts` – demo seed data

## API Patterns
Use `createDataStore` helpers instead of platform-specific bindings:
```ts
import { createDataStore, ok, bad } from './core-utils';

app.get('/api/items', async (c) => {
  const store = createDataStore(c.env);
  const page = await store.list<Item>('items', { limit: 25 });
  return ok(c, page);
});

app.post('/api/items', async (c) => {
  const payload = (await c.req.json()) as Partial<Item>;
  if (!payload.name?.trim()) return bad(c, 'name required');
  const store = createDataStore(c.env);
  const next = await store.create('items', { ...payload, id: crypto.randomUUID() });
  return ok(c, next);
});
```

## Environment Variables
Configure datastore credentials once secrets are provisioned:
- `FIRESTORE_PROJECT_ID` – GCP project ID
- `FIRESTORE_CLIENT_EMAIL` – service account email
- `FIRESTORE_PRIVATE_KEY_B64` – base64 encoded private key (PEM)
- Optional: `FIRESTORE_DATABASE_ID`, `FIRESTORE_API_ENDPOINT`
- Switch providers by setting `DATA_PROVIDER=http` and supplying:
  - `DATA_HTTP_BASE_URL`
  - `DATA_HTTP_API_KEY` (optional)
  - `DATA_HTTP_HEADERS_JSON` (optional additional headers)

## Seeding & Counters
- `/api/seed` triggers `ensureSeed` in `worker/entities.ts`, inserting mock data and a counter record if none exist.
- Update or remove this endpoint for production once you have real migrations.

## Storage Patterns
- Use descriptive collection names (`demo-items`, `counters`, etc.) via datastore helpers.
- Prefer idempotent operations (e.g., upsert) and partial updates (`store.update`) for mutable records.

## Frontend
- Call `/api/*` endpoints directly
- Handle loading/error states using shared types

