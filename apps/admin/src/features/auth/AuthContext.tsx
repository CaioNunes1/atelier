/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, tokenStore } from '@/lib/axios'
import type { AdminUser } from '@/types'

let refreshPromise: Promise<unknown> | null = null

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post('/api/auth/refresh', {})
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

interface AuthCtx {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: AdminUser) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)

useEffect(() => {
  if (initialized.current) return
  initialized.current = true

  refreshSession()
    .then(({ data }) => {
      tokenStore.set(data.data.access_token)
      setUser(data.data.user)
    })
    .catch(() => {
      tokenStore.clear()
      setUser(null)
    })
    .finally(() => setIsLoading(false))
}, [])

  useEffect(() => {
    const handle = () => { setUser(null); tokenStore.clear() }
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [])

  const login = useCallback((token: string, u: AdminUser) => {
    tokenStore.set(token)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout', {}) } finally {
      tokenStore.clear()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora de AuthProvider')
  return ctx
}
