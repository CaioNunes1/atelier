import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForgotPassword } from '../hooks/useAuthMutations'
import { AuthLayout } from '../components/AuthLayout'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (isSuccess) {
    return (
      <AuthLayout
        heading="Verifique seu email"
        subheading="Se o endereço estiver cadastrado, você receberá as instruções em breve"
      >
        <div className="text-center space-y-6">
          <div className="w-14 h-14 bg-linen-100 rounded-full flex items-center justify-center mx-auto">
            <Mail size={24} className="text-brand" />
          </div>
          <p className="text-sm font-body text-ink-muted leading-relaxed">
            Verifique sua caixa de entrada e a pasta de spam.
            O link de redefinição expira em 1 hora.
          </p>
          <Link to="/login" className="btn-secondary w-full">
            Voltar para o login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      heading="Esqueceu sua senha?"
      subheading="Informe seu email e enviaremos um link para redefinição"
    >
      <form onSubmit={handleSubmit((d) => forgotPassword(d))} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className="input-label">
            Email cadastrado
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="input-field"
            {...register('email')}
          />
          {errors.email && <p className="input-error">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando…
            </>
          ) : (
            'Enviar instruções'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors font-body"
        >
          <ArrowLeft size={14} />
          Voltar para o login
        </Link>
      </div>
    </AuthLayout>
  )
}
