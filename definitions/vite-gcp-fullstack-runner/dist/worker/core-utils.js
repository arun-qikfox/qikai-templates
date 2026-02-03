"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLimit = exports.isStr = exports.notFound = exports.bad = exports.ok = void 0;
exports.createDataStore = createDataStore;
const datastore_js_1 = require("./datastore/datastore.js");
const firestore_js_1 = require("./datastore/firestore.js");
const http_js_1 = require("./datastore/http.js");
const config_js_1 = require("@shared/config.js");
function parseProvider(env) {
    const specified = (env.DATA_PROVIDER ?? config_js_1.DEFAULT_DATA_PROVIDER).toLowerCase().trim();
    if (specified === 'http')
        return 'http';
    if (specified === 'firestore')
        return 'firestore';
    return 'datastore';
}
function parseAdditionalHeaders(json) {
    if (!json)
        return undefined;
    try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === 'object') {
            const headers = {};
            for (const [key, value] of Object.entries(parsed)) {
                if (typeof value === 'string')
                    headers[key] = value;
            }
            return headers;
        }
    }
    catch (error) {
        console.warn('DATA_HTTP_HEADERS_JSON could not be parsed as JSON:', error);
    }
    return undefined;
}
function resolveDatastoreConfig(env) {
    const projectId = env.GCP_PROJECT_ID?.trim() ??
        env.GOOGLE_CLOUD_PROJECT?.trim() ??
        env.FIRESTORE_PROJECT_ID?.trim() ??
        '';
    return projectId ? { projectId } : {};
}
function resolveFirestoreConfig(env) {
    const projectId = env.FIRESTORE_PROJECT_ID?.trim();
    const clientEmail = env.FIRESTORE_CLIENT_EMAIL?.trim();
    const privateKeyPemB64 = env.FIRESTORE_PRIVATE_KEY_B64?.trim();
    if (!projectId || !clientEmail || !privateKeyPemB64) {
        throw new Error('Firestore configuration is incomplete. Ensure FIRESTORE_PROJECT_ID, FIRESTORE_CLIENT_EMAIL, and FIRESTORE_PRIVATE_KEY_B64 are set. For GCP deployments, prefer DATA_PROVIDER=datastore which uses Application Default Credentials.');
    }
    return {
        projectId,
        clientEmail,
        privateKeyPemB64,
        databaseId: env.FIRESTORE_DATABASE_ID?.trim(),
        endpoint: env.FIRESTORE_API_ENDPOINT?.trim(),
    };
}
function resolveHttpConfig(env) {
    const baseUrl = env.DATA_HTTP_BASE_URL?.trim();
    if (!baseUrl) {
        throw new Error('HTTP data provider selected but DATA_HTTP_BASE_URL is not defined. Provide a base URL to proxy data operations (e.g., MongoDB Data API).');
    }
    return {
        baseUrl,
        apiKey: env.DATA_HTTP_API_KEY?.trim(),
        additionalHeaders: parseAdditionalHeaders(env.DATA_HTTP_HEADERS_JSON),
    };
}
function createDataStore(env) {
    const provider = parseProvider(env);
    if (provider === 'http') {
        return (0, http_js_1.createHttpDataStore)(resolveHttpConfig(env));
    }
    if (provider === 'firestore') {
        return (0, firestore_js_1.createFirestoreStore)(resolveFirestoreConfig(env));
    }
    return (0, datastore_js_1.createDatastoreStore)(resolveDatastoreConfig(env));
}
const ok = (c, data) => c.json({ success: true, data });
exports.ok = ok;
const bad = (c, error, status = 400) => c.json({ success: false, error }, status);
exports.bad = bad;
const notFound = (c, error = 'not found') => c.json({ success: false, error }, 404);
exports.notFound = notFound;
const isStr = (value) => typeof value === 'string' && value.trim().length > 0;
exports.isStr = isStr;
const parseLimit = (value, fallback = 20) => {
    if (!value)
        return fallback;
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0)
        return fallback;
    return Math.min(parsed, 100);
};
exports.parseLimit = parseLimit;
