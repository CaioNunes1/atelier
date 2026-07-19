# Banco de Dados

## Tecnologia

- **PostgreSQL 16** como banco relacional
- **Prisma ORM** como interface de acesso ao banco
- Migrations gerenciadas pelo Prisma (`prisma migrate dev`)

## Convenções

- Nomes de tabelas em **snake_case plural** (ex: `order_items`)
- Nomes de colunas em **snake_case** (ex: `created_at`)
- Prisma mapeia automaticamente para camelCase no código TypeScript
- Todo `id` é `UUID` gerado pelo banco (`@default(uuid())`)
- Toda tabela tem `created_at` e `updated_at` (`@updatedAt`)
- **Nunca deletar registros de pedidos, produtos ou usuários** — use soft delete com `deleted_at`
- Preços sempre em **centavos** (`Int`) — ex: R$ 89,90 → `8990`

## Entidades e Relacionamentos

```
User
├── id (UUID)
├── name
├── email (único)
├── password_hash
├── role (CUSTOMER | ADMIN)
├── email_verified_at
├── deleted_at (soft delete)
├── created_at
├── updated_at
│
├── → Address[] (1:N)
├── → Favorite[] (1:N)
├── → Order[] (1:N)
└── → RefreshToken[] (1:N)

Address
├── id (UUID)
├── user_id (FK → User)
├── label (ex: "Casa", "Trabalho")
├── zip_code
├── street
├── number
├── complement
├── neighborhood
├── city
├── state
└── is_default

Category
├── id (UUID)
├── name
├── slug (único)
├── is_active
├── created_at
└── updated_at
    └── → Product[] (1:N)

Product
├── id (UUID)
├── category_id (FK → Category)
├── name
├── slug (único)
├── description
├── price_in_cents (Int)
├── is_active
├── is_featured
├── stock (Int, default 0)
├── deleted_at
├── created_at
└── updated_at
    ├── → ProductImage[] (1:N)
    ├── → ProductVariant[] (1:N)
    ├── → Favorite[] (1:N)
    ├── → CartItem[] (1:N)
    └── → OrderItem[] (1:N)

ProductImage
├── id (UUID)
├── product_id (FK → Product)
├── url
├── position (Int, ordem da imagem)
└── created_at

ProductVariant
├── id (UUID)
├── product_id (FK → Product)
├── name (ex: "Azul Royal", "Couro Sintético")
├── stock (Int)
└── price_modifier_in_cents (Int, pode ser negativo)

Cart
├── id (UUID)
├── user_id (FK → User, único)
├── created_at
└── updated_at
    └── → CartItem[] (1:N)

CartItem
├── id (UUID)
├── cart_id (FK → Cart)
├── product_id (FK → Product)
├── variant_id (FK → ProductVariant, opcional)
└── quantity (Int)

Order
├── id (UUID)
├── user_id (FK → User)
├── status (PENDING_PAYMENT | PAID | PROCESSING | SHIPPED | DELIVERED | CANCELLED)
├── subtotal_in_cents
├── discount_in_cents (default 0)
├── shipping_in_cents
├── total_in_cents
├── coupon_code (string, snapshot do código usado)
├── tracking_code (para envio)
├── payment_id (ID externo do Mercado Pago)
├── expires_at (30 min após criação para cancelamento automático)
├── created_at
└── updated_at
    ├── → OrderItem[] (1:N)
    └── → OrderAddress (1:1, snapshot do endereço)

OrderItem
├── id (UUID)
├── order_id (FK → Order)
├── product_id (FK → Product)
├── variant_id (FK → ProductVariant, opcional)
├── product_name (snapshot)
├── variant_name (snapshot, opcional)
├── unit_price_in_cents (snapshot do preço no momento da compra)
└── quantity

OrderAddress
├── id (UUID)
├── order_id (FK → Order, único)
├── zip_code
├── street
├── number
├── complement
├── neighborhood
├── city
└── state

Coupon
├── id (UUID)
├── code (único, uppercase)
├── type (PERCENTAGE | FIXED_AMOUNT)
├── value (Int — percentual 0-100 ou valor em centavos)
├── max_uses (Int, null = ilimitado)
├── used_count (Int, default 0)
├── valid_until (DateTime, null = sem expiração)
├── is_active
├── created_at
└── updated_at

Favorite
├── id (UUID)
├── user_id (FK → User)
├── product_id (FK → Product)
├── created_at
└── [unique: user_id + product_id]

RefreshToken
├── id (UUID)
├── user_id (FK → User)
├── token (hash do token)
├── expires_at
└── created_at
```

## Índices importantes

```prisma
// Product
@@index([category_id])
@@index([is_active, is_featured])
@@index([slug])

// Order
@@index([user_id])
@@index([status])
@@index([payment_id])

// CartItem
@@unique([cart_id, product_id, variant_id])

// Favorite
@@unique([user_id, product_id])
```

## Seed

O arquivo `prisma/seed.ts` deve criar:
- 1 usuário admin
- Categorias padrão (Bolsas, Necessaires, Carteiras, Acessórios)
- Alguns produtos de exemplo com imagens placeholder
