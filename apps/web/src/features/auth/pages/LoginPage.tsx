import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '../hooks/useAuthMutations'
import { AuthLayout } from '../components/AuthLayout'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Informe sua senha'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => login(data)

  return (
    <AuthLayout
      heading="Bem-vinda de volta"
      subheading="Entre na sua conta para continuar explorando"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-stone-500">
            <Mail size={11} strokeWidth={2} />
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={`
              w-full bg-white border rounded-2xl
              px-4 py-3.5 font-body text-sm text-stone-800
              placeholder:text-stone-300
              transition-all duration-150 outline-none
              ${errors.email
                ? 'border-rose-300 ring-2 ring-rose-100'
                : 'border-roseartisan-200 focus:border-roseartisan-400 focus:ring-2 focus:ring-roseartisan-100'
              }
            `}
            {...register('email')}
          />
          {errors.email && (
            <p className="font-body text-xs text-rose-600 flex items-center gap-1">
              <span>·</span> {errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-stone-500">
              <Lock size={11} strokeWidth={2} />
              Senha
            </label>
            <Link
              to="/esqueci-minha-senha"
              className="font-body text-xs text-roseartisan-600 hover:text-roseartisan-800 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`
                w-full bg-white border rounded-2xl
                px-4 py-3.5 pr-12 font-body text-sm text-stone-800
                placeholder:text-stone-300
                transition-all duration-150 outline-none
                ${errors.password
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-roseartisan-200 focus:border-roseartisan-400 focus:ring-2 focus:ring-roseartisan-100'
                }
              `}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="font-body text-xs text-rose-600 flex items-center gap-1">
              <span>·</span> {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="
            w-full rounded-full bg-stone-900 text-white
            font-body font-semibold text-sm
            py-4 mt-2
            flex items-center justify-center gap-2
            transition-all duration-200
            hover:bg-roseartisan-800
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Entrando…
            </>
          ) : (
            'Entrar na conta'
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-roseartisan-100" />
        <span className="font-body text-xs text-stone-400 uppercase tracking-widest">ou</span>
        <div className="flex-1 h-px bg-roseartisan-100" />
      </div>

      {/* Link para cadastro */}
      <p className="text-center font-body text-sm text-stone-500">
        Ainda não tem conta?{' '}
        <Link
          to="/cadastro"
          className="text-stone-900 font-semibold hover:text-roseartisan-700 transition-colors underline underline-offset-4 decoration-roseartisan-300"
        >
          Criar conta grátis
        </Link>
      </p>
    </AuthLayout>
  )
}
