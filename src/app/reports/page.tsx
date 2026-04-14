'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3, Warehouse, Users, ArrowDownCircle, ArrowUpCircle,
  ArrowRightLeft, Edit3, Package, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, RefreshCw, Calendar, Filter,
  ChevronDown, ChevronUp, FileText, AlertTriangle
} from 'lucide-react'
import { inventoryService, quotesService, usersService, productsService } from '@/lib/services'
import type { InventoryMovement, MovementType, Quote, User, Product, Warehouse as WarehouseType } from '@/lib/types'

type ReportTab = 'resumen' | 'almacenes' | 'vendedores' | 'movimientos'

interface DateRange {
  from: string
  to: string
}

function getDefaultDateRange(): DateRange {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: firstDay.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  }
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('resumen')
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)

  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [movementFilterType, setMovementFilterType] = useState<MovementType | ''>('')
  const [movementFilterWarehouse, setMovementFilterWarehouse] = useState('')
  const [expandedWarehouse, setExpandedWarehouse] = useState<number | null>(null)
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [movRes, quoteRes, whRes, userRes, prodRes] = await Promise.all([
        inventoryService.listMovements({ page: 1, limit: 500 }),
        quotesService.list({ page: 1, limit: 500 }),
        inventoryService.listWarehouses(),
        usersService.list({ page: 1, limit: 100 }),
        productsService.list({ page: 1, limit: 1000 }),
      ])
      setMovements(movRes.movements || [])
      setQuotes((quoteRes as any).quotes || [])
      setWarehouses(whRes.warehouses || [])
      setUsers((userRes as any).users || [])
      setProducts((prodRes as any).products || [])
    } catch (err) {
      console.error('Error cargando datos de reportes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Lookup maps for enriching movements
  const productMap = useMemo(() => {
    const map = new Map<number, Product>()
    products.forEach(p => map.set(p.id, p))
    return map
  }, [products])

  const warehouseMap = useMemo(() => {
    const map = new Map<number, WarehouseType>()
    warehouses.forEach(w => map.set(w.id, w))
    return map
  }, [warehouses])

  const getProductName = (m: InventoryMovement) => m.product?.name || productMap.get(m.productId)?.name || `Producto #${m.productId}`
  const getProductSku = (m: InventoryMovement) => m.product?.sku || productMap.get(m.productId)?.sku || ''
  const getWarehouseName = (m: InventoryMovement) => m.warehouse?.name || warehouseMap.get(m.warehouseId)?.name || `Almacén #${m.warehouseId}`

  // Filter by date range
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const d = m.createdAt?.split('T')[0]
      if (d && dateRange.from && d < dateRange.from) return false
      if (d && dateRange.to && d > dateRange.to) return false
      return true
    })
  }, [movements, dateRange])

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const d = (q.createdAt || q.issueDate || '')?.split('T')[0]
      if (d && dateRange.from && d < dateRange.from) return false
      if (d && dateRange.to && d > dateRange.to) return false
      return true
    })
  }, [quotes, dateRange])

  // ===== SUMMARY STATS =====
  const summary = useMemo(() => {
    const ingresos = filteredMovements.filter(m => m.type === 'INGRESO')
    const egresos = filteredMovements.filter(m => m.type === 'EGRESO')
    const transferencias = filteredMovements.filter(m => m.type === 'TRANSFERENCIA')
    const ajustes = filteredMovements.filter(m => m.type === 'AJUSTE')

    const totalIngresoQty = ingresos.reduce((s, m) => s + m.quantity, 0)
    const totalEgresoQty = egresos.reduce((s, m) => s + m.quantity, 0)
    const totalTransferQty = transferencias.reduce((s, m) => s + m.quantity, 0)

    const approvedQuotes = filteredQuotes.filter(q => q.status === 'APROBADA')
    const pendingQuotes = filteredQuotes.filter(q => q.status === 'PENDIENTE')
    const totalSales = approvedQuotes.reduce((s, q) => s + Number((q as any).grandTotal ?? q.total ?? 0), 0)

    return {
      totalMovements: filteredMovements.length,
      ingresos: ingresos.length,
      egresos: egresos.length,
      transferencias: transferencias.length,
      ajustes: ajustes.length,
      totalIngresoQty,
      totalEgresoQty,
      totalTransferQty,
      totalQuotes: filteredQuotes.length,
      approvedQuotes: approvedQuotes.length,
      pendingQuotes: pendingQuotes.length,
      totalSales,
    }
  }, [filteredMovements, filteredQuotes])

  // ===== BY WAREHOUSE =====
  const warehouseStats = useMemo(() => {
    const map = new Map<number, {
      warehouse: WarehouseType
      ingresos: number
      egresos: number
      transferencias: number
      ajustes: number
      totalQtyIn: number
      totalQtyOut: number
      movements: InventoryMovement[]
    }>()

    warehouses.forEach(w => {
      map.set(w.id, {
        warehouse: w,
        ingresos: 0, egresos: 0, transferencias: 0, ajustes: 0,
        totalQtyIn: 0, totalQtyOut: 0, movements: [],
      })
    })

    filteredMovements.forEach(m => {
      const entry = map.get(m.warehouseId)
      if (!entry) return
      entry.movements.push(m)
      switch (m.type) {
        case 'INGRESO': entry.ingresos++; entry.totalQtyIn += m.quantity; break
        case 'EGRESO': entry.egresos++; entry.totalQtyOut += m.quantity; break
        case 'TRANSFERENCIA': entry.transferencias++; break
        case 'AJUSTE': entry.ajustes++; break
      }
    })

    return Array.from(map.values()).sort((a, b) =>
      (b.ingresos + b.egresos + b.transferencias) - (a.ingresos + a.egresos + a.transferencias)
    )
  }, [filteredMovements, warehouses])

  // ===== BY SELLER =====
  const sellerStats = useMemo(() => {
    const map = new Map<string, {
      user: { id: string; name: string }
      totalQuotes: number
      approvedQuotes: number
      pendingQuotes: number
      rejectedQuotes: number
      totalSales: number
      quotes: Quote[]
    }>()

    filteredQuotes.forEach(q => {
      const creatorId = q.creator?.id || q.createdBy || 'unknown'
      const creatorName = q.creator?.fullName || q.creator?.username || q.salesExecutive || 'Sin asignar'

      if (!map.has(creatorId)) {
        map.set(creatorId, {
          user: { id: creatorId, name: creatorName },
          totalQuotes: 0, approvedQuotes: 0, pendingQuotes: 0, rejectedQuotes: 0,
          totalSales: 0, quotes: [],
        })
      }

      const entry = map.get(creatorId)!
      entry.totalQuotes++
      entry.quotes.push(q)
      const total = Number((q as any).grandTotal ?? q.total ?? 0)

      if (q.status === 'APROBADA') { entry.approvedQuotes++; entry.totalSales += total }
      else if (q.status === 'PENDIENTE' || q.status === 'ENVIADA') { entry.pendingQuotes++ }
      else if (q.status === 'RECHAZADA') { entry.rejectedQuotes++ }
    })

    return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales)
  }, [filteredQuotes])

  // ===== MOVEMENT TABLE (filtered) =====
  const tableMovements = useMemo(() => {
    return filteredMovements.filter(m => {
      if (movementFilterType && m.type !== movementFilterType) return false
      if (movementFilterWarehouse && String(m.warehouseId) !== movementFilterWarehouse) return false
      return true
    })
  }, [filteredMovements, movementFilterType, movementFilterWarehouse])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-BO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString))
  }

  const formatCurrency = (n: number) =>
    'Bs. ' + n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const typeIcon = (type: MovementType) => {
    switch (type) {
      case 'INGRESO': return <ArrowDownCircle size={16} className="text-green-600" />
      case 'EGRESO': return <ArrowUpCircle size={16} className="text-red-600" />
      case 'TRANSFERENCIA': return <ArrowRightLeft size={16} className="text-blue-600" />
      case 'AJUSTE': return <Edit3 size={16} className="text-yellow-600" />
    }
  }

  const typeBadge = (type: MovementType) => {
    const styles: Record<string, string> = {
      INGRESO: 'bg-green-100 text-green-800',
      EGRESO: 'bg-red-100 text-red-800',
      TRANSFERENCIA: 'bg-blue-100 text-blue-800',
      AJUSTE: 'bg-yellow-100 text-yellow-800',
    }
    return styles[type] || 'bg-gray-100 text-gray-800'
  }

  const reasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      COMPRA: 'Compra', PROYECTO: 'Proyecto', KIT: 'Kit',
      DEVOLUCION: 'Devolución', AJUSTE_MANUAL: 'Ajuste Manual',
      VENTA: 'Venta', SERVICIO: 'Servicio',
    }
    return labels[reason] || reason
  }

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <BarChart3 size={16} /> },
    { id: 'almacenes', label: 'Por Almacén', icon: <Warehouse size={16} /> },
    { id: 'vendedores', label: 'Por Vendedor', icon: <Users size={16} /> },
    { id: 'movimientos', label: 'Movimientos', icon: <ArrowRightLeft size={16} /> },
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 rounded-lg">
            <BarChart3 className="text-teal-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
            <p className="text-gray-500 text-sm">Movimientos de inventario, ventas por almacén y vendedor</p>
          </div>
        </div>
        <button
          onClick={loadAllData}
          className="btn-secondary flex items-center gap-2 text-sm self-start"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span className="font-medium">Período:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="Fecha desde"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="Fecha hasta"
          />
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              const now = new Date()
              setDateRange({ from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], to: now.toISOString().split('T')[0] })
            }}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Este mes
          </button>
          <button
            onClick={() => {
              const now = new Date()
              const y = now.getFullYear()
              setDateRange({ from: `${y}-01-01`, to: now.toISOString().split('T')[0] })
            }}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Este año
          </button>
          <button
            onClick={() => setDateRange({ from: '', to: '' })}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Todo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ========== TAB: RESUMEN ========== */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* Summary Cards Row 1 - Movements */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Movimientos de Inventario</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <SummaryCard label="Total Movimientos" value={summary.totalMovements} icon={<Package size={20} />} color="gray" />
                  <SummaryCard label="Ingresos" value={summary.ingresos} sub={`${summary.totalIngresoQty} uds.`} icon={<ArrowDownCircle size={20} />} color="green" />
                  <SummaryCard label="Egresos" value={summary.egresos} sub={`${summary.totalEgresoQty} uds.`} icon={<ArrowUpCircle size={20} />} color="red" />
                  <SummaryCard label="Transferencias" value={summary.transferencias} sub={`${summary.totalTransferQty} uds.`} icon={<ArrowRightLeft size={20} />} color="blue" />
                  <SummaryCard label="Ajustes" value={summary.ajustes} icon={<Edit3 size={20} />} color="yellow" />
                </div>
              </div>

              {/* Summary Cards Row 2 - Sales */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Cotizaciones y Ventas</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard label="Total Cotizaciones" value={summary.totalQuotes} icon={<FileText size={20} />} color="gray" />
                  <SummaryCard label="Aprobadas" value={summary.approvedQuotes} icon={<TrendingUp size={20} />} color="green" />
                  <SummaryCard label="Pendientes" value={summary.pendingQuotes} icon={<AlertTriangle size={20} />} color="yellow" />
                  <SummaryCard label="Total Ventas" value={formatCurrency(summary.totalSales)} icon={<DollarSign size={20} />} color="teal" />
                </div>
              </div>

              {/* Quick Warehouse Overview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Actividad por Almacén</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {warehouseStats.map(ws => (
                    <div key={ws.warehouse.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-3">
                        <Warehouse size={18} className="text-blue-600" />
                        <span className="font-semibold text-gray-900">{ws.warehouse.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-gray-600">Ingresos:</span>
                          <span className="font-medium">{ws.ingresos}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-gray-600">Egresos:</span>
                          <span className="font-medium">{ws.egresos}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-gray-600">Transfer.:</span>
                          <span className="font-medium">{ws.transferencias}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-gray-600">Ajustes:</span>
                          <span className="font-medium">{ws.ajustes}</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-3 pt-3 border-t text-xs text-gray-500">
                        <span>+{ws.totalQtyIn} uds. ingresadas</span>
                        <span>-{ws.totalQtyOut} uds. egresadas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Sellers */}
              {sellerStats.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Top Vendedores</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                          <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Cotizaciones</th>
                          <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Aprobadas</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Ventas Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sellerStats.slice(0, 5).map(s => (
                          <tr key={s.user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                  {s.user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-sm">{s.user.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">{s.totalQuotes}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                {s.approvedQuotes}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-sm">{formatCurrency(s.totalSales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== TAB: POR ALMACÉN ========== */}
          {activeTab === 'almacenes' && (
            <div className="space-y-4">
              {warehouseStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Warehouse size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No hay datos de almacenes</p>
                </div>
              ) : (
                warehouseStats.map(ws => (
                  <div key={ws.warehouse.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedWarehouse(expandedWarehouse === ws.warehouse.id ? null : ws.warehouse.id)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Warehouse size={20} className="text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{ws.warehouse.name}</div>
                          <div className="text-xs text-gray-500">
                            {ws.movements.length} movimientos en el período
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-green-700">
                            <ArrowDownCircle size={14} /> {ws.ingresos}
                          </span>
                          <span className="flex items-center gap-1 text-red-700">
                            <ArrowUpCircle size={14} /> {ws.egresos}
                          </span>
                          <span className="flex items-center gap-1 text-blue-700">
                            <ArrowRightLeft size={14} /> {ws.transferencias}
                          </span>
                        </div>
                        {expandedWarehouse === ws.warehouse.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </div>
                    </button>

                    {expandedWarehouse === ws.warehouse.id && (
                      <div>
                        {/* Stats bar */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{ws.ingresos}</div>
                            <div className="text-xs text-gray-500">Ingresos ({ws.totalQtyIn} uds.)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{ws.egresos}</div>
                            <div className="text-xs text-gray-500">Egresos ({ws.totalQtyOut} uds.)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{ws.transferencias}</div>
                            <div className="text-xs text-gray-500">Transferencias</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{ws.ajustes}</div>
                            <div className="text-xs text-gray-500">Ajustes</div>
                          </div>
                        </div>

                        {/* Movement rows */}
                        {ws.movements.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">Sin movimientos en este período</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                  <th className="px-4 py-2 text-left">Tipo</th>
                                  <th className="px-4 py-2 text-left">Producto</th>
                                  <th className="px-4 py-2 text-center">Cantidad</th>
                                  <th className="px-4 py-2 text-left">Motivo</th>
                                  <th className="px-4 py-2 text-left">Fecha</th>
                                  <th className="px-4 py-2 text-left">Notas</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y text-sm">
                                {ws.movements.slice(0, 20).map(m => (
                                  <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-1.5">
                                        {typeIcon(m.type)}
                                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${typeBadge(m.type)}`}>{m.type}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="font-medium text-gray-900">{getProductName(m)}</div>
                                      <div className="text-xs text-gray-400">{getProductSku(m)}</div>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      <span className={`font-semibold ${m.type === 'INGRESO' ? 'text-green-600' : m.type === 'EGRESO' ? 'text-red-600' : 'text-blue-600'}`}>
                                        {m.type === 'INGRESO' ? '+' : m.type === 'EGRESO' ? '-' : '±'}{m.quantity}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-700">{reasonLabel(m.reason)}</td>
                                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                                    <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{m.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {ws.movements.length > 20 && (
                              <div className="text-center py-2 text-xs text-gray-400 border-t">
                                Mostrando 20 de {ws.movements.length} movimientos
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========== TAB: POR VENDEDOR ========== */}
          {activeTab === 'vendedores' && (
            <div className="space-y-4">
              {sellerStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No hay datos de vendedores</p>
                </div>
              ) : (
                sellerStats.map(ss => (
                  <div key={ss.user.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedSeller(expandedSeller === ss.user.id ? null : ss.user.id)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {ss.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{ss.user.name}</div>
                          <div className="text-xs text-gray-500">{ss.totalQuotes} cotizaciones</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                          <span className="text-green-700 font-medium">{ss.approvedQuotes} aprobadas</span>
                          <span className="font-bold text-gray-900">{formatCurrency(ss.totalSales)}</span>
                        </div>
                        {expandedSeller === ss.user.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </div>
                    </button>

                    {expandedSeller === ss.user.id && (
                      <div>
                        {/* Stats bar */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-700">{ss.totalQuotes}</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{ss.approvedQuotes}</div>
                            <div className="text-xs text-gray-500">Aprobadas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{ss.pendingQuotes}</div>
                            <div className="text-xs text-gray-500">Pendientes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-teal-600">{formatCurrency(ss.totalSales)}</div>
                            <div className="text-xs text-gray-500">Total Vendido</div>
                          </div>
                        </div>

                        {/* Quotes list */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                              <tr>
                                <th className="px-4 py-2 text-left"># Cotización</th>
                                <th className="px-4 py-2 text-left">Cliente</th>
                                <th className="px-4 py-2 text-center">Estado</th>
                                <th className="px-4 py-2 text-center">Pago</th>
                                <th className="px-4 py-2 text-right">Total</th>
                                <th className="px-4 py-2 text-left">Fecha</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                              {ss.quotes.slice(0, 20).map(q => {
                                const statusColors: Record<string, string> = {
                                  PENDIENTE: 'bg-yellow-100 text-yellow-800',
                                  ENVIADA: 'bg-blue-100 text-blue-800',
                                  APROBADA: 'bg-green-100 text-green-800',
                                  RECHAZADA: 'bg-red-100 text-red-800',
                                  VENCIDA: 'bg-gray-100 text-gray-800',
                                }
                                return (
                                  <tr key={q.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-medium">#{q.quoteNumber}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{q.client?.name || 'Sin cliente'}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[q.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {q.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-xs">{q.paymentType}</td>
                                    <td className="px-4 py-2.5 text-right font-bold">
                                      {formatCurrency(Number((q as any).grandTotal ?? q.total ?? 0))}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString('es-BO') : '-'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          {ss.quotes.length > 20 && (
                            <div className="text-center py-2 text-xs text-gray-400 border-t">
                              Mostrando 20 de {ss.quotes.length} cotizaciones
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========== TAB: MOVIMIENTOS (tabla detallada) ========== */}
          {activeTab === 'movimientos' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={movementFilterType}
                    onChange={e => setMovementFilterType(e.target.value as MovementType | '')}
                    className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    aria-label="Filtrar por tipo de movimiento"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="INGRESO">Ingresos</option>
                    <option value="EGRESO">Egresos</option>
                    <option value="TRANSFERENCIA">Transferencias</option>
                    <option value="AJUSTE">Ajustes</option>
                  </select>
                </div>
                <select
                  value={movementFilterWarehouse}
                  onChange={e => setMovementFilterWarehouse(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  aria-label="Filtrar por almacén"
                >
                  <option value="">Todos los almacenes</option>
                  {warehouses.filter(w => w.isActive).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-400 self-center">{tableMovements.length} movimientos</span>
              </div>

              {tableMovements.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ArrowRightLeft size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No hay movimientos con los filtros seleccionados</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Almacén</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {tableMovements.slice(0, 50).map(m => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {typeIcon(m.type)}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeBadge(m.type)}`}>{m.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{getProductName(m)}</div>
                            <div className="text-xs text-gray-400">{getProductSku(m)}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{getWarehouseName(m)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${m.type === 'INGRESO' ? 'text-green-600' : m.type === 'EGRESO' ? 'text-red-600' : 'text-blue-600'}`}>
                              {m.type === 'INGRESO' ? '+' : m.type === 'EGRESO' ? '-' : '±'}{m.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{reasonLabel(m.reason)}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{m.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tableMovements.length > 50 && (
                    <div className="text-center py-3 text-sm text-gray-400 border-t">
                      Mostrando 50 de {tableMovements.length} movimientos
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Summary Card Component =====
function SummaryCard({ label, value, sub, icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: 'green' | 'red' | 'blue' | 'yellow' | 'gray' | 'teal'
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-50 text-gray-600',
    teal: 'bg-teal-50 text-teal-600',
  }
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colors[color]}`}>{icon}</div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
