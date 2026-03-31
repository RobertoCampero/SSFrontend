'use client'

import { useState, useEffect } from 'react'
import { clientsService, quotesService } from '@/lib/services'
import type { Client } from '@/lib/types'
import { Search, Plus, Trash2, User, Calculator, FileText } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Modal } from '@/components/ui/Modal'

interface ServiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

function ServiciosContent() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchClient, setSearchClient] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [paymentType, setPaymentType] = useState<'CONTADO' | 'CREDITO_30' | 'CREDITO_60' | 'CREDITO_90'>('CONTADO')
  const [newServiceForm, setNewServiceForm] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0
  })
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    documentType: 'RUT',
    documentNum: '',
    email: '',
    phone: '',
    address: '',
    clientType: 'REGULAR' as 'REGULAR' | 'PREFERENCIAL'
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await clientsService.list({ page: 1, limit: 100 })
      setClients(response.clients)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const handleCreateClient = async () => {
    if (!newClientForm.name || !newClientForm.documentNum) {
      alert('Nombre y documento son obligatorios')
      return
    }

    try {
      const newClient = await clientsService.create(newClientForm)
      await loadClients()
      setSelectedClient(newClient)
      setShowNewClientModal(false)
      setNewClientForm({
        name: '',
        documentType: 'RUT',
        documentNum: '',
        email: '',
        phone: '',
        address: '',
        clientType: 'REGULAR'
      })
      alert('Cliente creado exitosamente')
    } catch (error) {
      console.error('Error al crear cliente:', error)
      alert(error instanceof Error ? error.message : 'Error al crear cliente')
    }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchClient.toLowerCase())
  )

  const addService = () => {
    if (!newServiceForm.description || newServiceForm.unitPrice <= 0) {
      alert('Completa la descripción y precio del servicio')
      return
    }

    const newService: ServiceItem = {
      id: Date.now().toString(),
      description: newServiceForm.description,
      quantity: newServiceForm.quantity,
      unitPrice: newServiceForm.unitPrice,
      subtotal: newServiceForm.quantity * newServiceForm.unitPrice
    }

    setServices([...services, newService])
    setNewServiceForm({ description: '', quantity: 1, unitPrice: 0 })
  }

  const updateServiceQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    setServices(services.map(service => {
      if (service.id === id) {
        return { ...service, quantity, subtotal: service.unitPrice * quantity }
      }
      return service
    }))
  }

  const updateServicePrice = (id: string, unitPrice: number) => {
    if (unitPrice < 0) return
    setServices(services.map(service => {
      if (service.id === id) {
        return { ...service, unitPrice, subtotal: service.quantity * unitPrice }
      }
      return service
    }))
  }

  const removeService = (id: string) => {
    setServices(services.filter(service => service.id !== id))
  }

  const calculateTotal = () => {
    return services.reduce((sum, service) => sum + service.subtotal, 0)
  }

  const handleCreateQuote = async () => {
    if (!selectedClient) {
      alert('Selecciona un cliente')
      return
    }
    if (services.length === 0) {
      alert('Agrega al menos un servicio')
      return
    }

    try {
      const items = services.map(service => ({
        itemType: 'SERVICE' as const,
        description: service.description,
        quantity: service.quantity,
        unitPrice: service.unitPrice
      }))

      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30)

      // Convertir paymentType a formato válido
      const normalizedPaymentType = paymentType === 'CONTADO' ? 'CONTADO' : 'CREDITO'

      await quotesService.create({
        clientId: Number(selectedClient.id),
        items,
        quoteType: 'SERVICIOS',
        paymentType: normalizedPaymentType,
        validUntil: validUntil.toISOString().split('T')[0],
        notes: 'Cotización de servicios'
      })

      alert('Cotización de servicios creada exitosamente')
      setServices([])
      setSelectedClient(null)
    } catch (error) {
      console.error('Error al crear cotización:', error)
      alert(error instanceof Error ? error.message : 'Error al crear cotización')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotización de Servicios</h1>
            <p className="text-sm text-gray-500">Crea cotizaciones para servicios técnicos y profesionales</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Service Form */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="card max-w-2xl">
            <h2 className="text-lg font-bold mb-4">Agregar Servicio</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="service-description" className="label">Descripción del Servicio *</label>
                <textarea
                  id="service-description"
                  value={newServiceForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Ej: Instalación de sistema eléctrico, Mantenimiento preventivo, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="service-quantity" className="label">Cantidad</label>
                  <input
                    id="service-quantity"
                    type="number"
                    min="1"
                    value={newServiceForm.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewServiceForm({ ...newServiceForm, quantity: parseInt(e.target.value) || 1 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Precio Unitario (Bs) *</label>
                  <input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newServiceForm.unitPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewServiceForm({ ...newServiceForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>
              <button
                onClick={addService}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Agregar Servicio
              </button>
            </div>
          </div>

          {/* Services List */}
          {services.length > 0 && (
            <div className="card mt-6 max-w-2xl">
              <h2 className="text-lg font-bold mb-4">Servicios Agregados</h2>
              <div className="space-y-3">
                {services.map(service => (
                  <div key={service.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{service.description}</div>
                      </div>
                      <button
                        onClick={() => removeService(service.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        aria-label="Eliminar servicio"
                        title="Eliminar servicio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label htmlFor={`service-qty-${service.id}`} className="text-xs text-gray-600">Cantidad</label>
                        <input
                          id={`service-qty-${service.id}`}
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateServiceQuantity(service.id, parseInt(e.target.value) || 1)}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor={`service-price-${service.id}`} className="text-xs text-gray-600">Precio Unit.</label>
                        <input
                          id={`service-price-${service.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={service.unitPrice}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateServicePrice(service.id, parseFloat(e.target.value) || 0)}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Subtotal</label>
                        <div className="input text-sm font-bold text-primary-600 bg-white">
                          Bs {service.subtotal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Client & Summary */}
        <div className="w-96 flex flex-col bg-gray-50">
          {/* Client Selection */}
          <div className="p-4 bg-white border-b">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchClient}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchClient(e.target.value)}
                  onFocus={() => setShowClientSearch(true)}
                  className="input pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button
                onClick={() => setShowNewClientModal(true)}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
                title="Crear nuevo cliente"
              >
                <Plus size={18} />
                Nuevo
              </button>
            </div>
            {showClientSearch && !selectedClient && searchClient && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client)
                      setShowClientSearch(false)
                      setSearchClient('')
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedClient && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-900">{selectedClient.name}</div>
                    <div className="text-sm text-green-700">{selectedClient.email}</div>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-green-600 hover:text-green-800"
                    aria-label="Quitar cliente seleccionado"
                    title="Quitar cliente seleccionado"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Services Summary */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-700 mb-3">Resumen</h3>
            {services.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p>Agrega servicios para crear la cotización</p>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map(service => (
                  <div key={service.id} className="bg-white p-3 rounded-lg border text-sm">
                    <div className="font-medium truncate">{service.description}</div>
                    <div className="text-gray-600 mt-1">
                      {service.quantity} × Bs {service.unitPrice.toLocaleString()} = Bs {service.subtotal.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total & Actions */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div className="flex items-center gap-2 text-gray-600">
                <Calculator size={20} />
                <span className="font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                Bs {calculateTotal().toLocaleString()}
              </div>
            </div>

            {/* Tipo de Pago */}
            <div className="mb-4">
              <label htmlFor="servicios-payment-type" className="label text-xs">Tipo de Pago</label>
              <select
                id="servicios-payment-type"
                value={paymentType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentType(e.target.value as 'CONTADO' | 'CREDITO_30' | 'CREDITO_60' | 'CREDITO_90')}
                className="input text-sm"
              >
                <option value="CONTADO">Contado</option>
                <option value="CREDITO_30">Crédito 30 días</option>
                <option value="CREDITO_60">Crédito 60 días</option>
                <option value="CREDITO_90">Crédito 90 días</option>
              </select>
            </div>

            <button
              onClick={handleCreateQuote}
              disabled={!selectedClient || services.length === 0}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Cotización de Servicios
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear cliente */}
      <Modal
        open={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        title="Crear Nuevo Cliente"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="servicios-client-name" className="label">Nombre *</label>
            <input
              id="servicios-client-name"
              type="text"
              value={newClientForm.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, name: e.target.value })}
              className="input"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label htmlFor="servicios-client-doctype" className="label">Tipo de Documento *</label>
            <select
              id="servicios-client-doctype"
              value={newClientForm.documentType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewClientForm({ ...newClientForm, documentType: e.target.value })}
              className="input"
            >
              <option value="CI">CEDULA DE IDENTIDAD</option>
              <option value="PASSPORT">Pasaporte</option>
            </select>
          </div>

          <div>
            <label htmlFor="servicios-client-docnum" className="label">Número de Documento *</label>
            <input
              id="servicios-client-docnum"
              type="text"
              value={newClientForm.documentNum}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, documentNum: e.target.value })}
              className="input"
              placeholder="12.345.678-9"
            />
          </div>

          <div>
            <label htmlFor="servicios-client-email" className="label">Email</label>
            <input
              id="servicios-client-email"
              type="email"
              value={newClientForm.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, email: e.target.value })}
              className="input"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="servicios-client-phone" className="label">Teléfono</label>
            <input
              id="servicios-client-phone"
              type="text"
              value={newClientForm.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
              className="input"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div>
            <label htmlFor="servicios-client-address" className="label">Dirección</label>
            <textarea
              id="servicios-client-address"
              value={newClientForm.address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewClientForm({ ...newClientForm, address: e.target.value })}
              className="input"
              rows={2}
              placeholder="Dirección del cliente"
            />
          </div>

          <div>
            <label htmlFor="servicios-client-type" className="label">Tipo de Cliente</label>
            <select
              id="servicios-client-type"
              value={newClientForm.clientType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewClientForm({ ...newClientForm, clientType: e.target.value as 'REGULAR' | 'PREFERENCIAL' })}
              className="input"
            >
              <option value="REGULAR">Regular</option>
              <option value="PREFERENCIAL">Preferencial</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setShowNewClientModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateClient}
              className="btn-primary"
            >
              Crear Cliente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function ServiciosPage() {
  return (
    <ProtectedRoute requiredPermission="quotes.create">
      <ServiciosContent />
    </ProtectedRoute>
  )
}
