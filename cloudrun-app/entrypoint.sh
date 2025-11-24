#!/usr/bin/env bash
set -euo pipefail

log() {
	printf '[cloudrun-entrypoint] %s\n' "$*" >&2
}

write_runtime_config() {
	local root="$1"
	if [[ -z "${API_BASE_URL:-}" ]]; then
		return 0
	fi

	local target="${root%/}/__app_config__.js"
	log "Writing runtime API config to ${target}"
	cat <<EOF >"${target}"
window.__APP_API_BASE_URL__ = ${API_BASE_URL@Q};
EOF
}

# Custom command override.
if [[ -n "${START_COMMAND:-}" ]]; then
	log "Executing START_COMMAND override"
	exec bash -lc "$START_COMMAND"
fi

# Prefer explicit start script when available.
if [[ -f package.json ]]; then
	if npm run | grep -qE '(^| )start( |$)'; then
		log "Detected npm start script; launching application"
		exec npm run start
	fi
fi

# Fallback: serve static assets.
if [[ -d dist ]]; then
	write_runtime_config "dist"
	log "No start script found; serving ./dist with serve@14"
	exec serve -s dist -l "${PORT:-8080}"
fi

if [[ -f index.html ]]; then
	write_runtime_config "."
	log "Serving static assets from project root with serve@14"
	exec serve -s . -l "${PORT:-8080}"
fi

log "No start script or dist directory found. Set START_COMMAND or provide a start script."
exec sleep infinity
