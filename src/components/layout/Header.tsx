'use client'

import { usePathname, useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import { authService } from '@/lib/services'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from './NotificationBell'

const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  'users': 'Usuarios',
  'roles': 'Roles',
  'permissions': 'Permisos',
  'clients': 'Clientes',
  'suppliers': 'Proveedores',
  'products': 'Productos',
  'categories': 'Categorías',
  'units': 'Unidades',
  'warehouses': 'Almacenes',
  'stock': 'Stock',
  'movements': 'Movimientos',
  'kits': 'Kits',
  'quotes': 'Cotizaciones',
  'cotizaciones': 'Cotizaciones',
  'nueva': 'Nueva Cotización',
  'clientes': 'Clientes',
  'catalogo': 'Catálogo',
  'service-orders': 'Órdenes de Servicio',
  'reports': 'Reportes',
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const segments = pathname.split('/').filter(Boolean)
  
  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  return (
    <header className="relative z-[100] flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-sm px-6">
      <div className="flex-1">
        {/* Espacio vacío - eliminado breadcrumbs */}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="h-6 w-px bg-gray-200 mx-1" />
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-all duration-200 cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
            <User size={15} />
          </div>
          <div className="text-sm hidden sm:block">
            <div className="flex flex-col">
              <p className="font-semibold text-gray-800 leading-tight">
  {user?.name || 
   user?.nombre || 
   user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` :
   user?.primerNombre && user?.apellidoPaterno ? `${user.primerNombre} ${user.apellidoPaterno}` :
   user?.fullname || 
   user?.fullName || 
   user?.username || 
   'Admin'}
</p>
              <p className="text-gray-400 text-[11px] leading-tight">{user?.email || 'admin@empresa.com'}</p>
            </div>
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleLogout}
          aria-label="Cerrar sesión" 
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          title="Cerrar sesión"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  )
}
