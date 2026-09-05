# ---- Build stage ----
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies (cached unless lockfile changes)
COPY package*.json ./
RUN npm ci

# Build the Nuxt app (Nitro node-server output)
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Only the built server output is needed at runtime
COPY --from=build /app/.output ./.output
# Nitro bundles the libsql JS wrapper but NOT its platform-specific native
# binding (@libsql/<platform>). Copy the @libsql packages into the traced
# node_modules so `require('@libsql/linux-arm64-musl')` resolves at runtime.
COPY --from=build /app/node_modules/@libsql ./.output/server/node_modules/@libsql
# Drizzle migration SQL + journal are assets (not bundled by Nitro); the
# startup plugin applies them from ./server/db/migrations at boot.
COPY --from=build /app/server/db/migrations ./server/db/migrations

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
