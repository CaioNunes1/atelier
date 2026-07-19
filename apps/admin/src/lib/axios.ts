import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

let _accessToken: string | null = null

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string | null) => { _accessToken = token },
  clear: () => { _accessToken = null },
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token!))
  failedQueue = []
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (
      error.response?.status === 401 &&
      !orig._retry &&
      !orig.url?.includes('/auth/refresh') &&
      !orig.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          orig.headers.Authorization = `Bearer ${token}`
          return api(orig)
        })
      }
      orig._retry = true
      isRefreshing = true
      try {
        const res = await api.post<{ data: { access_token: string } }>('/api/auth/refresh', {})
        const newToken = res.data.data.access_token
        tokenStore.set(newToken)
        processQueue(null, newToken)
        orig.headers.Authorization = `Bearer ${newToken}`
        return api(orig)
      } catch (e) {
        processQueue(e, null)
        tokenStore.clear()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)
