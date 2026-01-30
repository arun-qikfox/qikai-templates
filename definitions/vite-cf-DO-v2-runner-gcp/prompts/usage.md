# Usage

## Overview
Full-stack React + Hono starter optimized for Google Cloud App Engine with Firestore by default. The backend exposes a pluggable data store so you can swap Firestore for any HTTPS-accessible database (MongoDB Data API, Supabase REST, custom microservice) by flipping environment variables.

- **Frontend**: React Router 6, ShadCN UI, Tailwind, TypeScript
- **Backend**: Hono API running on Google App Engine (Node.js runtime)
- **Storage**: Firestore REST integration (default) + HTTP proxy provider
- **Shared**: Types in `shared/types.ts`
- **Deployment Target**: Google App Engine (Node.js 20)

## Important: Demo Content
The bundled pages, mock data, and routes are for reference only.
- Replace `HomePage.tsx` / `DemoPage.tsx` with real UI
- Swap out `shared/mock-data.ts` with production data structures
- Replace demo API routes in `worker/user-routes.ts`

## Architecture
- `worker/core-utils.ts` & `worker/datastore/*`: storage configuration + provider implementations
- `worker/entities.ts`: example repositories (users, chats) using the data store abstraction
- `worker/user-routes.ts`: demo API routes (CRUD + messaging)
- `src/lib/api-client.ts`: React Query client

## Environment Variables
Set these before deploying (App Engine environment variables or Secret Manager):

### Firestore (default)
- `DATA_PROVIDER=firestore`
- `FIRESTORE_PROJECT_ID` – GCP project ID
- `FIRESTORE_CLIENT_EMAIL` – service-account email
- `FIRESTORE_PRIVATE_KEY_B64` – base64-encoded PEM private key (entire key file encoded once)
- `FIRESTORE_DATABASE_ID` *(optional)* – defaults to `(default)`
- `FIRESTORE_API_ENDPOINT` *(optional)* – override for emulator testing

### HTTP provider (e.g., MongoDB Data API)
Set `DATA_PROVIDER=http` and supply:
- `DATA_HTTP_BASE_URL` – HTTPS endpoint exposing CRUD routes
- `DATA_HTTP_API_KEY` *(optional)* – bearer token injected in `Authorization`
- `DATA_HTTP_HEADERS_JSON` *(optional)* – JSON object string for additional headers

Switch providers by updating `DATA_PROVIDER`; no code changes required.

## Backend / Worker Imports (Node ESM)
In `worker/` and any server-side code, **always use explicit `.js` extensions** in relative imports so Node ESM resolves modules after TypeScript compilation (e.g. `from './user-routes.js'`, `from './core-utils.js'`). Do not use extensionless relative imports in backend code.

## Adding Routes
Use the data store helpers instead of talking to Firestore directly:

```ts
import { ok, bad } from './core-utils.js';
import { createUser } from './entities.js';

app.post('/api/users', async (c) => {
  const { name } = await c.req.json<{ name?: string }>();
  if (!name?.trim()) return bad(c, 'name required');
  const user = await createUser(c.env, { id: crypto.randomUUID(), name: name.trim() });
  return ok(c, user);
});
```

## Firestore Notes
- Service account keys should be stored as **secrets** (Google Cloud Secret Manager) not committed to git.
- `FIRESTORE_PRIVATE_KEY_B64` must include the full PEM (header + footer) before encoding.
- Firestore REST API is used; requests are signed and cached per instance.
- `entities.ts` shows how to seed collections and run CRUD operations.
- Configure secrets in App Engine: `gcloud app deploy --update-secrets`

## Styling & Frontend
- Keep Tailwind customization in `tailwind.config.js`
- Prefer provided ShadCN components; use React Query for async data
- Handle loading/error states in the UI
- Do not modify template-owned config files like `vite.config.ts` or `tsconfig*.json`. Request changes instead of editing them.

### Theme & Color System
- `src/components/theme-provider.tsx` and the bundled mode toggle (in the navbar layout) already handle light/dark switching—reuse them whenever you restructure the shell. If you remove the stock header, add an obvious toggle back in Phase 1.
- Light mode is the primary spec, but dark mode must ship simultaneously. Use Tailwind `dark:` modifiers and the CSS variables (`--background`, `--foreground`, etc.) defined in `src/styles/globals.css` so both themes stay synchronized.
- Avoid hard-coded text/background colors inside components. Introduce semantic tokens (e.g., `--brand-primary`, `--surface-muted`) through Tailwind or CSS variables and apply them consistently across both themes.
- QA every scene (landing, dashboard, bookings, settings) in both modes before completing a phase to catch low-contrast or washed-out states early.

## Deployment
- **Google App Engine**: `npm run build && gcloud app deploy`
- Ensure environment variables are configured in `app.yaml` or via Secret Manager
- The server exports the Hono app for Node.js runtime compatibility

## Custom Providers
- Implement your own HTTPS service that accepts the same payloads (`DataStore` interface).
- Use `DATA_PROVIDER=http` plus headers/keys to point the template at your service.

This approach keeps Google Cloud as the default while remaining declarative and flexible for other databases.