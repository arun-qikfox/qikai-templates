#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const viteConfigPath = path.resolve(__dirname, '../vite.config.ts');

try {
	const content = fs.readFileSync(viteConfigPath, 'utf8');
	if (!content.includes('outDir: "dist/client"')) {
		console.error(
			'[verify-outdir] vite.config.ts must contain build.outDir = "dist/client" for App Engine previews.',
		);
		process.exit(1);
	}
	console.log('[verify-outdir] build.outDir correctly set to dist/client');
	process.exit(0);
} catch (error) {
	console.error('[verify-outdir] Failed to read vite.config.ts', error);
	process.exit(1);
}
