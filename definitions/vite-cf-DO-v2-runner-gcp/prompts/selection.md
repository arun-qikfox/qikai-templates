# Template Selection

General-purpose full-stack application template optimized for Google Cloud App Engine with Firestore as the default data store. The backend exposes a storage abstraction that can point to Firestore or any HTTPS-accessible database (e.g., MongoDB Data API) via environment configuration.

## Template Constraints
- Do not modify template-owned config files like `vite.config.ts` or `tsconfig*.json`.
- If a change is required, request it instead of editing those files.

Use when:
- Backend-heavy apps with multiple entities and server-side persistence
- Chats, ecommerce, dashboards
- Cost-effective persistence on Google Cloud Platform
- General purpose storage for any multi-entity data
- Deploying to Google App Engine (Node.js runtime)

Avoid when:
- Static/SPAs with no backend
- SEO/SSR landing pages
- You need Cloudflare Workers-specific features
- You need direct access to Cloudflare bindings (KV, D1, Durable Objects)

Note: Optimized for Google Cloud Platform (App Engine + Firestore). Swap data providers (e.g., MongoDB) by supplying HTTPS credentials via environment variables. The server code uses Node.js-compatible exports.

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Backend data layer with pluggable providers (`firestore` by default, `http` proxy for others)
- Node.js-compatible server exports for Google App Engine deployment
- Standard Vite build process (no Cloudflare-specific build tools)


