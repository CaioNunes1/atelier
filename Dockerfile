FROM node:20-alpine AS base

RUN apk add --no-cache openssl

RUN npm install -g pnpm@8.10.0


# =========================
# DEPENDÊNCIAS
# =========================
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile


# =========================
# BUILD
# =========================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY . .

RUN pnpm --filter api exec prisma generate

RUN pnpm --filter api build


# =========================
# RUNNER
# =========================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Mantém a estrutura do workspace
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules

# Mantém a aplicação no local original
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3333

WORKDIR /app/apps/api

# O plano gratuito do Render não oferece pre-deploy command.
# Aplica apenas migrations pendentes antes de iniciar a API.
CMD ["/bin/sh", "-c", "pnpm exec prisma migrate deploy && exec node dist/src/main.js"]
