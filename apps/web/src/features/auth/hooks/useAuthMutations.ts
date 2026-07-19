import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '../authApi'
import { useAuth } from '../AuthContext'
import { extractErrorMessage } from '@/lib/utils'
import type { LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload } from '@/types/auth'

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ data }) => {
      login(data.access_token, data.user)
      toast.success(`Bem-vinda de volta, ${data.user.name.split(' ')[0]}!`)
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/')
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error))
    },
  })
}

export function useRegister() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: ({ data }) => {
      // Após registro, faz login automático se a API retornar token
      // Se não, redireciona para login
      if ('access_token' in data) {
        const d = data as unknown as { access_token: string; user: import('@/types/auth').User }
        login(d.access_token, d.user)
        navigate('/')
      } else {
        toast.success('Conta criada! Faça login para continuar.')
        navigate('/login')
      }
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error))
    },
  })
}

export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success('Até logo!')
      navigate('/')
    },
    onError: () => {
      // Limpa o estado local mesmo se o servidor falhar
      navigate('/')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
    onSuccess: () => {
      toast.success('Se o email estiver cadastrado, você receberá as instruções em breve.')
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error))
    },
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!')
      navigate('/login')
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error))
    },
  })
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}
