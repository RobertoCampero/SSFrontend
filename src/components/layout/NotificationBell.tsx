'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, CheckCheck, Package, AlertTriangle, Eye, ExternalLink } from 'lucide-react'
import { inventoryService } from '@/lib/services'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface StockAlert {
  id: string
  productName: string
  sku: string
  currentStock: number
  minStock: number
  read: boolean
}

const DISMISSED_PREFIX = 'ss_dismissed_stock_alerts'

function getDismissedKey(userId: string) {
  return `${DISMISSED_PREFIX}_${userId}`
}

function getDismissed(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getDismissedKey(userId))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveDismissed(userId: string, set: Set<string>) {
  localStorage.setItem(getDismissedKey(userId), JSON.stringify(Array.from(set)))
}

export function NotificationBell() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = String(user?.id || user?.userId || 'default')
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchStockAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const dismissed = getDismissed(userId)
      let lowStockItems: StockAlert[] = []

      // Try /inventory/low-stock first
      try {
        const lowStock = await inventoryService.getLowStock()
        const items = Array.isArray(lowStock) ? lowStock : (lowStock as any)?.products || (lowStock as any)?.items || []
        lowStockItems = items.map((item: any) => ({
          id: `low-${item.productId || item.id}`,
          productName: item.productName || item.name || 'Producto',
          sku: item.sku || '',
          currentStock: item.currentStock ?? item.totalStock ?? 0,
          minStock: item.minStock ?? item.minStockGlobal ?? 0,
          read: dismissed.has(`low-${item.productId || item.id}`),
        }))
      } catch {
        // Fallback: use /inventory and filter low stock
        try {
          const res = await inventoryService.getInventory({ page: 1, limit: 500 })
          const inventory = res.inventory || (res as any).data || []
          lowStockItems = inventory
            .filter((item: any) => {
              const total = item.totalStock ?? 0
              const min = item.minStockGlobal ?? item.minStock ?? 0
              return min > 0 && total <= min
            })
            .map((item: any) => ({
              id: `low-${item.id}`,
              productName: item.name || 'Producto',
              sku: item.sku || '',
              currentStock: item.totalStock ?? 0,
              minStock: item.minStockGlobal ?? item.minStock ?? 0,
              read: dismissed.has(`low-${item.id}`),
            }))
        } catch { /* both failed */ }
      }

      // Sort: unread first, then by how critical (lowest stock ratio first)
      lowStockItems.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1
        const ratioA = a.minStock > 0 ? a.currentStock / a.minStock : 1
        const ratioB = b.minStock > 0 ? b.currentStock / b.minStock : 1
        return ratioA - ratioB
      })

      setAlerts(lowStockItems)
    } catch {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch on mount and every 60s
  useEffect(() => {
    fetchStockAlerts()
    const interval = setInterval(fetchStockAlerts, 60000)
    return () => clearInterval(interval)
  }, [fetchStockAlerts])

  // Refresh when dropdown opens
  useEffect(() => {
    if (open) fetchStockAlerts()
  }, [open, fetchStockAlerts])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const unreadCount = alerts.filter(a => !a.read).length

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const dismissed = getDismissed(userId)
    dismissed.add(id)
    saveDismissed(userId, dismissed)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  const handleDismissAll = () => {
    const dismissed = getDismissed(userId)
    alerts.forEach(a => dismissed.add(a.id))
    saveDismissed(userId, dismissed)
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  const handleAlertClick = (alert: StockAlert) => {
    if (!alert.read) {
      const dismissed = getDismissed(userId)
      dismissed.add(alert.id)
      saveDismissed(userId, dismissed)
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a))
    }
    setOpen(false)
    router.push('/stock')
  }

  const getStockSeverity = (current: number, min: number) => {
    if (current === 0) return { label: 'Sin stock', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' }
    if (current <= min * 0.5) return { label: 'Crítico', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' }
    return { label: 'Bajo', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[420px] rounded-xl border border-gray-200 bg-white shadow-2xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-900">Alertas de Stock</h3>
              {alerts.length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  {alerts.length} producto{alerts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={14} />
                  Descartar
                </button>
              )}
              <button
                onClick={() => { setOpen(false); router.push('/stock') }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
                title="Ver inventario"
              >
                <ExternalLink size={12} />
                Ver stock
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Todo en orden</p>
                <p className="text-xs mt-1">No hay productos con stock bajo</p>
              </div>
            ) : (
              <div className="divide-y">
                {alerts.map(alert => {
                  const severity = getStockSeverity(alert.currentStock, alert.minStock)
                  return (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        alert.read ? 'bg-white hover:bg-gray-50' : 'bg-orange-50/40 hover:bg-orange-50/70'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        alert.currentStock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {alert.currentStock === 0 ? <AlertTriangle size={17} /> : <Package size={17} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${alert.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                            {alert.productName}
                          </p>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">SKU: {alert.sku}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${severity.bg} ${severity.color} ${severity.border} border`}>
                            {severity.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            Stock: <strong className={alert.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}>{alert.currentStock}</strong>
                            {' / mín. '}{alert.minStock}
                          </span>
                        </div>
                      </div>

                      {/* Dismiss */}
                      {!alert.read && (
                        <button
                          onClick={(e) => handleDismiss(alert.id, e)}
                          className="text-gray-300 hover:text-blue-500 transition-colors shrink-0 mt-1"
                          title="Marcar como leída"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
