# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

# ---- Stage 1: build ----
FROM node:24-slim AS build

WORKDIR /app

# Copy only the dependency manifests first so this layer stays cached
# until package.json or package-lock.json changes
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source and build the frontend
COPY . .

# Vite inlines VITE_* values into the JS bundle at build time.
# Firebase web config is public by design; real secrets never go here.
ARG VITE_FIREBASE_API_KEY=""
ARG VITE_FIREBASE_AUTH_DOMAIN=""
ARG VITE_FIREBASE_PROJECT_ID=""
ARG VITE_FIREBASE_STORAGE_BUCKET=""
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=""
ARG VITE_FIREBASE_APP_ID=""
ARG VITE_ADMIN_UID=""

RUN npm run build && npm run build:server

# ---- Stage 2: runtime ----
FROM gcr.io/distroless/nodejs24-debian13:nonroot AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Only the built artifacts: no source, no node_modules, no build tools.
# Files stay root-owned, so the app user can read but not modify them.
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server/server.mjs ./server.mjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["server.mjs"]