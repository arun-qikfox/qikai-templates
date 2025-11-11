# WebSocket Blueprint Generation Failure - Debugging Guide

## Issue Summary

**Problem**: WebSocket connection fails after "Bootstrapping complete, now creating a blueprint for you..." message. Application doesn't progress beyond blueprint generation.

**Status**: Investigation in progress - Root cause analysis completed, fixes planned

## Code Flow Analysis

### Expected Flow
1. User creates app → `POST /api/agent/create`
2. Agent initialized → `agentInstance.initialize()`
3. Blueprint generation starts → `generateBlueprint()`
4. Blueprint chunks streamed → `onBlueprintChunk()` callback
5. Blueprint completes → State updated, WebSocket notified
6. Code generation begins

### Actual Flow (Broken)
1. ✅ User creates app
2. ✅ Agent initialized
3. ✅ Blueprint generation starts
4. ❌ **WebSocket connection fails here**
5. ❌ No blueprint chunks received
6. ❌ Application stuck

## Identified Issues

### Issue 1: Missing Error Handling
**File**: `worker/agents/core/simpleGeneratorAgent.ts`  
**Location**: Line 279-295  
**Problem**: `generateBlueprint()` call is not wrapped in try-catch

```typescript
// CURRENT (BROKEN):
const blueprint = await generateBlueprint({
    env: this.env,
    inferenceContext,
    query,
    language: language!,
    frameworks: frameworks!,
    templateDetails: templateInfo.templateDetails,
    templateMetaInfo: templateInfo.selection,
    images: initArgs.images,
    stream: {
        chunk_size: 256,
        onChunk: (chunk) => {
            initArgs.onBlueprintChunk(chunk);
        }
    }
})  // ❌ Missing semicolon

// SHOULD BE:
try {
    const blueprint = await generateBlueprint({
        // ... same config
    });  // ✅ Semicolon added
    
    // Continue with blueprint
} catch (error) {
    this.logger().error("Error generating blueprint:", error);
    this.broadcast(WebSocketMessageResponses.ERROR, {
        error: `Failed to generate blueprint: ${error instanceof Error ? error.message : String(error)}`
    });
    throw error; // Re-throw to prevent silent failure
}
```

### Issue 2: Missing Semicolon
**File**: `worker/agents/core/simpleGeneratorAgent.ts`  
**Location**: Line 295  
**Problem**: Missing semicolon after `generateBlueprint()` call

### Issue 3: Agent Initialization Error Handling
**File**: `worker/api/controllers/agent/controller.ts`  
**Location**: Line 136-148  
**Problem**: `agentPromise` errors may not be properly handled

```typescript
// CURRENT:
const agentPromise = agentInstance.initialize({...});
agentPromise.then(async (_state: CodeGenState) => {
    // Success handling
}).catch(error => {
    // Error handling - but may not reach WebSocket
});

// SHOULD ADD:
agentPromise.catch(error => {
    this.logger.error("Agent initialization failed:", error);
    // Send error to writer stream
    writer.write({
        error: `Agent initialization failed: ${error instanceof Error ? error.message : String(error)}`
    });
    writer.close();
});
```

### Issue 4: WebSocket Connection Validation
**File**: `worker/api/controllers/agent/controller.ts`  
**Location**: `handleWebSocketConnection()` method  
**Problem**: Need to verify agent is accessible before returning WebSocket

## Debugging Steps

### Step 1: Add Logging
Add detailed logging to track the flow:

```typescript
// In simpleGeneratorAgent.ts initialize() method:
this.logger().info('Starting blueprint generation', {
    queryLength: query.length,
    hasImages: !!initArgs.images,
    imageCount: initArgs.images?.length || 0
});

try {
    this.logger().info('Calling generateBlueprint()');
    const blueprint = await generateBlueprint({...});
    this.logger().info('Blueprint generated successfully', {
        blueprintTitle: blueprint?.title,
        phaseCount: blueprint?.initialPhase?.files?.length || 0
    });
} catch (error) {
    this.logger().error('Blueprint generation failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
}
```

### Step 2: Check Browser Console
1. Open browser DevTools
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Select the WebSocket connection
5. Check Messages tab for:
   - Connection establishment
   - Messages sent/received
   - Connection close reason
   - Error messages

### Step 3: Check Cloudflare Workers Logs
```bash
# View real-time logs
wrangler tail

# Or check in Cloudflare Dashboard
# Workers & Pages → Your Worker → Logs
```

Look for:
- "Generating blueprint" log
- "Blueprint generated successfully" log
- Any error messages
- WebSocket connection errors

### Step 4: Test Blueprint Generation Directly
Create a test endpoint to verify blueprint generation:

```typescript
// In worker/api/routes/codegenRoutes.ts (temporary)
app.post('/api/test/blueprint', async (c) => {
    try {
        const { query } = await c.req.json();
        const blueprint = await generateBlueprint({
            env: c.env,
            inferenceContext: {
                agentId: 'test',
                userId: 'test',
                userModelConfigs: {}
            },
            query,
            language: 'typescript',
            frameworks: [],
            templateDetails: {...}, // Get from template
            templateMetaInfo: {...}
        });
        return c.json({ success: true, blueprint });
    } catch (error) {
        return c.json({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        }, 500);
    }
});
```

### Step 5: Verify WebSocket Message Types
Check that all message types are properly defined:

```typescript
// In worker/api/websocketTypes.ts
// Verify these types exist:
- BLUEPRINT_CHUNK
- BLUEPRINT_COMPLETE
- BLUEPRINT_ERROR
- ERROR
```

### Step 6: Check Frontend WebSocket Handler
Verify frontend is handling all message types:

```typescript
// In src/routes/chat/utils/handle-websocket-message.ts
// Check that blueprint-related messages are handled:
case 'blueprint_chunk':
case 'blueprint_complete':
case 'blueprint_error':
```

## Fix Implementation Plan

### Fix 1: Add Error Handling to Blueprint Generation
**Priority**: HIGH  
**File**: `worker/agents/core/simpleGeneratorAgent.ts`  
**Lines**: 279-295

```typescript
// Generate a blueprint
this.logger().info('Generating blueprint', { query, queryLength: query.length, imagesCount: initArgs.images?.length || 0 });
this.logger().info(`Using language: ${language}, frameworks: ${frameworks ? frameworks.join(", ") : "none"}`);

let blueprint: Blueprint;
try {
    blueprint = await generateBlueprint({
        env: this.env,
        inferenceContext,
        query,
        language: language!,
        frameworks: frameworks!,
        templateDetails: templateInfo.templateDetails,
        templateMetaInfo: templateInfo.selection,
        images: initArgs.images,
        stream: {
            chunk_size: 256,
            onChunk: (chunk) => {
                try {
                    initArgs.onBlueprintChunk(chunk);
                } catch (chunkError) {
                    this.logger().error('Error sending blueprint chunk:', chunkError);
                }
            }
        }
    });
    this.logger().info('Blueprint generated successfully', { 
        title: blueprint?.title,
        phaseFilesCount: blueprint?.initialPhase?.files?.length || 0
    });
} catch (error) {
    this.logger().error('Blueprint generation failed:', error);
    this.broadcast(WebSocketMessageResponses.ERROR, {
        error: `Failed to generate blueprint: ${error instanceof Error ? error.message : String(error)}`
    });
    throw error; // Re-throw to prevent silent failure
}
```

### Fix 2: Improve Agent Initialization Error Handling
**Priority**: HIGH  
**File**: `worker/api/controllers/agent/controller.ts`  
**Lines**: 136-148

```typescript
const agentPromise = agentInstance.initialize({...}, body.agentMode || defaultCodeGenArgs.agentMode) as Promise<CodeGenState>;

// Add comprehensive error handling
agentPromise
    .then(async (_state: CodeGenState) => {
        // Existing success handling
    })
    .catch(error => {
        this.logger.error('Agent initialization failed:', error);
        
        // Send error to writer stream
        try {
            writer.write({
                error: `Agent initialization failed: ${error instanceof Error ? error.message : String(error)}`,
                agentId: agentId
            });
        } catch (writeError) {
            this.logger.error('Failed to write error to stream:', writeError);
        } finally {
            writer.close();
        }
    });
```

### Fix 3: Add Blueprint Generation Logging
**Priority**: MEDIUM  
**File**: `worker/agents/planning/blueprint.ts`  
**Lines**: 178-250

Add logging at key points:
- Before calling `executeInference`
- When chunks are received
- When blueprint completes
- On any errors

### Fix 4: Verify WebSocket Connection Stability
**Priority**: MEDIUM  
**File**: `worker/api/controllers/agent/controller.ts`  
**Lines**: 179-251

Ensure WebSocket connection remains open during long operations:
- Add keepalive/ping messages
- Handle connection timeouts
- Verify agent is accessible before returning WebSocket

## Testing After Fixes

1. **Create a new app** and monitor:
   - WebSocket connection status
   - Blueprint generation progress
   - Any error messages

2. **Check logs** for:
   - "Generating blueprint" message
   - "Blueprint generated successfully" message
   - Any error messages

3. **Verify frontend** receives:
   - Blueprint chunks
   - Blueprint completion message
   - Error messages (if any)

4. **Test error scenarios**:
   - Invalid query
   - Missing template
   - AI API failure
   - Network timeout

## Expected Behavior After Fixes

1. ✅ WebSocket connection remains stable
2. ✅ Blueprint generation starts
3. ✅ Blueprint chunks are received in frontend
4. ✅ Blueprint generation completes
5. ✅ Error messages are displayed if generation fails
6. ✅ Application progresses to code generation phase

## Rollback Plan

If fixes cause issues:
1. Revert changes to `simpleGeneratorAgent.ts`
2. Revert changes to `controller.ts`
3. Check original code in `vibe-sdk-unchanged/` for reference
4. Investigate alternative approaches

---

**Status**: Ready for implementation  
**Next Action**: Apply fixes in order of priority

