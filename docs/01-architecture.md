# Arquitetura

## Visão geral

O projeto é um **monorepo gerenciado pelo Turborepo**. Essa escolha permite compartilhar tipos TypeScript
entre backend e frontend sem duplicação, e executar builds/testes em paralelo com cache.

## Estrutura de pastas

```
atelier/
├── apps/
│   ├── api/                  → NestJS REST API (porta 3333)
│   │   ├── src/
│   │   │   ├── modules/      → Um diretório por domínio (product, order, user, auth...)
│   │   │   ├── common/       → Guards, interceptors, filters, decorators globais
│   │   │   ├── config/       → ConfigModule, validação de env vars com Joi
│   │   │   ├── prisma/       → PrismaModule e PrismaService
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── test/
│   │
│   ├── web/                  → Loja pública (porta 5173)
│   │   ├── src/
│   │   │   ├── features/     → Um diretório por funcionalidade (catalog, cart, checkout...)
│   │   │   ├── components/   → Componentes genéricos reutilizáveis
│   │   │   ├── hooks/        → Hooks globais (useAuth, useCart...)
│   │   │   ├── lib/          → axios instance, queryClient, formatters
│   │   │   ├── routes/       → React Router com lazy loading
│   │   │   └── main.tsx
│   │   └── public/
│   │
│   └── admin/                → Painel admin (porta 5174)
│       └── src/
│           ├── features/     → products, orders, customers, reports
│           ├── components/
│           ├── hooks/
│           ├── lib/
│           └── routes/
│
└── packages/
    ├── ui/                   → Componentes Shadcn/ui compartilhados entre web e admin
    ├── types/                → Tipos e interfaces TypeScript exportados para todos os apps
    └── utils/                → Funções puras sem dependência de framework (format, mask, calc)
```

## Estrutura interna de um módulo NestJS

Cada domínio de negócio é um módulo isolado com a seguinte estrutura:

```
modules/product/
├── product.module.ts
├── product.controller.ts      → Recebe HTTP, valida DTO, chama Service
├── product.service.ts         → Lógica de negócio, orquestra Repositories
├── product.repository.ts      → Acesso ao Prisma, queries ao banco
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   └── product-filters.dto.ts
├── entities/
│   └── product.entity.ts      → Tipo de retorno público (sem campos sensíveis)
└── product.service.spec.ts    → Testes unitários do Service
```

## Módulos da API

| Módulo       | Responsabilidade                                              |
|--------------|---------------------------------------------------------------|
| `auth`       | Login, refresh token, logout                                  |
| `user`       | CRUD de usuário, endereços, favoritos                         |
| `product`    | CRUD de produtos, imagens, categorias                         |
| `category`   | Gerenciamento de categorias                                   |
| `cart`       | Carrinho de compras (persistido no banco por sessão)          |
| `order`      | Criação e gestão do ciclo de vida de pedidos                  |
| `payment`    | Integração Mercado Pago, webhooks                             |
| `coupon`     | Cupons de desconto com validação                              |
| `storage`    | Upload de imagens para MinIO/R2                               |
| `email`      | Envio de emails transacionais via Resend                      |
| `report`     | Relatórios para o admin (vendas, estoque)                     |

## Fluxo de uma requisição

```
Cliente HTTP
    ↓
[Guard] → verifica JWT (se rota privada)
    ↓
[Controller] → valida DTO com class-validator, extrai dados
    ↓
[Service] → executa lógica de negócio, valida regras
    ↓
[Repository] → executa query no Prisma
    ↓
[Banco PostgreSQL]
    ↑
[Repository] → retorna dado bruto
    ↑
[Service] → mapeia para Entity (remove campos sensíveis)
    ↑
[Controller] → retorna resposta padronizada
    ↑
Cliente HTTP
```

## Comunicação entre apps

- `web` e `admin` se comunicam **exclusivamente** com a `api` via HTTP REST
- Não existe comunicação direta entre `web` e `admin`
- O pacote `packages/types` é o contrato compartilhado — quando um DTO muda na API, o tipo muda aqui também
- Nunca copie tipos entre apps — sempre importe de `@atelier/types`

## Variáveis de ambiente

- Toda variável de ambiente é validada na inicialização com Joi (`config/env.validation.ts`)
- Se uma variável obrigatória estiver ausente, a aplicação não sobe
- Nunca acesse `process.env` diretamente — use o `ConfigService` do NestJS
