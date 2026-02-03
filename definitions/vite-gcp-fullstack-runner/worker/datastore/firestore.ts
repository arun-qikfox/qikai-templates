import type { ListOptions, PageResult, DataStore } from './types.ts';

export interface FirestoreConfig {
  projectId: string;
  clientEmail: string;
  privateKeyPemB64: string;
  databaseId?: string;
  endpoint?: string;
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } }
  | { nullValue: null }
  | { timestampValue: string };

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

interface FirestoreWriteResponse {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const DEFAULT_DATABASE = '(default)';
const DEFAULT_ENDPOINT = 'https://firestore.googleapis.com';

const tokenCache = new Map<string, TokenCache>();
const importedKeyCache = new Map<string, CryptoKey>();

function bufferFromBase64(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64');
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeBase64UrlString(value: string): string {
  return bufferToBase64Url(textEncoder.encode(value));
}

function decodePrivateKeyPem(privateKeyPemB64: string): ArrayBuffer {
  const pemString = textDecoder.decode(bufferFromBase64(privateKeyPemB64));
  const cleaned = pemString
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  return bufferFromBase64(cleaned).buffer;
}

async function importPrivateKey(privateKeyPemB64: string): Promise<CryptoKey> {
  const cached = importedKeyCache.get(privateKeyPemB64);
  if (cached) return cached;

  const keyData = decodePrivateKeyPem(privateKeyPemB64);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
  importedKeyCache.set(privateKeyPemB64, key);
  return key;
}

async function getAccessToken(config: FirestoreConfig): Promise<string> {
  const cacheKey = `${config.clientEmail}:${config.projectId}`;
  const cached = tokenCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) {
    return cached.token;
  }

  const key = await importPrivateKey(config.privateKeyPemB64);
  const header = { alg: 'RS256', typ: 'JWT' };
  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;
  const payload = {
    iss: config.clientEmail,
    sub: config.clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/datastore',
    iat,
    exp,
  };

  const unsignedToken = `${encodeBase64UrlString(JSON.stringify(header))}.${encodeBase64UrlString(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    textEncoder.encode(unsignedToken),
  );
  const assertion = `${unsignedToken}.${bufferToBase64Url(signature)}`;

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Google access token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = (await response.json()) as { access_token: string; expires_in: number };
  const token = json.access_token;
  tokenCache.set(cacheKey, { token, expiresAt: now + (json.expires_in * 1000) });
  return token;
}

function getDocumentPath(config: FirestoreConfig, collection: string, id?: string) {
  const db = config.databaseId ?? DEFAULT_DATABASE;
  const base = `${config.endpoint ?? DEFAULT_ENDPOINT}/v1/projects/${config.projectId}/databases/${db}/documents/${collection}`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

function parseDocument<T>(doc: FirestoreDocument): T {
  const id = doc.name.split('/').pop() ?? '';
  const fields = doc.fields ?? {};
  const data = decodeMap(fields) as Record<string, unknown>;
  return { id, ...data } as T;
}

function decodeValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    const arr = value.arrayValue?.values ?? [];
    return arr.map((v) => decodeValue(v));
  }
  if ('mapValue' in value) {
    return decodeMap(value.mapValue.fields ?? {});
  }
  return undefined;
}

function decodeMap(map: Record<string, FirestoreValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(map)) {
    result[key] = decodeValue(value);
  }
  return result;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: value.toString() };
    return { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((entry) => encodeValue(entry)) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: encodeMap(value as Record<string, unknown>) } };
  }
  return { stringValue: String(value) };
}

function encodeMap(record: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(record)) {
    fields[key] = encodeValue(value);
  }
  return fields;
}

async function firestoreFetch(
  config: FirestoreConfig,
  path: string,
  init: RequestInit & { headers?: HeadersInit } = {},
) {
  const token = await getAccessToken(config);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...init.headers,
  };
  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response;
}

export function createFirestoreStore(config: FirestoreConfig): DataStore {
  const list = async <T>(collection: string, options?: ListOptions): Promise<PageResult<T>> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('pageSize', String(Math.max(1, options.limit)));
    if (options?.cursor) params.set('pageToken', options.cursor);

    const url = `${getDocumentPath(config, collection)}${params.size > 0 ? `?${params.toString()}` : ''}`;
    const res = await firestoreFetch(config, url);
    const json = (await res.json()) as FirestoreListResponse;
    const docs = json.documents ?? [];
    return {
      items: docs.map((doc) => parseDocument<T>(doc)),
      next: json.nextPageToken ?? null,
    };
  };

  const get = async <T>(collection: string, id: string): Promise<T | null> => {
    try {
      const res = await firestoreFetch(config, getDocumentPath(config, collection, id));
      const doc = (await res.json()) as FirestoreDocument;
      return parseDocument<T>(doc);
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
    const docId = options?.id ?? document.id ?? crypto.randomUUID();
    const { id, ...rest } = document;
    const body = JSON.stringify({
      fields: encodeMap({ ...rest, id: docId }),
    });

    const url = `${getDocumentPath(config, collection)}?documentId=${encodeURIComponent(docId)}`;
    const res = await firestoreFetch(config, url, { method: 'POST', body });
    const json = (await res.json()) as FirestoreWriteResponse;
    return parseDocument<T>(json);
  };

  const update = async <T>(
    collection: string,
    id: string,
    document: Partial<T>,
  ): Promise<T> => {
    const { id: _, ...rest } = document as Record<string, unknown>;
    const updateMask = Object.keys(rest).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join('&');
    const body = JSON.stringify({
      fields: encodeMap(rest),
    });

    const url = `${getDocumentPath(config, collection, id)}${updateMask ? `?${updateMask}` : ''}`;
    const res = await firestoreFetch(config, url, { method: 'PATCH', body });
    const json = (await res.json()) as FirestoreWriteResponse;
    return parseDocument<T>(json);
  };

  const del = async (collection: string, id: string): Promise<boolean> => {
    try {
      await firestoreFetch(config, getDocumentPath(config, collection, id), { method: 'DELETE' });
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
