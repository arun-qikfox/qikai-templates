# Usage

## Overview
Full-stack React application with server-side state management. Single global state store for all persistence and stateful features.
- Frontend: React Router 6 + TypeScript + ShadCN UI
- Backend: Hono-based API with state store (platform-agnostic)
- Shared: Types in `shared/types.ts`
- Deployment: Can be deployed to Cloudflare Workers, Google App Engine, or any hosting platform

## ⚠️ IMPORTANT: Demo Content
**The existing demo pages, mock data, and API endpoints are FOR TEMPLATE UNDERSTANDING ONLY.**
- Replace `HomePage.tsx` and `DemoPage.tsx` with actual application pages
- Remove or replace mock data in `shared/mock-data.ts` with real data structures
- Remove or replace demo API endpoints (`/api/demo`, `/api/counter`) and implement actual business logic
- The counter and demo items examples show DO patterns - replace with real functionality

## Tech
- React Router 6, ShadCN UI, Tailwind, Lucide, Hono, TypeScript

## Development Restrictions
- **Tailwind Colors**: Hardcode custom colors in `tailwind.config.js`, NOT in `index.css`
- **Components**: Use existing ShadCN components instead of writing custom ones
- **Icons**: Import from `lucide-react` directly
- **Error Handling**: ErrorBoundary components are pre-implemented
- **Backend Patterns**: Follow exact patterns in `worker/index.ts` to avoid breaking functionality
- **CRITICAL**: Platform-specific configuration files (e.g., `wrangler.jsonc` for Cloudflare) should not be modified - only use the provided state store bindings

## Styling
- Responsive, accessible
- Prefer ShadCN components; Tailwind for layout/spacing/typography

## Code Organization

### Frontend Structure
- `src/pages/HomePage.tsx` - Homepage for user to see while you are working on the app
- `src/pages/DemoPage.tsx` - Main demo showcasing Durable Object features
- `src/components/ThemeToggle.tsx` - Theme switching component
- `src/hooks/useTheme.ts` - Theme management hook

### Backend Structure
- `worker/index.ts` - Backend entrypoint (registers routes; do not change patterns)
- `worker/userRoutes.ts` - Add routes here
- `worker/durableObject.ts` - State store methods (e.g., counter, demo items)
- `worker/core-utils.ts` - Core types/utilities (do not modify)

### Shared
- `shared/types.ts` - API/data types
- `shared/mock-data.ts` - Demo-only; replace

## API Patterns

### Adding Endpoints
Follow this pattern in `worker/userRoutes.ts`:
```typescript
// State store endpoint for data retrieval
app.get('/api/my-data', async (c) => {
  const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
  const data = await stub.getMyData();
  return c.json({ success: true, data } satisfies ApiResponse<MyType[]>);
});

// State store endpoint for data modification
app.post('/api/my-data', async (c) => {
  const body = await c.req.json() as MyType;
  const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
  const data = await stub.addMyData(body);
  return c.json({ success: true, data } satisfies ApiResponse<MyType[]>);
});
```

### State Store Methods Pattern
Add methods to `GlobalDurableObject` class in `worker/durableObject.ts`:
```typescript
async getMyData(): Promise<MyType[]> {
  const items = await this.ctx.storage.get("my_data_key");
  if (items) {
    return items as MyType[];
  }
  // Initialize with default data if not exists
  const defaultData = DEFAULT_MY_DATA;
  await this.ctx.storage.put("my_data_key", defaultData);
  return defaultData;
}

async addMyData(item: MyType): Promise<MyType[]> {
  const items = await this.getMyData();
  const updated = [...items, item];
  await this.ctx.storage.put("my_data_key", updated);
  return updated;
}
```

### Type Safety
- Return `ApiResponse<T>`
- Share types via `shared/types.ts`
- State store methods must be typed

## Bindings
CRITICAL: only `GlobalDurableObject` is available for stateful ops
**IMPORTANT: You are NOT ALLOWED to edit/add/remove ANY platform bindings OR touch platform-specific config files (e.g., wrangler.jsonc). Build your application around what is already provided.**

**YOU CANNOT**:
- Modify platform-specific configuration files (e.g., `wrangler.jsonc` for Cloudflare)
- Add new state stores or storage namespaces
- Change binding names or add new bindings
## Storage Patterns
- Use unique keys per dataset (e.g. `counter_value`, `demo_items`)
- Initialize data on first access as needed
- Use atomic operations for consistency

## Frontend
- Call `/api/*` directly
- Handle loading/errors; use shared types