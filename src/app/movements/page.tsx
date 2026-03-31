'use client'

import { useState, useEffect } from 'react'
import { ArrowRightLeft, Search, Filter, Download, ArrowUpCircle, ArrowDownCircle, RefreshCw, Edit3 } from 'lucide-react'
import { inventoryService } from '@/lib/services/inventory.service'
import type { InventoryMovement, MovementType } from '@/lib/types'

export default function MovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<MovementType | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    loadMovements()
  }, [currentPage, filterType])

  const loadMovements = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit,
      }
      
      if (filterType) {
        params.type = filterType
      }

      console.log('🔍 Cargando movimientos con params:', params)
      const response = await inventoryService.listMovements(params)
      console.log('📦 Respuesta completa del servidor:', JSON.stringify(response, null, 2))
      console.log('📊 Movimientos recibidos:', response.movements?.length || 0)
      console.log('📄 Paginación:', response.pagination)
      
      if (response.movements && response.movements.length > 0) {
        console.log('✅ Primer movimiento:', response.movements[0])
      } else {
        console.log('⚠️ No hay movimientos en la respuesta')
      }
      
      setMovements(response.movements || [])
      setTotalPages(response.pagination?.totalPages || 1)
      setTotal(response.pagination?.total || 0)
    } catch (error: any) {
      console.error('Error completo al cargar movimientos:', error)
      console.error('Mensaje de error:', error?.message)
      console.error('Respuesta del servidor:', error?.response)
      
      // Mostrar error más detallado
      const errorMessage = error?.response?.data?.error || error?.message || 'Error desconocido al cargar movimientos'
      console.error('Error al cargar movimientos:', errorMessage)
      
      setError(errorMessage)
      setMovements([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const getMovementTypeIcon = (type: MovementType) => {
    switch (type) {
      case 'INGRESO':
        return <ArrowDownCircle className="text-green-600" size={20} />
      case 'EGRESO':
        return <ArrowUpCircle className="text-red-600" size={20} />
      case 'TRANSFERENCIA':
        return <ArrowRightLeft className="text-blue-600" size={20} />
      case 'AJUSTE':
        return <Edit3 className="text-yellow-600" size={20} />
      default:
        return <ArrowRightLeft className="text-gray-600" size={20} />
    }
  }

  const getMovementTypeBadge = (type: MovementType) => {
    const styles = {
      INGRESO: 'bg-green-100 text-green-800',
      EGRESO: 'bg-red-100 text-red-800',
      TRANSFERENCIA: 'bg-blue-100 text-blue-800',
      AJUSTE: 'bg-yellow-100 text-yellow-800',
    }
    return styles[type] || 'bg-gray-100 text-gray-800'
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      COMPRA: 'Compra',
      PROYECTO: 'Proyecto',
      KIT: 'Kit',
      DEVOLUCION: 'Devolución',
      AJUSTE_MANUAL: 'Ajuste Manual',
      VENTA: 'Venta',
      SERVICIO: 'Servicio',
    }
    return labels[reason] || reason
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const filteredMovements = movements.filter(movement => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      movement.product?.name.toLowerCase().includes(search) ||
      movement.product?.sku.toLowerCase().includes(search) ||
      movement.warehouse?.name.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Movimientos de Inventario</h1>
        <p className="text-gray-600">Historial completo de movimientos de stock</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="movements-search"
                type="text"
                placeholder="Buscar por producto, SKU o almacén..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Buscar movimientos"
              />
            </div>
            <div className="flex gap-2">
              <select
                id="movements-filter-type"
                value={filterType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFilterType(e.target.value as MovementType | '')
                  setCurrentPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Filtrar por tipo de movimiento"
              >
                <option value="">Todos los tipos</option>
                <option value="INGRESO">Ingresos</option>
                <option value="EGRESO">Egresos</option>
                <option value="TRANSFERENCIA">Transferencias</option>
                <option value="AJUSTE">Ajustes</option>
              </select>
              <button
                onClick={loadMovements}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 rounded-full bg-red-50 w-20 h-20 flex items-center justify-center">
              <ArrowRightLeft className="text-red-600" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar movimientos</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Problema del Backend</h4>
              <p className="text-sm text-yellow-800 mb-2">
                El backend tiene un error en el modelo de Prisma. El modelo <code className="bg-yellow-100 px-1 rounded">inventoryMovement</code> no existe o tiene otro nombre.
              </p>
              <p className="text-sm text-yellow-800">
                Por favor, verifica el schema de Prisma en el backend y asegúrate de que el modelo esté correctamente definido.
              </p>
            </div>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="text-center py-12">
            <ArrowRightLeft className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No se encontraron movimientos</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Almacén</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getMovementTypeIcon(movement.type)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeBadge(movement.type)}`}>
                            {movement.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{movement.product?.name}</div>
                        <div className="text-xs text-gray-500">SKU: {movement.product?.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        {movement.type === 'TRANSFERENCIA' && movement.notes ? (
                          <div className="text-sm">
                            <div className="text-gray-900 font-medium">{movement.warehouse?.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="text-blue-600">↔ Transferencia</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">{movement.warehouse?.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          movement.type === 'INGRESO' ? 'text-green-600' : 
                          movement.type === 'EGRESO' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {movement.type === 'INGRESO' ? '+' : movement.type === 'EGRESO' ? '-' : '±'}
                          {movement.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{getReasonLabel(movement.reason)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(movement.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {movement.notes ? (
                          <span className="truncate max-w-xs block" title={movement.notes}>
                            {movement.notes}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(currentPage - 1) * limit + 1}</span> a{' '}
                <span className="font-medium">{Math.min(currentPage * limit, total)}</span> de{' '}
                <span className="font-medium">{total}</span> movimientos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
