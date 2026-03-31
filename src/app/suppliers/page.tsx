'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { suppliersService } from '@/lib/services'
import type { Supplier } from '@/lib/types'

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', rut: '', email: '', phone: '', address: '', contactPerson: '' })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const response = await suppliersService.list({ page: 1, limit: 100 })
      setData(response.suppliers)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Supplier>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'rut', label: 'RUT', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Teléfono' },
    { key: 'contactPerson', label: 'Contacto' },
  ]

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', rut: '', email: '', phone: '', address: '', contactPerson: '' }); 
    setModalOpen(true) 
  }
  
  const openEdit = (item: Supplier) => { 
    setEditing(item); 
    setForm({ 
      name: item.name, 
      rut: item.rut, 
      email: item.email || '', 
      phone: item.phone || '', 
      address: item.address || '', 
      contactPerson: item.contactPerson || '' 
    }); 
    setModalOpen(true) 
  }
  
  const openDelete = (item: Supplier) => { setDeleting(item); setDeleteOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        await suppliersService.update(String(editing.id), form)
      } else {
        await suppliersService.create(form)
      }
      await loadSuppliers()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar proveedor')
    }
  }

  const handleDelete = async () => { 
    if (deleting) { 
      try {
        await suppliersService.delete(String(deleting.id))
        await loadSuppliers()
        setDeleteOpen(false)
        setDeleting(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar proveedor')
      }
    } 
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <>
      <DataTable title="Proveedores" columns={columns} data={data} onAdd={openAdd} onEdit={openEdit} onDelete={openDelete} addLabel="Nuevo Proveedor" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="sup_name" className="label">Nombre / Razón Social *</label>
            <input 
              id="sup_name" 
              className="input" 
              value={form.name} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} 
              required
            />
          </div>
          <div>
            <label htmlFor="sup_rut" className="label">RUT *</label>
            <input 
              id="sup_rut" 
              className="input" 
              value={form.rut} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, rut: e.target.value })} 
              placeholder="12345678-9"
              required
            />
          </div>
          <div>
            <label htmlFor="sup_contact" className="label">Persona de Contacto</label>
            <input 
              id="sup_contact" 
              className="input" 
              value={form.contactPerson} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, contactPerson: e.target.value })} 
            />
          </div>
          <div>
            <label htmlFor="sup_email" className="label">Email</label>
            <input 
              id="sup_email" 
              className="input" 
              type="email" 
              value={form.email} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} 
            />
          </div>
          <div>
            <label htmlFor="sup_phone" className="label">Teléfono</label>
            <input 
              id="sup_phone" 
              className="input" 
              value={form.phone} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} 
              placeholder="+56912345678"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="sup_address" className="label">Dirección</label>
            <input 
              id="sup_address" 
              className="input" 
              value={form.address} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })} 
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleSave} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar Proveedor" message={`¿Está seguro de eliminar al proveedor "${deleting?.name}"?`} />
    </>
  )
}
