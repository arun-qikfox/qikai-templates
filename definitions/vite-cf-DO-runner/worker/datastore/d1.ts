import type { DataStore, ListOptions, PageResult } from './types';

export interface D1ProviderConfig {
	db?: D1Database;
}

const TABLE_NAME = 'app_records';

function ensureDb(config: D1ProviderConfig): D1Database {
	if (!config.db) {
		throw new Error('D1 binding is not configured. Add DB to wrangler d1_databases.');
	}
	return config.db;
}

async function ensureSchema(db: D1Database): Promise<void> {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
				collection TEXT NOT NULL,
				id TEXT NOT NULL,
				data TEXT NOT NULL,
				updated_at INTEGER NOT NULL,
				PRIMARY KEY (collection, id)
			)`
		)
		.run();
}

function decodeCursor(cursor?: string | null): { ts: number; id: string } | null {
	if (!cursor) return null;
	try {
		const raw =
			typeof atob === 'function'
				? atob(cursor)
				: Buffer.from(cursor, 'base64').toString('utf8');
		const parsed = JSON.parse(raw) as { ts: number; id: string };
		if (typeof parsed.ts === 'number' && typeof parsed.id === 'string') {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

function encodeCursor(ts: number, id: string): string {
	const raw = JSON.stringify({ ts, id });
	return typeof btoa === 'function'
		? btoa(raw)
		: Buffer.from(raw, 'utf8').toString('base64');
}

export function createD1DataStore(config: D1ProviderConfig): DataStore {
	const list = async <T>(collection: string, options?: ListOptions): Promise<PageResult<T>> => {
		const db = ensureDb(config);
		await ensureSchema(db);
		const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
		const cursor = decodeCursor(options?.cursor);

		const result = cursor
			? await db
					.prepare(
						`SELECT id, data, updated_at
						 FROM ${TABLE_NAME}
						 WHERE collection = ?
						   AND (updated_at < ? OR (updated_at = ? AND id < ?))
						 ORDER BY updated_at DESC, id DESC
						 LIMIT ?`
					)
					.bind(collection, cursor.ts, cursor.ts, cursor.id, limit + 1)
					.all<{ id: string; data: string; updated_at: number }>()
			: await db
					.prepare(
						`SELECT id, data, updated_at
						 FROM ${TABLE_NAME}
						 WHERE collection = ?
						 ORDER BY updated_at DESC, id DESC
						 LIMIT ?`
					)
					.bind(collection, limit + 1)
					.all<{ id: string; data: string; updated_at: number }>();

		const rows = result.results ?? [];
		const pageRows = rows.slice(0, limit);
		const items = pageRows.map((row) => JSON.parse(row.data) as T);
		const next =
			rows.length > limit
				? encodeCursor(pageRows[pageRows.length - 1].updated_at, pageRows[pageRows.length - 1].id)
				: null;
		return { items, next };
	};

	const get = async <T>(collection: string, id: string): Promise<T | null> => {
		const db = ensureDb(config);
		await ensureSchema(db);
		const row = await db
			.prepare(`SELECT data FROM ${TABLE_NAME} WHERE collection = ? AND id = ?`)
			.bind(collection, id)
			.first<{ data: string }>();
		return row ? (JSON.parse(row.data) as T) : null;
	};

	const create = async <T extends { id?: string }>(
		collection: string,
		document: T,
		options?: { id?: string },
	): Promise<T> => {
		const db = ensureDb(config);
		await ensureSchema(db);
		const id = options?.id ?? document.id ?? crypto.randomUUID();
		const record = { ...document, id } as T;
		await db
			.prepare(
				`INSERT OR REPLACE INTO ${TABLE_NAME} (collection, id, data, updated_at)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(collection, id, JSON.stringify(record), Date.now())
			.run();
		return record;
	};

	const update = async <T>(collection: string, id: string, document: Partial<T>): Promise<T> => {
		const existing = await get<Record<string, unknown>>(collection, id);
		if (!existing) throw new Error(`Entity not found: ${collection}/${id}`);
		const merged = { ...existing, ...document, id } as T;
		const db = ensureDb(config);
		await db
			.prepare(
				`INSERT OR REPLACE INTO ${TABLE_NAME} (collection, id, data, updated_at)
				 VALUES (?, ?, ?, ?)`
			)
			.bind(collection, id, JSON.stringify(merged), Date.now())
			.run();
		return merged;
	};

	const del = async (collection: string, id: string): Promise<boolean> => {
		const db = ensureDb(config);
		await ensureSchema(db);
		const result = await db
			.prepare(`DELETE FROM ${TABLE_NAME} WHERE collection = ? AND id = ?`)
			.bind(collection, id)
			.run();
		return (result.meta?.changes ?? 0) > 0;
	};

	return {
		list,
		get,
		create,
		update,
		delete: del,
	};
}

