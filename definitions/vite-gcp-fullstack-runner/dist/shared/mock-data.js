"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_CHAT_MESSAGES = exports.MOCK_CHATS = exports.MOCK_USERS = void 0;
exports.MOCK_USERS = [
    { id: 'u1', name: 'User A' },
    { id: 'u2', name: 'User B' }
];
exports.MOCK_CHATS = [
    { id: 'c1', title: 'General' },
];
exports.MOCK_CHAT_MESSAGES = [
    { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
