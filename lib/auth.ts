import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export type UserRole = 'admin' | 'data_entry'

export interface AdminUser {
  id: number
  username: string
  role: UserRole
}

const SESSION_COOKIE = 'vsp_session'
const SESSION_EXPIRY = 60 * 60 * 24 * 7 // 7 days in seconds

// Simple session token generation
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(username: string, password: string, role: UserRole): Promise<AdminUser | null> {
  try {
    const passwordHash = await hashPassword(password)
    const result = await sql`
      INSERT INTO admin_users (username, password_hash, role)
      VALUES (${username.toLowerCase()}, ${passwordHash}, ${role})
      RETURNING id, username, role
    `
    return result[0] as AdminUser
  } catch {
    return null
  }
}

export async function authenticateUser(username: string, password: string): Promise<AdminUser | null> {
  const users = await sql`
    SELECT id, username, password_hash, role
    FROM admin_users
    WHERE username = ${username.toLowerCase()}
  `
  
  if (users.length === 0) return null
  
  const user = users[0]
  const isValid = await verifyPassword(password, user.password_hash)
  
  if (!isValid) return null
  
  return {
    id: user.id,
    username: user.username,
    role: user.role as UserRole
  }
}

export async function createSession(user: AdminUser): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY * 1000)
  
  // Store session in database
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES admin_users(id),
      expires_at TIMESTAMP NOT NULL
    )
  `
  
  // Clear old sessions for this user
  await sql`DELETE FROM sessions WHERE user_id = ${user.id}`
  
  // Create new session
  await sql`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (${token}, ${user.id}, ${expiresAt.toISOString()})
  `
  
  return token
}

export async function getSessionUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  
  if (!sessionToken) return null
  
  try {
    const sessions = await sql`
      SELECT s.user_id, s.expires_at, u.username, u.role
      FROM sessions s
      JOIN admin_users u ON u.id = s.user_id
      WHERE s.token = ${sessionToken}
    `
    
    if (sessions.length === 0) return null
    
    const session = sessions[0]
    
    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      await sql`DELETE FROM sessions WHERE token = ${sessionToken}`
      return null
    }
    
    return {
      id: session.user_id,
      username: session.username,
      role: session.role as UserRole
    }
  } catch {
    return null
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  
  if (sessionToken) {
    await sql`DELETE FROM sessions WHERE token = ${sessionToken}`
  }
}

export function setSessionCookie(token: string): void {
  // This will be called from the route handler with the response
}

export { SESSION_COOKIE, SESSION_EXPIRY }
