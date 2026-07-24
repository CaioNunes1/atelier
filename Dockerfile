FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# ─── Dependências ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copia apenas os manifests para cache eficiente
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
# Copia packages que a API pode importar
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules 2>/dev/null || true
COPY . .

# Gera o Prisma Client durante o build (obrigatório)
RUN pnpm --filter api exec prisma generate

# Compila o NestJS
RUN pnpm --filter api build

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia apenas o necessário para rodar
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3333

# USA pnpm exec — respeita a versão do prisma instalada no projeto
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]