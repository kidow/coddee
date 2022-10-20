const { withSentryConfig } = require('@sentry/nextjs')

const moduleExports = {
  sentry: {
    hideSourceMaps: true
  }
}

const sentryWebpackPluginOptions = {
  silent: true
}

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions)
