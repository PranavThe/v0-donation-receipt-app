import { NextResponse } from 'next/server'
import { deleteSession, SESSION_COOKIE } from '@/lib/auth'

export async function POST() {
  try {
    await deleteSession()
    
    const response = NextResponse.json({ success: true })
    
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
