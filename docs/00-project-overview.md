# Atelier — Visão Geral do Projeto

## O que é este projeto

Atelier é um e-commerce de produtos artesanais feitos à mão para uma costureira autônoma com sede em Recife, PE.
O sistema permite que a proprietária cadastre e venda seus produtos (bolsas, necessaires, carteiras e acessórios)
diretamente para clientes finais, com gerenciamento completo de estoque, pedidos e pagamentos.

## Cliente

- **Proprietária:** artesã autônoma, venda direta ao consumidor (B2C)
- **Público-alvo:** mulheres, 20–50 anos, que valorizam produtos exclusivos e feitos à mão
- **Canal principal:** redes sociais → site → WhatsApp como canal de suporte

## Problema que resolve

Hoje a proprietária vende por DM no Instagram e WhatsApp, sem controle de estoque, sem histórico de pedidos
e sem meio de pagamento integrado. O site centraliza tudo isso e profissionaliza a operação.

## Stack

| Camada      | Tecnologia                                      |
|-------------|------------------------------------------------|
| Monorepo    | Turborepo                                       |
| Backend     | NestJS + Prisma + PostgreSQL                    |
| Frontend    | React + Vite + TanStack Query + Shadcn/ui       |
| Admin       | React + Vite (app separado no monorepo)         |
| Storage     | MinIO (self-hosted) ou Cloudflare R2            |
| Auth        | JWT (access + refresh token) + Argon2           |
| Pagamento   | Mercado Pago (Checkout Pro)                     |
| Email       | Resend                                          |
| Containers  | Docker + Docker Compose                         |
| CI/CD       | GitHub Actions                                  |

## Arquitetura macro

```
Monorepo (Turborepo)
├── apps/
│   ├── api/          → NestJS REST API
│   ├── web/          → Loja pública (React)
│   └── admin/        → Painel administrativo (React)
└── packages/
    ├── ui/           → Componentes Shadcn compartilhados
    ├── types/        → Tipos TypeScript compartilhados (DTOs, entidades)
    └── utils/        → Funções utilitárias puras
```

## Onde encontrar as regras

| Arquivo                  | Conteúdo                                          |
|--------------------------|---------------------------------------------------|
| `01-architecture.md`     | Estrutura do monorepo, módulos, fluxo de dados    |
| `02-business-rules.md`   | Regras de negócio (nunca olhe código, só negócio) |
| `03-database.md`         | Entidades, relacionamentos, convenções Prisma      |
| `04-backend.md`          | Padrões NestJS, estrutura de módulos, regras       |
| `05-frontend.md`         | Padrões React, estrutura de pastas, componentes    |
| `06-api-contract.md`     | Endpoints, resposta padrão, erros, paginação       |
| `07-security.md`         | Auth, tokens, CORS, rate limit, LGPD              |
| `08-testing.md`          | Estratégia de testes, cobertura mínima             |
| `09-deployment.md`       | Docker, CI/CD, variáveis de ambiente               |
| `10-roadmap.md`          | Ordem de desenvolvimento                           |
| `decisions/`             | ADRs — por que tomamos cada decisão técnica        |
| `prompts/copilot-guide.md` | Instruções específicas para a IA               |

## Princípios inegociáveis

1. **Nunca usar `any` em TypeScript** — se não sabe o tipo, crie um tipo.
2. **Nunca acessar Prisma fora do Repository** — Controller → Service → Repository.
3. **Nunca introduzir biblioteca nova sem ADR** — registre a decisão em `decisions/`.
4. **Regras de negócio vivem no Service**, nunca no Controller ou no Prisma hook.
5. **Toda rota autenticada usa guard**, nunca valide JWT manualmente no Controller.
