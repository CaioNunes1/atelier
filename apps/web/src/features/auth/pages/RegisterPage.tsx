import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, User, Mail, Lock, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegister } from '../hooks/useAuthMutations'
import { AuthLayout } from '../components/AuthLayout'

const schema = z
  .object({
    name:                  z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(80),
    email:                 z.string().email('Email inválido'),
    password:              z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Precisa de uma letra maiúscula')
      .regex(/[0-9]/, 'Precisa de um número'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'As senhas não coincidem',
    path: ['password_confirmation'],
  })

type FormData = z.infer<typeof schema>

const passwordCriteria = [
  { label: 'Ao menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',             test: (p: string) => /[0-9]/.test(p) },
]

// Componente de campo reutilizável
function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-stone-500"
      >
        {icon}
        {label}
      </label>
      {children}
      {error && (
        <p className="font-body text-xs text-rose-600 flex items-center gap-1">
          <span>·</span> {error}
        </p>
      )}
    </div>
  )
}

const inputClass = (hasError: boolean) => `
  w-full bg-white border rounded-2xl
  px-4 py-3.5 font-body text-sm text-stone-800
  placeholder:text-stone-300
  transition-all duration-150 outline-none
  ${hasError
    ? 'border-rose-300 ring-2 ring-rose-100'
    : 'border-roseartisan-200 focus:border-roseartisan-400 focus:ring-2 focus:ring-roseartisan-100'
  }
`

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
      subheading="Junte-se a quem aprecia o artesanato feito com cuidado"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* Nome */}
        <Field
          id="name"
          label="Nome completo"
          icon={<User size={11} strokeWidth={2} />}
          error={errors.name?.message}
        >
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            className={inputClass(!!errors.name)}
            {...formRegister('name')}
          />
        </Field>

        {/* Email */}
        <Field
          id="email"
          label="Email"
          icon={<Mail size={11} strokeWidth={2} />}
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={inputClass(!!errors.email)}
            {...formRegister('email')}
          />
        </Field>

        {/* Senha */}
        <Field
          id="password"
          label="Senha"
          icon={<Lock size={11} strokeWidth={2} />}
          error={errors.password?.message}
        >
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClass(!!errors.password) + ' pr-12'}
              {...formRegister('password')}
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

          {/* Critérios de senha */}
          {passwordValue.length > 0 && (
            <ul className="mt-2.5 space-y-1.5 pl-1">
              {passwordCriteria.map((c) => {
                const ok = c.test(passwordValue)
                return (
                  <li
                    key={c.label}
                    className={`flex items-center gap-2 font-body text-xs transition-colors duration-200 ${
                      ok ? 'text-emerald-600' : 'text-stone-400'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      ok ? 'bg-emerald-100' : 'bg-stone-100'
                    }`}>
                      <Check size={9} strokeWidth={3} className={ok ? 'opacity-100' : 'opacity-0'} />
                    </span>
                    {c.label}
                  </li>
                )
              })}
            </ul>
          )}
        </Field>

        {/* Confirmar senha */}
        <Field
          id="password_confirmation"
          label="Confirmar senha"
          icon={<Lock size={11} strokeWidth={2} />}
          error={errors.password_confirmation?.message}
        >
          <input
            id="password_confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass(!!errors.password_confirmation)}
            {...formRegister('password_confirmation')}
          />
        </Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="
            w-full rounded-full bg-stone-900 text-white
            font-body font-semibold text-sm
            py-4 mt-3
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
              Criando conta…
            </>
          ) : (
            'Criar conta'
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px bg-roseartisan-100" />
        <span className="font-body text-xs text-stone-400 uppercase tracking-widest">ou</span>
        <div className="flex-1 h-px bg-roseartisan-100" />
      </div>

      {/* Link para login */}
      <p className="text-center font-body text-sm text-stone-500">
        Já tem conta?{' '}
        <Link
          to="/login"
          className="text-stone-900 font-semibold hover:text-roseartisan-700 transition-colors underline underline-offset-4 decoration-roseartisan-300"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
