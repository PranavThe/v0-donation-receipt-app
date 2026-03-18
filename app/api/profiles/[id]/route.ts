import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET single profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    
    const profiles = await sql`
      SELECT id, first_name, last_name, email, address, created_at
      FROM users
      WHERE id = ${parseInt(id)}
    `
    
    if (profiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, profile: profiles[0] })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT update profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    const data = await request.json()
    const { firstName, lastName, email, address } = data
    
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }
    
    const result = await sql`
      UPDATE users
      SET first_name = ${firstName.toUpperCase()},
          last_name = ${lastName.toUpperCase()},
          email = ${email},
          address = ${address || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, first_name, last_name, email, address, created_at
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, profile: result[0] })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// DELETE profile
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    
    // Check if profile has receipts
    const receipts = await sql`
      SELECT COUNT(*) as count FROM receipts WHERE user_id = ${parseInt(id)}
    `
    
    if (parseInt(receipts[0].count) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete profile with existing receipts. Delete receipts first.' },
        { status: 400 }
      )
    }
    
    const result = await sql`
      DELETE FROM users
      WHERE id = ${parseInt(id)}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}
