import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '../hooks/useAuthMutations'
import { AuthLayout } from '../components/AuthLayout'

const schema = z.object({
  email: z.string().email('Email inválido'),
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
      subheading="Entre para continuar explorando peças únicas feitas à mão"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="input-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="input-field"
            {...register('email')}
          />
          {errors.email && (
            <p className="input-error">{errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="input-label mb-0">
              Senha
            </label>
            <Link
              to="/esqueci-minha-senha"
              className="text-xs text-ink-faint hover:text-brand transition-colors font-body"
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
              className="input-field pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors p-1"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="input-error">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full mt-2"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="divider-text my-6 text-xs">ou</div>

      {/* Link para cadastro */}
      <p className="text-center text-sm font-body text-ink-muted">
        Ainda não tem conta?{' '}
        <Link
          to="/cadastro"
          className="text-ink font-medium hover:text-brand transition-colors underline underline-offset-2"
        >
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
