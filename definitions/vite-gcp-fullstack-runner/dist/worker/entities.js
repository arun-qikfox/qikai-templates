import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS } from '@shared/mock-data';
import { createDataStore } from './core-utils';
const USERS_COLLECTION = 'users';
const CHATS_COLLECTION = 'chats';
export async function ensureUserSeed(env) {
    const store = createDataStore(env);
    const existing = await store.list(USERS_COLLECTION, { limit: 1 });
    if (existing.items.length > 0)
        return;
    await Promise.all(MOCK_USERS.map((user) => store.create(USERS_COLLECTION, user, { id: user.id })));
}
export async function listUsers(env, options = {}) {
    const store = createDataStore(env);
    return store.list(USERS_COLLECTION, options);
}
export async function createUser(env, user) {
    const store = createDataStore(env);
    return store.create(USERS_COLLECTION, user, { id: user.id });
}
export async function deleteUser(env, id) {
    const store = createDataStore(env);
    return store.delete(USERS_COLLECTION, id);
}
export async function deleteManyUsers(env, ids) {
    if (ids.length === 0)
        return 0;
    const store = createDataStore(env);
    const results = await Promise.all(ids.map((id) => store.delete(USERS_COLLECTION, id)));
    return results.filter(Boolean).length;
}
export async function ensureChatSeed(env) {
    const store = createDataStore(env);
    const existing = await store.list(CHATS_COLLECTION, { limit: 1 });
    if (existing.items.length > 0)
        return;
    const seeds = MOCK_CHATS.map((chat) => ({
        ...chat,
        messages: MOCK_CHAT_MESSAGES.filter((msg) => msg.chatId === chat.id),
    }));
    await Promise.all(seeds.map((chat) => store.create(CHATS_COLLECTION, chat, { id: chat.id })));
}
export async function listChats(env, options = {}) {
    const store = createDataStore(env);
    return store.list(CHATS_COLLECTION, options);
}
export async function createChat(env, chat) {
    const store = createDataStore(env);
    return store.create(CHATS_COLLECTION, chat, { id: chat.id });
}
export async function deleteChat(env, id) {
    const store = createDataStore(env);
    return store.delete(CHATS_COLLECTION, id);
}
export async function deleteManyChats(env, ids) {
    if (ids.length === 0)
        return 0;
    const store = createDataStore(env);
    const results = await Promise.all(ids.map((id) => store.delete(CHATS_COLLECTION, id)));
    return results.filter(Boolean).length;
}
export async function getChat(env, id) {
    const store = createDataStore(env);
    return store.get(CHATS_COLLECTION, id);
}
export async function listChatMessages(env, chatId) {
    const chat = await getChat(env, chatId);
    if (!chat)
        return null;
    return chat.messages ?? [];
}
export async function appendChatMessage(env, chatId, message) {
    const store = createDataStore(env);
    const existing = await store.get(CHATS_COLLECTION, chatId);
    if (!existing) {
        throw new Error('Chat not found');
    }
    const updated = {
        ...existing,
        messages: [...(existing.messages ?? []), message],
    };
    await store.update(CHATS_COLLECTION, chatId, updated);
    return message;
}
