# Testes

## Estratégia geral

| Tipo          | Ferramenta          | Apps          | Cobertura mínima |
|---------------|---------------------|---------------|------------------|
| Unitário      | Jest                | `api`         | 70% dos Services |
| Integração    | Jest + Prisma test  | `api`         | Módulos críticos |
| Componente    | Vitest + RTL        | `web`, `admin`| Componentes chave|
| E2E           | Playwright          | `web`         | Fluxos críticos  |

## Backend — Testes Unitários (Jest)

### O que testar

- **Sempre testar:** Services — são onde vive a lógica de negócio
- **Não testar:** Controllers (testados via integração), Repositories (testados via integração com banco real)

### Como mockar

Usar `jest.fn()` para mockar o Repository no Service:

```typescript
// product.service.spec.ts
describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProductService);
    repository = module.get(ProductRepository);
  });
```

### Convenções de nomenclatura

```typescript
describe('ProductService', () => {
  describe('findById', () => {
    it('should return product when found', async () => { ... });
    it('should throw NotFoundException when product not found', async () => { ... });
    it('should throw NotFoundException when product is inactive', async () => { ... });
  });
});
```

### Módulos críticos que devem ter testes unitários

- `auth` — login, registro, refresh, validação de token
- `order` — criação de pedido, mudança de status, cancelamento
- `cart` — adição de item, validação de estoque, mesclagem
- `coupon` — validação de cupom, cálculo de desconto
- `payment` — processamento de webhook, verificação de assinatura

## Backend — Testes de Integração

- Usar banco PostgreSQL em container Docker dedicado para testes
- Rodar migrations antes da suíte: `prisma migrate deploy`
- Limpar banco entre testes com `prisma.$transaction` e rollback
- Testar o fluxo completo: HTTP → Controller → Service → Repository → Banco

## Frontend — Testes de Componente (Vitest + RTL)

```typescript
// ProductCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

it('should display product name and price', () => {
  render(<ProductCard product={mockProduct} />)
  expect(screen.getByText('Bolsa de Couro')).toBeInTheDocument()
  expect(screen.getByText('R$ 189,90')).toBeInTheDocument()
})
```

### O que testar no frontend

- Renderização de componentes com diferentes props
- Interações de usuário (clique, digitação)
- Exibição correta de estados: loading, error, empty
- Formulários: validação, submissão

## E2E — Playwright

### Fluxos críticos que devem ter teste E2E

1. **Compra completa:** navegar catálogo → produto → carrinho → login → checkout → pagamento simulado
2. **Autenticação:** cadastro → login → logout → redefinição de senha
3. **Admin:** login admin → criar produto → publicar → verificar na loja
4. **Favoritos:** favoritar produto → ver na página de favoritos

### Configuração

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:5173',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

### Convenção de seletores

- **Sempre** usar `data-testid` para elementos interativos nos testes E2E
- Nunca usar seletores CSS frágeis (`div.class > span:nth-child(2)`)

```tsx
// No componente
<button data-testid="add-to-cart-btn">Adicionar ao carrinho</button>

// No teste
await page.getByTestId('add-to-cart-btn').click();
```

## Quando criar testes

- **Ao criar um Service:** criar o spec junto, na mesma PR
- **Ao corrigir um bug:** criar teste que reproduce o bug antes de corrigir
- **Para novos fluxos E2E:** ao concluir uma feature completa no frontend

## Como rodar

```bash
# Unitários (api)
cd apps/api && pnpm test

# Unitários com watch
pnpm test:watch

# Cobertura
pnpm test:cov

# E2E
cd apps/web && pnpm test:e2e

# Todos (via Turborepo)
pnpm turbo test
```
