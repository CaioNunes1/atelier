import { Link } from 'react-router-dom';

export function CheckoutPage() {
  return (
    <section className="card-surface mx-auto max-w-2xl space-y-4 px-6 py-16 text-center">
      <p className="artisan-pill mx-auto">Checkout</p>
      <h1 className="text-4xl">Finalização em breve</h1>
      <p className="text-stone-600">Esta etapa entra em outra fase do roadmap.</p>
      <Link
        to="/catalog"
        className="inline-flex rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
      >
        Ver catálogo
      </Link>
    </section>
  );
}
