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

RUN npm run build