import { serve } from '@hono/node-server';
import { app } from './worker/index.ts';

const port = Number(process.env.PORT ?? process.env.SERVICE_PORT ?? 8080);

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(`[server] listening on http://localhost:${info.port}`);
	},
);

process.on('uncaughtException', (error) => {
	console.error('[server] uncaught exception', error);
});

process.on('unhandledRejection', (reason) => {
	console.error('[server] unhandled rejection', reason);
});

