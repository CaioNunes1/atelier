# Segurança

## Autenticação — JWT com Refresh Token

### Fluxo

1. **Login:** usuário envia email + senha → API valida com Argon2 → retorna `access_token` (15min) e `refresh_token` (7 dias)
2. **Requisições:** frontend envia `access_token` no header `Authorization: Bearer ...`
3. **Refresh:** quando `access_token` expira (401), frontend chama `POST /api/auth/refresh` com o `refresh_token`
4. **Logout:** frontend chama `POST /api/auth/logout` → API invalida o `refresh_token` no banco

### Regras de token

- `access_token`: JWT assinado com `JWT_SECRET`, expira em 15 minutos, **não armazenado no banco**
- `refresh_token`: string aleatória (UUID v4), hash armazenado no banco (`RefreshToken`), expira em 7 dias
- Ao fazer refresh, o refresh token antigo é **invalidado** e um novo é gerado (rotation)
- Refresh tokens são armazenados como **hash** (Argon2) — nunca o valor puro

### Armazenamento no frontend

- `access_token`: memória JavaScript (variável de estado) — nunca `localStorage`
- `refresh_token`: cookie `HttpOnly; Secure; SameSite=Strict` — não acessível por JS
- Essa combinação protege contra XSS (access em memória) e CSRF (SameSite cookie)

## Hashing de senha

- Usar **Argon2id** via biblioteca `argon2` do Node
- Nunca usar MD5, SHA1 ou bcrypt puro para senhas novas
- Configuração recomendada: `{ type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 }`

## CORS

Configurar no NestJS com domínios explícitos:

```typescript
app.enableCors({
  origin: [process.env.WEB_URL, process.env.ADMIN_URL],
  credentials: true,  // necessário para cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

Nunca usar `origin: '*'` em produção.

## Rate Limiting

Usar `@nestjs/throttler`:

| Endpoint                     | Limite               |
|------------------------------|----------------------|
| `POST /auth/login`           | 5 tentativas / 1 min |
| `POST /auth/register`        | 3 registros / 1 min  |
| `POST /auth/forgot-password` | 3 por hora           |
| API geral                    | 100 req / 1 min      |
| Webhook Mercado Pago         | Sem limite (IP fixo) |

## Helmet

Ativar o `helmet` no NestJS para definir headers de segurança HTTP:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

Isso adiciona: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.

## Validação do Webhook do Mercado Pago

- O endpoint `POST /api/payments/webhook` é público
- Validar a assinatura do webhook usando `MP_WEBHOOK_SECRET` antes de processar qualquer dado
- Rejeitar com 401 se a assinatura for inválida

```typescript
// Verificar header x-signature enviado pelo Mercado Pago
const isValid = verifyMercadoPagoSignature(req.headers['x-signature'], body, secret);
if (!isValid) throw new UnauthorizedException();
```

## Upload de arquivos

- Validar MIME type da imagem **no backend** (não confiar apenas no frontend)
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo: 5MB por arquivo
- Renomear arquivo com UUID — nunca usar o nome original do arquivo do usuário
- Servir imagens via URL do MinIO/R2, nunca via API

## Sanitização

- Usar `ValidationPipe` global com `{ whitelist: true, forbidNonWhitelisted: true }` — remove campos não declarados no DTO automaticamente
- Não há necessidade de sanitização HTML separada por ora (não exibimos HTML gerado por usuário)

## Autorização por papel

- `CUSTOMER`: acessa rotas públicas e rotas próprias (`/me`, `/cart`, `/orders`)
- `ADMIN`: acessa tudo, incluindo `/admin/*`
- Implementar com `RolesGuard` + decorator `@Roles('ADMIN')`
- **Nunca checar `user.role` no controller manualmente** — use o guard

## LGPD

- Usuário pode solicitar **exclusão de dados** via `DELETE /api/me`
- Exclusão não é imediata — cria uma solicitação processada em até 30 dias
- Dados anonimizados: nome → "Usuário Removido", email → hash único, dados pessoais → null
- Pedidos são mantidos por obrigação fiscal (5 anos), mas desvinculados do usuário
- Logs de acesso mantidos por 6 meses

## Variáveis de ambiente sensíveis

- Nunca commitar `.env` — usar `.env.example` com valores placeholder
- Em produção, usar secrets do GitHub Actions ou variáveis de ambiente do servidor
- Rotacionar `JWT_SECRET` e `JWT_REFRESH_SECRET` se houver suspeita de comprometimento (invalida todas as sessões)

## Logs e Auditoria

- Logar autenticações (login, logout, refresh, falhas) com IP e timestamp
- Logar mudanças de status de pedidos com o usuário que realizou a ação
- Nunca logar senhas, tokens ou dados de cartão
- Em produção, enviar logs para serviço externo (ex: Logtail, Papertrail)
