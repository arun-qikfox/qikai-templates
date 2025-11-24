import { createDataStore, type Env } from './core-utils';
import type { Message, SessionInfo } from './types';
import type { PageResult } from './datastore/types';

const SESSION_COLLECTION = 'chat-sessions';

export interface SessionDocument {
  id: string;
  title: string;
  model: string;
  messages: Message[];
  createdAt: number;
  lastActive: number;
}

const DEFAULT_MODEL = 'google-ai-studio/gemini-2.5-flash';

export async function getOrCreateSession(env: Env, sessionId: string): Promise<SessionDocument> {
  const store = createDataStore(env);
  const existing = await store.get<SessionDocument>(SESSION_COLLECTION, sessionId);
  if (existing) {
    return existing;
  }

  const now = Date.now();
  return store.create<SessionDocument>(
    SESSION_COLLECTION,
    {
      id: sessionId,
      title: `Chat ${new Date(now).toLocaleString()}`,
      model: DEFAULT_MODEL,
      messages: [],
      createdAt: now,
      lastActive: now,
    },
    { id: sessionId },
  );
}

export async function saveSession(env: Env, session: SessionDocument): Promise<SessionDocument> {
  const store = createDataStore(env);
  return store.update<SessionDocument>(SESSION_COLLECTION, session.id, session);
}

export async function updateSessionMetadata(
  env: Env,
  sessionId: string,
  updates: Partial<SessionDocument>,
): Promise<SessionDocument | null> {
  const store = createDataStore(env);
  const existing = await store.get<SessionDocument>(SESSION_COLLECTION, sessionId);
  if (!existing) return null;
  const updated = await store.update<SessionDocument>(SESSION_COLLECTION, sessionId, {
    ...existing,
    ...updates,
  });
  return updated;
}

export async function deleteSession(env: Env, sessionId: string): Promise<boolean> {
  const store = createDataStore(env);
  return store.delete(SESSION_COLLECTION, sessionId);
}

export async function clearAllSessions(env: Env): Promise<number> {
  const store = createDataStore(env);
  let deleted = 0;
  let cursor: string | null | undefined;
  do {
    const page: PageResult<SessionDocument> = await store.list<SessionDocument>(SESSION_COLLECTION, { limit: 50, cursor });
    for (const session of page.items) {
      const success = await store.delete(SESSION_COLLECTION, session.id);
      if (success) deleted += 1;
    }
    cursor = page.next;
  } while (cursor);
  return deleted;
}

export async function listSessions(env: Env, limit = 50): Promise<SessionInfo[]> {
  const store = createDataStore(env);
  const page = await store.list<SessionDocument>(SESSION_COLLECTION, { limit });
  return page.items
    .map((session) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
    }))
    .sort((a, b) => b.lastActive - a.lastActive);
}

export async function getSessionCount(env: Env): Promise<number> {
  const store = createDataStore(env);
  const page = await store.list<SessionDocument>(SESSION_COLLECTION, { limit: 1 });
  if (!page.next) {
    return page.items.length;
  }
  // If more than one page, iterate counts
  let count = page.items.length;
  let cursor = page.next;
  while (cursor) {
    const nextPage = await store.list<SessionDocument>(SESSION_COLLECTION, { limit: 100, cursor });
    count += nextPage.items.length;
    cursor = nextPage.next;
  }
  return count;
}

export function createEmptySession(sessionId: string, overrides?: Partial<SessionDocument>): SessionDocument {
  const now = Date.now();
  return {
    id: sessionId,
    title: `Chat ${new Date(now).toLocaleString()}`,
    model: DEFAULT_MODEL,
    messages: [],
    createdAt: now,
    lastActive: now,
    ...overrides,
  };
}

export function defaultModel(): string {
  return DEFAULT_MODEL;
}

