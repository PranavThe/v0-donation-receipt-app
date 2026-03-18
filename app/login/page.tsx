'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { OrgHeader } from '@/components/org-header'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
    
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <OrgHeader compact />
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </Field>
            </FieldGroup>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
