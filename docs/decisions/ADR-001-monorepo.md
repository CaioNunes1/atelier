# ADR-001 — Monorepo com Turborepo

**Data:** 2025  
**Status:** Aceito

## Contexto

O projeto tem três apps (API, loja pública, painel admin) que compartilham tipos TypeScript e utilitários.
Precisávamos decidir entre projetos separados em repositórios distintos ou um monorepo.

## Decisão

Usar **monorepo gerenciado pelo Turborepo** com **pnpm workspaces**.

## Justificativa

- **Tipos compartilhados sem duplicação:** `packages/types` exporta tipos usados pela API e pelos dois frontends. Quando um DTO muda, o erro de TypeScript aparece em todos os apps ao mesmo tempo — impossível com repos separados.
- **Turborepo com cache:** builds e testes são cacheados. Se apenas o frontend mudou, o backend não é recompilado.
- **DX unificada:** um único `pnpm install`, um único `pnpm turbo dev` sobe todos os apps.
- **CI/CD simples:** um único pipeline, um único repositório para revisar PRs.

## Trade-offs aceitos

- Monorepo pode ficar lento em projetos muito grandes — mas para este escopo é irrelevante.
- Curva de aprendizado inicial do Turborepo — mitigada pela boa documentação.

## Alternativas consideradas

- **Repos separados:** descartado pela duplicação de tipos e complexidade de sincronização.
- **Nx:** mais poderoso mas muito mais complexo para um projeto neste tamanho.
