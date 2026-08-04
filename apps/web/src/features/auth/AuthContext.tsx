import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { authApi } from './authApi'
import { tokenStore } from '@/lib/axios'
import type { User } from '@/types/auth'
import { toast } from 'sonner'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (accessToken: string, user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const HAD_SESSION_KEY = 'hadSession'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)

  // Ao montar, tenta renovar a sessão via cookie (refresh token)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const hadSession = typeof window !== 'undefined' && localStorage.getItem(HAD_SESSION_KEY) === '1'

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const attemptRefresh = async (attemptsLeft: number, delayMs = 500) => {
      try {
        const { data } = await authApi.refresh()
        tokenStore.set(data.access_token)
        setUser(data.user)
      } catch (err) {
        if (attemptsLeft > 0) {
          await sleep(delayMs)
          return attemptRefresh(attemptsLeft - 1, delayMs * 2)
        }
        // Se esgotaram as tentativas, limpa estado local
        tokenStore.clear()
        setUser(null)
        if (hadSession) localStorage.removeItem(HAD_SESSION_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    // Se o usuário já tinha sessão, tenta várias vezes antes de decidir deslogar
    attemptRefresh(hadSession ? 3 : 0)
  }, [])

  // Escuta evento de logout forçado pelo interceptor do Axios
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null)
      tokenStore.clear()
      if (typeof window !== 'undefined') localStorage.removeItem(HAD_SESSION_KEY)
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  const login = useCallback((accessToken: string, userData: User) => {
    tokenStore.set(accessToken)
    setUser(userData)
    if (typeof window !== 'undefined') localStorage.setItem(HAD_SESSION_KEY, '1')
  }, [])

  const logout = useCallback(async () => {
    tokenStore.clear()
    setUser(null)
    if (typeof window !== 'undefined') localStorage.removeItem(HAD_SESSION_KEY)
    toast.success('Até logo!')
    try {
      await authApi.logout()
    } catch {
      // ignora erro, pois o usuário já saiu localmente
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
