FROM node:20-alpine AS base

RUN npm install -g pnpm@8.10.0


# =========================================================
# DEPENDÊNCIAS
# =========================================================
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile


# =========================================================
# BUILD
# =========================================================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY . .

RUN pnpm --filter api exec prisma generate

RUN pnpm --filter api build


# =========================================================
# PRODUÇÃO
# =========================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist

COPY --from=builder /app/apps/api/prisma ./prisma

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 3333

CMD ["sh", "-c", "cd /app/apps/api && pnpm exec prisma migrate deploy && node /app/dist/main.js"]