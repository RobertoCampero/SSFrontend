'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2, Package, FileCheck, FileX, ClipboardCheck, DollarSign, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { notificationsService } from '@/lib/services'
import type { Notification, NotificationType } from '@/lib/types'
import { useRouter } from 'next/navigation'

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  INFO:              { icon: <Info size={16} />,             color: 'text-blue-600',   bg: 'bg-blue-100' },
  WARNING:           { icon: <AlertTriangle size={16} />,    color: 'text-yellow-600', bg: 'bg-yellow-100' },
  SUCCESS:           { icon: <CheckCircle size={16} />,      color: 'text-green-600',  bg: 'bg-green-100' },
  ERROR:             { icon: <XCircle size={16} />,          color: 'text-red-600',    bg: 'bg-red-100' },
  STOCK_LOW:         { icon: <Package size={16} />,          color: 'text-orange-600', bg: 'bg-orange-100' },
  QUOTE_APPROVED:    { icon: <FileCheck size={16} />,        color: 'text-green-600',  bg: 'bg-green-100' },
  QUOTE_REJECTED:    { icon: <FileX size={16} />,            color: 'text-red-600',    bg: 'bg-red-100' },
  ORDER_COMPLETED:   { icon: <ClipboardCheck size={16} />,   color: 'text-green-600',  bg: 'bg-green-100' },
  PAYMENT_RECEIVED:  { icon: <DollarSign size={16} />,       color: 'text-green-600',  bg: 'bg-green-100' },
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `hace ${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString('es-BO')
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsService.getUnreadCount()
      console.log('📬 Unread count response:', res)
      const data = res as any
      setUnreadCount(data.count ?? data.unreadCount ?? (typeof data === 'number' ? data : 0))
    } catch (err) {
      console.error('❌ Error fetching unread count:', err)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notificationsService.list({ page: 1, limit: 20 })
      console.log('📬 Notifications raw response:', JSON.stringify(res))
      const data = res as any
      const list = data.notifications || data.data || (Array.isArray(data) ? data : [])
      setNotifications(list)
    } catch (err) {
      console.error('❌ Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Load notifications when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

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

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await notificationsService.delete(id)
      const deleted = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (deleted && !deleted.read) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) await handleMarkAsRead(notif.id)
    if (notif.link) {
      setOpen(false)
      router.push(notif.link)
    }
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
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-2xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={14} />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(notif => {
                  const config = typeConfig[notif.type] || typeConfig.INFO
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        notif.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.bg} ${config.color}`}>
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${notif.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-1"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
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
