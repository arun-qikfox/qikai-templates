"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpDataStore = createHttpDataStore;
const JSON_CONTENT_TYPE = 'application/json';
function createHttpDataStore(config) {
    const request = async (path, init = {}) => {
        const url = `${config.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
        const headers = {
            'Content-Type': JSON_CONTENT_TYPE,
            ...config.additionalHeaders,
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
            ...init.headers,
        };
        const response = await fetch(url, { ...init, headers });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP data provider failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        if (response.status === 204) {
            return undefined;
        }
        return (await response.json());
    };
    const list = async (collection, options) => {
        const params = new URLSearchParams();
        if (options?.limit)
            params.set('limit', String(options.limit));
        if (options?.cursor)
            params.set('cursor', options.cursor);
        const response = await request(`${collection}${params.size ? `?${params.toString()}` : ''}`);
        return {
            items: response.items ?? [],
            next: response.next ?? null,
        };
    };
    const get = async (collection, id) => {
        try {
            return await request(`${collection}/${id}`);
        }
        catch (error) {
            if (error instanceof Error && /404/.test(error.message)) {
                return null;
            }
            throw error;
        }
    };
    const create = async (collection, document) => {
        return request(`${collection}`, {
            method: 'POST',
            body: JSON.stringify(document),
        });
    };
    const update = async (collection, id, document) => {
        return request(`${collection}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(document),
        });
    };
    const del = async (collection, id) => {
        try {
            await request(`${collection}/${id}`, { method: 'DELETE' });
            return true;
        }
        catch (error) {
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
