'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Pencil, Trash2, Search, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface Receipt {
  id: number
  receipt_number: string
  donation_amount: string
  donation_date: string
  payment_method: string
  note: string | null
  created_at: string
  user_id: number
  first_name: string
  last_name: string
  email: string
  address?: string
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online Payment' },
  { value: 'other', label: 'Other' },
]

export default function ReceiptsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    donationAmount: '',
    donationDate: '',
    paymentMethod: '',
    note: ''
  })

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  const fetchReceipts = useCallback(async () => {
    try {
      const response = await fetch('/api/receipts-admin')
      const data = await response.json()
      if (data.success) {
        setReceipts(data.receipts)
      }
    } catch (error) {
      console.error('Error fetching receipts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  const filteredReceipts = receipts.filter(receipt => {
    const search = searchTerm.toLowerCase()
    return (
      receipt.receipt_number.toLowerCase().includes(search) ||
      receipt.first_name.toLowerCase().includes(search) ||
      receipt.last_name.toLowerCase().includes(search) ||
      receipt.email.toLowerCase().includes(search) ||
      receipt.payment_method.toLowerCase().includes(search)
    )
  })

  const openViewDialog = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsViewDialogOpen(true)
  }

  const openEditDialog = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setFormData({
      donationAmount: receipt.donation_amount,
      donationDate: receipt.donation_date.split('T')[0],
      paymentMethod: receipt.payment_method,
      note: receipt.note || ''
    })
    setError('')
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedReceipt) return
    
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/receipts-admin/${selectedReceipt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setIsEditDialogOpen(false)
        fetchReceipts()
      } else {
        setError(data.error || 'Update failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedReceipt) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/receipts-admin/${selectedReceipt.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setIsDeleteDialogOpen(false)
        fetchReceipts()
      } else {
        alert(data.error || 'Delete failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
  }

  const getPaymentMethodLabel = (value: string) => {
    return PAYMENT_METHODS.find(m => m.value === value)?.label || value
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="shadow-lg border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Receipt History</CardTitle>
          <span className="text-sm text-muted-foreground">
            {receipts.length} total receipts
          </span>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt #, name, email, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No receipts match your search' : 'No receipts yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-xs">
                      {receipt.receipt_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {receipt.first_name} {receipt.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {receipt.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(receipt.donation_amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(receipt.donation_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getPaymentMethodLabel(receipt.payment_method)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(receipt.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(receipt)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(receipt)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(receipt)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              {selectedReceipt?.receipt_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Donor</p>
                  <p className="font-medium">{selectedReceipt.first_name} {selectedReceipt.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedReceipt.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium text-primary">{formatCurrency(selectedReceipt.donation_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedReceipt.donation_date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{getPaymentMethodLabel(selectedReceipt.payment_method)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(selectedReceipt.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
              {selectedReceipt.note && (
                <div>
                  <p className="text-muted-foreground text-sm">Note</p>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedReceipt.note}</p>
                </div>
              )}
              {selectedReceipt.address && (
                <div>
                  <p className="text-muted-foreground text-sm">Address</p>
                  <p className="text-sm mt-1">{selectedReceipt.address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Receipt</DialogTitle>
            <DialogDescription>
              Update receipt {selectedReceipt?.receipt_number}
            </DialogDescription>
          </DialogHeader>
          
          <FieldGroup className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Amount ($)</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.donationAmount}
                  onChange={(e) => setFormData({ ...formData, donationAmount: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={formData.donationDate}
                  onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Payment Method</FieldLabel>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Note (Optional)</FieldLabel>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </Field>
          </FieldGroup>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete receipt{' '}
              <strong>{selectedReceipt?.receipt_number}</strong> for{' '}
              <strong>{formatCurrency(selectedReceipt?.donation_amount || 0)}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
