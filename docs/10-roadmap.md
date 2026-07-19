# Roadmap de Desenvolvimento

> A ordem aqui é intencional. Cada fase depende da anterior.
> Não implementar funcionalidades fora de ordem.

---

## Fase 1 — Infraestrutura e Base

- [ ] Inicializar monorepo com Turborepo + pnpm workspaces
- [ ] Configurar TypeScript strict em todos os packages
- [ ] Configurar ESLint + Prettier compartilhados
- [ ] Docker Compose para desenvolvimento (PostgreSQL + MinIO)
- [ ] Criar `packages/types`, `packages/utils`, `packages/ui`
- [ ] Inicializar `apps/api` com NestJS
- [ ] Configurar Prisma com PostgreSQL
- [ ] Configurar `ConfigModule` com validação de env vars
- [ ] Configurar `GlobalExceptionFilter` e `ValidationPipe` global
- [ ] Inicializar `apps/web` com React + Vite + Tailwind + Shadcn
- [ ] Inicializar `apps/admin` com React + Vite + Tailwind + Shadcn
- [ ] Configurar GitHub Actions (CI básico)

## Fase 2 — Banco de Dados

- [ ] Criar schema Prisma completo (todas as entidades)
- [ ] Criar migrations iniciais
- [ ] Criar seed com admin, categorias e produtos de exemplo
- [ ] Validar relacionamentos e constraints

## Fase 3 — Autenticação

- [ ] Módulo `auth` na API: registro, login, logout
- [ ] JWT com access token (memória) e refresh token (cookie HttpOnly)
- [ ] Hash de senha com Argon2
- [ ] `JwtAuthGuard` e `RolesGuard`
- [ ] Rate limiting nas rotas de auth
- [ ] Fluxo de recuperação de senha por email (Resend)
- [ ] Telas de login e cadastro no `web`
- [ ] Login no `admin`

## Fase 4 — Catálogo de Produtos

- [ ] Módulo `category` — CRUD admin
- [ ] Módulo `product` — CRUD admin com upload de imagens (MinIO)
- [ ] Endpoints públicos de listagem e detalhe
- [ ] Filtros: categoria, preço, busca, destaque
- [ ] Paginação
- [ ] Telas no `web`: catálogo, filtros, detalhe do produto
- [ ] Telas no `admin`: listagem, formulário de criação/edição

## Fase 5 — Carrinho e Favoritos

- [ ] Módulo `cart` — persistido no banco
- [ ] Mesclagem de carrinho local (localStorage) com banco ao logar
- [ ] Módulo `favorites`
- [ ] UI do carrinho (drawer lateral) no `web`
- [ ] Página de favoritos no `web`

## Fase 6 — Checkout e Pedidos

- [ ] Módulo `order` — criação a partir do carrinho
- [ ] Módulo `coupon` — validação e aplicação
- [ ] Cálculo de frete (manual por faixa de CEP ou Melhor Envio)
- [ ] Snapshot de endereço no pedido
- [ ] Decremento de estoque ao confirmar pagamento
- [ ] Cancelamento automático por timeout (30 min)
- [ ] Tela de checkout (endereço → revisão → pagamento)
- [ ] Tela de pedidos do usuário no `web`
- [ ] Gestão de pedidos no `admin`

## Fase 7 — Pagamento

- [ ] Integração Mercado Pago Checkout Pro
- [ ] Webhook de confirmação de pagamento
- [ ] Mudança de status do pedido ao receber confirmação
- [ ] Envio de email ao cliente ao confirmar pagamento

## Fase 8 — Emails Transacionais

- [ ] Integração Resend
- [ ] Template: boas-vindas
- [ ] Template: pedido criado
- [ ] Template: pagamento confirmado
- [ ] Template: status do pedido atualizado
- [ ] Template: redefinição de senha

## Fase 9 — Admin Completo

- [ ] Dashboard com métricas básicas (vendas, pedidos, estoque baixo)
- [ ] Exportação de relatório CSV
- [ ] Gestão de cupons
- [ ] Gestão de usuários (visualização, banimento)

## Fase 10 — Testes e Qualidade

- [ ] Testes unitários para Services críticos
- [ ] Testes E2E para fluxos principais (Playwright)
- [ ] Audit de segurança (headers, CORS, rate limit)
- [ ] Otimização de imagens (lazy loading, WebP)
- [ ] Lighthouse score > 90

## Fase 11 — Deploy

- [ ] Configurar servidor de produção
- [ ] Dockerfiles de produção otimizados
- [ ] Pipeline de deploy no GitHub Actions
- [ ] HTTPS com Let's Encrypt
- [ ] Backup automático do banco
- [ ] Monitoramento de uptime

---

## Fora do escopo (por ora)

- App mobile
- Sistema de avaliações e reviews
- Chat em tempo real
- Programa de fidelidade / pontos
- Múltiplos vendedores (marketplace)
