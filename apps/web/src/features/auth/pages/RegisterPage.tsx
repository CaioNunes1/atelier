import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegister } from '../hooks/useAuthMutations'
import { AuthLayout } from '../components/AuthLayout'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    name: z
      .string()
      .min(2, 'Nome deve ter ao menos 2 caracteres')
      .max(80, 'Nome muito longo'),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter ao menos um número'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'As senhas não coincidem',
    path: ['password_confirmation'],
  })

type FormData = z.infer<typeof schema>

// Critérios de força de senha
const passwordCriteria = [
  { label: 'Ao menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número', test: (p: string) => /[0-9]/.test(p) },
]

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: register, isPending } = useRegister()

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const passwordValue = watch('password', '')
  const onSubmit = (data: FormData) =>
    register({ name: data.name, email: data.email, password: data.password })

  return (
    <AuthLayout
      heading="Criar sua conta"
      subheading="Junte-se a quem aprecia o artesanato feito com amor"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="input-label">
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            className="input-field"
            {...formRegister('name')}
          />
          {errors.name && <p className="input-error">{errors.name.message}</p>}
        </div>

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
            {...formRegister('email')}
          />
          {errors.email && <p className="input-error">{errors.email.message}</p>}
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="password" className="input-label">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="input-field pr-12"
              {...formRegister('password')}
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

          {/* Critérios de senha */}
          {passwordValue.length > 0 && (
            <ul className="mt-2 space-y-1">
              {passwordCriteria.map((c) => {
                const ok = c.test(passwordValue)
                return (
                  <li
                    key={c.label}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-body transition-colors',
                      ok ? 'text-emerald-600' : 'text-ink-faint',
                    )}
                  >
                    <Check
                      size={11}
                      className={cn(
                        'shrink-0 rounded-full p-0.5 transition-colors',
                        ok ? 'bg-emerald-100 text-emerald-600' : 'bg-linen-200 text-transparent',
                      )}
                    />
                    {c.label}
                  </li>
                )
              })}
            </ul>
          )}
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        {/* Confirmar senha */}
        <div>
          <label htmlFor="password_confirmation" className="input-label">
            Confirmar senha
          </label>
          <input
            id="password_confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="input-field"
            {...formRegister('password_confirmation')}
          />
          {errors.password_confirmation && (
            <p className="input-error">{errors.password_confirmation.message}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={isPending} className="btn-primary w-full mt-2">
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Criando conta…
            </>
          ) : (
            'Criar conta'
          )}
        </button>
      </form>

      <div className="divider-text my-6 text-xs">ou</div>

      <p className="text-center text-sm font-body text-ink-muted">
        Já tem conta?{' '}
        <Link
          to="/login"
          className="text-ink font-medium hover:text-brand transition-colors underline underline-offset-2"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
