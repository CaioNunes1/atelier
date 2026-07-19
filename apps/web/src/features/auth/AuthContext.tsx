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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)

  // Ao montar, tenta renovar a sessão via cookie (refresh token)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    authApi
      .refresh()
      .then(({ data }) => {
        tokenStore.set(data.access_token)
        setUser(data.user)
      })
      .catch(() => {
        tokenStore.clear()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Escuta evento de logout forçado pelo interceptor do Axios
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null)
      tokenStore.clear()
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  const login = useCallback((accessToken: string, userData: User) => {
    tokenStore.set(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    tokenStore.clear()
    setUser(null)
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
