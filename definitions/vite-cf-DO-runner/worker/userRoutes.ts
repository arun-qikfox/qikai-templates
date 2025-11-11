import { Hono } from 'hono';
import type { Env } from './core-utils';
import { ok, bad } from './core-utils';
import type { DemoItem } from '@shared/types';
import {
  ensureDemoSeed,
  listDemoItems,
  addDemoItem,
  updateDemoItem,
  deleteDemoItem,
  getCounterValue,
  incrementCounter,
} from './entities';

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'Firestore-ready Demo' } }));

  // Demo items backed by Firestore/default data provider
  app.get('/api/demo', async (c) => {
    await ensureDemoSeed(c.env);
    const items = await listDemoItems(c.env);
    return ok(c, items);
  });

  app.post('/api/demo', async (c) => {
    const body = (await c.req.json()) as Partial<DemoItem>;
    if (!body?.name?.trim()) {
      return bad(c, 'name is required');
    }
    const item: DemoItem = {
      id: body.id ?? crypto.randomUUID(),
      name: body.name.trim(),
      value: body.value ?? 0,
    };
    const items = await addDemoItem(c.env, item);
    return ok(c, items);
  });

  app.put('/api/demo/:id', async (c) => {
    const id = c.req.param('id');
    const body = (await c.req.json()) as Partial<Omit<DemoItem, 'id'>>;
    const updates: Partial<Omit<DemoItem, 'id'>> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.value !== undefined) updates.value = body.value;
    const items = await updateDemoItem(c.env, id, updates);
    return ok(c, items);
  });

  app.delete('/api/demo/:id', async (c) => {
    const id = c.req.param('id');
    const items = await deleteDemoItem(c.env, id);
    return ok(c, items);
  });

  // Counter operations
  app.get('/api/counter', async (c) => ok(c, await getCounterValue(c.env)));

  app.post('/api/counter/increment', async (c) => {
    const { amount } = (await c.req.json().catch(() => ({}))) as { amount?: number };
    const value = await incrementCounter(c.env, typeof amount === 'number' ? amount : 1);
    return ok(c, value);
  });
}
