'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface PaymentTerm {
  installmentNumber: number
  percentage: number
  daysAfterIssue: number
  description: string
}

interface PaymentTermsManagerProps {
  paymentTerms: PaymentTerm[]
  onChange: (terms: PaymentTerm[]) => void
  grandTotal?: number
}

export function PaymentTermsManager({ paymentTerms, onChange, grandTotal = 0 }: PaymentTermsManagerProps) {
  const [terms, setTerms] = useState<PaymentTerm[]>(paymentTerms)

  useEffect(() => {
    setTerms(paymentTerms)
  }, [paymentTerms])

  const addTerm = () => {
    const newTerm: PaymentTerm = {
      installmentNumber: terms.length + 1,
      percentage: 0,
      daysAfterIssue: 0,
      description: ''
    }
    const updated = [...terms, newTerm]
    setTerms(updated)
    onChange(updated)
  }

  const updateTerm = (index: number, field: keyof PaymentTerm, value: any) => {
    const updated = [...terms]
    updated[index] = { ...updated[index], [field]: value }
    
    // Renumerar installmentNumber
    updated.forEach((term, idx) => {
      term.installmentNumber = idx + 1
    })
    
    setTerms(updated)
    onChange(updated)
  }

  const removeTerm = (index: number) => {
    const updated = terms.filter((_, i) => i !== index)
    
    // Renumerar installmentNumber
    updated.forEach((term, idx) => {
      term.installmentNumber = idx + 1
    })
    
    setTerms(updated)
    onChange(updated)
  }

  const totalPercentage = terms.reduce((sum, term) => sum + (parseFloat(String(term.percentage)) || 0), 0)
  const isValid = Math.abs(totalPercentage - 100) < 0.01 // Tolerancia para decimales

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Plan de Pagos (Cuotas)</h3>
        <button
          type="button"
          onClick={addTerm}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          Agregar Cuota
        </button>
      </div>

      {terms.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <AlertCircle size={20} className="mx-auto text-yellow-600 mb-2" />
          <p className="text-sm text-yellow-800">
            No hay cuotas definidas. Haz clic en "Agregar Cuota" para definir el plan de pagos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {terms.map((term, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {term.installmentNumber}
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Porcentaje (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="input text-sm"
                      value={term.percentage}
                      onChange={(e) => updateTerm(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="30.00"
                    />
                    {grandTotal > 0 && term.percentage > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ${((term.percentage / 100) * grandTotal).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Días después
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input text-sm"
                      value={term.daysAfterIssue}
                      onChange={(e) => updateTerm(index, 'daysAfterIssue', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input text-sm flex-1"
                        value={term.description}
                        onChange={(e) => updateTerm(index, 'description', e.target.value)}
                        placeholder="Ej: Pago inicial al firmar"
                      />
                      <button
                        type="button"
                        onClick={() => removeTerm(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar cuota"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {terms.length > 0 && (
        <div className={`rounded-lg p-4 border ${isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <AlertCircle size={20} className="text-red-600" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${isValid ? 'text-green-900' : 'text-red-900'}`}>
                Total: {totalPercentage.toFixed(2)}%
              </p>
              {!isValid && (
                <p className="text-xs text-red-700 mt-1">
                  Los porcentajes deben sumar exactamente 100%
                </p>
              )}
            </div>
            {grandTotal > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-600">Total cotización</p>
                <p className="text-sm font-semibold text-gray-900">
                  ${grandTotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-blue-900 mb-2">💡 Ejemplos comunes:</h4>
        <div className="space-y-1 text-xs text-blue-800">
          <p>• <strong>30% inicial + 70% a 30 días:</strong> Pago parcial al inicio</p>
          <p>• <strong>50% inicial + 50% a 15 días:</strong> Dos cuotas iguales</p>
          <p>• <strong>33% + 33% + 34%:</strong> Tres cuotas (0, 15 y 30 días)</p>
        </div>
      </div>
    </div>
  )
}
