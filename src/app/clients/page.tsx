'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { clientsService } from '@/lib/services'
import type { Client } from '@/lib/types'

export default function ClientsPage() {
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [form, setForm] = useState<{ name: string; documentType: string; documentNum: string; email: string; phone: string; address: string; clientType: 'REGULAR' | 'PREFERENCIAL' }>({ name: '', documentType: 'RUT', documentNum: '', email: '', phone: '', address: '', clientType: 'REGULAR' })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const response = await clientsService.list({ page: 1, limit: 100 })
      setData(response.clients)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<Client>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'documentNum', label: 'Documento', sortable: true, render: (item) => (
      <span>{(item as any).documentType || 'RUT'}: {(item as any).documentNum || item.rut}</span>
    ) },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Teléfono' },
    {
      key: 'clientType', label: 'Tipo', render: (item) => (
        <span className={(item as any).clientType === 'PREFERENCIAL' || item.type === 'PREFERENCIAL' ? 'badge-green' : 'badge-blue'}>{(item as any).clientType || item.type}</span>
      )
    },
  ]

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', documentType: 'RUT', documentNum: '', email: '', phone: '', address: '', clientType: 'REGULAR' }); 
    setModalOpen(true) 
  }
  
  const openEdit = (item: Client) => { 
    setEditing(item); 
    setForm({ 
      name: item.name, 
      documentType: (item as any).documentType || 'RUT',
      documentNum: (item as any).documentNum || item.rut || '', 
      email: item.email || '', 
      phone: item.phone || '', 
      address: item.address || '', 
      clientType: (item as any).clientType || item.type
    }); 
    setModalOpen(true) 
  }
  
  const openDelete = (item: Client) => { setDeleting(item); setDeleteOpen(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        await clientsService.update(editing.id, form)
      } else {
        await clientsService.create(form)
      }
      await loadClients()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cliente')
    }
  }

  const handleDelete = async () => { 
    if (deleting) { 
      try {
        await clientsService.delete(deleting.id)
        await loadClients()
        setDeleteOpen(false)
        setDeleting(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar cliente')
      }
    } 
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <>
      <DataTable title="Clientes" columns={columns} data={data} onAdd={openAdd} onEdit={openEdit} onDelete={openDelete} addLabel="Nuevo Cliente" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="cli_name" className="label">Nombre / Razón Social *</label>
            <input 
              id="cli_name" 
              className="input" 
              value={form.name} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} 
              required
            />
          </div>
          <div>
            <label htmlFor="cli_doctype" className="label">Tipo de Documento *</label>
            <select 
              id="cli_doctype" 
              className="input" 
              value={form.documentType} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, documentType: e.target.value })}
            >
              <option value="CI">CEDULA DE IDENTIDAD</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="cli_docnum" className="label">Número de Documento *</label>
            <input 
              id="cli_docnum" 
              className="input" 
              value={form.documentNum} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, documentNum: e.target.value })} 
              placeholder="12345678-9"
              required
            />
          </div>
          <div>
            <label htmlFor="cli_type" className="label">Tipo de Cliente *</label>
            <select 
              id="cli_type" 
              className="input" 
              value={form.clientType} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, clientType: e.target.value as 'REGULAR' | 'PREFERENCIAL' })}
            >
              <option value="REGULAR">Regular</option>
              <option value="PREFERENCIAL">Preferencial</option>
            </select>
          </div>
          <div>
            <label htmlFor="cli_email" className="label">Email</label>
            <input 
              id="cli_email" 
              className="input" 
              type="email" 
              value={form.email} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} 
            />
          </div>
          <div>
            <label htmlFor="cli_phone" className="label">Teléfono</label>
            <input 
              id="cli_phone" 
              className="input" 
              value={form.phone} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} 
              placeholder="+56912345678"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cli_address" className="label">Dirección</label>
            <input 
              id="cli_address" 
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
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar Cliente" message={`¿Está seguro de eliminar al cliente "${deleting?.name}"?`} />
    </>
  )
}
