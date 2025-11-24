# VibSDK Cloud Run App Template

This Docker context is a lightweight scaffold for packaging generated VibSDK applications as OCI images and deploying them to Google Cloud Run.

## Structure

- `Dockerfile` &ndash; multi-stage build that installs dependencies, runs `npm run build` (when defined), and produces a production-ready runtime image.
- `entrypoint.sh` &ndash; runtime launcher that:
  1. Executes `$START_COMMAND` when provided.
  2. Falls back to `npm run start` if the app defines a `start` script.
  3. Serves the `dist/` directory via [`serve`](https://www.npmjs.com/package/serve) when no start script exists.
- `.dockerignore` &ndash; keeps local development artefacts out of the image layer cache.

## Usage

1. Copy your generated application source into a working directory alongside these template files.
2. Build the image (substitute `APP_NAME` and registry details as required):
   ```bash
   docker build -t gcr.io/PROJECT_ID/APP_NAME:latest -f templates/cloudrun-app/Dockerfile .
   ```
3. Push and deploy with your preferred workflow (e.g., `gcloud run deploy`, Cloud Build).

When the generated application lacks a custom server, the entrypoint automatically serves the static build output. To customise runtime behaviour (setting environment variables, alternate commands, etc.), override `START_COMMAND` at deploy time.
