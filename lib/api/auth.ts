import { apiClient } from './axios'
import { AuthResponse, LoginCredentials, RegisterCredentials } from '../types/auth'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken })
    return response.data
  },

  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<AuthResponse['user']>('/auth/me')
    return response.data
  },
}
