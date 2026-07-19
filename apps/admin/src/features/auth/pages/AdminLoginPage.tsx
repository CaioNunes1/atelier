import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Scissors } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { useAuth } from '../AuthContext'
import { extractErrorMessage } from '@/lib/utils'
import type { AdminUser } from '@/types'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Informe sua senha'),
})
type FormData = z.infer<typeof schema>

export function AdminLoginPage() {
  const [show, setShow] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: (d: FormData) =>
      api.post<{ data: { access_token: string; user: AdminUser } }>('/api/auth/login', d)
         .then(r => r.data),
    onSuccess: ({ data }) => {
      if (data.user.role !== 'ADMIN') {
        toast.error('Acesso restrito ao painel administrativo.')
        return
      }
      login(data.access_token, data.user)
      navigate('/admin')
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="min-h-dvh bg-admin-sidebar flex items-center justify-center p-4">
      {/* Textura diagonal de fundo */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,#C4956A 0px,#C4956A 1px,transparent 1px,transparent 14px)' }}
        aria-hidden
      />

      <div className="relative w-full max-w-sm animate-slide-in">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <span className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center">
            <Scissors size={18} className="text-brand" />
          </span>
          <div>
            <p className="font-display text-2xl text-white tracking-wide leading-none">Atelier</p>
            <p className="font-body text-[10px] text-brand/70 uppercase tracking-[0.2em] mt-0.5">Painel Admin</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-admin-md">
          <h1 className="font-display text-2xl text-admin-ink mb-1">Entrar</h1>
          <p className="font-body text-sm text-admin-muted mb-7">Acesso restrito à proprietária</p>

          <form onSubmit={handleSubmit((d) => mutate(d))} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="input-label">Email</label>
              <input id="email" type="email" autoComplete="email"
                placeholder="seu@email.com" className="input-field" {...register('email')} />
              {errors.email && <p className="input-error">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="input-label">Senha</label>
              <div className="relative">
                <input id="password" type={show ? 'text' : 'password'}
                  autoComplete="current-password" placeholder="••••••••"
                  className="input-field pr-11" {...register('password')} />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-ink p-1"
                  aria-label={show ? 'Ocultar' : 'Mostrar'}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isPending} className="btn-primary w-full mt-1">
              {isPending ? <><Loader2 size={15} className="animate-spin" />Entrando…</> : 'Entrar no painel'}
            </button>
          </form>
        </div>

        <p className="text-center font-body text-xs text-white/20 mt-6">
          © {new Date().getFullYear()} Atelier — Recife, PE
        </p>
      </div>
    </div>
  )
}
