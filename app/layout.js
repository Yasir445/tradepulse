import './globals.css'

export const metadata = {
  title: 'TradePulse — QT Trading Journal',
  description: 'The most advanced trading journal for QT/ICT traders. Track, analyze, and improve your execution with AI-powered insights.',
  keywords: 'trading journal, QT, ICT, NQ, ES, futures, prop trading',
  openGraph: {
    title: 'TradePulse — QT Trading Journal',
    description: 'Track trades. Find patterns. Master your model.',
    type: 'website',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
