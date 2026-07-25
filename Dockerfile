FROM node:20-alpine AS base

RUN npm install -g pnpm


# =========================
# DEPENDÊNCIAS
# =========================

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile


# =========================
# BUILD
# =========================

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY . .

RUN pnpm --filter api build

# Gera o Prisma Client
RUN pnpm --filter api exec prisma generate


# =========================
# PRODUÇÃO
# =========================

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copia aplicação compilada
COPY --from=builder /app/apps/api/dist ./dist

# Copia package.json da API
COPY --from=builder /app/apps/api/package.json ./package.json

# Copia Prisma
COPY --from=builder /app/apps/api/prisma ./prisma

# Copia dependências
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 3333

CMD ["sh", "-c", "cd /app/apps/api && pnpm exec prisma migrate deploy && cd /app && node dist/main.js"]