import { Hono } from 'hono';
import type { Env } from './core-utils.js';
import {
  ensureUserSeed,
  listUsers,
  createUser,
  deleteUser,
  deleteManyUsers,
  ensureChatSeed,
  listChats,
  createChat,
  deleteChat,
  deleteManyChats,
  listChatMessages,
  appendChatMessage,
} from './entities.js';
import { ok, bad, notFound, isStr, parseLimit } from './core-utils.js';
import type { ChatBoardState } from './entities.js';
import type { User, ChatMessage } from '@shared/types';

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'GCP Datastore Demo' } }));

  // USERS
  app.get('/api/users', async (c) => {
    await ensureUserSeed(c.env);
    const cursor = c.req.query('cursor');
    const limit = parseLimit(c.req.query('limit'));
    const page = await listUsers(c.env, { cursor: cursor ?? null, limit });
    return ok(c, page);
  });

  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    const user: User = { id: crypto.randomUUID(), name: name.trim() };
    return ok(c, await createUser(c.env, user));
  });

  // CHATS
  app.get('/api/chats', async (c) => {
    await ensureChatSeed(c.env);
    const cursor = c.req.query('cursor');
    const limit = parseLimit(c.req.query('limit'));
    const page = await listChats(c.env, { cursor: cursor ?? null, limit });
    return ok(c, page);
  });

  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const chat: ChatBoardState = { id: crypto.randomUUID(), title: title.trim(), messages: [] };
    const created = await createChat(c.env, chat);
    return ok(c, { id: created.id, title: created.title });
  });

  // MESSAGES
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const messages = await listChatMessages(c.env, chatId);
    if (messages === null) return notFound(c, 'chat not found');
    return ok(c, messages);
  });

  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      chatId,
      userId,
      text: text.trim(),
      ts: Date.now(),
    };
    try {
      const created = await appendChatMessage(c.env, chatId, message);
      return ok(c, created);
    } catch {
      return notFound(c, 'chat not found');
    }
  });

  // DELETE: Users
  app.delete('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await deleteUser(c.env, id) });
  });

  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await deleteManyUsers(c.env, list), ids: list });
  });

  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { id, deleted: await deleteChat(c.env, id) });
  });

  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await deleteManyChats(c.env, list), ids: list });
  });
}
