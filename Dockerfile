FROM node:20-alpine AS base
RUN npm install -g pnpm@8.10.0

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter api exec prisma generate --schema=./apps/api/prisma/schema.prisma
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3333

CMD ["sh", "-c", "pnpm --filter api exec prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]