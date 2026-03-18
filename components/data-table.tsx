'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  editable?: boolean
  type?: 'text' | 'number' | 'date' | 'textarea'
}

interface DataTableProps<T extends { id: number }> {
  title: string
  description?: string
  columns: Column<T>[]
  data: T[]
  isLoading: boolean
  pagination?: {
    page: number
    totalPages: number
    total: number
  }
  onSearch?: (query: string) => void
  onPageChange?: (page: number) => void
  onCreate?: (item: Partial<T>) => Promise<void>
  onUpdate?: (id: number, item: Partial<T>) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  createFields?: Column<T>[]
  editFields?: Column<T>[]
}

export function DataTable<T extends { id: number }>({
  title,
  description,
  columns,
  data,
  isLoading,
  pagination,
  onSearch,
  onPageChange,
  onCreate,
  onUpdate,
  onDelete,
  createFields,
  editFields,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const handleCreate = async () => {
    if (!onCreate) return
    setIsSubmitting(true)
    setError('')
    try {
      await onCreate(formData as Partial<T>)
      setIsCreateOpen(false)
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!onUpdate || !selectedItem) return
    setIsSubmitting(true)
    setError('')
    try {
      await onUpdate(selectedItem.id, formData as Partial<T>)
      setIsEditOpen(false)
      setSelectedItem(null)
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !selectedItem) return
    setIsSubmitting(true)
    setError('')
    try {
      await onDelete(selectedItem.id)
      setIsDeleteOpen(false)
      setSelectedItem(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (item: T) => {
    setSelectedItem(item)
    const initialData: Record<string, unknown> = {}
    ;(editFields || columns).forEach((col) => {
      const key = col.key as string
      initialData[key] = item[key as keyof T]
    })
    setFormData(initialData)
    setError('')
    setIsEditOpen(true)
  }

  const openDelete = (item: T) => {
    setSelectedItem(item)
    setError('')
    setIsDeleteOpen(true)
  }

  const openCreate = () => {
    setFormData({})
    setError('')
    setIsCreateOpen(true)
  }

  const getValue = (item: T, key: string): unknown => {
    const keys = key.split('.')
    let value: unknown = item
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k]
    }
    return value
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {onSearch && (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
          )}
          {onCreate && createFields && (
            <Button onClick={openCreate} size="sm">
              <Plus className="size-4 mr-1" />
              Add New
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.key)}>{col.header}</TableHead>
              ))}
              {(onUpdate || onDelete) && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  <Spinner className="mx-auto size-6" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      {col.render ? col.render(item) : String(getValue(item, String(col.key)) ?? '-')}
                    </TableCell>
                  ))}
                  {(onUpdate || onDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onUpdate && editFields && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => openDelete(item)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Record</DialogTitle>
            <DialogDescription>Fill in the details to create a new record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createFields?.map((field) => (
              <div key={String(field.key)} className="space-y-2">
                <label className="text-sm font-medium">{field.header}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={String(formData[String(field.key)] ?? '')}
                    onChange={(e) => setFormData({ ...formData, [String(field.key)]: e.target.value })}
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={String(formData[String(field.key)] ?? '')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [String(field.key)]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>Update the details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editFields?.map((field) => (
              <div key={String(field.key)} className="space-y-2">
                <label className="text-sm font-medium">{field.header}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={String(formData[String(field.key)] ?? '')}
                    onChange={(e) => setFormData({ ...formData, [String(field.key)]: e.target.value })}
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={String(formData[String(field.key)] ?? '')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [String(field.key)]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
