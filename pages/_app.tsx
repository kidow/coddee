import 'styles/globals.css'
import App from 'next/app'
import { ErrorInfo } from 'react'
import { Layout, Auth } from 'containers'
import { RecoilRoot } from 'recoil'
import { supabase, userState } from 'services'

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
  render() {
    const {} = this.state
    const { Component, pageProps } = this.props
    return (
      <RecoilRoot
        initializeState={async ({ set }) => {
          const {
            data: { user }
          } = await supabase.auth.getUser()
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', user?.id)
            .single()
          if (data) set(userState, data)
        }}
      >
        <Auth>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </Auth>
      </RecoilRoot>
    )
  }
}

export default MyApp
