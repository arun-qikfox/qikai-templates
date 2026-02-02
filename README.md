# Cloudflare VibeSDK Templates

This repository contains the official template catalog used by the Cloudflare VibeSDK project — a modern, open source “vibe coding” starter kit where users can build apps with AI agents. The goal of VibeSDK is to let anyone run their own vibe-coding platform on a Cloudflare Workers paid account with a streamlined, one-click deployment.

These templates are the scaffolding that VibeSDK’s AI agents use to generate full applications for users. They are kept lightweight, production-minded, and type-safe.


## Repository Layout

- `reference/`
  - Base reference templates (e.g., `vite-reference/`, `next-reference/`) used as the starting point for all generated templates.
- `definitions/`
  - One YAML definition per template (e.g., `vite-cfagents-runner.yaml`).
  - A folder per template containing overlay files that override the base reference (e.g., `definitions/vite-cfagents-runner/...`).
- `build/`
  - Output folder for generated templates. Always safe to delete and regenerate.
- `originals/`
  - Ground truth templates used for verification parity checks. This ensures generated templates match known-good originals.
- `tools/`
  - Utility scripts, notably `tools/generate_templates.py` for generation and verification.
- `zips/`
  - Where packaged zip archives are created for publishing.
- Top-level scripts and files
  - `deploy_templates.sh` — end-to-end generation, packaging, and upload.
  - `create_zip.py` — portable zip creation tool.
  - `generate_template_catalog.py` — creates the aggregated `template_catalog.json` used by the platform.
  - `template_catalog.json` — the published catalog of templates and metadata.


## Quick Start

Prerequisites:
- Python 3.10+
- Bun (for template viability checks when verifying)
- Cloudflare Wrangler CLI (for R2 uploads during deploy)

Clone and build all templates:
```bash
python3 tools/generate_templates.py --clean
```

Generate the catalog from the `build/` directory:
```bash
python3 generate_template_catalog.py --output template_catalog.json --pretty
```

Package all templates and upload them (requires R2 configuration):
```bash
# R2_BUCKET_NAME must be set in your environment
bash deploy_templates.sh
```


## Dynamic Template Generation

Templates are generated dynamically from:
- A base reference (e.g., `reference/vite-reference/`)
- A template definition YAML (e.g., `definitions/vite-cfagents-runner.yaml`)
- Overlay files that live under `definitions/<template-name>/`

The generator copies the base reference into `build/<template-name>/` and then applies overlays on top. Finally, it applies excludes and optional `package.json` patches.

Run generation for all templates:
```bash
python3 tools/generate_templates.py --clean
```

Generate a single template:
```bash
python3 tools/generate_templates.py -t vite-cfagents-runner
```


## Verification and Viability Checks

Verification compares `build/` to `originals/` to ensure exact parity.
- Text files are compared with normalized end-of-line handling (LF vs CRLF) and a single trailing newline is ignored to reduce false diffs.
- Build artifacts, lockfiles, and platform caches are ignored by default.

Verify all templates and show diffs:
```bash
python3 tools/generate_templates.py --verify --diffs
```

Verify one template and skip Bun checks:
```bash
python3 tools/generate_templates.py -t vite-cfagents-runner --verify --diffs --no-bun
```

Notes:
- By default, generation does not verify. Add `--verify` to verify and run Bun install/lint/build checks.
- Add `--no-bun` to skip Bun during verification.


## Packaging and Deployment

We ship templates as zipped archives and a JSON catalog for consumption by VibeSDK.

Create a zip for a single template:
```bash
python3 create_zip.py build/vite-cfagents-runner zips/vite-cfagents-runner.zip
```

`create_zip.py` excludes common artifacts by default:
- `node_modules/`, `dist/`, `.next/`, coverage output
- `.wrangler/`, `.dev.vars*`, `.env.*`, VCS metadata

Full deploy flow:
```bash
# Requires Cloudflare Wrangler and an R2 bucket
# Set: export R2_BUCKET_NAME=<your-bucket-name>

bash deploy_templates.sh
```
The deploy script:
- Generates templates into `build/`
- Produces `template_catalog.json` (scanner default points to `./build`)
- Zips each valid template from `build/`
- Uploads the catalog and all zips to R2


## Extending and Creating Templates

To create a new template, follow this overlay-first pattern.

1) Create a definition YAML in `definitions/`:
```yaml
# definitions/my-awesome-runner.yaml
name: "my-awesome-runner"
description: "Short description of this template"
base_reference: "vite-reference"  # or "next-reference"

# Optional: shallow package.json patches (deep merge)
package_patches:
  name: "my-awesome-runner"

# Optional: files to exclude from the base reference (glob patterns)
excludes:
  - "src/pages/**"            # remove reference-only pages
  - "src/hooks/use-theme.ts"  # remove reference-only hook

# Optional: only copy a subset of overlay files (rare).
# If omitted, the entire overlay directory is applied.
# template_specific_files:
#   - "src/App.tsx"
#   - "wrangler.jsonc"
```

2) Add overlay files under `definitions/my-awesome-runner/`:
- Any file placed here will overwrite the corresponding path in the generated `build/` template
- Common overlays:
  - `.gitignore`, `.important_files.json`, `package.json`, `wrangler.jsonc`, `tsconfig.*.json`
  - `src/*` files that differ from the base reference
  - `worker/*` files for Workers-based templates
  - **GCP full-stack**: `server.ts`, `worker/*`, `shared/*`, `app.yaml`, `.gcloudignore` — see [GCP Full-Stack Template Standards](#gcp-full-stack-template-standards)

3) Generate and verify:
```bash
python3 tools/generate_templates.py -t my-awesome-runner --verify --diffs
```

4) Package and publish:
```bash
python3 create_zip.py build/my-awesome-runner zips/my-awesome-runner.zip
# or run the full deploy script if uploading to Cloudflare R2
bash deploy_templates.sh
```


## Definition YAML Reference (current generator)

Supported fields in `definitions/*.yaml`:
- `name` (string)
- `description` (string)
- `base_reference` (string: `vite-reference` | `next-reference`)
- `package_patches` (object)
  - Shallow/deep-merge patches applied to `package.json` in the build output.
- `excludes` (string[])
  - Glob patterns to remove files introduced by the base reference or overlays.
- `template_specific_files` (string[]; optional)
  - When provided, only these overlay files are applied. Otherwise, the entire overlay directory is applied.

Notes:
- Overlays are applied after copying the base reference, so overlay files always take precedence.
- Keep overlays minimal and focused. If a file matches the original reference, omit it from the overlay.


## Template Catalog

The template catalog is a machine-readable JSON file used by VibeSDK. Generate from `build/`:
```bash
python3 generate_template_catalog.py --output template_catalog.json --pretty
```
This script will scan the generated templates and collate metadata and documentation suitable for display in the VibeSDK UI.


## Conventions and Quality

- Keep templates small, type-safe, and production-minded.
- Favor overlays + excludes over per-file lists to stay DRY.
- Maintain parity with `originals/` by running verification when templates change.
- Avoid `any` in TypeScript. Prefer strict typing across templates.
- Keep README content inside each template minimal; the global catalog summarizes key usage and selection guidelines.


## GCP Full-Stack Template Standards

Templates targeting Google App Engine (GCP) full-stack deployment **must** follow these standards to ensure correct bundling and avoid 500/503 errors at runtime.

### 1. Server Entry Point (`server.ts`)

- **Use static import** for the backend — never dynamic `import()` at runtime.
- Import the Hono app from `./worker/index.js` with explicit `.js` extension (Node ESM requirement).

```typescript
import { serve } from '@hono/node-server';
import { app } from './worker/index.js';

const port = Number(process.env.PORT ?? process.env.SERVICE_PORT ?? 8080);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[server] listening on http://localhost:${info.port}`);
});
```

- **Why**: The deployment pipeline bundles `server.ts` + `worker/**` into a single `dist/server.js` using esbuild. Static imports allow the bundler to inline all code and eliminate runtime `ERR_MODULE_NOT_FOUND` and `ERR_UNSUPPORTED_DIR_IMPORT` errors.

### 2. Worker Entry Point (`worker/index.ts`)

- **Export the Hono app** as a named export: `export { app }`.
- The worker is the backend (API routes, Hono app); it runs in Node.js via `@hono/node-server`, not in Cloudflare Workers.

```typescript
// worker/index.ts
import { Hono } from 'hono';
// ... routes, middleware, etc.
export const app = new Hono();
export { app };
```

### 3. Path Aliases (`@shared/*`)

- Worker code may use `@shared/*` for types and utilities (e.g. `@shared/types`, `@shared/mock-data`).
- The bundler resolves `@shared` → `./shared` via `--alias:@shared=./shared`.
- Ensure `shared/` contains the expected types and mock data.

### 4. Build Output

- Frontend: `vite build` or `build:client` → `dist/client/`
- Backend: esbuild bundles `server.ts` + `worker/**` → `dist/server.js`
- App Engine runs `node dist/server.js` as the entry point.

### 5. Environment Variables & Fallbacks

- **Always use fallback constants**: `process.env.X ?? DEFAULT_X`. Never use raw `process.env.X` without a fallback.
- **Centralize defaults** in `shared/config.ts` (e.g. `DEFAULT_PORT`, `DEFAULT_DATA_PROVIDER`).
- **Datastore (default)**: Uses Application Default Credentials (ADC) when running on GCP. No service account keys required.
- **Firestore**: When explicitly selected, requires `FIRESTORE_PROJECT_ID`, `FIRESTORE_CLIENT_EMAIL`, `FIRESTORE_PRIVATE_KEY_B64`.

### Reference Implementation

See `definitions/vite-gcp-fullstack-runner/` for a complete reference:
- `server.ts` — static import from `./worker/index.js`
- `worker/index.ts` — exports `{ app }`
- `tsconfig.server.json` — paths for `@shared/*` (used if tsc fallback is needed)


## Troubleshooting

- Missing template in `build/`:
  - Ensure the YAML exists in `definitions/` and `base_reference` points to an existing reference.
- Verification failures:
  - Use `--diffs` to print unified diffs, adjust overlays or excludes accordingly.
- Bun checks failing:
  - Ensure Bun is installed and available in PATH. Use `--no-bun` to skip temporarily.
- R2 upload errors:
  - Verify Wrangler login, `R2_BUCKET_NAME` environment variable, and bucket permissions.


## About VibeSDK

Cloudflare VibeSDK is an open source platform for building vibe coding experiences. This repository provides the curated, production-minded templates that VibeSDK’s AI agents use to scaffold applications. The full platform can be deployed to a Cloudflare Workers paid account.

If you’re building your own vibe coding platform, these templates provide a solid and extensible foundation.
