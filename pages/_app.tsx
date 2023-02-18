import 'styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import {
  Layout,
  Backdrop,
  Toast,
  ErrorBoundary,
  Auth,
  Modal,
  SearchBox,
  Offline,
  Snowfall
} from 'containers'
import { RecoilRoot } from 'recoil'
import 'dayjs/locale/ko'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Session } from '@supabase/auth-helpers-react'
import { ThemeProvider } from 'next-themes'

interface Props {
  initialSession: Session
}
interface State {}

function MyApp({ Component, pageProps }: AppProps<Props>) {
  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient<Database>()
  )

  useEffect(() => {
    const theme = window.localStorage.getItem('theme')
    if (theme === 'dark') document.documentElement.classList.add('dark')
  }, [])
  return (
    <Offline>
      <RecoilRoot>
        <ErrorBoundary>
          <SessionContextProvider
            supabaseClient={supabaseClient}
            initialSession={pageProps.initialSession}
          >
            <Auth>
              <ThemeProvider attribute="class">
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </ThemeProvider>
            </Auth>
            <SearchBox />
          </SessionContextProvider>
        </ErrorBoundary>
      </RecoilRoot>
      <Backdrop />
      <Toast />
      <Modal.Image />
      {/* <Snowfall /> */}
    </Offline>
  )
}

export default MyApp
