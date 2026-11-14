# Builds the web game (`dist/`) with Bun and serves it with Caddy. Build context is the repository root:
# docker build -f infra/Dockerfile -t zapatro:smoke .

FROM oven/bun:1.4.4-slim AS build
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
# `prepare` only sets core.hooksPath and needs a .git checkout, which the build context excludes.
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

FROM caddy:2.11.9-alpine AS runtime
# The caddy image has no unprivileged user; Caddy writes its state under /config and /data.
RUN addgroup -S app && adduser -S -G app app && chown -R app:app /config /data
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
USER app
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
	CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1
