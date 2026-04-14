'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  Building2,
  Truck,
  Warehouse,
  Package,
  Tags,
  Ruler,
  ArrowLeftRight,
  Boxes,
  FileText,
  Wrench,
  BarChart3,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  ShoppingCart,
  User,
  CreditCard,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string; permission?: string }[]
  permission?: string
  anyPermission?: string[]
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Punto de Venta', href: '/pos', icon: <ShoppingCart size={20} />, permission: 'quotes.create' },
  { label: 'Servicios', href: '/servicios', icon: <Wrench size={20} />, permission: 'quotes.create' },
  { label: 'Cotizaciones', href: '/cotizaciones', icon: <FileText size={20} />, permission: 'quotes.view' },
  { label: 'Créditos', href: '/credits', icon: <CreditCard size={20} />, permission: 'quotes.view' },
  { label: 'Clientes', href: '/clients', icon: <Building2 size={20} />, permission: 'clients.view' },
  { label: 'Proveedores', href: '/suppliers', icon: <Truck size={20} />, permission: 'suppliers.view' },
  {
    label: 'Inventario',
    icon: <Package size={20} />,
    anyPermission: ['products.view', 'products.stock', 'kits.view'],
    children: [
      { label: 'Productos', href: '/products', permission: 'products.view' },
      { label: 'Categorías', href: '/categories', permission: 'products.view' },
      { label: 'Unidades', href: '/units', permission: 'products.view' },
      { label: 'Almacenes', href: '/warehouses', permission: 'products.stock' },
      { label: 'Stock', href: '/stock', permission: 'products.stock' },
      { label: 'Transferencias', href: '/transfers', permission: 'products.stock' },
      { label: 'Kits', href: '/kits', permission: 'kits.view' },
    ],
  },
  { label: 'Proyectos', href: '/projects', icon: <Wrench size={20} />, permission: 'projects.view' },
  {
    label: 'Usuarios y Acceso',
    icon: <Users size={20} />,
    anyPermission: ['users.view', 'roles.view', 'permissions.view'],
    children: [
      { label: 'Usuarios', href: '/users', permission: 'users.view' },
      { label: 'Roles', href: '/roles', permission: 'roles.view' },
      { label: 'Permisos', href: '/permissions', permission: 'permissions.view' },
    ],
  },
  { label: 'Reportes', href: '/reports', icon: <BarChart3 size={20} />, permission: 'excel.export' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { hasPermission, hasAnyPermission, isAdmin, user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(['Inventario'])

  const canAccessItem = (item: NavItem): boolean => {
    // Dashboard: solo para administradores
    if (item.label === 'Dashboard') {
      return isAdmin()
    }
    
    // Punto de Venta: solo para empleados (NO para admins)
    if (item.label === 'Punto de Venta') {
      return !isAdmin() && hasPermission('quotes.create')
    }
    
    // Admin tiene acceso a todo lo demás
    if (isAdmin()) return true
    
    // Si no tiene permisos definidos, es accesible para todos
    if (!item.permission && !item.anyPermission) return true
    
    // Verificar permiso único
    if (item.permission) return hasPermission(item.permission)
    
    // Verificar cualquier permiso de la lista
    if (item.anyPermission) return hasAnyPermission(item.anyPermission)
    
    return false
  }

  const filterNavigation = (): NavItem[] => {
    return navigation.filter(item => {
      if (!canAccessItem(item)) return false
      
      // Si tiene hijos, filtrar los hijos también
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          if (isAdmin()) return true
          if (!child.permission) return true
          return hasPermission(child.permission)
        })
        
        // Solo mostrar el grupo si tiene al menos un hijo accesible
        if (filteredChildren.length === 0) return false
        
        // Actualizar los hijos filtrados
        item.children = filteredChildren
      }
      
      return true
    })
  }

  const visibleNavigation = filterNavigation()

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={clsx(
        'flex flex-col bg-gradient-to-b from-white to-white text-black transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-2 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center">
            <div className="flex h-52 w-52 items-center justify-center overflow-hidden">
              <Image 
                src="/logo2.png" 
                alt="Smart Services Logo" 
                width={400}
                height={400}
                className="object-contain"
              />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={clsx(
            'rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? (
            <Image 
              src="/logo3.png" 
              alt="Expandir menú" 
              width={20}
              height={20}
              className="object-contain"
            />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2 scrollbar-thin">
        {visibleNavigation.map((item) => {
          if (item.children) {
            const isOpen = openGroups.includes(item.label)
            const hasActiveChild = item.children.some((c) => isActive(c.href))

            // Ocultar completamente "Inventario" y "Usuarios y Acceso" cuando está colapsado
            if (collapsed && (item.label === 'Inventario' || item.label === 'Usuarios y Acceso')) {
              return null
            }

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={clsx(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    hasActiveChild
                      ? 'bg-gray-100 text-blue-600 shadow-sm'
                      : 'text-blue-600 hover:bg-gray-50 hover:text-blue-700'
                  )}
                >
                  <span className={clsx(
                    'flex-shrink-0 transition-colors',
                    hasActiveChild ? 'text-blue-400' : 'text-blue-500 group-hover:text-blue-300'
                  )}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown size={16} className={clsx(
                        'transition-transform duration-200 text-blue-500',
                        !isOpen && '-rotate-90'
                      )} />
                    </>
                  )}
                </button>
                {isOpen && !collapsed && (
                  <div className="ml-4 mt-0.5 space-y-0.5 pl-4 border-l border-white/5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          'block rounded-lg px-3 py-1.5 text-sm transition-all duration-200',
                          isActive(child.href)
                            ? 'bg-blue-50 text-blue-800 font-medium'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-gray-50'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive(item.href!)
                  ? 'bg-gray-100 text-blue-600 shadow-sm'
                  : 'text-blue-600 hover:bg-gray-50 hover:text-blue-700'
              )}
            >
              <span className={clsx(
                'flex-shrink-0 transition-colors',
                isActive(item.href!) ? 'text-blue-400' : 'text-blue-500 group-hover:text-blue-300'
              )}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-500 text-center">Smart Services S.R.L. v0.1</p>
        </div>
      )}
    </aside>
  )
}
