import { Datastore } from '@google-cloud/datastore';
import type { ListOptions, PageResult, DataStore } from './types.js';

const KEY = Datastore.KEY as symbol;

export interface DatastoreConfig {
  /** GCP project ID. When empty, uses Application Default Credentials (ADC) to auto-detect on GCP. */
  projectId?: string;
}

/**
 * Creates a DataStore implementation using Google Cloud Datastore.
 * Uses Application Default Credentials (ADC) when running on GCP (App Engine, Cloud Run, etc.).
 * Only requires explicit projectId when running outside GCP or when overriding.
 */
export function createDatastoreStore(config: DatastoreConfig): DataStore {
  const ds = new Datastore(config.projectId ? { projectId: config.projectId } : {});

  function entityToDoc<T>(entity: Record<string, unknown>, id: string): T {
    const keyObj = entity[KEY] as { id?: string; name?: string } | undefined;
    const eid = keyObj?.id ?? keyObj?.name ?? id;
    const { [KEY]: _k, ...data } = entity;
    return { id: String(eid), ...data } as T;
  }

  const list = async <T>(kind: string, options?: ListOptions): Promise<PageResult<T>> => {
    let query = ds.createQuery(kind);
    if (options?.limit) {
      query = query.limit(Math.max(1, options.limit));
    }
    if (options?.cursor) {
      try {
        query = query.start(options.cursor);
      } catch {
        // Invalid cursor, ignore
      }
    }
    const [entities, queryInfo] = await query.run();
    const items = (entities as Record<string, unknown>[]).map((e) =>
      entityToDoc<T>(e, ''),
    );
    const next = queryInfo?.endCursor ?? null;
    return { items, next };
  };

  const get = async <T>(kind: string, id: string): Promise<T | null> => {
    const key = ds.key([kind, id]);
    const [entity] = await ds.get(key);
    if (!entity) return null;
    return entityToDoc<T>(entity as Record<string, unknown>, id);
  };

  const create = async <T extends { id?: string }>(
    kind: string,
    document: T,
    options?: { id?: string },
  ): Promise<T> => {
    const docId = options?.id ?? document.id ?? crypto.randomUUID();
    const key = ds.key([kind, docId]);
    const { id: _id, ...data } = document as Record<string, unknown>;
    await ds.save({ key, data: { ...data, id: docId } });
    return { id: docId, ...data } as T;
  };

  const update = async <T>(
    kind: string,
    id: string,
    document: Partial<T>,
  ): Promise<T> => {
    const key = ds.key([kind, id]);
    const [existing] = await ds.get(key);
    if (!existing) {
      throw new Error(`Entity not found: ${kind}/${id}`);
    }
    const { id: _id, ...rest } = document as Record<string, unknown>;
    const merged = { ...(existing as Record<string, unknown>), ...rest };
    delete merged[KEY];
    await ds.save({ key, data: merged });
    return { id, ...merged } as T;
  };

  const del = async (kind: string, id: string): Promise<boolean> => {
    const key = ds.key([kind, id]);
    await ds.delete(key);
    return true;
  };

  return {
    list,
    get,
    create,
    update,
    delete: del,
  };
}
