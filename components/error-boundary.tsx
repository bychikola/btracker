'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card-bg border border-border rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-muted mb-4">
              Произошла ошибка при загрузке приложения. Попробуйте обновить страницу.
            </p>
            {this.state.error && (
              <details className="text-left text-sm text-muted bg-background p-3 rounded-lg mb-4">
                <summary className="cursor-pointer font-medium">
                  Детали ошибки
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
