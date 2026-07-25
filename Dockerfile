FROM node:20-alpine AS base
# Usa a mesma versão do packageManager da raiz
RUN npm install -g pnpm@8.10.0

# ─── Dependências ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules 2>/dev/null || true
COPY . .

# Gera Prisma Client
RUN ./node_modules/.bin/prisma generate --schema=./apps/api/prisma/schema.prisma

# Compila NestJS
RUN pnpm --filter api build

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia dist compilado
COPY --from=builder /app/apps/api/dist ./dist

# Copia Prisma (schema + migrations)
COPY --from=builder /app/apps/api/prisma ./prisma

# Copia node_modules da raiz (contém o prisma binário)
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3333

# Usa o binário direto — sem workspace
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]