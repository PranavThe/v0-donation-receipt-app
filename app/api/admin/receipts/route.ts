import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET all receipts
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const offset = (page - 1) * limit

  try {
    let receipts
    let countResult

    if (search) {
      receipts = await sql`
        SELECT 
          r.id, r.receipt_number, r.donation_amount, r.donation_date, 
          r.payment_method, r.note, r.created_at, r.user_id,
          u.first_name, u.last_name, u.email
        FROM receipts r
        JOIN users u ON u.id = r.user_id
        WHERE 
          r.receipt_number ILIKE ${'%' + search + '%'} OR
          u.first_name ILIKE ${'%' + search + '%'} OR
          u.last_name ILIKE ${'%' + search + '%'} OR
          u.email ILIKE ${'%' + search + '%'}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM receipts r
        JOIN users u ON u.id = r.user_id
        WHERE 
          r.receipt_number ILIKE ${'%' + search + '%'} OR
          u.first_name ILIKE ${'%' + search + '%'} OR
          u.last_name ILIKE ${'%' + search + '%'} OR
          u.email ILIKE ${'%' + search + '%'}
      `
    } else {
      receipts = await sql`
        SELECT 
          r.id, r.receipt_number, r.donation_amount, r.donation_date, 
          r.payment_method, r.note, r.created_at, r.user_id,
          u.first_name, u.last_name, u.email
        FROM receipts r
        JOIN users u ON u.id = r.user_id
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*) as total FROM receipts`
    }

    return NextResponse.json({
      receipts,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].total),
        totalPages: Math.ceil(parseInt(countResult[0].total) / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch receipts:', error)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}

// POST create new receipt
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { user_id, receipt_number, donation_amount, donation_date, payment_method, note } = body

    if (!user_id || !receipt_number || !donation_amount || !donation_date || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO receipts (user_id, receipt_number, donation_amount, donation_date, payment_method, note)
      VALUES (${user_id}, ${receipt_number}, ${donation_amount}, ${donation_date}, ${payment_method}, ${note || null})
      RETURNING id, receipt_number, donation_amount, donation_date, payment_method, note, created_at, user_id
    `

    return NextResponse.json({ receipt: result[0] })
  } catch (error) {
    console.error('Failed to create receipt:', error)
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
  }
}
