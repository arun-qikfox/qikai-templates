# Template Selection

General-purpose full-stack application template with Google Cloud Firestore as the default data store. The backend exposes a storage abstraction that can point to Firestore or any HTTPS-accessible database (e.g., MongoDB Data API) via environment configuration.

Use when:
- Backend-heavy apps with multiple entities and server-side persistence
- Chats, ecommerce, dashboards
- Cost-effective persistence
- General purpose storage for any multi-entity data

Avoid when:
- Static/SPAs with no backend
- SEO/SSR landing pages
- You need direct access to platform-specific features

Note: Defaults to Google Cloud (App Engine + Firestore) but remains platform-agnostic. Swap providers (e.g., MongoDB) by supplying HTTPS credentials via environment variables.

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Backend data layer with pluggable providers (`firestore` by default, `http` proxy for others)
- Works on Cloudflare Workers, Google App Engine, or any hosting platform that can expose the same environment variables


