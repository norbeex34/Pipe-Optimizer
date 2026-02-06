import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MSH Tube Optimizer',
  description: 'Sistema de optimización de cortes para caños',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
