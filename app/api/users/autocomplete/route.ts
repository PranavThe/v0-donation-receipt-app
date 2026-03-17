import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const field = searchParams.get("field")
    const query = searchParams.get("q")?.trim()

    if (!field || !query || query.length < 1) {
      return NextResponse.json({ suggestions: [] })
    }

    const q = query + "%"
    let rows

    if (field === "firstName") {
      rows = await sql`
        SELECT DISTINCT ON (first_name) id, first_name, last_name, email, address
        FROM users WHERE first_name ILIKE ${q}
        ORDER BY first_name, id DESC LIMIT 6
      `
    } else if (field === "lastName") {
      rows = await sql`
        SELECT DISTINCT ON (last_name) id, first_name, last_name, email, address
        FROM users WHERE last_name ILIKE ${q}
        ORDER BY last_name, id DESC LIMIT 6
      `
    } else if (field === "email") {
      rows = await sql`
        SELECT DISTINCT ON (email) id, first_name, last_name, email, address
        FROM users WHERE email ILIKE ${q}
        ORDER BY email, id DESC LIMIT 6
      `
    } else if (field === "address") {
      rows = await sql`
        SELECT DISTINCT ON (address) id, first_name, last_name, email, address
        FROM users WHERE address ILIKE ${q}
        ORDER BY address, id DESC LIMIT 6
      `
    } else {
      return NextResponse.json({ suggestions: [] })
    }

    return NextResponse.json({ suggestions: rows })
  } catch (error) {
    console.error("Autocomplete error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}