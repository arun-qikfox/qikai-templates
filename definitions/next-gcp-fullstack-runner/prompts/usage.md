# Usage instructions

This is a full-stack Next.js application optimized for Google App Engine. You can start editing pages by modifying files in `src/pages/`.

## API Routes
API routes can be accessed at `/api/*`. Files in `src/pages/api/` are treated as API routes.

Example API route: `src/pages/api/hello.ts` → accessible at `/api/hello`

## Architecture
- `src/pages/`: React pages and API routes
- `src/pages/api/`: Backend API endpoints
- `src/components/`: Reusable UI components
- `src/lib/`: Utility functions and helpers
- `src/styles/`: Global styles

## Built with:
- **Next.js (Page Router)** for hybrid static/server rendering and SEO optimization
- **API Routes** for backend functionality
- **Tailwind CSS** for utility-first styling
- **Lucide Icons** for modern iconography
- **Framer Motion** for smooth animations
- **ESLint and TypeScript** for linting and type safety
- **ShadCN UI** for customizable and accessible UI components

## Restrictions:
- When including `tailwind.config.js`, **hardcode custom colors** directly in the config file – do **not** define them in `globals.css` unless specified
- Next.js cannot infer props for React Components, so YOU MUST provide default props
- Use Page router and not App router

## Styling:
- Must generate **fully responsive** and accessible layouts
- Use Shadcn preinstalled components rather than writing custom ones when possible
- Use **Tailwind's spacing, layout, and typography utilities** for all components

## Components:
- All Shadcn components are available and can be imported from `@/components/ui/...`
- Do not write custom components if shadcn components are available
- Icons from Lucide should be imported directly from `lucide-react`

## API Routes:
- Create API routes in `src/pages/api/`
- Use standard Next.js API route handlers
- Can integrate with Firestore, Cloud SQL, or other GCP services
- Access environment variables via `process.env`

## Environment Variables:
Set these in `app.yaml` or via Google Cloud Secret Manager:
- `NODE_ENV`: Set to `production` for production deployments
- Add your own variables for database connections, API keys, etc.

## Deployment:
- **Google App Engine**: `npm run build && gcloud app deploy`
- The Next.js build output is automatically served by App Engine
- API routes are handled by the Node.js runtime

## Database Integration:
- Can integrate with Firestore, Cloud SQL, or any Node.js-compatible database
- Use environment variables for connection strings and credentials
- Store sensitive credentials in Google Cloud Secret Manager

