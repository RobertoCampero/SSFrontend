'use client'

import { useState, useEffect } from 'react'
import { creditsService } from '@/lib/services'
import type { CreditPayment, CreditsSummary } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

function CreditsContent() {
  const toast = useToast()
  const [payments, setPayments] = useState<CreditPayment[]>([])
  const [summary, setSummary] = useState<CreditsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'quoteNumber'>('dueDate')

  useEffect(() => {
    loadData()
  }, [filter, sortBy])

  const loadData = async () => {
    setLoading(true)
    try {
      const [paymentsData, summaryData] = await Promise.all([
        creditsService.list({ status: filter, sortBy }),
        creditsService.getSummary()
      ])
      setPayments(paymentsData.payments)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error cargando créditos:', error)
      toast.error('Error', error instanceof Error ? error.message : 'Error al cargar créditos')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (paymentId: string, quoteNumber: string) => {
    if (!confirm('¿Marcar este pago como pagado?')) return

    try {
      await creditsService.markAsPaid(paymentId)
      toast.success('Pago registrado', `El pago de ${quoteNumber} se marcó como pagado`)
      loadData()
    } catch (error) {
      console.error('Error marcando pago:', error)
      toast.error('Error', error instanceof Error ? error.message : 'Error al marcar pago como pagado')
    }
  }

  const formatCurrency = (amount: number) => {
    return `Bs ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (payment: CreditPayment) => {
    if (payment.isPaid) {
      return <span className="badge-success">✓ Pagado</span>
    }
    if (payment.isOverdue) {
      return <span className="badge-danger">⚠ Vencido</span>
    }
    return <span className="badge-warning">⏳ Pendiente</span>
  }

  const getDaysText = (payment: CreditPayment) => {
    if (payment.isPaid) {
      return <span className="text-sm text-gray-500">-</span>
    }
    if (payment.daysUntilDue >= 0) {
      return (
        <span className="text-sm text-blue-600 font-medium">
          {payment.daysUntilDue} {payment.daysUntilDue === 1 ? 'día' : 'días'}
        </span>
      )
    }
    return (
      <span className="text-sm text-red-600 font-bold">
        {Math.abs(payment.daysUntilDue)} {Math.abs(payment.daysUntilDue) === 1 ? 'día' : 'días'} vencido
      </span>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <CreditCard className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Créditos y Cobranza</h1>
            <p className="text-sm text-gray-500">Gestión de pagos a crédito y seguimiento de cobros</p>
          </div>
        </div>
      </div>

      {/* Resumen de Créditos */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.countPending}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pendientes</h3>
            <p className="text-lg font-semibold text-yellow-600">{formatCurrency(summary.amountPending)}</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.countOverdue}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Vencidos</h3>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(summary.amountOverdue)}</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.countPaid}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pagados</h3>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(summary.amountPaid)}</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.totalPending + summary.totalPaid + summary.totalOverdue}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Créditos</h3>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(summary.amountPending + summary.amountPaid + summary.amountOverdue)}
            </p>
          </div>
        </div>
      )}

      {/* Filtros y Ordenamiento */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vencidos
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pagados
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input text-sm py-2"
              title="Ordenar créditos por"
            >
              <option value="dueDate">Fecha de Vencimiento</option>
              <option value="amount">Monto</option>
              <option value="quoteNumber">Número de Cotización</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-500">Cargando créditos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">No hay pagos a crédito {filter !== 'all' ? `en estado "${filter}"` : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cotización</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Cuota</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Monto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Vencimiento</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Días</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      payment.isOverdue && !payment.isPaid ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{payment.quote.quoteNumber}</div>
                      <div className="text-xs text-gray-500">
                        Total: {formatCurrency(payment.quote.grandTotal)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{payment.quote.client.name}</div>
                      {payment.quote.client.phone && (
                        <div className="text-xs text-gray-500">{payment.quote.client.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                        {payment.installmentNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{payment.description || '-'}</div>
                      <div className="text-xs text-gray-500">{payment.percentage.toFixed(2)}% del total</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-900">{formatDate(payment.dueDate)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">{getDaysText(payment)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(payment)}</td>
                    <td className="px-4 py-3 text-center">
                      {!payment.isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(payment.id, payment.quote.quoteNumber)}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Marcar Pagado
                        </button>
                      )}
                      {payment.isPaid && payment.paidAt && (
                        <div className="text-xs text-gray-500">
                          Pagado: {formatDate(payment.paidAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreditsPage() {
  return (
    <ProtectedRoute>
      <CreditsContent />
    </ProtectedRoute>
  )
}
