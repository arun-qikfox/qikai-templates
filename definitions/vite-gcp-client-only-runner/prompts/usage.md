# Usage

## Overview
Frontend-only React + Vite starter optimized for Google App Engine static hosting. This template is perfect for building static websites, landing pages, and SPAs that don't require backend functionality.

- **Frontend**: React Router 6, ShadCN UI, Tailwind, TypeScript
- **Build**: Vite for fast development and optimized production builds
- **Deployment Target**: Google App Engine (static file serving)

## Important: Demo Content
The bundled pages and routes are for reference only.
- Replace `HomePage.tsx` with your actual UI
- Customize components in `src/components/`
- Update routing in `src/main.tsx` if needed

## Architecture
- `src/`: Frontend React application
- `src/pages/`: Page components
- `src/components/`: Reusable UI components
- `src/lib/`: Utility functions and helpers
- `public/`: Static assets

## Development
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Styling & Frontend
- Keep Tailwind customization in `tailwind.config.js`
- Prefer provided ShadCN components
- Handle loading/error states in the UI
- Use React Router for client-side navigation

### Theme & Color System
- Theme toggle is available in the layout
- Light mode is the primary spec, but dark mode must ship simultaneously
- Use Tailwind `dark:` modifiers and CSS variables defined in `src/index.css`
- Avoid hard-coded text/background colors inside components

## Deployment
- **Google App Engine**: `npm run build && gcloud app deploy`
- The build output (`dist/client/`) is served as static files—do **not** change the Vite `build.outDir`
- No server-side code is required or deployed

## Static File Serving
App Engine serves the built static files from `dist/client/`:
- `index.html` is served for all routes (SPA routing)
- All assets (JS, CSS, images) are served with appropriate caching headers
- The `app.yaml` configuration handles routing for client-side navigation

