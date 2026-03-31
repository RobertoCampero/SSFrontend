'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { productsService, clientsService, quotesService, inventoryService } from '@/lib/services'
import type { Product, Client, Quote, QuoteItem } from '@/lib/types'
import { Search, Plus, Trash2, ShoppingCart, User, Calculator, X } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'

interface CartItem {
  product: Product
  quantity: number
  price: number
  originalPrice: number // Precio original del producto
  discount: number
  subtotal: number
  availableStock?: number
  stockWarning?: boolean
}

function POSContent() {
  const { user } = useAuth()
  const toast = useToast()
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchProduct, setSearchProduct] = useState('')
  const [searchClient, setSearchClient] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [stockWarnings, setStockWarnings] = useState<{[key: string]: {available: number, required: number}}>({})
  const [userWarehouse, setUserWarehouse] = useState<any>(null)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [quoteType, setQuoteType] = useState<'PRODUCTOS' | 'SERVICIOS'>('PRODUCTOS')
  const [paymentType, setPaymentType] = useState<'CONTADO' | 'CREDITO'>('CONTADO')
  const [creditDescription, setCreditDescription] = useState('')
  const [creditDays, setCreditDays] = useState(30)
  const [createdQuote, setCreatedQuote] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)
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
    loadProducts()
    loadClients()
    
    console.log('🔍 POS - Usuario cargado:', user)
    console.log('🏢 POS - warehouseId del usuario:', user?.warehouseId)
    
    if (user?.warehouseId) {
      loadUserWarehouse()
    } else {
      console.warn('⚠️ Usuario NO tiene warehouseId asignado')
    }
  }, [user])

  const loadUserWarehouse = async () => {
    try {
      if (!user?.warehouseId) {
        console.warn('Usuario no tiene almacén asignado')
        return
      }
      const response = await inventoryService.listWarehouses()
      const warehouse = response.warehouses.find(w => String(w.id) === String(user.warehouseId))
      if (warehouse) {
        setUserWarehouse(warehouse)
        console.log('✅ Almacén del usuario cargado:', warehouse)
      } else {
        console.warn('No se encontró el almacén del usuario')
      }
    } catch (error) {
      console.error('Error al cargar almacén del usuario:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productsService.list({ page: 1, limit: 100 })
      setProducts(response.products)
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

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
      toast.warning('Campos requeridos', 'Nombre y documento son obligatorios')
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
      toast.success('Cliente creado', 'El cliente se creó exitosamente')
    } catch (error) {
      console.error('Error al crear cliente:', error)
      toast.error('Error', error instanceof Error ? error.message : 'Error al crear cliente')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchProduct.toLowerCase())
  )

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchClient.toLowerCase())
  )

  const addToCart = async (product: Product) => {
    console.log('🛒 Agregando producto al carrito:', product.name, 'ID:', product.id)
    console.log('👤 Usuario actual:', user)
    console.log('🏢 Almacén del usuario:', user?.warehouseId)
    
    const existing = cart.find(item => String(item.product.id) === String(product.id))
    if (existing) {
      console.log('✅ Producto ya existe en el carrito, incrementando cantidad')
      updateQuantity(String(product.id), existing.quantity + 1)
    } else {
      const price = product.salePrice || 0
      
      // Verificar stock disponible en el almacén del usuario
      let availableStock = 0
      try {
        if (user?.warehouseId) {
          // Consultar stock del almacén específico del usuario
          const stockData: any = await productsService.getStock(String(product.id))
          
          console.log('🔍 DATOS COMPLETOS DE STOCK:', JSON.stringify(stockData, null, 2))
          console.log('🏢 Almacén del usuario:', user.warehouseId, 'Tipo:', typeof user.warehouseId)
          
          // El backend puede devolver diferentes estructuras:
          // 1. Un array de objetos de inventario (cada uno con warehouseId y quantity)
          // 2. Un objeto con propiedad warehouses
          let warehouseStock = null
          
          if (Array.isArray(stockData)) {
            // Caso 1: Es un array directo de inventario
            console.log('📦 Estructura: Array de inventario')
            warehouseStock = stockData.find(
              (item: any) => String(item.warehouseId) === String(user.warehouseId)
            )
            console.log('✅ Stock encontrado:', warehouseStock)
            availableStock = warehouseStock?.quantity || 0
          } else if (stockData.warehouses && Array.isArray(stockData.warehouses)) {
            // Caso 2: Tiene propiedad warehouses
            console.log('📦 Estructura: Objeto con warehouses')
            warehouseStock = stockData.warehouses.find(
              (w: any) => String(w.warehouseId) === String(user.warehouseId)
            )
            console.log('✅ Stock encontrado:', warehouseStock)
            availableStock = warehouseStock?.stock || warehouseStock?.quantity || 0
          } else if (stockData.totalStock !== undefined) {
            // Caso 3: Solo tiene totalStock
            console.log('📦 Estructura: Solo totalStock')
            availableStock = stockData.totalStock
          }
          
          console.log(`📦 Stock final de ${product.name}:`, availableStock)
        } else {
          // Si no hay almacén asignado, usar stock total
          const stockData = await productsService.getStock(String(product.id))
          availableStock = stockData.totalStock || 0
        }
        
        setCart([...cart, {
          product,
          quantity: 1,
          price,
          originalPrice: price,
          discount: 0,
          subtotal: price,
          availableStock: availableStock,
          stockWarning: 1 > availableStock
        }])
        
        if (1 > availableStock) {
          setStockWarnings(prev => ({
            ...prev,
            [String(product.id)]: { available: availableStock, required: 1 }
          }))
          
          if (availableStock === 0) {
            toast.warning(
              'Stock insuficiente',
              `${product.name} no tiene stock disponible en tu almacén`
            )
          }
        }
      } catch (error) {
        console.error('❌ Error al verificar stock:', error)
        console.error('Error completo:', JSON.stringify(error, null, 2))
        
        // Agregar al carrito sin stock conocido
        setCart([...cart, {
          product,
          quantity: 1,
          price,
          originalPrice: price,
          discount: 0,
          subtotal: price,
          availableStock: 0
        }])
        
        toast.warning(
          'Error al verificar stock',
          'No se pudo consultar el stock disponible. Verifica manualmente antes de aprobar la cotización.'
        )
      }
    }
    setShowProductSearch(false)
    setSearchProduct('')
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(cart.map(item => {
      if (String(item.product.id) === productId) {
        const subtotal = (item.price * quantity) * (1 - item.discount / 100)
        const stockWarning = item.availableStock !== undefined && quantity > item.availableStock
        
        // Actualizar advertencias de stock
        if (stockWarning && item.availableStock !== undefined) {
          setStockWarnings(prev => ({
            ...prev,
            [productId]: { available: item.availableStock!, required: quantity }
          }))
        } else {
          setStockWarnings(prev => {
            const newWarnings = { ...prev }
            delete newWarnings[productId]
            return newWarnings
          })
        }
        
        return { ...item, quantity, subtotal, stockWarning }
      }
      return item
    }))
  }

  const updatePrice = (productId: string, price: number) => {
    setCart(cart.map(item => {
      if (String(item.product.id) === productId) {
        // Calcular el descuento basado en el precio original
        const discountPercent = item.originalPrice > 0 
          ? ((item.originalPrice - price) / item.originalPrice) * 100 
          : 0
        const discount = Math.max(0, Math.round(discountPercent * 100) / 100) // Redondear a 2 decimales
        const subtotal = price * item.quantity
        return { ...item, price, discount, subtotal }
      }
      return item
    }))
  }

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => {
      if (String(item.product.id) === productId) {
        const subtotal = (item.price * item.quantity) * (1 - discount / 100)
        return { ...item, discount, subtotal }
      }
      return item
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => String(item.product.id) !== productId))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const handleCreateQuote = async () => {
    if (!selectedClient) {
      toast.error('Error', 'Selecciona un cliente')
      return
    }

    if (cart.length === 0) {
      toast.error('Error', 'Agrega productos al carrito')
      return
    }

    // Validar campos de crédito
    if (paymentType !== 'CONTADO') {
      if (!creditDescription.trim()) {
        toast.error('Error', 'Debes describir cómo pagará el cliente para ventas a crédito')
        return
      }
      if (!creditDays || creditDays < 1) {
        toast.error('Error', 'Debes especificar el plazo en días para ventas a crédito')
        return
      }
    }

    // Verificar que el usuario tenga almacén asignado
    if (!user?.warehouseId) {
      toast.error(
        'Almacén no asignado',
        'Tu usuario no tiene un almacén asignado. Contacta al administrador para que te asigne un almacén.'
      )
      return
    }

    // Verificar stock localmente antes de crear la cotización
    if (quoteType === 'PRODUCTOS') {
      const insufficientItems = cart.filter(item => 
        item.availableStock !== undefined && item.quantity > item.availableStock
      )
      
      if (insufficientItems.length > 0) {
        const itemsList = insufficientItems
          .map(item => `${item.product.name}: necesitas ${item.quantity}, disponible ${item.availableStock}`)
          .join('\n')
        
        toast.warning(
          'Stock insuficiente',
          `Los siguientes productos no tienen stock suficiente:\n\n${itemsList}`
        )
        return
      }
    }

    try {
      const items = cart.map(item => ({
        productId: Number(item.product.id),
        itemType: 'PRODUCT' as const,
        description: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount
      }))

      // Fecha de validez: 30 días desde hoy
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30)

      const quote = await quotesService.create({
        clientId: Number(selectedClient.id),
        items,
        quoteType,
        paymentType,
        validUntil: validUntil.toISOString().split('T')[0],
        warehouseId: Number(user.warehouseId),
        notes: `Cotización de ${quoteType.toLowerCase()} desde POS - Almacén: ${userWarehouse?.name || user.warehouseId}`,
        observations: paymentType !== 'CONTADO' ? `CRÉDITO ${creditDays} DÍAS\n\n${creditDescription}` : undefined
      })

      setCreatedQuote(quote)
      setShowReceipt(true)
      setCart([])
      setSelectedClient(null)
      setCreditDescription('')
      setCreditDays(30)
      setPaymentType('CONTADO')
      
      toast.success(
        'Cotización creada',
        `La cotización se creó exitosamente desde el almacén ${userWarehouse?.name || 'asignado'}`
      )
    } catch (error) {
      console.error('Error al crear cotización:', error)
      toast.error('Error', error instanceof Error ? error.message : 'Error al crear cotización')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ShoppingCart className="text-primary-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
              <p className="text-sm text-gray-500">Crea cotizaciones rápidamente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Cart */}
        <div className="w-[640px] flex flex-col bg-gray-50 border-r">
          {/* Client Selection */}
          <div className="p-4 bg-white border-b relative">
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
                {showClientSearch && !selectedClient && searchClient && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
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
          </div>

          {/* Selected Client Info */}
          {selectedClient && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  <div>
                    <div className="font-semibold text-sm text-blue-900">{selectedClient.name}</div>
                    <div className="text-xs text-blue-600">{selectedClient.documentType}: {selectedClient.documentNum}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Cambiar cliente"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Cart Items - Invoice Style */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-20 px-4">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                <p>El carrito está vacío</p>
                <p className="text-xs mt-2">Busca y agrega productos para crear una cotización</p>
              </div>
            ) : (
<div className="p-4">
  <div className="bg-white rounded-lg border shadow-sm overflow-hidden">

    {/* Header */}
    <div className="grid grid-cols-6 gap-2 px-4 py-3 bg-gray-100 text-sm font-semibold text-center">
      <div>ITEM</div>
      <div className="text-left">PRODUCTO</div>
      <div>CANTIDAD</div>
      <div>PRECIO UNITARIO</div>
      <div>SUBTOTAL</div>
      <div>OPCIONES</div>
    </div>

    {/* Body */}
    <div>
      {cart.map((item, index) => (
        <div
          key={item.product.id}
          className="grid grid-cols-6 gap-2 px-4 py-3 border-t items-center text-sm"
        >
          {/* ITEM */}
          <div className="text-center">{index + 1}</div>

          {/* PRODUCTO */}
          <div className="text-left">{item.product.name}</div>

          {/* CANTIDAD */}
          <div className="flex justify-center">
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                updateQuantity(
                  String(item.product.id),
                  parseInt(e.target.value) || 0
                )
              }
              className="w-16 text-center border rounded-md px-1 py-0.5"
            />
          </div>

          {/* PRECIO */}
          <div className="flex justify-center">
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.price}
              onChange={(e) =>
                updatePrice(
                  String(item.product.id),
                  parseFloat(e.target.value) || 0
                )
              }
              className="w-24 text-right border rounded-md px-1 py-0.5"
            />
          </div>

          {/* SUBTOTAL */}
          <div className="text-right font-medium">
            Bs. {item.subtotal.toFixed(2)}
          </div>

          {/* OPCIONES */}
          <div className="flex justify-center">
            <button
              onClick={() => removeFromCart(String(item.product.id))}
              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-md transition-colors border border-red-300 hover:border-red-600"
              title="Eliminar producto"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>

  </div>
</div>
            )}
          </div>

          {/* Total & Actions */}
          <div className="p-4 bg-white border-t space-y-3">
            <div className="space-y-2 pb-3 border-b">
              {cart.some(item => item.discount > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Descuento:</span>
                  <span className="font-medium text-green-600">
                    - Bs {cart.reduce((sum, item) => sum + (item.price * item.quantity * item.discount / 100), 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
            
            {/* Total */}
            <div className="flex items-center justify-between py-2 bg-blue-50 px-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-900">
                <Calculator size={20} />
                <span className="font-bold text-lg">TOTAL:</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                Bs {calculateTotal().toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Tipo de Cotización y Pago */}
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="pos-quote-type" className="label text-xs">Tipo de Cotización</label>
<select
  id="pos-quote-type"
  value={quoteType}
  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'PRODUCTOS' | 'SERVICIOS';
    setQuoteType(value);

    if (value === 'SERVICIOS') {
      window.location.href = '/servicios';
    }
  }}
  className="input text-sm"
>
  <option value="PRODUCTOS">Productos</option>
  <option value="SERVICIOS">Servicios</option>
</select>
              </div>
              <div>
                <label htmlFor="pos-payment-type" className="label text-xs">Tipo de Pago</label>
                <select
                  id="pos-payment-type"
                  value={paymentType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentType(e.target.value as 'CONTADO' | 'CREDITO')}
                  className="input text-sm"
                >
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>
            </div>

            {/* Campos adicionales para pago a crédito */}
            {paymentType !== 'CONTADO' && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900">Información del Crédito</h4>
                
                <div>
                  <label htmlFor="pos-credit-days" className="label text-xs">Plazo (días) *</label>
                  <input
                    id="pos-credit-days"
                    type="number"
                    min="1"
                    value={creditDays}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditDays(Number(e.target.value))}
                    className="input text-sm"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label htmlFor="pos-credit-description" className="label text-xs">Descripción del Pago *</label>
                  <textarea
                    id="pos-credit-description"
                    value={creditDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreditDescription(e.target.value)}
                    className="input text-sm"
                    rows={3}
                    placeholder="Describe cómo pagará el cliente (ej: Transferencia bancaria, cheques, etc.)"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Especifica la forma de pago acordada con el cliente
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateQuote}
              disabled={!selectedClient || cart.length === 0}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Cotización
            </button>
          </div>
        </div>
<button
  onClick={() => setShowRightPanel(prev => !prev)}
  className="px-3 py-2 bg-gray-200 rounded-md"
>
  {showRightPanel ? "Ocultar productos" : "Mostrar productos"}
</button>
         {/* Right Panel */}
  {showRightPanel && (
    <div className="w-1/3 flex flex-col bg-white border-l transition-all">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar productos por nombre o SKU..."
            className="input pl-10"
            value={searchProduct}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchProduct(e.target.value)
              setShowProductSearch(true)
            }}
            onFocus={() => setShowProductSearch(true)}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {showProductSearch && searchProduct ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">{product.sku}</div>
                <div className="text-lg font-bold text-primary-600 mt-2">
                  Bs.- {product.salePrice?.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-20">
            <Search size={48} className="mx-auto mb-3 opacity-50" />
            <p>Busca productos para agregarlos al carrito</p>
          </div>
        )}
      </div>
    </div>
  )}
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
            <label htmlFor="pos-client-name" className="label">Nombre *</label>
            <input
              id="pos-client-name"
              type="text"
              value={newClientForm.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, name: e.target.value })}
              className="input"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label htmlFor="pos-client-doctype" className="label">Tipo de Documento *</label>
            <select
              id="pos-client-doctype"
              value={newClientForm.documentType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewClientForm({ ...newClientForm, documentType: e.target.value })}
              className="input"
            >
              <option value="CI">CEDULA DE IDENTIDAD</option>
              <option value="PASSPORT">Pasaporte</option>
            </select>
          </div>

          <div>
            <label htmlFor="pos-client-docnum" className="label">Número de Documento *</label>
            <input
              id="pos-client-docnum"
              type="text"
              value={newClientForm.documentNum}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, documentNum: e.target.value })}
              className="input"
              placeholder="12.345.678-9"
            />
          </div>

          <div>
            <label htmlFor="pos-client-email" className="label">Email</label>
            <input
              id="pos-client-email"
              type="email"
              value={newClientForm.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, email: e.target.value })}
              className="input"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="pos-client-phone" className="label">Teléfono</label>
            <input
              id="pos-client-phone"
              type="text"
              value={newClientForm.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
              className="input"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div>
            <label htmlFor="pos-client-address" className="label">Dirección</label>
            <textarea
              id="pos-client-address"
              value={newClientForm.address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewClientForm({ ...newClientForm, address: e.target.value })}
              className="input"
              rows={2}
              placeholder="Dirección del cliente"
            />
          </div>

          <div>
            <label htmlFor="pos-client-type" className="label">Tipo de Cliente</label>
            <select
              id="pos-client-type"
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

      {/* Modal de Cotización estilo PDF */}
<Modal
  open={showReceipt}
  onClose={() => {
    setShowReceipt(false)
    setCreatedQuote(null)
  }}
  title=""
  size="xl"
>
  {createdQuote && (
    <div className="bg-white text-sm text-gray-800 p-6">

      {/* HEADER */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <img src="/logo1.png" alt="Logo" className="w-32 mb-2" />
            <p className="text-xs">NIT: 333314024</p>
            <p className="text-xs">CORREO: srlsmartservices@gmail.com</p>
          </div>

          <div className="text-right text-xs space-y-1">
            <p>
              <span className="font-semibold">N° DE COTIZACIÓN:</span>{" "}
              {createdQuote.quoteNumber ?? createdQuote.id}
            </p>
            <p>
              <span className="font-semibold">FECHA:</span>{" "}
              {createdQuote.createdAt
                ? new Date(createdQuote.createdAt).toLocaleDateString("es-BO")
                : new Date().toLocaleDateString("es-BO")}
            </p>
            <p>
              <span className="font-semibold">VÁLIDA HASTA:</span>{" "}
              {createdQuote.validUntil
                ? new Date(createdQuote.validUntil).toLocaleDateString("es-BO")
                : ""}
            </p>
            <p>
              <span className="font-semibold">VERSIÓN:</span>{" "}
              {createdQuote.version ?? 1}
            </p>
          </div>
        </div>

        <h1 className="text-center text-lg font-bold text-blue-800 mt-4">
          {createdQuote.quoteType === "SERVICIOS"
            ? "COTIZACIÓN DE SERVICIOS"
            : "COTIZACIÓN"}
        </h1>
      </div>

      {/* SECCIÓN DATOS */}
      <div className="mt-6">
        <div className="bg-blue-800 text-white text-center py-2 font-semibold">
          DATOS
        </div>

        <div className="mt-4 space-y-2">
          <p>
            <span className="font-semibold">NOMBRE:</span>{" "}
            {createdQuote.client?.name}
          </p>
          <p>
            <span className="font-semibold">TIPO:</span>{" "}
            {createdQuote.quoteType === "SERVICIOS"
              ? "COTIZACIÓN DE SERVICIOS"
              : "COTIZACIÓN DE PRODUCTOS"}
          </p>
        </div>
      </div>

      {/* TABLA */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border border-gray-300 text-xs">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="border px-2 py-2">ÍTEM</th>
              <th className="border px-2 py-2">UNIDAD</th>
              <th className="border px-2 py-2 text-left">DESCRIPCIÓN</th>
              <th className="border px-2 py-2">CANTIDAD</th>
              <th className="border px-2 py-2 text-right">PRECIO</th>
              <th className="border px-2 py-2 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(createdQuote.items as QuoteItem[] | undefined)?.map(
              (item, index) => {
                const quantity = Number(item.quantity ?? 0)
                const unitPrice = Number(item.unitPrice ?? 0)
                const discount = Number(item.discount ?? 0)

                const total =
                  quantity * unitPrice * (1 - discount / 100)

                return (
                  <tr key={index}>
                    <td className="border px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {item.itemType === "SERVICE"
                        ? "SERVICIO"
                        : "PRODUCTO"}
                    </td>
                    <td className="border px-2 py-2 whitespace-pre-line">
                      {item.description}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {quantity}
                    </td>
                    <td className="border px-2 py-2 text-right">
                      {unitPrice.toFixed(2)}
                    </td>
                    <td className="border px-2 py-2 text-right">
                      {total.toFixed(2)}
                    </td>
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      </div>

      {/* TOTALES */}
      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal Bs.</span>
            <span>
              {Number(createdQuote.subtotal ?? 0).toFixed(2)}
            </span>
          </div>

          {createdQuote.discountPercent &&
            createdQuote.discountPercent > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Descuento ({createdQuote.discountPercent}%)
                </span>
                <span>
                  -
                  {(
                    (Number(createdQuote.subtotal ?? 0) *
                      createdQuote.discountPercent) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            )}

          <div className="flex justify-between font-bold text-blue-800 border-t pt-2">
            <span>TOTAL Bs.</span>
            <span>
              {Number(
                createdQuote.grandTotal ??
                  createdQuote.total ??
                  0
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex justify-end gap-3 mt-8 border-t pt-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="btn-secondary"
        >
          Imprimir
        </button>
        <button
          onClick={() => {
            setShowReceipt(false)
            setCreatedQuote(null)
          }}
          className="btn-primary"
        >
          Cerrar
        </button>
      </div>
    </div>
  )}
</Modal>
    </div>
  )
}

export default function POSPage() {
  return (
    <ProtectedRoute requiredPermission="quotes.create">
      <POSContent />
    </ProtectedRoute>
  )
}
