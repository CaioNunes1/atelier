# Contrato da API

## Base URL

```
Desenvolvimento: http://localhost:3333/api
Produção:        https://api.seudominio.com.br/api
```

## Autenticação

Rotas protegidas exigem o header:
```
Authorization: Bearer <access_token>
```

## Formato de resposta padrão

### Sucesso — item único
```json
{
  "data": { ... }
}
```

### Sucesso — lista paginada
```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}
```

### Erro
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Produto não encontrado"
}
```

### Erro de validação (400)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["name must not be empty", "price_in_cents must be a positive integer"]
}
```

## Paginação

Query params padrão para listagens:
- `page` (default: 1)
- `per_page` (default: 20, máx: 100)
- `sort` (campo para ordenação)
- `order` (`asc` | `desc`, default: `desc`)

## Endpoints

### Auth
```
POST   /api/auth/register        → Cadastro de cliente
POST   /api/auth/login           → Login, retorna access_token e refresh_token
POST   /api/auth/refresh         → Renova access_token com refresh_token
POST   /api/auth/logout          → Invalida refresh_token
POST   /api/auth/forgot-password → Envia email de redefinição
POST   /api/auth/reset-password  → Redefine senha com token do email
```

### Produtos (público)
```
GET    /api/products             → Lista produtos ativos (paginado, com filtros)
GET    /api/products/:slug       → Detalhe de produto por slug
GET    /api/products/featured    → Produtos em destaque (home)
```

### Produtos (admin)
```
GET    /api/admin/products           → Lista todos os produtos (incluindo inativos)
POST   /api/admin/products           → Cria produto
PATCH  /api/admin/products/:id       → Atualiza produto
DELETE /api/admin/products/:id       → Desativa produto (soft delete)
POST   /api/admin/products/:id/images → Upload de imagens
DELETE /api/admin/products/:id/images/:imageId → Remove imagem
```

### Categorias
```
GET    /api/categories           → Lista categorias ativas
GET    /api/admin/categories     → Lista todas as categorias (admin)
POST   /api/admin/categories     → Cria categoria
PATCH  /api/admin/categories/:id → Atualiza categoria
```

### Carrinho (requer autenticação)
```
GET    /api/cart                 → Retorna carrinho do usuário autenticado
POST   /api/cart/items           → Adiciona item ao carrinho
PATCH  /api/cart/items/:itemId   → Atualiza quantidade
DELETE /api/cart/items/:itemId   → Remove item
DELETE /api/cart                 → Limpa carrinho
```

### Pedidos
```
POST   /api/orders               → Cria pedido a partir do carrinho (requer auth)
GET    /api/orders               → Lista pedidos do usuário autenticado
GET    /api/orders/:id           → Detalhe do pedido
```

### Pedidos (admin)
```
GET    /api/admin/orders         → Lista todos os pedidos (com filtros)
GET    /api/admin/orders/:id     → Detalhe do pedido
PATCH  /api/admin/orders/:id/status → Atualiza status manualmente
```

### Pagamento
```
POST   /api/payments/checkout    → Cria preferência no Mercado Pago, retorna URL
POST   /api/payments/webhook     → Webhook do Mercado Pago (público, validado por assinatura)
```

### Cupons
```
POST   /api/coupons/validate     → Valida cupom e retorna desconto calculado
GET    /api/admin/coupons        → Lista cupons (admin)
POST   /api/admin/coupons        → Cria cupom
PATCH  /api/admin/coupons/:id    → Atualiza cupom
```

### Usuário (requer autenticação)
```
GET    /api/me                   → Dados do usuário autenticado
PATCH  /api/me                   → Atualiza nome, email
PATCH  /api/me/password          → Altera senha
DELETE /api/me                   → Solicita exclusão de conta (LGPD)
GET    /api/me/addresses         → Lista endereços
POST   /api/me/addresses         → Cria endereço
PATCH  /api/me/addresses/:id     → Atualiza endereço
DELETE /api/me/addresses/:id     → Remove endereço
GET    /api/me/favorites         → Lista favoritos
POST   /api/me/favorites/:productId   → Favorita produto
DELETE /api/me/favorites/:productId   → Desfavorita produto
```

### Frete
```
POST   /api/shipping/calculate   → Calcula frete por CEP e lista de itens
```

## Filtros de produto

```
GET /api/products?category=bolsas&min_price=5000&max_price=30000&sort=price&order=asc&page=1&per_page=20
```

| Param        | Tipo   | Descrição                       |
|--------------|--------|---------------------------------|
| `category`   | string | Slug da categoria               |
| `min_price`  | int    | Preço mínimo em centavos        |
| `max_price`  | int    | Preço máximo em centavos        |
| `sort`       | string | `price`, `name`, `created_at`   |
| `order`      | string | `asc` ou `desc`                 |
| `featured`   | bool   | Filtra apenas destaques         |
| `search`     | string | Busca por nome ou descrição     |

## Códigos de status usados

| Status | Uso                                               |
|--------|---------------------------------------------------|
| 200    | Sucesso em GET e PATCH                            |
| 201    | Recurso criado com sucesso (POST)                 |
| 204    | Sucesso sem corpo (DELETE)                        |
| 400    | Erro de validação ou regra de negócio             |
| 401    | Não autenticado                                   |
| 403    | Autenticado mas sem permissão (ex: não é admin)   |
| 404    | Recurso não encontrado                            |
| 409    | Conflito (ex: email já cadastrado)                |
| 422    | Entidade não processável (regra de negócio)       |
| 500    | Erro interno do servidor                          |

## Versionamento

- Sem versionamento explícito na URL por ora (`/api/v1/`)
- Se futuramente necessário, adicionar via header: `API-Version: 2`
