'use client'

import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mx-auto mb-6 rounded-full bg-teal-50 w-20 h-20 flex items-center justify-center">
          <BarChart3 size={40} className="text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Reportes y Análisis</h1>
        <p className="text-gray-600 mb-6">
          Esta funcionalidad está en desarrollo. Los reportes permitirán analizar el desempeño del negocio.
        </p>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-teal-900 mb-2">Reportes planificados:</h3>
          <ul className="text-sm text-teal-800 space-y-1">
            <li>• Ventas por período</li>
            <li>• Inventario y rotación</li>
            <li>• Clientes y cotizaciones</li>
            <li>• Rentabilidad por producto</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
