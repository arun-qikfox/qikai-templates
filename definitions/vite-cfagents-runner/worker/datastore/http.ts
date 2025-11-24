import type { DataStore, ListOptions, PageResult } from './types';

export interface HttpProviderConfig {
  baseUrl: string;
  apiKey?: string;
  additionalHeaders?: Record<string, string>;
}

interface HttpListResponse<T> {
  items: T[];
  next?: string | null;
}

function buildHeaders(config: HttpProviderConfig): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) headers['x-api-key'] = config.apiKey;
  if (config.additionalHeaders) {
    for (const [key, value] of Object.entries(config.additionalHeaders)) {
      headers[key] = value;
    }
  }
  return headers;
}

async function httpFetch(config: HttpProviderConfig, path: string, init?: RequestInit) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(config),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP data provider request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response;
}

export function createHttpDataStore(config: HttpProviderConfig): DataStore {
  const list = async <T>(collection: string, options?: ListOptions): Promise<PageResult<T>> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.cursor) params.set('cursor', options.cursor);

    const res = await httpFetch(config, `/data/${collection}?${params.toString()}`);
    const json = (await res.json()) as HttpListResponse<T>;
    return {
      items: json.items,
      next: json.next ?? null,
    };
  };

  const get = async <T>(collection: string, id: string): Promise<T | null> => {
    try {
      const res = await httpFetch(config, `/data/${collection}/${encodeURIComponent(id)}`);
      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof Error && /404/.test(error.message)) return null;
      throw error;
    }
  };

  const create = async <T extends { id?: string }>(
    collection: string,
    document: T,
    options?: { id?: string },
  ): Promise<T> => {
    const docId = options?.id ?? document.id;
    const res = await httpFetch(config, `/data/${collection}${docId ? `/${encodeURIComponent(docId)}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(document),
    });
    return (await res.json()) as T;
  };

  const update = async <T>(
    collection: string,
    id: string,
    document: Partial<T>,
  ): Promise<T> => {
    const res = await httpFetch(config, `/data/${collection}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(document),
    });
    return (await res.json()) as T;
  };

  const del = async (collection: string, id: string): Promise<boolean> => {
    try {
      await httpFetch(config, `/data/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      if (error instanceof Error && /404/.test(error.message)) {
        return false;
      }
      throw error;
    }
  };

  return {
    list,
    get,
    create,
    update,
    delete: del,
  };
}




