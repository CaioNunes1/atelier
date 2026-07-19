import { Link, useSearchParams } from 'react-router-dom';

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('external_reference');

  return (
    <section className="mx-auto max-w-lg py-20 text-center space-y-5">
      <div className="text-6xl">🎉</div>
      <h1 className="font-display text-4xl text-stone-900">Pedido confirmado!</h1>
      <p className="text-stone-600 leading-relaxed">
        Seu pagamento foi recebido com sucesso.<br />
        Em breve você receberá um email de confirmação.
      </p>
      {orderId && (
        <p className="text-xs text-stone-400 font-mono">Pedido #{orderId.slice(0, 8).toUpperCase()}</p>
      )}
      <Link
        to="/"
        className="inline-flex rounded-full bg-roseartisan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
      >
        Voltar para a loja
      </Link>
    </section>
  );
}

export function CheckoutFailurePage() {
  return (
    <section className="mx-auto max-w-lg py-20 text-center space-y-5">
      <div className="text-6xl">😕</div>
      <h1 className="font-display text-4xl text-stone-900">Pagamento não aprovado</h1>
      <p className="text-stone-600 leading-relaxed">
        Não conseguimos processar seu pagamento.<br />
        Tente novamente com outro cartão ou método de pagamento.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/checkout"
          className="inline-flex rounded-full bg-roseartisan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
        >
          Tentar novamente
        </Link>
        <Link
          to="/"
          className="inline-flex rounded-full border border-roseartisan-200 px-6 py-3 text-sm font-semibold text-roseartisan-700 transition hover:bg-roseartisan-50"
        >
          Voltar para a loja
        </Link>
      </div>
    </section>
  );
}

export function CheckoutPendingPage() {
  return (
    <section className="mx-auto max-w-lg py-20 text-center space-y-5">
      <div className="text-6xl">⏳</div>
      <h1 className="font-display text-4xl text-stone-900">Pagamento em análise</h1>
      <p className="text-stone-600 leading-relaxed">
        Seu pagamento está sendo processado.<br />
        Assim que confirmado, você receberá um email. Isso pode levar alguns minutos.
      </p>
      <Link
        to="/"
        className="inline-flex rounded-full border border-roseartisan-200 px-6 py-3 text-sm font-semibold text-roseartisan-700 transition hover:bg-roseartisan-50"
      >
        Voltar para a loja
      </Link>
    </section>
  );
}