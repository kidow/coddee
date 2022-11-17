import { Component } from 'react'
import type { ErrorInfo } from 'react'
import { captureException } from 'services'

interface Error {
  stack?: string
}
interface Props extends ReactProps {}
interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error)
  }

  render() {
    return this.props.children
  }
}

export default ErrorBoundary
