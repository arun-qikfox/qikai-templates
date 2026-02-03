"use strict";
/**
 * Default configuration constants for environment variable fallbacks.
 * Always use: process.env.X ?? DEFAULT_X (or env.X ?? DEFAULT_X in Workers)
 * Never use raw process.env.X without a fallback.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DATABASE_ID = exports.DEFAULT_API_BASE = exports.DEFAULT_GCP_PROJECT = exports.DEFAULT_DATA_PROVIDER = exports.DEFAULT_SERVICE_PORT = exports.DEFAULT_PORT = void 0;
exports.DEFAULT_PORT = 8080;
exports.DEFAULT_SERVICE_PORT = 8080;
exports.DEFAULT_DATA_PROVIDER = 'datastore';
exports.DEFAULT_GCP_PROJECT = '';
exports.DEFAULT_API_BASE = '';
exports.DEFAULT_DATABASE_ID = '(default)';
