import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET all receipts with user info
export async function GET() {
  try {
    const user = await getSessionUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
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
        u.email
      FROM receipts r
      JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC
    `
    
    return NextResponse.json({ success: true, receipts })
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch receipts' },
      { status: 500 }
    )
  }
}
