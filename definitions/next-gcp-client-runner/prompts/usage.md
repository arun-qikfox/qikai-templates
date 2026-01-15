# Usage instructions

This is a Next.js frontend-oriented application optimized for Google App Engine with minimal service requirements. Perfect for SEO-optimized sites that benefit from server-side rendering but have minimal backend needs.

## Pages
You can start editing pages by modifying files in `src/pages/`. The page auto-updates as you edit the file.

## API Routes (Optional)
Basic API routes can be accessed at `/api/*`. Files in `src/pages/api/` are treated as API routes.

Example API route: `src/pages/api/hello.ts` → accessible at `/api/hello`

Note: This template is optimized for frontend-heavy workloads. Use API routes sparingly for simple operations only.

## Architecture
- `src/pages/`: React pages (with SSR support)
- `src/pages/api/`: Optional basic API endpoints (use minimally)
- `src/components/`: Reusable UI components
- `src/lib/`: Utility functions and helpers
- `src/styles/`: Global styles

## Built with:
- **Next.js (Page Router)** for hybrid static/server rendering and SEO optimization
- **Tailwind CSS** for utility-first styling
- **Lucide Icons** for modern iconography
- **Framer Motion** for smooth animations
- **ESLint and TypeScript** for linting and type safety
- **ShadCN UI** for customizable and accessible UI components

## Restrictions:
- When including `tailwind.config.js`, **hardcode custom colors** directly in the config file – do **not** define them in `globals.css` unless specified
- Next.js cannot infer props for React Components, so YOU MUST provide default props
- Use Page router and not App router
- Keep API routes minimal - this template is optimized for frontend workloads
- Do not modify template-owned config files like `vite.config.ts` or `tsconfig*.json`
- If a change is required, request it instead of editing those files

## Styling:
- Must generate **fully responsive** and accessible layouts
- Use Shadcn preinstalled components rather than writing custom ones when possible
- Use **Tailwind's spacing, layout, and typography utilities** for all components

## Components:
- All Shadcn components are available and can be imported from `@/components/ui/...`
- Do not write custom components if shadcn components are available
- Icons from Lucide should be imported directly from `lucide-react`

## Server-Side Rendering:
- Leverage Next.js SSR for SEO optimization
- Use `getServerSideProps` for dynamic server-rendered content
- Use `getStaticProps` and `getStaticPaths` for static generation when possible
- Pages are server-rendered by default for optimal SEO

## Environment Variables:
Set these in `app.yaml` or via Google Cloud Secret Manager:
- `NODE_ENV`: Set to `production` for production deployments
- Add minimal environment variables as needed

## Deployment:
- **Google App Engine**: `npm run build && gcloud app deploy`
- The Next.js build output is automatically served by App Engine
- Optimized for minimal instance usage (F1 instance class, 0-1 instances)

## Performance Optimization:
- This template is configured for minimal resource usage
- Use static generation (`getStaticProps`) when possible to reduce server load
- Keep API routes simple and lightweight
- Leverage Next.js Image optimization for better performance

