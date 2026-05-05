import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api/proxy',
  timeout: 30000, // Увеличен timeout до 30 секунд
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor для обработки ошибок и обновления токена
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Обработка 429 (Too Many Requests) с exponential backoff
    if (error.response?.status === 429 && !originalRequest._retryCount) {
      originalRequest._retryCount = 0
    }

    if (error.response?.status === 429 && originalRequest._retryCount < 5) {
      originalRequest._retryCount++
      // Увеличенная задержка: 2s, 4s, 8s, 16s, 32s
      const delay = Math.min(2000 * Math.pow(2, originalRequest._retryCount - 1), 32000)

      await new Promise(resolve => setTimeout(resolve, delay))
      return apiClient(originalRequest)
    }

    // Если 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post('/api/proxy/auth/refresh', { refreshToken })
          const { token } = response.data

          localStorage.setItem('auth_token', token)
          originalRequest.headers.Authorization = `Bearer ${token}`

          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Если обновление токена не удалось, очищаем хранилище
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/'
      }
    }

    // Не логируем 429 ошибки, они обрабатываются автоматически
    if (error.response?.status !== 429) {
      console.error('API Error:', error)
    }
    return Promise.reject(error)
  }
)
