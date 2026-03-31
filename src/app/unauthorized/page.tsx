'use client'

import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="mx-auto mb-6 rounded-full bg-red-50 w-20 h-20 flex items-center justify-center">
          <ShieldAlert size={40} className="text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta página. Si crees que esto es un error, contacta al administrador del sistema.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Volver
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
