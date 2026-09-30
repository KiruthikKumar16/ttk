import localFont from 'next/font/local'

const playfairDisplay = localFont({
  src: '../../../../../public/fonts/playfair-display-latin-variable.woff2',
  variable: '--font-playfair-local',
  display: 'swap',
  weight: '400 900',
})

const greatVibes = localFont({
  src: '../../../../../public/fonts/great-vibes-latin-400.woff2',
  variable: '--font-greatvibes-local',
  display: 'swap',
  weight: '400',
})

export default function CertificateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${playfairDisplay.variable} ${greatVibes.variable}`}>{children}</div>
}
