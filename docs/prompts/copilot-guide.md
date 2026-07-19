# Guia para IA (Copilot / Claude / Cursor)

> Você é um assistente de desenvolvimento trabalhando no projeto **Atelier** —
> um e-commerce de produtos artesanais feitos à mão.
> Siga estas instruções rigorosamente antes de gerar qualquer código.

---

## Passo 1 — Leia sempre primeiro

Antes de qualquer implementação, leia:
1. `00-project-overview.md` — o que é o projeto, a stack, os princípios
2. `02-business-rules.md` — as regras de negócio do domínio em questão

## Passo 2 — Leia o arquivo relevante para a tarefa

| Se a tarefa envolve...         | Leia também...        |
|--------------------------------|-----------------------|
| Código NestJS / backend        | `04-backend.md`       |
| Código React / frontend        | `05-frontend.md`      |
| Criar ou consumir endpoints    | `06-api-contract.md`  |
| Auth, tokens, segurança        | `07-security.md`      |
| Testes                         | `08-testing.md`       |
| Docker, deploy, CI/CD          | `09-deployment.md`    |
| Entidades, banco, Prisma       | `03-database.md`      |

---

## Regras que nunca devem ser violadas

### TypeScript
- **Nunca** usar `any` — se não sabe o tipo, crie uma interface
- Ativar e respeitar `strict: true`
- Tipos compartilhados ficam em `packages/types`, nunca duplicados

### Backend (NestJS)
- **Controller** → apenas recebe HTTP e delega ao Service
- **Service** → lógica de negócio, lança exceções, mapeia entidades
- **Repository** → apenas Prisma, sem lógica de negócio
- **Nunca** importar `PrismaService` diretamente no Controller ou Service — use o Repository
- **Sempre** criar DTOs com `class-validator` para inputs
- **Sempre** usar guards para autenticação — nunca validar JWT manualmente
- **Sempre** usar `ParseUUIDPipe` para params de ID
- Erros retornam no formato padronizado de `06-api-contract.md`

### Frontend (React)
- **Nunca** fazer fetch com `useEffect` — use TanStack Query
- **Nunca** criar instância Axios separada — use `lib/axios.ts`
- **Sempre** usar `React Hook Form` + `Zod` para formulários
- **Sempre** tipar props dos componentes com interface TypeScript
- **Sempre** usar `formatPrice()` para exibir valores monetários
- Código organizado por `features/`, não por tipo de arquivo

### Banco / Prisma
- Preços sempre em **centavos** (Int) — nunca float para dinheiro
- IDs sempre UUID — nunca Int auto-increment
- **Nunca** deletar fisicamente pedidos, produtos ou usuários — use `deleted_at`
- Snapshots em pedidos: ao criar pedido, copiar nome do produto e endereço

### Segurança
- Refresh token sempre em cookie `HttpOnly` — nunca `localStorage`
- Access token sempre em memória JavaScript — nunca `localStorage`
- Validar assinatura do webhook do Mercado Pago antes de processar
- Upload de imagem: validar MIME type no backend, renomear com UUID

### Geral
- **Nunca** introduzir biblioteca nova sem criar um ADR em `decisions/`
- **Nunca** duplicar código entre `apps/` — extraia para `packages/`
- **Sempre** manter consistência com o padrão já adotado no projeto
- Se uma regra de negócio não está em `02-business-rules.md`, **pergunte** antes de implementar

---

## O que fazer quando não souber

1. Verifique se a regra está em `02-business-rules.md`
2. Verifique se o padrão está em `04-backend.md` ou `05-frontend.md`
3. Verifique o contrato de API em `06-api-contract.md`
4. Se ainda não está documentado: **não invente** — sinalize que falta documentação

---

## Estilo de código

- Usar aspas simples em TypeScript
- Ponto e vírgula ao final das linhas
- 2 espaços de indentação
- Funções nomeadas (`function foo()`) para exports, arrow functions para callbacks
- Imports organizados: libs externas → packages internos → imports relativos
