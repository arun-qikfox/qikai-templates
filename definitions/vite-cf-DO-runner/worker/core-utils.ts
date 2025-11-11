import type { Context } from 'hono';
import type { ApiResponse } from '@shared/types';
import { createFirestoreStore, type FirestoreConfig } from './datastore/firestore';
import { createHttpDataStore, type HttpProviderConfig } from './datastore/http';
import type { DataStore } from './datastore/types';

export type DataProviderTarget = 'firestore' | 'http';

export interface Env {
  DATA_PROVIDER?: string;
  FIRESTORE_PROJECT_ID?: string;
  FIRESTORE_CLIENT_EMAIL?: string;
  FIRESTORE_PRIVATE_KEY_B64?: string;
  FIRESTORE_DATABASE_ID?: string;
  FIRESTORE_API_ENDPOINT?: string;
  DATA_HTTP_BASE_URL?: string;
  DATA_HTTP_API_KEY?: string;
  DATA_HTTP_HEADERS_JSON?: string;
}

function parseProvider(env: Env): DataProviderTarget {
  const specified = env.DATA_PROVIDER?.toLowerCase().trim();
  if (specified === 'http') return 'http';
  return 'firestore';
}

function parseAdditionalHeaders(json?: string): Record<string, string> | undefined {
  if (!json) return undefined;
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') headers[key] = value;
      }
      return headers;
    }
  } catch (error) {
    console.warn('DATA_HTTP_HEADERS_JSON could not be parsed as JSON:', error);
  }
  return undefined;
}

function resolveFirestoreConfig(env: Env): FirestoreConfig {
  const projectId = env.FIRESTORE_PROJECT_ID?.trim();
  const clientEmail = env.FIRESTORE_CLIENT_EMAIL?.trim();
  const privateKeyPemB64 = env.FIRESTORE_PRIVATE_KEY_B64?.trim();

  if (!projectId || !clientEmail || !privateKeyPemB64) {
    throw new Error(
      'Firestore configuration is incomplete. Ensure FIRESTORE_PROJECT_ID, FIRESTORE_CLIENT_EMAIL, and FIRESTORE_PRIVATE_KEY_B64 are set.',
    );
  }

  return {
    projectId,
    clientEmail,
    privateKeyPemB64,
    databaseId: env.FIRESTORE_DATABASE_ID?.trim(),
    endpoint: env.FIRESTORE_API_ENDPOINT?.trim(),
  };
}

function resolveHttpConfig(env: Env): HttpProviderConfig {
  const baseUrl = env.DATA_HTTP_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error(
      'HTTP data provider selected but DATA_HTTP_BASE_URL is not defined. Provide a base URL to proxy data operations (e.g., MongoDB Data API).',
    );
  }

  return {
    baseUrl,
    apiKey: env.DATA_HTTP_API_KEY?.trim(),
    additionalHeaders: parseAdditionalHeaders(env.DATA_HTTP_HEADERS_JSON),
  };
}

export function createDataStore(env: Env): DataStore {
  const provider = parseProvider(env);
  if (provider === 'http') {
    return createHttpDataStore(resolveHttpConfig(env));
  }
  return createFirestoreStore(resolveFirestoreConfig(env));
}

export const ok = <T>(c: Context, data: T) => c.json({ success: true, data } satisfies ApiResponse<T>);
export const bad = (c: Context, error: string, status = 400) =>
  c.json({ success: false, error } satisfies ApiResponse, status);
export const notFound = (c: Context, error = 'not found') =>
  c.json({ success: false, error } satisfies ApiResponse, 404);
export const isStr = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const parseLimit = (value: string | undefined, fallback = 20) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
};