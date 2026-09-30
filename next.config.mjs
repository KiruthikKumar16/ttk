/** @type {import('next').NextConfig} */
import sentryConfig from '@sentry/nextjs/config'
import withBundleAnalyzer from '@next/bundle-analyzer'

const { withSentryConfig } = sentryConfig

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

const withSentry = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
})

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(withSentry)
