# vite-gcp-fullstack-runner

This template is wired for Google App Engine full-stack previews. In order for
deployment to work the build **must** emit:

- `dist/client/index.html` – the browser bundle served by App Engine
- `dist/server.js` – the Node runtime entry point created from `server.ts`

## Build Commands

The `build` script already runs both the Vite client build and the lightweight
`server.ts` compiler:

```bash
bun run build
```

Please keep `build.outDir` set to `dist/client` in `vite.config.ts`. If you
change the Vite config the preview service will revert the setting to preserve
compatibility with GCP deployments.

## Server Harness

`server.ts` simply exports the Hono app via `@hono/node-server`. Keep this file
in the project so App Engine always has an HTTP entry point. If you need custom
middleware, add it in `worker/index.ts` and continue to export `{ app }`.

