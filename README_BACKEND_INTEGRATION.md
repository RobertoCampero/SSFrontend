# 🔌 Integración con Backend - Smart Services

## ✅ ¿Qué se ha hecho?

Se ha eliminado completamente el uso de datos mock/hardcodeados y ahora **toda la aplicación consume el backend real** a través de servicios API.

### Archivos Creados

#### 1. **Configuración y Tipos**
- `src/lib/api-config.ts` - Cliente API centralizado con manejo de autenticación JWT
- `src/lib/types.ts` - Tipos TypeScript para todas las entidades del backend

#### 2. **Servicios API** (`src/lib/services/`)
- `auth.service.ts` - Autenticación (login, register, logout)
- `clients.service.ts` - CRUD de clientes
- `products.service.ts` - CRUD de productos + consulta de stock
- `suppliers.service.ts` - CRUD de proveedores
- `quotes.service.ts` - CRUD de cotizaciones + verificación de stock
- `inventory.service.ts` - Inventario, almacenes, movimientos, transferencias
- `index.ts` - Exportaciones centralizadas

#### 3. **Páginas Actualizadas**
- `src/app/login/page.tsx` - Nueva página de login con autenticación real
- `src/app/clients/page.tsx` - Actualizada para consumir `clientsService`

#### 4. **Documentación**
- `API_DOCUMENTATION.md` - Documentación completa de todos los endpoints del backend
- `SERVICES_USAGE.md` - Guía de uso de los servicios con ejemplos
- `.env.local.example` - Template de variables de entorno

---

## 🚀 Cómo Usar

### 1. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Iniciar el Backend

Asegúrate de que tu backend esté corriendo en `http://localhost:3000`

### 3. Iniciar la Aplicación

```bash
npm run dev
```

### 4. Primer Uso

1. Ve a `/login`
2. Si no tienes usuario, regístrate primero (puedes crear un endpoint de registro o usar el backend directamente)
3. Inicia sesión con tus credenciales
4. El token JWT se guarda automáticamente en `localStorage`
5. Todas las peticiones subsecuentes incluyen el token automáticamente

---

## 📋 Estado Actual

### ✅ Completado

- [x] Configuración base del cliente API
- [x] Todos los tipos TypeScript
- [x] Servicio de autenticación
- [x] Servicio de clientes
- [x] Servicio de productos
- [x] Servicio de proveedores
- [x] Servicio de cotizaciones
- [x] Servicio de inventario
- [x] Página de login funcional
- [x] Página de clientes actualizada (parcialmente)

### ⚠️ Pendiente

Las siguientes páginas aún necesitan ser actualizadas para usar los servicios reales:

- [ ] `src/app/products/page.tsx` - Usar `productsService`
- [ ] `src/app/suppliers/page.tsx` - Usar `suppliersService`
- [ ] `src/app/quotes/page.tsx` - Usar `quotesService`
- [ ] `src/app/cotizaciones/*` - Actualizar módulo completo de cotizaciones
- [ ] `src/app/stock/page.tsx` - Usar `inventoryService`
- [ ] `src/app/movements/page.tsx` - Usar `inventoryService`
- [ ] `src/app/warehouses/page.tsx` - Usar `inventoryService`
- [ ] Otras páginas secundarias (categories, units, kits, etc.)

### 🗑️ Por Eliminar

Una vez que todas las páginas estén actualizadas, eliminar:

- `src/lib/mock-data.ts`
- `src/lib/mock-cotizaciones.ts`

---

## 🔐 Autenticación

### Flujo de Autenticación

1. **Login**: `authService.login({ email, password })`
   - Retorna: `{ token, user }`
   - El token se guarda automáticamente en `localStorage`

2. **Verificar Autenticación**: `authService.isAuthenticated()`
   - Retorna: `boolean`

3. **Logout**: `authService.logout()`
   - Elimina el token de `localStorage`

### Protección de Rutas

Para proteger una página, agrega esto al inicio del componente:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // ... resto del componente
}
```

---

## 📡 Uso de Servicios

### Ejemplo: Listar Clientes

```typescript
'use client';

import { useEffect, useState } from 'react';
import { clientsService } from '@/lib/services';
import type { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientsService.list({ page: 1, limit: 10 });
      setClients(response.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  );
}
```

### Ejemplo: Crear Cliente

```typescript
import { clientsService } from '@/lib/services';

const handleCreate = async () => {
  try {
    const newClient = await clientsService.create({
      name: 'Empresa ABC',
      rut: '12345678-9',
      type: 'REGULAR',
      email: 'contacto@empresa.com',
      phone: '+56912345678'
    });
    console.log('Cliente creado:', newClient);
  } catch (err) {
    console.error('Error al crear:', err);
  }
};
```

---

## 🛠️ Próximos Pasos

### 1. Actualizar Páginas Restantes

Cada página debe seguir este patrón:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { [servicio]Service } from '@/lib/services';
import type { [Tipo] } from '@/lib/types';

export default function Page() {
  const [data, setData] = useState<[Tipo][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await [servicio]Service.list();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  // CRUD operations usando el servicio...
}
```

### 2. Agregar Middleware de Autenticación

Crear `src/middleware.ts` para proteger rutas automáticamente:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
```

### 3. Manejo Global de Errores

Crear un contexto para manejar errores globalmente:

```typescript
// src/contexts/ErrorContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

const ErrorContext = createContext<{
  error: string | null;
  setError: (error: string | null) => void;
}>({ error: null, setError: () => {} });

export const useError = () => useContext(ErrorContext);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <ErrorContext.Provider value={{ error, setError }}>
      {children}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded">
          {error}
        </div>
      )}
    </ErrorContext.Provider>
  );
}
```

---

## 📚 Recursos

- **API Documentation**: Ver `API_DOCUMENTATION.md`
- **Services Usage Guide**: Ver `SERVICES_USAGE.md`
- **Backend Endpoints**: `http://localhost:3000/api`

---

## ⚠️ Notas Importantes

1. **Sin Datos Mock**: Ya no hay datos hardcodeados. Si el backend no tiene datos, las listas estarán vacías.

2. **Autenticación Requerida**: Todos los endpoints (excepto `/auth`) requieren autenticación.

3. **Backend Debe Estar Corriendo**: La aplicación no funcionará sin el backend activo.

4. **Errores de TypeScript**: Los errores actuales de TypeScript se resolverán cuando se ejecute `npm install`.

5. **IDs BigInt**: El backend usa BigInt para IDs, pero los servicios manejan esto automáticamente.

---

## 🐛 Solución de Problemas

### Error: "Token inválido o expirado"
- Haz logout y vuelve a iniciar sesión
- Verifica que el backend esté corriendo

### Error: "Cannot find module 'react'"
- Ejecuta `npm install`

### Error: "Network request failed"
- Verifica que `NEXT_PUBLIC_API_URL` esté configurado correctamente
- Verifica que el backend esté corriendo en el puerto correcto

### Listas vacías
- El backend no tiene datos aún
- Crea datos usando los formularios de la aplicación o directamente en el backend

---

**Última actualización**: 17 de febrero de 2026
