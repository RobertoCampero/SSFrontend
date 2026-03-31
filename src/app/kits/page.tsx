'use client'

import { Box } from 'lucide-react'

export default function KitsPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mx-auto mb-6 rounded-full bg-pink-50 w-20 h-20 flex items-center justify-center">
          <Box size={40} className="text-pink-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Gestión de Kits</h1>
        <p className="text-gray-600 mb-6">
          Esta funcionalidad está en desarrollo. Los kits permiten agrupar productos para venderlos como conjunto.
        </p>
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-pink-900 mb-2">Funcionalidades planificadas:</h3>
          <ul className="text-sm text-pink-800 space-y-1">
            <li>• Crear kits de productos</li>
            <li>• Definir componentes y cantidades</li>
            <li>• Gestionar stock de kits</li>
            <li>• Precios especiales para kits</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
