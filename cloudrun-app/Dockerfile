# syntax=docker/dockerfile:1.7

##
## Build stage
##
FROM node:20-bookworm AS build

WORKDIR /workspace

# Copy dependency manifests first to maximise layer cache hits.
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies using the available manifest.
RUN set -eu \
	&& if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
		npm ci --legacy-peer-deps; \
	elif [ -f pnpm-lock.yaml ]; then \
		corepack enable pnpm && pnpm install --frozen-lockfile; \
	elif [ -f yarn.lock ]; then \
		corepack enable yarn && yarn install --immutable; \
	elif [ -f package.json ]; then \
		npm install --legacy-peer-deps; \
	fi

# Copy the remainder of the app source and build it (when scripts exist).
COPY . .
RUN set -eu \
	&& if [ -f package.json ]; then \
		npm run build --if-present; \
	fi

##
## Runtime stage
##
FROM node:20-slim AS runtime

ENV NODE_ENV=production \
	PORT=8080 \
	START_COMMAND=""

WORKDIR /app

# Copy built application and dependencies.
COPY --from=build /workspace /app

# Ensure production dependencies only.
RUN set -eu \
	&& if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
		npm prune --omit=dev --legacy-peer-deps; \
	elif [ -f pnpm-lock.yaml ]; then \
		corepack enable pnpm && pnpm prune --prod; \
	elif [ -f yarn.lock ]; then \
		corepack enable yarn && yarn workspaces focus --production || true; \
	elif [ -f package.json ]; then \
		npm install --omit=dev --legacy-peer-deps; \
	fi

# Lightweight static server fallback.
RUN npm install --global --no-update-notifier --no-fund serve@14

COPY entrypoint.sh /opt/vibesdk/entrypoint.sh
RUN chmod +x /opt/vibesdk/entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/opt/vibesdk/entrypoint.sh"]
