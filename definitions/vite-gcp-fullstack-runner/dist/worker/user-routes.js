"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const entities_js_1 = require("./entities.js");
const core_utils_js_1 = require("./core-utils.js");
function userRoutes(app) {
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'GCP Datastore Demo' } }));
    // USERS
    app.get('/api/users', async (c) => {
        await (0, entities_js_1.ensureUserSeed)(c.env);
        const cursor = c.req.query('cursor');
        const limit = (0, core_utils_js_1.parseLimit)(c.req.query('limit'));
        const page = await (0, entities_js_1.listUsers)(c.env, { cursor: cursor ?? null, limit });
        return (0, core_utils_js_1.ok)(c, page);
    });
    app.post('/api/users', async (c) => {
        const { name } = (await c.req.json());
        if (!name?.trim())
            return (0, core_utils_js_1.bad)(c, 'name required');
        const user = { id: crypto.randomUUID(), name: name.trim() };
        return (0, core_utils_js_1.ok)(c, await (0, entities_js_1.createUser)(c.env, user));
    });
    // CHATS
    app.get('/api/chats', async (c) => {
        await (0, entities_js_1.ensureChatSeed)(c.env);
        const cursor = c.req.query('cursor');
        const limit = (0, core_utils_js_1.parseLimit)(c.req.query('limit'));
        const page = await (0, entities_js_1.listChats)(c.env, { cursor: cursor ?? null, limit });
        return (0, core_utils_js_1.ok)(c, page);
    });
    app.post('/api/chats', async (c) => {
        const { title } = (await c.req.json());
        if (!title?.trim())
            return (0, core_utils_js_1.bad)(c, 'title required');
        const chat = { id: crypto.randomUUID(), title: title.trim(), messages: [] };
        const created = await (0, entities_js_1.createChat)(c.env, chat);
        return (0, core_utils_js_1.ok)(c, { id: created.id, title: created.title });
    });
    // MESSAGES
    app.get('/api/chats/:chatId/messages', async (c) => {
        const chatId = c.req.param('chatId');
        const messages = await (0, entities_js_1.listChatMessages)(c.env, chatId);
        if (messages === null)
            return (0, core_utils_js_1.notFound)(c, 'chat not found');
        return (0, core_utils_js_1.ok)(c, messages);
    });
    app.post('/api/chats/:chatId/messages', async (c) => {
        const chatId = c.req.param('chatId');
        const { userId, text } = (await c.req.json());
        if (!(0, core_utils_js_1.isStr)(userId) || !text?.trim())
            return (0, core_utils_js_1.bad)(c, 'userId and text required');
        const message = {
            id: crypto.randomUUID(),
            chatId,
            userId,
            text: text.trim(),
            ts: Date.now(),
        };
        try {
            const created = await (0, entities_js_1.appendChatMessage)(c.env, chatId, message);
            return (0, core_utils_js_1.ok)(c, created);
        }
        catch {
            return (0, core_utils_js_1.notFound)(c, 'chat not found');
        }
    });
    // DELETE: Users
    app.delete('/api/users/:id', async (c) => {
        const id = c.req.param('id');
        return (0, core_utils_js_1.ok)(c, { id, deleted: await (0, entities_js_1.deleteUser)(c.env, id) });
    });
    app.post('/api/users/deleteMany', async (c) => {
        const { ids } = (await c.req.json());
        const list = ids?.filter(core_utils_js_1.isStr) ?? [];
        if (list.length === 0)
            return (0, core_utils_js_1.bad)(c, 'ids required');
        return (0, core_utils_js_1.ok)(c, { deletedCount: await (0, entities_js_1.deleteManyUsers)(c.env, list), ids: list });
    });
    // DELETE: Chats
    app.delete('/api/chats/:id', async (c) => {
        const id = c.req.param('id');
        return (0, core_utils_js_1.ok)(c, { id, deleted: await (0, entities_js_1.deleteChat)(c.env, id) });
    });
    app.post('/api/chats/deleteMany', async (c) => {
        const { ids } = (await c.req.json());
        const list = ids?.filter(core_utils_js_1.isStr) ?? [];
        if (list.length === 0)
            return (0, core_utils_js_1.bad)(c, 'ids required');
        return (0, core_utils_js_1.ok)(c, { deletedCount: await (0, entities_js_1.deleteManyChats)(c.env, list), ids: list });
    });
}
