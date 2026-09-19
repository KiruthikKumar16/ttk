import { Outfit, Inter, Playfair_Display, Great_Vibes, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
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
  title: 'ThoorigAI Infotech Admin',
  description: 'Student, payment, invoice, and certificate administration for ThoorigAI Infotech.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0e1c3d',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable} ${playfair.variable} ${greatVibes.variable} ${poppins.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
