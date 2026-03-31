'use client'

import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { useEffect } from 'react'

export default function ClientesCotizacionPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/clients')
  }, [router])
  
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mx-auto mb-6 rounded-full bg-blue-50 w-20 h-20 flex items-center justify-center">
          <Users size={40} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Redirigiendo...</h1>
        <p className="text-gray-600">
          Redirigiendo al módulo de clientes...
        </p>
      </div>
    </div>
  )
}
