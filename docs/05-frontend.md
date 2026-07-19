# Frontend — Padrões React

## Stack

| Biblioteca          | Uso                                                  |
|---------------------|------------------------------------------------------|
| React 19 + Vite     | Base                                                 |
| TypeScript strict   | Tipagem                                              |
| TanStack Query v5   | Server state, cache, refetch automático              |
| React Hook Form     | Formulários com performance                          |
| Zod                 | Validação de schema (formulários + resposta de API)  |
| React Router v7     | Roteamento com lazy loading                          |
| Shadcn/ui           | Componentes base (acessíveis, customizáveis)         |
| Tailwind CSS        | Estilização utilitária                               |
| Axios               | Cliente HTTP com interceptors                        |
| Sonner              | Notificações toast                                   |

## Estrutura de pastas (`apps/web/src/`)

```
src/
├── features/               → Código organizado por funcionalidade de negócio
│   ├── catalog/            → Listagem e detalhe de produtos
│   │   ├── components/     → ProductCard, ProductGrid, ProductFilters
│   │   ├── hooks/          → useProducts, useProduct, useCategories
│   │   └── pages/          → CatalogPage, ProductDetailPage
│   ├── cart/
│   │   ├── components/     → CartDrawer, CartItem, CartSummary
│   │   ├── hooks/          → useCart
│   │   └── store/          → cartStore.ts (Zustand para estado local)
│   ├── checkout/
│   │   ├── components/     → AddressStep, ReviewStep, PaymentStep
│   │   ├── hooks/          → useCheckout, useCoupon, useShipping
│   │   └── pages/          → CheckoutPage
│   ├── auth/
│   │   ├── components/     → LoginForm, RegisterForm
│   │   ├── hooks/          → useLogin, useRegister
│   │   └── pages/          → LoginPage, RegisterPage
│   └── profile/
│       ├── components/
│       ├── hooks/
│       └── pages/          → ProfilePage, OrdersPage, FavoritesPage
│
├── components/             → Componentes genéricos reutilizáveis
│   ├── ui/                 → Re-exports do Shadcn (Button, Input, Card...)
│   ├── layout/             → Header, Footer, MobileNav
│   └── common/             → LoadingSpinner, ErrorBoundary, EmptyState
│
├── hooks/                  → Hooks globais
│   ├── useAuth.ts          → Estado de autenticação
│   └── useDebounce.ts
│
├── lib/                    → Configurações e utilitários
│   ├── axios.ts            → Instância Axios com interceptors de token
│   ├── queryClient.ts      → Configuração do TanStack Query
│   └── utils.ts            → cn(), formatPrice(), formatDate()
│
├── routes/                 → Definição de rotas com lazy loading
│   ├── index.tsx
│   ├── PublicRoutes.tsx
│   └── PrivateRoutes.tsx
│
└── types/                  → Tipos locais do frontend (re-exports de @atelier/types)
```

## Regras que a IA deve sempre seguir

### Componentes
- **Sempre** tipar props com interface TypeScript — nunca `any`
- Componentes de página ficam em `features/<nome>/pages/`
- Componentes reutilizáveis ficam em `features/<nome>/components/` ou `components/`
- Nunca fazer fetch direto no componente — use hooks de TanStack Query
- Usar `Suspense` + `ErrorBoundary` em páginas com dados assíncronos

```tsx
// ✅ Correto
interface ProductCardProps {
  product: ProductEntity;
  onFavorite?: (id: string) => void;
}

export function ProductCard({ product, onFavorite }: ProductCardProps) { ... }

// ❌ Errado
export function ProductCard({ product, onFavorite }: any) { ... }
```

### Data fetching com TanStack Query
- Toda query em hook dedicado dentro de `features/<nome>/hooks/`
- Nomear queries com `queryKey` consistente: `['products', filters]`, `['product', id]`
- Mutations sempre com `onSuccess` para invalidar queries relacionadas
- Nunca usar `useEffect` para fetch de dados — use TanStack Query

```tsx
// ✅ Correto
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.findAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
```

### Formulários com React Hook Form + Zod
- Todo formulário usa `useForm` + `zodResolver`
- O schema Zod fica junto ao componente do formulário
- Erros de validação exibidos inline, nunca só como toast

```tsx
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

### Axios e autenticação
- A instância Axios em `lib/axios.ts` tem interceptors que:
  1. Injeta o `access_token` no header `Authorization: Bearer ...`
  2. Em erro 401, tenta refresh do token automaticamente
  3. Se refresh falhar, faz logout e redireciona para `/login`
- Nunca criar uma instância Axios separada — use sempre a instância de `lib/axios.ts`

### Roteamento
- Usar lazy loading em todas as páginas: `const CatalogPage = lazy(() => import(...))`
- Rotas privadas (requerem login) ficam em `PrivateRoutes.tsx`
- Redirecionar para a rota original após login (`location.state.from`)

### Formatação de preços
- **Sempre** usar `formatPrice()` de `lib/utils.ts` — nunca formatar preço manualmente
- `formatPrice(8990)` → `"R$ 89,90"`

### Estado global
- `useAuth` gerencia sessão do usuário (via Context ou Zustand)
- Carrinho gerenciado com Zustand em `features/cart/store/`
- **Não usar Redux** — overkill para este projeto

## Padrão de importação

Configurar path aliases no `vite.config.ts`:
```ts
'@/*' → './src/*'
'@features/*' → './src/features/*'
'@components/*' → './src/components/*'
'@lib/*' → './src/lib/*'
```

Exemplo: `import { Button } from '@components/ui/button'`
