"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const user_routes_js_1 = require("./user-routes.js");
const app = new hono_1.Hono();
exports.app = app;
app.use('*', (0, logger_1.logger)());
app.use('/api/*', (0, cors_1.cors)({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));
(0, user_routes_js_1.userRoutes)(app);
app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } }));
app.post('/api/client-errors', async (c) => {
    try {
        const e = await c.req.json();
        if (!e.message)
            return c.json({ success: false, error: 'Missing required fields' }, 400);
        console.error('[CLIENT ERROR]', JSON.stringify(e, null, 2));
        return c.json({ success: true });
    }
    catch (error) {
        console.error('[CLIENT ERROR HANDLER] Failed:', error);
        return c.json({ success: false, error: 'Failed to process' }, 500);
    }
});
app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((err, c) => { console.error(`[ERROR] ${err}`); return c.json({ success: false, error: 'Internal Server Error' }, 500); });
