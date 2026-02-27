import type { Metadata } from 'next'
import './globals.css'
import RecaptchaProvider from '@/components/RecaptchaProvider'

export const metadata: Metadata = {
  title: 'Vertex - Connect Students with Volunteering Opportunities',
  description: 'Vertex connects high school students with meaningful volunteering opportunities at local businesses.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <RecaptchaProvider>{children}</RecaptchaProvider>
      </body>
    </html>
  )
}
