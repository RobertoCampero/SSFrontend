'use client'

import { Wrench } from 'lucide-react'

const statusColors: Record<string, string> = {
  PENDIENTE: 'badge-yellow',
  EN_PROGRESO: 'badge-blue',
  COMPLETADA: 'badge-green',
  CANCELADA: 'badge-red',
}

export default function ServiceOrdersPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mx-auto mb-6 rounded-full bg-cyan-50 w-20 h-20 flex items-center justify-center">
          <Wrench size={40} className="text-cyan-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Órdenes de Servicio</h1>
        <p className="text-gray-600 mb-6">
          Esta funcionalidad está en desarrollo. Las órdenes de servicio gestionan trabajos y proyectos para clientes.
        </p>
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-cyan-900 mb-2">Funcionalidades planificadas:</h3>
          <ul className="text-sm text-cyan-800 space-y-1">
            <li>• Crear órdenes desde cotizaciones</li>
            <li>• Asignar técnicos y recursos</li>
            <li>• Seguimiento de estado</li>
            <li>• Registro de materiales usados</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
