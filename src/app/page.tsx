'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StatsCard } from '@/components/ui/StatsCard'
import { Building2, Package, FileText, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { clientsService, productsService, quotesService } from '@/lib/services'
import type { Client, Product, Quote } from '@/lib/types'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

const estadoBadge: Record<string, string> = {
  PENDIENTE: 'badge-gray',
  ENVIADA: 'badge-blue',
  APROBADA: 'badge-green',
  RECHAZADA: 'badge-red',
  VENCIDA: 'badge-yellow',
}

export default function Dashboard() {
  const router = useRouter()
  const { roles, isAdmin, loading: authLoading } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [redirected, setRedirected] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    // Esperar a que termine de cargar la autenticación
    if (authLoading) return
    
    // Evitar ejecuciones múltiples
    if (redirected || dataLoaded) return

    // Debug: Ver qué roles tiene el usuario
    console.log('🔍 Dashboard - Roles del usuario:', roles)
    console.log('🔍 Dashboard - ¿Es admin?:', isAdmin())

    // Si es administrador, SIEMPRE mostrar el dashboard
    if (isAdmin()) {
      console.log('✅ Usuario es administrador - Cargando dashboard')
      setDataLoaded(true)
      loadDashboardData()
      return
    }

    // Si NO es admin Y es vendedor, redirigir al POS solo una vez
    if (roles.includes('Vendedor')) {
      console.log('➡️ Usuario es vendedor - Redirigiendo al POS')
      setRedirected(true)
      router.push('/pos')
      return
    }

    // Para cualquier otro caso, cargar el dashboard
    console.log('📊 Cargando dashboard por defecto')
    setDataLoaded(true)
    loadDashboardData()
  }, [authLoading])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [clientsRes, productsRes, quotesRes] = await Promise.all([
        clientsService.list({ page: 1, limit: 100 }),
        productsService.list({ page: 1, limit: 100 }),
        quotesService.list({ page: 1, limit: 100 })
      ])
      setClients(clientsRes.clients)
      setProducts(productsRes.products)
      setQuotes(quotesRes.quotes)
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalClientes = clients.length
  const totalProductos = products.length
  const totalCotizaciones = quotes.length
  const aprobadas = quotes.filter(q => q.status === 'APROBADA')
  const montoAprobado = aprobadas.reduce((s, q) => s + q.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen general — Smart Services S.R.L.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Clientes" value={totalClientes} icon={Building2} color="green" change={`${totalClientes} registrados`} />
        <StatsCard title="Productos" value={totalProductos} icon={Package} color="purple" change={`${totalProductos} en catálogo`} />
        <StatsCard title="Cotizaciones" value={totalCotizaciones} icon={FileText} color="blue" change={`${aprobadas.length} aprobadas`} />
        <StatsCard title="Ingresos Aprobados" value={`Bs ${montoAprobado.toLocaleString()}`} icon={TrendingUp} color="orange" changeType="positive" change={`${aprobadas.length} cotizaciones`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent quotes */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Cotizaciones Recientes</h2>
            <Link href="/quotes" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {quotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No hay cotizaciones registradas</p>
              <Link href="/quotes" className="mt-3 inline-block text-xs text-primary-600 hover:text-primary-700">
                Crear primera cotización
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {quotes.slice(0, 5).map(quote => (
                <div key={quote.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{quote.quoteNumber}</p>
                      <p className="text-xs text-gray-400">{quote.client?.name || 'Cliente'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">Bs {quote.total.toLocaleString()}</p>
                    <span className={`text-[10px] ${estadoBadge[quote.status] || 'badge-gray'}`}>{quote.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent clients */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Clientes Recientes</h2>
            <Link href="/clients" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {clients.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No hay clientes registrados</p>
              <Link href="/clients" className="mt-3 inline-block text-xs text-primary-600 hover:text-primary-700">
                Agregar primer cliente
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clients.slice(0, 5).map(client => (
                <div key={client.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.rut}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] ${client.type === 'PREFERENCIAL' ? 'badge-green' : 'badge-blue'}`}>
                      {client.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
