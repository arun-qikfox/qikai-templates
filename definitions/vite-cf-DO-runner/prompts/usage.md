# Usage

## Overview
Full-stack React application with server-side state management powered by a provider-agnostic datastore abstraction.
- Frontend: React Router 6 + TypeScript + ShadCN UI
- Backend: Hono-based API using `createDataStore` (Firestore default, HTTP fallback)
- Shared: Types in `shared/types.ts`
- Deployment: Works on Google App Engine, Cloudflare Workers, or any hosting platform

## ⚠️ IMPORTANT: Demo Content
**All demo pages, mock data, and API endpoints exist only to showcase patterns. Replace them with real application logic.**
- Replace `HomePage.tsx` and `DemoPage.tsx` with actual pages
- Remove or adapt mock data in `shared/mock-data.ts`
- Replace demo API endpoints (`/api/demo`, `/api/counter`) with real functionality backed by your datastore

## Tech Stack
- React Router 6, ShadCN UI, Tailwind, Lucide, Hono, TypeScript

## Development Guidelines
- **Tailwind Colors**: Extend `tailwind.config.js`; do not hardcode colors in CSS
- **Components**: Prefer existing ShadCN components over custom implementations
- **Icons**: Import from `lucide-react`
- **Error Handling**: Error boundaries are provided; wire them into your flows
- **Backend Patterns**: Follow `worker/index.ts` and `worker/userRoutes.ts`, using `createDataStore` for persistence
- **Platform Config**: Keep deployment descriptors (e.g., `wrangler.jsonc`, `app.yaml`) intact unless absolutely required

## Styling
- Responsive, accessible layouts
- Use Tailwind for spacing/typography and ShadCN for components

## Code Organization

### Frontend
- `src/pages/HomePage.tsx` – placeholder landing page
- `src/pages/DemoPage.tsx` – demo of datastore-backed endpoints
- `src/components/ThemeToggle.tsx` – theme switcher
- `src/hooks/useTheme.ts` – theme management hook

### Backend
- `worker/index.ts` – backend entrypoint (middleware + router wiring)
- `worker/userRoutes.ts` – API routes; use datastore helpers instead of platform-specific APIs
- `worker/entities.ts` – demo persistence helpers built on `createDataStore`
- `worker/core-utils.ts` – datastore factory and response helpers
- `worker/datastore/*` – Firestore + HTTP provider implementations

### Shared
- `shared/types.ts` – API/data types
- `shared/mock-data.ts` – demo-only seed data

## API Patterns
Use the datastore abstraction rather than platform-specific bindings:
```ts
import { createDataStore, ok, bad } from './core-utils';

app.get('/api/my-data', async (c) => {
  const store = createDataStore(c.env);
  const page = await store.list<MyType>('my-data');
  return ok(c, page.items);
});

app.post('/api/my-data', async (c) => {
  const payload = (await c.req.json()) as MyType;
  if (!payload.name?.trim()) return bad(c, 'name required');
  const store = createDataStore(c.env);
  await store.create('my-data', payload, { id: payload.id ?? crypto.randomUUID() });
  return ok(c, payload);
});
```

## Environment Variables
Configure datastore credentials via environment variables or secrets:
- `FIRESTORE_PROJECT_ID` – GCP project ID
- `FIRESTORE_CLIENT_EMAIL` – service account email
- `FIRESTORE_PRIVATE_KEY_B64` – base64-encoded private key (PEM)
- Optional: `FIRESTORE_DATABASE_ID`, `FIRESTORE_API_ENDPOINT`
- `DATA_PROVIDER` – set to `http` to switch away from Firestore
- `DATA_HTTP_BASE_URL`, `DATA_HTTP_API_KEY`, `DATA_HTTP_HEADERS_JSON` – configure external HTTPS datastore

## Storage Patterns
- Use descriptive collection names (`demo-items`, `counters`, etc.)
- Seed default data through helpers (see `ensureDemoSeed`)
- Prefer idempotent operations and partial updates via `store.update`

## Frontend
- Call `/api/*` routes directly
- Handle loading and error states using shared types

