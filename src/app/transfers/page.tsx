'use client'

import { useState, useEffect } from 'react'
import { inventoryService, productsService } from '@/lib/services'
import type { Warehouse, Product } from '@/lib/types'
import { ArrowRightLeft, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function TransfersContent() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [transferring, setTransferring] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  
  const [form, setForm] = useState({
    productId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: 0,
    notes: ''
  })

  const [productStock, setProductStock] = useState<any>(null)
  const [loadingStock, setLoadingStock] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [warehousesRes, productsRes] = await Promise.all([
        inventoryService.listWarehouses(),
        productsService.list({ page: 1, limit: 1000 })
      ])
      setWarehouses(warehousesRes.warehouses || [])
      setProducts(productsRes.products || [])
    } catch (err) {
      console.error('Error al cargar datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProductStock = async (productId: string) => {
    if (!productId) {
      setProductStock(null)
      return
    }
    
    try {
      setLoadingStock(true)
      const stock = await productsService.getStock(productId)
      setProductStock(stock)
    } catch (err) {
      console.error('Error al cargar stock del producto:', err)
      setProductStock(null)
    } finally {
      setLoadingStock(false)
    }
  }

  const handleProductChange = (productId: string) => {
    setForm({ ...form, productId })
    loadProductStock(productId)
  }

  const getAvailableStock = () => {
    if (!productStock || !form.fromWarehouseId) return 0
    const warehouseStock = productStock.stockByWarehouse?.find(
      (s: any) => String(s.warehouseId) === String(form.fromWarehouseId)
    )
    return warehouseStock?.quantity || 0
  }

  const handleTransfer = async () => {
    if (!form.productId || !form.fromWarehouseId || !form.toWarehouseId || form.quantity <= 0) {
      setResult({ success: false, message: 'Por favor completa todos los campos requeridos' })
      return
    }

    if (form.fromWarehouseId === form.toWarehouseId) {
      setResult({ success: false, message: 'El almacén de origen y destino deben ser diferentes' })
      return
    }

    const availableStock = getAvailableStock()
    if (form.quantity > availableStock) {
      setResult({ 
        success: false, 
        message: `Stock insuficiente. Disponible: ${availableStock} unidades` 
      })
      return
    }

    try {
      setTransferring(true)
      setResult(null)
      
      await inventoryService.transferStock({
        productId: Number(form.productId),
        fromWarehouseId: Number(form.fromWarehouseId),
        toWarehouseId: Number(form.toWarehouseId),
        quantity: form.quantity,
        notes: form.notes
      })

      setResult({ 
        success: true, 
        message: `Transferencia exitosa: ${form.quantity} unidades transferidas` 
      })
      
      setForm({
        productId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: 0,
        notes: ''
      })
      setProductStock(null)
    } catch (err) {
      setResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Error al realizar la transferencia' 
      })
    } finally {
      setTransferring(false)
    }
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>
  }

  const selectedProduct = products.find(p => String(p.id) === form.productId)
  const fromWarehouse = warehouses.find(w => String(w.id) === form.fromWarehouseId)
  const toWarehouse = warehouses.find(w => String(w.id) === form.toWarehouseId)
  const availableStock = getAvailableStock()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-lg">
          <ArrowRightLeft className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transferencias de Inventario</h1>
          <p className="text-gray-600">Transfiere productos entre almacenes</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="transfer-product" className="label">Producto *</label>
              <select
                id="transfer-product"
                className="input"
                value={form.productId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleProductChange(e.target.value)}
              >
                <option value="">Seleccionar producto...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transfer-quantity" className="label">Cantidad *</label>
              <input
                id="transfer-quantity"
                type="number"
                className="input"
                value={form.quantity || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, quantity: Number(e.target.value) })}
                min="1"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="transfer-from-warehouse" className="label">Almacén Origen *</label>
              <select
                id="transfer-from-warehouse"
                className="input"
                value={form.fromWarehouseId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, fromWarehouseId: e.target.value })}
              >
                <option value="">Seleccionar almacén...</option>
                {warehouses.filter(w => w.isActive).map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {form.fromWarehouseId && productStock && (
                <p className="mt-2 text-sm text-gray-600">
                  Stock disponible: <span className="font-semibold">{availableStock}</span> unidades
                </p>
              )}
            </div>

            <div>
              <label htmlFor="transfer-to-warehouse" className="label">Almacén Destino *</label>
              <select
                id="transfer-to-warehouse"
                className="input"
                value={form.toWarehouseId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, toWarehouseId: e.target.value })}
              >
                <option value="">Seleccionar almacén...</option>
                {warehouses.filter(w => w.isActive && String(w.id) !== form.fromWarehouseId).map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="transfer-notes" className="label">Notas</label>
            <textarea
              id="transfer-notes"
              className="input"
              rows={3}
              value={form.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
              placeholder="Motivo de la transferencia..."
            />
          </div>

          {selectedProduct && fromWarehouse && toWarehouse && form.quantity > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Package size={18} />
                Resumen de Transferencia
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Producto:</strong> {selectedProduct.sku} - {selectedProduct.name}</p>
                <p><strong>Cantidad:</strong> {form.quantity} unidades</p>
                <p><strong>Desde:</strong> {fromWarehouse.name}</p>
                <p><strong>Hacia:</strong> {toWarehouse.name}</p>
                {form.quantity > availableStock && (
                  <p className="text-red-600 font-semibold">
                    ⚠️ Stock insuficiente (disponible: {availableStock})
                  </p>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className={`rounded-lg p-4 flex items-start gap-3 ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              )}
              <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setForm({
                  productId: '',
                  fromWarehouseId: '',
                  toWarehouseId: '',
                  quantity: 0,
                  notes: ''
                })
                setProductStock(null)
                setResult(null)
              }}
              className="btn-secondary"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={transferring || !form.productId || !form.fromWarehouseId || !form.toWarehouseId || form.quantity <= 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transferring ? 'Transfiriendo...' : 'Realizar Transferencia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TransfersPage() {
  return (
    <ProtectedRoute requiredPermission="products.stock">
      <TransfersContent />
    </ProtectedRoute>
  )
}
