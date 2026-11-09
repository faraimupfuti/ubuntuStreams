import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"

export type Subscription = { plan: string; expiresAt: number }
export type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: number
  subscription: Subscription | null
}
type DB = { users: User[] }

// Simple JSON-file store: fine for a single-server launch (hundreds of users).
// Swap this module for Postgres/SQLite when you outgrow it - nothing else touches the file.
const g = globalThis as unknown as { __iptvStore?: { db: DB | null; queue: Promise<unknown> } }
const state = (g.__iptvStore ??= { db: null, queue: Promise.resolve() })

const file = () => path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "users.json")

async function load(): Promise<DB> {
  if (state.db) return state.db
  try {
    state.db = JSON.parse(await fs.readFile(file(), "utf8")) as DB
  } catch (e: any) {
    if (e?.code !== "ENOENT") throw e
    state.db = { users: [] }
  }
  return state.db
}

async function persist(db: DB) {
  const f = file()
  await fs.mkdir(path.dirname(f), { recursive: true })
  const tmp = `${f}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 })
  await fs.rename(tmp, f)
}

// All writes are serialized so concurrent requests can't clobber each other.
function mutate<T>(fn: (db: DB) => T): Promise<T> {
  const run = state.queue.then(async () => {
    const db = await load()
    const result = fn(db)
    await persist(db)
    return result
  })
  state.queue = run.catch(() => {})
  return run
}

export const normalizeEmail = (e: string) => e.trim().toLowerCase()

export async function getUserById(id: string): Promise<User | null> {
  const db = await load()
  return db.users.find((u) => u.id === id) ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await load()
  const e = normalizeEmail(email)
  return db.users.find((u) => u.email === e) ?? null
}

/** Returns null if the email is already registered. */
export function createUser(email: string, passwordHash: string): Promise<User | null> {
  return mutate((db) => {
    const e = normalizeEmail(email)
    if (db.users.some((u) => u.email === e)) return null
    const user: User = { id: randomUUID(), email: e, passwordHash, createdAt: Date.now(), subscription: null }
    db.users.push(user)
    return user
  })
}

export function setSubscription(userId: string, sub: Subscription | null): Promise<User | null> {
  return mutate((db) => {
    const u = db.users.find((x) => x.id === userId)
    if (!u) return null
    u.subscription = sub
    return u
  })
}
