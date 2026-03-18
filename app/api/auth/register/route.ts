import { NextResponse } from 'next/server'
import { createUser, getSessionUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // Only admins can create new users
    const currentUser = await getSessionUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can create new users' },
        { status: 403 }
      )
    }
    
    const { username, password, role } = await request.json()
    
    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Username, password, and role are required' },
        { status: 400 }
      )
    }
    
    if (role !== 'admin' && role !== 'data_entry') {
      return NextResponse.json(
        { success: false, error: 'Role must be either "admin" or "data_entry"' },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    
    const user = await createUser(username, password, role)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
