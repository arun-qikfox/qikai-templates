import type { User, Chat, ChatMessage } from '@shared/types';
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS } from '@shared/mock-data';
import { createDataStore, type Env } from './core-utils';
import type { PageResult } from './datastore/types';

const USERS_COLLECTION = 'users';
const CHATS_COLLECTION = 'chats';

export type ChatBoardState = Chat & { messages: ChatMessage[] };

export interface PaginationOptions {
  cursor?: string | null;
  limit?: number;
}

export async function ensureUserSeed(env: Env): Promise<void> {
  const store = createDataStore(env);
  const existing = await store.list<User>(USERS_COLLECTION, { limit: 1 });
  if (existing.items.length > 0) return;
  await Promise.all(MOCK_USERS.map((user) => store.create<User>(USERS_COLLECTION, user, { id: user.id })));
}

export async function listUsers(env: Env, options: PaginationOptions = {}): Promise<PageResult<User>> {
  const store = createDataStore(env);
  return store.list<User>(USERS_COLLECTION, options);
}

export async function createUser(env: Env, user: User): Promise<User> {
  const store = createDataStore(env);
  return store.create<User>(USERS_COLLECTION, user, { id: user.id });
}

export async function deleteUser(env: Env, id: string): Promise<boolean> {
  const store = createDataStore(env);
  return store.delete(USERS_COLLECTION, id);
}

export async function deleteManyUsers(env: Env, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const store = createDataStore(env);
  const results = await Promise.all(ids.map((id) => store.delete(USERS_COLLECTION, id)));
  return results.filter(Boolean).length;
}

export async function ensureChatSeed(env: Env): Promise<void> {
  const store = createDataStore(env);
  const existing = await store.list<ChatBoardState>(CHATS_COLLECTION, { limit: 1 });
  if (existing.items.length > 0) return;
  const seeds: ChatBoardState[] = MOCK_CHATS.map((chat) => ({
    ...chat,
    messages: MOCK_CHAT_MESSAGES.filter((msg) => msg.chatId === chat.id),
  }));
  await Promise.all(seeds.map((chat) => store.create<ChatBoardState>(CHATS_COLLECTION, chat, { id: chat.id })));
}

export async function listChats(env: Env, options: PaginationOptions = {}): Promise<PageResult<ChatBoardState>> {
  const store = createDataStore(env);
  return store.list<ChatBoardState>(CHATS_COLLECTION, options);
}

export async function createChat(env: Env, chat: ChatBoardState): Promise<ChatBoardState> {
  const store = createDataStore(env);
  return store.create<ChatBoardState>(CHATS_COLLECTION, chat, { id: chat.id });
}

export async function deleteChat(env: Env, id: string): Promise<boolean> {
  const store = createDataStore(env);
  return store.delete(CHATS_COLLECTION, id);
}

export async function deleteManyChats(env: Env, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const store = createDataStore(env);
  const results = await Promise.all(ids.map((id) => store.delete(CHATS_COLLECTION, id)));
  return results.filter(Boolean).length;
}

export async function getChat(env: Env, id: string): Promise<ChatBoardState | null> {
  const store = createDataStore(env);
  return store.get<ChatBoardState>(CHATS_COLLECTION, id);
}

export async function listChatMessages(env: Env, chatId: string): Promise<ChatMessage[] | null> {
  const chat = await getChat(env, chatId);
  if (!chat) return null;
  return chat.messages ?? [];
}

export async function appendChatMessage(env: Env, chatId: string, message: ChatMessage): Promise<ChatMessage> {
  const store = createDataStore(env);
  const existing = await store.get<ChatBoardState>(CHATS_COLLECTION, chatId);
  if (!existing) {
    throw new Error('Chat not found');
  }
  const updated: ChatBoardState = {
    ...existing,
    messages: [...(existing.messages ?? []), message],
  };
  await store.update<ChatBoardState>(CHATS_COLLECTION, chatId, updated);
  return message;
}
