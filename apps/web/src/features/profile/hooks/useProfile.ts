import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { User } from '@/types/auth';

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (input: { name: string; email: string }) =>
      (await api.patch<{ data: User }>('/api/me', input)).data.data,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { current_password: string; password: string }) =>
      api.patch('/api/me/password', input),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => api.delete('/api/me') });
}
