import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useResetPassword } from '../hooks/useAuthMutations'
import { AuthLayout } from '../components/AuthLayout'

const schema = z
  .object({
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

export function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { mutate: resetPassword, isPending } = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <AuthLayout heading="Link inválido" subheading="Este link de redefinição não é válido">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <p className="text-sm font-body text-ink-muted">
            O link pode ter expirado ou já ter sido utilizado.
            Solicite um novo link de redefinição.
          </p>
          <a href="/esqueci-minha-senha" className="btn-primary w-full">
            Solicitar novo link
          </a>
        </div>
      </AuthLayout>
    )
  }

  const onSubmit = (data: FormData) =>
    resetPassword({ token, ...data })

  return (
    <AuthLayout
      heading="Criar nova senha"
      subheading="Escolha uma senha segura para sua conta"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="password" className="input-label">
            Nova senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="input-field pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink p-1"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="input-label">
            Confirmar nova senha
          </label>
          <input
            id="password_confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="input-field"
            {...register('password_confirmation')}
          />
          {errors.password_confirmation && (
            <p className="input-error">{errors.password_confirmation.message}</p>
          )}
        </div>

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvando…
            </>
          ) : (
            'Salvar nova senha'
          )}
        </button>
      </form>
    </AuthLayout>
  )
}
