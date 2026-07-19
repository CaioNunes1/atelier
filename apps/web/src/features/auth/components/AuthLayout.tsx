import { Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'

interface AuthLayoutProps {
  heading: string
  subheading: string
  children: React.ReactNode
}

/**
 * Shell visual de todas as páginas de auth.
 *
 * Layout: dois painéis em desktop.
 * Esquerda → painel editorial com identidade da marca (oculto em mobile).
 * Direita  → formulário centralizado em card.
 */
export function AuthLayout({ heading, subheading, children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh flex">
      {/* Painel esquerdo — identidade visual (apenas desktop) */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-ink p-12 relative overflow-hidden">
        {/* Textura sutil de fundo */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #C4956A 0px,
              #C4956A 1px,
              transparent 1px,
              transparent 12px
            )`,
          }}
          aria-hidden
        />

        {/* Logo */}
        <Link
          to="/"
          className="relative flex items-center gap-3 text-surface group"
        >
          <span className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center group-hover:bg-brand/30 transition-colors">
            <Scissors size={16} className="text-brand" />
          </span>
          <span className="font-display text-xl tracking-wide">Atelier</span>
        </Link>

        {/* Quote editorial */}
        <div className="relative space-y-6">
          <blockquote className="font-display text-display-md text-surface leading-snug">
            "Cada peça carrega o tempo, o cuidado e a história de quem a fez."
          </blockquote>
          <p className="font-body text-sm text-surface/50 tracking-wide">
            Bolsas, necessaires e acessórios artesanais — feitos à mão, pensados para durar.
          </p>

          {/* Detalhe decorativo — linha + ponto */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px w-10 bg-brand/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand/60" />
          </div>
        </div>

        {/* Rodapé do painel */}
        <p className="relative font-body text-xs text-surface/30">
          © {new Date().getFullYear()} Atelier. Feito com amor em Recife, PE.
        </p>
      </aside>

      {/* Painel direito — formulário */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-surface">
        {/* Logo mobile */}
        <Link
          to="/"
          className="flex lg:hidden items-center gap-2 text-ink mb-10"
        >
          <span className="w-8 h-8 rounded-full bg-linen-100 flex items-center justify-center">
            <Scissors size={14} className="text-brand" />
          </span>
          <span className="font-display text-xl tracking-wide">Atelier</span>
        </Link>

        <div className="w-full max-w-[400px] animate-slide-up">
          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="font-display text-display-md text-ink leading-tight">
              {heading}
            </h1>
            <p className="mt-2 font-body text-sm text-ink-muted leading-relaxed">
              {subheading}
            </p>
          </div>

          {/* Conteúdo (formulário) */}
          {children}
        </div>
      </main>
    </div>
  )
}
