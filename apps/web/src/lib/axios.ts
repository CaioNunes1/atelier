/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { RefreshResponse } from '@/types/auth'

let _accessToken: string | null = null

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string | null) => {
    _accessToken = token
  },
  clear: () => {
    _accessToken = null
  },
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get()

  if (token) {
    config.headers = AxiosHeaders.from(config.headers)
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers = AxiosHeaders.from(originalRequest.headers)
          originalRequest.headers.set('Authorization', `Bearer ${token}`)
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await api.post<RefreshResponse>('/api/auth/refresh', {})
        const newToken = response.data.data.access_token

        tokenStore.set(newToken)
        processQueue(null, newToken)

        originalRequest.headers = AxiosHeaders.from(originalRequest.headers)
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStore.clear()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)