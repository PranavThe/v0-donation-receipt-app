import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET all users (donors)
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
    let users
    let countResult

    if (search) {
      users = await sql`
        SELECT id, first_name, last_name, email, address, created_at
        FROM users
        WHERE 
          first_name ILIKE ${'%' + search + '%'} OR
          last_name ILIKE ${'%' + search + '%'} OR
          email ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users
        WHERE 
          first_name ILIKE ${'%' + search + '%'} OR
          last_name ILIKE ${'%' + search + '%'} OR
          email ILIKE ${'%' + search + '%'}
      `
    } else {
      users = await sql`
        SELECT id, first_name, last_name, email, address, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*) as total FROM users`
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].total),
        totalPages: Math.ceil(parseInt(countResult[0].total) / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST create new user
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { first_name, last_name, email, address } = body

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO users (first_name, last_name, email, address)
      VALUES (${first_name}, ${last_name}, ${email}, ${address || null})
      RETURNING id, first_name, last_name, email, address, created_at
    `

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
