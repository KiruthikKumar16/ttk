import { Outfit, Inter, Playfair_Display, Great_Vibes, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { brand, brandCssVariables } from '@/lib/brand'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-playfair',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-greatvibes',
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={brandCssVariables as React.CSSProperties}>
      <body className={`${outfit.variable} ${inter.variable} ${playfair.variable} ${greatVibes.variable} ${poppins.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
