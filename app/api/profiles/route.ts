import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET all profiles (users)
export async function GET() {
  try {
    const user = await getSessionUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    const profiles = await sql`
      SELECT id, first_name, last_name, email, address, created_at
      FROM users
      ORDER BY created_at DESC
    `
    
    return NextResponse.json({ success: true, profiles })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

// POST create new profile
export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    const { firstName, lastName, email, address } = data
    
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }
    
    const result = await sql`
      INSERT INTO users (first_name, last_name, email, address)
      VALUES (${firstName.toUpperCase()}, ${lastName.toUpperCase()}, ${email}, ${address || null})
      RETURNING id, first_name, last_name, email, address, created_at
    `
    
    return NextResponse.json({ success: true, profile: result[0] })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create profile. Email may already exist.' },
      { status: 500 }
    )
  }
}
