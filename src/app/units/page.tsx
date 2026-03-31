'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { unitsService } from '@/lib/services'
import type { Unit } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { ShieldAlert } from 'lucide-react'

export default function UnitsPage() {
  const { hasPermission, hasAnyPermission, isAdmin, loading: authLoading } = useAuth()
  const toast = useToast()
  const [data, setData] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [deleting, setDeleting] = useState<Unit | null>(null)
  const [form, setForm] = useState({ code: '', name: '' })

  // Permisos para unidades
  const canView = isAdmin() || hasAnyPermission(['units.view', 'units.manage'])
  const canCreate = isAdmin() || hasAnyPermission(['units.create', 'units.manage'])
  const canEdit = isAdmin() || hasAnyPermission(['units.edit', 'units.manage'])
  const canDelete = isAdmin() || hasAnyPermission(['units.delete', 'units.manage'])

  useEffect(() => {
    loadUnits()
  }, [])

  const loadUnits = async () => {
    try {
      setLoading(true)
      const response = await unitsService.list()
      setData(response)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar unidades')
      toast.error('Error', 'No se pudieron cargar las unidades')
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Unit>[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    { 
      key: 'createdAt', 
      label: 'Fecha Creación', 
      render: (item) => new Date(item.createdAt).toLocaleDateString('es-CL')
    },
  ]

  const openAdd = () => {
    setEditing(null)
    setForm({ code: '', name: '' })
    setModalOpen(true)
  }

  const openEdit = (item: Unit) => {
    setEditing(item)
    setForm({ code: item.code, name: item.name })
    setModalOpen(true)
  }

  const openDelete = (item: Unit) => {
    setDeleting(item)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.warning('Campos requeridos', 'Por favor completa todos los campos')
      return
    }

    try {
      if (editing) {
        await unitsService.update(editing.id, form)
        toast.success('Actualizado', 'Unidad actualizada correctamente')
      } else {
        await unitsService.create(form)
        toast.success('Creado', 'Unidad creada correctamente')
      }
      await loadUnits()
      setModalOpen(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar unidad'
      setError(errorMsg)
      toast.error('Error', errorMsg)
    }
  }

  const handleDelete = async () => {
    if (deleting) {
      try {
        await unitsService.delete(deleting.id)
        toast.success('Eliminado', 'Unidad eliminada correctamente')
        await loadUnits()
        setDeleteOpen(false)
        setDeleting(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al eliminar unidad'
        setError(errorMsg)
        toast.error('Error', errorMsg)
      }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mx-auto mb-6 rounded-full bg-red-50 w-20 h-20 flex items-center justify-center">
            <ShieldAlert size={40} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a la gestión de unidades de medida.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">Permisos requeridos:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>units.view</strong> - Ver unidades</li>
              <li>• <strong>units.manage</strong> - Gestión completa</li>
            </ul>
            <p className="text-xs text-blue-700 mt-3">
              Contacta a un administrador para solicitar estos permisos.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <DataTable
        title="Unidades de Medida"
        data={data}
        columns={columns}
        onAdd={canCreate ? openAdd : undefined}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? openDelete : undefined}
        addLabel="Nueva Unidad"
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Unidad' : 'Nueva Unidad'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="unit_code" className="label">Código *</label>
            <input
              id="unit_code"
              className="input"
              placeholder="ej: UND, KG, M, L"
              value={form.code}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Código corto para identificar la unidad (máx. 10 caracteres)</p>
          </div>
          <div>
            <label htmlFor="unit_name" className="label">Nombre *</label>
            <input
              id="unit_name"
              className="input"
              placeholder="ej: Unidad, Kilogramo, Metro, Litro"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Ejemplos comunes:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>UND</strong> - Unidad</li>
              <li>• <strong>KG</strong> - Kilogramo</li>
              <li>• <strong>M</strong> - Metro</li>
              <li>• <strong>L</strong> - Litro</li>
              <li>• <strong>M2</strong> - Metro Cuadrado</li>
              <li>• <strong>M3</strong> - Metro Cúbico</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleSave} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Unidad"
        message={`¿Está seguro de eliminar la unidad "${deleting?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
