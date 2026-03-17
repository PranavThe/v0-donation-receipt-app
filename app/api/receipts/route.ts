import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { email, address, donationAmount, donationDate, paymentMethod, note } = data
    const firstName = (data.firstName as string).toUpperCase()
    const lastName = (data.lastName as string).toUpperCase()

    // ── Duplicate check ───────────────────────────────────────────────────────
    // Look for an existing receipt with the same donor + amount + date + method + note.
    // We join users to receipts so we don't need to know the user id upfront.
    const duplicates = await sql`
      SELECT r.receipt_number
      FROM receipts r
      JOIN users u ON u.id = r.user_id
      WHERE u.first_name        = ${firstName}
        AND u.last_name         = ${lastName}
        AND u.email             = ${email}
        AND r.donation_amount   = ${donationAmount}
        AND r.donation_date     = ${donationDate}
        AND r.payment_method    = ${paymentMethod}
        AND COALESCE(r.note, '') = COALESCE(${note || null}, '')
      LIMIT 1
    `

    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `A receipt with these exact details already exists (${duplicates[0].receipt_number}). Please check the donation date, amount, or payment method.`,
          duplicate: true,
        },
        { status: 409 }
      )
    }

    // ── Upsert user ───────────────────────────────────────────────────────────
    const existingUsers = await sql`
      SELECT id FROM users
      WHERE email      = ${email}
        AND first_name = ${firstName}
        AND last_name  = ${lastName}
    `

    let userId: number

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
      if (address) {
        await sql`UPDATE users SET address = ${address} WHERE id = ${userId}`
      }
    } else {
      const newUser = await sql`
        INSERT INTO users (first_name, last_name, email, address)
        VALUES (${firstName}, ${lastName}, ${email}, ${address || null})
        RETURNING id
      `
      userId = newUser[0].id
    }

    // ── Generate receipt number ───────────────────────────────────────────────
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const todayStart = new Date().toISOString().slice(0, 10)

    const todayCount = await sql`
      SELECT COUNT(*) as count FROM receipts
      WHERE DATE(created_at) = ${todayStart}
    `
    const sequenceNum = String(Number(todayCount[0].count) + 1).padStart(3, '0')
    const receiptNumber = `VSP-${dateStr}-${sequenceNum}`

    // ── Insert receipt ────────────────────────────────────────────────────────
    const receipt = await sql`
      INSERT INTO receipts (user_id, receipt_number, donation_amount, donation_date, payment_method, note)
      VALUES (${userId}, ${receiptNumber}, ${donationAmount}, ${donationDate}, ${paymentMethod}, ${note || null})
      RETURNING id, receipt_number, created_at
    `

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt[0].id,
        receiptNumber: receipt[0].receipt_number,
        createdAt: receipt[0].created_at,
      },
      user: { id: userId, firstName, lastName, email, address },
      donation: { amount: donationAmount, date: donationDate, paymentMethod, note },
    })
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create receipt' },
      { status: 500 }
    )
  }
}