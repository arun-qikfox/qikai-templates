# VibeSDK Project Context - Debugging Guide

## Project Overview

**VibeSDK** is an open-source AI-powered web application generator built on Cloudflare's platform. It allows users to describe applications in natural language, and AI agents generate, deploy, and manage full-stack applications.

### Key Components

1. **Main Platform (vibesdk/)**: The core platform that runs on Cloudflare Workers
2. **Templates Repository (qikai-templates/)**: Template definitions for generated applications
3. **Reference Implementation (vibe-sdk-unchanged/)**: Original codebase kept for reference (DO NOT MODIFY)

## Current Architecture

### Deployment Targets
- **Primary**: Google App Engine (GCP) - Default deployment target
- **Secondary**: Cloudflare Workers - Original deployment target (still supported)

### Data Storage Strategy
- **Default**: Google Cloud Firestore (NoSQL document database)
- **Alternative**: HTTP-based data provider (for MongoDB, custom REST APIs, etc.)
- **Database**: PostgreSQL (via Cloud SQL) for SQL needs

### Template System
- Templates are stored in `qikai-templates/definitions/`
- Templates can be fetched from:
  - Git repository (default)
  - HTTP/HTTPS source (e.g., Google Cloud Storage bucket)
- Template catalog: `template_catalog.json`
- Templates are packaged as `.zip` files and uploaded to Cloudflare R2

## Recent Changes

### Version Updates (Latest)
- All template `package.json` files updated to version `0.1.1`
- Updated templates:
  - `vite-cfagents-runner`
  - `vite-cf-DO-runner`
  - `vite-cf-DO-v2-runner`
  - `c-code-next-runner`
  - `vite-reference` (c-code-react-runner)

### Multi-Platform Support Implementation
1. **Templates Refactored**: All templates now use Firestore-first data abstraction
2. **Platform-Agnostic Code**: Generated apps work on both Cloudflare Workers and Google App Engine
3. **Data Provider Abstraction**: `createDataStore()` function supports:
   - Firestore (default)
   - HTTP proxy (for any HTTPS-accessible database)

### Google App Engine Deployment
- Static frontend deployment implemented
- Backend API support via Hono Node adapter
- `app.yaml` generation for App Engine configuration
- `.gcloudignore` generation for optimized deployments
- Service name hashing for URL length constraints

## Current Issue: WebSocket Connection Failure

### Problem Description
After "Bootstrapping complete, now creating a blueprint for you..." message, the WebSocket connection fails and the application doesn't progress further.

### Symptoms
- WebSocket connection established successfully
- Bootstrapping completes
- Blueprint generation starts but connection fails
- No error messages displayed to user
- Application stuck at blueprint generation stage

### Root Cause Analysis (Planned)
Based on code analysis, potential issues:

1. **Missing Error Handling**: `generateBlueprint()` in `simpleGeneratorAgent.ts` (line 279) lacks try-catch
2. **Missing Semicolon**: Line 295 in `simpleGeneratorAgent.ts` - missing semicolon after `generateBlueprint()` call
3. **Unhandled Initialization Errors**: Agent initialization errors may not be properly propagated to WebSocket
4. **Streaming Issues**: Blueprint chunk streaming may fail silently

### Files to Investigate
- `worker/agents/core/simpleGeneratorAgent.ts` - Agent initialization and blueprint generation
- `worker/agents/planning/blueprint.ts` - Blueprint generation logic
- `worker/api/controllers/agent/controller.ts` - WebSocket connection handling
- `worker/agents/core/websocket.ts` - WebSocket message handling
- `src/routes/chat/chat.tsx` - Frontend WebSocket connection

## Key Files and Their Purposes

### Core Agent Files
- `worker/agents/core/simpleGeneratorAgent.ts`: Main agent class, handles code generation lifecycle
- `worker/agents/core/websocket.ts`: WebSocket message routing and handling
- `worker/agents/planning/blueprint.ts`: Blueprint generation using AI
- `worker/agents/operations/`: Phase generation, implementation, code review operations

### Deployment Files
- `worker/services/deployer/appengine-deployer.ts`: App Engine deployment orchestrator
- `worker/services/deployer/appengine-yaml-generator.ts`: App Engine YAML configuration generator
- `worker/services/sandbox/sandboxSdkClient.ts`: Sandbox service client, handles deployments

### API Controllers
- `worker/api/controllers/agent/controller.ts`: Agent API endpoints and WebSocket handling
- `worker/api/routes/codegenRoutes.ts`: Code generation API routes

### Frontend Files
- `src/routes/chat/chat.tsx`: Main chat interface
- `src/routes/chat/utils/handle-websocket-message.ts`: WebSocket message handling
- `src/routes/chat/hooks/use-chat.ts`: Chat state management

### Template Files
- `qikai-templates/definitions/`: Template definitions
- `qikai-templates/template_catalog.json`: Template catalog
- `qikai-templates/deploy_templates.sh`: Template deployment script

## Environment Variables

### Required for GCP Deployment
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `GCP_SERVICE_ACCOUNT_KEY`: Service account JSON key (base64 encoded)
- `GCP_REGION`: Deployment region (e.g., `us-central1`)

### Required for Firestore
- `FIRESTORE_PROJECT_ID`: Firestore project ID
- `FIRESTORE_CLIENT_EMAIL`: Service account email
- `FIRESTORE_PRIVATE_KEY_B64`: Base64-encoded private key
- `FIRESTORE_DATABASE_ID`: (Optional) Database ID
- `FIRESTORE_API_ENDPOINT`: (Optional) Custom API endpoint

### Template Repository
- `TEMPLATES_REPOSITORY`: Can be:
  - Git URL (e.g., `https://github.com/user/repo.git`)
  - HTTP URL (e.g., `https://storage.googleapis.com/qfx-app-templates`)

## Important Constraints

### DO NOT MODIFY
- `vibe-sdk-unchanged/` folder - Reference only, never modify
- `qikai-templates/` - Only modify for template-related changes

### Template Structure
- Templates must have:
  - `package.json` with version field
  - `wrangler.jsonc` or `wrangler.toml`
  - `prompts/` directory with `selection.md` and `usage.md`
  - `worker/` directory for backend code
  - `src/` directory for frontend code

### Data Provider Pattern
All templates use the abstraction pattern:
```typescript
import { createDataStore } from './core-utils';

const store = createDataStore(env);
// Use store.list(), store.get(), store.create(), store.update(), store.delete()
```

## Debugging Workflow

### 1. Check WebSocket Connection
- Browser DevTools → Network → WS filter
- Look for connection errors or unexpected closures
- Check WebSocket message flow

### 2. Check Server Logs
- Cloudflare Workers logs (via dashboard)
- Look for errors in:
  - Agent initialization
  - Blueprint generation
  - WebSocket message handling

### 3. Verify Agent State
- Check if agent is properly initialized
- Verify Durable Object is accessible
- Check agent state via API: `/api/agent/:agentId`

### 4. Test Blueprint Generation
- Check if `generateBlueprint()` is being called
- Verify AI inference is working
- Check for rate limiting or API errors

### 5. Verify Error Propagation
- Ensure errors are caught and broadcast to WebSocket
- Check frontend error handling
- Verify error messages are displayed

## Next Steps for Debugging

1. **Add Error Handling**: Wrap `generateBlueprint()` in try-catch
2. **Fix Syntax**: Add missing semicolon at line 295
3. **Improve Logging**: Add detailed logs for blueprint generation
4. **Test WebSocket**: Verify connection stability during long operations
5. **Error Display**: Ensure errors are shown to users

## Template Deployment Process

1. **Generate Templates**: `python3 tools/generate_templates.py --clean`
2. **Generate Catalog**: `python3 generate_template_catalog.py`
3. **Create Zips**: Script creates optimized zip files
4. **Upload to R2**: Uploads catalog and zips to Cloudflare R2 bucket
5. **Verify**: Check R2 bucket contents

## Common Issues and Solutions

### Issue: Templates not loading
- **Check**: `TEMPLATES_REPOSITORY` environment variable
- **Verify**: R2 bucket has `template_catalog.json` and zip files
- **Test**: HTTP access to template URLs

### Issue: Deployment failures
- **Check**: GCP credentials are valid
- **Verify**: Service account has required permissions
- **Check**: `gcloud CLI` is available in sandbox

### Issue: WebSocket disconnections
- **Check**: Timeout settings
- **Verify**: Agent is responding to messages
- **Check**: Error handling in message handlers

## Testing Checklist

- [ ] WebSocket connection establishes
- [ ] Bootstrapping completes
- [ ] Blueprint generation starts
- [ ] Blueprint chunks are received
- [ ] Blueprint generation completes
- [ ] Error messages are displayed on failure
- [ ] Application progresses to code generation

## Useful Commands

```bash
# Check template versions
grep -r '"version"' qikai-templates/definitions/*/package.json

# Test template deployment
cd qikai-templates
./deploy_templates.sh

# Check WebSocket in browser console
# Open DevTools → Network → WS → Select connection → Messages

# View Cloudflare Workers logs
wrangler tail

# Test agent API
curl https://your-domain.com/api/agent/:agentId
```

## Contact and Resources

- **Documentation**: `docs/gcp-support/` for GCP-specific docs
- **Deployment Dependencies**: `docs/gcp-support/@deployment-dependencies.md`
- **Architecture**: `docs/gcp-support/deployment-dependencies.md`

---

**Last Updated**: Based on latest changes - Template version updates to 0.1.1
**Current Focus**: Debugging WebSocket connection failure during blueprint generation

