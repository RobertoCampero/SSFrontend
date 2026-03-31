# API Endpoints Documentation

Base URL: `http://localhost:3000/api` 

Todos los endpoints (excepto `/auth`) requieren autenticación mediante JWT en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticación

### Registrar Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Iniciar Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Ver Perfil
```http
GET /api/profile
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

---

## 👥 Clientes

### Listar Clientes
```http
GET /api/clients?page=1&limit=10&search=nombre&type=REGULAR
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 10)
- `search` (opcional): Buscar por nombre, RUT o email
- `type` (opcional): Filtrar por tipo (REGULAR, PREFERENCIAL)

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Empresa ABC",
      "rut": "12345678-9",
      "email": "contacto@empresa.com",
      "phone": "+56912345678",
      "address": "Calle 123, Santiago",
      "type": "REGULAR",
      "contactPerson": "Juan Pérez",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Obtener Cliente por ID
```http
GET /api/clients/:id
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "name": "Empresa ABC",
  "rut": "12345678-9",
  "email": "contacto@empresa.com",
  "phone": "+56912345678",
  "address": "Calle 123, Santiago",
  "type": "REGULAR",
  "contactPerson": "Juan Pérez",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Crear Cliente
```http
POST /api/clients
Content-Type: application/json

{
  "name": "Empresa ABC",
  "rut": "12345678-9",
  "email": "contacto@empresa.com",
  "phone": "+56912345678",
  "address": "Calle 123, Santiago",
  "type": "REGULAR",
  "contactPerson": "Juan Pérez"
}
```

**Campos requeridos:**
- `name`: Nombre del cliente
- `rut`: RUT del cliente (formato chileno)
- `type`: Tipo de cliente (REGULAR o PREFERENCIAL)

**Campos opcionales:**
- `email`: Email de contacto
- `phone`: Teléfono de contacto
- `address`: Dirección física
- `contactPerson`: Persona de contacto

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "name": "Empresa ABC",
  "rut": "12345678-9",
  "email": "contacto@empresa.com",
  "phone": "+56912345678",
  "address": "Calle 123, Santiago",
  "type": "REGULAR",
  "contactPerson": "Juan Pérez",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Actualizar Cliente
```http
PUT /api/clients/:id
Content-Type: application/json

{
  "name": "Empresa ABC Actualizada",
  "phone": "+56987654321"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "name": "Empresa ABC Actualizada",
  "rut": "12345678-9",
  "email": "contacto@empresa.com",
  "phone": "+56987654321",
  "address": "Calle 123, Santiago",
  "type": "REGULAR",
  "contactPerson": "Juan Pérez",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-17T14:20:00.000Z"
}
```

### Eliminar Cliente
```http
DELETE /api/clients/:id
```

**Respuesta exitosa (200):**
```json
{
  "message": "Cliente eliminado exitosamente"
}
```

---

## 📦 Productos

### Listar Productos
```http
GET /api/products?page=1&limit=10&search=cable&categoryId=1
```

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `search` (opcional): Buscar por nombre, SKU o descripción
- `categoryId` (opcional): Filtrar por categoría

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cable UTP Cat6",
      "sku": "CAB-UTP-CAT6",
      "description": "Cable de red categoría 6",
      "categoryId": 1,
      "unitId": 1,
      "costPrice": 5000,
      "salePrice": 8000,
      "minStock": 50,
      "category": {
        "id": 1,
        "name": "Cables"
      },
      "unit": {
        "id": 1,
        "name": "Metro",
        "abbreviation": "m"
      },
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Obtener Producto por ID
```http
GET /api/products/:id
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "name": "Cable UTP Cat6",
  "sku": "CAB-UTP-CAT6",
  "description": "Cable de red categoría 6",
  "categoryId": 1,
  "unitId": 1,
  "costPrice": 5000,
  "salePrice": 8000,
  "minStock": 50,
  "category": {
    "id": 1,
    "name": "Cables"
  },
  "unit": {
    "id": 1,
    "name": "Metro",
    "abbreviation": "m"
  },
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Obtener Stock de Producto
```http
GET /api/products/:id/stock
```

**Respuesta exitosa (200):**
```json
{
  "productId": 1,
  "productName": "Cable UTP Cat6",
  "totalStock": 500,
  "minStock": 50,
  "warehouses": [
    {
      "warehouseId": 1,
      "warehouseName": "Bodega Principal",
      "stock": 300
    },
    {
      "warehouseId": 2,
      "warehouseName": "Bodega Sucursal",
      "stock": 200
    }
  ]
}
```

### Crear Producto
```http
POST /api/products
Content-Type: application/json

{
  "name": "Cable UTP Cat6",
  "sku": "CAB-UTP-CAT6",
  "description": "Cable de red categoría 6",
  "categoryId": 1,
  "unitId": 1,
  "costPrice": 5000,
  "salePrice": 8000,
  "minStock": 50
}
```

**Campos requeridos:**
- `name`: Nombre del producto
- `sku`: Código único del producto
- `categoryId`: ID de la categoría
- `unitId`: ID de la unidad de medida
- `costPrice`: Precio de costo
- `salePrice`: Precio de venta

**Campos opcionales:**
- `description`: Descripción del producto
- `minStock`: Stock mínimo (default: 0)

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "name": "Cable UTP Cat6",
  "sku": "CAB-UTP-CAT6",
  "description": "Cable de red categoría 6",
  "categoryId": 1,
  "unitId": 1,
  "costPrice": 5000,
  "salePrice": 8000,
  "minStock": 50,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Actualizar Producto
```http
PUT /api/products/:id
Content-Type: application/json

{
  "salePrice": 8500,
  "minStock": 100
}
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "name": "Cable UTP Cat6",
  "sku": "CAB-UTP-CAT6",
  "description": "Cable de red categoría 6",
  "categoryId": 1,
  "unitId": 1,
  "costPrice": 5000,
  "salePrice": 8500,
  "minStock": 100,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-17T14:20:00.000Z"
}
```

### Eliminar Producto
```http
DELETE /api/products/:id
```

**Respuesta exitosa (200):**
```json
{
  "message": "Producto eliminado exitosamente"
}
```

---

## 🏢 Proveedores

### Listar Proveedores
```http
GET /api/suppliers?page=1&limit=10&search=proveedor
```

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `search` (opcional): Buscar por nombre, RUT o email

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Proveedor XYZ",
      "rut": "98765432-1",
      "email": "ventas@proveedor.com",
      "phone": "+56912345678",
      "address": "Av. Principal 456",
      "contactPerson": "María González",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Obtener Proveedor por ID
```http
GET /api/suppliers/:id
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "name": "Proveedor XYZ",
  "rut": "98765432-1",
  "email": "ventas@proveedor.com",
  "phone": "+56912345678",
  "address": "Av. Principal 456",
  "contactPerson": "María González",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Crear Proveedor
```http
POST /api/suppliers
Content-Type: application/json

{
  "name": "Proveedor XYZ",
  "rut": "98765432-1",
  "email": "ventas@proveedor.com",
  "phone": "+56912345678",
  "address": "Av. Principal 456",
  "contactPerson": "María González"
}
```

**Campos requeridos:**
- `name`: Nombre del proveedor
- `rut`: RUT del proveedor

**Campos opcionales:**
- `email`: Email de contacto
- `phone`: Teléfono de contacto
- `address`: Dirección física
- `contactPerson`: Persona de contacto

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "name": "Proveedor XYZ",
  "rut": "98765432-1",
  "email": "ventas@proveedor.com",
  "phone": "+56912345678",
  "address": "Av. Principal 456",
  "contactPerson": "María González",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Actualizar Proveedor
```http
PUT /api/suppliers/:id
Content-Type: application/json

{
  "phone": "+56987654321"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "name": "Proveedor XYZ",
  "rut": "98765432-1",
  "email": "ventas@proveedor.com",
  "phone": "+56987654321",
  "address": "Av. Principal 456",
  "contactPerson": "María González",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-17T14:20:00.000Z"
}
```

### Eliminar Proveedor
```http
DELETE /api/suppliers/:id
```

**Respuesta exitosa (200):**
```json
{
  "message": "Proveedor eliminado exitosamente"
}
```

---

## 💰 Cotizaciones

### Listar Cotizaciones
```http
GET /api/quotes?page=1&limit=10&search=COT&status=ENVIADA&clientId=1
```

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `search` (opcional): Buscar por número de cotización o nombre de cliente
- `status` (opcional): Filtrar por estado (BORRADOR, ENVIADA, APROBADA, RECHAZADA, VENCIDA)
- `clientId` (opcional): Filtrar por cliente

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 1,
      "quoteNumber": "COT-2026-0001",
      "clientId": 1,
      "client": {
        "id": 1,
        "name": "Empresa ABC",
        "rut": "12345678-9"
      },
      "status": "ENVIADA",
      "paymentType": "CONTADO",
      "validUntil": "2026-03-01T00:00:00.000Z",
      "subtotal": 950000,
      "discount": 10,
      "total": 855000,
      "notes": "Cotización para proyecto X",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 75,
    "page": 1,
    "limit": 10,
    "totalPages": 8
  }
}
```

### Obtener Cotización por ID
```http
GET /api/quotes/:id
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "quoteNumber": "COT-2026-0001",
  "clientId": 1,
  "client": {
    "id": 1,
    "name": "Empresa ABC",
    "rut": "12345678-9",
    "email": "contacto@empresa.com"
  },
  "status": "ENVIADA",
  "paymentType": "CONTADO",
  "validUntil": "2026-03-01T00:00:00.000Z",
  "subtotal": 950000,
  "discount": 10,
  "total": 855000,
  "notes": "Cotización para proyecto X",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "product": {
        "id": 1,
        "name": "Cable UTP Cat6",
        "sku": "CAB-UTP-CAT6"
      },
      "itemType": "PRODUCT",
      "description": "Cable UTP Cat6",
      "quantity": 100,
      "unitPrice": 8000,
      "total": 800000
    },
    {
      "id": 2,
      "productId": null,
      "itemType": "SERVICE",
      "description": "Instalación de red",
      "quantity": 1,
      "unitPrice": 150000,
      "total": 150000
    }
  ],
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Verificar Stock de Cotización
```http
GET /api/quotes/:id/check-stock
```

**Respuesta exitosa (200):**
```json
{
  "hasStock": true,
  "items": [
    {
      "productId": 1,
      "productName": "Cable UTP Cat6",
      "requiredQuantity": 100,
      "availableStock": 500,
      "hasStock": true
    }
  ]
}
```

### Crear Cotización
```http
POST /api/quotes
Content-Type: application/json

{
  "clientId": 1,
  "paymentType": "CONTADO",
  "validUntil": "2026-03-01",
  "notes": "Cotización para proyecto X",
  "discount": 10,
  "items": [
    {
      "productId": 1,
      "itemType": "PRODUCT",
      "description": "Cable UTP Cat6",
      "quantity": 100,
      "unitPrice": 8000
    },
    {
      "itemType": "SERVICE",
      "description": "Instalación de red",
      "quantity": 1,
      "unitPrice": 150000
    }
  ]
}
```

**Campos requeridos:**
- `clientId`: ID del cliente
- `paymentType`: Tipo de pago (CONTADO, CREDITO_30, CREDITO_60, CREDITO_90)
- `validUntil`: Fecha de validez (formato: YYYY-MM-DD)
- `items`: Array de items de la cotización

**Campos de items:**
- `itemType`: Tipo de item (PRODUCT o SERVICE)
- `description`: Descripción del item
- `quantity`: Cantidad
- `unitPrice`: Precio unitario
- `productId`: ID del producto (solo para items tipo PRODUCT)

**Campos opcionales:**
- `notes`: Notas adicionales
- `discount`: Descuento en porcentaje (0-100)

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "quoteNumber": "COT-2026-0001",
  "clientId": 1,
  "status": "BORRADOR",
  "paymentType": "CONTADO",
  "validUntil": "2026-03-01T00:00:00.000Z",
  "subtotal": 950000,
  "discount": 10,
  "total": 855000,
  "notes": "Cotización para proyecto X",
  "items": [...],
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Actualizar Cotización
```http
PUT /api/quotes/:id
Content-Type: application/json

{
  "status": "ENVIADA",
  "discount": 15,
  "items": [
    {
      "productId": 1,
      "itemType": "PRODUCT",
      "description": "Cable UTP Cat6",
      "quantity": 150,
      "unitPrice": 8000
    }
  ]
}
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "quoteNumber": "COT-2026-0001",
  "clientId": 1,
  "status": "ENVIADA",
  "paymentType": "CONTADO",
  "validUntil": "2026-03-01T00:00:00.000Z",
  "subtotal": 1200000,
  "discount": 15,
  "total": 1020000,
  "notes": "Cotización para proyecto X",
  "items": [...],
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-17T14:20:00.000Z"
}
```

### Aprobar Cotización y Reducir Inventario
```http
PUT /api/quotes/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "APROBADA",
  "warehouseId": "1"
}
```

**Descripción:**
Este endpoint aprueba una cotización y automáticamente reduce el inventario de los productos incluidos en la cotización desde el almacén especificado.

**Campos requeridos:**
- `status`: Debe ser "APROBADA"
- `warehouseId`: ID del almacén desde donde se reducirá el inventario

**Respuesta exitosa (200):**
```json
{
  "quote": {
    "id": 1,
    "quoteNumber": "COT-2026-0001",
    "clientId": 1,
    "status": "APROBADA",
    "paymentType": "CONTADO",
    "validUntil": "2026-03-01T00:00:00.000Z",
    "subtotal": 950000,
    "discount": 10,
    "total": 855000,
    "notes": "Cotización para proyecto X",
    "items": [...],
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-17T14:20:00.000Z"
  },
  "inventoryMovements": [
    {
      "id": 1,
      "productId": 1,
      "warehouseId": 1,
      "type": "EGRESO",
      "reason": "VENTA",
      "quantity": 100,
      "notes": "Reducción por aprobación de cotización COT-2026-0001",
      "referenceId": 1,
      "createdAt": "2026-01-17T14:20:00.000Z"
    }
  ],
  "message": "Cotización aprobada y inventario reducido exitosamente"
}
```

**Errores posibles:**
- `400`: Stock insuficiente en el almacén especificado
- `404`: Cotización no encontrada
- `400`: La cotización ya está aprobada o en un estado que no permite aprobación

### Eliminar Cotización
```http
DELETE /api/quotes/:id
```

**Respuesta exitosa (200):**
```json
{
  "message": "Cotización eliminada exitosamente"
}
```

---

## 📊 Inventario

### Listar Almacenes
```http
GET /api/inventory/warehouses
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "Bodega Principal",
    "location": "Santiago Centro",
    "isActive": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Bodega Sucursal",
    "location": "Providencia",
    "isActive": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
]
```

### Obtener Almacén por ID
```http
GET /api/inventory/warehouses/:id
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "name": "Bodega Principal",
  "location": "Santiago Centro",
  "isActive": true,
  "stock": [
    {
      "productId": 1,
      "product": {
        "id": 1,
        "name": "Cable UTP Cat6",
        "sku": "CAB-UTP-CAT6"
      },
      "quantity": 300
    }
  ],
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Listar Movimientos
```http
GET /api/inventory/movements?page=1&limit=10&productId=1&warehouseId=1&type=INGRESO
```

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `productId` (opcional): Filtrar por producto
- `warehouseId` (opcional): Filtrar por almacén
- `type` (opcional): Filtrar por tipo (INGRESO, EGRESO, TRANSFERENCIA, AJUSTE)

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 1,
      "productId": 1,
      "product": {
        "id": 1,
        "name": "Cable UTP Cat6",
        "sku": "CAB-UTP-CAT6"
      },
      "warehouseId": 1,
      "warehouse": {
        "id": 1,
        "name": "Bodega Principal"
      },
      "type": "INGRESO",
      "reason": "COMPRA",
      "quantity": 100,
      "notes": "Compra a proveedor XYZ",
      "referenceId": null,
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

### Obtener Productos con Stock Bajo
```http
GET /api/inventory/low-stock
```

**Respuesta exitosa (200):**
```json
[
  {
    "productId": 1,
    "productName": "Cable UTP Cat6",
    "sku": "CAB-UTP-CAT6",
    "minStock": 50,
    "currentStock": 30,
    "difference": -20,
    "warehouses": [
      {
        "warehouseId": 1,
        "warehouseName": "Bodega Principal",
        "stock": 20
      },
      {
        "warehouseId": 2,
        "warehouseName": "Bodega Sucursal",
        "stock": 10
      }
    ]
  }
]
```

### Crear Movimiento de Inventario
```http
POST /api/inventory/movements
Content-Type: application/json

{
  "productId": 1,
  "warehouseId": 1,
  "type": "INGRESO",
  "reason": "COMPRA",
  "quantity": 100,
  "notes": "Compra a proveedor XYZ",
  "referenceId": null
}
```

**Tipos de Movimiento:**
- `INGRESO`: Entrada de stock
- `EGRESO`: Salida de stock
- `TRANSFERENCIA`: Transferencia entre almacenes
- `AJUSTE`: Ajuste manual

**Razones:**
- `COMPRA`: Compra a proveedor
- `PROYECTO`: Uso en proyecto
- `KIT`: Armado de kit
- `DEVOLUCION`: Devolución
- `AJUSTE_MANUAL`: Ajuste manual
- `VENTA`: Venta directa
- `SERVICIO`: Uso en servicio

**Campos requeridos:**
- `productId`: ID del producto
- `warehouseId`: ID del almacén
- `type`: Tipo de movimiento
- `reason`: Razón del movimiento
- `quantity`: Cantidad (número positivo)

**Campos opcionales:**
- `notes`: Notas adicionales
- `referenceId`: ID de referencia (ej: ID de compra, proyecto, etc.)

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "productId": 1,
  "warehouseId": 1,
  "type": "INGRESO",
  "reason": "COMPRA",
  "quantity": 100,
  "notes": "Compra a proveedor XYZ",
  "referenceId": null,
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

### Transferir Stock entre Almacenes
```http
POST /api/inventory/transfer
Content-Type: application/json

{
  "productId": 1,
  "fromWarehouseId": 1,
  "toWarehouseId": 2,
  "quantity": 50,
  "notes": "Transferencia para proyecto"
}
```

**Campos requeridos:**
- `productId`: ID del producto
- `fromWarehouseId`: ID del almacén origen
- `toWarehouseId`: ID del almacén destino
- `quantity`: Cantidad a transferir

**Campos opcionales:**
- `notes`: Notas adicionales

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "movements": [
    {
      "id": 1,
      "productId": 1,
      "warehouseId": 1,
      "type": "EGRESO",
      "reason": "TRANSFERENCIA",
      "quantity": 50,
      "notes": "Transferencia para proyecto",
      "createdAt": "2026-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "productId": 1,
      "warehouseId": 2,
      "type": "INGRESO",
      "reason": "TRANSFERENCIA",
      "quantity": 50,
      "notes": "Transferencia para proyecto",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 📝 Respuestas de Error

Todos los endpoints retornan errores en el siguiente formato:

```json
{
  "error": "Mensaje de error descriptivo"
}
```

**Códigos de Estado HTTP:**
- `200`: OK - Operación exitosa
- `201`: Created - Recurso creado exitosamente
- `400`: Bad Request - Error en los datos enviados
- `401`: Unauthorized - No autenticado o token inválido
- `404`: Not Found - Recurso no encontrado
- `500`: Internal Server Error - Error del servidor

**Ejemplos de errores comunes:**

```json
{
  "error": "Token inválido o expirado"
}
```

```json
{
  "error": "Cliente no encontrado"
}
```

```json
{
  "error": "Stock insuficiente para realizar el movimiento"
}
```

```json
{
  "error": "El SKU ya existe"
}
```

---

## 🔄 Paginación

Las respuestas paginadas tienen el siguiente formato:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Campos de paginación:**
- `total`: Total de registros
- `page`: Página actual
- `limit`: Items por página
- `totalPages`: Total de páginas

---

## 📌 Notas Importantes

### 1. BigInt
Los IDs en la base de datos son BigInt. Al enviar IDs en el body, usa números normales (se convertirán automáticamente).

```json
{
  "clientId": 1
}
```

### 2. Autenticación
Todos los endpoints (excepto `/auth/register` y `/auth/login`) requieren el header `Authorization: Bearer <token>`.

**Ejemplo:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:3000/api/clients
```

### 3. Validación de Stock
Antes de crear egresos, el sistema valida que haya stock suficiente en el almacén especificado.

### 4. Números de Cotización
Se generan automáticamente en formato `COT-YYYY-NNNN` (ej: COT-2026-0001).

### 5. Transferencias
Las transferencias crean dos movimientos automáticamente:
- Un EGRESO en el almacén origen
- Un INGRESO en el almacén destino

### 6. Estados de Cotización
- `BORRADOR`: Cotización en edición
- `ENVIADA`: Cotización enviada al cliente
- `APROBADA`: Cotización aprobada por el cliente
- `RECHAZADA`: Cotización rechazada por el cliente
- `VENCIDA`: Cotización vencida (fecha de validez expirada)

### 7. Tipos de Pago
- `CONTADO`: Pago al contado
- `CREDITO_30`: Crédito a 30 días
- `CREDITO_60`: Crédito a 60 días
- `CREDITO_90`: Crédito a 90 días

### 8. Tipos de Cliente
- `REGULAR`: Cliente regular
- `PREFERENCIAL`: Cliente preferencial (puede tener descuentos especiales)

---

## 🧪 Ejemplos de Uso con cURL

### Registrar y autenticar
```bash
# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Iniciar sesión
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Crear cliente
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Empresa ABC",
    "rut": "12345678-9",
    "email": "contacto@empresa.com",
    "type": "REGULAR"
  }'
```

### Crear producto
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Cable UTP Cat6",
    "sku": "CAB-UTP-CAT6",
    "categoryId": 1,
    "unitId": 1,
    "costPrice": 5000,
    "salePrice": 8000
  }'
```

### Crear cotización
```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clientId": 1,
    "paymentType": "CONTADO",
    "validUntil": "2026-03-01",
    "items": [
      {
        "productId": 1,
        "itemType": "PRODUCT",
        "description": "Cable UTP Cat6",
        "quantity": 100,
        "unitPrice": 8000
      }
    ]
  }'
```

### Crear movimiento de inventario
```bash
curl -X POST http://localhost:3000/api/inventory/movements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 1,
    "warehouseId": 1,
    "type": "INGRESO",
    "reason": "COMPRA",
    "quantity": 100
  }'
```

### Aprobar cotización y reducir inventario
```bash
curl -X PUT http://localhost:3000/api/quotes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "APROBADA",
    "warehouseId": "1"
  }'
```

---

## 📚 Recursos Adicionales

Para más información sobre la implementación del backend, consulta:
- Esquema de base de datos: `prisma/schema.prisma`
- Rutas de API: `src/app/api/`
- Modelos de datos: Definidos en Prisma Schema

---

**Última actualización:** 17 de febrero de 2026
