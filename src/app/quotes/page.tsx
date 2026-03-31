'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PaymentTermsManager } from '@/components/quotes/PaymentTermsManager'
import { PaymentTermsDisplay } from '@/components/quotes/PaymentTermsDisplay'
import { quotesService, clientsService, inventoryService, productsService } from '@/lib/services'
import type { Quote, Client, QuoteItem, CostType, Warehouse } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import { Plus, Trash2, ChevronDown, ChevronUp, FileDown, CheckCircle } from 'lucide-react'
import { generateQuotePDF } from '@/lib/utils/pdf-generator'

const statusColors: Record<string, string> = {
  PENDIENTE: 'badge-gray',
  ENVIADA: 'badge-blue',
  APROBADA: 'badge-green',
  RECHAZADA: 'badge-red',
  VENCIDA: 'badge-yellow',
}

const costTypeLabels: Record<CostType, string> = {
  MANO_DE_OBRA: 'Mano de Obra',
  TRANSPORTE: 'Transporte',
  ACCESORIOS: 'Accesorios',
  MATERIAL: 'Material',
}

interface FormItem {
  description: string
  productId?: string
  quantity: number
  unitPrice: number
  unitPriceBase?: number
  discount: number
  sortOrder: number
  details: string[]
  hiddenCosts: {
    costType: CostType
    description: string
    quantity: number
    unitCost: number
  }[]
}

export default function QuotesPageNew() {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [viewing, setViewing] = useState<Quote | null>(null)
  const [deleting, setDeleting] = useState<Quote | null>(null)
  const [approving, setApproving] = useState<Quote | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [stockWarnings, setStockWarnings] = useState<{[key: number]: {available: number, required: number, productName: string}}>({})
  const [filterQuoteType, setFilterQuoteType] = useState<'ALL' | 'PRODUCTOS' | 'SERVICIOS'>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const [form, setForm] = useState<{
    quoteType: 'PRODUCTOS' | 'SERVICIOS'
    clientId: string
    version: number
    paymentType: 'CONTADO' | 'CREDITO'
    cashPaymentPercentage: number
    paymentDescription: string
    validUntil: string
    discountPercent: number
    observations: string
    termsConditions: string
    deliveryTime: string
    generalDescription: string
    responsibleName: string
    responsiblePosition: string
    responsiblePhone: string
    responsibleEmail: string
    salesExecutive: string
    items: FormItem[]
    paymentTerms: {
      installmentNumber: number
      percentage: number
      daysAfterIssue: number
      description: string
    }[]
  }>({
    quoteType: 'SERVICIOS',
    clientId: '',
    version: 1,
    paymentType: 'CONTADO',
    cashPaymentPercentage: 0,
    paymentDescription: '',
    validUntil: '',
    discountPercent: 0,
    observations: '',
    termsConditions: '',
    deliveryTime: '',
    generalDescription: '',
    responsibleName: '',
    responsiblePosition: '',
    responsiblePhone: '',
    responsibleEmail: '',
    salesExecutive: '',
    items: [],
    paymentTerms: []
  })

  const isAdmin = user?.userRoles?.some((ur: any) => ur.role.name === 'Administrador')

  useEffect(() => {
    loadData()
    loadWarehouses()
    loadProducts()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [quotesResponse, clientsResponse] = await Promise.all([
        quotesService.list(),
        clientsService.list()
      ])
      setData(quotesResponse.quotes || [])
      setClients(clientsResponse.clients || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.listWarehouses()
      setWarehouses(response.warehouses || [])
    } catch (err) {
      console.error('Error al cargar almacenes:', err)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productsService.list({ limit: 1000 })
      setProducts(response.products || [])
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const columns: Column<Quote>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'quoteNumber', label: 'Número', sortable: true },
    { 
      key: 'quoteType', 
      label: 'Tipo',
      render: (item) => (
        <span className={item.quoteType === 'SERVICIOS' ? 'badge-purple' : 'badge-blue'}>
          {item.quoteType || 'PRODUCTOS'}
        </span>
      )
    },
    { key: 'client', label: 'Cliente', render: (item) => <span>{item.client?.name || '-'}</span> },
    { 
      key: 'creator', 
      label: 'Vendedor', 
      render: (item) => (
        <span className="text-sm text-gray-700">
          {item.creator?.fullName || item.creator?.username || '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (item) => (
        <span className={statusColors[item.status] || 'badge-gray'}>
          {item.status}
        </span>
      )
    },
    {
      key: 'paymentType',
      label: 'Pago',
      render: (item) => <span className="badge-blue">{item.paymentType}</span>
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (item) => (
        <span className="font-semibold">
          Bs {(item.grandTotal || item.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { key: 'validUntil', label: 'Válida hasta' },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              generateQuotePDF({ quote: item });
            }}
            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            title="Descargar PDF"
          >
            <FileDown size={14} />
            PDF
          </button>
          {item.status !== 'APROBADA' && item.status !== 'RECHAZADA' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openApprove(item);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              title="Aprobar Cotización"
            >
              <CheckCircle size={14} />
              Aprobar
            </button>
          )}
        </div>
      )
    }
  ]

  const openAdd = () => {
    setEditing(null)
    setForm({
      quoteType: 'SERVICIOS',
      clientId: '',
      version: 1,
      paymentType: 'CONTADO',
      cashPaymentPercentage: 0,
      paymentDescription: '',
      validUntil: '',
      discountPercent: 0,
      observations: '',
      termsConditions: '',
      deliveryTime: '',
      generalDescription: '',
      responsibleName: '',
      responsiblePosition: '',
      responsiblePhone: '',
      responsibleEmail: '',
      salesExecutive: '',
      items: [],
      paymentTerms: []
    })
    setModalOpen(true)
  }

  const openEdit = (item: Quote) => {
    if (!isAdmin) {
      openView(item)
      return
    }
    setEditing(item)
    setForm({
      quoteType: item.quoteType || 'PRODUCTOS',
      clientId: String(item.clientId),
      version: item.version || 1,
      paymentType: item.paymentType,
      cashPaymentPercentage: item.cashPaymentPercentage || 0,
      paymentDescription: item.observations || '',
      validUntil: item.validUntil,
      discountPercent: item.discountPercent || 0,
      observations: item.observations || '',
      termsConditions: item.termsConditions || '',
      deliveryTime: item.deliveryTime || '',
      generalDescription: item.generalDescription || '',
      responsibleName: item.responsibleName || '',
      responsiblePosition: item.responsiblePosition || '',
      responsiblePhone: item.responsiblePhone || '',
      responsibleEmail: item.responsibleEmail || '',
      salesExecutive: item.salesExecutive || '',
      items: (item.items || []).map((i: any) => ({
        description: i.description,
        productId: i.productId ? String(i.productId) : undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unitPriceBase: i.unitPriceBase,
        discount: i.discount || 0,
        sortOrder: i.sortOrder || 0,
        details: (i.details || []).map((d: any) => typeof d === 'string' ? d : d.description),
        hiddenCosts: (i.hiddenCosts || []).map((hc: any) => ({
          costType: hc.costType,
          description: hc.description,
          quantity: hc.quantity,
          unitCost: hc.unitCost
        }))
      })),
      paymentTerms: (item.paymentTerms || []).map((pt: any) => ({
        installmentNumber: pt.installmentNumber,
        percentage: pt.percentage,
        daysAfterIssue: pt.daysAfterIssue,
        description: pt.description || ''
      }))
    })
    setModalOpen(true)
  }

  const openView = (item: Quote) => {
    setViewing(item)
    setViewModalOpen(true)
  }

  const openDelete = (item: Quote) => {
    setDeleting(item)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    try {
      // Validar descripción de pago para cotizaciones a crédito
      if (form.paymentType === 'CREDITO' && !form.paymentDescription.trim()) {
        toast.error('Error', 'Debe describir cómo pagará el cliente para cotizaciones a crédito')
        return
      }

      // Validar términos de pago para cotizaciones a crédito (personalizado)
      if (form.paymentType === 'CREDITO') {
        if (form.paymentTerms.length === 0) {
          toast.error('Error', 'Debe agregar al menos un término de pago para cotizaciones a crédito')
          return
        }
        
        const totalPercentage = form.paymentTerms.reduce((sum, term) => sum + term.percentage, 0)
        if (Math.abs(totalPercentage - 100) > 0.01) {
          toast.error('Error', `Los porcentajes de los términos de pago deben sumar 100% (actualmente: ${totalPercentage.toFixed(2)}%)`)
          return
        }
      }

      const quoteData = {
        ...form,
        clientId: Number(form.clientId),
        items: form.items.map((item: any, idx: number) => ({
          ...item,
          itemType: form.quoteType === 'SERVICIOS' ? 'SERVICE' as const : 'PRODUCT' as const,
          sortOrder: idx + 1,
          details: item.details.filter((d: string) => d.trim() !== '')
        })),
        // Solo incluir paymentTerms si es a crédito
        paymentTerms: form.paymentType === 'CREDITO' ? form.paymentTerms : undefined
      }

      if (editing) {
        await quotesService.update(editing.id, quoteData)
        toast.success('Actualizado', 'Cotización actualizada correctamente')
      } else {
        await quotesService.create(quoteData)
        toast.success('Creado', 'Cotización creada correctamente')
      }

      await loadData()
      setModalOpen(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar cotización'
      setError(errorMsg)
      toast.error('Error', errorMsg)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await quotesService.delete(deleting.id)
      await loadData()
      setDeleteOpen(false)
      setDeleting(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cotización')
    }
  }

  const openApprove = (item: Quote) => {
    setApproving(item)
    // Si el usuario tiene un almacén asignado, usarlo automáticamente
    const userWarehouseId = user?.warehouseId ? String(user.warehouseId) : ''
    setSelectedWarehouse(userWarehouseId)
    setApproveModalOpen(true)
  }

  const handleApprove = async () => {
    if (!approving) {
      setError('No hay cotización seleccionada')
      return
    }

    // Usar el almacén del usuario si está disponible, sino el seleccionado manualmente
    const warehouseToUse = user?.warehouseId ? String(user.warehouseId) : selectedWarehouse
    
    if (!warehouseToUse) {
      setError('Debe seleccionar un almacén o tener uno asignado')
      return
    }
    
    try {
      const response = await quotesService.approve(approving.id, {
        status: 'APROBADA',
        warehouseId: warehouseToUse
      })
      
      await loadData()
      setApproveModalOpen(false)
      setApproving(null)
      setSelectedWarehouse('')
      
      const movementsCount = response.inventoryMovements?.length || 0
      const warehouseName = warehouses.find(w => String(w.id) === String(warehouseToUse))?.name || 'el almacén'
      
      toast.success(
        'Cotización aprobada',
        movementsCount > 0 
          ? `Se redujeron ${movementsCount} productos del inventario en ${warehouseName}`
          : `La cotización fue aprobada exitosamente`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar cotización')
      toast.error('Error al aprobar', err instanceof Error ? err.message : 'Error al aprobar cotización')
    }
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          sortOrder: form.items.length + 1,
          details: [],
          hiddenCosts: []
        }
      ]
    })
  }

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_: any, i: number) => i !== index)
    })
  }

  const updateItem = async (index: number, field: keyof FormItem, value: any) => {
    const updatedItems = [...form.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setForm({ ...form, items: updatedItems })
    
    // Verificar stock si es un producto y se está cambiando productId o quantity
    if (form.quoteType === 'PRODUCTOS' && (field === 'productId' || field === 'quantity')) {
      const item = updatedItems[index]
      const productId = field === 'productId' ? value : item.productId
      const quantity = field === 'quantity' ? value : item.quantity
      
      if (productId && quantity > 0) {
        try {
          const stockData = await productsService.getStock(String(productId))
          const totalStock = stockData.totalStock || 0
          
          if (quantity > totalStock) {
            setStockWarnings(prev => ({
              ...prev,
              [index]: {
                available: totalStock,
                required: quantity,
                productName: stockData.productName
              }
            }))
          } else {
            setStockWarnings(prev => {
              const newWarnings = { ...prev }
              delete newWarnings[index]
              return newWarnings
            })
          }
        } catch (err) {
          console.error('Error al verificar stock:', err)
        }
      }
    }
  }

  const addItemDetail = (itemIndex: number) => {
    const updatedItems = [...form.items]
    updatedItems[itemIndex].details.push('')
    setForm({ ...form, items: updatedItems })
  }

  const updateItemDetail = (itemIndex: number, detailIndex: number, value: string) => {
    const updatedItems = [...form.items]
    updatedItems[itemIndex].details[detailIndex] = value
    setForm({ ...form, items: updatedItems })
  }

  const removeItemDetail = (itemIndex: number, detailIndex: number) => {
    const updatedItems = [...form.items]
    updatedItems[itemIndex].details = updatedItems[itemIndex].details.filter((_: any, i: number) => i !== detailIndex)
    setForm({ ...form, items: updatedItems })
  }

  const addHiddenCost = (itemIndex: number) => {
    const updatedItems = [...form.items]
    updatedItems[itemIndex].hiddenCosts.push({
      costType: 'MANO_DE_OBRA',
      description: '',
      quantity: 1,
      unitCost: 0
    })
    setForm({ ...form, items: updatedItems })
  }

  const updateHiddenCost = (itemIndex: number, costIndex: number, field: string, value: any) => {
    const updatedItems = [...form.items]
    updatedItems[itemIndex].hiddenCosts[costIndex] = {
      ...updatedItems[itemIndex].hiddenCosts[costIndex],
      [field]: value
    }
    setForm({ ...form, items: updatedItems })
  }

  const removeHiddenCost = (itemIndex: number, costIndex: number) => {
    const updatedItems = [...form.items]
    updatedItems[itemIndex].hiddenCosts = updatedItems[itemIndex].hiddenCosts.filter((_: any, i: number) => i !== costIndex)
    setForm({ ...form, items: updatedItems })
  }

  const toggleItemExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const calculateItemTotal = (item: FormItem): number => {
    const baseTotal = item.quantity * item.unitPrice
    const discountAmount = baseTotal * (item.discount / 100)
    return baseTotal - discountAmount
  }

  const calculateSubtotal = (): number => {
    return form.items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  const calculateGrandTotal = (): number => {
    const subtotal = calculateSubtotal()
    const discountAmount = subtotal * (form.discountPercent / 100)
    return subtotal - discountAmount
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  const filteredData = data.filter((quote: Quote) => {
    if (filterQuoteType !== 'ALL' && quote.quoteType !== filterQuoteType) return false
    if (filterStatus !== 'ALL' && quote.status !== filterStatus) return false
    return true
  })

  return (
    <>
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label htmlFor="filter_quote_type" className="label text-xs">Tipo de Cotización</label>
          <select
            id="filter_quote_type"
            value={filterQuoteType}
            onChange={(e) => setFilterQuoteType(e.target.value as 'ALL' | 'PRODUCTOS' | 'SERVICIOS')}
            className="input"
          >
            <option value="ALL">Todas</option>
            <option value="PRODUCTOS">Productos</option>
            <option value="SERVICIOS">Servicios</option>
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="filter_status" className="label text-xs">Estado</label>
          <select
            id="filter_status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="ALL">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ENVIADA">Enviada</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
            <option value="VENCIDA">Vencida</option>
          </select>
        </div>
      </div>

      <DataTable
        title="Cotizaciones"
        columns={columns}
        data={filteredData}
        onAdd={isAdmin ? openAdd : undefined}
        onEdit={openEdit}
        onDelete={isAdmin ? openDelete : undefined}
        addLabel="Nueva Cotización"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Cotización' : 'Nueva Cotización'}
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Tipo de Cotización */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="quote_type" className="label">Tipo de Cotización *</label>
              <select
                id="quote_type"
                className="input"
                value={form.quoteType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, quoteType: e.target.value as 'PRODUCTOS' | 'SERVICIOS' })}
              >
                <option value="SERVICIOS">Servicios</option>
                <option value="PRODUCTOS">Productos</option>
              </select>
            </div>

            <div>
              <label htmlFor="quote_version" className="label">Versión</label>
              <input
                id="quote_version"
                type="number"
                min="1"
                className="input"
                value={form.version}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, version: Number(e.target.value) })}
              />
            </div>

            <div>
              <label htmlFor="quote_client" className="label">Cliente *</label>
              <select
                id="quote_client"
                className="input"
                value={form.clientId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, clientId: e.target.value })}
              >
                <option value="">— Seleccionar cliente —</option>
                {clients.map((c: Client) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="quote_payment" className="label">Forma de Pago *</label>
              <select
                id="quote_payment"
                className="input"
                value={form.paymentType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, paymentType: e.target.value as 'CONTADO' | 'CREDITO' })}
              >
                <option value="CONTADO">Contado</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>

            {form.paymentType === 'CONTADO' && (
              <div>
                <label htmlFor="quote_cash_percentage" className="label">Descuento por Pago al Contado (%)</label>
                <input
                  id="quote_cash_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="input"
                  placeholder="ej: 5.00"
                  value={form.cashPaymentPercentage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, cashPaymentPercentage: Number(e.target.value) })}
                />
              </div>
            )}

            {form.paymentType === 'CREDITO' && (
              <>
                <div className="sm:col-span-2">
                  <label htmlFor="quote_payment_description" className="label">Descripción del Pago a Crédito *</label>
                  <textarea
                    id="quote_payment_description"
                    className="input"
                    rows={3}
                    value={form.paymentDescription}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, paymentDescription: e.target.value })}
                    placeholder="Describe cómo pagará el cliente (ej: Transferencia bancaria mensual, cheques, etc.)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Especifica la forma en que el cliente realizará los pagos a crédito
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <PaymentTermsManager
                    paymentTerms={form.paymentTerms}
                    onChange={(terms) => setForm({ ...form, paymentTerms: terms })}
                    grandTotal={calculateGrandTotal()}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="quote_valid" className="label">Válida hasta *</label>
              <input
                id="quote_valid"
                type="date"
                className="input"
                value={form.validUntil}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="quote_discount" className="label">Descuento Global (%)</label>
              <input
                id="quote_discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="input"
                value={form.discountPercent}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, discountPercent: Number(e.target.value) })}
              />
            </div>

            <div>
              <label htmlFor="quote_delivery" className="label">Tiempo de Entrega</label>
              <input
                id="quote_delivery"
                type="text"
                className="input"
                placeholder="ej: 1 Día, 3-5 días hábiles"
                value={form.deliveryTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, deliveryTime: e.target.value })}
              />
            </div>
          </div>

          {/* Información del Responsable */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Información del Responsable</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="resp_name" className="label">Nombre del Responsable</label>
                <input
                  id="resp_name"
                  type="text"
                  className="input"
                  value={form.responsibleName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, responsibleName: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="resp_position" className="label">Cargo</label>
                <input
                  id="resp_position"
                  type="text"
                  className="input"
                  value={form.responsiblePosition}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, responsiblePosition: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="resp_phone" className="label">Teléfono</label>
                <input
                  id="resp_phone"
                  type="text"
                  className="input"
                  value={form.responsiblePhone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, responsiblePhone: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="resp_email" className="label">Email</label>
                <input
                  id="resp_email"
                  type="email"
                  className="input"
                  value={form.responsibleEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, responsibleEmail: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="sales_exec" className="label">Ejecutivo de Ventas</label>
                <input
                  id="sales_exec"
                  type="text"
                  className="input"
                  value={form.salesExecutive}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, salesExecutive: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Descripciones y Notas */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Descripciones y Observaciones</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="general_desc" className="label">Descripción General</label>
                <textarea
                  id="general_desc"
                  rows={2}
                  className="input"
                  value={form.generalDescription}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, generalDescription: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="observations" className="label">Observaciones (ej: monto en letras)</label>
                <textarea
                  id="observations"
                  rows={2}
                  className="input"
                  placeholder="Ochenta y ocho Bolivianos con Noventa y cinco Centavos"
                  value={form.observations}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, observations: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="terms" className="label">Términos y Condiciones</label>
                <textarea
                  id="terms"
                  rows={3}
                  className="input"
                  value={form.termsConditions}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, termsConditions: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                {form.quoteType === 'SERVICIOS' ? 'Servicios' : 'Productos'}
              </h3>
              <button type="button" onClick={addItem} className="btn-primary text-sm">
                <Plus size={16} /> Agregar Ítem
              </button>
            </div>

            {form.items.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">No hay ítems agregados</p>
                <p className="text-xs mt-1">Haga clic en "Agregar Ítem" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.items.map((item: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">ÍTEM #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => toggleItemExpanded(idx)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedItems.has(idx) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                        aria-label="Eliminar ítem"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      {form.quoteType === 'PRODUCTOS' && (
                        <div className="sm:col-span-6">
                          <label htmlFor={`item_product_${idx}`} className="label text-xs">Producto *</label>
                          <select
                            id={`item_product_${idx}`}
                            className="input"
                            value={item.productId || ''}
                            onChange={async (e: ChangeEvent<HTMLSelectElement>) => {
                              const productId = e.target.value
                              const selectedProduct = products.find(p => String(p.id) === productId)
                              
                              // Actualizar todos los campos del item
                              const updatedItems = [...form.items]
                              updatedItems[idx] = {
                                ...updatedItems[idx],
                                productId: productId,
                                description: selectedProduct?.name || '',
                                unitPrice: selectedProduct?.salePrice || 0
                              }
                              setForm({ ...form, items: updatedItems })
                              
                              // Verificar stock
                              if (productId && updatedItems[idx].quantity > 0) {
                                try {
                                  const stockData = await productsService.getStock(String(productId))
                                  const totalStock = stockData.totalStock || 0
                                  
                                  if (updatedItems[idx].quantity > totalStock) {
                                    setStockWarnings(prev => ({
                                      ...prev,
                                      [idx]: {
                                        available: totalStock,
                                        required: updatedItems[idx].quantity,
                                        productName: stockData.productName
                                      }
                                    }))
                                  } else {
                                    setStockWarnings(prev => {
                                      const newWarnings = { ...prev }
                                      delete newWarnings[idx]
                                      return newWarnings
                                    })
                                  }
                                } catch (err) {
                                  console.error('Error al verificar stock:', err)
                                }
                              }
                            }}
                          >
                            <option value="">— Seleccionar producto —</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {product.sku}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className={form.quoteType === 'PRODUCTOS' ? 'sm:col-span-6' : 'sm:col-span-6'}>
                        <label htmlFor={`item_desc_${idx}`} className="label text-xs">Descripción *</label>
                        <input
                          id={`item_desc_${idx}`}
                          type="text"
                          className="input"
                          value={item.description}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(idx, 'description', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor={`item_qty_${idx}`} className="label text-xs">Cantidad *</label>
                        <input
                          id={`item_qty_${idx}`}
                          type="number"
                          min="1"
                          step="0.01"
                          className={`input ${stockWarnings[idx] ? 'border-red-500' : ''}`}
                          value={item.quantity}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(idx, 'quantity', Number(e.target.value))}
                        />
                        {stockWarnings[idx] && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ Stock insuficiente: Solo hay {stockWarnings[idx].available} disponibles
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor={`item_price_${idx}`} className="label text-xs">Precio Unit. *</label>
                        <input
                          id={`item_price_${idx}`}
                          type="number"
                          min="0"
                          step="0.01"
                          className="input"
                          value={item.unitPrice}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor={`item_disc_${idx}`} className="label text-xs">Desc. (%)</label>
                        <input
                          id={`item_disc_${idx}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="input"
                          value={item.discount}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(idx, 'discount', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <span className="text-sm font-semibold text-gray-700">
                        Subtotal: Bs {calculateItemTotal(item).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Detalles y Costos Ocultos (expandible) */}
                    {expandedItems.has(idx) && (
                      <div className="border-t pt-3 space-y-3">
                        {/* Detalles del Item */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="label text-xs">Detalles del {form.quoteType === 'SERVICIOS' ? 'Servicio' : 'Producto'}</label>
                            <button
                              type="button"
                              onClick={() => addItemDetail(idx)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              + Agregar detalle
                            </button>
                          </div>
                          {item.details.map((detail: string, detailIdx: number) => (
                            <div key={detailIdx} className="flex gap-2 mb-2">
                              <input
                                id={`item-${idx}-detail-${detailIdx}`}
                                type="text"
                                className="input text-sm"
                                placeholder="ej: Instalación incluida, Garantía de 1 año"
                                value={detail}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateItemDetail(idx, detailIdx, e.target.value)}
                                aria-label="Detalle del ítem"
                              />
                              <button
                                type="button"
                                onClick={() => removeItemDetail(idx, detailIdx)}
                                className="p-2 text-red-400 hover:text-red-600"
                                aria-label="Eliminar detalle"
                                title="Eliminar detalle"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Costos Ocultos */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="label text-xs">Costos Ocultos (internos)</label>
                            <button
                              type="button"
                              onClick={() => addHiddenCost(idx)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              + Agregar costo
                            </button>
                          </div>
                          {item.hiddenCosts.map((cost: any, costIdx: number) => (
                            <div key={costIdx} className="grid grid-cols-12 gap-2 mb-2">
                              <div className="col-span-3">
                                <select
                                  id={`item-${idx}-cost-${costIdx}-type`}
                                  className="input text-xs"
                                  value={cost.costType}
                                  onChange={(e: ChangeEvent<HTMLSelectElement>) => updateHiddenCost(idx, costIdx, 'costType', e.target.value)}
                                  aria-label="Tipo de costo"
                                >
                                  {Object.entries(costTypeLabels).map(([value, label]: [string, string]) => (
                                    <option key={value} value={value}>{label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-4">
                                <input
                                  id={`item-${idx}-cost-${costIdx}-desc`}
                                  type="text"
                                  className="input text-xs"
                                  placeholder="Descripción"
                                  value={cost.description}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateHiddenCost(idx, costIdx, 'description', e.target.value)}
                                  aria-label="Descripción del costo"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  id={`item-${idx}-cost-${costIdx}-qty`}
                                  type="number"
                                  min="1"
                                  className="input text-xs"
                                  placeholder="Cant."
                                  value={cost.quantity}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateHiddenCost(idx, costIdx, 'quantity', Number(e.target.value))}
                                  aria-label="Cantidad"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  id={`item-${idx}-cost-${costIdx}-unit`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="input text-xs"
                                  placeholder="Costo"
                                  value={cost.unitCost}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateHiddenCost(idx, costIdx, 'unitCost', Number(e.target.value))}
                                  aria-label="Costo unitario"
                                />
                              </div>
                              <div className="col-span-1">
                                <button
                                  type="button"
                                  onClick={() => removeHiddenCost(idx, costIdx)}
                                  className="p-2 text-red-400 hover:text-red-600"
                                  aria-label="Eliminar costo"
                                  title="Eliminar costo"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          {form.items.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">Bs {calculateSubtotal().toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {form.discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento ({form.discountPercent}%):</span>
                      <span className="font-medium">- Bs {(calculateSubtotal() * form.discountPercent / 100).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>TOTAL:</span>
                    <span className="text-primary-600">Bs {calculateGrandTotal().toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              disabled={!form.clientId || !form.validUntil || form.items.length === 0}
            >
              Guardar Cotización
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Cotización"
        message={`¿Está seguro de eliminar la cotización "${deleting?.quoteNumber}"?`}
      />

      {/* Modal de Visualización */}
      <Modal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setViewing(null)
        }}
        title="Detalle de Cotización"
        size="xl"
      >
        {viewing && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Número</p>
                <p className="font-semibold">{viewing.quoteNumber || viewing.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <span className={statusColors[viewing.status] || 'badge-gray'}>{viewing.status}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <span className={viewing.quoteType === 'SERVICIOS' ? 'badge-purple' : 'badge-blue'}>
                  {viewing.quoteType || 'PRODUCTOS'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Versión</p>
                <p className="font-medium">{viewing.version || 1}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{viewing.client?.name}</p>
                <p className="text-sm text-gray-600">
                  {viewing.client?.documentType}: {viewing.client?.documentNum || viewing.client?.rut}
                </p>
                {viewing.client?.email && <p className="text-sm text-gray-600">Email: {viewing.client.email}</p>}
              </div>
            </div>

            {viewing.items && viewing.items.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Items</h3>
                <div className="space-y-3">
                  {viewing.items.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          {item.details && item.details.length > 0 && (
                            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                              {item.details.map((detail: any, dIdx: number) => (
                                <li key={dIdx}>{typeof detail === 'string' ? detail : detail.description}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <span className="text-sm font-semibold">
                          Bs {(item.lineTotal || item.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Cantidad: {item.quantity} × Bs {item.unitPrice.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        {item.discount > 0 && ` (Desc. ${item.discount}%)`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewing.creator && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Vendedor</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium">{viewing.creator.fullName || `${viewing.creator.firstName || ''} ${viewing.creator.lastName || ''}`.trim()}</p>
                  <p className="text-sm text-gray-600">Usuario: {viewing.creator.username}</p>
                  {viewing.creator.email && <p className="text-sm text-gray-600">Email: {viewing.creator.email}</p>}
                </div>
              </div>
            )}

            {viewing.paymentType === 'CREDITO' && viewing.observations && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">📝 Descripción del Pago a Crédito</h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{viewing.observations}</p>
              </div>
            )}

            {viewing.paymentType === 'CREDITO' && viewing.paymentTerms && viewing.paymentTerms.length > 0 && (
              <PaymentTermsDisplay
                paymentTerms={viewing.paymentTerms}
                grandTotal={viewing.grandTotal || viewing.total}
              />
            )}

            {viewing.paymentType === 'CONTADO' && viewing.cashPaymentPercentage && viewing.cashPaymentPercentage > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Descuento por Pago al Contado</h3>
                <p className="text-lg font-bold text-green-700">{viewing.cashPaymentPercentage}% de descuento</p>
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  Bs {viewing.subtotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {(viewing.discountPercent || viewing.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span className="font-medium">
                    - Bs {((viewing.subtotal * (viewing.discountPercent || viewing.discount)) / 100).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span className="text-gray-900">TOTAL:</span>
                <span className="text-primary-600">
                  Bs {(viewing.grandTotal || viewing.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {viewing.observations && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-blue-900 font-semibold mb-1">Observaciones:</p>
                <p className="text-sm text-blue-700">{viewing.observations}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setViewModalOpen(false)
                  setViewing(null)
                }}
                className="btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Aprobación */}
      <Modal
        open={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false)
          setApproving(null)
          setSelectedWarehouse('')
        }}
        title="Aprobar Cotización"
        size="md"
      >
        {approving && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900 mb-2">
                <span className="font-semibold">Cotización:</span> {approving.quoteNumber}
              </p>
              <p className="text-sm text-blue-900 mb-2">
                <span className="font-semibold">Cliente:</span> {approving.client?.name}
              </p>
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Total:</span> Bs {(approving.grandTotal || approving.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Atención:</strong> Al aprobar esta cotización, se reducirá automáticamente el inventario de los productos incluidos desde el almacén {user?.warehouseId ? 'asignado a tu usuario' : 'seleccionado'}.
              </p>
            </div>

            {user?.warehouseId ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  <strong>✓ Almacén asignado:</strong> {warehouses.find(w => String(w.id) === String(user.warehouseId))?.name || `ID: ${user.warehouseId}`}
                </p>
                <p className="text-xs text-green-700">
                  El inventario se reducirá automáticamente desde tu almacén asignado.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="warehouse_select" className="label">
                  Seleccionar Almacén *
                </label>
                <select
                  id="warehouse_select"
                  className="input"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  <option value="">— Seleccionar almacén —</option>
                  {warehouses.filter(w => w.isActive).map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} {warehouse.location ? `- ${warehouse.location}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Seleccione el almacén desde donde se reducirá el inventario
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setApproveModalOpen(false)
                  setApproving(null)
                  setSelectedWarehouse('')
                  setError(null)
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="btn-primary bg-green-600 hover:bg-green-700"
                disabled={!selectedWarehouse}
              >
                <CheckCircle size={16} className="inline mr-1" />
                Aprobar y Reducir Inventario
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
