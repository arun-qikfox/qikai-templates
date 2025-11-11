import { Hono } from 'hono';
import type { Env } from './core-utils';
import { ok, bad, parseLimit } from './core-utils';
import type { DemoItem } from '@shared/types';
import {
  ensureSeed,
  listDemoItems,
  upsertDemoItem,
  deleteDemoItem,
  getCounterValue,
  incrementCounter,
} from './entities';

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'Firestore-enabled Demo' } }));

  app.post('/api/seed', async (c) => {
    const result = await ensureSeed(c.env);
    return ok(c, result);
  });

  app.get('/api/demo', async (c) => {
    await ensureSeed(c.env);
    const cursor = c.req.query('cursor');
    const limit = parseLimit(c.req.query('limit'));
    const page = await listDemoItems(c.env, { cursor: cursor ?? null, limit });
    return ok(c, page);
  });

  app.post('/api/demo', async (c) => {
    const payload = (await c.req.json()) as Partial<DemoItem>;
    if (!payload?.name?.trim()) return bad(c, 'name required');
    const item: DemoItem = {
      id: payload.id ?? crypto.randomUUID(),
      name: payload.name.trim(),
      value: payload.value ?? 0,
    };
    const saved = await upsertDemoItem(c.env, item);
    return ok(c, saved);
  });

  app.delete('/api/demo/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await deleteDemoItem(c.env, id);
    return ok(c, { id, deleted });
  });

  app.get('/api/counter', async (c) => ok(c, await getCounterValue(c.env)));

  app.post('/api/counter/increment', async (c) => {
    const { amount } = (await c.req.json().catch(() => ({}))) as { amount?: number };
    const value = await incrementCounter(c.env, typeof amount === 'number' ? amount : 1);
    return ok(c, value);
  });
}
