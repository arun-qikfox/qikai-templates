/**
 * Default configuration constants for environment variable fallbacks.
 * Always use: process.env.X ?? DEFAULT_X (or env.X ?? DEFAULT_X in Workers)
 * Never use raw process.env.X without a fallback.
 */

export const DEFAULT_PORT = 8080;
export const DEFAULT_SERVICE_PORT = 8080;
export const DEFAULT_DATA_PROVIDER = 'datastore';
export const DEFAULT_GCP_PROJECT = '';
export const DEFAULT_API_BASE = '';
export const DEFAULT_DATABASE_ID = '(default)';
