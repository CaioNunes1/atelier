# ADR-002 — Autenticação com JWT + Refresh Token

**Data:** 2025  
**Status:** Aceito

## Contexto

Precisávamos de uma estratégia de autenticação stateless que funcionasse bem com uma SPA (React)
sem depender de sessões no servidor.

## Decisão

**JWT com dois tokens:**
- `access_token`: curta duração (15 min), armazenado em memória JavaScript
- `refresh_token`: longa duração (7 dias), armazenado em cookie `HttpOnly; Secure; SameSite=Strict`

## Justificativa

- **Sem sessões no banco** (para access): API completamente stateless e escalável.
- **Proteção XSS:** access token em memória não é acessível por scripts maliciosos (diferente de localStorage).
- **Proteção CSRF:** cookie com `SameSite=Strict` não é enviado em requisições cross-site.
- **Revogação possível:** refresh token armazenado (como hash) no banco, pode ser invalidado no logout ou suspeita de comprometimento.
- **Token rotation:** ao usar o refresh token, ele é invalidado e um novo é gerado — detecta uso duplicado.

## Trade-offs aceitos

- Maior complexidade no frontend (interceptor de Axios para refresh automático).
- Refresh token no banco significa uma query extra no refresh — aceitável.

## Alternativas consideradas

- **Sessões server-side:** descartado por ser stateful e complexo de escalar.
- **Apenas localStorage:** descartado por vulnerabilidade a XSS.
- **OAuth com provider externo (Google/GitHub):** considerado, mas adiciona dependência externa e complexidade para um e-commerce simples com registro próprio.
