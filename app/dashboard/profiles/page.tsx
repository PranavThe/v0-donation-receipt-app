'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { format } from 'date-fns'

interface Profile {
  id: number
  first_name: string
  last_name: string
  email: string
  address: string | null
  created_at: string
}

export default function ProfilesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: ''
  })

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/profiles')
      const data = await response.json()
      if (data.success) {
        setProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const filteredProfiles = profiles.filter(profile => {
    const search = searchTerm.toLowerCase()
    return (
      profile.first_name.toLowerCase().includes(search) ||
      profile.last_name.toLowerCase().includes(search) ||
      profile.email.toLowerCase().includes(search) ||
      (profile.address && profile.address.toLowerCase().includes(search))
    )
  })

  const openCreateDialog = () => {
    setSelectedProfile(null)
    setFormData({ firstName: '', lastName: '', email: '', address: '' })
    setError('')
    setIsEditDialogOpen(true)
  }

  const openEditDialog = (profile: Profile) => {
    setSelectedProfile(profile)
    setFormData({
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      address: profile.address || ''
    })
    setError('')
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (profile: Profile) => {
    setSelectedProfile(profile)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const url = selectedProfile 
        ? `/api/profiles/${selectedProfile.id}` 
        : '/api/profiles'
      
      const response = await fetch(url, {
        method: selectedProfile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setIsEditDialogOpen(false)
        fetchProfiles()
      } else {
        setError(data.error || 'Operation failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProfile) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/profiles/${selectedProfile.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setIsDeleteDialogOpen(false)
        fetchProfiles()
      } else {
        alert(data.error || 'Delete failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="shadow-lg border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Donor Profiles</CardTitle>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="size-4 mr-1" />
            Add Profile
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search profiles..."
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
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No profiles match your search' : 'No profiles yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-mono text-xs">{profile.id}</TableCell>
                    <TableCell className="font-medium">
                      {profile.first_name} {profile.last_name}
                    </TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {profile.address || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(profile)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(profile)}
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

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProfile ? 'Edit Profile' : 'Create Profile'}
            </DialogTitle>
            <DialogDescription>
              {selectedProfile 
                ? 'Update the donor profile information.' 
                : 'Add a new donor profile to the system.'}
            </DialogDescription>
          </DialogHeader>
          
          <FieldGroup className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </Field>
              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </Field>
            <Field>
              <FieldLabel>Address</FieldLabel>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
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
              {isSubmitting ? 'Saving...' : selectedProfile ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the profile for{' '}
              <strong>{selectedProfile?.first_name} {selectedProfile?.last_name}</strong>?
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
