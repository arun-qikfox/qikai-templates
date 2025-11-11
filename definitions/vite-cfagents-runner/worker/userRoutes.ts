import { Hono } from 'hono';
import { API_RESPONSES } from './config';
import {
  Env,
  getAiGatewayConfig,
  getSerpApiKey,
  ok,
  bad,
  notFound,
  parseLimit,
  isStr,
} from './core-utils';
import { ChatHandler } from './chat';
import type { ChatState, Message } from './types';
import {
  getOrCreateSession,
  saveSession,
  listSessions,
  deleteSession,
  updateSessionMetadata,
  clearAllSessions,
  getSessionCount,
  createEmptySession,
  defaultModel,
} from './sessionStore';

const toChatState = (session: Awaited<ReturnType<typeof getOrCreateSession>>): ChatState => ({
  sessionId: session.id,
  messages: session.messages,
  isProcessing: false,
  model: session.model,
});

/**
 * Core routes power the chat flow (messages, model updates, streaming responses)
 */
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/chat/:sessionId/messages', async (c) => {
    try {
      const sessionId = c.req.param('sessionId');
      const session = await getOrCreateSession(c.env, sessionId);
      return ok(c, toChatState(session));
    } catch (error) {
      console.error('Failed to load messages:', error);
      return c.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  });

  app.post('/api/chat/:sessionId/model', async (c) => {
    try {
      const sessionId = c.req.param('sessionId');
      const { model } = await c.req.json<{ model?: string }>();
      if (!isStr(model)) {
        return bad(c, API_RESPONSES.INVALID_MODEL, 400);
      }
      const updated = await updateSessionMetadata(c.env, sessionId, {
        model,
        lastActive: Date.now(),
      });
      if (!updated) {
        const created = createEmptySession(sessionId, { model });
        await saveSession(c.env, created);
        return ok(c, toChatState(created));
      }
      return ok(c, toChatState(updated));
    } catch (error) {
      console.error('Failed to update model:', error);
      return c.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  });

  app.delete('/api/chat/:sessionId/clear', async (c) => {
    try {
      const sessionId = c.req.param('sessionId');
      const session = await getOrCreateSession(c.env, sessionId);
      session.messages = [];
      session.lastActive = Date.now();
      await saveSession(c.env, session);
      return ok(c, toChatState(session));
    } catch (error) {
      console.error('Failed to clear session:', error);
      return c.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  });

  app.post('/api/chat/:sessionId/chat', async (c) => {
    try {
      const { message, model, stream } = await c.req.json<{ message?: string; model?: string; stream?: boolean }>();
      if (!isStr(message)) {
        return bad(c, API_RESPONSES.MISSING_MESSAGE, 400);
      }

      const sessionId = c.req.param('sessionId');
      let session = await getOrCreateSession(c.env, sessionId);

      if (model && model !== session.model) {
        session.model = model;
      }

      const now = Date.now();
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message.trim(),
        timestamp: now,
      };
      session.messages = [...session.messages, userMessage];
      session.lastActive = now;
      await saveSession(c.env, session);

      const { baseUrl, apiKey } = getAiGatewayConfig(c.env);
      const handler = new ChatHandler(baseUrl, apiKey, session.model, getSerpApiKey(c.env));

      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        (async () => {
          try {
            const response = await handler.processMessage(message, session.messages, (chunk) => {
              writer.write(encoder.encode(chunk));
            });

            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: response.content,
              timestamp: Date.now(),
              toolCalls: response.toolCalls,
            };

            session.messages = [...session.messages, assistantMessage];
            session.lastActive = Date.now();
            await saveSession(c.env, session);
          } catch (error) {
            console.error('Streaming chat error:', error);
            writer.write(encoder.encode('Sorry, something went wrong.'));
          } finally {
            writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      const response = await handler.processMessage(message, session.messages);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        toolCalls: response.toolCalls,
      };
      session.messages = [...session.messages, assistantMessage];
      session.lastActive = Date.now();
      await saveSession(c.env, session);
      return ok(c, toChatState(session));
    } catch (error) {
      console.error('Chat processing error:', error);
      return c.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  });
}

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/sessions', async (c) => {
    try {
      const limit = parseLimit(c.req.query('limit'), 50);
      const sessions = await listSessions(c.env, limit);
      return ok(c, sessions);
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return c.json({ success: false, error: 'Failed to retrieve sessions' }, { status: 500 });
    }
  });

  app.post('/api/sessions', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const { title, sessionId: providedSessionId, firstMessage } = body as {
        title?: string;
        sessionId?: string;
        firstMessage?: string;
      };

      const sessionId = providedSessionId || crypto.randomUUID();
      let resolvedTitle = isStr(title) ? title.trim() : undefined;
      if (!resolvedTitle) {
        const dateTime = new Date().toLocaleString([], {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        if (isStr(firstMessage) && firstMessage.trim()) {
          const clean = firstMessage.trim().replace(/\s+/g, ' ');
          const truncated = clean.length > 40 ? `${clean.slice(0, 37)}...` : clean;
          resolvedTitle = `${truncated} • ${dateTime}`;
        } else {
          resolvedTitle = `Chat ${dateTime}`;
        }
      }

      const existing = await getOrCreateSession(c.env, sessionId);
      existing.title = resolvedTitle;
      if (isStr(firstMessage) && existing.messages.length === 0) {
        existing.messages = [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: firstMessage.trim(),
            timestamp: Date.now(),
          },
        ];
      }
      existing.lastActive = Date.now();
      await saveSession(c.env, existing);

      return ok(c, { sessionId, title: resolvedTitle });
    } catch (error) {
      console.error('Failed to create session:', error);
      return c.json({ success: false, error: 'Failed to create session' }, { status: 500 });
    }
  });

  app.delete('/api/sessions/:sessionId', async (c) => {
    try {
      const sessionId = c.req.param('sessionId');
      const deleted = await deleteSession(c.env, sessionId);
      if (!deleted) {
        return notFound(c, 'Session not found');
      }
      return ok(c, { deleted: true });
    } catch (error) {
      console.error('Failed to delete session:', error);
      return c.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
    }
  });

  app.put('/api/sessions/:sessionId/title', async (c) => {
    try {
      const sessionId = c.req.param('sessionId');
      const { title } = await c.req.json<{ title?: string }>();
      if (!isStr(title)) {
        return bad(c, 'Title is required', 400);
      }

      const updated = await updateSessionMetadata(c.env, sessionId, {
        title: title.trim(),
        lastActive: Date.now(),
      });
      if (!updated) {
        return notFound(c, 'Session not found');
      }
      return ok(c, { title: updated.title });
    } catch (error) {
      console.error('Failed to update session title:', error);
      return c.json({ success: false, error: 'Failed to update session title' }, { status: 500 });
    }
  });

  app.get('/api/sessions/stats', async (c) => {
    try {
      const totalSessions = await getSessionCount(c.env);
      return ok(c, { totalSessions });
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return c.json({ success: false, error: 'Failed to retrieve session stats' }, { status: 500 });
    }
  });

  app.delete('/api/sessions', async (c) => {
    try {
      const deletedCount = await clearAllSessions(c.env);
      return ok(c, { deletedCount });
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
      return c.json({ success: false, error: 'Failed to clear all sessions' }, { status: 500 });
    }
  });
}
