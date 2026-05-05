export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthError {
  message: string
  field?: string
}
