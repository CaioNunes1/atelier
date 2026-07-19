import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/features/cart/hooks/useCart';
import { useIsAuthenticated } from '../../auth/hooks/useAuthMutations';
import { formatPrice } from '@/lib/utils';
import { useAddresses, useCreateAddress } from '../hooks/useAddresses';
import { useCheckoutPayment, useCreateOrder, useShippingQuote, useValidateCoupon } from '../hooks/useCheckout';
import type { Address } from '../types';


type AddressFormState = {
  label: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const emptyAddressForm: AddressFormState = {
  label: '',
  zip_code: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export function CheckoutPage() {
  const authenticated = useIsAuthenticated();
  const { cart, removeItem, updateQuantity } = useCart();
  const subtotal = cart.subtotal_in_cents;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressForm, setAddressForm] = useState<AddressFormState>(emptyAddressForm);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_in_cents: number } | null>(null);
  const [shipping, setShipping] = useState<number>(0);
  const [cepError, setCepError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: addresses = [], isLoading: addressesLoading } = useAddresses(authenticated);
  const createAddress = useCreateAddress();
  const validateCoupon = useValidateCoupon();
  const shippingQuote = useShippingQuote();
  const createOrder = useCreateOrder();
  const checkoutPayment = useCheckoutPayment();

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? addresses.find((address) => address.is_default) ?? addresses[0],
    [addresses, selectedAddressId],
  );

  const effectiveShipping = shipping;
  const discount = appliedCoupon?.discount_in_cents ?? 0;
  const total = Math.max(0, subtotal - discount + effectiveShipping);

  if (!authenticated) {
    return (
      <section className="card-surface mx-auto max-w-2xl space-y-4 px-6 py-16 text-center">
        <p className="artisan-pill mx-auto">Checkout</p>
        <h1 className="text-4xl">Você precisa entrar para continuar</h1>
        <p className="text-stone-600">O carrinho pode existir em localStorage, mas a compra exige uma conta.</p>
        <Link
          to="/login"
          className="inline-flex rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
        >
          Ir para login
        </Link>
      </section>
    );
  }

  const fillFromCep = async () => {
    const digits = addressForm.zip_code.replace(/\D/g, '');

    if (digits.length !== 8) {
      setCepError('Informe um CEP válido.');
      return;
    }

    setCepError(null);

    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

    const data: unknown = await response.json();

    const cep = data as ViaCepResponse;

    if (cep.erro) {
      setCepError('CEP não encontrado.');
      return;
    }

    setAddressForm((current) => ({
      ...current,
      zip_code: digits,
      street: cep.logradouro || current.street,
      neighborhood: cep.bairro || current.neighborhood,
      city: cep.localidade || current.city,
      state: cep.uf || current.state,
    }));
  };

  const saveAddress = async () => {
    setFormError(null);
    const created = await createAddress.mutateAsync({
      label: addressForm.label || undefined,
      zip_code: addressForm.zip_code,
      street: addressForm.street,
      number: addressForm.number,
      complement: addressForm.complement || undefined,
      neighborhood: addressForm.neighborhood,
      city: addressForm.city,
      state: addressForm.state,
      is_default: addresses.length === 0,
    });
    setSelectedAddressId(created.id);
    setShowAddressForm(false);
    setAddressForm(emptyAddressForm);
  };

  const applyCoupon = async () => {
    setFormError(null);
    const result = await validateCoupon.mutateAsync({
      code: couponCode,
      subtotal_in_cents: subtotal,
    });
    setAppliedCoupon({
      code: couponCode.toUpperCase(),
      discount_in_cents: result.discount_in_cents,
    });
  };

  const calculateShipping = async () => {
    if (!selectedAddress) {
      setFormError('Selecione um endereço primeiro.');
      return;
    }

    const result = await shippingQuote.mutateAsync({
      zip_code: selectedAddress.zip_code,
      subtotal_in_cents: subtotal,
    });
    setShipping(result.shipping_in_cents);
  };

  const finalizeOrder = async () => {
    try {
      if (!selectedAddress) {
        setFormError('Selecione um endereço.')
        return
      }

      const order = await createOrder.mutateAsync({
        address_id: selectedAddress.id,
        coupon_code: appliedCoupon?.code,
      })
      const payment = await checkoutPayment.mutateAsync({ order_id: order.id })
      window.location.href = payment.url
    } catch (error: unknown) {
      // Mostra o erro real do backend
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: unknown } }
        console.error('Erro do backend:', axiosError.response.data)
        setFormError(JSON.stringify(axiosError.response.data))
      }
    }
}

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-roseartisan-700">Checkout</p>
          <h1 className="mt-1 text-4xl">Finalize sua compra</h1>
        </div>
        <Link to="/catalog" className="text-sm font-medium text-roseartisan-700 hover:text-roseartisan-800">
          Voltar ao catálogo
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setStep(1)} className={step === 1 ? 'rounded-2xl bg-roseartisan-700 px-4 py-3 text-white' : 'rounded-2xl border border-roseartisan-200 px-4 py-3'}>
              1. Endereço
            </button>
            <button type="button" onClick={() => setStep(2)} className={step === 2 ? 'rounded-2xl bg-roseartisan-700 px-4 py-3 text-white' : 'rounded-2xl border border-roseartisan-200 px-4 py-3'}>
              2. Revisão
            </button>
            <button type="button" onClick={() => setStep(3)} className={step === 3 ? 'rounded-2xl bg-roseartisan-700 px-4 py-3 text-white' : 'rounded-2xl border border-roseartisan-200 px-4 py-3'}>
              3. Pagamento
            </button>
          </div>

          {formError ? <div className="rounded-2xl border border-roseartisan-200 bg-roseartisan-50 p-4 text-sm text-roseartisan-900">{formError}</div> : null}

          {step === 1 ? (
            <div className="card-surface space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <h2 className="text-2xl">Endereços salvos</h2>
                  <p className="text-sm text-stone-600">
                    Selecione um endereço ou adicione um novo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddressForm((value) => !value)}
                  className="rounded-full border border-roseartisan-200 px-4 py-2 text-sm font-medium text-roseartisan-700"
                >
                  {showAddressForm ? 'Fechar formulário' : 'Adicionar endereço'}
                </button>
              </div>

              {addressesLoading ? <div className="h-24 animate-pulse rounded-2xl bg-roseartisan-100" /> : null}

              <div className="grid gap-3">
                {addresses.map((address: Address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setSelectedAddressId(address.id)}
                    className={
                      selectedAddressId === address.id
                        ? 'rounded-2xl border border-roseartisan-500 bg-roseartisan-50 p-4 text-left'
                        : 'rounded-2xl border border-roseartisan-200 bg-white p-4 text-left'
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <strong>{address.label ?? 'Endereço'}</strong>
                      {address.is_default ? <span className="text-xs uppercase tracking-[0.2em] text-roseartisan-700">Padrão</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {address.street}, {address.number} - {address.neighborhood}
                    </p>
                    <p className="text-sm text-stone-500">
                      {address.city} / {address.state} • {address.zip_code}
                    </p>
                  </button>
                ))}
              </div>

              {showAddressForm ? (
                <div className="space-y-4 rounded-3xl border border-roseartisan-200 bg-roseartisan-50 p-5">
                  <h3 className="text-xl">Novo endereço</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="Apelido" className="rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                    <div className="flex gap-2">
                      <input value={addressForm.zip_code} onChange={(event) => setAddressForm({ ...addressForm, zip_code: event.target.value })} placeholder="CEP" className="flex-1 rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                      <button type="button" onClick={fillFromCep} className="rounded-2xl border border-roseartisan-200 px-4 py-3 text-sm font-medium text-roseartisan-700">
                        Buscar
                      </button>
                    </div>
                    <input value={addressForm.street} onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })} placeholder="Rua" className="rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                    <input value={addressForm.number} onChange={(event) => setAddressForm({ ...addressForm, number: event.target.value })} placeholder="Número" className="rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                    <input value={addressForm.complement} onChange={(event) => setAddressForm({ ...addressForm, complement: event.target.value })} placeholder="Complemento" className="rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                    <input value={addressForm.neighborhood} onChange={(event) => setAddressForm({ ...addressForm, neighborhood: event.target.value })} placeholder="Bairro" className="rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                    <input value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} placeholder="Cidade" className="rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                    <input value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} placeholder="UF" className="rounded-2xl border border-roseartisan-200 bg-white px-4 py-3" />
                  </div>
                  {cepError ? <p className="text-sm text-rose-700">{cepError}</p> : null}
                  <button type="button" onClick={saveAddress} className="rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white">
                    Salvar endereço
                  </button>
                </div>
              ) : null}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedAddressId}
                  className="rounded-full bg-roseartisan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar para revisão →
                </button>
              </div>
            </div>  
          ) : null}

          {step === 2 ? (
            <div className="card-surface space-y-4 p-6">
              <h2 className="text-2xl">Revisão do pedido</h2>

              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-roseartisan-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Imagem + info */}
                      <div className="flex items-start gap-3 min-w-0">
                        {item.product.image ? (
                          <img
                            src={item.product.image.url}
                            alt={item.product.name}
                            className="w-14 h-14 rounded-xl object-cover border border-roseartisan-100 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-roseartisan-100 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 leading-tight">{item.product.name}</p>
                          {item.variant?.name ? (
                            <p className="text-xs text-stone-500 mt-0.5">{item.variant.name}</p>
                          ) : null}
                          <p className="text-sm font-semibold text-roseartisan-700 mt-1">
                            {formatPrice(item.line_total_in_cents)}
                          </p>
                        </div>
                      </div>

                      {/* Controles de quantidade */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Remover item ou diminuir quantidade */}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item)
                            } else {
                              updateQuantity(item, item.quantity - 1)
                            }
                          }}
                          className="w-8 h-8 rounded-full border border-roseartisan-200 flex items-center justify-center text-stone-600 hover:border-roseartisan-400 hover:text-roseartisan-700 transition"
                          aria-label="Diminuir quantidade"
                        >
                          {item.quantity <= 1 ? (
                            // Ícone de lixeira quando vai remover
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          ) : (
                            <span className="text-base leading-none">−</span>
                          )}
                        </button>

                        <span className="w-7 text-center text-sm font-medium text-stone-900">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 rounded-full border border-roseartisan-200 flex items-center justify-center text-stone-600 hover:border-roseartisan-400 hover:text-roseartisan-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Aumentar quantidade"
                        >
                          <span className="text-base leading-none">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupom */}
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Cupom de desconto"
                  className="rounded-2xl border border-roseartisan-200 px-4 py-3"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-2xl border border-roseartisan-200 px-4 py-3 text-sm font-medium text-roseartisan-700"
                >
                  Aplicar
                </button>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 text-sm">✓</span>
                    <span className="text-sm font-medium text-emerald-800">
                      Cupom <strong>{appliedCoupon.code}</strong> aplicado
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-700">
                      − {formatPrice(appliedCoupon.discount_in_cents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponCode('') }}
                      className="text-xs text-emerald-600 hover:text-emerald-800 underline"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={calculateShipping}
                className="rounded-full border border-roseartisan-200 px-5 py-3 text-sm font-semibold text-roseartisan-700"
              >
                Calcular frete
              </button>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full border border-roseartisan-200 px-6 py-3 text-sm font-medium text-roseartisan-700"
                >
                  ← Voltar
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-full bg-roseartisan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
                >
                  Continuar para pagamento →
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="card-surface space-y-4 p-6">
              <h2 className="text-2xl">Pagamento</h2>
              <p className="text-stone-600">Ao finalizar, você será redirecionada para o Mercado Pago.</p>
              <button type="button" onClick={finalizeOrder} className="rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white">
                Finalizar e ir para pagamento
              </button>
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-full border border-roseartisan-200 px-6 py-3 text-sm font-medium text-roseartisan-700"
                >
                  ← Voltar
                </button>

                <button
                  type="button"
                  onClick={finalizeOrder}
                  className="rounded-full bg-roseartisan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
                >
                  Finalizar compra
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="card-surface space-y-4 p-6">
            <h2 className="text-2xl">Resumo</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div className="flex justify-between"><span>Desconto</span><strong>- {formatPrice(discount)}</strong></div>
              <div className="flex justify-between"><span>Frete</span><strong>{formatPrice(effectiveShipping)}</strong></div>
              <div className="border-t border-roseartisan-200 pt-2 flex justify-between text-base"><span>Total</span><strong>{formatPrice(total)}</strong></div>
            </div>
            <div className="text-sm text-stone-500">
              {selectedAddress ? `Entrega para ${selectedAddress.city}/${selectedAddress.state}` : 'Selecione um endereço.'}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
