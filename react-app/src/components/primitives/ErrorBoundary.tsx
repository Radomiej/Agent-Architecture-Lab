import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[ErrorBoundary${this.props.label ? ` (${this.props.label})` : ''}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg text-sm"
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.25)',
            color: '#F87171',
            margin: '16px',
          }}
        >
          <span className="text-lg">⚠</span>
          <p className="font-medium">Something went wrong{this.props.label ? ` in ${this.props.label}` : ''}.</p>
          <p className="opacity-70 text-xs text-center max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred. Please reload the page.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{
              background: 'rgba(248,113,113,0.15)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#F87171',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
