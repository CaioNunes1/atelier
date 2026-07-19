# Regras de Negócio

> Este arquivo não contém código. Ele descreve como o negócio funciona.
> Toda decisão de implementação deve respeitar estas regras.

---

## Produto

- Todo produto pertence a **exatamente uma categoria**
- Um produto pode ter **de 1 a 10 imagens**; a primeira é a imagem principal (capa)
- Produtos têm **estoque controlado por unidade**; estoque mínimo é 0
- Produto com estoque 0 é exibido como **"Esgotado"** mas não é removido do catálogo
- Apenas a proprietária (admin) pode criar, editar ou remover produtos
- Produto pode ser **marcado como destaque** para aparecer na home
- Produto pode ser **desativado** (não aparece no catálogo, mas pedidos existentes não são afetados)
- Produtos artesanais podem ter **variações** (ex: cor, material) — cada variação tem seu próprio estoque
- O preço é sempre em **BRL (reais)**, armazenado em centavos (inteiro) para evitar erros de ponto flutuante
- Produto **não pode ser excluído** se existir em algum pedido — apenas desativado

## Categoria

- Categorias são criadas e gerenciadas pelo admin
- Exemplos esperados: Bolsas, Necessaires, Carteiras, Acessórios
- Uma categoria pode ser **desativada**; seus produtos continuam existindo mas ficam indisponíveis no catálogo
- Não há subcategorias por ora

## Usuário / Cliente

- Qualquer pessoa pode navegar no catálogo **sem criar conta**
- Para **finalizar uma compra**, é obrigatório ter uma conta
- Um usuário pode ter **múltiplos endereços de entrega**
- Um usuário pode **favoritar produtos**
- O usuário tem apenas o papel `CUSTOMER`; a proprietária tem o papel `ADMIN`
- Só pode existir **uma conta por email**
- O usuário pode solicitar **exclusão da conta** (LGPD), o que anonimiza seus dados

## Carrinho

- O carrinho é **persistido no banco**, vinculado ao usuário autenticado
- Usuário não autenticado tem carrinho em `localStorage`; ao logar, o carrinho é **mesclado**
- Ao adicionar um produto ao carrinho, o sistema verifica se há **estoque disponível**
- A quantidade de um item no carrinho não pode ultrapassar o **estoque disponível**
- O carrinho **não reserva estoque** — a reserva acontece apenas ao confirmar o pedido
- Itens do carrinho de um produto desativado são removidos automaticamente

## Pedido

### Estados possíveis

```
PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED
                ↓
             CANCELLED
```

| Estado            | Significado                                              |
|-------------------|----------------------------------------------------------|
| `PENDING_PAYMENT` | Pedido criado, aguardando confirmação de pagamento       |
| `PAID`            | Pagamento confirmado pelo Mercado Pago                   |
| `PROCESSING`      | Produto sendo preparado pela costureira                  |
| `SHIPPED`         | Enviado; contém código de rastreio                       |
| `DELIVERED`       | Entregue (confirmação manual pelo admin)                 |
| `CANCELLED`       | Cancelado antes do envio                                 |

### Regras de pedido

- O estoque é **decrementado** no momento em que o pedido muda para `PAID`
- Se o pagamento não for confirmado em **30 minutos**, o pedido é cancelado automaticamente
- Pedido não pode ser cancelado após status `SHIPPED`
- O cliente recebe **email** em cada mudança de status
- Pedido cancelado devolve o estoque ao produto
- Pedido contém: itens, endereço de entrega snapshot, valor total, frete, desconto (cupom)
- O endereço no pedido é um **snapshot** — alterações futuras no endereço do usuário não afetam pedidos existentes

## Pagamento

- Processado exclusivamente via **Mercado Pago Checkout Pro**
- O sistema recebe confirmação via **webhook** do Mercado Pago
- Nunca armazenamos dados de cartão — isso é responsabilidade do Mercado Pago
- Em caso de falha no webhook, o sistema deve ser capaz de **consultar o status** do pagamento manualmente via API do MP

## Frete

- Calculado via **Melhor Envio** ou definido manualmente pelo admin por faixa de CEP
- O valor do frete é calculado no checkout antes da confirmação
- Frete grátis pode ser configurado pelo admin (ex: acima de R$ 300)

## Cupom de Desconto

- Cupons são criados pelo admin
- Um cupom tem: código, tipo de desconto (percentual ou valor fixo), valor, data de validade e quantidade máxima de usos
- Um usuário pode usar **um cupom por pedido**
- Cupom inválido (expirado, esgotado, não existente) retorna erro claro ao usuário
- O uso do cupom é registrado no momento em que o pedido muda para `PAID`

## Favoritos

- Usuário autenticado pode favoritar e desfavoritar qualquer produto ativo
- Favoritos são exibidos em uma página dedicada no perfil do usuário
- Não há limite de favoritos

## Admin / Painel de Gestão

- A proprietária tem acesso a um painel separado (`/admin`)
- O admin pode: gerenciar produtos, categorias, pedidos, cupons, usuários e ver relatórios
- O admin pode **alterar o status de um pedido manualmente**
- O admin pode **exportar relatório de vendas** em CSV (período, produtos, receita)
- Apenas usuários com papel `ADMIN` acessam o painel

## Notificações por Email

| Gatilho                     | Destinatário    |
|-----------------------------|-----------------|
| Cadastro realizado          | Cliente         |
| Pedido criado               | Cliente + Admin |
| Pagamento confirmado        | Cliente         |
| Status do pedido atualizado | Cliente         |
| Senha redefinida            | Cliente         |
