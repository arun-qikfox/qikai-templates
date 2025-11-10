# Template Selection

Full-stack application with server-side state management. Minimal setup that uses a global state store for persistence and stateful features.

Use when:
- You need server-side state with a global state store
- Real-time/stateful services, dashboards, counters
- Backend-heavy apps requiring persistent state

Avoid when:
- Static/SPAs with no backend
- SEO/SSR landing pages
- You only need database-like storage across many entities (see DO v2 runner)

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Platform-agnostic backend (can be deployed to Cloudflare Workers, Google App Engine, or any hosting platform)


