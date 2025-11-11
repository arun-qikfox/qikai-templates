# Quick Reference - VibeSDK Debugging

## 🚨 Current Issue
**WebSocket fails during blueprint generation** after "Bootstrapping complete, now creating a blueprint for you..."

## 🔍 Quick Debug Steps

### 1. Check Browser Console
```
DevTools → Network → WS → Select connection → Messages
Look for: connection errors, unexpected closes, missing messages
```

### 2. Check Server Logs
```bash
wrangler tail
# Or Cloudflare Dashboard → Workers → Logs
Look for: "Generating blueprint", errors, WebSocket issues
```

### 3. Test Agent State
```bash
curl https://your-domain.com/api/agent/:agentId
# Should return agent state with blueprint
```

## 📁 Key Files

| File | Purpose | Issue Location |
|------|---------|----------------|
| `worker/agents/core/simpleGeneratorAgent.ts` | Agent initialization | Line 279-295 (blueprint generation) |
| `worker/agents/planning/blueprint.ts` | Blueprint generation | Line 178-250 |
| `worker/api/controllers/agent/controller.ts` | WebSocket handling | Line 136-148, 179-251 |
| `worker/agents/core/websocket.ts` | Message routing | Line 10-258 |
| `src/routes/chat/utils/handle-websocket-message.ts` | Frontend handler | All message types |

## 🐛 Known Issues

1. **Missing error handling** around `generateBlueprint()` call
2. **Missing semicolon** at line 295 in `simpleGeneratorAgent.ts`
3. **Unhandled initialization errors** may not reach WebSocket
4. **No error propagation** for blueprint generation failures

## ✅ Quick Fixes

### Fix 1: Add Try-Catch (HIGH PRIORITY)
```typescript
// In simpleGeneratorAgent.ts line 279
try {
    const blueprint = await generateBlueprint({...});
} catch (error) {
    this.logger().error("Blueprint generation failed:", error);
    this.broadcast(WebSocketMessageResponses.ERROR, {
        error: `Failed: ${error.message}`
    });
    throw error;
}
```

### Fix 2: Add Semicolon (HIGH PRIORITY)
```typescript
// Line 295 - Change:
})  // ❌ Missing semicolon
// To:
});  // ✅ Fixed
```

## 🔧 Environment Variables

```bash
# GCP Deployment
GCP_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_KEY=base64-encoded-key
GCP_REGION=us-central1

# Firestore
FIRESTORE_PROJECT_ID=your-project-id
FIRESTORE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIRESTORE_PRIVATE_KEY_B64=base64-encoded-key

# Templates
TEMPLATES_REPOSITORY=https://storage.googleapis.com/qfx-app-templates
```

## 📊 Template Versions

All templates updated to **version 0.1.1**:
- `vite-cfagents-runner`
- `vite-cf-DO-runner`
- `vite-cf-DO-v2-runner`
- `c-code-next-runner`
- `vite-reference`

## 🚫 DO NOT MODIFY

- `vibe-sdk-unchanged/` - Reference only
- Original Cloudflare-specific templates (unless explicitly refactoring)

## 📚 Full Documentation

- **Context**: `CONTEXT.md` - Complete project overview
- **Debugging**: `DEBUGGING-WEBSOCKET.md` - Detailed debugging guide
- **GCP Docs**: `../vibesdk/docs/gcp-support/` - GCP-specific documentation

## 🎯 Next Steps

1. Apply fixes from `DEBUGGING-WEBSOCKET.md`
2. Test WebSocket connection stability
3. Verify blueprint generation completes
4. Check error messages are displayed

---

**Last Updated**: Template versions → 0.1.1  
**Current Focus**: WebSocket blueprint generation failure

