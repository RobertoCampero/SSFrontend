'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { permissionsService } from '@/lib/services'
import type { Permission } from '@/lib/types'

export default function PermissionsPage() {
  const [data, setData] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [deleting, setDeleting] = useState<Permission | null>(null)
  const [form, setForm] = useState({ code: '', description: '', module: '' })

  const permissionSuggestions = [
    { code: 'products.view', description: 'Ver productos', module: 'Productos' },
    { code: 'products.create', description: 'Crear productos', module: 'Productos' },
    { code: 'products.edit', description: 'Editar productos', module: 'Productos' },
    { code: 'products.delete', description: 'Eliminar productos', module: 'Productos' },
    { code: 'clients.view', description: 'Ver clientes', module: 'Clientes' },
    { code: 'clients.create', description: 'Crear clientes', module: 'Clientes' },
    { code: 'clients.edit', description: 'Editar clientes', module: 'Clientes' },
    { code: 'clients.delete', description: 'Eliminar clientes', module: 'Clientes' },
    { code: 'quotes.view', description: 'Ver cotizaciones', module: 'Cotizaciones' },
    { code: 'quotes.create', description: 'Crear cotizaciones', module: 'Cotizaciones' },
    { code: 'quotes.edit', description: 'Editar cotizaciones', module: 'Cotizaciones' },
    { code: 'quotes.delete', description: 'Eliminar cotizaciones', module: 'Cotizaciones' },
    { code: 'quotes.approve', description: 'Aprobar cotizaciones', module: 'Cotizaciones' },
    { code: 'inventory.view', description: 'Ver inventario', module: 'Inventario' },
    { code: 'inventory.create', description: 'Crear movimientos de inventario', module: 'Inventario' },
    { code: 'inventory.edit', description: 'Editar inventario', module: 'Inventario' },
    { code: 'inventory.transfer', description: 'Transferir entre almacenes', module: 'Inventario' },
    { code: 'suppliers.view', description: 'Ver proveedores', module: 'Proveedores' },
    { code: 'suppliers.create', description: 'Crear proveedores', module: 'Proveedores' },
    { code: 'suppliers.edit', description: 'Editar proveedores', module: 'Proveedores' },
    { code: 'suppliers.delete', description: 'Eliminar proveedores', module: 'Proveedores' },
    { code: 'users.view', description: 'Ver usuarios', module: 'Usuarios' },
    { code: 'users.create', description: 'Crear usuarios', module: 'Usuarios' },
    { code: 'users.edit', description: 'Editar usuarios', module: 'Usuarios' },
    { code: 'users.delete', description: 'Eliminar usuarios', module: 'Usuarios' },
    { code: 'roles.view', description: 'Ver roles', module: 'Roles' },
    { code: 'roles.create', description: 'Crear roles', module: 'Roles' },
    { code: 'roles.edit', description: 'Editar roles', module: 'Roles' },
    { code: 'roles.delete', description: 'Eliminar roles', module: 'Roles' },
    { code: 'permissions.view', description: 'Ver permisos', module: 'Permisos' },
    { code: 'permissions.create', description: 'Crear permisos', module: 'Permisos' },
    { code: 'permissions.edit', description: 'Editar permisos', module: 'Permisos' },
    { code: 'permissions.delete', description: 'Eliminar permisos', module: 'Permisos' },
    { code: 'reports.view', description: 'Ver reportes', module: 'Reportes' },
    { code: 'reports.export', description: 'Exportar reportes', module: 'Reportes' },
  ]

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await permissionsService.list({ page: 1, limit: 100 })
      setData(response.permissions)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar permisos')
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Permission>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'code', label: 'Código', sortable: true },
    { key: 'description', label: 'Descripción', sortable: true },
    {
      key: 'module', label: 'Módulo', sortable: true, render: (item) => (
        <span className="badge-blue">{item.module}</span>
      )
    },
    { key: 'created_at', label: 'Creado', sortable: true },
  ]

  const openAdd = () => { setEditing(null); setForm({ code: '', description: '', module: '' }); setModalOpen(true) }
  
  const useSuggestion = (suggestion: typeof permissionSuggestions[0]) => {
    setForm({
      code: suggestion.code,
      description: suggestion.description,
      module: suggestion.module
    })
  }
  const openEdit = (item: Permission) => { setEditing(item); setForm({ code: item.code, description: item.description, module: item.module }); setModalOpen(true) }
  const openDelete = (item: Permission) => { setDeleting(item); setDeleteOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        await permissionsService.update(editing.id, form)
      } else {
        await permissionsService.create(form)
      }
      await loadPermissions()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar permiso')
    }
  }

  const handleDelete = async () => { 
    if (deleting) { 
      try {
        await permissionsService.delete(deleting.id)
        await loadPermissions()
        setDeleteOpen(false)
        setDeleting(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar permiso')
      }
    } 
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <>
      <DataTable title="Permisos" columns={columns} data={data} onAdd={openAdd} onEdit={openEdit} onDelete={openDelete} addLabel="Nuevo Permiso" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Permiso' : 'Nuevo Permiso'} size="lg">
        <div className="space-y-4">
          {!editing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Sugerencias de Permisos</h4>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {permissionSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.code}
                    type="button"
                    onClick={() => useSuggestion(suggestion)}
                    className="text-left p-2 bg-white rounded border border-blue-200 hover:bg-blue-50 text-xs"
                  >
                    <div className="font-medium text-blue-900">{suggestion.description}</div>
                    <div className="text-blue-600">{suggestion.code}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="perm_code" className="label">Código</label>
            <input 
              id="perm_code" 
              className="input" 
              value={form.code} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value })} 
              placeholder="ej: products.view" 
            />
            <p className="text-xs text-gray-500 mt-1">Formato: modulo.accion (ej: products.create)</p>
          </div>
          <div>
            <label htmlFor="perm_desc" className="label">Descripción en Español</label>
            <input 
              id="perm_desc" 
              className="input" 
              value={form.description} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, description: e.target.value })} 
              placeholder="ej: Crear productos"
            />
            <p className="text-xs text-gray-500 mt-1">Descripción clara que el usuario entenderá</p>
          </div>
          <div>
            <label htmlFor="perm_module" className="label">Módulo</label>
            <input 
              id="perm_module" 
              className="input" 
              value={form.module} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, module: e.target.value })} 
              placeholder="ej: Productos"
            />
            <p className="text-xs text-gray-500 mt-1">Nombre del módulo en español</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleSave} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar Permiso" message={`¿Está seguro de eliminar el permiso "${deleting?.code}"?`} />
    </>
  )
}
