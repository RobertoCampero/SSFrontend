# Sistema de Notificaciones Toast

## ✅ Implementado

Se ha creado un sistema de notificaciones toast integrado para reemplazar los `alert()` del navegador.

## 📦 Componentes Creados

1. **`src/components/ui/Toast.tsx`** - Componente visual de las notificaciones
2. **`src/contexts/ToastContext.tsx`** - Contexto global para manejar notificaciones
3. **Integrado en `src/components/layout/LayoutContent.tsx`** - Disponible en toda la app

## 🎨 Tipos de Notificaciones

- **Success** (verde) - Para operaciones exitosas
- **Error** (rojo) - Para errores
- **Warning** (amarillo) - Para advertencias
- **Info** (azul) - Para información general

## 💻 Cómo Usar

### 1. Importar el hook

```typescript
import { useToast } from '@/contexts/ToastContext'
```

### 2. Usar en el componente

```typescript
export default function MiComponente() {
  const toast = useToast()
  
  // Ejemplos de uso:
  
  // Éxito
  toast.success('Título', 'Mensaje opcional')
  
  // Error
  toast.error('Error', 'Descripción del error')
  
  // Advertencia
  toast.warning('Atención', 'Mensaje de advertencia')
  
  // Información
  toast.info('Info', 'Mensaje informativo')
}
```

## 🔄 Reemplazar Alerts Existentes

### Antes:
```typescript
alert('Por favor selecciona un archivo')
```

### Después:
```typescript
toast.warning('Archivo requerido', 'Por favor selecciona un archivo')
```

### Antes:
```typescript
alert('✅ Operación exitosa!')
```

### Después:
```typescript
toast.success('Operación exitosa', 'Los cambios se guardaron correctamente')
```

## 📝 Páginas Actualizadas

- ✅ `src/app/products/page.tsx` - Completado

## 📋 Páginas Pendientes

Las siguientes páginas aún tienen `alert()` y deben ser actualizadas:

- [ ] `src/app/servicios/page.tsx` (8 alerts)
- [ ] `src/app/roles/page.tsx` (7 alerts)
- [ ] `src/app/pos/page.tsx` (6 alerts)
- [ ] `src/app/users/page.tsx` (6 alerts)
- [ ] `src/app/stock/page.tsx` (3 alerts)
- [ ] `src/app/warehouses/page.tsx` (3 alerts)

## 🎯 Patrón de Reemplazo

Para cada archivo:

1. Importar el hook:
```typescript
import { useToast } from '@/contexts/ToastContext'
```

2. Declarar en el componente:
```typescript
const toast = useToast()
```

3. Reemplazar cada `alert()` según el contexto:
   - Validaciones → `toast.warning()`
   - Éxitos → `toast.success()`
   - Errores → `toast.error()`
   - Información → `toast.info()`

## ⚙️ Configuración

- **Duración por defecto**: 5 segundos
- **Posición**: Esquina superior derecha
- **Animación**: Deslizamiento desde la derecha
- **Cierre**: Automático o manual (botón X)

## 🎨 Personalización

Para cambiar la duración de una notificación específica:

```typescript
toast.showToast('success', 'Título', 'Mensaje', 10000) // 10 segundos
```
