import { DataStore, ListOptions, PageResult } from './types';

export interface HttpProviderConfig {
  baseUrl: string;
  apiKey?: string;
  additionalHeaders?: Record<string, string>;
}

interface HttpListResponse<T> {
  items: T[];
  next?: string | null;
}

const JSON_CONTENT_TYPE = 'application/json';

export function createHttpDataStore(config: HttpProviderConfig): DataStore {
  const request = async <T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> => {
    const url = `${config.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    const headers: Record<string, string> = {
      'Content-Type': JSON_CONTENT_TYPE,
      ...config.additionalHeaders,
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    };
    const response = await fetch(url, { ...init, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP data provider failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  };

  const list = async <T>(collection: string, options?: ListOptions): Promise<PageResult<T>> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.cursor) params.set('cursor', options.cursor);
    const response = await request<HttpListResponse<T>>(`${collection}${params.size ? `?${params.toString()}` : ''}`);
    return {
      items: response.items ?? [],
      next: response.next ?? null,
    };
  };

  const get = async <T>(collection: string, id: string): Promise<T | null> => {
    try {
      return await request<T>(`${collection}/${id}`);
    } catch (error) {
      if (error instanceof Error && /404/.test(error.message)) {
        return null;
      }
      throw error;
    }
  };

  const create = async <T extends { id?: string }>(
    collection: string,
    document: T,
  ): Promise<T> => {
    return request<T>(`${collection}`, {
      method: 'POST',
      body: JSON.stringify(document),
    });
  };

  const update = async <T>(
    collection: string,
    id: string,
    document: Partial<T>,
  ): Promise<T> => {
    return request<T>(`${collection}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(document),
    });
  };

  const del = async (collection: string, id: string): Promise<boolean> => {
    try {
      await request<void>(`${collection}/${id}`, { method: 'DELETE' });
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

