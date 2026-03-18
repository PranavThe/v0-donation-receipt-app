import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET single receipt
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
    
    const receipts = await sql`
      SELECT 
        r.id,
        r.receipt_number,
        r.donation_amount,
        r.donation_date,
        r.payment_method,
        r.note,
        r.created_at,
        r.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.address
      FROM receipts r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = ${parseInt(id)}
    `
    
    if (receipts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, receipt: receipts[0] })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}

// PUT update receipt
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
    const { donationAmount, donationDate, paymentMethod, note } = data
    
    if (!donationAmount || !donationDate || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Donation amount, date, and payment method are required' },
        { status: 400 }
      )
    }
    
    const result = await sql`
      UPDATE receipts
      SET donation_amount = ${donationAmount},
          donation_date = ${donationDate},
          payment_method = ${paymentMethod},
          note = ${note || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, receipt_number, donation_amount, donation_date, payment_method, note, created_at
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, receipt: result[0] })
  } catch (error) {
    console.error('Error updating receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update receipt' },
      { status: 500 }
    )
  }
}

// DELETE receipt
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
    
    const result = await sql`
      DELETE FROM receipts
      WHERE id = ${parseInt(id)}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete receipt' },
      { status: 500 }
    )
  }
}
