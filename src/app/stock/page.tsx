'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { inventoryService, categoriesService, excelService } from '@/lib/services'
import type { InventoryItem, Category, Warehouse, ExcelImportResult } from '@/lib/types'
import { Package, Search, AlertTriangle, TrendingDown, ChevronDown, ChevronUp, Upload, Download } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Modal } from '@/components/ui/Modal'
function StockContent() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<number | ''>('')
  const [filterWarehouse, setFilterWarehouse] = useState<number | ''>('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadInventory()
  }, [search, filterCategory, filterWarehouse, filterLowStock])

  const loadData = async () => {
    try {
      const [categoriesRes, warehousesRes] = await Promise.all([
        categoriesService.list({ page: 1, limit: 100 }),
        inventoryService.listWarehouses()
      ])
      setCategories(categoriesRes.categories)
      setWarehouses(warehousesRes.warehouses)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  const loadInventory = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: 1,
        limit: 100
      }
      
      if (search) params.search = search
      if (filterCategory) params.categoryId = filterCategory
      if (filterWarehouse) params.warehouseId = filterWarehouse
      if (filterLowStock) params.lowStockOnly = true

      const response = await inventoryService.getInventory(params)
      setInventory(response.inventory)
    } catch (error) {
      console.error('Error al cargar inventario:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleDownloadStockTemplate = async () => {
    try {
      const blob = await excelService.downloadStockTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla_stock.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar plantilla')
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setImportResult(null)
    }
  }

  const handleImportStock = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo')
      return
    }

    try {
      setImporting(true)
      // Usar importProductsClient que maneja el formato completo con CANTIDAD y ALMACEN
      const token = localStorage.getItem('token') || ''
      const result = await excelService.importProductsClient(selectedFile, token)
      setImportResult(result)
      await loadInventory()
      setSelectedFile(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al importar stock')
    } finally {
      setImporting(false)
    }
  }

  const openImportModal = () => {
    setImportResult(null)
    setSelectedFile(null)
    setImportModalOpen(true)
  }

  const lowStockCount = inventory.filter(item => item.isLowStock).length
  const totalProducts = inventory.length
  const totalStockValue = inventory.reduce((sum, item) => sum + (item.totalStock * item.salePrice), 0)

  if (loading && inventory.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario y Stock</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión completa de stock por almacén</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadStockTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Plantilla Stock
          </button>
          <button
            onClick={openImportModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={18} />
            Importar Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">Bs {totalStockValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingDown className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="stock-search" className="label text-xs">Buscar</label>
            <div className="relative">
              <input
                id="stock-search"
                type="text"
                placeholder="SKU o nombre..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label htmlFor="stock-filter-category" className="label text-xs">Categoría</label>
            <select
              id="stock-filter-category"
              value={filterCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value ? Number(e.target.value) : '')}
              className="input"
            >
              <option value="">Todas</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stock-filter-warehouse" className="label text-xs">Almacén</label>
            <select
              id="stock-filter-warehouse"
              value={filterWarehouse}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterWarehouse(e.target.value ? Number(e.target.value) : '')}
              className="input"
            >
              <option value="">Todos</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Filtro</label>
            <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterLowStock(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Solo stock bajo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Stock Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Stock Mín.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Precio Venta</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                inventory.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.sku}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{item.minStockGlobal}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        Bs {item.salePrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                            <AlertTriangle size={12} />
                            Bajo
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRow(item.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedRows.has(item.id) ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(item.id) && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Product Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Información del Producto</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Marca:</span>
                                  <span className="font-medium">{item.brand || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Origen:</span>
                                  <span className="font-medium">{item.origin || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Código Fabricante:</span>
                                  <span className="font-medium font-mono">{item.manufacturerCode || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Proveedor:</span>
                                  <span className="font-medium">{item.supplier?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Precio Costo:</span>
                                  <span className="font-medium">Bs {item.costPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Unidad:</span>
                                  <span className="font-medium">{item.unit?.name || '-'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Stock by Warehouse */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Stock por Almacén</h4>
                              <div className="space-y-2">
                                {item.stockByWarehouse.length === 0 ? (
                                  <p className="text-sm text-gray-500">Sin stock en almacenes</p>
                                ) : (
                                  item.stockByWarehouse.map(stock => (
                                    <div key={stock.warehouseId} className="flex items-center justify-between p-2 bg-white rounded border">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{stock.warehouseName}</div>
                                        <div className="text-xs text-gray-500">{stock.warehouseCode}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900">{stock.quantity}</div>
                                        <div className="text-xs text-gray-500">unidades</div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Stock Modal */}
      <Modal 
        open={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        title="Importar Stock desde Excel" 
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Descarga la plantilla de stock usando el botón "Plantilla Stock"</li>
              <li>Completa el archivo con: SKU, Código de Almacén y Cantidad</li>
              <li>Sube el archivo aquí para actualizar el stock</li>
              <li>Se generarán movimientos de inventario automáticamente</li>
            </ol>
          </div>

          <div>
            <label htmlFor="stock-import-file" className="label">Archivo Excel</label>
            <input
              id="stock-import-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">Archivo seleccionado: {selectedFile.name}</p>
            )}
          </div>

          {importResult && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Resultados de la Importación</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">
                    {importResult.total || 0}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {(importResult.created || 0) + (importResult.updated || 0)}
                  </div>
                  <div className="text-xs text-green-700">Exitosos</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errors?.length || 0}
                  </div>
                  <div className="text-xs text-red-700">Errores</div>
                </div>
              </div>

              {importResult.success && importResult.success.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-green-900 mb-2">✅ Productos procesados:</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.success.slice(0, 5).map((item: any, idx: number) => (
                      <div key={idx} className="text-xs text-green-700 bg-green-50 p-2 rounded">
                        {item.sku} - {item.name} ({item.action === 'created' ? 'Creado' : 'Actualizado'})
                      </div>
                    ))}
                    {importResult.success.length > 5 && (
                      <div className="text-xs text-gray-600 text-center">
                        ... y {importResult.success.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-red-900 mb-2">❌ Errores encontrados:</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((error: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                        Fila {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={() => setImportModalOpen(false)} 
              className="btn-secondary"
              disabled={importing}
            >
              {importResult ? 'Cerrar' : 'Cancelar'}
            </button>
            {!importResult && (
              <button 
                type="button" 
                onClick={handleImportStock} 
                className="btn-primary"
                disabled={importing || !selectedFile}
              >
                {importing ? 'Importando...' : 'Importar Stock'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function StockPage() {
  return (
    <ProtectedRoute requiredPermission="products.stock">
      <StockContent />
    </ProtectedRoute>
  )
}
