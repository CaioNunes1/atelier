/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { api } from '@/lib/axios'
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth'

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<RegisterResponse>('/api/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
     
    api.post<LoginResponse>('/api/auth/login', payload).then((r) => r.data),

  // refresh_token vem/vai via cookie HttpOnly — body pode ser vazio
  refresh: () =>
    api.post<LoginResponse>('/api/auth/refresh', {}).then((r) => r.data),

  logout: () =>
    api.post('/api/auth/logout', {}).then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post('/api/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post('/api/auth/reset-password', payload).then((r) => r.data),
}
