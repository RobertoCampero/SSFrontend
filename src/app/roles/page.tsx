'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { rolesService, permissionsService } from '@/lib/services'
import type { Role, Permission } from '@/lib/types'
import { Lock } from 'lucide-react'
import { translatePermission } from '@/lib/utils/permissions-translations'

export default function RolesPage() {
  const [data, setData] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const [managingPermissions, setManagingPermissions] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await rolesService.list({ page: 1, limit: 100 })
      setData(response.roles)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar roles')
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await permissionsService.list({ page: 1, limit: 500 })
      setPermissions(response.permissions)
    } catch (err) {
      console.error('Error al cargar permisos:', err)
    }
  }

  const openManagePermissions = (role: Role) => {
    setManagingPermissions(role)
    setSelectedPermissionIds([])
    setPermissionsModalOpen(true)
  }

  const handleAssignPermissions = async () => {
    if (!managingPermissions || selectedPermissionIds.length === 0) return
    try {
      await rolesService.assignPermissions(managingPermissions.id, { 
        permissionIds: selectedPermissionIds.map(id => Number(id)) 
      })
      setSelectedPermissionIds([])
      await loadRoles()
      alert(`${selectedPermissionIds.length} permiso(s) asignado(s) exitosamente`)
    } catch (error) {
      console.error('Error al asignar permisos:', error)
      alert(error instanceof Error ? error.message : 'Error al asignar permisos')
    }
  }

  const handleAssignAllPermissions = async () => {
    if (!managingPermissions) return
    
    console.log('🔍 Total permisos cargados:', permissions.length)
    console.log('🔍 Permisos ya asignados al rol:', managingPermissions.rolePermissions?.length || 0)
    
    const availablePermissions = permissions.filter(p => 
      !managingPermissions?.rolePermissions?.some((rp: any) => rp.permissionId === p.id)
    )
    
    console.log('🔍 Permisos disponibles para asignar:', availablePermissions.length)
    
    if (availablePermissions.length === 0) {
      alert('No hay permisos disponibles para asignar')
      return
    }

    const confirmMsg = `¿Estás seguro de asignar TODOS los ${availablePermissions.length} permisos disponibles al rol "${managingPermissions.name}"?`
    if (!confirm(confirmMsg)) return

    try {
      // Asignar permisos en lotes de 50 para evitar límites del backend
      const batchSize = 50
      const permissionIds = availablePermissions.map(p => Number(p.id))
      let totalAssigned = 0

      console.log('🚀 Iniciando asignación de permisos en lotes...')
      
      for (let i = 0; i < permissionIds.length; i += batchSize) {
        const batch = permissionIds.slice(i, i + batchSize)
        console.log(`📦 Asignando lote ${Math.floor(i/batchSize) + 1}: ${batch.length} permisos`)
        
        await rolesService.assignPermissions(managingPermissions.id, { 
          permissionIds: batch 
        })
        totalAssigned += batch.length
        console.log(`✅ Asignados ${totalAssigned}/${permissionIds.length} permisos`)
      }

      console.log('🎉 Recargando roles...')
      setSelectedPermissionIds([])
      await loadRoles()
      alert(`${totalAssigned} permisos asignados exitosamente`)
    } catch (error) {
      console.error('❌ Error al asignar todos los permisos:', error)
      alert(error instanceof Error ? error.message : 'Error al asignar permisos')
    }
  }

  const handleRemovePermission = async (permissionId: string) => {
    if (!managingPermissions) return
    try {
      await rolesService.removePermission(managingPermissions.id, permissionId)
      loadRoles()
      alert('Permiso removido exitosamente')
    } catch (err) {
      console.error('Error al remover permiso:', err)
      alert(err instanceof Error ? err.message : 'Error al remover permiso')
    }
  }

  const columns: Column<Role>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción' },
    {
      key: 'actions',
      label: 'Permisos',
      render: (role) => (
        <button
          onClick={() => openManagePermissions(role)}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
        >
          <Lock size={14} />
          Gestionar Permisos
        </button>
      )
    },
  ]

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true) }
  const openEdit = (item: Role) => { setEditing(item); setForm({ name: item.name, description: item.description }); setModalOpen(true) }
  const openDelete = (item: Role) => { setDeleting(item); setDeleteOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        await rolesService.update(editing.id, form)
      } else {
        await rolesService.create(form)
      }
      await loadRoles()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar rol')
    }
  }

  const handleDelete = async () => { 
    if (deleting) { 
      try {
        await rolesService.delete(deleting.id)
        await loadRoles()
        setDeleteOpen(false)
        setDeleting(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar rol')
      }
    } 
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <>
      <DataTable title="Roles" columns={columns} data={data} onAdd={openAdd} onEdit={openEdit} onDelete={openDelete} addLabel="Nuevo Rol" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Rol' : 'Nuevo Rol'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="role_name" className="label">Nombre</label>
            <input id="role_name" className="input" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="role_desc" className="label">Descripción</label>
            <textarea id="role_desc" className="input" rows={3} value={form.description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleSave} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar Rol" message={`¿Está seguro de eliminar el rol "${deleting?.name}"?`} />
      
      <Modal
        open={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
        title={`Gestionar Permisos - ${managingPermissions?.name}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header con contador y botones */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Permisos Disponibles</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPermissionIds.length > 0 
                    ? `${selectedPermissionIds.length} permiso(s) seleccionado(s)` 
                    : 'Selecciona los permisos que deseas asignar'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAssignAllPermissions}
                  className="btn-secondary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                >
                  <Lock size={16} />
                  Asignar Todos
                </button>
                <button
                  onClick={handleAssignPermissions}
                  disabled={selectedPermissionIds.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Lock size={16} />
                  Asignar ({selectedPermissionIds.length})
                </button>
              </div>
            </div>
          </div>

          {/* Grid de permisos disponibles por módulo */}
          <div className="max-h-96 overflow-y-auto">
            {(() => {
              const availablePermissions = permissions.filter(p => 
                !managingPermissions?.rolePermissions?.some((rp: any) => rp.permissionId === p.id)
              )
              
              // Agrupar por módulo
              const grouped = availablePermissions.reduce((acc, permission) => {
                const module = permission.code.split(':')[0]
                if (!acc[module]) acc[module] = []
                acc[module].push(permission)
                return acc
              }, {} as Record<string, typeof permissions>)

              const moduleNames: Record<string, string> = {
                'users': 'Usuarios',
                'roles': 'Roles',
                'permissions': 'Permisos',
                'clients': 'Clientes',
                'suppliers': 'Proveedores',
                'products': 'Productos',
                'categories': 'Categorías',
                'warehouses': 'Almacenes',
                'inventory': 'Inventario',
                'kits': 'Kits',
                'quotes': 'Cotizaciones',
                'service-orders': 'Órdenes de Servicio',
                'reports': 'Reportes'
              }

              return (
                <div className="space-y-4">
                  {Object.entries(grouped).map(([module, perms]) => (
                    <div key={module} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <h4 className="font-semibold text-gray-900">{moduleNames[module] || module}</h4>
                      </div>
                      <div className="p-3 bg-white">
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((permission) => {
                            const translated = translatePermission(permission.code)
                            const isSelected = selectedPermissionIds.includes(String(permission.id))
                            return (
                              <label
                                key={permission.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPermissionIds([...selectedPermissionIds, String(permission.id)])
                                    } else {
                                      setSelectedPermissionIds(selectedPermissionIds.filter(id => id !== String(permission.id)))
                                    }
                                  }}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900 truncate">{translated.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{translated.description}</div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Permisos ya asignados */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Permisos Asignados</h3>
              <span className="text-sm text-gray-500">
                {managingPermissions?.rolePermissions?.length || 0} permiso(s)
              </span>
            </div>
            {managingPermissions?.rolePermissions && managingPermissions.rolePermissions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {managingPermissions.rolePermissions.map((rolePermission: any) => {
                  const permission = permissions.find(p => p.id === rolePermission.permissionId)
                  const translated = permission ? translatePermission(permission.code) : { name: 'Permiso desconocido', description: '' }
                  return (
                    <div
                      key={rolePermission.permissionId}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Lock size={14} className="text-green-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-sm text-gray-900 block truncate">
                            {translated.name}
                          </span>
                          <span className="text-xs text-gray-500 truncate block">
                            {translated.description}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePermission(rolePermission.permissionId)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1.5 rounded transition-colors flex-shrink-0"
                        title="Remover permiso"
                      >
                        <Lock size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Lock size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No hay permisos asignados a este rol</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setPermissionsModalOpen(false)}
              className="btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
