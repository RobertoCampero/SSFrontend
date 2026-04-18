'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { productsService, excelService, inventoryService, categoriesService, unitsService } from '@/lib/services'
import type { Product, ExcelImportResult, Warehouse, ExcelPreviewResponse, CategoryMapping, Category, Unit } from '@/lib/types'
import { Upload, Download, AlertCircle, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

export default function ProductsPage() {
  const toast = useToast()
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [previewData, setPreviewData] = useState<ExcelPreviewResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>([])
  const [productCategoryCorrections, setProductCategoryCorrections] = useState<Record<number, number>>({})
  const [previewPage, setPreviewPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({ name: '', sku: '', description: '', categoryId: 0, unitId: '', costPrice: 0, salePrice: 0, minStock: 0, brand: '', origin: '', manufacturerCode: '', supplierId: 0, initialStock: 0, initialWarehouseId: '' })

  useEffect(() => {
    loadProducts()
    loadWarehouses()
    loadCategories()
    loadUnits()
  }, [])

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.listWarehouses()
      setWarehouses(response.warehouses)
      // Seleccionar el primer almacén por defecto
      if (response.warehouses.length > 0) {
        setSelectedWarehouse(String(response.warehouses[0].id))
      }
    } catch (err) {
      console.error('Error al cargar almacenes:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await categoriesService.list({ limit: 100 })
      setCategories(response.categories)
    } catch (err) {
      console.error('Error al cargar categorías:', err)
    }
  }

  const loadUnits = async () => {
    try {
      const response = await unitsService.list()
      setUnits(response)
      // Seleccionar la primera unidad por defecto si existe
      if (response.length > 0) {
        setForm(prev => ({ ...prev, unitId: response[0].id }))
      }
    } catch (err) {
      console.error('Error al cargar unidades:', err)
    }
  }

  const loadProducts = async (search?: string) => {
    try {
      setLoading(true)
      const params: any = { page: 1, limit: 100 }
      if (search) {
        params.search = search
      }
      const response = await productsService.list(params)
      setData(response.products)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    loadProducts(value)
  }

  const columns: Column<Product>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'unit', label: 'Unidad', render: (item) => <span>{item.unit?.name || '-'}</span> },
    { key: 'costPrice', label: 'Costo', render: (item) => <span>Bs {(item.costPrice || 0).toLocaleString()}</span> },
    { key: 'salePrice', label: 'Venta', render: (item) => <span className="font-semibold">Bs {(item.salePrice || 0).toLocaleString()}</span> },
    { key: 'minStock', label: 'Stock Mín.', sortable: true },
  ]

  const openAdd = () => { 
    setEditing(null); 
    const defaultUnitId = units.length > 0 ? units[0].id : '';
    const defaultWarehouseId = warehouses.length > 0 ? String(warehouses[0].id) : '';
    setForm({ name: '', sku: '', description: '', categoryId: 0, unitId: defaultUnitId, costPrice: 0, salePrice: 0, minStock: 0, brand: '', origin: '', manufacturerCode: '', supplierId: 0, initialStock: 0, initialWarehouseId: defaultWarehouseId }); 
    setModalOpen(true) 
  }
  
  const openEdit = (item: Product) => { 
    setEditing(item); 
    setForm({ 
      name: item.name, 
      sku: item.sku, 
      description: item.description || '', 
      categoryId: item.categoryId, 
      unitId: item.unitId, 
      costPrice: item.costPrice, 
      salePrice: item.salePrice, 
      minStock: item.minStock,
      brand: (item as any).brand || '',
      origin: (item as any).origin || '',
      manufacturerCode: (item as any).manufacturerCode || '',
      supplierId: (item as any).supplierId || 0,
      initialStock: 0,
      initialWarehouseId: ''
    }); 
    setModalOpen(true) 
  }
  
  const openDelete = (item: Product) => { setDeleting(item); setDeleteOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        await productsService.update(String(editing.id), form)
        toast.success('Producto actualizado exitosamente')
      } else {
        // Crear el producto
        const newProduct = await productsService.create(form)
        
        // Si hay stock inicial, crear movimiento de inventario
        if (form.initialStock > 0 && form.initialWarehouseId) {
          await inventoryService.createMovement({
            productId: Number(newProduct.id),
            warehouseId: Number(form.initialWarehouseId),
            type: 'INGRESO',
            reason: 'COMPRA',
            quantity: form.initialStock,
            notes: 'Stock inicial del producto'
          })
          toast.success(`Producto creado con ${form.initialStock} unidades en stock`)
        } else {
          toast.success('Producto creado exitosamente')
        }
      }
      await loadProducts()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar producto')
      toast.error(err instanceof Error ? err.message : 'Error al guardar producto')
    }
  }

  const handleDelete = async () => { 
    if (deleting) { 
      try {
        await productsService.delete(String(deleting.id))
        await loadProducts()
        setDeleteOpen(false)
        setDeleting(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar producto')
      }
    } 
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await excelService.downloadProductsTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla_productos.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar plantilla')
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setImportResult(null)
      setPreviewData(null)
      setShowPreview(false)
      setCategoryMappings([])
      setError(null)
    }
  }

  const handlePreview = async () => {
    if (!selectedFile) {
      toast.warning('Archivo requerido', 'Por favor selecciona un archivo Excel para previsualizar')
      return
    }

    if (!selectedWarehouse) {
      toast.warning('Almacén requerido', 'Por favor selecciona un almacén destino antes de continuar')
      return
    }

    try {
      setImporting(true)
      const preview = await excelService.previewProductsImport(selectedFile, selectedWarehouse)
      
      // DEBUG: Ver qué devuelve el backend
      console.log('🔍 RESPUESTA COMPLETA DEL BACKEND:', JSON.stringify(preview, null, 2))
      console.log('🔑 Claves del objeto:', Object.keys(preview))
      console.log('📊 Total rows:', preview.totalRows)
      console.log('✅ Valid rows:', preview.validRows)
      console.log('❌ Invalid rows:', preview.invalidRows)
      console.log('📦 Preview array length:', preview.preview?.length)
      
      // Validar y normalizar la respuesta del backend
      const backendResponse = preview as any;
      const totalProducts = backendResponse.totalProducts || 0;
      const products = backendResponse.products || [];
      
      const normalizedPreview: ExcelPreviewResponse = {
        totalRows: totalProducts,
        validRows: products.length, // Todos los productos devueltos son válidos
        invalidRows: 0, // El backend no devuelve inválidos en el preview
        unknownCategories: (backendResponse.categories?.new || []).map((cat: any) => cat.name || cat),
        existingCategories: (backendResponse.categories?.existing || []).map((cat: any) => ({
          excelName: cat.name,
          categoryId: parseInt(cat.id),
          categoryName: cat.name
        })),
        preview: products.map((p: any) => ({
          row: p.row,
          sku: p.sku,
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          status: 'valid' as const,
          errors: []
        }))
      }
      
      console.log('✨ Preview normalizado:', normalizedPreview)
      
      setPreviewData(normalizedPreview)
      setShowPreview(true)
      
      // Inicializar mappings vacíos para categorías desconocidas
      const initialMappings: CategoryMapping[] = normalizedPreview.unknownCategories.map(cat => ({
        excelName: cat,
        categoryId: 0
      }))
      setCategoryMappings(initialMappings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al previsualizar importación')
      setShowPreview(false)
      setPreviewData(null)
    } finally {
      setImporting(false)
    }
  }

  const updateCategoryMapping = (excelName: string, categoryId: number) => {
    setCategoryMappings(prev => {
      const existing = prev.find(m => m.excelName === excelName)
      if (existing) {
        return prev.map(m => m.excelName === excelName ? { ...m, categoryId } : m)
      }
      return [...prev, { excelName, categoryId }]
    })
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.warning('Archivo requerido', 'Por favor selecciona un archivo Excel para importar')
      return
    }

    if (!selectedWarehouse) {
      toast.warning('Almacén requerido', 'Por favor selecciona un almacén destino antes de continuar')
      return
    }

    // Validar que todas las categorías desconocidas tengan un mapeo (solo si hay preview válido)
    if (previewData && previewData.totalRows > 0 && previewData.unknownCategories.length > 0) {
      const unmappedCategories = categoryMappings.filter(m => m.categoryId === 0)
      if (unmappedCategories.length > 0) {
        toast.warning('Categorías sin mapear', `Por favor mapea todas las categorías desconocidas:\n${unmappedCategories.map(m => m.excelName).join(', ')}`)
        return
      }
    }

    try {
      setImporting(true)
      setError(null)
      
      // Enviar solo los mappings válidos (categoryId > 0)
      const validMappings = categoryMappings.filter(m => m.categoryId > 0)
      const result = await excelService.importProductsClient(
        selectedFile, 
        selectedWarehouse,
        validMappings.length > 0 ? validMappings : undefined
      )
      
      console.log('✅ RESULTADO DE IMPORTACIÓN:', result)
      
      setImportResult(result)
      await loadProducts()
      
      // Mostrar mensaje de éxito más visible
      const warehouseName = warehouses.find(w => String(w.id) === selectedWarehouse)?.name || 'el almacén seleccionado'
      const totalImported = result.created || result.updated || result.results?.success || 0
      
      if (totalImported > 0) {
        toast.success(
          'Importación exitosa',
          `${totalImported} productos fueron importados correctamente.\n\nAlmacén destino: ${warehouseName}\n\nVerifica el inventario en la sección de Almacenes para confirmar el stock.`
        )
      } else if (result.errors && result.errors.length > 0) {
        toast.warning('Importación con errores', 'Revisa los detalles en el modal para ver los errores encontrados.')
      }
      
      setSelectedFile(null)
      setPreviewData(null)
      setShowPreview(false)
      setCategoryMappings([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar productos')
      setImportResult(null)
    } finally {
      setImporting(false)
    }
  }

  const openImportModal = () => {
    setImportResult(null)
    setSelectedFile(null)
    setPreviewData(null)
    setShowPreview(false)
    setCategoryMappings([])
    setProductCategoryCorrections({})
    setPreviewPage(1)
    setError(null)
    setImportModalOpen(true)
  }

  const updateProductCategory = (rowIndex: number, categoryId: number) => {
    setProductCategoryCorrections(prev => ({
      ...prev,
      [rowIndex]: categoryId
    }))
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <>
      <DataTable 
        title="Productos" 
        columns={columns} 
        data={data} 
        onAdd={openAdd} 
        onEdit={openEdit} 
        onDelete={openDelete} 
        addLabel="Nuevo Producto"
        customActions={
          <div className="flex gap-2 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por SKU o nombre..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={18} />
              Descargar Plantilla
            </button>
            <button
              onClick={openImportModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload size={18} />
              Importar Excel
            </button>
          </div>
        }
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="prod_name" className="label">Nombre *</label>
            <input 
              id="prod_name" 
              className="input" 
              value={form.name} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} 
              required
            />
          </div>
          <div>
            <label htmlFor="prod_sku" className="label">SKU *</label>
            <input 
              id="prod_sku" 
              className="input" 
              value={form.sku} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, sku: e.target.value })} 
              required
            />
          </div>
          <div>
            <label htmlFor="prod_unit" className="label">Unidad *</label>
            <select
              id="prod_unit"
              className="input"
              value={form.unitId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, unitId: e.target.value })}
              required
            >
              <option value="">Seleccione una unidad</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prod_category" className="label">Categoría *</label>
            <select
              id="prod_category"
              className="input"
              value={form.categoryId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, categoryId: Number(e.target.value) })}
              required
            >
              <option value="0">Seleccione una categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prod_minstock" className="label">Stock Mínimo</label>
            <input 
              id="prod_minstock" 
              className="input"
              min="0" 
              type="number" 
              value={form.minStock} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, minStock: Number(e.target.value) })} 
            />
          </div>
          <div>
            <label htmlFor="prod_cost" className="label">Precio Costo Bs.- </label>
            <input 
              id="prod_cost" 
              className="input" 
              type="number"
              min="0" 
              step="0.01"
              value={form.costPrice} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, costPrice: Number(e.target.value) })} 
            />
          </div>
          <div>
            <label htmlFor="prod_sale" className="label">Precio Venta</label>
            <input 
              id="prod_sale" 
              className="input"
              min="0" 
              type="number" 
              step="0.01"
              value={form.salePrice} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, salePrice: Number(e.target.value) })} 
            />
          </div>
          <div>
            <label htmlFor="prod_brand" className="label">Marca</label>
            <input 
              id="prod_brand" 
              className="input" 
              value={form.brand} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, brand: e.target.value })} 
            />
          </div>
          <div>
            <label htmlFor="prod_origin" className="label">Origen</label>
            <input 
              id="prod_origin" 
              className="input" 
              value={form.origin} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, origin: e.target.value })} 
            />
          </div>
          <div>
            <label htmlFor="prod_mfg_code" className="label">Código Fabricante</label>
            <input 
              id="prod_mfg_code" 
              className="input" 
              value={form.manufacturerCode} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, manufacturerCode: e.target.value })} 
            />
          </div>
          <div>
            <label htmlFor="prod_supplier" className="label">Proveedor</label>
            <input 
              id="prod_supplier" 
              className="input" 
              value={form.supplierId || ''} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, supplierId: Number(e.target.value) || 0 })} 
              placeholder="ID del proveedor" 
              type="number"
            />
          </div>
          {!editing && (
            <>
              <div>
                <label htmlFor="prod_warehouse" className="label">Almacén Inicial</label>
                <select
                  id="prod_warehouse"
                  className="input"
                  value={form.initialWarehouseId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, initialWarehouseId: e.target.value })}
                >
                  <option value="">Sin stock inicial</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prod_initial_stock" className="label">Stock Inicial</label>
                <input 
                  id="prod_initial_stock" 
                  className="input"
                  min="0" 
                  type="number" 
                  value={form.initialStock} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, initialStock: Number(e.target.value) })} 
                  placeholder="0"
                  disabled={!form.initialWarehouseId}
                />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="prod_desc" className="label">Descripción</label>
            <textarea 
              id="prod_desc" 
              className="input" 
              rows={2} 
              value={form.description} 
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} 
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleSave} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar Producto" message={`¿Está seguro de eliminar el producto "${deleting?.name}"?`} />
      
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Importar Productos desde Excel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Instrucciones:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Descarga la plantilla de Excel haciendo clic en "Descargar Plantilla"</li>
              <li>Llena la plantilla con los datos de los productos</li>
              <li><strong>Selecciona el almacén destino</strong> donde se asignará el stock</li>
              <li><strong>Opcional:</strong> Incluye columna de CANTIDAD para asignar stock inicial</li>
              <li>Guarda el archivo y súbelo aquí</li>
              <li>Los productos se crearán/actualizarán y se generarán movimientos de inventario automáticamente</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>Importante:</strong> El almacén seleccionado abajo será el destino de todos los productos importados. Si incluyes CANTIDAD en el Excel, el stock se asignará a este almacén.
              </div>
            </div>
          </div>

          {warehouses.length === 0 ? (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-red-900 mb-1">No hay almacenes disponibles</h5>
                  <p className="text-xs text-red-800 mb-3">
                    Para importar productos desde Excel, primero debes crear al menos un almacén en el sistema.
                  </p>
                  <p className="text-xs text-red-700">
                    Ve a <strong>Inventario → Almacenes</strong> y crea un almacén antes de continuar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="import-warehouse" className="label">Almacén Destino *</label>
              <select
                id="import-warehouse"
                value={selectedWarehouse}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedWarehouse(e.target.value)}
                className="input"
                required
              >
                <option value="">Seleccionar almacén...</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}{wh.location ? ` - ${wh.location}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Todos los productos importados se asignarán a este almacén
              </p>
            </div>
          )}

          <div>
            <label htmlFor="excel-file" className="label">Seleccionar archivo Excel</label>
            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={warehouses.length === 0}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">Archivo seleccionado: {selectedFile.name}</p>
            )}
            {warehouses.length === 0 && (
              <p className="mt-2 text-xs text-red-600">Debes crear un almacén antes de importar productos</p>
            )}
          </div>

          {error && !importResult && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-red-900 mb-1">Error al previsualizar</h5>
                  <p className="text-xs text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {selectedFile && !showPreview && !importResult && warehouses.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handlePreview}
                disabled={importing}
                className="btn-secondary flex items-center gap-2"
              >
                <Eye size={18} />
                {importing ? 'Previsualizando...' : 'Previsualizar Importación'}
              </button>
            </div>
          )}

          {showPreview && previewData && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye size={18} />
                Previsualización de Importación
              </h4>

              {previewData.totalRows === 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-yellow-900 mb-2">No se encontraron filas válidas</h5>
                      <p className="text-xs text-yellow-800 mb-2">
                        El archivo Excel no contiene datos válidos o el formato no es el esperado.
                      </p>
                      <p className="text-xs text-yellow-800">
                        Verifica que el archivo tenga datos en las filas y que las columnas estén correctamente nombradas.
                        Si el problema persiste, descarga la plantilla oficial e intenta nuevamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-gray-900">{previewData.totalRows}</div>
                  <div className="text-xs text-gray-600">Total Filas</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{previewData.validRows}</div>
                  <div className="text-xs text-green-700">Válidas</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{previewData.invalidRows}</div>
                  <div className="text-xs text-red-700">Inválidas</div>
                </div>
              </div>

              {previewData.unknownCategories.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Categorías Desconocidas - Requiere Mapeo
                  </h5>
                  <p className="text-xs text-yellow-800 mb-3">
                    Las siguientes categorías del Excel no existen en el sistema. Por favor, selecciona a qué categoría existente corresponde cada una:
                  </p>
                  <div className="space-y-3">
                    {previewData.unknownCategories.map(cat => (
                      <div key={cat} className="bg-white p-3 rounded border">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          "{cat}" del Excel → Mapear a:
                        </label>
                        <select
                          value={categoryMappings.find(m => m.excelName === cat)?.categoryId || 0}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => updateCategoryMapping(cat, Number(e.target.value))}
                          className="input w-full"
                          aria-label={`Mapear categoría ${cat}`}
                        >
                          <option value={0}>Seleccionar categoría...</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.existingCategories.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Categorías Reconocidas
                  </h5>
                  <div className="text-xs text-green-800 space-y-1">
                    {previewData.existingCategories.map((cat, idx) => (
                      <div key={idx}>
                        "{cat.excelName}" → {cat.categoryName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-semibold text-gray-900">
                    Vista Previa de Productos ({previewData.preview.length} total)
                  </h5>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
                      disabled={previewPage === 1}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
                    >
                      ← Anterior
                    </button>
                    <span className="text-xs text-gray-600">
                      Página {previewPage} de {Math.ceil(previewData.preview.length / 20)}
                    </span>
                    <button
                      onClick={() => setPreviewPage(Math.min(Math.ceil(previewData.preview.length / 20), previewPage + 1))}
                      disabled={previewPage >= Math.ceil(previewData.preview.length / 20)}
                      className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left">Fila</th>
                        <th className="px-2 py-2 text-left">SKU</th>
                        <th className="px-2 py-2 text-left">Nombre</th>
                        <th className="px-2 py-2 text-left">Categoría</th>
                        <th className="px-2 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                      {previewData.preview.slice((previewPage - 1) * 20, previewPage * 20).map((item, idx) => {
                        const globalIdx = (previewPage - 1) * 20 + idx;
                        const correctedCategoryId = productCategoryCorrections[globalIdx];
                        const correctedCategory = correctedCategoryId 
                          ? categories.find(c => c.id === correctedCategoryId)
                          : null;
                        
                        return (
                          <tr key={idx} className={item.status === 'invalid' ? 'bg-red-50' : item.status === 'unknown_category' ? 'bg-yellow-50' : correctedCategoryId ? 'bg-blue-50' : ''}>
                            <td className="px-2 py-2">{item.row}</td>
                            <td className="px-2 py-2 font-mono">{item.sku}</td>
                            <td className="px-2 py-2">{item.name}</td>
                            <td className="px-2 py-2">
                              <select
                                value={correctedCategoryId || 0}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateProductCategory(globalIdx, Number(e.target.value))}
                                className="text-xs border rounded px-1 py-0.5 w-full"
                                title={`Cambiar categoría de ${item.name}`}
                              >
                                <option value={0}>{item.category} (original)</option>
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              {correctedCategory && (
                                <span className="text-blue-600 text-xs block mt-0.5">
                                  ✓ Cambiado a: {correctedCategory.name}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {item.status === 'valid' && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Válido</span>}
                              {item.status === 'unknown_category' && <span className="text-yellow-600 flex items-center gap-1"><AlertCircle size={12} /> Cat. Desconocida</span>}
                              {item.status === 'invalid' && <span className="text-red-600 flex items-center gap-1"><XCircle size={12} /> Inválido</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {importResult && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Resultados de la Importación</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">
                    {importResult.total || (importResult.results?.total || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.created || importResult.updated || (importResult.results?.success || 0)}
                  </div>
                  <div className="text-xs text-green-700">Exitosos</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errors?.length || (importResult.results?.errors || 0)}
                  </div>
                  <div className="text-xs text-red-700">Errores</div>
                </div>
              </div>

              {importResult.success && importResult.success.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-green-900 mb-2">Productos importados exitosamente:</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.success.slice(0, 5).map((item: any, idx: number) => (
                      <div key={idx} className="text-xs text-green-700 bg-green-50 p-2 rounded">
                        Fila {item.row}: {item.sku} - {item.name} ({item.action === 'created' ? 'Creado' : 'Actualizado'})
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
                  <h5 className="text-sm font-semibold text-red-900 mb-2">Errores encontrados:</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((error: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                        Fila {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.results?.errorDetails && importResult.results.errorDetails.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-red-900 mb-2">Errores encontrados:</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.results.errorDetails.map((error: any, idx: number) => (
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
              onClick={() => setImportModalOpen(false)}
              className="btn-secondary"
            >
              Cerrar
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || importing || warehouses.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
