'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { categoriesService } from '@/lib/services'
import type { Category } from '@/lib/types'

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categoriesService.list({ page: 1, limit: 100 })
      const { categories } = response
      setData(categories)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Category>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción' },
    { 
      key: 'products', 
      label: 'Productos', 
      render: (item) => (
        <span className="text-sm text-gray-600">
          {(item as any)._count?.products || 0} productos
        </span>
      )
    },
  ]

  const openAdd = () => { 
    setEditing(null)
    setForm({ name: '', description: '' })
    setModalOpen(true)
  }

  const openEdit = (item: Category) => { 
    setEditing(item)
    setForm({ 
      name: item.name, 
      description: item.description || '' 
    })
    setModalOpen(true)
  }

  const openDelete = (item: Category) => { 
    setDeleting(item)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await categoriesService.update(String(editing.id), form)
      } else {
        await categoriesService.create(form)
      }
      setModalOpen(false)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar categoría')
    }
  }

  const handleDelete = async () => { 
    if (deleting) {
      try {
        await categoriesService.delete(String(deleting.id))
        setDeleteOpen(false)
        setDeleting(null)
        await loadCategories()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar categoría')
      }
    }
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <>
      <DataTable 
        title="Categorías" 
        columns={columns} 
        data={data} 
        onAdd={openAdd} 
        onEdit={openEdit} 
        onDelete={openDelete} 
        addLabel="Nueva Categoría" 
      />
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editing ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="cat_name" className="label">Nombre *</label>
            <input 
              id="cat_name" 
              className="input" 
              value={form.name} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} 
              placeholder="Electrónica"
              required 
            />
          </div>
          <div>
            <label htmlFor="cat_description" className="label">Descripción</label>
            <textarea 
              id="cat_description" 
              className="input" 
              rows={3}
              value={form.description} 
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} 
              placeholder="Productos electrónicos y componentes"
            />
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
        title="Eliminar Categoría" 
        message={`¿Está seguro de eliminar la categoría "${deleting?.name}"? Esta acción no se puede deshacer.`} 
      />
    </>
  )
}
