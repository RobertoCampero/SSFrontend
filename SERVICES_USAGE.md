# Guía de Uso de Servicios API

Esta guía explica cómo usar los servicios para consumir el backend API en tu aplicación Next.js.

## 📁 Estructura de Archivos

```
src/lib/
├── api-config.ts          # Configuración base del cliente API
├── types.ts               # Tipos TypeScript para todas las entidades
└── services/
    ├── index.ts           # Exportaciones centralizadas
    ├── auth.service.ts    # Servicio de autenticación
    ├── clients.service.ts # Servicio de clientes
    ├── products.service.ts # Servicio de productos
    ├── suppliers.service.ts # Servicio de proveedores
    ├── quotes.service.ts  # Servicio de cotizaciones
    └── inventory.service.ts # Servicio de inventario
```

## ⚙️ Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Importar Servicios

```typescript
import { 
  authService, 
  clientsService, 
  productsService,
  suppliersService,
  quotesService,
  inventoryService 
} from '@/lib/services';
```

## 🔐 Autenticación

### Registro de Usuario

```typescript
'use client';

import { authService } from '@/lib/services';
import { useState } from 'react';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.register({ email, password });
      console.log('Usuario registrado:', response.user);
      // El token se guarda automáticamente en localStorage
      // Redirigir al dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Registrar</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### Inicio de Sesión

```typescript
'use client';

import { authService } from '@/lib/services';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.login({
        email: 'user@example.com',
        password: 'password123'
      });
      console.log('Login exitoso:', response.user);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
    }
  };

  return <form onSubmit={handleLogin}>{/* ... */}</form>;
}
```

### Verificar Autenticación

```typescript
'use client';

import { authService } from '@/lib/services';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <div>Cargando...</div>;

  return <div>Contenido protegido</div>;
}
```

### Cerrar Sesión

```typescript
import { authService } from '@/lib/services';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  return <button onClick={handleLogout}>Cerrar Sesión</button>;
}
```

## 👥 Clientes

### Listar Clientes con Paginación

```typescript
'use client';

import { clientsService } from '@/lib/services';
import { useEffect, useState } from 'react';
import type { Client } from '@/lib/types';

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadClients();
  }, [page]);

  const loadClients = async () => {
    try {
      const response = await clientsService.list({ 
        page, 
        limit: 10,
        search: '',
        type: 'REGULAR' // opcional
      });
      setClients(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Clientes</h1>
      <ul>
        {clients.map(client => (
          <li key={client.id}>
            {client.name} - {client.rut}
          </li>
        ))}
      </ul>
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Anterior
      </button>
      <span>Página {page} de {totalPages}</span>
      <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
        Siguiente
      </button>
    </div>
  );
}
```

### Crear Cliente

```typescript
'use client';

import { clientsService } from '@/lib/services';
import { useState } from 'react';

export default function CreateClientForm() {
  const [formData, setFormData] = useState({
    name: '',
    rut: '',
    email: '',
    phone: '',
    address: '',
    type: 'REGULAR' as const,
    contactPerson: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newClient = await clientsService.create(formData);
      console.log('Cliente creado:', newClient);
      // Redirigir o actualizar lista
    } catch (err) {
      console.error('Error al crear cliente:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="RUT"
        value={formData.rut}
        onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
        required
      />
      <select
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'REGULAR' | 'PREFERENCIAL' })}
      >
        <option value="REGULAR">Regular</option>
        <option value="PREFERENCIAL">Preferencial</option>
      </select>
      <button type="submit">Crear Cliente</button>
    </form>
  );
}
```

### Actualizar Cliente

```typescript
import { clientsService } from '@/lib/services';

async function updateClient(id: number) {
  try {
    const updated = await clientsService.update(id, {
      phone: '+56987654321',
      address: 'Nueva dirección'
    });
    console.log('Cliente actualizado:', updated);
  } catch (err) {
    console.error('Error al actualizar:', err);
  }
}
```

### Eliminar Cliente

```typescript
import { clientsService } from '@/lib/services';

async function deleteClient(id: number) {
  if (confirm('¿Estás seguro de eliminar este cliente?')) {
    try {
      await clientsService.delete(id);
      console.log('Cliente eliminado');
      // Actualizar lista
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  }
}
```

## 📦 Productos

### Listar Productos

```typescript
'use client';

import { productsService } from '@/lib/services';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsService.list({
        page: 1,
        limit: 20,
        search: 'cable', // opcional
        categoryId: 1 // opcional
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>SKU: {product.sku}</p>
          <p>Precio: ${product.salePrice}</p>
          <p>Categoría: {product.category?.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### Ver Stock de Producto

```typescript
import { productsService } from '@/lib/services';

async function checkProductStock(productId: number) {
  try {
    const stock = await productsService.getStock(productId);
    console.log('Stock total:', stock.totalStock);
    console.log('Stock mínimo:', stock.minStock);
    stock.warehouses.forEach(w => {
      console.log(`${w.warehouseName}: ${w.stock} unidades`);
    });
  } catch (err) {
    console.error('Error al obtener stock:', err);
  }
}
```

### Crear Producto

```typescript
import { productsService } from '@/lib/services';

async function createProduct() {
  try {
    const newProduct = await productsService.create({
      name: 'Cable UTP Cat6',
      sku: 'CAB-UTP-CAT6',
      description: 'Cable de red categoría 6',
      categoryId: 1,
      unitId: 1,
      costPrice: 5000,
      salePrice: 8000,
      minStock: 50
    });
    console.log('Producto creado:', newProduct);
  } catch (err) {
    console.error('Error al crear producto:', err);
  }
}
```

## 💰 Cotizaciones

### Listar Cotizaciones

```typescript
'use client';

import { quotesService } from '@/lib/services';
import { useEffect, useState } from 'react';
import type { Quote } from '@/lib/types';

export default function QuotesList() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const response = await quotesService.list({
        page: 1,
        limit: 10,
        status: 'ENVIADA', // opcional
        clientId: 1 // opcional
      });
      setQuotes(response.data);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
    }
  };

  return (
    <div>
      {quotes.map(quote => (
        <div key={quote.id}>
          <h3>{quote.quoteNumber}</h3>
          <p>Cliente: {quote.client?.name}</p>
          <p>Total: ${quote.total}</p>
          <p>Estado: {quote.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Crear Cotización

```typescript
import { quotesService } from '@/lib/services';

async function createQuote() {
  try {
    const newQuote = await quotesService.create({
      clientId: 1,
      paymentType: 'CONTADO',
      validUntil: '2026-03-01',
      discount: 10,
      notes: 'Cotización para proyecto X',
      items: [
        {
          productId: 1,
          itemType: 'PRODUCT',
          description: 'Cable UTP Cat6',
          quantity: 100,
          unitPrice: 8000
        },
        {
          itemType: 'SERVICE',
          description: 'Instalación de red',
          quantity: 1,
          unitPrice: 150000
        }
      ]
    });
    console.log('Cotización creada:', newQuote);
  } catch (err) {
    console.error('Error al crear cotización:', err);
  }
}
```

### Verificar Stock de Cotización

```typescript
import { quotesService } from '@/lib/services';

async function checkQuoteStock(quoteId: number) {
  try {
    const stockCheck = await quotesService.checkStock(quoteId);
    if (stockCheck.hasStock) {
      console.log('Hay stock suficiente para todos los productos');
    } else {
      console.log('Stock insuficiente:');
      stockCheck.items.forEach(item => {
        if (!item.hasStock) {
          console.log(`${item.productName}: necesita ${item.requiredQuantity}, disponible ${item.availableStock}`);
        }
      });
    }
  } catch (err) {
    console.error('Error al verificar stock:', err);
  }
}
```

### Actualizar Estado de Cotización

```typescript
import { quotesService } from '@/lib/services';

async function updateQuoteStatus(quoteId: number) {
  try {
    const updated = await quotesService.update(quoteId, {
      status: 'APROBADA'
    });
    console.log('Cotización actualizada:', updated);
  } catch (err) {
    console.error('Error al actualizar:', err);
  }
}
```

## 📊 Inventario

### Listar Almacenes

```typescript
import { inventoryService } from '@/lib/services';

async function loadWarehouses() {
  try {
    const warehouses = await inventoryService.listWarehouses();
    console.log('Almacenes:', warehouses);
  } catch (err) {
    console.error('Error al cargar almacenes:', err);
  }
}
```

### Ver Productos con Stock Bajo

```typescript
'use client';

import { inventoryService } from '@/lib/services';
import { useEffect, useState } from 'react';
import type { LowStockProduct } from '@/lib/types';

export default function LowStockAlert() {
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    try {
      const products = await inventoryService.getLowStock();
      setLowStock(products);
    } catch (err) {
      console.error('Error al cargar productos con stock bajo:', err);
    }
  };

  return (
    <div>
      <h2>⚠️ Productos con Stock Bajo</h2>
      {lowStock.map(product => (
        <div key={product.productId} style={{ color: 'red' }}>
          <h3>{product.productName}</h3>
          <p>Stock actual: {product.currentStock}</p>
          <p>Stock mínimo: {product.minStock}</p>
          <p>Faltante: {Math.abs(product.difference)}</p>
        </div>
      ))}
    </div>
  );
}
```

### Crear Movimiento de Inventario

```typescript
import { inventoryService } from '@/lib/services';

async function addStock() {
  try {
    const movement = await inventoryService.createMovement({
      productId: 1,
      warehouseId: 1,
      type: 'INGRESO',
      reason: 'COMPRA',
      quantity: 100,
      notes: 'Compra a proveedor XYZ'
    });
    console.log('Movimiento creado:', movement);
  } catch (err) {
    console.error('Error al crear movimiento:', err);
  }
}

async function removeStock() {
  try {
    const movement = await inventoryService.createMovement({
      productId: 1,
      warehouseId: 1,
      type: 'EGRESO',
      reason: 'PROYECTO',
      quantity: 50,
      notes: 'Uso en proyecto ABC'
    });
    console.log('Egreso registrado:', movement);
  } catch (err) {
    console.error('Error al crear egreso:', err);
  }
}
```

### Transferir Stock entre Almacenes

```typescript
import { inventoryService } from '@/lib/services';

async function transferStock() {
  try {
    const result = await inventoryService.transferStock({
      productId: 1,
      fromWarehouseId: 1,
      toWarehouseId: 2,
      quantity: 50,
      notes: 'Transferencia para proyecto'
    });
    console.log('Transferencia exitosa:', result);
    console.log('Movimientos creados:', result.movements.length);
  } catch (err) {
    console.error('Error al transferir:', err);
  }
}
```

### Listar Movimientos

```typescript
import { inventoryService } from '@/lib/services';

async function loadMovements() {
  try {
    const response = await inventoryService.listMovements({
      page: 1,
      limit: 20,
      productId: 1, // opcional
      warehouseId: 1, // opcional
      type: 'INGRESO' // opcional
    });
    console.log('Movimientos:', response.data);
  } catch (err) {
    console.error('Error al cargar movimientos:', err);
  }
}
```

## 🏢 Proveedores

### Operaciones Básicas

```typescript
import { suppliersService } from '@/lib/services';

// Listar proveedores
async function loadSuppliers() {
  const response = await suppliersService.list({ page: 1, limit: 10 });
  return response.data;
}

// Crear proveedor
async function createSupplier() {
  const supplier = await suppliersService.create({
    name: 'Proveedor XYZ',
    rut: '98765432-1',
    email: 'ventas@proveedor.com',
    phone: '+56912345678'
  });
  return supplier;
}

// Actualizar proveedor
async function updateSupplier(id: number) {
  const updated = await suppliersService.update(id, {
    phone: '+56987654321'
  });
  return updated;
}

// Eliminar proveedor
async function deleteSupplier(id: number) {
  await suppliersService.delete(id);
}
```

## 🔧 Manejo de Errores

### Patrón Recomendado

```typescript
'use client';

import { clientsService } from '@/lib/services';
import { useState } from 'react';

export default function ClientForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setError(null);
    setLoading(true);

    try {
      await clientsService.create(data);
      // Éxito
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {loading && <div>Cargando...</div>}
      {/* Formulario */}
    </div>
  );
}
```

## 📝 Tipos TypeScript

Todos los tipos están disponibles en `@/lib/types`:

```typescript
import type {
  User,
  Client,
  Product,
  Supplier,
  Quote,
  Warehouse,
  InventoryMovement,
  ClientType,
  QuoteStatus,
  PaymentType,
  ItemType,
  MovementType,
  MovementReason
} from '@/lib/types';
```

## 🎯 Mejores Prácticas

1. **Siempre manejar errores**: Usa try-catch en todas las llamadas a servicios
2. **Mostrar estados de carga**: Indica al usuario cuando se está procesando una petición
3. **Validar autenticación**: Verifica que el usuario esté autenticado antes de acceder a rutas protegidas
4. **Usar tipos TypeScript**: Aprovecha los tipos para evitar errores
5. **Paginación**: Implementa paginación para listas grandes
6. **Feedback al usuario**: Muestra mensajes de éxito o error después de operaciones

## 🚀 Ejemplo Completo: Página de Clientes

```typescript
'use client';

import { clientsService } from '@/lib/services';
import { useEffect, useState } from 'react';
import type { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadClients();
  }, [page, search]);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientsService.list({ 
        page, 
        limit: 10,
        search 
      });
      setClients(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    
    try {
      await clientsService.delete(id);
      loadClients(); // Recargar lista
    } catch (err) {
      alert('Error al eliminar cliente');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Clientes</h1>
      
      <input
        type="text"
        placeholder="Buscar..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.rut}</td>
              <td>{client.email}</td>
              <td>{client.type}</td>
              <td>
                <button onClick={() => handleDelete(client.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button 
          onClick={() => setPage(p => p - 1)} 
          disabled={page === 1}
        >
          Anterior
        </button>
        <span>Página {page} de {totalPages}</span>
        <button 
          onClick={() => setPage(p => p + 1)} 
          disabled={page === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

---

¡Ahora estás listo para consumir todos los servicios del backend! 🎉
