# Template Selection

Full-stack application with server-side state management. Minimal setup that uses a global state store for persistence and stateful features.

Use when:
- You need a backend with persistent storage using Firestore (default) or any HTTPS data provider
- Real-time/stateful services, dashboards, counters
- Backend-heavy apps requiring persistent state without locking into Cloudflare primitives

Avoid when:
- Static/SPAs with no backend
- SEO/SSR landing pages
- You only need database-like storage across many entities (see Firestore chat runner)

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Platform-agnostic backend powered by a datastore abstraction (Firestore default, HTTP fallback) that can deploy to Google App Engine, Cloudflare Workers, or any hosting platform


