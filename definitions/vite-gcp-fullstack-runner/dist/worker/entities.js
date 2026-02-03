"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUserSeed = ensureUserSeed;
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.deleteManyUsers = deleteManyUsers;
exports.ensureChatSeed = ensureChatSeed;
exports.listChats = listChats;
exports.createChat = createChat;
exports.deleteChat = deleteChat;
exports.deleteManyChats = deleteManyChats;
exports.getChat = getChat;
exports.listChatMessages = listChatMessages;
exports.appendChatMessage = appendChatMessage;
const mock_data_js_1 = require("../shared/mock-data.js");
const core_utils_js_1 = require("./core-utils.js");
const USERS_COLLECTION = 'users';
const CHATS_COLLECTION = 'chats';
async function ensureUserSeed(env) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    const existing = await store.list(USERS_COLLECTION, { limit: 1 });
    if (existing.items.length > 0)
        return;
    await Promise.all(mock_data_js_1.MOCK_USERS.map((user) => store.create(USERS_COLLECTION, user, { id: user.id })));
}
async function listUsers(env, options = {}) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    return store.list(USERS_COLLECTION, options);
}
async function createUser(env, user) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    return store.create(USERS_COLLECTION, user, { id: user.id });
}
async function deleteUser(env, id) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    return store.delete(USERS_COLLECTION, id);
}
async function deleteManyUsers(env, ids) {
    if (ids.length === 0)
        return 0;
    const store = (0, core_utils_js_1.createDataStore)(env);
    const results = await Promise.all(ids.map((id) => store.delete(USERS_COLLECTION, id)));
    return results.filter(Boolean).length;
}
async function ensureChatSeed(env) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    const existing = await store.list(CHATS_COLLECTION, { limit: 1 });
    if (existing.items.length > 0)
        return;
    const seeds = mock_data_js_1.MOCK_CHATS.map((chat) => ({
        ...chat,
        messages: mock_data_js_1.MOCK_CHAT_MESSAGES.filter((msg) => msg.chatId === chat.id),
    }));
    await Promise.all(seeds.map((chat) => store.create(CHATS_COLLECTION, chat, { id: chat.id })));
}
async function listChats(env, options = {}) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    return store.list(CHATS_COLLECTION, options);
}
async function createChat(env, chat) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    return store.create(CHATS_COLLECTION, chat, { id: chat.id });
}
async function deleteChat(env, id) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    return store.delete(CHATS_COLLECTION, id);
}
async function deleteManyChats(env, ids) {
    if (ids.length === 0)
        return 0;
    const store = (0, core_utils_js_1.createDataStore)(env);
    const results = await Promise.all(ids.map((id) => store.delete(CHATS_COLLECTION, id)));
    return results.filter(Boolean).length;
}
async function getChat(env, id) {
    const store = (0, core_utils_js_1.createDataStore)(env);
    return store.get(CHATS_COLLECTION, id);
}
async function listChatMessages(env, chatId) {
    const chat = await getChat(env, chatId);
    if (!chat)
        return null;
    return chat.messages ?? [];
}
async function appendChatMessage(env, chatId, message) {
    const store = (0, core_utils_js_1.createDataStore)(env);
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
