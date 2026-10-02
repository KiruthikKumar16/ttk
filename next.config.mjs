/** @type {import('next').NextConfig} */
import sentryConfig from '@sentry/nextjs/config'
import withBundleAnalyzer from '@next/bundle-analyzer'

const { withSentryConfig } = sentryConfig

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/certificate',
        destination: '/certificates',
        permanent: true,
      },
      {
        source: '/certificate/:path*',
        destination: '/certificates/:path*',
        permanent: true,
      },
      {
        source: '/student',
        destination: '/students',
        permanent: true,
      },
      {
        source: '/student/:path*',
        destination: '/students/:path*',
        permanent: true,
      },
      {
        source: '/invoice',
        destination: '/invoices',
        permanent: true,
      },
      {
        source: '/invoice/:path*',
        destination: '/invoices/:path*',
        permanent: true,
      },
      {
        source: '/course',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/course/:path*',
        destination: '/courses/:path*',
        permanent: true,
      },
    ]
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
