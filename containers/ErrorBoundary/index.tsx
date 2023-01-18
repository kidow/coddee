import { PureComponent } from 'react'
import type { ErrorInfo } from 'react'
import { captureException } from 'services'

interface Error {
  stack?: string
}
interface Props extends ReactProps {}
interface State {
  hasError: boolean
}

class ErrorBoundary extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    captureException(error)
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error)
  }

  private onError = (event: ErrorEvent) => {
    captureException(event.error)
    event.preventDefault()
  }

  private onCatchPromise = (event: PromiseRejectionEvent) => {
    event.promise.catch(captureException)
    event.preventDefault()
  }

  componentDidMount() {
    window.addEventListener('error', this.onError)
    window.addEventListener('unhandledrejection', this.onCatchPromise)
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.onError)
    window.removeEventListener('unhandledrejection', this.onCatchPromise)
  }

  render() {
    if (this.state.hasError)
      return (
        <div className="flex h-screen select-none items-center justify-center text-center">
          <div>
            <div className="text-7xl">500 Server Error</div>
            <div className="mt-4 text-xl text-neutral-600">
              죄송합니다. 에러가 발생했습니다.
            </div>
            <div className="mt-2 text-neutral-600">
              문제가 지속된다면 제보 부탁드립니다.
            </div>
          </div>
        </div>
      )
    return this.props.children
  }
}

export default ErrorBoundary
