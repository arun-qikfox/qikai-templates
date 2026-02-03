"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const index_js_1 = require("./worker/index.js");
const port = Number(process.env.PORT ?? process.env.SERVICE_PORT ?? 8080);
(0, node_server_1.serve)({
    fetch: index_js_1.app.fetch,
    port,
}, (info) => {
    console.log(`[server] listening on http://localhost:${info.port}`);
});
process.on('uncaughtException', (error) => {
    console.error('[server] uncaught exception', error);
});
process.on('unhandledRejection', (reason) => {
    console.error('[server] unhandled rejection', reason);
});
