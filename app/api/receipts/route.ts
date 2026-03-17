import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { firstName, lastName, email, address, donationAmount, donationDate, paymentMethod, note } = data

    // Check if user exists with same email + first_name + last_name
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE email = ${email} 
        AND first_name = ${firstName} 
        AND last_name = ${lastName}
    `

    let userId: number

    if (existingUsers.length > 0) {
      // Reuse existing user
      userId = existingUsers[0].id

      // Update address if provided and different
      if (address) {
        await sql`
          UPDATE users SET address = ${address} WHERE id = ${userId}
        `
      }
    } else {
      // Create new user
      const newUser = await sql`
        INSERT INTO users (first_name, last_name, email, address)
        VALUES (${firstName}, ${lastName}, ${email}, ${address || null})
        RETURNING id
      `
      userId = newUser[0].id
    }

    // Generate unique receipt number: VSP-YYYYMMDD-XXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    // Get count of receipts created today for sequential numbering
    const todayStart = new Date().toISOString().slice(0, 10)
    const todayCount = await sql`
      SELECT COUNT(*) as count FROM receipts 
      WHERE DATE(created_at) = ${todayStart}
    `
    const sequenceNum = String(Number(todayCount[0].count) + 1).padStart(3, '0')
    const receiptNumber = `VSP-${dateStr}-${sequenceNum}`

    // Create receipt
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
      user: {
        id: userId,
        firstName,
        lastName,
        email,
        address,
      },
      donation: {
        amount: donationAmount,
        date: donationDate,
        paymentMethod,
        note,
      },
    })
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create receipt' },
      { status: 500 }
    )
  }
}
