# Template Selection

React/Vite frontend-only template optimized for Google App Engine static hosting. Perfect for single-page applications, landing pages, portfolios, and marketing sites that don't require server-side logic.

## Template Constraints
- Do not modify template-owned config files like `vite.config.ts` or `tsconfig*.json`.
- If a change is required, request it instead of editing those files.

Use when:
- Static websites and SPAs (Single Page Applications)
- Landing pages, portfolios, marketing sites
- Brochure websites and waitlist pages
- Client-side only applications with no backend requirements
- Deploying to Google App Engine with minimal resource usage

Avoid when:
- You need server-side API routes or backend logic
- You require server-side rendering (SSR)
- You need database connections or server-side data processing
- You need Cloudflare Workers-specific features

Note: Optimized for Google Cloud Platform (App Engine) with static file serving. The template builds a production-ready static site that can be served efficiently from App Engine.

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Static file serving via Google App Engine
- Standard Vite build process (no Cloudflare-specific build tools)
- Emits production assets to `dist/client/**` (required by App Engine preview/deploy)
- TypeScript for type safety

