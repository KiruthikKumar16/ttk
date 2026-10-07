import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import { headers } from 'next/headers'
import { brand, brandCssVariables } from '@/lib/brand'
import { ThemeProvider } from '@/lib/ThemeContext'
import './globals.css'
import { QueryProvider } from '@/lib/query/QueryProvider'
import { LoadingSpinner } from '@/components/LoadingSpinner'

const outfit = localFont({
  src: '../public/fonts/outfit-latin-variable.woff2',
  variable: '--font-outfit-local',
  display: 'swap',
  weight: '100 900',
})

const inter = localFont({
  src: '../public/fonts/inter-latin-variable.woff2',
  variable: '--font-inter-local',
  display: 'swap',
  weight: '100 900',
})

export const metadata: Metadata = {
  metadataBase: new URL(brand.websiteUrl),
  title: {
    default: brand.displayName,
    template: `%s | ${brand.displayName}`,
  },
  description: `Student, payment, invoice, course, and certificate administration for ${brand.displayName}.`,
  applicationName: brand.displayName,
  openGraph: {
    title: brand.displayName,
    description: `Internal administration for ${brand.displayName}.`,
    siteName: brand.displayName,
    type: 'website',
    url: brand.websiteUrl,
    images: [{ url: brand.logoPath, alt: brand.displayName }],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: brand.theme.colors.navy,
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const brandVariables = Object.entries(brandCssVariables)
    .map(([name, value]) => `${name}:${value}`)
    .join(';')

  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`} data-theme="light">
      <head>
        <style nonce={nonce}>{`:root{${brandVariables}}`}</style>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('thoorigai_theme')||'light';document.documentElement.setAttribute('data-theme',t);var a=localStorage.getItem('thoorigai_accent');if(a){document.documentElement.style.setProperty('--g1',a);}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <LoadingSpinner />
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
