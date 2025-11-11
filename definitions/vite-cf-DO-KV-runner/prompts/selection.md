# Template Selection

Full-stack template with a seeded datastore for multi-entity demos. Ships with Firestore (via REST) as the default provider plus an HTTP fallback, so the same generated backend can deploy to Google App Engine, Cloudflare Workers, or any hosting platform that can supply environment variables.

Use when:
- You want built-in seed endpoints to bootstrap demo content
- The backend needs CRUD APIs plus counters/stateful metrics
- You prefer Firestore defaults but may swap to another HTTPS provider later

Avoid when:
- You only need a frontend SPA with no backend
- SEO/SSR marketing sites (choose Next.js template)

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Hono API + datastore abstraction (Firestore default, HTTP provider optional)