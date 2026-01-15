# Template Selection

Next.js frontend-oriented template optimized for Google App Engine with minimal service requirements. Perfect for SEO-optimized landing pages, marketing sites, and content-heavy applications that benefit from server-side rendering but have minimal backend needs.

## Template Constraints
- Do not modify template-owned config files like `vite.config.ts` or `tsconfig*.json`.
- If a change is required, request it instead of editing those files.

Use when:
- SEO-optimized landing pages and marketing sites
- Content-heavy websites with server-side rendering
- Portfolio sites and showcase applications
- Blogs and documentation sites
- Applications that need SSR but minimal API functionality
- Deploying to Google App Engine with cost-effective resource usage

Avoid when:
- Heavy backend processing or complex API requirements (use full-stack template)
- Static-only websites (use React/Vite client-only template)
- You need Cloudflare Workers-specific features
- Applications requiring extensive database operations

Note: Optimized for Google Cloud Platform (App Engine) with minimal instance requirements. Leverages Next.js SSR capabilities while keeping resource usage low. Can include basic API routes if needed, but optimized for frontend-heavy workloads.

Built with:
- **Next.js (Page Router)** for server-side rendering and SEO optimization
- **Tailwind CSS** for rapid UI development
- **Lucide Icons** for consistent iconography
- **Framer Motion** for animations
- **TypeScript** and **ESLint** for type safety and code quality

