# Usage Instructions

# Usage Instructions

Start customizing the UI in `src/pages/DemoPage.tsx`. The page auto-refreshes with Vite HMR.

The chat API lives under `/api/chat/:sessionId/*` and is implemented in `worker/userRoutes.ts`. These routes provide:
- `GET /messages` – load persisted conversation state
- `POST /chat` – send a message (supports streaming)
- `POST /model` – switch AI model
- `DELETE /clear` – reset conversation

Session management endpoints (`/api/sessions/*`) create, list, update, and clear chat sessions backed by Firestore (or any configured datastore).

## Built with
- React + Vite + Shadcn/UI for the frontend
- Tailwind CSS and Framer Motion for styling and animations
- Hono for the backend HTTP router
- Firestore datastore helpers (default) with HTTP-provider fallback
- OpenAI SDK compatible with Google Cloud AI Gateway or other multi-model gateways
- Optional MCP client integration (see `worker/mcp-client.ts`)

## Environment Variables
- `CF_AI_BASE_URL` – AI gateway base URL (required)
- `CF_AI_API_KEY` – gateway API key (required)
- `SERPAPI_KEY` – optional, enables web search tool
- Firestore defaults (required unless using HTTP provider):
  - `FIRESTORE_PROJECT_ID`
  - `FIRESTORE_CLIENT_EMAIL`
  - `FIRESTORE_PRIVATE_KEY_B64` (base64-encoded PEM)
  - Optional: `FIRESTORE_DATABASE_ID`, `FIRESTORE_API_ENDPOINT`
- HTTP provider (optional alternative):
  - `DATA_PROVIDER=http`
  - `DATA_HTTP_BASE_URL`
  - `DATA_HTTP_API_KEY` (optional)
  - `DATA_HTTP_HEADERS_JSON` (optional JSON for extra headers)

Store secrets securely (App Engine Secret Manager, `wrangler secret`, etc.).

## Restrictions & Best Practices
- Never expose API keys client-side.
- Reuse the provided session APIs rather than rolling your own.
- Validate tool inputs in `worker/tools.ts`; handle errors gracefully.
- Keep UI responsive and accessible; leverage existing Shadcn components.

## Backend Structure
- `worker/core-utils.ts` – datastore factory, gateway helpers, response helpers
- `worker/sessionStore.ts` – CRUD helpers for chat sessions
- `worker/chat.ts` – AI request/response pipeline (stream + tools)
- `worker/tools.ts` – tool orchestration, including SerpAPI + MCP
- `worker/userRoutes.ts` – Hono routes for chat & session APIs
- `worker/types.ts` – shared TypeScript interfaces
- `worker/mcp-client.ts` – optional MCP SDK bridge

## Frontend Helpers
- `src/lib/chat.ts` – chat service for calling backend APIs
- `src/pages/DemoPage.tsx` – demo UI showing streaming chat, sessions, and model switching

## Styling & Animations
- Use Tailwind utility classes for layout/spacing.
- Prefer existing Shadcn components (`@/components/ui/*`).
- Enhance interactions with Framer Motion (see demo page for patterns).

## MCP Integration (Optional)
- Add server configs to `worker/mcp-client.ts`.
- Tools discovered via MCP are automatically exposed to the chat handler.

## Important Notes
- Firestore persistence is built-in; use it to persist conversations, not mock data.
- Remind users about AI rate limits (e.g., add a footer note) so expectations are set.

This template defaults to Google Cloud but remains portable to other environments by switching environment variables. Use the existing APIs to build production-grade AI chat applications quickly.

# Available bindings:
**Only The following bindings are to be used in the project! Do not use any other bindings or remove/replace any of the bindings**
- `CHAT_AGENT`: A durable object binding for the chat agent, but can be extended and used for other agentic purposes
- `APP_CONTROLLER`: A durable object binding for the app controller, but can be extended and used for other agentic purposes
**IMPORTANT: You are NOT ALLOWED to edit/add/remove ANY worker bindings OR touch wrangler.jsonc/wrangler.toml. Build your application around what is already provided.**

# IMPORTANT NOTE: You must inform the user that although this project has AI capaibilities, There is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period. 
Add the above note in an appropriate and visible location in the app - like in the footer or in the chat interface or as a modal