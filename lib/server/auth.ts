import { cookies } from "next/headers"
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { sign, unsign } from "./crypto"
import { config } from "./env"
import { getUserById, type User } from "./store"

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(pw, salt, 64)
  return `s1$${salt.toString("base64")}$${key.toString("base64")}`
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [v, s, k] = stored.split("$")
  if (v !== "s1" || !s || !k) return false
  const expected = Buffer.from(k, "base64")
  const key = await scrypt(pw, Buffer.from(s, "base64"), expected.length)
  return key.length === expected.length && timingSafeEqual(key, expected)
}

const COOKIE = "session"
const SESSION_MS = 30 * 24 * 3600 * 1000
type SessionPayload = { uid: string; sid: string; exp: number }
export type Auth = { user: User; sid: string }

/** Each login gets its own random session id (sid). It is what the device limit counts. */
export async function startSession(userId: string) {
  const sid = randomBytes(12).toString("base64url")
  const value = sign({ uid: userId, sid, exp: Date.now() + SESSION_MS } satisfies SessionPayload)
  ;(await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
    maxAge: SESSION_MS / 1000,
  })
}

export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function getAuth(): Promise<Auth | null> {
  const p = unsign<SessionPayload>((await cookies()).get(COOKIE)?.value)
  if (!p || p.exp < Date.now()) return null
  const user = await getUserById(p.uid)
  return user ? { user, sid: p.sid } : null
}

export const isActive = (u: User) => !!u.subscription && u.subscription.expiresAt > Date.now()
