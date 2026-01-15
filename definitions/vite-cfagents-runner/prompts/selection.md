# Template Selection Guidelines

This template delivers a production-ready AI chat experience with streaming responses, tool calling, and session persistence backed by Firestore (default) or any HTTPS-accessible datastore. It runs on Google App Engine by default and remains portable to Cloudflare Workers or other hosts through configuration.

## Template Constraints
- Do not modify template-owned config files like `vite.config.ts` or `tsconfig*.json`.
- If a change is required, request it instead of editing those files.

* Use this template when you need:
  * Full-featured AI chat applications with tool/function calling
  * Multi-model support (Gemini, OpenAI, Claude via gateway URLs)
  * Persisted chat history, session management, and analytics stored in Firestore
  * Streaming responses with real-time UI updates
  * Integration points for Model Context Protocol (MCP) clients or custom tools

* Avoid it for:
  * Simple static websites without AI capabilities
  * Chatbots that only require a single Q&A flow without persistence
  * Projects where you don’t control API keys for AI gateways

* Built with:
  * Hono-based backend using provider-agnostic datastore helpers (Firestore default, HTTP fallback)
  * OpenAI SDK compatible with Google Cloud AI Gateway or other gateways
  * React + Vite frontend with Shadcn/UI, Tailwind, and Framer Motion
  * Optional MCP client integration via the official TypeScript SDK