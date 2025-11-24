import type { DemoItem } from '@shared/types';
import { MOCK_ITEMS, DEFAULT_COUNTER_VALUE } from '@shared/mock-data';
import { createDataStore, type Env } from './core-utils';
import type { PageResult } from './datastore/types';

const DEMO_COLLECTION = 'demo-items';
const COUNTER_COLLECTION = 'counters';
const META_COLLECTION = 'template-metadata';

export interface CounterRecord {
  id: string;
  value: number;
}

interface SeedMetadata {
  id: string;
  seeded: boolean;
  seededAt: string;
}

export interface PaginationOptions {
  cursor?: string | null;
  limit?: number;
}

export async function ensureSeed(env: Env): Promise<{ seeded: boolean }> {
  const store = createDataStore(env);
  const meta = await store.get<SeedMetadata>(META_COLLECTION, 'seed-status');
  if (meta?.seeded) {
    return { seeded: false };
  }

  await Promise.all([
    ...MOCK_ITEMS.map((item) => store.create<DemoItem>(DEMO_COLLECTION, item, { id: item.id })),
    store.create<CounterRecord>(COUNTER_COLLECTION, { id: 'global', value: DEFAULT_COUNTER_VALUE }, { id: 'global' }),
  ]);

  await store.create<SeedMetadata>(
    META_COLLECTION,
    { id: 'seed-status', seeded: true, seededAt: new Date().toISOString() },
    { id: 'seed-status' },
  );

  return { seeded: true };
}

export async function listDemoItems(env: Env, options: PaginationOptions = {}): Promise<PageResult<DemoItem>> {
  const store = createDataStore(env);
  return store.list<DemoItem>(DEMO_COLLECTION, options);
}

export async function upsertDemoItem(env: Env, item: DemoItem): Promise<DemoItem> {
  const store = createDataStore(env);
  return store.create<DemoItem>(DEMO_COLLECTION, item, { id: item.id });
}

export async function deleteDemoItem(env: Env, id: string): Promise<boolean> {
  const store = createDataStore(env);
  return store.delete(DEMO_COLLECTION, id);
}

export async function getCounterValue(env: Env): Promise<number> {
  const store = createDataStore(env);
  const counter = await store.get<CounterRecord>(COUNTER_COLLECTION, 'global');
  return counter?.value ?? DEFAULT_COUNTER_VALUE;
}

export async function incrementCounter(env: Env, amount = 1): Promise<number> {
  const store = createDataStore(env);
  const existing = await store.get<CounterRecord>(COUNTER_COLLECTION, 'global');
  const nextValue = (existing?.value ?? DEFAULT_COUNTER_VALUE) + amount;

  if (!existing) {
    await store.create<CounterRecord>(COUNTER_COLLECTION, { id: 'global', value: nextValue }, { id: 'global' });
    return nextValue;
  }

  const updated = await store.update<CounterRecord>(COUNTER_COLLECTION, 'global', { value: nextValue });
  return updated.value;
}




