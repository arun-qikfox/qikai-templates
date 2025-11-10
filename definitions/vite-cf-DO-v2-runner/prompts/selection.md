# Template Selection

General-purpose multi-entity storage application. Uses a single state store as the storage backend, wrapped so multiple entities (users, chats, orgs, etc.) can persist data via simple APIs.

Use when:
- Backend-heavy apps with multiple entities and server-side persistence
- Chats, ecommerce, dashboards
- Cost-effective persistence
- General purpose storage for any multi-entity data

Avoid when:
- Static/SPAs with no backend
- SEO/SSR landing pages
- You need direct access to platform-specific features

Note: Platform-agnostic storage abstraction. Works with Cloudflare Workers, Google App Engine, or any hosting platform.

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Platform-agnostic backend (can be deployed to Cloudflare Workers, Google App Engine, or any hosting platform)


