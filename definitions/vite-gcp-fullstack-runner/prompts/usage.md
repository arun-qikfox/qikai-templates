# Usage

## Overview
Full-stack React + Hono starter optimized for Google Cloud App Engine with Google Cloud Datastore by default. The backend exposes a pluggable data store so you can swap Datastore for Firestore or any HTTPS-accessible database (MongoDB Data API, Supabase REST, custom microservice) by flipping environment variables.

- **Frontend**: React Router 6, ShadCN UI, Tailwind, TypeScript
- **Backend**: Hono API running on Google App Engine (Node.js runtime)
- **Storage**: Google Cloud Datastore (default, uses ADC) + Firestore REST + HTTP proxy provider
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
Set these before deploying (App Engine environment variables or Secret Manager). **Always use fallbacks**: `process.env.X ?? DEFAULT_X`.

### Datastore (default – uses Application Default Credentials)
- `DATA_PROVIDER=datastore` (or omit – Datastore is default)
- `GCP_PROJECT_ID` or `GOOGLE_CLOUD_PROJECT` *(optional)* – when running on App Engine, ADC auto-detects the project
- No service account keys required when deployed to GCP; ADC is used automatically

### Firestore (explicit – requires service account keys)
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
In `worker/` and any server-side code, **always use explicit `.ts` extensions** in relative imports for Node 24 native TypeScript (e.g. `from './user-routes.ts'`, `from './core-utils.ts'`). Do not use extensionless relative imports in backend code.

## Adding Routes
Use the data store helpers instead of talking to Datastore/Firestore directly:

```ts
import { ok, bad } from './core-utils.ts';
import { createUser } from './entities.ts';

app.post('/api/users', async (c) => {
  const { name } = await c.req.json<{ name?: string }>();
  if (!name?.trim()) return bad(c, 'name required');
  const user = await createUser(c.env, { id: crypto.randomUUID(), name: name.trim() });
  return ok(c, user);
});
```

## Datastore & Firestore Notes
- **Datastore (default)**: Uses Application Default Credentials (ADC) when running on GCP. No service account keys needed for App Engine deployments.
- **Firestore**: When `DATA_PROVIDER=firestore`, service account keys must be provided. Store keys as **secrets** (Google Cloud Secret Manager) not committed to git.
- `FIRESTORE_PRIVATE_KEY_B64` must include the full PEM (header + footer) before encoding.
- `entities.ts` shows how to seed collections and run CRUD operations.
- Configure secrets in App Engine: `gcloud app deploy --update-secrets`

## Styling & Frontend
- **Component imports**: Internal components use named exports. Always use: `import { ComponentName } from "@/components/ComponentName"`. Never use default import for app components (`import X from "@/components/X"`)—it causes runtime errors (React #130).
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
- Frontend build artifacts are always emitted to `dist/client/**`—do not change the Vite `build.outDir`
- Ensure environment variables are configured in `app.yaml` or via Secret Manager
- The server exports the Hono app for Node.js runtime compatibility

## Custom Providers
- Implement your own HTTPS service that accepts the same payloads (`DataStore` interface).
- Use `DATA_PROVIDER=http` plus headers/keys to point the template at your service.

This approach keeps Google Cloud as the default while remaining declarative and flexible for other databases.