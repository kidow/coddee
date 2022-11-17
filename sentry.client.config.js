import * as Sentry from '@sentry/nextjs'

/** @type {import('@sentry/nextjs/types/utils/nextjsOptions').NextjsOptions} */
const options = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  environment: process.env.NODE_ENV
}

if (process.env.NODE_ENV !== 'production') {
  options.beforeSend = () => null
  options.integrations = (integrations) =>
    integrations.filter(({ name }) => name !== 'Breadcrumbs')
}

Sentry.init(options)
