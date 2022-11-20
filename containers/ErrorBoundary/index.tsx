import { PureComponent } from 'react'
import type { ErrorInfo } from 'react'
import { captureException } from 'services'
import { Error } from 'components'

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
    if (this.state.hasError) return <Error />
    return this.props.children
  }
}

export default ErrorBoundary
