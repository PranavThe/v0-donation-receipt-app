import { NextResponse } from 'next/server'
import { authenticateUser, createSession, SESSION_COOKIE, SESSION_EXPIRY } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    const user = await authenticateUser(username, password)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }
    
    const sessionToken = await createSession(user)
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
    
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY,
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
