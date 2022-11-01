import { Component } from 'react'
import type { ErrorInfo } from 'react'

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
    console.log('componentDidCatch error: ')
    console.dir(error)
    console.log('componentDidCatch errorInfo: ')
    console.dir(errorInfo)
  }

  render() {
    return this.props.children
  }
}

export default ErrorBoundary
