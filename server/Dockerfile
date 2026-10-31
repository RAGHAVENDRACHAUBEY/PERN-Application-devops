# syntax=docker/dockerfile:1
ARG NODE_VERSION=22

# ---- base: OS libs Prisma's engines need ----
FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- build: full deps, prisma client, compiled JS ----
FROM base AS build
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- prod-deps: runtime dependencies only ----
FROM base AS prod-deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
# The generated client lives in node_modules/.prisma; copy it rather than
# shipping the prisma CLI (a devDependency) just to regenerate it.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# ---- migrate: one-shot job (`docker compose run migrate`), not part of the API image ----
FROM build AS migrate
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ---- runtime: final, minimal image (default target) ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
