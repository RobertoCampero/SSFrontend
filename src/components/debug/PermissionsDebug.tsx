'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

export function PermissionsDebug() {
  const { user, roles, permissions, isAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50"
      >
        🔍 Debug Permisos
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-600 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Debug de Permisos</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <strong>Usuario:</strong>
          <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Roles ({roles.length}):</strong>
          <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
            {JSON.stringify(roles, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Permisos ({permissions.length}):</strong>
          <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Es Admin:</strong> {isAdmin() ? '✅ Sí' : '❌ No'}
        </div>

        <div>
          <strong>LocalStorage 'user':</strong>
          <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
            {typeof window !== 'undefined' ? (localStorage.getItem('user') || 'No encontrado') : 'N/A'}
          </pre>
        </div>
      </div>
    </div>
  )
}
