export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  email_verified_at: string | null
  created_at: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Payloads de request (espelham os DTOs do backend)
export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  password_confirmation: string
}

// Respostas da API
export interface LoginResponse {
  data: {
    access_token: string
    user: User
  }
}

export interface RegisterResponse {
  data: {
    user: User
    message: string
  }
}

export interface RefreshResponse {
  data: {
    access_token: string
    user: User
  }
}

// Erro padrão da API
export interface ApiError {
  statusCode: number
  error: string
  message: string | string[]
}
