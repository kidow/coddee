import 'styles/globals.css'
import App from 'next/app'
import { ErrorInfo } from 'react'
import { Layout, Auth, Backdrop, Toast } from 'containers'
import { RecoilRoot } from 'recoil'
import 'dayjs/locale/ko'

interface Props {}
interface State {
  hasError: boolean
}

class MyApp extends App<Props, {}, State> {
  state = {
    hasError: false
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error) this.setState({ hasError: true })
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidMount() {
    const theme = window.localStorage.getItem('theme')
    if (theme === 'dark') document.documentElement.classList.add('dark')
  }
  render() {
    const { Component, pageProps } = this.props
    return (
      <>
        <RecoilRoot>
          <Auth>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Auth>
        </RecoilRoot>
        <Backdrop />
        <Toast />
      </>
    )
  }
}

export default MyApp
