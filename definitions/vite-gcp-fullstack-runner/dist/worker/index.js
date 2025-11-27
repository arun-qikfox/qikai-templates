import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { userRoutes } from './user-routes';
const app = new Hono();
app.use('*', logger());
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));
userRoutes(app);
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
// GCP/Node.js export pattern - export the Hono app for Node.js runtime
export { app };
