import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const result = await sql`
      SELECT id, first_name, last_name, email, address, created_at
      FROM users WHERE id = ${parseInt(id)}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { first_name, last_name, email, address } = body

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 })
    }

    const result = await sql`
      UPDATE users
      SET first_name = ${first_name}, last_name = ${last_name}, email = ${email}, address = ${address || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, first_name, last_name, email, address, created_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if user has receipts
    const receipts = await sql`SELECT COUNT(*) as count FROM receipts WHERE user_id = ${parseInt(id)}`
    
    if (parseInt(receipts[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing receipts. Delete their receipts first.' },
        { status: 400 }
      )
    }

    const result = await sql`
      DELETE FROM users WHERE id = ${parseInt(id)}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
