# Deploy e Infraestrutura

## Ambiente de desenvolvimento local

### Requisitos

- Docker e Docker Compose
- Node.js 20+
- pnpm 9+

### Serviços via Docker Compose (dev)

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: atelier
      POSTGRES_USER: atelier
      POSTGRES_PASSWORD: atelier_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minio_user
      MINIO_ROOT_PASSWORD: minio_pass
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Inicialização

```bash
# Subir banco e storage
docker compose -f docker-compose.dev.yml up -d

# Instalar dependências
pnpm install

# Rodar migrations e seed
cd apps/api && pnpm prisma migrate dev && pnpm prisma db seed

# Iniciar todos os apps em desenvolvimento
pnpm turbo dev
```

## Containers de produção

Cada app tem seu `Dockerfile` otimizado:

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo build --filter=api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3333
CMD ["node", "dist/main.js"]
```

### Docker Compose de produção

```yaml
# docker-compose.prod.yml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports: ["3333:3333"]
    env_file: .env.production
    depends_on: [postgres]
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports: ["80:80"]
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    env_file: .env.production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio
    env_file: .env.production
    volumes:
      - minio_data:/data
    command: server /data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports: ["443:443", "80:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs  # Let's Encrypt
    depends_on: [api, web]
    restart: unless-stopped
```

## CI/CD — GitHub Actions

### Pipeline de PR (`.github/workflows/ci.yml`)

```yaml
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build
      - run: pnpm turbo test
      - run: pnpm turbo lint
```

### Pipeline de deploy (`.github/workflows/deploy.yml`)

Acionado apenas em push na branch `main`:
1. Rodar testes
2. Build das imagens Docker
3. Push para registro (GitHub Container Registry ou Docker Hub)
4. SSH no servidor → `docker compose pull && docker compose up -d`
5. Rodar `prisma migrate deploy` no container da API

## Servidor de produção

- **VPS:** Contabo, DigitalOcean ou Hetzner (mínimo 2GB RAM, 2 vCPUs)
- **OS:** Ubuntu 24.04 LTS
- **HTTPS:** Certbot + Let's Encrypt (renovação automática)
- **Reverse proxy:** Nginx
- **Banco:** PostgreSQL no mesmo servidor (pequena escala) — backup diário via cron para S3/R2

## Backup

```bash
# Cron job no servidor (diariamente às 3h)
0 3 * * * docker exec atelier-postgres pg_dump -U atelier atelier | gzip > /backups/atelier_$(date +\%Y\%m\%d).sql.gz
```

Manter últimos 30 dias de backup.

## Variáveis de ambiente de produção

Nunca commitar. Gerenciar via:
- **Desenvolvimento:** arquivo `.env` local (no `.gitignore`)
- **CI/CD:** GitHub Actions Secrets
- **Produção:** arquivo `.env.production` no servidor (permissão 600)

## Monitoramento

- **Uptime:** UptimeRobot (gratuito) para alertas de downtime
- **Logs:** `docker compose logs -f api` ou integração com Logtail
- **Métricas:** a implementar futuramente (Prometheus + Grafana)
