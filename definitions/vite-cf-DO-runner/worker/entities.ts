import type { DemoItem } from '@shared/types';
import { MOCK_ITEMS } from '@shared/mock-data';
import { createDataStore, type Env } from './core-utils';

const DEMO_COLLECTION = 'demo-items';
const COUNTER_COLLECTION = 'counters';
const COUNTER_ID = 'global-counter';

export interface CounterRecord {
  id: string;
  value: number;
}

export async function ensureDemoSeed(env: Env): Promise<void> {
  const store = createDataStore(env);
  const existing = await store.list<DemoItem>(DEMO_COLLECTION, { limit: 1 });
  if (existing.items.length > 0) return;
  await Promise.all(
    MOCK_ITEMS.map((item) => store.create<DemoItem>(DEMO_COLLECTION, item, { id: item.id })),
  );
}

export async function listDemoItems(env: Env): Promise<DemoItem[]> {
  const store = createDataStore(env);
  const result = await store.list<DemoItem>(DEMO_COLLECTION, { limit: 100 });
  return result.items;
}

export async function addDemoItem(env: Env, item: DemoItem): Promise<DemoItem[]> {
  const store = createDataStore(env);
  await store.create<DemoItem>(DEMO_COLLECTION, item, { id: item.id });
  return listDemoItems(env);
}

export async function updateDemoItem(env: Env, id: string, updates: Partial<Omit<DemoItem, 'id'>>): Promise<DemoItem[]> {
  const store = createDataStore(env);
  await store.update<DemoItem>(DEMO_COLLECTION, id, updates);
  return listDemoItems(env);
}

export async function deleteDemoItem(env: Env, id: string): Promise<DemoItem[]> {
  const store = createDataStore(env);
  await store.delete(DEMO_COLLECTION, id);
  return listDemoItems(env);
}

async function getCounter(env: Env): Promise<CounterRecord | null> {
  const store = createDataStore(env);
  return store.get<CounterRecord>(COUNTER_COLLECTION, COUNTER_ID);
}

export async function getCounterValue(env: Env): Promise<number> {
  const counter = await getCounter(env);
  if (!counter) return 0;
  return counter.value ?? 0;
}

export async function incrementCounter(env: Env, amount = 1): Promise<number> {
  const store = createDataStore(env);
  const existing = await getCounter(env);
  const nextValue = (existing?.value ?? 0) + amount;
  if (!existing) {
    await store.create<CounterRecord>(
      COUNTER_COLLECTION,
      { id: COUNTER_ID, value: nextValue },
      { id: COUNTER_ID },
    );
    return nextValue;
  }

  const updated = await store.update<CounterRecord>(
    COUNTER_COLLECTION,
    COUNTER_ID,
    { value: nextValue },
  );
  return updated.value;
}




