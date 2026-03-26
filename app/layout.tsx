import type { Metadata } from 'next'
import Providers from './components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'FLIP-LY.NET — Find Garbage. We Mean Treasures.',
  description: 'We aggregated all the garage sales your city is having. Yeah, we scraped Craigslist. Yeah, that\'s legal. Yeah, we made it weird on purpose.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
