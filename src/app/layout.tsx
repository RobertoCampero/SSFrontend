import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutContent } from '@/components/layout/LayoutContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SS Admin Panel — Smart Services S.R.L.',
  description: 'Panel de administración — Smart Services S.R.L.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50`}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  )
}
