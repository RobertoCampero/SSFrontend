'use client'

import { useState, useEffect } from 'react'
import { usersService, rolesService, inventoryService } from '@/lib/services'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { User, Role, Warehouse } from '@/lib/types'
import type { Column } from '@/components/ui/DataTable'
import { Shield, Warehouse as WarehouseIcon, Eye, EyeOff } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [managingRoles, setManagingRoles] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    isActive: true,
    warehouseId: ''
  })

  useEffect(() => {
    loadUsers()
    loadRoles()
    loadWarehouses()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersService.list()
      console.log('Usuarios recibidos del backend:', response.users)
      console.log('Primer usuario con warehouseId:', response.users.find(u => u.warehouseId))
      setUsers(response.users)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await rolesService.list()
      setRoles(response.roles)
    } catch (error) {
      console.error('Error al cargar roles:', error)
    }
  }

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.listWarehouses()
      setWarehouses(response.warehouses || [])
    } catch (error) {
      console.error('Error al cargar almacenes:', error)
    }
  }

  const openManageRoles = (user: User) => {
    setManagingRoles(user)
    setSelectedRoleId('')
    setRolesModalOpen(true)
  }

  const handleAssignRole = async () => {
    if (!managingRoles || !selectedRoleId) return
    try {
      await usersService.assignRole(managingRoles.id, selectedRoleId)
      setSelectedRoleId('')
      await loadUsers()
      // Actualizar el usuario en gestión con los datos frescos
      const response = await usersService.list()
      const updatedUser = response.users.find(u => u.id === managingRoles.id)
      if (updatedUser) {
        setManagingRoles(updatedUser)
      }
      alert('Rol asignado exitosamente')
    } catch (error) {
      console.error('Error al asignar rol:', error)
      alert(error instanceof Error ? error.message : 'Error al asignar rol')
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    if (!managingRoles) return
    try {
      await usersService.removeRole(managingRoles.id, roleId)
      await loadUsers()
      // Actualizar el usuario en gestión con los datos frescos
      const response = await usersService.list()
      const updatedUser = response.users.find(u => u.id === managingRoles.id)
      if (updatedUser) {
        setManagingRoles(updatedUser)
      }
      alert('Rol removido exitosamente')
    } catch (error) {
      console.error('Error al remover rol:', error)
      alert(error instanceof Error ? error.message : 'Error al remover rol')
    }
  }

  const columns: Column<User>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'username', label: 'Usuario', sortable: true },
    { key: 'fullName', label: 'Nombre Completo', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'isActive',
      label: 'Estado',
      render: (user) => (
        <span className={user.isActive ? 'badge-green' : 'badge-red'}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'userRoles',
      label: 'Roles Asignados',
      render: (user) => {
        const userRoles = user.userRoles || []
        if (userRoles.length === 0) {
          return <span className="text-sm text-gray-400 italic">Sin roles</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {userRoles.map((userRole: any) => {
              const role = roles.find(r => r.id === userRole.roleId)
              return (
                <span key={userRole.roleId} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {role?.name || 'Rol desconocido'}
                </span>
              )
            })}
          </div>
        )
      }
    },
    {
      key: 'warehouseId',
      label: 'Almacén Asignado',
      render: (user) => {
        if (!user.warehouseId) {
          return <span className="text-sm text-gray-400 italic">Sin almacén</span>
        }
        const warehouse = warehouses.find(w => String(w.id) === String(user.warehouseId))
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            <WarehouseIcon size={12} />
            {warehouse?.name || `ID: ${user.warehouseId}`}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (user) => (
        <button
          onClick={() => openManageRoles(user)}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100"
        >
          <Shield size={14} />
          Gestionar Roles
        </button>
      )
    },
  ]

  const openAdd = () => {
    setEditing(null)
    setForm({ username: '', email: '', password: '', fullName: '', isActive: true, warehouseId: '' })
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      isActive: user.isActive,
      warehouseId: user.warehouseId ? String(user.warehouseId) : ''
    })
    setModalOpen(true)
  }

  const openDelete = (user: User) => {
    setDeleting(user)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        const updateData: any = {
          username: form.username,
          email: form.email,
          fullName: form.fullName,
          isActive: form.isActive,
          warehouseId: form.warehouseId || null
        }
        if (form.password) {
          updateData.password = form.password
        }
        await usersService.update(editing.id, updateData)
      } else {
        const createData = {
          ...form,
          warehouseId: form.warehouseId || undefined
        }
        await usersService.create(createData)
      }
      setModalOpen(false)
      loadUsers()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar usuario')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await usersService.delete(deleting.id)
      setDeleteOpen(false)
      setDeleting(null)
      loadUsers()
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar usuario')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DataTable
        title="Gestión de Usuarios"
        columns={columns}
        data={users}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Nuevo Usuario"
        searchPlaceholder="Buscar por usuario, nombre, email..."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="label">Usuario</label>
            <input
              id="username"
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="nombre_usuario"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="label">Nombre Completo</label>
            <input
              id="fullName"
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              {editing ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="warehouseId" className="label">
              Almacén Asignado (Opcional)
            </label>
            <select
              id="warehouseId"
              className="input"
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            >
              <option value="">— Sin almacén asignado —</option>
              {warehouses.filter(w => w.isActive).map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} {warehouse.location ? `- ${warehouse.location}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Si asignas un almacén, el usuario usará automáticamente este almacén al aprobar cotizaciones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Usuario Activo</label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message={`¿Está seguro de eliminar al usuario "${deleting?.username}"?`}
      />

      <Modal
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
        title={`Gestionar Roles - ${managingRoles?.username}`}
      >
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Asignar Nuevo Rol</h3>
            <div className="flex gap-2">
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="input flex-1"
                aria-label="Seleccionar rol para asignar"
              >
                <option value="">Seleccionar rol...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignRole}
                disabled={!selectedRoleId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Asignar
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Roles Asignados</h3>
            {managingRoles?.userRoles && managingRoles.userRoles.length > 0 ? (
              <div className="space-y-2">
                {managingRoles.userRoles.map((userRole: any) => (
                  <div
                    key={userRole.roleId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-purple-600" />
                      <span className="font-medium text-gray-900">
                        {roles.find(r => r.id === userRole.roleId)?.name || 'Rol desconocido'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveRole(userRole.roleId)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No tiene roles asignados</p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setRolesModalOpen(false)}
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
