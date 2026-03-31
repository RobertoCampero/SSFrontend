// Traducciones de códigos de permisos al español
export const permissionTranslations: Record<string, { name: string; description: string }> = {
  // Clientes
  'clients.view': { name: 'Ver Clientes', description: 'Ver listado de clientes' },
  'clients.create': { name: 'Crear Clientes', description: 'Crear nuevos clientes' },
  'clients.update': { name: 'Actualizar Clientes', description: 'Editar información de clientes' },
  'clients.delete': { name: 'Eliminar Clientes', description: 'Eliminar clientes del sistema' },
  
  // Productos
  'products.view': { name: 'Ver Productos', description: 'Ver catálogo de productos' },
  'products.create': { name: 'Crear Productos', description: 'Agregar nuevos productos' },
  'products.update': { name: 'Actualizar Productos', description: 'Editar información de productos' },
  'products.delete': { name: 'Eliminar Productos', description: 'Eliminar productos del catálogo' },
  
  // Categorías
  'categories.view': { name: 'Ver Categorías', description: 'Ver categorías de productos' },
  'categories.create': { name: 'Crear Categorías', description: 'Crear nuevas categorías' },
  'categories.update': { name: 'Actualizar Categorías', description: 'Editar categorías existentes' },
  'categories.delete': { name: 'Eliminar Categorías', description: 'Eliminar categorías' },
  
  // Proveedores
  'suppliers.view': { name: 'Ver Proveedores', description: 'Ver listado de proveedores' },
  'suppliers.create': { name: 'Crear Proveedores', description: 'Registrar nuevos proveedores' },
  'suppliers.update': { name: 'Actualizar Proveedores', description: 'Editar información de proveedores' },
  'suppliers.delete': { name: 'Eliminar Proveedores', description: 'Eliminar proveedores' },
  
  // Cotizaciones
  'quotes.view': { name: 'Ver Cotizaciones', description: 'Ver listado de cotizaciones' },
  'quotes.create': { name: 'Crear Cotizaciones', description: 'Crear nuevas cotizaciones' },
  'quotes.update': { name: 'Actualizar Cotizaciones', description: 'Editar cotizaciones' },
  'quotes.delete': { name: 'Eliminar Cotizaciones', description: 'Eliminar cotizaciones' },
  'quotes.approve': { name: 'Aprobar Cotizaciones', description: 'Aprobar o rechazar cotizaciones' },
  
  // Inventario
  'inventory.view': { name: 'Ver Inventario', description: 'Ver stock y almacenes' },
  'inventory.movements': { name: 'Movimientos de Inventario', description: 'Registrar movimientos de stock' },
  'inventory.transfer': { name: 'Transferir Stock', description: 'Transferir productos entre almacenes' },
  'inventory.adjust': { name: 'Ajustar Inventario', description: 'Realizar ajustes de inventario' },
  
  // Almacenes
  'warehouses.view': { name: 'Ver Almacenes', description: 'Ver listado de almacenes' },
  'warehouses.create': { name: 'Crear Almacenes', description: 'Crear nuevos almacenes' },
  'warehouses.update': { name: 'Actualizar Almacenes', description: 'Editar información de almacenes' },
  'warehouses.delete': { name: 'Eliminar Almacenes', description: 'Eliminar almacenes' },
  
  // Kits
  'kits.view': { name: 'Ver Kits', description: 'Ver kits de herramientas' },
  'kits.create': { name: 'Crear Kits', description: 'Crear kits de herramientas' },
  'kits.update': { name: 'Actualizar Kits', description: 'Actualizar kits de herramientas' },
  'kits.delete': { name: 'Eliminar Kits', description: 'Eliminar kits' },
  
  // Proyectos
  'projects.view': { name: 'Ver Proyectos', description: 'Ver proyectos' },
  'projects.create': { name: 'Crear Proyectos', description: 'Crear y agregar proyectos' },
  'projects.update': { name: 'Actualizar Proyectos', description: 'Editar información de proyectos' },
  'projects.delete': { name: 'Eliminar Proyectos', description: 'Eliminar proyectos' },
  
  // Órdenes de Servicio
  'service-orders.view': { name: 'Ver Órdenes de Servicio', description: 'Ver órdenes de servicio' },
  'service-orders.create': { name: 'Crear Órdenes', description: 'Crear nuevas órdenes de servicio' },
  'service-orders.update': { name: 'Actualizar Órdenes', description: 'Editar órdenes de servicio' },
  'service-orders.delete': { name: 'Eliminar Órdenes', description: 'Eliminar órdenes de servicio' },
  
  // Usuarios
  'users.view': { name: 'Ver Usuarios', description: 'Ver listado de usuarios' },
  'users.create': { name: 'Crear Usuarios', description: 'Crear nuevos usuarios' },
  'users.update': { name: 'Actualizar Usuarios', description: 'Editar información de usuarios' },
  'users.delete': { name: 'Eliminar Usuarios', description: 'Eliminar usuarios del sistema' },
  
  // Roles
  'roles.view': { name: 'Ver Roles', description: 'Ver roles del sistema' },
  'roles.create': { name: 'Crear Roles', description: 'Crear nuevos roles' },
  'roles.update': { name: 'Actualizar Roles', description: 'Editar roles existentes' },
  'roles.delete': { name: 'Eliminar Roles', description: 'Eliminar roles' },
  'roles.assign': { name: 'Asignar Roles', description: 'Asignar roles a usuarios' },
  
  // Permisos
  'permissions.view': { name: 'Ver Permisos', description: 'Ver permisos del sistema' },
  'permissions.create': { name: 'Crear Permisos', description: 'Crear nuevos permisos' },
  'permissions.update': { name: 'Actualizar Permisos', description: 'Editar permisos' },
  'permissions.delete': { name: 'Eliminar Permisos', description: 'Eliminar permisos' },
  
  // Reportes
  'reports.view': { name: 'Ver Reportes', description: 'Acceder a reportes y estadísticas' },
  'reports.export': { name: 'Exportar Reportes', description: 'Exportar reportes a Excel/PDF' },
};

export function translatePermission(code: string): { name: string; description: string } {
  return permissionTranslations[code] || { 
    name: code, 
    description: 'Permiso personalizado' 
  };
}

export function getPermissionModule(code: string): string {
  const moduleMap: Record<string, string> = {
    'clients': 'Clientes',
    'products': 'Productos',
    'categories': 'Categorías',
    'suppliers': 'Proveedores',
    'quotes': 'Cotizaciones',
    'inventory': 'Inventario',
    'warehouses': 'Almacenes',
    'kits': 'Kits',
    'projects': 'Proyectos',
    'service-orders': 'Órdenes de Servicio',
    'users': 'Usuarios',
    'roles': 'Roles',
    'permissions': 'Permisos',
    'reports': 'Reportes',
  };
  
  const module = code.split('.')[0];
  return moduleMap[module] || 'Otros';
}
