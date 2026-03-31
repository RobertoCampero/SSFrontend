'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Plus, Edit2, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react'
import clsx from 'clsx'

export interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  title: string
  columns: Column<T>[]
  data: T[]
  onAdd?: () => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onView?: (item: T) => void
  addLabel?: string
  searchPlaceholder?: string
  getId?: (item: T) => string | number
  customActions?: React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onView,
  addLabel = 'Agregar',
  searchPlaceholder = 'Buscar...',
  getId = (item) => item.id,
  customActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const perPage = 10

  const filtered = data.filter((item) =>
    columns.some((col) => {
      const val = item[col.key]
      if (val == null) return false
      return String(val).toLowerCase().includes(search.toLowerCase())
    })
  )

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortKey] ?? ''
        const bVal = b[sortKey] ?? ''
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const hasActions = true // Siempre mostrar acciones para todos los usuarios

  // Smart pagination: show pages around current
  const getPageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{sorted.length} registro{sorted.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              id="datatable_search"
              type="text"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9 w-64"
            />
          </div>
          {customActions}
          {onAdd && (
            <button type="button" onClick={onAdd} className="btn-primary">
              <Plus size={16} />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx('table-header px-4 py-3', col.className, col.sortable && 'cursor-pointer select-none hover:text-gray-700 group')}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp size={14} className="text-primary-600" /> : <ArrowDown size={14} className="text-primary-600" />
                      ) : (
                        <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {hasActions && <th className="table-header px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-16 text-center">
                  <Inbox size={48} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-400">No se encontraron registros</p>
                  {search && <p className="text-xs text-gray-300 mt-1">Intenta con otro término de búsqueda</p>}
                </td>
              </tr>
            ) : (
              paginated.map((item) => (
                <tr key={getId(item)} className="group hover:bg-primary-50/30 transition-colors duration-150">
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3 text-sm text-gray-700', col.className)}>
                      {col.render ? col.render(item) : (item[col.key] ?? '—')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5 transition-opacity duration-150">
                        {onView && (
                          <button type="button" onClick={() => onView(item)} aria-label="Ver" className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all duration-200" title="Ver">
                            <Eye size={16} />
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => onEdit ? onEdit(item) : console.log('Editar:', item)} 
                          aria-label="Editar" 
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all duration-200" 
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => onDelete ? onDelete(item) : console.log('Eliminar:', item)} 
                          aria-label="Eliminar" 
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all duration-200" 
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando <span className="font-medium text-gray-700">{Math.min((page - 1) * perPage + 1, sorted.length)}</span>–<span className="font-medium text-gray-700">{Math.min(page * perPage, sorted.length)}</span> de <span className="font-medium text-gray-700">{sorted.length}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              aria-label="Página anterior"
              className="btn-secondary btn-sm"
            >
              <ChevronLeft size={14} />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={clsx(
                    'btn-sm rounded-lg min-w-[32px] px-2.5 py-1.5 text-sm font-medium transition-all duration-200',
                    p === page ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              aria-label="Página siguiente"
              className="btn-secondary btn-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
