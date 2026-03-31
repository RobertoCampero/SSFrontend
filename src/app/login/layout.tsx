import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — Smart Services',
  description: 'Iniciar sesión en Smart Services',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
