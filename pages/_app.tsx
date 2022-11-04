import 'styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { Layout, Backdrop, Toast, ErrorBoundary, Auth, Modal } from 'containers'
import { RecoilRoot } from 'recoil'
import 'dayjs/locale/ko'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react'

interface Props {}
interface State {}

function MyApp({
  Component,
  pageProps
}: AppProps<{ initialSession: Session }>) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient())

  useEffect(() => {
    const theme = window.localStorage.getItem('theme')
    if (theme === 'dark') document.documentElement.classList.add('dark')
  }, [])
  return (
    <>
      <RecoilRoot>
        <ErrorBoundary>
          <SessionContextProvider
            supabaseClient={supabaseClient}
            initialSession={pageProps.initialSession}
          >
            <Auth>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </Auth>
          </SessionContextProvider>
        </ErrorBoundary>
      </RecoilRoot>
      <Backdrop />
      <Toast />
      <Modal.Image />
    </>
  )
}

export default MyApp
