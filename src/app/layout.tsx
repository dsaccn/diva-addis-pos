import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Diva Addis Lounge — POS System',
  description: 'Point of Sale System for Diva Addis Lounge, Addis Ababa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
