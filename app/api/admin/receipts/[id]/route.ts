import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET single receipt
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
      SELECT 
        r.id, r.receipt_number, r.donation_amount, r.donation_date, 
        r.payment_method, r.note, r.created_at, r.user_id,
        u.first_name, u.last_name, u.email, u.address
      FROM receipts r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = ${parseInt(id)}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json({ receipt: result[0] })
  } catch (error) {
    console.error('Failed to fetch receipt:', error)
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 })
  }
}

// PUT update receipt
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
    const { user_id, receipt_number, donation_amount, donation_date, payment_method, note } = body

    if (!user_id || !receipt_number || !donation_amount || !donation_date || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sql`
      UPDATE receipts
      SET 
        user_id = ${user_id},
        receipt_number = ${receipt_number},
        donation_amount = ${donation_amount},
        donation_date = ${donation_date},
        payment_method = ${payment_method},
        note = ${note || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, receipt_number, donation_amount, donation_date, payment_method, note, created_at, user_id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json({ receipt: result[0] })
  } catch (error) {
    console.error('Failed to update receipt:', error)
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 })
  }
}

// DELETE receipt
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
    const result = await sql`
      DELETE FROM receipts WHERE id = ${parseInt(id)}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete receipt:', error)
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 })
  }
}
