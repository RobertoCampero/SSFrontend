'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { inventoryService } from '@/lib/services'
import type { Warehouse } from '@/lib/types'
import { Package } from 'lucide-react'

export default function WarehousesPage() {
  const [data, setData] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [deleting, setDeleting] = useState<Warehouse | null>(null)
  const [form, setForm] = useState({ 
    code: '', 
    name: '', 
    description: '', 
    type: 'PRINCIPAL' as 'PRINCIPAL' | 'SECUNDARIO' | 'TRANSITO',
    location: '',
    isActive: true 
  })
  const [viewingProducts, setViewingProducts] = useState<Warehouse | null>(null)
  const [warehouseProducts, setWarehouseProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [clearingStock, setClearingStock] = useState(false)
  const [warehouseToClear, setWarehouseToClear] = useState<Warehouse | null>(null)
  const [showClearStockModal, setShowClearStockModal] = useState(false)

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      setLoading(true)
      const response = await inventoryService.listWarehouses()
      // Desestructurar warehouses del objeto de respuesta
      const { warehouses } = response
      setData(warehouses)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar almacenes')
    } finally {
      setLoading(false)
    }
  }

  const loadWarehouseProducts = async (warehouse: Warehouse) => {
    try {
      setLoadingProducts(true)
      const response = await inventoryService.getInventory({ 
        warehouseId: Number(warehouse.id),
        limit: 1000
      })
      setWarehouseProducts(response.inventory || [])
    } catch (err) {
      console.error('Error al cargar productos del almacén:', err)
      setWarehouseProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const openViewProducts = async (warehouse: Warehouse) => {
    setViewingProducts(warehouse)
    await loadWarehouseProducts(warehouse)
  }

  const openClearStock = (warehouse: Warehouse) => {
    setWarehouseToClear(warehouse)
    setShowClearStockModal(true)
  }

  const handleClearStock = async () => {
    if (!warehouseToClear) return

    try {
      setClearingStock(true)
      setShowClearStockModal(false)

      // Obtener todos los productos del almacén
      const response = await inventoryService.getInventory({ 
        warehouseId: Number(warehouseToClear.id),
        limit: 1000
      })

      console.log('📦 Respuesta del inventario:', response)
      console.log('📊 Total productos en respuesta:', response.inventory?.length || 0)

      const productsWithStock = response.inventory.filter((item: any) => {
        const stock = item.stockByWarehouse?.find(
          (s: any) => String(s.warehouseId) === String(warehouseToClear.id)
        )
        console.log(`Producto ${item.sku}: stock =`, stock?.quantity || 0)
        return stock && stock.quantity > 0
      })

      console.log('✅ Productos con stock > 0:', productsWithStock.length)

      if (productsWithStock.length === 0) {
        alert(`No hay productos con stock en este almacén.\n\nTotal de productos encontrados: ${response.inventory?.length || 0}\nProductos con stock > 0: 0\n\nTodos los productos ya tienen stock en 0.`)
        return
      }

      let successCount = 0
      let errorCount = 0

      // Crear movimiento de EGRESO para cada producto
      for (const item of productsWithStock) {
        const stock = item.stockByWarehouse?.find(
          (s: any) => String(s.warehouseId) === String(warehouseToClear.id)
        )
        
        if (stock && stock.quantity > 0) {
          try {
            await inventoryService.createMovement({
              productId: Number(item.id),
              warehouseId: Number(warehouseToClear.id),
              type: 'EGRESO',
              quantity: stock.quantity,
              reason: 'AJUSTE_MANUAL',
              notes: `Vaciado de almacén ${warehouseToClear.name}`
            })
            successCount++
          } catch (err) {
            errorCount++
            console.error(`Error al vaciar stock de ${item.sku}:`, err)
          }
        }
      }

      alert(`Stock vaciado: ${successCount} productos procesados${errorCount > 0 ? `, ${errorCount} errores` : ''}`)
      await loadWarehouses()
      setWarehouseToClear(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al vaciar stock del almacén')
    } finally {
      setClearingStock(false)
    }
  }

  const columns: Column<Warehouse>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'location', label: 'Ubicación' },
    { key: 'isActive', label: 'Estado', render: (item) => (
        <span className={item.isActive ? 'badge-green' : 'badge-red'}>{item.isActive ? 'Activo' : 'Inactivo'}</span>
      )
    },
    { key: 'actions', label: 'Acciones', render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={() => openViewProducts(item)}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Package size={16} />
            Ver Productos
          </button>
          <button
            onClick={() => openClearStock(item)}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            title="Vaciar stock del almacén"
          >
            Vaciar Stock
          </button>
        </div>
      )
    },
  ]

  const openAdd = () => { 
    setEditing(null); 
    setForm({ code: '', name: '', description: '', type: 'PRINCIPAL', location: '', isActive: true }); 
    setModalOpen(true) 
  }
  const openEdit = (item: Warehouse) => { 
    setEditing(item); 
    setForm({ 
      code: (item as any).code || '', 
      name: item.name, 
      description: (item as any).description || '',
      type: (item as any).type || 'PRINCIPAL',
      location: item.location || '',
      isActive: item.isActive
    }); 
    setModalOpen(true) 
  }
  const openDelete = (item: Warehouse) => { setDeleting(item); setDeleteOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        await inventoryService.updateWarehouse(String(editing.id), form)
      } else {
        await inventoryService.createWarehouse(form)
      }
      setModalOpen(false)
      await loadWarehouses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar almacén')
    }
  }

  const handleDelete = async () => { 
    if (deleting) {
      try {
        await inventoryService.deleteWarehouse(String(deleting.id))
        setDeleteOpen(false)
        setDeleting(null)
        await loadWarehouses()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar almacén')
      }
    } 
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <>
      <DataTable title="Almacenes" columns={columns} data={data} onAdd={openAdd} onEdit={openEdit} onDelete={openDelete} addLabel="Nuevo Almacén" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Almacén' : 'Nuevo Almacén'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wh_code" className="label">Código *</label>
              <input 
                id="wh_code" 
                className="input" 
                value={form.code} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value })} 
                placeholder="ALM-01"
                required 
              />
            </div>
            <div>
              <label htmlFor="wh_type" className="label">Tipo *</label>
              <select 
                id="wh_type" 
                className="input" 
                value={form.type} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, type: e.target.value as any })}
              >
                <option value="PRINCIPAL">Principal</option>
                <option value="SECUNDARIO">Secundario</option>
                <option value="TRANSITO">Tránsito</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="wh_name" className="label">Nombre *</label>
            <input 
              id="wh_name" 
              className="input" 
              value={form.name} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} 
              placeholder="Almacén Principal"
              required 
            />
          </div>
          <div>
            <label htmlFor="wh_description" className="label">Descripción</label>
            <textarea 
              id="wh_description" 
              className="input" 
              rows={2}
              value={form.description} 
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} 
              placeholder="Bodega central"
            />
          </div>
          <div>
            <label htmlFor="wh_location" className="label">Ubicación</label>
            <input 
              id="wh_location" 
              className="input" 
              value={form.location} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, location: e.target.value })} 
              placeholder="Calle 123, Ciudad"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wh_active"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="wh_active" className="text-sm text-gray-700">Almacén Activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleSave} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar Almacén" message={`¿Está seguro de eliminar el almacén "${deleting?.name}"?`} />
      
      {/* Modal de Confirmación para Vaciar Stock */}
      {showClearStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ⚠️ Vaciar Stock del Almacén
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de vaciar <strong>TODO el stock</strong> del almacén{' '}
                <strong>{warehouseToClear?.name}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-800">
                  <strong>Advertencia:</strong> Esta acción creará movimientos de EGRESO para todos los productos 
                  con stock en este almacén, dejándolo en 0. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowClearStockModal(false)
                    setWarehouseToClear(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={clearingStock}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearStock}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  disabled={clearingStock}
                >
                  {clearingStock ? 'Vaciando...' : 'Sí, Vaciar Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para ver productos del almacén */}
      <Modal 
        open={!!viewingProducts} 
        onClose={() => setViewingProducts(null)} 
        title={`Productos en ${viewingProducts?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          {loadingProducts ? (
            <div className="text-center py-8 text-gray-500">Cargando productos...</div>
          ) : warehouseProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay productos en este almacén</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Costo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {warehouseProducts.map((item) => {
                    const stockInWarehouse = item.stockByWarehouse?.find(
                      (s: any) => s.warehouseId === viewingProducts?.id
                    )
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          {stockInWarehouse?.quantity || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          Bs {(item.salePrice || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          Bs {(item.costPrice || 0).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end pt-4 border-t">
            <button onClick={() => setViewingProducts(null)} className="btn-secondary">
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
