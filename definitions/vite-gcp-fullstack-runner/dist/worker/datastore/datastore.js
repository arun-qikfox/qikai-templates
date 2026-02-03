"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatastoreStore = createDatastoreStore;
const datastore_1 = require("@google-cloud/datastore");
const KEY = datastore_1.Datastore.KEY;
/**
 * Creates a DataStore implementation using Google Cloud Datastore.
 * Uses Application Default Credentials (ADC) when running on GCP (App Engine, Cloud Run, etc.).
 * Only requires explicit projectId when running outside GCP or when overriding.
 */
function createDatastoreStore(config) {
    const ds = new datastore_1.Datastore(config.projectId ? { projectId: config.projectId } : {});
    function entityToDoc(entity, id) {
        const ent = entity;
        const keyObj = ent[KEY];
        const eid = keyObj?.id ?? keyObj?.name ?? id;
        const { [KEY]: _k, ...data } = ent;
        return { id: String(eid), ...data };
    }
    const list = async (kind, options) => {
        let query = ds.createQuery(kind);
        if (options?.limit) {
            query = query.limit(Math.max(1, options.limit));
        }
        if (options?.cursor) {
            try {
                query = query.start(options.cursor);
            }
            catch {
                // Invalid cursor, ignore
            }
        }
        const [entities, queryInfo] = await query.run();
        const items = entities.map((e) => entityToDoc(e, ''));
        const next = queryInfo?.endCursor ?? null;
        return { items, next };
    };
    const get = async (kind, id) => {
        const key = ds.key([kind, id]);
        const [entity] = await ds.get(key);
        if (!entity)
            return null;
        return entityToDoc(entity, id);
    };
    const create = async (kind, document, options) => {
        const docId = options?.id ?? document.id ?? crypto.randomUUID();
        const key = ds.key([kind, docId]);
        const { id: _id, ...data } = document;
        await ds.save({ key, data: { ...data, id: docId } });
        return { id: docId, ...data };
    };
    const update = async (kind, id, document) => {
        const key = ds.key([kind, id]);
        const [existing] = await ds.get(key);
        if (!existing) {
            throw new Error(`Entity not found: ${kind}/${id}`);
        }
        const { id: _id, ...rest } = document;
        const merged = { ...existing, ...rest };
        delete merged[KEY];
        await ds.save({ key, data: merged });
        return { id, ...merged };
    };
    const del = async (kind, id) => {
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
