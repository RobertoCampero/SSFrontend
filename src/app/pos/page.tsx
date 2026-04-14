'use client'

import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { productsService, clientsService, quotesService, inventoryService, categoriesService } from '@/lib/services'
import type { Product, Client, Quote, QuoteItem, Category } from '@/lib/types'
import { Search, Plus, Trash2, ShoppingCart, User, Calculator, X, Warehouse, ChevronLeft, ChevronRight, CreditCard, Clock, Receipt, Percent, FileDown } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import { generateQuotePDF } from '@/lib/utils/pdf-generator'

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
  const [activeTab, setActiveTab] = useState<'carrito' | 'cliente' | 'cobrar' | 'historial'>('carrito')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [quotesHistory, setQuotesHistory] = useState<Quote[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
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
    loadCategories()
    loadQuotesHistory()
    
    if (user?.warehouseId) {
      loadUserWarehouse()
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

  const loadCategories = async () => {
    try {
      const response = await categoriesService.list({ page: 1, limit: 100 })
      setCategories(response.categories)
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const loadQuotesHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await quotesService.list({ page: 1, limit: 20 })
      setQuotesHistory(response.quotes)
    } catch (error) {
      console.error('Error al cargar historial:', error)
    } finally {
      setLoadingHistory(false)
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchProduct || 
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchProduct.toLowerCase())
    const matchesCategory = !selectedCategory || 
      String(p.categoryId) === selectedCategory
    return matchesSearch && matchesCategory
  })

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
    // Trackear producto reciente
    setRecentProducts(prev => {
      const filtered = prev.filter(p => String(p.id) !== String(product.id))
      return [product, ...filtered].slice(0, 10)
    })
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
      loadQuotesHistory()
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
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ShoppingCart className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Punto de Venta</h1>
              <p className="text-xs text-gray-400">
                {userWarehouse?.name || 'Crea cotizaciones rápidamente'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userWarehouse && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                <Warehouse size={16} />
                <span>{userWarehouse.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ===== LEFT PANEL - Products ===== */}
        <div className="flex-1 flex flex-col bg-white border-r">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar producto, SKU o escanear código..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchProduct}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchProduct(e.target.value)
                  setShowProductSearch(true)
                }}
                onFocus={() => setShowProductSearch(true)}
              />
            </div>
          </div>

          {/* Category Chips */}
          {categories.length > 0 && (
            <div className="px-4 py-3 border-b flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  !selectedCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === String(cat.id) ? null : String(cat.id))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedCategory === String(cat.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Products Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Recent Products */}
            {!searchProduct && recentProducts.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recientes</p>
                <div className="flex flex-wrap gap-3">
                  {recentProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-3 px-3 py-2 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm text-gray-900 truncate max-w-[120px]">{product.name}</div>
                        <div className="text-xs font-semibold text-blue-600">Bs. {product.salePrice?.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results or All Products */}
            {(searchProduct || selectedCategory) ? (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {filteredProducts.length} productos encontrados
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{product.name}</div>
                        <div className="text-xs font-semibold text-blue-600">Bs. {product.salePrice?.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : !recentProducts.length ? (
              <div className="text-center text-gray-400 mt-20">
                <Search size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Busca productos para agregarlos al carrito</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* ===== RIGHT PANEL - Cliente + Carrito + Cobrar (all visible) ===== */}
        <div className="w-[400px] flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto">

            {/* ======== SECCIÓN: CLIENTE ======== */}
            <div className="border-b">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b">
                <User size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Cliente</span>
              </div>
              <div className="p-4 space-y-3">
                {selectedClient ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                          {selectedClient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-blue-900">{selectedClient.name}</div>
                          <div className="text-xs text-blue-600">{selectedClient.documentType}: {selectedClient.documentNum}</div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedClient(null)} className="text-blue-400 hover:text-blue-600" title="Quitar cliente">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchClient}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchClient(e.target.value)}
                        onFocus={() => setShowClientSearch(true)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => setShowNewClientModal(true)}
                      className="btn-primary flex items-center gap-1 text-sm px-3"
                      title="Crear nuevo cliente"
                    >
                      <Plus size={16} />
                      Nuevo
                    </button>
                  </div>
                )}

                {showClientSearch && searchClient && (
                  <div className="border rounded-lg shadow-sm max-h-48 overflow-y-auto">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client)
                          setShowClientSearch(false)
                          setSearchClient('')
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{client.name}</div>
                          <div className="text-xs text-gray-500">{client.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ======== SECCIÓN: CARRITO ======== */}
            <div className="border-b">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Carrito</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{cart.length}</span>
                </div>
                {cart.length > 0 && (
                  <span className="text-xs text-gray-400">{cart.reduce((s, i) => s + i.quantity, 0)} uds.</span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-10 px-4">
                  <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">El carrito está vacío</p>
                  <p className="text-xs mt-1">Busca y agrega productos</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Product avatar */}
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                        {item.product.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Product info + editable price */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{item.product.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-gray-400">Bs.</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const val = parseFloat(e.target.value)
                              if (!isNaN(val) && val >= 0) updatePrice(String(item.product.id), val)
                            }}
                            className="w-20 text-xs border rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500 outline-none"
                            step="0.01"
                            min="0"
                            title="Editar precio (descuento)"
                          />
                          {item.discount > 0 && (
                            <span className="text-[10px] text-green-600 font-medium">-{item.discount.toFixed(1)}%</span>
                          )}
                        </div>
                        {item.stockWarning && (
                          <p className="text-[10px] text-red-500 mt-0.5">Stock: {item.availableStock}</p>
                        )}
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(String(item.product.id), item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded border text-gray-500 hover:bg-gray-100 text-sm"
                          title="Disminuir cantidad"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(String(item.product.id), item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded border text-gray-500 hover:bg-gray-100 text-sm"
                          title="Aumentar cantidad"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right w-20 shrink-0">
                        <div className="font-bold text-sm text-gray-900">Bs. {item.subtotal.toFixed(2)}</div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(String(item.product.id))}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ======== SECCIÓN: COBRAR ======== */}
            <div className="border-b">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Cobrar</span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="pos-quote-type" className="text-xs font-medium text-gray-500 mb-1 block">Tipo de Cotización</label>
                  <select
                    id="pos-quote-type"
                    value={quoteType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value as 'PRODUCTOS' | 'SERVICIOS'
                      setQuoteType(value)
                      if (value === 'SERVICIOS') window.location.href = '/servicios'
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PRODUCTOS">Productos</option>
                    <option value="SERVICIOS">Servicios</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pos-payment-type" className="text-xs font-medium text-gray-500 mb-1 block">Tipo de Pago</label>
                  <select
                    id="pos-payment-type"
                    value={paymentType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentType(e.target.value as 'CONTADO' | 'CREDITO')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="CONTADO">Contado</option>
                    <option value="CREDITO">Crédito</option>
                  </select>
                </div>

                {paymentType !== 'CONTADO' && (
                  <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900">Información del Crédito</p>
                    <div>
                      <label htmlFor="pos-credit-days" className="text-xs text-gray-500 mb-1 block">Plazo (días) *</label>
                      <input
                        id="pos-credit-days"
                        type="number"
                        min="1"
                        value={creditDays}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditDays(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label htmlFor="pos-credit-description" className="text-xs text-gray-500 mb-1 block">Descripción del Pago *</label>
                      <textarea
                        id="pos-credit-description"
                        value={creditDescription}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreditDescription(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                        rows={2}
                        placeholder="Ej: Transferencia bancaria, cheques..."
                      />
                    </div>
                  </div>
                )}

                {/* Total Summary */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Productos</span>
                    <span>{cart.length}</span>
                  </div>
                  {cart.some(item => item.discount > 0) && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>- Bs {cart.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-blue-600">Bs. {calculateTotal().toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ======== SECCIÓN: HISTORIAL (colapsable) ======== */}
            <div>
              <button
                onClick={() => {
                  setActiveTab(activeTab === 'historial' ? 'carrito' : 'historial')
                  if (activeTab !== 'historial') loadQuotesHistory()
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Historial</span>
                </div>
                <ChevronRight size={14} className={`text-gray-400 transition-transform ${activeTab === 'historial' ? 'rotate-90' : ''}`} />
              </button>

              {activeTab === 'historial' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Últimas cotizaciones</p>
                    <button
                      onClick={loadQuotesHistory}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      title="Recargar historial"
                    >
                      Actualizar
                    </button>
                  </div>

                  {loadingHistory ? (
                    <div className="text-center text-gray-400 py-6">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-xs">Cargando...</p>
                    </div>
                  ) : quotesHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-6">
                      <Clock size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin cotizaciones aún</p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-60 overflow-y-auto">
                      {quotesHistory.map(q => {
                        const statusColors: Record<string, string> = {
                          DRAFT: 'bg-gray-100 text-gray-600',
                          PENDING: 'bg-yellow-100 text-yellow-700',
                          APPROVED: 'bg-green-100 text-green-700',
                          REJECTED: 'bg-red-100 text-red-600',
                        }
                        const statusLabels: Record<string, string> = {
                          DRAFT: 'Borrador',
                          PENDING: 'Pendiente',
                          APPROVED: 'Aprobada',
                          REJECTED: 'Rechazada',
                        }
                        const status = (q as any).status || 'DRAFT'
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setCreatedQuote(q)
                              setShowReceipt(true)
                            }}
                            className="w-full text-left py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                              <Receipt size={16} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-900 truncate">
                                  #{(q as any).quoteNumber || q.id}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                                  {statusLabels[status] || status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {(q as any).client?.name || 'Sin cliente'} · {q.createdAt ? new Date(q.createdAt).toLocaleDateString('es-BO') : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-sm text-gray-900">
                                Bs. {Number((q as any).grandTotal ?? (q as any).total ?? 0).toFixed(2)}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ======== FOOTER: TOTAL + BOTÓN CREAR ======== */}
          <div className="border-t bg-white p-4 space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
              <span className="font-bold text-blue-900">TOTAL</span>
              <span className="text-xl font-bold text-blue-900">
                Bs. {calculateTotal().toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={handleCreateQuote}
              disabled={!selectedClient || cart.length === 0}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-3 text-sm"
            >
              Crear Cotización
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
  title="Cotización"
  size="full"
>
  {createdQuote && (
    <div className="bg-white text-sm text-gray-800 p-8 max-w-4xl mx-auto">

      {/* LÍNEA AZUL SUPERIOR */}
      <div className="h-1 bg-blue-800 mb-6" />

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <img src="/logo1.png" alt="Smart Services SRL" className="w-40 mb-3" />
          <table className="text-xs">
            <tbody>
              <tr>
                <td className="font-bold text-blue-800 pr-3 py-0.5">NIT:</td>
                <td className="border-b border-gray-300 py-0.5 w-48">333314024</td>
              </tr>
              <tr>
                <td className="font-bold text-blue-800 pr-3 py-0.5">Correo:</td>
                <td className="border-b border-gray-300 py-0.5">srlsmartservices@gmail.com</td>
              </tr>
              <tr>
                <td className="font-bold text-blue-800 pr-3 py-0.5">Teléfono:</td>
                <td className="border-b border-gray-300 py-0.5">77299562 / 75812336</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-right">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">COTIZACIÓN</h1>
          <table className="text-xs ml-auto">
            <tbody>
              <tr>
                <td className="font-bold text-blue-800 pr-3 py-0.5 text-right">N° Cotización:</td>
                <td className="border-b border-gray-300 py-0.5 text-right w-32">{createdQuote.quoteNumber ?? createdQuote.id}</td>
              </tr>
              <tr>
                <td className="font-bold text-blue-800 pr-3 py-0.5 text-right">Fecha:</td>
                <td className="border-b border-gray-300 py-0.5 text-right">
                  {createdQuote.createdAt
                    ? new Date(createdQuote.createdAt).toLocaleDateString("es-BO")
                    : new Date().toLocaleDateString("es-BO")}
                </td>
              </tr>
              <tr>
                <td className="font-bold text-blue-800 pr-3 py-0.5 text-right">Válido hasta:</td>
                <td className="border-b border-gray-300 py-0.5 text-right">
                  {createdQuote.validUntil
                    ? new Date(createdQuote.validUntil).toLocaleDateString("es-BO")
                    : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CLIENTE Y CREADO POR */}
      <div className="mt-8 space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="font-bold text-blue-800 text-xs whitespace-nowrap">Cliente:</span>
          <span className="border-b border-gray-300 flex-1 text-xs pb-0.5">{createdQuote.client?.name || 'Sin cliente'}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="font-bold text-blue-800 text-xs whitespace-nowrap">Creado por:</span>
          <span className="border-b border-gray-300 flex-1 text-xs pb-0.5">
            {createdQuote.creator?.fullName || createdQuote.creator?.username || user?.fullName || user?.username || 'N/A'}
            {createdQuote.creator?.fullName || createdQuote.creator?.username
              ? ''
              : user?.userRoles?.[0]?.role?.name ? ` - ${user.userRoles[0].role.name}` : ''}
          </span>
        </div>
      </div>

      {/* LÍNEA SEPARADORA */}
      <div className="border-b border-gray-300 mt-6 mb-6" />

      {/* TABLA */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="border border-blue-700 px-3 py-2 w-12 text-center">Ítem</th>
              <th className="border border-blue-700 px-3 py-2 text-left">Descripción</th>
              <th className="border border-blue-700 px-3 py-2 w-14 text-center">Cant.</th>
              <th className="border border-blue-700 px-3 py-2 w-24 text-right">Precio</th>
              <th className="border border-blue-700 px-3 py-2 w-24 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(createdQuote.items as QuoteItem[] | undefined)?.map(
              (item, index) => {
                const quantity = Number(item.quantity ?? 0)
                const unitPrice = Number(item.unitPrice ?? 0)
                const discount = Number(item.discount ?? 0)
                const total = quantity * unitPrice * (1 - discount / 100)

                return (
                  <tr key={index} className="border-b">
                    <td className="border border-gray-300 px-3 py-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{item.description}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{quantity}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{unitPrice.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{total.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs</td>
                  </tr>
                )
              }
            )}
            {/* Subtotal row */}
            <tr>
              <td className="border border-gray-300 px-3 py-2" colSpan={3}></td>
              <td className="border border-gray-300 px-3 py-2 text-right font-bold text-blue-800">Subtotal:</td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                {Number(createdQuote.subtotal ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
              </td>
            </tr>
            {/* Son + TOTAL row */}
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-bold text-blue-800">Son:</td>
              <td className="border border-gray-300 px-3 py-2" colSpan={2}>
                {createdQuote.notes || createdQuote.observations || ''}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right font-bold text-blue-800">TOTAL:</td>
              <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                {Number(createdQuote.grandTotal ?? createdQuote.total ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CONDICIONES */}
      <div className="mt-8">
        <div className="bg-blue-800 text-white text-center py-2 font-bold text-sm">
          Condiciones:
        </div>
        <div className="border border-gray-300 border-t-0 p-4 text-xs space-y-1">
          {createdQuote.termsConditions ? (
            <p className="whitespace-pre-line">{createdQuote.termsConditions}</p>
          ) : (
            <>
              <p>• Incluye impuestos</p>
              <p>• Validez: {createdQuote.deliveryTime || '10 días'}</p>
              <p>• Forma de pago: {createdQuote.paymentType === 'CREDITO' ? `Crédito` : 'Contra entrega'}</p>
              <p>• Tiempo de entrega: Coordinado con el cliente</p>
            </>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-6 border-t border-gray-300 pt-4">
        <p className="text-center text-xs text-gray-500">Si tiene algún otro problema consulte con nuestros soportes.</p>
      </div>

      {/* BOTONES */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t print:hidden">
        <button
          onClick={() => generateQuotePDF({ quote: createdQuote })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          <FileDown size={16} />
          Descargar PDF
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
