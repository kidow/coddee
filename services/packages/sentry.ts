import { configureScope, captureException } from '@sentry/nextjs'

export default async (error: any, user?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(error)
    return
  }

  configureScope((scope) => {
    if (error?.message) {
      scope.setFingerprint([error?.message])
    }

    if (user) {
      scope.setUser({
        id: user.id,
        email: user.email,
        username: user.nickname || user.user_metadata?.user_name
      })
    }

    if (typeof window !== 'undefined') {
      scope.setContext('location', {
        hash: window.location.hash,
        host: window.location.host,
        hostname: window.location.hostname,
        href: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        port: window.location.port,
        protocol: window.location.protocol,
        search: window.location.search
      })
    }

    if (Object.prototype.hasOwnProperty.call(error, 'hint')) {
      scope.setContext('supabase', error)
      captureException(error)
      return
    }

    captureException(error)
  })
}
