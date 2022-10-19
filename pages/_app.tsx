import 'styles/globals.css'
import App from 'next/app'
import { ErrorInfo } from 'react'
import { Layout, Auth, Backdrop, Toast } from 'containers'
import { RecoilRoot } from 'recoil'
import { supabase, userState } from 'services'
import 'dayjs/locale/ko'

interface Props {}
interface State {
  hasError: boolean
  isValidated: boolean
}

class MyApp extends App<Props, {}, State> {
  state = {
    hasError: false,
    isValidated: false
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
    const { isValidated } = this.state
    const { Component, pageProps } = this.props
    return (
      <>
        <RecoilRoot
          initializeState={async ({ set }) => {
            try {
              const {
                data: { user }
              } = await supabase.auth.getUser()
              if (!user) return
              const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', user?.id)
                .single()
              if (data) set(userState, data)
            } catch (err) {
              console.error(err)
            } finally {
              this.setState({ isValidated: true })
            }
          }}
        >
          <Auth>
            <Layout>{isValidated && <Component {...pageProps} />}</Layout>
          </Auth>
        </RecoilRoot>
        <Backdrop />
        <Toast />
      </>
    )
  }
}

export default MyApp
