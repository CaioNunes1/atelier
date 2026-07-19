# Backend — Padrões NestJS

## Stack

- **NestJS** com TypeScript estrito (`strict: true`)
- **Prisma** como ORM
- **class-validator + class-transformer** para validação de DTOs
- **Passport.js** com estratégia JWT para autenticação
- **Argon2** para hash de senhas
- **Multer** para upload de arquivos (imagens)

## Estrutura obrigatória de módulo

Todo módulo de domínio deve ter exatamente:

```
modules/<name>/
├── <name>.module.ts       → Declara imports, providers, exports
├── <name>.controller.ts   → HTTP only — valida DTO, chama service, retorna resposta
├── <name>.service.ts      → Lógica de negócio — sem HTTP, sem Prisma direto
├── <name>.repository.ts   → Acesso ao Prisma — sem lógica de negócio
├── dto/
│   ├── create-<name>.dto.ts
│   ├── update-<name>.dto.ts
│   └── <name>-filters.dto.ts (se houver listagem com filtros)
├── entities/
│   └── <name>.entity.ts   → Interface de retorno público (sem password_hash, etc.)
└── <name>.service.spec.ts → Testes unitários do Service (mock do Repository)
```

## Regras que a IA deve sempre seguir

### Controller
- Faz **apenas** três coisas: receber requisição, chamar o service, retornar resposta
- **Nunca** acessa o Prisma diretamente
- **Nunca** contém lógica de negócio (validações de regra, cálculos, condicionais de domínio)
- Toda rota protegida usa `@UseGuards(JwtAuthGuard)`
- Toda rota admin usa `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')`
- Retorno sempre no formato padronizado (ver `06-api-contract.md`)

```typescript
// ✅ Correto
@Get(':id')
@UseGuards(JwtAuthGuard)
async findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.productService.findById(id);
}

// ❌ Errado — lógica de negócio no controller
@Get(':id')
async findOne(@Param('id') id: string) {
  const product = await this.prisma.product.findUnique({ where: { id } });
  if (!product.is_active) throw new NotFoundException();
  return product;
}
```

### Service
- Contém **toda a lógica de negócio**
- Chama **apenas** repositories — nunca chama outro service diretamente (use eventos ou injeção explícita)
- Lança exceções do NestJS (`NotFoundException`, `BadRequestException`, `ConflictException`)
- Nunca retorna dados com `password_hash` ou campos sensíveis — use o entity como tipo de retorno
- **Nunca** importa `PrismaService` diretamente

```typescript
// ✅ Correto
async findById(id: string): Promise<ProductEntity> {
  const product = await this.productRepository.findById(id);
  if (!product) throw new NotFoundException('Produto não encontrado');
  if (!product.is_active) throw new NotFoundException('Produto indisponível');
  return this.mapToEntity(product);
}
```

### Repository
- Acessa **apenas o Prisma** — sem lógica de negócio, sem validações de regra
- Métodos com nomes descritivos: `findById`, `findAllActive`, `findBySlug`, etc.
- Recebe parâmetros simples (IDs, filtros) e retorna dados crus do Prisma
- Nunca lança exceções — retorna `null` quando não encontra

```typescript
// ✅ Correto
async findById(id: string) {
  return this.prisma.product.findUnique({ where: { id, deleted_at: null } });
}
```

### DTOs
- **Sempre** usar `class-validator` para validação
- **Sempre** usar `@IsUUID()` para IDs
- **Sempre** usar `@Transform()` para normalização (ex: trim em strings)
- **Nunca** usar `any` — se não sabe o tipo, crie um tipo
- DTOs de update usam `PartialType(CreateDto)` do NestJS

```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @MaxLength(120)
  name: string;

  @IsInt()
  @Min(0)
  price_in_cents: number;

  @IsUUID()
  category_id: string;
}
```

### Entity (tipo de retorno público)
- Define exatamente quais campos são retornados ao cliente
- Remove campos sensíveis (`password_hash`, `deleted_at`, tokens)
- Pode ser uma interface ou classe TypeScript

## Módulo de configuração

- Usar `@nestjs/config` com `ConfigModule.forRoot({ isGlobal: true, validationSchema })`
- Validar todas as env vars com Joi na inicialização
- Nunca usar `process.env` fora do `ConfigService`

## Tratamento de erros

- Usar o `GlobalExceptionFilter` em `common/filters/`
- Todos os erros retornam no formato: `{ error: string, message: string, statusCode: number }`
- Erros de validação do `class-validator` são formatados pelo `ValidationPipe` global

## Variáveis de ambiente necessárias

```env
# App
NODE_ENV=development
PORT=3333

# Banco
DATABASE_URL=postgresql://user:pass@localhost:5432/atelier

# JWT
JWT_SECRET=sua-chave-secreta-muito-longa
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outra-chave-secreta
JWT_REFRESH_EXPIRES_IN=7d

# Storage
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minio-user
STORAGE_SECRET_KEY=minio-pass
STORAGE_BUCKET=atelier

# Mercado Pago
MP_ACCESS_TOKEN=seu-token
MP_WEBHOOK_SECRET=seu-webhook-secret

# Email
RESEND_API_KEY=sua-chave

# Frontend URL (para CORS e redirect após pagamento)
WEB_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```
